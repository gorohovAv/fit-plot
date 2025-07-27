import { create } from "zustand";
import { createSyncMiddleware } from "./syncMiddleware";
import * as dbLayer from "./dbLayer";

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
  initializeFromDB: () => Promise<void>;
};

const syncMiddleware = createSyncMiddleware();

const useCaloriesStore = create<CaloriesState>()(
  syncMiddleware((set, get) => ({
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
    initializeFromDB: async () => {
      try {
        await dbLayer.initDatabase();
        const entries = await dbLayer.getCalorieEntries();
        set({ entries });
      } catch (error) {
        console.error("Ошибка инициализации калорий из БД:", error);
      }
    },
  }))
);

export default useCaloriesStore;
