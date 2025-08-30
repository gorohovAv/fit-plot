import { StateCreator } from "zustand";
import * as dbLayer from "./dbLayer";
import { Plan, Settings, CalorieEntry, StoreState } from "./store";

export interface SyncMiddleware {
  (config: StateCreator<StoreState>): StateCreator<StoreState>;
}

let isInitializing = false;

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

      // НЕ синхронизируем во время инициализации
      if (!isInitializing) {
        syncToDatabase(prevState, fullState);
      }
    };

    return config(syncSet, get, api);
  };
};

// Экспортируем функции для управления флагом
export const setInitializing = (value: boolean) => {
  isInitializing = value;
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

    // Добавляем синхронизацию maintenance calories
    if (newState.maintenanceCalories !== prevState.maintenanceCalories) {
      if (newState.maintenanceCalories !== null) {
        await dbLayer.saveMaintenanceCalories(newState.maintenanceCalories);
      }
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

            console.log(`Синхронизация: Сохранение ${training.results.length} результатов для упражнения ${result.exerciseId} (незапланированные)`);
            await dbLayer.saveResult({
              ...result,
              isPlanned: false,
            });
          }
        }

        if (training.plannedResults && Array.isArray(training.plannedResults)) {
          for (const plannedResult of training.plannedResults) {
            if (!plannedResult || !plannedResult.exerciseId) continue;

            console.log(`Синхронизация: Сохранение ${training.plannedResults.length} результатов для упражнения ${plannedResult.exerciseId} (запланированные)`);
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
    const maintenanceCalories = await dbLayer.getMaintenanceCalories();

    return { plans, settings, calories, maintenanceCalories };
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
      const exerciseIds = exercises.map((e) => e.id);
      const rows = await getResultsForExerciseIds(exerciseIds);

      const results = [];
      const plannedResults = [];
      for (const r of rows) {
        if (r.isPlanned) {
          plannedResults.push({
            exerciseId: r.exerciseId,
            plannedWeight: r.weight,
            plannedReps: r.reps,
            plannedDate: r.date,
            amplitude: r.amplitude,
          });
        } else {
          results.push({
            exerciseId: r.exerciseId,
            weight: r.weight,
            reps: r.reps,
            date: r.date,
            amplitude: r.amplitude,
          });
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
// соберём все exerciseIds по тренировке и вытащим результаты за раз
const getResultsForExerciseIds = async (exerciseIds: string[]) => {
  if (exerciseIds.length === 0) return [];

  const database = await dbLayer.getDatabase();
  const placeholders = exerciseIds.map(() => "?").join(",");

  const rows = await database.getAllAsync(
    `SELECT exerciseId, weight, reps, date, amplitude, isPlanned
     FROM results
     WHERE exerciseId IN (${placeholders})
     ORDER BY date DESC`,
    exerciseIds
  );

  return rows.map((r: any) => ({ ...r, isPlanned: Boolean(r.isPlanned) }));
};
