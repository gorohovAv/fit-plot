import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import useSettingsStore from "@/store/settingsStore";
import { getTranslation } from "@/utils/localization";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const devMode = useSettingsStore((state) => state.devMode);
  const language = useSettingsStore((state) => state.language);

  const getTabTitle = (key: string) => {
    return getTranslation(language, key as any);
  };

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
          title: getTabTitle("home"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="callories"
        options={{
          title: getTabTitle("calories"),
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
          title: getTabTitle("workout"),
        }}
      />
      <Tabs.Screen
        name="storage"
        options={{
          title: getTabTitle("storage"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="plumbing" color={color} />
          ),
          href: devMode ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: getTabTitle("plan"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="assignment" color={color} />
          ),
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: getTabTitle("analytics"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="analytics" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: getTabTitle("settings"),
          tabBarIcon: ({ color }) => (
            <MaterialIcons size={28} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
