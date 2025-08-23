import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Language } from "@/utils/localization";

type Theme = "light" | "dark" | "system";

type SettingsState = {
  theme: Theme;
  weight: number;
  devMode: boolean;
  language: Language;
  setTheme: (theme: Theme) => Promise<void>;
  setWeight: (weight: number) => Promise<void>;
  setDevMode: (devMode: boolean) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
  initializeSettings: () => Promise<void>;
};

const useSettingsStore = create<SettingsState>((set) => ({
  theme: "system",
  weight: 70,
  devMode: false,
  language: "russian",

  initializeSettings: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme");
      const savedWeight = await AsyncStorage.getItem("weight");
      const savedDevMode = await AsyncStorage.getItem("devMode");
      const savedLanguage = await AsyncStorage.getItem("language");

      set({
        theme: (savedTheme as Theme) || "system",
        weight: savedWeight ? parseFloat(savedWeight) : 70,
        devMode: savedDevMode === "true",
        language: (savedLanguage as Language) || "russian",
      });
    } catch (error) {
      console.error("Ошибка загрузки настроек:", error);
    }
  },

  setTheme: async (theme) => {
    try {
      await AsyncStorage.setItem("theme", theme);
      set({ theme });
    } catch (error) {
      console.error("Ошибка сохранения темы:", error);
    }
  },

  setWeight: async (weight) => {
    try {
      await AsyncStorage.setItem("weight", weight.toString());
      set({ weight });
    } catch (error) {
      console.error("Ошибка сохранения веса:", error);
    }
  },

  setDevMode: async (devMode) => {
    try {
      await AsyncStorage.setItem("devMode", devMode.toString());
      set({ devMode });
    } catch (error) {
      console.error("Ошибка сохранения режима разработчика:", error);
    }
  },

  setLanguage: async (language) => {
    try {
      await AsyncStorage.setItem("language", language);
      set({ language });
    } catch (error) {
      console.error("Ошибка сохранения языка:", error);
    }
  },
}));

export default useSettingsStore;
