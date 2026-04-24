import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

type TraceIdProps = {
  value: string;
};

export function TraceId({ value }: TraceIdProps) {
  const [copied, setCopied] = useState(false);

  const handlePress = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Pressable onPress={handlePress} className="active:opacity-60">
      <Text className="font-mono text-xs text-muted">
        {copied ? 'copied!' : value}
      </Text>
    </Pressable>
  );
}
