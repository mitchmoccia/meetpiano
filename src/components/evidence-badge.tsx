import { Badge } from '@/components/ui';

const LABELS: Record<string, string> = {
  explored: 'Explored',
  practiced: 'Practiced',
  independent: 'Independent',
  retained: 'Retained'
};

export function evidenceLabel(state: string | null | undefined): string {
  return state ? (LABELS[state] ?? state) : 'Started';
}

export function EvidenceBadge({ state }: { state: string | null | undefined }) {
  const strong = state === 'independent' || state === 'retained';
  return <Badge variant={strong ? 'success' : state ? 'default' : 'muted'}>{evidenceLabel(state)}</Badge>;
}
