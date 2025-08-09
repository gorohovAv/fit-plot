import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import { Pedometer } from "expo-sensors";
import * as dbLayer from "../store/dbLayer";

const STEP_COUNT_TASK = "STEP_COUNT_TASK";
const STEP_UPDATE_INTERVAL = 5000; // 5 секунд

let lastStepCount = 0;
let isTracking = false;

export const initializeStepTracking = async () => {
  console.log("Отслеживание шагов отключено");
  return false;
};

export const startStepTracking = async () => {
  console.log("Отслеживание шагов отключено");
};

export const stopStepTracking = async () => {
  console.log("Отслеживание шагов отключено");
};

export const getTodaySteps = async (): Promise<number> => {
  return 0;
};

export const getLatestSteps = async (): Promise<number> => {
  return 0;
};

export const calculateCaloriesFromSteps = (steps: number): number => {
  return 0;
};

export const processDailySteps = async () => {
  console.log("Обработка шагов отключена");
};
