import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { Pedometer } from "expo-sensors";
import * as dbLayer from "../store/dbLayer";

const STEP_COUNT_TASK = "STEP_COUNT_TASK";
const STEP_UPDATE_INTERVAL = 5000; // 5 секунд

let lastStepCount = 0;
let isTracking = false;

export const initializeStepTracking = async () => {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      console.log("Педометр недоступен на этом устройстве");
      return false;
    }

    await TaskManager.defineTask(STEP_COUNT_TASK, async () => {
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 1);

        const { steps } = await Pedometer.getStepCountAsync(start, end);

        if (steps !== lastStepCount) {
          lastStepCount = steps;
          await dbLayer.saveStepsFallback(steps);
          console.log(`Сохранено шагов: ${steps}`);
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error("Ошибка в фоновой задаче подсчета шагов:", error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    await BackgroundFetch.registerTaskAsync(STEP_COUNT_TASK, {
      minimumInterval: STEP_UPDATE_INTERVAL / 1000,
      stopOnTerminate: false,
      startOnBoot: true,
    });

    isTracking = true;
    console.log("Отслеживание шагов инициализировано");
    return true;
  } catch (error) {
    console.error("Ошибка инициализации отслеживания шагов:", error);
    return false;
  }
};

export const startStepTracking = async () => {
  if (isTracking) {
    console.log("Отслеживание шагов уже запущено");
    return;
  }

  const success = await initializeStepTracking();
  if (success) {
    console.log("Отслеживание шагов запущено");
  }
};

export const stopStepTracking = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync(STEP_COUNT_TASK);
    isTracking = false;
    console.log("Отслеживание шагов остановлено");
  } catch (error) {
    console.error("Ошибка остановки отслеживания шагов:", error);
  }
};

export const getTodaySteps = async (): Promise<number> => {
  try {
    const today = new Date().toISOString().split("T")[0];
    return await dbLayer.getStepsForDate(today);
  } catch (error) {
    console.error("Ошибка получения шагов за сегодня:", error);
    return 0;
  }
};

export const getLatestSteps = async (): Promise<number> => {
  try {
    return await dbLayer.getLatestStepsFallback();
  } catch (error) {
    console.error("Ошибка получения последних шагов:", error);
    return 0;
  }
};

export const calculateCaloriesFromSteps = (steps: number): number => {
  const averageCaloriesPerStep = 0.04;
  return Math.round(steps * averageCaloriesPerStep);
};

export const processDailySteps = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const steps = await getTodaySteps();

    if (steps > 0) {
      const calories = calculateCaloriesFromSteps(steps);

      const existingEntry = await dbLayer.getCalorieEntries();
      const todayEntry = existingEntry.find((entry) => entry.date === today);

      if (todayEntry) {
        await dbLayer.saveCalorieEntry(today, calories, todayEntry.weight);
      } else {
        await dbLayer.saveCalorieEntry(today, calories, 70); // вес по умолчанию
      }

      console.log(
        `Обработано шагов за ${today}: ${steps}, калории: ${calories}`
      );
    }
  } catch (error) {
    console.error("Ошибка обработки дневных шагов:", error);
  }
};
