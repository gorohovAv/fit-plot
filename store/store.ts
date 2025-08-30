import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import * as dbLayer from "./dbLayer";

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

export type Settings = {
  theme: string;
  weight: number;
  devMode: boolean;
};

export type CalorieEntry = {
  date: string;
  calories: number;
  weight: number;
};

export type StoreState = {
  plans: Plan[];
  settings?: Settings;
  calories?: CalorieEntry[];
};

type State = StoreState & {
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
  initializeFromDB: () => Promise<void>;
};

let storage: MMKV | null = null;
function getStorage() {
  if (!storage) {
    storage = new MMKV();
  }
  return storage;
}

const useStore = create<State>()(
  persist(
    (set, get) => ({
      plans: [],
      addPlan: (newPlan: Plan) =>
        set((state: StoreState) => ({ plans: [...state.plans, newPlan] })),
      addTraining: (planName: string, training: Training) =>
        set((state: StoreState) => ({
          plans: state.plans.map((plan: Plan) =>
            plan.planName === planName
              ? { ...plan, trainings: [...plan.trainings, training] }
              : plan
          ),
        })),
      addExercise: (planName: string, trainingId: string, exercise: Exercise) =>
        set((state: StoreState) => ({
          plans: state.plans.map((plan: Plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training: Training) =>
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
      addResult: (planName: string, trainingId: string, result: Result) =>
        set((state: StoreState) => ({
          plans: state.plans.map((plan: Plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training: Training) =>
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
      addPlannedResult: (
        planName: string,
        trainingId: string,
        plannedResult: PlannedResult
      ) =>
        set((state: StoreState) => ({
          plans: state.plans.map((plan: Plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training: Training) =>
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
      removeTraining: (planName: string, trainingId: string) =>
        set((state: StoreState) => ({
          plans: state.plans.map((plan: Plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.filter(
                    (training: Training) => training.id !== trainingId
                  ),
                }
              : plan
          ),
        })),
      removeExercise: (
        planName: string,
        trainingId: string,
        exerciseId: string
      ) =>
        set((state: StoreState) => ({
          plans: state.plans.map((plan: Plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training: Training) =>
                    training.id === trainingId
                      ? {
                          ...training,
                          exercises: training.exercises.filter(
                            (ex: Exercise) => ex.id !== exerciseId
                          ),
                        }
                      : training
                  ),
                }
              : plan
          ),
        })),
      updateExerciseInStore: (
        planName: string,
        trainingId: string,
        updatedExercise: Exercise
      ) =>
        set((state: StoreState) => ({
          plans: state.plans.map((plan: Plan) =>
            plan.planName === planName
              ? {
                  ...plan,
                  trainings: plan.trainings.map((training: Training) =>
                    training.id === trainingId
                      ? {
                          ...training,
                          exercises: training.exercises.map((ex: Exercise) =>
                            ex.id === updatedExercise.id ? updatedExercise : ex
                          ),
                        }
                      : training
                  ),
                }
              : plan
          ),
        })),
      initializeFromDB: async () => {},
    }),
    {
      name: "fit-plot-store",
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
      partialize: (state) => ({ plans: state.plans }),
    }
  )
);

export default useStore;
