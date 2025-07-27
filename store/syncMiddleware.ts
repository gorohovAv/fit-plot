import { StateCreator } from "zustand";
import * as dbLayer from "./dbLayer";

export interface SyncMiddleware {
  (config: StateCreator<any>): StateCreator<any>;
}

export const createSyncMiddleware = (): SyncMiddleware => {
  return (config) => (set, get, api) => {
    const originalSet = set;

    const syncSet = (partial: any, replace?: boolean) => {
      const prevState = get();
      const newState =
        typeof partial === "function" ? partial(prevState) : partial;
      const fullState = replace ? newState : { ...prevState, ...newState };

      originalSet(partial, replace);

      // Синхронизация с БД
      syncToDatabase(prevState, fullState);
    };

    return config(syncSet, get, api);
  };
};

const syncToDatabase = async (prevState: any, newState: any) => {
  try {
    // Синхронизация планов
    if (newState.plans !== prevState.plans) {
      await syncPlans(newState.plans);
    }

    // Синхронизация настроек
    if (
      newState.theme !== prevState.theme ||
      newState.weight !== prevState.weight ||
      newState.devMode !== prevState.devMode
    ) {
      await syncSettings(newState);
    }

    // Синхронизация калорий
    if (newState.entries !== prevState.entries) {
      await syncCalories(newState.entries);
    }
  } catch (error) {
    console.error("Ошибка синхронизации с БД:", error);
  }
};

const syncPlans = async (plans: any[]) => {
  for (const plan of plans) {
    await dbLayer.savePlan(plan.planName);

    for (const training of plan.trainings) {
      await dbLayer.saveTraining(training.id, plan.planName, training.name);

      for (const exercise of training.exercises) {
        await dbLayer.saveExercise({
          ...exercise,
          trainingId: training.id,
        });
      }

      for (const result of training.results) {
        await dbLayer.saveResult({
          ...result,
          isPlanned: false,
        });
      }

      for (const plannedResult of training.plannedResults) {
        await dbLayer.saveResult({
          exerciseId: plannedResult.exerciseId,
          weight: plannedResult.plannedWeight,
          reps: plannedResult.plannedReps,
          date: plannedResult.plannedDate,
          amplitude: plannedResult.amplitude,
          isPlanned: true,
        });
      }
    }
  }
};

const syncSettings = async (settings: any) => {
  await dbLayer.saveSetting("theme", settings.theme);
  await dbLayer.saveSetting("weight", settings.weight.toString());
  await dbLayer.saveSetting("devMode", settings.devMode.toString());
};

const syncCalories = async (entries: any[]) => {
  for (const entry of entries) {
    await dbLayer.saveCalorieEntry(entry.date, entry.calories, entry.weight);
  }
};

export const loadFromDatabase = async () => {
  try {
    const plans = await loadPlansFromDB();
    const settings = await loadSettingsFromDB();
    const calories = await loadCaloriesFromDB();

    return { plans, settings, calories };
  } catch (error) {
    console.error("Ошибка загрузки из БД:", error);
    return null;
  }
};

const loadPlansFromDB = async () => {
  const planNames = await dbLayer.getAllPlans();
  const plans = [];

  for (const { planName } of planNames) {
    const trainings = await dbLayer.getTrainingsByPlan(planName);
    const planTrainings = [];

    for (const training of trainings) {
      const exercises = await dbLayer.getExercisesByTraining(training.id);
      const results = [];
      const plannedResults = [];

      for (const exercise of exercises) {
        const exerciseResults = await dbLayer.getResultsByExercise(exercise.id);

        for (const result of exerciseResults) {
          if (result.isPlanned) {
            plannedResults.push({
              exerciseId: result.exerciseId,
              plannedWeight: result.weight,
              plannedReps: result.reps,
              plannedDate: result.date,
              amplitude: result.amplitude,
            });
          } else {
            results.push({
              exerciseId: result.exerciseId,
              weight: result.weight,
              reps: result.reps,
              date: result.date,
              amplitude: result.amplitude,
            });
          }
        }
      }

      planTrainings.push({
        id: training.id,
        name: training.name,
        exercises,
        results,
        plannedResults,
      });
    }

    plans.push({
      planName,
      trainings: planTrainings,
    });
  }

  return plans;
};

const loadSettingsFromDB = async () => {
  const settings = await dbLayer.getAllSettings();
  const settingsMap = settings.reduce((acc, { key, value }) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return {
    theme: settingsMap.theme || "system",
    weight: parseFloat(settingsMap.weight) || 70,
    devMode: settingsMap.devMode === "true",
  };
};

const loadCaloriesFromDB = async () => {
  return await dbLayer.getCalorieEntries();
};
