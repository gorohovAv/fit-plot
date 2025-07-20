import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Определение новых типов
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
  exerciseId: string; // Ссылка на упражнение
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
  exercises: Exercise[]; // Массив упражнений
  results: Result[]; // Массив результатов
  plannedResults: PlannedResult[]; // Добавляем поле plannedResults
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
  addPlannedResult: (
    planName: string,
    trainingId: string,
    plannedResult: PlannedResult
  ) => void;
  removeTraining: (planName: string, trainingId: string) => void;
  removeExercise: (
    planName: string,
    trainingId: string,
    exerciseId: string
  ) => void;
  updateExerciseInStore: (
    planName: string,
    trainingId: string,
    updatedExercise: Exercise
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
              exercises: [
                {
                  id: "ex1",
                  name: "Отжимания",
                  muscleGroup: "chest",
                  type: "own weight",
                  unilateral: false,
                  amplitude: "full",
                  comment: "",
                  timerDuration: 60,
                },
                {
                  id: "ex2",
                  name: "Жим гантелей",
                  muscleGroup: "chest",
                  type: "free weight",
                  unilateral: false,
                  amplitude: "full",
                  comment: "",
                  timerDuration: 60,
                },
                {
                  id: "ex3",
                  name: "Подтягивания",
                  muscleGroup: "back",
                  type: "own weight",
                  unilateral: false,
                  amplitude: "full",
                  comment: "",
                  timerDuration: 60,
                },
                {
                  id: "ex4",
                  name: "Приседания",
                  muscleGroup: "quads",
                  type: "own weight",
                  unilateral: false,
                  amplitude: "full",
                  comment: "",
                  timerDuration: 60,
                },
                {
                  id: "ex5",
                  name: "Жим штанги",
                  muscleGroup: "chest",
                  type: "free weight",
                  unilateral: false,
                  amplitude: "full",
                  comment: "",
                  timerDuration: 60,
                },
              ],
              results: [
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 10,
                  date: "2023-01-01",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 10,
                  reps: 8,
                  date: "2023-01-08",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 12,
                  date: "2023-01-15",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 12,
                  reps: 8,
                  date: "2023-01-22",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 15,
                  date: "2023-01-29",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 15,
                  reps: 6,
                  date: "2023-02-05",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 18,
                  date: "2023-02-12",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 15,
                  reps: 8,
                  date: "2023-02-19",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 20,
                  date: "2023-02-26",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 17.5,
                  reps: 8,
                  date: "2023-03-05",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 22,
                  date: "2023-03-12",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 20,
                  reps: 6,
                  date: "2023-03-19",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 25,
                  date: "2023-03-26",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 22.5,
                  reps: 6,
                  date: "2023-04-02",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 30,
                  date: "2023-04-09",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 25,
                  reps: 5,
                  date: "2023-04-16",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 35,
                  date: "2023-04-23",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 27.5,
                  reps: 4,
                  date: "2023-04-30",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  weight: 0,
                  reps: 40,
                  date: "2023-05-07",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex2",
                  weight: 30,
                  reps: 3,
                  date: "2023-05-14",
                  amplitude: "full",
                },
              ],
              plannedResults: [
                {
                  exerciseId: "ex1",
                  plannedWeight: 0,
                  plannedReps: 15,
                  plannedDate: "2023-03-10",
                  amplitude: "full",
                },
                {
                  exerciseId: "ex1",
                  plannedWeight: 0,
                  plannedReps: 18,
                  plannedDate: "2023-03-13",
                  amplitude: "full",
                },
              ],
            },
            {
              id: "2",
              name: "Тренировка низа",
              exercises: [],
              results: [],
              plannedResults: [],
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
      addPlannedResult: (planName, trainingId, plannedResult) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training) =>
                    training.id === trainingId
                      ? {
                          ...training,
                          plannedResults: [
                            ...training.plannedResults,
                            plannedResult,
                          ],
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
      updateExerciseInStore: (planName, trainingId, updatedExercise) =>
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training) =>
                    training.id === trainingId
                      ? {
                          ...training,
                          exercises: training.exercises.map((ex) =>
                            ex.id === updatedExercise.id ? updatedExercise : ex
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
