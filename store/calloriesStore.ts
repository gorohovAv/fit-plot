import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type CalorieEntry = {
  date: string;
  calories: number;
  weight: number;
};

type CaloriesState = {
  entries: CalorieEntry[];
  addEntry: (entry: CalorieEntry) => void;
  updateEntry: (date: string, entry: CalorieEntry) => void;
  deleteEntry: (date: string) => void;
  getEntryByDate: (date: string) => CalorieEntry | undefined;
};

const zustandAsyncStorage: PersistStorage<CaloriesState> = {
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

const useCaloriesStore = create<CaloriesState>()(
  persist(
    (set, get) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [...state.entries, entry],
        })),
      updateEntry: (date, entry) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.date === date ? entry : e)),
        })),
      deleteEntry: (date) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.date !== date),
        })),
      getEntryByDate: (date) =>
        get().entries.find((entry) => entry.date === date),
    }),
    {
      name: "fit-plot-calories",
      storage: zustandAsyncStorage,
    }
  )
);

export default useCaloriesStore;
