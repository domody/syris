import { Text, View } from 'react-native';

type SectionHeaderProps = {
  title: string;
  trailing?: React.ReactNode;
};

export function SectionHeader({ title, trailing }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center gap-3 py-2">
      <Text className="text-xs font-semibold uppercase tracking-widest text-muted">{title}</Text>
      <View className="flex-1 h-px bg-border" />
      {trailing}
    </View>
  );
}
