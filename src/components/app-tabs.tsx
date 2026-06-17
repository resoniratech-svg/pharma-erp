import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.background },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name="house.fill"
              size={22}
              tintColor={color}
              fallback={<ThemedText style={{ color, fontSize: 18 }}>🏠</ThemedText>}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name="paperplane.fill"
              size={22}
              tintColor={color}
              fallback={<ThemedText style={{ color, fontSize: 18 }}>✈️</ThemedText>}
            />
          ),
        }}
      />
    </Tabs>
  );
}
