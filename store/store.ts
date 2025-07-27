import { create } from "zustand";
import { createSyncMiddleware } from "./syncMiddleware";
import * as dbLayer from "./dbLayer";

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
  initializeFromDB: () => Promise<void>;
};

const syncMiddleware = createSyncMiddleware();

const useStore = create<State>()(
  syncMiddleware((set, get) => ({
    plans: [],
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
    initializeFromDB: async () => {
      try {
        await dbLayer.initDatabase();
        const data = await loadFromDatabase();
        if (data) {
          set({ plans: data.plans });
        }
      } catch (error) {
        console.error("Ошибка инициализации из БД:", error);
      }
    },
  }))
);

export default useStore;
