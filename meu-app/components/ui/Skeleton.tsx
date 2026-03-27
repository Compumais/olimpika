import { View, StyleSheet } from 'react-native';

type SkeletonProps = {
  style?: object;
  height?: number;
};

export function Skeleton({ style, height = 48 }: SkeletonProps) {
  return <View style={[styles.skeleton, { height }, style]} />;
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#27272a',
    borderRadius: 12,
  },
});
