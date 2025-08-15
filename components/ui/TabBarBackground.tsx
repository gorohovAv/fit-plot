import { View, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import useSettingsStore from "@/store/settingsStore";
import { useColorScheme as useSystemColorScheme } from "react-native";

export default function TabBarBackground() {
  const systemColorScheme = useSystemColorScheme();
  const theme = useSettingsStore((state) => state.theme);

  const colorScheme = theme === "system" ? systemColorScheme : theme;
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
