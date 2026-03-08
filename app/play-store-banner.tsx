
import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';

// Helper to resolve image sources
function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export default function PlayStoreBanner() {
  const appIcon = require('@/assets/images/app-icon-ohb.png');

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Left section - App icon and title */}
      <View style={styles.leftSection}>
        <Image 
          source={resolveImageSource(appIcon)} 
          style={styles.appIcon}
          resizeMode="contain"
        />
        <View style={styles.titleContainer}>
          <Text style={styles.appName}>Trail Tracker</Text>
          <Text style={styles.tagline}>by HOSAR</Text>
          <Text style={styles.subtitle}>Stay Safe on Every Adventure</Text>
        </View>
      </View>

      {/* Right section - Features */}
      <View style={styles.rightSection}>
        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <View style={styles.iconCircle}>
              <IconSymbol 
                ios_icon_name="location.fill" 
                android_material_icon_name="location-on" 
                size={28} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={styles.featureText}>GPS Tracking</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.iconCircle, styles.iconCircleDanger]}>
              <IconSymbol 
                ios_icon_name="exclamationmark.triangle.fill" 
                android_material_icon_name="warning" 
                size={28} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={styles.featureText}>SOS Alerts</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.iconCircle, styles.iconCircleSecondary]}>
              <IconSymbol 
                ios_icon_name="person.2.fill" 
                android_material_icon_name="group" 
                size={28} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={styles.featureText}>Emergency Contacts</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.iconCircle, styles.iconCircleAccent]}>
              <IconSymbol 
                ios_icon_name="cross.case.fill" 
                android_material_icon_name="local-hospital" 
                size={28} 
                color="#FFFFFF" 
              />
            </View>
            <Text style={styles.featureText}>First Aid Guide</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 1024,
    height: 500,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    opacity: 0.95,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    zIndex: 1,
  },
  appIcon: {
    width: 180,
    height: 180,
    borderRadius: 40,
    marginRight: 30,
    backgroundColor: colors.primary,
  },
  titleContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  rightSection: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 1,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  featureItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 20,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  iconCircleDanger: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
  },
  iconCircleSecondary: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
  },
  iconCircleAccent: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
  },
  featureText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});
