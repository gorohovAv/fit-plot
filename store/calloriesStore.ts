import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import * as dbLayer from "./dbLayer";

type CalorieEntry = {
  date: string;
  calories: number;
  weight: number;
};

type CaloriesState = {
  entries: CalorieEntry[];
  maintenanceCalories: number | null;
  addEntry: (entry: CalorieEntry) => void;
  updateEntry: (date: string, entry: CalorieEntry) => void;
  deleteEntry: (date: string) => void;
  getEntryByDate: (date: string) => CalorieEntry | undefined;
  setMaintenanceCalories: (calories: number) => void;
  initializeFromDB: () => Promise<void>;
};

const storage = new MMKV();

const useCaloriesStore = create<CaloriesState>()(
  persist(
    (set, get) => ({
      entries: [],
      maintenanceCalories: null,
      addEntry: (entry: CalorieEntry) =>
        set((state: CaloriesState) => ({
          entries: [...state.entries, entry],
        })),
      updateEntry: (date: string, entry: CalorieEntry) =>
        set((state: CaloriesState) => ({
          entries: state.entries.map((e: CalorieEntry) =>
            e.date === date ? entry : e
          ),
        })),
      deleteEntry: (date: string) =>
        set((state: CaloriesState) => ({
          entries: state.entries.filter((e: CalorieEntry) => e.date !== date),
        })),
      getEntryByDate: (date: string) =>
        get().entries.find((entry: CalorieEntry) => entry.date === date),
      setMaintenanceCalories: (calories: number) =>
        set({ maintenanceCalories: calories }),
      initializeFromDB: async () => {},
    }),
    {
      name: "fit-plot-calories-store",
      storage: {
        getItem: (name) => {
          const value = storage.getString(name);
          return value ?? null;
        },
        setItem: (name, value) => {
          storage.set(name, value);
        },
        removeItem: (name) => {
          storage.delete(name);
        },
      },
      partialize: (state) => ({
        entries: state.entries,
        maintenanceCalories: state.maintenanceCalories,
      }),
    }
  )
);

export default useCaloriesStore;
