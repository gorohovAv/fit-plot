import create from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Определение типов
type Result = {
  weight: number;
  reps: number;
};

type Training = {
  id: string; // Предполагаем, что id — строка; вы можете изменить на number, если нужно
  name: string;
  exercises: any[]; // Массив упражнений; вы не указали тип, так что используем any[]
  results: Array<{
    exerciseName: string;
    result: Result;
    date: string; // Предполагаем, что date — строка; используйте Date, если нужно
  }>;
};

type Plan = {
  planName: string;
  trainings: Training[];
};

type State = {
  plans: Plan[]; // Массив планов, как указано
  addPlan: (newPlan: Plan) => void; // Пример действия для добавления плана
};

// Создание store с персистентностью
const useStore = create(
  persist(
    (set) => ({
      plans: [], // Начальное состояние: пустой массив
      addPlan: (newPlan: Plan) =>
        set((state) => ({ plans: [...state.plans, newPlan] })),
    }),
    {
      name: "fit-plot-storage", // Ключ для хранения в Async Storage
      storage: AsyncStorage, // Используем Async Storage для персистентности
    }
  )
);

export default useStore;
