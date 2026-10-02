import { z } from 'zod';

export const AVATARS = ['sun', 'berry', 'ember', 'sky', 'leaf', 'plum'] as const;
export type Avatar = (typeof AVATARS)[number];

export const AVATAR_LABELS: Record<Avatar, string> = {
  sun: 'Sun',
  berry: 'Berry',
  ember: 'Ember',
  sky: 'Sky',
  leaf: 'Leaf',
  plum: 'Plum'
};

export const MAX_CHILDREN = 6;
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NICKNAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '.-]{0,23}$/u;

export const nicknameSchema = z
  .string()
  .transform((value) => value.normalize('NFC').trim().replace(/\s+/g, ' '))
  .pipe(
    z
      .string()
      .min(1, 'Add a nickname.')
      .max(24, 'Keep the nickname to 24 characters or fewer.')
      .regex(NICKNAME_PATTERN, 'Use letters, numbers, spaces, apostrophes, periods, or hyphens.')
  );

export const childInputSchema = z.object({
  nickname: nicknameSchema,
  avatar: z.enum(AVATARS).nullable()
});

export type ChildInput = z.infer<typeof childInputSchema>;

export function isAvatar(value: unknown): value is Avatar {
  return typeof value === 'string' && (AVATARS as readonly string[]).includes(value);
}
