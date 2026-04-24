import { Pressable, View } from 'react-native';

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
};

export function Card({ children, onPress, className = '' }: CardProps) {
  const base = `bg-surface rounded-xl p-4 ${className}`;
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-70`}>
        {children}
      </Pressable>
    );
  }
  return <View className={base}>{children}</View>;
}
