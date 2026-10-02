'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from '@/db/client';
import { findOwnedChild } from '@/features/family/service';
import { readParentSession } from '@/lib/auth/session';
import { isSecureContext } from '@/lib/env';
import { formText } from '@/lib/forms';
import { LEARNER_COOKIE, LEARNER_COOKIE_MAX_AGE } from './cookie';

const LESSON_PATH = /^\/learn\/(\?lesson=L\d{2}(&check=review)?)?$/;

/** Starts practice as one learner. The child must belong to the signed-in parent; the cookie only names the choice. */
export async function chooseLearner(formData: FormData): Promise<void> {
  const session = await readParentSession();
  if (!session) redirect('/signin?next=%2Fplay');
  const child = await findOwnedChild(getDb(), session.userId, formText(formData, 'childId'));
  if (!child) redirect('/play?reason=choose');
  const next = formText(formData, 'next');
  (await cookies()).set(LEARNER_COOKIE, child.id, {
    path: '/',
    sameSite: 'lax',
    secure: isSecureContext(),
    httpOnly: false,
    maxAge: LEARNER_COOKIE_MAX_AGE
  });
  redirect(LESSON_PATH.test(next) ? next : '/learn/');
}

export async function playAsGuest(): Promise<void> {
  (await cookies()).set(LEARNER_COOKIE, '', { path: '/', sameSite: 'lax', secure: isSecureContext(), maxAge: 0 });
  redirect('/learn/');
}
