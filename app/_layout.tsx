import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/useColorScheme";
import useStore from "@/store/store";
import useCaloriesStore from "@/store/calloriesStore";
import useSettingsStore from "@/store/settingsStore";
import { logAllTables } from "@/store/dbLayer";
import * as stepService from "@/services/stepService";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const initializeFromDB = useStore((state) => state.initializeFromDB);
  const initializeCaloriesFromDB = useCaloriesStore(
    (state) => state.initializeFromDB
  );
  const initializeSettingsFromDB = useSettingsStore(
    (state) => state.initializeFromDB
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeFromDB();
        await initializeCaloriesFromDB();
        await initializeSettingsFromDB();
        await logAllTables();

        await stepService.initializeStepTracking();
      } catch (error) {
        console.error("Ошибка инициализации приложения:", error);
      }
    };

    if (loaded) {
      initializeApp();
    }
  }, [
    loaded,
    initializeFromDB,
    initializeCaloriesFromDB,
    initializeSettingsFromDB,
  ]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
