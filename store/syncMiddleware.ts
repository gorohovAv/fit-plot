import { StateCreator } from "zustand";
import * as dbLayer from "./dbLayer";
import { CalorieEntry, Plan, Settings, StoreState } from "./store";

export interface SyncMiddleware {
  (config: StateCreator<StoreState>): StateCreator<StoreState>;
}

let isInitializing = false;
let lastSyncedState: StoreState | null = null;

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

      if (!isInitializing) {
        syncToDatabase(prevState, fullState);
      }
    };

    return config(syncSet, get, api);
  };
};

export const setInitializing = (value: boolean) => {
  isInitializing = value;
  if (value) {
    lastSyncedState = null;
  }
};

const syncToDatabase = async (prevState: StoreState, newState: StoreState) => {
  try {
    if (!prevState || !newState) {
      console.warn("syncToDatabase: prevState или newState undefined");
      return;
    }

    if (newState.plans && hasPlansChanged(prevState.plans, newState.plans)) {
      await syncPlansChanges(prevState.plans || [], newState.plans);
      lastSyncedState = JSON.parse(JSON.stringify(newState)); // Глубокая копия
    }

    if (
      newState.settings &&
      (newState.settings.theme !== prevState.settings?.theme ||
        newState.settings.weight !== prevState.settings?.weight ||
        newState.settings.devMode !== prevState.settings?.devMode ||
        newState.settings.visibleMetrics !== prevState.settings?.visibleMetrics)
    ) {
      await syncSettings(newState.settings);
    }

    if (newState.calories && newState.calories !== prevState.calories) {
      await syncCalories(newState.calories);
    }

    if (newState.maintenanceCalories !== prevState.maintenanceCalories) {
      if (newState.maintenanceCalories !== null) {
        await dbLayer.saveMaintenanceCalories(newState.maintenanceCalories);
      }
    }
  } catch (error) {
    console.error("Ошибка синхронизации с БД:", error);
  }
};

const hasPlansChanged = (
  prevPlans: Plan[] = [],
  newPlans: Plan[] = []
): boolean => {
  if (prevPlans.length !== newPlans.length) return true;

  for (let i = 0; i < newPlans.length; i++) {
    const prevPlan = prevPlans[i];
    const newPlan = newPlans[i];

    if (!prevPlan || prevPlan.planName !== newPlan.planName) return true;
    if (prevPlan.trainings.length !== newPlan.trainings.length) return true;

    for (let j = 0; j < newPlan.trainings.length; j++) {
      const prevTraining = prevPlan.trainings[j];
      const newTraining = newPlan.trainings[j];

      if (!prevTraining || prevTraining.id !== newTraining.id) return true;
      if (prevTraining.exercises.length !== newTraining.exercises.length)
        return true;
      if (prevTraining.results.length !== newTraining.results.length)
        return true;
      if (
        prevTraining.plannedResults.length !== newTraining.plannedResults.length
      )
        return true;
    }
  }

  return false;
};

const syncPlansChanges = async (prevPlans: Plan[], newPlans: Plan[]) => {
  if (!newPlans || !Array.isArray(newPlans)) {
    console.warn("syncPlansChanges: newPlans не является массивом");
    return;
  }

  for (const plan of newPlans) {
    if (!plan || !plan.planName) continue;

    const prevPlan = prevPlans.find((p) => p.planName === plan.planName);
    const isNewPlan = !prevPlan;

    if (isNewPlan) {
      console.log(`Синхронизация: Добавление нового плана ${plan.planName}`);
    }

    await dbLayer.savePlan(plan.planName);

    if (plan.trainings && Array.isArray(plan.trainings)) {
      for (const training of plan.trainings) {
        if (!training || !training.id || !training.name) continue;

        const prevTraining = prevPlan?.trainings.find(
          (t) => t.id === training.id
        );
        const isNewTraining = !prevTraining;

        if (isNewTraining) {
          console.log(
            `Синхронизация: Добавление новой тренировки ${training.name} в план ${plan.planName}`
          );
        }

        await dbLayer.saveTraining(training.id, plan.planName, training.name);

        if (training.exercises && Array.isArray(training.exercises)) {
          for (const exercise of training.exercises) {
            if (!exercise || !exercise.id) continue;

            const prevExercise = prevTraining?.exercises.find(
              (e) => e.id === exercise.id
            );
            const isNewExercise = !prevExercise;

            if (isNewExercise) {
              console.log(
                `Синхронизация: Добавление нового упражнения ${exercise.name}`
              );
            }

            await dbLayer.saveExercise({
              ...exercise,
              trainingId: training.id,
            });
          }
        }

        if (training.results && Array.isArray(training.results)) {
          const prevResults = prevTraining?.results || [];
          const newResults = training.results.filter((result) => {
            return !prevResults.some(
              (prevResult) =>
                prevResult.exerciseId === result.exerciseId &&
                prevResult.weight === result.weight &&
                prevResult.reps === result.reps &&
                prevResult.date === result.date &&
                prevResult.amplitude === result.amplitude
            );
          });

          if (newResults.length > 0) {
            console.log(
              `Синхронизация: Добавление ${newResults.length} новых результатов для тренировки ${training.name}`
            );
            for (const result of newResults) {
              if (!result || !result.exerciseId) continue;
              await dbLayer.saveResult({
                ...result,
                isPlanned: false,
              });
            }
          }
        }

        if (training.plannedResults && Array.isArray(training.plannedResults)) {
          const prevPlannedResults = prevTraining?.plannedResults || [];
          const newPlannedResults = training.plannedResults.filter(
            (plannedResult) => {
              return !prevPlannedResults.some(
                (prevPlanned) =>
                  prevPlanned.exerciseId === plannedResult.exerciseId &&
                  prevPlanned.plannedWeight === plannedResult.plannedWeight &&
                  prevPlanned.plannedReps === plannedResult.plannedReps &&
                  prevPlanned.plannedDate === plannedResult.plannedDate &&
                  prevPlanned.amplitude === plannedResult.amplitude
              );
            }
          );

          if (newPlannedResults.length > 0) {
            console.log(
              `Синхронизация: Добавление ${newPlannedResults.length} новых плановых результатов для тренировки ${training.name}`
            );
            for (const plannedResult of newPlannedResults) {
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
  }
};

const syncSettings = async (settings: Settings) => {
  if (!settings) return;
  await dbLayer.saveSetting("theme", settings.theme ?? "system");
  await dbLayer.saveSetting("weight", (settings.weight ?? 70).toString());
  await dbLayer.saveSetting("devMode", (settings.devMode ?? false).toString());
  if (settings.visibleMetrics) {
    await dbLayer.saveSetting("visibleMetrics", JSON.stringify(settings.visibleMetrics));
  }
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

  let visibleMetrics = {
    tonnage: true,
    maxWeight: true,
    maxReps: true,
    avgWeight: true,
    minWeight: true,
    workoutTime: true,
  };

  if (settingsMap.visibleMetrics) {
    try {
      visibleMetrics = JSON.parse(settingsMap.visibleMetrics);
    } catch (e) {
      console.error("Ошибка парсинга visibleMetrics:", e);
    }
  }

  return {
    theme: settingsMap.theme || "system",
    weight: parseFloat(settingsMap.weight) || 70,
    devMode: settingsMap.devMode === "true",
    visibleMetrics,
  };
};

const loadCaloriesFromDB = async () => {
  return await dbLayer.getCalorieEntries();
};

const getResultsForExerciseIds = async (exerciseIds: string[]) => {
  if (exerciseIds.length === 0) return [];

  return await dbLayer.getResultsForExerciseIds(exerciseIds);
};
