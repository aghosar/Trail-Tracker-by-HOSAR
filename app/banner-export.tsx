
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Stack } from 'expo-router';
import PlayStoreBanner from './play-store-banner';
import { colors } from '@/styles/commonStyles';

export default function BannerExportScreen() {
  const instructions = Platform.OS === 'web' 
    ? 'Right-click on the banner below and select "Save image as..." or take a screenshot.'
    : 'Take a screenshot of the banner below to use it for your Google Play listing.';

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Play Store Banner',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }} 
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Google Play Store Banner</Text>
          <Text style={styles.subtitle}>1024 x 500 pixels</Text>
          <Text style={styles.instructions}>{instructions}</Text>
        </View>

        <View style={styles.bannerContainer}>
          <PlayStoreBanner />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Usage Instructions:</Text>
          <Text style={styles.infoText}>1. Screenshot or save the banner above</Text>
          <Text style={styles.infoText}>2. Go to Google Play Console</Text>
          <Text style={styles.infoText}>3. Navigate to Store presence → Main store listing</Text>
          <Text style={styles.infoText}>4. Upload under "Feature graphic" (1024 x 500)</Text>
          <Text style={styles.infoText}>5. This banner will appear at the top of your Play Store listing</Text>
        </View>

        <View style={styles.specsSection}>
          <Text style={styles.specsTitle}>Banner Specifications:</Text>
          <Text style={styles.specsText}>• Dimensions: 1024 x 500 pixels</Text>
          <Text style={styles.specsText}>• Format: PNG or JPEG</Text>
          <Text style={styles.specsText}>• Max file size: 1MB</Text>
          <Text style={styles.specsText}>• Required for Google Play Store listing</Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bannerContainer: {
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  infoSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 600,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 24,
  },
  specsSection: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 600,
    marginBottom: 40,
  },
  specsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  specsText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 24,
  },
});
