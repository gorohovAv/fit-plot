import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Theme = "light" | "dark" | "system";

type SettingsState = {
  theme: Theme;
  weight: number;
  devMode: boolean;
  setTheme: (theme: Theme) => void;
  setWeight: (weight: number) => void;
  setDevMode: (devMode: boolean) => void;
};

const zustandAsyncStorage: PersistStorage<SettingsState> = {
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      weight: 70,
      devMode: false,
      setTheme: (theme) => set({ theme }),
      setWeight: (weight) => set({ weight }),
      setDevMode: (devMode) => set({ devMode }),
    }),
    {
      name: "fit-plot-settings",
      storage: zustandAsyncStorage,
    }
  )
);

export default useSettingsStore;
