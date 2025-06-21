import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Определение типов
type Result = {
  weight: number;
  reps: number;
};

type Training = {
  id: string; // Предполагаем, что id — строка; вы можете изменить на number, если нужно
  name: string;
  exercises: any[]; // Массив упражнений; вы не указали тип, так что используем any[]
  results: Array<{
    exerciseName: string;
    result: Result;
    date: string; // Предполагаем, что date — строка; используйте Date, если нужно
  }>;
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
  addExercise: (planName: string, trainingId: string, exercise: any) => void;
  addResult: (
    planName: string,
    trainingId: string,
    exerciseName: string,
    result: Result
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
      addResult: (planName, trainingId, exerciseName, result) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training) =>
                    training.id === trainingId
                      ? {
                          ...training,
                          results: [
                            ...training.results,
                            {
                              exerciseName,
                              result,
                              date: new Date().toISOString(),
                            },
                          ],
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
