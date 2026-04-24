import { Text, View } from 'react-native';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantClasses: Record<BadgeVariant, { container: string; label: string }> = {
  success: {
    container: 'bg-green-100 dark:bg-green-900/30',
    label: 'text-green-700 dark:text-green-400',
  },
  warning: {
    container: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'text-yellow-700 dark:text-yellow-400',
  },
  error: {
    container: 'bg-red-100 dark:bg-red-900/30',
    label: 'text-red-700 dark:text-red-400',
  },
  info: {
    container: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'text-blue-700 dark:text-blue-400',
  },
  neutral: {
    container: 'bg-zinc-200 dark:bg-zinc-700',
    label: 'text-zinc-700 dark:text-zinc-300',
  },
};

type BadgeProps = {
  label: string;
  variant: BadgeVariant;
};

export function Badge({ label, variant }: BadgeProps) {
  const { container, label: labelClass } = variantClasses[variant];
  return (
    <View className={`px-2 py-0.5 rounded-full ${container}`}>
      <Text className={`text-xs font-medium ${labelClass}`}>{label}</Text>
    </View>
  );
}
