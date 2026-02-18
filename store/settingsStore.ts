import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const PERSIST_KEY = "settingsStore";

const defaultState: Omit<SettingsState, keyof FunctionProperties<SettingsState>> = {
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
};

type FunctionProperties<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

const loadPersistedSettings = async (): Promise<Partial<SettingsState> | null> => {
  try {
    const stored = await AsyncStorage.getItem(PERSIST_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return {
      theme: parsed.theme ?? defaultState.theme,
      weight: parsed.weight ?? defaultState.weight,
      devMode: parsed.devMode ?? defaultState.devMode,
      language: parsed.language ?? defaultState.language,
      maxMicrohistorySize: parsed.maxMicrohistorySize ?? defaultState.maxMicrohistorySize,
      visibleMetrics: parsed.visibleMetrics ?? defaultState.visibleMetrics,
    };
  } catch (error) {
    console.error("Ошибка загрузки настроек из AsyncStorage:", error);
    return null;
  }
};

const savePersistedSettings = async (state: Partial<SettingsState>) => {
  try {
    const current = useSettingsStore.getState();
    const toSave = {
      theme: current.theme,
      weight: current.weight,
      devMode: current.devMode,
      language: current.language,
      maxMicrohistorySize: current.maxMicrohistorySize,
      visibleMetrics: current.visibleMetrics,
      ...state,
    };
    await AsyncStorage.setItem(PERSIST_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error("Ошибка сохранения настроек в AsyncStorage:", error);
  }
};

const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...defaultState,
  setTheme: (theme: Theme) => {
    set({ theme });
    savePersistedSettings({ theme });
  },
  setWeight: (weight: number) => {
    set({ weight });
    savePersistedSettings({ weight });
  },
  setDevMode: (devMode: boolean) => {
    set({ devMode });
    savePersistedSettings({ devMode });
  },
  setLanguage: (language: Language) => {
    set({ language });
    savePersistedSettings({ language });
  },
  setMaxMicrohistorySize: (size: number) => {
    set({ maxMicrohistorySize: size });
    savePersistedSettings({ maxMicrohistorySize: size });
  },
  setVisibleMetrics: (visibleMetrics: VisibleMetrics) => {
    set({ visibleMetrics });
    savePersistedSettings({ visibleMetrics });
  },
  initializeFromDB: async () => {
    // Настройки хранятся в AsyncStorage, инициализация не требуется
  },
}));

export const hydrateSettingsStore = async () => {
  const persisted = await loadPersistedSettings();
  if (persisted) {
    useSettingsStore.setState(persisted);
  }
};

export default useSettingsStore;
