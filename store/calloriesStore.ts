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
