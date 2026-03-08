
import { colors } from '@/styles/commonStyles';
import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';

const styles = StyleSheet.create({
  container: {
    width: 1024,
    height: 500,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: 1024,
    height: 500,
    resizeMode: 'cover',
  },
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function PlayStoreBanner() {
  const bannerSource = require('@/assets/images/2294dd15-8580-4406-a017-b9d29fe0876f.png');
  
  return (
    <View style={styles.container}>
      <Image 
        source={resolveImageSource(bannerSource)} 
        style={styles.bannerImage}
      />
    </View>
  );
}
