import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import { Language } from "@/utils/localization";

type Theme = "light" | "dark" | "system";

type SettingsState = {
  theme: Theme;
  weight: number;
  devMode: boolean;
  language: Language;
  setTheme: (theme: Theme) => void;
  setWeight: (weight: number) => void;
  setDevMode: (devMode: boolean) => void;
  setLanguage: (language: Language) => void;
  initializeFromDB: () => Promise<void>;
};

let storage: MMKV | null = null;
function getStorage() {
  if (!storage) {
    storage = new MMKV();
  }
  return storage;
}

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "system",
      weight: 70,
      devMode: false,
      language: "russian",
      setTheme: (theme: Theme) => set({ theme }),
      setWeight: (weight: number) => set({ weight }),
      setDevMode: (devMode: boolean) => set({ devMode }),
      setLanguage: (language: Language) => set({ language }),
      initializeFromDB: async () => {},
    }),
    {
      name: "fit-plot-settings-store",
      storage: {
        getItem: (name) => {
          const value = getStorage().getString(name);
          return value ?? null;
        },
        setItem: (name, value) => {
          getStorage().set(name, value);
        },
        removeItem: (name) => {
          getStorage().delete(name);
        },
      },
      partialize: (state) => ({
        theme: state.theme,
        weight: state.weight,
        devMode: state.devMode,
        language: state.language,
      }),
    }
  )
);

export default useSettingsStore;
