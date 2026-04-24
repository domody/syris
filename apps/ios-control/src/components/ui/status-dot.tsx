import { View } from 'react-native';

import type { BadgeVariant } from './badge';

const dotClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500 dark:bg-green-400',
  warning: 'bg-yellow-500 dark:bg-yellow-400',
  error: 'bg-red-500 dark:bg-red-400',
  info: 'bg-blue-500 dark:bg-blue-400',
  neutral: 'bg-zinc-400 dark:bg-zinc-500',
};

type StatusDotProps = {
  variant: BadgeVariant;
};

export function StatusDot({ variant }: StatusDotProps) {
  return <View className={`w-2 h-2 rounded-full ${dotClasses[variant]}`} />;
}
