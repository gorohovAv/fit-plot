import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import useSettingsStore from "@/store/settingsStore";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const devMode = useSettingsStore((state) => state.devMode);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="callories"
        options={{
          title: "Калории",
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              size={28}
              name="local-fire-department"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          href: null,
          title: "Workout",
        }}
      />
      <Tabs.Screen
        name="storage"
        options={{
          title: "Storage",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="plumbing" color={color} />
          ),
          href: devMode ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="plan" color={color} />
          ),
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: "Analytics",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="analytics" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
