import { create } from "zustand";
import { createSyncMiddleware } from "./syncMiddleware";
import * as dbLayer from "./dbLayer";

type Theme = "light" | "dark" | "system";

type SettingsState = {
  theme: Theme;
  weight: number;
  devMode: boolean;
  setTheme: (theme: Theme) => void;
  setWeight: (weight: number) => void;
  setDevMode: (devMode: boolean) => void;
  initializeFromDB: () => Promise<void>;
};

const syncMiddleware = createSyncMiddleware();

const useSettingsStore = create<SettingsState>()(
  syncMiddleware((set) => ({
    theme: "system",
    weight: 70,
    devMode: false,
    setTheme: (theme) => set({ theme }),
    setWeight: (weight) => set({ weight }),
    setDevMode: (devMode) => set({ devMode }),
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
  };
};

export default useSettingsStore;
