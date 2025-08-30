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
  maintenanceCalories: number | null;
  addEntry: (entry: CalorieEntry) => void;
  updateEntry: (date: string, entry: CalorieEntry) => void;
  deleteEntry: (date: string) => void;
  getEntryByDate: (date: string) => CalorieEntry | undefined;
  setMaintenanceCalories: (calories: number) => void;
  initializeFromDB: () => Promise<void>;
};

const syncMiddleware = createSyncMiddleware();

const useCaloriesStore = create<CaloriesState>()(
  syncMiddleware((set, get) => ({
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
    initializeFromDB: async () => {
      try {
        await dbLayer.initDatabase();
        const entries = await dbLayer.getCalorieEntries();
        const maintenanceCalories = await dbLayer.getMaintenanceCalories();
        set({ entries, maintenanceCalories });
      } catch (error) {
        console.error("Ошибка инициализации калорий из БД:", error);
      }
    },
  }))
);

export default useCaloriesStore;
