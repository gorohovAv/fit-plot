import { create } from "zustand";
import { createSyncMiddleware } from "./syncMiddleware";
import * as dbLayer from "./dbLayer";
import { Language } from "@/utils/localization";

type Theme = "light" | "dark" | "system";

type VisibleMetrics = {
  tonnage: boolean;
  maxWeight: boolean;
  maxReps: boolean;
  avgWeight: boolean;
  minWeight: boolean;
  workoutTime: boolean;
};

type SettingsState = {
  theme: Theme;
  weight: number;
  devMode: boolean;
  language: Language;
  maxMicrohistorySize: number;
  visibleMetrics: VisibleMetrics;
  setTheme: (theme: Theme) => void;
  setWeight: (weight: number) => void;
  setDevMode: (devMode: boolean) => void;
  setLanguage: (language: Language) => void;
  setMaxMicrohistorySize: (size: number) => void;
  setVisibleMetrics: (visibleMetrics: VisibleMetrics) => void;
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
    visibleMetrics: {
      tonnage: true,
      maxWeight: true,
      maxReps: true,
      avgWeight: true,
      minWeight: true,
      workoutTime: true,
    },
    setTheme: (theme: Theme) => set({ theme }),
    setWeight: (weight: number) => set({ weight }),
    setDevMode: (devMode: boolean) => set({ devMode }),
    setLanguage: (language: Language) => set({ language }),
    setMaxMicrohistorySize: (size: number) => set({ maxMicrohistorySize: size }),
    setVisibleMetrics: (visibleMetrics: VisibleMetrics) => set({ visibleMetrics }),
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

  let visibleMetrics: VisibleMetrics = {
    tonnage: true,
    maxWeight: true,
    maxReps: true,
    avgWeight: true,
    minWeight: true,
    workoutTime: true,
  };

  if (settingsMap.visibleMetrics) {
    try {
      visibleMetrics = JSON.parse(settingsMap.visibleMetrics);
    } catch (e) {
      console.error("Ошибка парсинга visibleMetrics:", e);
    }
  }

  return {
    theme: (settingsMap.theme as Theme) || "system",
    weight: parseFloat(settingsMap.weight) || 70,
    devMode: settingsMap.devMode === "true",
    language: (settingsMap.language as Language) || "russian",
    maxMicrohistorySize: parseInt(settingsMap.maxMicrohistorySize) || 5,
    visibleMetrics,
  };
};

export default useSettingsStore;
