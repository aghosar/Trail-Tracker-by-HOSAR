
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Label>Tracker</Label>
        <Icon sf={{ default: 'location', selected: 'location.fill' }} drawable="location-on" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="first-aid">
        <Label>First Aid</Label>
        <Icon sf={{ default: 'cross.case', selected: 'cross.case.fill' }} drawable="medical-services" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} drawable="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
