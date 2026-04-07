import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.game.accentPrimary,
        tabBarInactiveTintColor: Colors.game.subtitleText,
        tabBarStyle: {
          backgroundColor: Colors.game.pageBackground,
          borderTopColor: Colors.game.borderColor,
          borderTopWidth: 1,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Solo',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gamecontroller.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="lobby"
        options={{
          title: 'Multiplayer',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          href: null, // Versteckt den Tab
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Versteckt den Tab
        }}
      />
    </Tabs>
  );
}
