'use server';

import { revalidatePath } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { LEARNER_COOKIE } from '@/features/learner/cookie';
import { getAuth } from '@/lib/auth/server';
import { readParentSession, verifyParentPassword, type ParentSession } from '@/lib/auth/session';
import { isSecureContext } from '@/lib/env';
import { formText, TOO_MANY_ATTEMPTS, type FormState } from '@/lib/forms';
import { log } from '@/lib/log';
import { consumeRateLimit, RATE_RULES, RateLimitedError } from '@/lib/security';
import { createChild, deleteChild, updateChild } from './service';
import { childInputSchema } from './validation';

async function parentOrSignIn(returnPath: string): Promise<ParentSession> {
  const session = await readParentSession();
  if (!session) redirect(`/signin?next=${encodeURIComponent(returnPath)}`);
  return session;
}

function parseChild(formData: FormData) {
  return childInputSchema.safeParse({ nickname: formText(formData, 'nickname'), avatar: formText(formData, 'avatar') || null });
}

async function allowChildWrite(userId: string): Promise<boolean> {
  return consumeRateLimit(`child-write:${userId}`, RATE_RULES.childWrite);
}

async function passwordProblem(userId: string, password: string): Promise<string | null> {
  try {
    return (await verifyParentPassword(userId, password)) ? null : 'That password is not right.';
  } catch (error) {
    if (error instanceof RateLimitedError) return TOO_MANY_ATTEMPTS;
    throw error;
  }
}

async function forgetLearnerCookie(childId?: string): Promise<void> {
  const jar = await cookies();
  if (childId && jar.get(LEARNER_COOKIE)?.value !== childId.toLowerCase()) return;
  jar.set(LEARNER_COOKIE, '', { path: '/', sameSite: 'lax', secure: isSecureContext(), maxAge: 0 });
}

export async function createChildAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await parentOrSignIn('/family');
  const parsed = parseChild(formData);
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Check the nickname.' };
  if (!(await allowChildWrite(session.userId))) return { status: 'error', message: TOO_MANY_ATTEMPTS };
  const result = await createChild(getDb(), session.userId, parsed.data);
  if (!result.ok) return { status: 'error', message: result.error };
  revalidatePath('/family', 'layout');
  const welcome = formText(formData, 'flow') === 'welcome';
  redirect(welcome ? `/family/welcome?child=${result.child.id}` : `/family/children/${result.child.id}?created=1`);
}

export async function updateChildAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await parentOrSignIn('/family');
  const parsed = parseChild(formData);
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Check the nickname.' };
  if (!(await allowChildWrite(session.userId))) return { status: 'error', message: TOO_MANY_ATTEMPTS };
  const result = await updateChild(getDb(), session.userId, formText(formData, 'childId'), parsed.data);
  if (!result.ok) return { status: 'error', message: result.error };
  revalidatePath('/family', 'layout');
  return { status: 'ok', message: 'Saved.' };
}

/** Needs the account password again, then removes the learner and every attempt and progress row for them. */
export async function deleteChildAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await parentOrSignIn('/family');
  const childId = formText(formData, 'childId');
  if (formText(formData, 'confirm') !== 'yes') return { status: 'error', message: 'Tick the box to confirm.' };
  const problem = await passwordProblem(session.userId, formText(formData, 'password'));
  if (problem) return { status: 'error', message: problem };
  if (!(await deleteChild(getDb(), session.userId, childId))) return { status: 'error', message: 'That learner was not found.' };
  await forgetLearnerCookie(childId);
  log.info('family.child_deleted', { userId: session.userId, childId });
  revalidatePath('/family', 'layout');
  return { status: 'ok' };
}

/** Needs the account password again, then deletes the account; the family, learners, and progress go with it. */
export async function deleteAccountAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await parentOrSignIn('/family/account');
  if (formText(formData, 'confirmText').trim().toUpperCase() !== 'DELETE') {
    return { status: 'error', message: 'Type DELETE to confirm.' };
  }
  const password = formText(formData, 'password');
  const problem = await passwordProblem(session.userId, password);
  if (problem) return { status: 'error', message: problem };
  await getAuth().api.deleteUser({ body: { password }, headers: await headers() });
  await forgetLearnerCookie();
  log.info('family.account_deleted', { userId: session.userId });
  return { status: 'ok', userId: session.userId };
}
