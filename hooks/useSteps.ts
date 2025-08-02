import { useState, useEffect } from "react";
import * as stepService from "../services/stepService";

export const useSteps = () => {
  const [todaySteps, setTodaySteps] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const initializeSteps = async () => {
      try {
        const available = await stepService.initializeStepTracking();
        setIsAvailable(available);
        setIsTracking(available);

        if (available) {
          const steps = await stepService.getTodaySteps();
          setTodaySteps(steps);
        }
      } catch (error) {
        console.error("Ошибка инициализации шагов:", error);
      }
    };

    initializeSteps();
  }, []);

  const refreshSteps = async () => {
    try {
      const steps = await stepService.getTodaySteps();
      setTodaySteps(steps);
    } catch (error) {
      console.error("Ошибка обновления шагов:", error);
    }
  };

  const startTracking = async () => {
    try {
      await stepService.startStepTracking();
      setIsTracking(true);
    } catch (error) {
      console.error("Ошибка запуска отслеживания:", error);
    }
  };

  const stopTracking = async () => {
    try {
      await stepService.stopStepTracking();
      setIsTracking(false);
    } catch (error) {
      console.error("Ошибка остановки отслеживания:", error);
    }
  };

  return {
    todaySteps,
    isTracking,
    isAvailable,
    refreshSteps,
    startTracking,
    stopTracking,
  };
};
