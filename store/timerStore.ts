import { create } from "zustand";

interface TimerState {
  exerciseId: string;
  duration: number;
  elapsed: number;
}

interface TimerStore {
  timers: TimerState[];
  startTimer: (exerciseId: string, duration: number) => void;
  stopTimer: (exerciseId: string) => void;
  updateTimer: (exerciseId: string, elapsed: number) => void;
  getTimer: (exerciseId: string) => TimerState | undefined;
  isTimerRunning: (exerciseId: string) => boolean;
}

const useTimerStore = create<TimerStore>((set, get) => ({
  timers: [],

  startTimer: (exerciseId: string, duration: number) => {
    set((state) => {
      const existingIndex = state.timers.findIndex(
        (timer) => timer.exerciseId === exerciseId
      );

      const newTimer: TimerState = {
        exerciseId,
        duration,
        elapsed: 0,
      };

      if (existingIndex >= 0) {
        const newTimers = [...state.timers];
        newTimers[existingIndex] = newTimer;
        return { timers: newTimers };
      } else {
        return { timers: [...state.timers, newTimer] };
      }
    });
  },

  stopTimer: (exerciseId: string) => {
    set((state) => ({
      timers: state.timers.filter((timer) => timer.exerciseId !== exerciseId),
    }));
  },

  updateTimer: (exerciseId: string, elapsed: number) => {
    set((state) => {
      const timerIndex = state.timers.findIndex(
        (timer) => timer.exerciseId === exerciseId
      );

      if (timerIndex >= 0) {
        const newTimers = [...state.timers];
        newTimers[timerIndex] = {
          ...newTimers[timerIndex],
          elapsed,
        };
        return { timers: newTimers };
      }

      return state;
    });
  },

  getTimer: (exerciseId: string) => {
    return get().timers.find((timer) => timer.exerciseId === exerciseId);
  },

  isTimerRunning: (exerciseId: string) => {
    return get().timers.some((timer) => timer.exerciseId === exerciseId);
  },
}));

export default useTimerStore;
