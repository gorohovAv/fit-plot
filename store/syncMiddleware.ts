import { StateCreator } from "zustand";
import * as dbLayer from "./dbLayer";
import { Plan, Settings, CalorieEntry, StoreState } from "./store";

export interface SyncMiddleware {
  (config: StateCreator<StoreState>): StateCreator<StoreState>;
}

export const createSyncMiddleware = (): SyncMiddleware => {
  return (config) => (set, get, api) => {
    const originalSet = set;

    const syncSet = (
      partial:
        | Partial<StoreState>
        | ((state: StoreState) => Partial<StoreState>),
      replace?: boolean
    ) => {
      const prevState = get();
      const newState =
        typeof partial === "function" ? partial(prevState) : partial;
      const fullState = replace ? newState : { ...prevState, ...newState };

      originalSet(partial, replace);

      syncToDatabase(prevState, fullState);
    };

    return config(syncSet, get, api);
  };
};

const syncToDatabase = async (prevState: StoreState, newState: StoreState) => {
  try {
    if (!prevState || !newState) {
      console.warn("syncToDatabase: prevState или newState undefined");
      return;
    }

    if (newState.plans && newState.plans !== prevState.plans) {
      await syncPlans(newState.plans);
    }

    if (
      newState.settings &&
      (newState.settings.theme !== prevState.settings?.theme ||
        newState.settings.weight !== prevState.settings?.weight ||
        newState.settings.devMode !== prevState.settings?.devMode)
    ) {
      await syncSettings(newState.settings);
    }

    if (newState.calories && newState.calories !== prevState.calories) {
      await syncCalories(newState.calories);
    }
  } catch (error) {
    console.error("Ошибка синхронизации с БД:", error);
  }
};

const syncPlans = async (plans: Plan[]) => {
  if (!plans || !Array.isArray(plans)) {
    console.warn("syncPlans: plans не является массивом");
    return;
  }

  for (const plan of plans) {
    if (!plan || !plan.planName) continue;

    await dbLayer.savePlan(plan.planName);

    if (plan.trainings && Array.isArray(plan.trainings)) {
      for (const training of plan.trainings) {
        if (!training || !training.id || !training.name) continue;

        await dbLayer.saveTraining(training.id, plan.planName, training.name);

        if (training.exercises && Array.isArray(training.exercises)) {
          for (const exercise of training.exercises) {
            if (!exercise || !exercise.id) continue;

            await dbLayer.saveExercise({
              ...exercise,
              trainingId: training.id,
            });
          }
        }

        if (training.results && Array.isArray(training.results)) {
          for (const result of training.results) {
            if (!result || !result.exerciseId) continue;

            await dbLayer.saveResult({
              ...result,
              isPlanned: false,
            });
          }
        }

        if (training.plannedResults && Array.isArray(training.plannedResults)) {
          for (const plannedResult of training.plannedResults) {
            if (!plannedResult || !plannedResult.exerciseId) continue;

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
    }
  }
};

const syncSettings = async (settings: Settings) => {
  if (!settings) return;
  await dbLayer.saveSetting("theme", settings.theme ?? "system");
  await dbLayer.saveSetting("weight", (settings.weight ?? 70).toString());
  await dbLayer.saveSetting("devMode", (settings.devMode ?? false).toString());
};

const syncCalories = async (entries: CalorieEntry[]) => {
  if (!entries || !Array.isArray(entries)) return;
  for (const entry of entries) {
    if (!entry || !entry.date) continue;
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
