import { create } from "zustand";
import { createSyncMiddleware } from "./syncMiddleware";
import * as dbLayer from "./dbLayer";
import { Language } from "@/utils/localization";

type Theme = "light" | "dark" | "system";

type SettingsState = {
  theme: Theme;
  weight: number;
  devMode: boolean;
  language: Language;
  maxMicrohistorySize: number;
  setTheme: (theme: Theme) => void;
  setWeight: (weight: number) => void;
  setDevMode: (devMode: boolean) => void;
  setLanguage: (language: Language) => void;
  setMaxMicrohistorySize: (size: number) => void;
  initializeFromDB: () => Promise<void>;
};

const syncMiddleware = createSyncMiddleware();

const useSettingsStore = create<SettingsState>()(
  syncMiddleware((set) => ({
    theme: "system",
    weight: 70,
    devMode: false,
    language: "russian",
    maxMicrohistorySize: 5,
    setTheme: (theme: Theme) => set({ theme }),
    setWeight: (weight: number) => set({ weight }),
    setDevMode: (devMode: boolean) => set({ devMode }),
    setLanguage: (language: Language) => set({ language }),
    setMaxMicrohistorySize: (size: number) => set({ maxMicrohistorySize: size }),
    initializeFromDB: async () => {
      try {
        await dbLayer.initDatabase();
        const settings = await loadSettingsFromDB();
        set(settings);
      } catch (error) {
        console.error("Ошибка инициализации настроек из БД:", error);
      }
    },
  }))
);

const loadSettingsFromDB = async () => {
  const settings = await dbLayer.getAllSettings();
  const settingsMap = settings.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    theme: (settingsMap.theme as Theme) || "system",
    weight: parseFloat(settingsMap.weight) || 70,
    devMode: settingsMap.devMode === "true",
    language: (settingsMap.language as Language) || "russian",
    maxMicrohistorySize: parseInt(settingsMap.maxMicrohistorySize) || 5,
  };
};

export default useSettingsStore;
