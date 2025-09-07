import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import useCaloriesStore from "@/store/calloriesStore";
import useSettingsStore from "@/store/settingsStore";
import useStore from "@/store/store";
import { setInitializing } from "@/store/syncMiddleware";

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
        setInitializing(true);

        await initializeFromDB();
        await initializeCaloriesFromDB();
        await initializeSettingsFromDB();

        setInitializing(false);
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
