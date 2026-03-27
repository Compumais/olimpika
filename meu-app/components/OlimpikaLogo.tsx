import { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

type OlimpikaLogoProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'inline' | 'full';
  showText?: boolean;
};

const sizeMap = { sm: 80, md: 120, lg: 160, xl: 200, full: 180 };

export default function OlimpikaLogo({
  size = 'md',
  variant = 'inline',
  showText = true,
}: OlimpikaLogoProps) {
  const [imgError, setImgError] = useState(false);
  const isFull = variant === 'full';
  const imgHeight = isFull ? sizeMap.full : sizeMap[size];
  const textSizeMap: Record<string, number> = { sm: 18, md: 20, lg: 24, xl: 30, full: 24 };

  if (!imgError) {
    return (
      <View style={[styles.container, isFull && styles.containerFull]}>
        <Image
          source={require('@/assets/images/olimpika-logo.png')}
          style={[styles.logoImg, { height: imgHeight }]}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
        {!isFull && showText && (
          <Text style={[styles.fallbackText, { fontSize: textSizeMap[size] }]}>
            Olimpika Fitness
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, isFull && styles.containerFull]}>
      <View style={[styles.fallbackIcon, isFull && styles.fallbackIconFull]}>
        <Text style={styles.fallbackLetter}>O</Text>
      </View>
      {(showText || isFull) && (
        <Text style={[styles.fallbackText, { fontSize: textSizeMap[isFull ? 'full' : size] }]}>
          Olimpika Fitness
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  containerFull: {
    width: '100%',
  },
  logoImg: {
    width: 'auto',
    maxWidth: '100%',
  },
  fallbackIcon: {
    height: 40,
    width: 40,
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIconFull: {
    height: 96,
    width: 96,
  },
  fallbackLetter: {
    color: '#eab308',
    fontWeight: 'bold',
    fontSize: 16,
  },
  fallbackText: {
    color: '#eab308',
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
});
