
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();

  const handleDonatePress = async () => {
    console.log('[ProfileScreen] Opening HOSAR donation page');
    const hosarUrl = 'https://hosar.org/#';
    
    try {
      const canOpen = await Linking.canOpenURL(hosarUrl);
      if (canOpen) {
        await Linking.openURL(hosarUrl);
        console.log('[ProfileScreen] HOSAR donation page opened successfully');
      } else {
        console.log('[ProfileScreen] Cannot open HOSAR URL');
      }
    } catch (error) {
      console.error('[ProfileScreen] Error opening HOSAR donation page:', error);
    }
  };

  const handleAboutPress = async () => {
    console.log('[ProfileScreen] Opening HOSAR about page');
    const hosarUrl = 'https://hosar.org/';
    
    try {
      const canOpen = await Linking.canOpenURL(hosarUrl);
      if (canOpen) {
        await Linking.openURL(hosarUrl);
        console.log('[ProfileScreen] HOSAR about page opened successfully');
      } else {
        console.log('[ProfileScreen] Cannot open HOSAR URL');
      }
    } catch (error) {
      console.error('[ProfileScreen] Error opening HOSAR about page:', error);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.header}>
            <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="account-circle" size={80} color={colors.primary} />
            <Text style={styles.title}>Trail Tracker</Text>
            <Text style={styles.subtitle}>Safety First</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>
              Trail Tracker helps keep you safe during outdoor activities by sharing your location with emergency contacts.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support HOSAR</Text>
            <Text style={styles.description}>
              This app supports the High Desert Off-Road Search and Rescue (HOSAR) organization.
            </Text>
            
            <TouchableOpacity
              style={styles.button}
              onPress={handleDonatePress}
            >
              <IconSymbol ios_icon_name="heart.fill" android_material_icon_name="favorite" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Donate to HOSAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleAboutPress}
            >
              <IconSymbol ios_icon_name="info.circle" android_material_icon_name="info" size={20} color={colors.primary} />
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Learn More</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featureRow}>
              <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={20} color={colors.primary} />
              <Text style={styles.featureText}>Real-time GPS tracking</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol ios_icon_name="message.fill" android_material_icon_name="message" size={20} color={colors.primary} />
              <Text style={styles.featureText}>SMS emergency alerts</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={20} color={colors.primary} />
              <Text style={styles.featureText}>SOS emergency button</Text>
            </View>
            <View style={styles.featureRow}>
              <IconSymbol ios_icon_name="cross.case.fill" android_material_icon_name="medical-services" size={20} color={colors.primary} />
              <Text style={styles.featureText}>First aid reference</Text>
            </View>
          </View>

          <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: colors.primary,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
  },
  version: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
});
