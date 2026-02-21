
import React from 'react';
import { Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

const { width: screenWidth } = Dimensions.get('window');

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'location-on',
      label: 'Tracker',
    },
    {
      name: 'first-aid',
      route: '/(tabs)/first-aid',
      icon: 'medical-services',
      label: 'First Aid',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="first-aid" name="first-aid" />
      </Stack>
      <FloatingTabBar tabs={tabs} containerWidth={screenWidth / 2} />
    </>
  );
}
