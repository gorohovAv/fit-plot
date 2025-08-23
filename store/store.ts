import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type MuscleGroup =
  | "chest"
  | "triceps"
  | "biceps"
  | "forearms"
  | "delts"
  | "back"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves";

export type ExerciseType = "machine" | "free weight" | "own weight" | "cables";

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  unilateral: boolean;
  amplitude: "full" | "partial";
  comment?: string;
  timerDuration?: number;
};

export type Result = {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  amplitude: "full" | "partial";
};

export type PlannedResult = {
  exerciseId: string;
  plannedWeight: number;
  plannedReps: number;
  plannedDate: string;
  amplitude: "full" | "partial";
};

export type Training = {
  id: string;
  name: string;
  exercises: Exercise[];
  results: Result[];
  plannedResults: PlannedResult[];
};

export type Plan = {
  planName: string;
  trainings: Training[];
};

export type CalorieEntry = {
  date: string;
  calories: number;
  weight: number;
};

type SettingsState = {
  theme: "light" | "dark" | "system";
  language: "ru" | "en";
  initializeSettings: () => Promise<void>;
  setTheme: (theme: "light" | "dark" | "system") => Promise<void>;
  setLanguage: (language: "ru" | "en") => Promise<void>;
};

const useStore = create<SettingsState>((set, get) => ({
  theme: "system",
  language: "ru",

  initializeSettings: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme");
      const savedLanguage = await AsyncStorage.getItem("language");

      set({
        theme: (savedTheme as "light" | "dark" | "system") || "system",
        language: (savedLanguage as "ru" | "en") || "ru",
      });
    } catch (error) {
      console.error("Ошибка загрузки настроек:", error);
    }
  },

  setTheme: async (theme) => {
    try {
      await AsyncStorage.setItem("theme", theme);
      set({ theme });
    } catch (error) {
      console.error("Ошибка сохранения темы:", error);
    }
  },

  setLanguage: async (language) => {
    try {
      await AsyncStorage.setItem("language", language);
      set({ language });
    } catch (error) {
      console.error("Ошибка сохранения языка:", error);
    }
  },
}));

export default useStore;
