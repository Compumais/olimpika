import { Pressable, Text, StyleSheet } from 'react-native';

type ButtonProps = {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'ghost' | 'destructive';
  className?: string;
  style?: object | object[];
};

export function Button({
  onPress,
  disabled,
  children,
  variant = 'default',
  style,
}: ButtonProps) {
  const isGhost = variant === 'ghost';
  const isDestructive = variant === 'destructive';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        isGhost && styles.ghost,
        isDestructive && styles.destructive,
        !isGhost && !isDestructive && styles.default,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style as object,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  default: {
    backgroundColor: '#eab308',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultText: {
    color: '#000',
  },
  ghostText: {
    color: '#eab308',
  },
  destructiveText: {
    color: '#fff',
  },
});
