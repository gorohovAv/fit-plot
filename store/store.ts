import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Определение новых типов
type MuscleGroup =
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
type ExerciseType = "machine" | "free weight" | "own weight" | "cables";
type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  unilateral: boolean;
  amplitude: "full" | "partial";
};

type Result = {
  exerciseId: string; // Ссылка на упражнение
  weight: number;
  reps: number;
  date: string;
  amplitude: "full" | "partial";
};

type Training = {
  id: string;
  name: string;
  exercises: Exercise[]; // Массив упражнений
  results: Result[]; // Массив результатов
};

// Добавим экспорт типа Plan
export type Plan = {
  planName: string;
  trainings: Training[];
};

type State = {
  plans: Plan[];
  addPlan: (newPlan: Plan) => void;
  addTraining: (planName: string, training: Training) => void;
  addExercise: (
    planName: string,
    trainingId: string,
    exercise: Exercise
  ) => void;
  addResult: (planName: string, trainingId: string, result: Result) => void;
  removeTraining: (planName: string, trainingId: string) => void;
  removeExercise: (
    planName: string,
    trainingId: string,
    exerciseId: string
  ) => void;
};

// Адаптер для zustand persist с AsyncStorage
const zustandAsyncStorage: PersistStorage<State> = {
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

// Создание store с персистентностью
const useStore = create<State>()(
  persist(
    (set) => ({
      plans: [
        {
          planName: "Сплит (верх/низ)",
          trainings: [
            {
              id: "1",
              name: "Тренировка верха",
              exercises: [],
              results: [],
            },
            {
              id: "2",
              name: "Тренировка низа",
              exercises: [],
              results: [],
            },
          ],
        },
      ],
      addPlan: (newPlan: Plan) =>
        set((state) => ({ plans: [...state.plans, newPlan] })),
      addTraining: (planName, training) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.planName === planName
              ? { ...plan, trainings: [...plan.trainings, training] }
              : plan
          ),
        })),
      addExercise: (planName, trainingId, exercise) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training) =>
                    training.id === trainingId
                      ? {
                          ...training,
                          exercises: [...training.exercises, exercise],
                        }
                      : training
                  ),
                }
              : plan
          ),
        })),
      addResult: (planName, trainingId, result) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training) =>
                    training.id === trainingId
                      ? {
                          ...training,
                          results: [...training.results, result],
                        }
                      : training
                  ),
                }
              : plan
          ),
        })),
      removeTraining: (planName, trainingId) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.filter(
                    (training) => training.id !== trainingId
                  ),
                }
              : plan
          ),
        })),
      removeExercise: (planName, trainingId, exerciseId) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training) =>
                    training.id === trainingId
                      ? {
                          ...training,
                          exercises: training.exercises.filter(
                            (ex) => ex.id !== exerciseId
                          ),
                        }
                      : training
                  ),
                }
              : plan
          ),
        })),
    }),
    {
      name: "fit-plot-storage",
      storage: zustandAsyncStorage,
    }
  )
);

export default useStore;
