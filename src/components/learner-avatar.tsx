import type { Avatar } from '@/features/family/validation';
import { cn } from '@/lib/utils';

const AVATAR_COLORS: Record<Avatar | 'none', string> = {
  sun: 'bg-secondary',
  berry: 'bg-accent',
  ember: 'bg-[#f4a48a]',
  sky: 'bg-[#a9d6f0]',
  leaf: 'bg-[#b9dcb0]',
  plum: 'bg-[#d8c2e8]',
  none: 'bg-muted'
};

type LearnerAvatarProps = { nickname: string; avatar: Avatar | null; size?: 'md' | 'lg' };

export function LearnerAvatar({ nickname, avatar, size = 'md' }: LearnerAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary font-display font-extrabold',
        size === 'lg' ? 'size-16 text-2xl' : 'size-11 text-lg',
        AVATAR_COLORS[avatar ?? 'none']
      )}
    >
      {nickname.slice(0, 1).toUpperCase()}
    </span>
  );
}
