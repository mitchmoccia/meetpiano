'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getDb } from '@/db/client';
import { LESSON_ID_PATTERN } from '@/features/progress/attempt-details';
import { formText } from '@/lib/forms';
import { log } from '@/lib/log';
import { consumeRateLimit, RATE_RULES } from '@/lib/security';
import { moveLesson, setLessonStatus } from './curriculum';
import { requireAdmin } from './guard';

const lessonId = z.string().regex(LESSON_ID_PATTERN);

const statusSchema = z.strictObject({
  lessonId,
  status: z.enum(['available', 'paused']),
  note: z
    .string()
    .trim()
    .max(200)
    .transform((value) => value || null)
});

const moveSchema = z.strictObject({ lessonId, direction: z.enum(['up', 'down']) });

function backToCurriculum(params: Record<string, string>): never {
  redirect(`/admin/curriculum?${new URLSearchParams(params)}${params.lesson ? `#lesson-${params.lesson}` : ''}`);
}

/** Every admin write: a server-side admin check, then a per-admin rate limit. */
async function adminWriter() {
  const admin = await requireAdmin();
  if (!(await consumeRateLimit(`admin-write:${admin.userId}`, RATE_RULES.adminWrite))) backToCurriculum({ error: 'rate-limited' });
  return admin;
}

export async function setLessonStatusAction(formData: FormData): Promise<void> {
  const admin = await adminWriter();
  const parsed = statusSchema.safeParse({ lessonId: formText(formData, 'lessonId'), status: formText(formData, 'status'), note: formText(formData, 'note') });
  if (!parsed.success) backToCurriculum({ error: 'invalid' });
  const { data } = parsed;
  const result = await setLessonStatus(getDb(), admin, data.lessonId, data.status, data.note);
  if (!result.ok) backToCurriculum({ error: result.error });
  if (result.changed) log.info('admin.lesson_status_changed', { userId: admin.userId, lessonId: data.lessonId, status: data.status });
  backToCurriculum({ lesson: data.lessonId, done: result.changed ? 'status' : 'unchanged' });
}

export async function moveLessonAction(formData: FormData): Promise<void> {
  const admin = await adminWriter();
  const parsed = moveSchema.safeParse({ lessonId: formText(formData, 'lessonId'), direction: formText(formData, 'direction') });
  if (!parsed.success) backToCurriculum({ error: 'invalid' });
  const { data } = parsed;
  const result = await moveLesson(getDb(), admin, data.lessonId, data.direction);
  if (!result.ok) backToCurriculum({ error: result.error });
  if (result.changed) log.info('admin.lesson_moved', { userId: admin.userId, lessonId: data.lessonId, direction: data.direction });
  backToCurriculum({ lesson: data.lessonId, done: result.changed ? 'moved' : 'unchanged' });
}
