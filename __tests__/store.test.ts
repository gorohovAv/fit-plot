import { create } from "zustand";
import useStore from "../store/store";
import * as dbLayer from "../store/dbLayer";

jest.mock("../store/dbLayer", () => ({
  initDatabase: jest.fn(),
  getAllPlans: jest.fn(),
  getTrainingsByPlan: jest.fn(),
  getExercisesByTraining: jest.fn(),
  getResultsByExercise: jest.fn(),
  getAllSettings: jest.fn(),
  getCalorieEntries: jest.fn(),
}));

jest.mock("../store/syncMiddleware", () => ({
  createSyncMiddleware: jest.fn(() => (config: any) => config),
  loadFromDatabase: jest.fn(),
}));

describe("store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe("addPlan", () => {
    it("должен добавлять новый план", () => {
      console.log("🧪 Тест: добавление нового плана");

      const store = useStore.getState();
      const newPlan = {
        planName: "Test Plan",
        trainings: [],
      };

      store.addPlan(newPlan);

      expect(store.plans).toHaveLength(1);
      expect(store.plans[0]).toEqual(newPlan);
    });

    it("должен обрабатывать дублирующиеся планы", () => {
      console.log("�� Тест: обработка дублирующихся планов");

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [],
      };

      store.addPlan(plan);
      store.addPlan(plan);

      expect(store.plans).toHaveLength(2);
      expect(store.plans).toEqual([plan, plan]);
    });
  });

  describe("addTraining", () => {
    it("должен добавлять тренировку к существующему плану", () => {
      console.log("🧪 Тест: добавление тренировки к плану");

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [],
      };
      const training = {
        id: "training1",
        name: "Training 1",
        exercises: [],
        results: [],
        plannedResults: [],
      };

      store.addPlan(plan);
      store.addTraining("Test Plan", training);

      expect(store.plans[0].trainings).toHaveLength(1);
      expect(store.plans[0].trainings[0]).toEqual(training);
    });

    it("должен игнорировать добавление к несуществующему плану", () => {
      console.log("🧪 Тест: игнорирование добавления к несуществующему плану");

      const store = useStore.getState();
      const training = {
        id: "training1",
        name: "Training 1",
        exercises: [],
        results: [],
        plannedResults: [],
      };

      store.addTraining("Non-existent Plan", training);

      expect(store.plans).toHaveLength(0);
    });
  });

  describe("addExercise", () => {
    it("должен добавлять упражнение к тренировке", () => {
      console.log("🧪 Тест: добавление упражнения к тренировке");

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [
          {
            id: "training1",
            name: "Training 1",
            exercises: [],
            results: [],
            plannedResults: [],
          },
        ],
      };
      const exercise = {
        id: "exercise1",
        name: "Exercise 1",
        muscleGroup: "chest" as const,
        type: "free weight" as const,
        unilateral: false,
        amplitude: "full" as const,
      };

      store.addPlan(plan);
      store.addExercise("Test Plan", "training1", exercise);

      expect(store.plans[0].trainings[0].exercises).toHaveLength(1);
      expect(store.plans[0].trainings[0].exercises[0]).toEqual(exercise);
    });

    it("должен игнорировать добавление к несуществующей тренировке", () => {
      console.log(
        "🧪 Тест: игнорирование добавления к несуществующей тренировке"
      );

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [],
      };
      const exercise = {
        id: "exercise1",
        name: "Exercise 1",
        muscleGroup: "chest" as const,
        type: "free weight" as const,
        unilateral: false,
        amplitude: "full" as const,
      };

      store.addPlan(plan);
      store.addExercise("Test Plan", "non-existent", exercise);

      expect(store.plans[0].trainings).toHaveLength(0);
    });
  });

  describe("addResult", () => {
    it("должен добавлять результат к тренировке", () => {
      console.log("🧪 Тест: добавление результата к тренировке");

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [
          {
            id: "training1",
            name: "Training 1",
            exercises: [],
            results: [],
            plannedResults: [],
          },
        ],
      };
      const result = {
        exerciseId: "exercise1",
        weight: 100,
        reps: 10,
        date: "2024-01-01",
        amplitude: "full" as const,
      };

      store.addPlan(plan);
      store.addResult("Test Plan", "training1", result);

      expect(store.plans[0].trainings[0].results).toHaveLength(1);
      expect(store.plans[0].trainings[0].results[0]).toEqual(result);
    });
  });

  describe("addPlannedResult", () => {
    it("должен добавлять запланированный результат", () => {
      console.log("🧪 Тест: добавление запланированного результата");

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [
          {
            id: "training1",
            name: "Training 1",
            exercises: [],
            results: [],
            plannedResults: [],
          },
        ],
      };
      const plannedResult = {
        exerciseId: "exercise1",
        plannedWeight: 110,
        plannedReps: 8,
        plannedDate: "2024-01-02",
        amplitude: "full" as const,
      };

      store.addPlan(plan);
      store.addPlannedResult("Test Plan", "training1", plannedResult);

      expect(store.plans[0].trainings[0].plannedResults).toHaveLength(1);
      expect(store.plans[0].trainings[0].plannedResults[0]).toEqual(
        plannedResult
      );
    });
  });

  describe("removeTraining", () => {
    it("должен удалять тренировку", () => {
      console.log("🧪 Тест: удаление тренировки");

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [
          {
            id: "training1",
            name: "Training 1",
            exercises: [],
            results: [],
            plannedResults: [],
          },
        ],
      };

      store.addPlan(plan);
      store.removeTraining("Test Plan", "training1");

      expect(store.plans[0].trainings).toHaveLength(0);
    });
  });

  describe("removeExercise", () => {
    it("должен удалять упражнение", () => {
      console.log("🧪 Тест: удаление упражнения");

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [
          {
            id: "training1",
            name: "Training 1",
            exercises: [
              {
                id: "exercise1",
                name: "Exercise 1",
                muscleGroup: "chest" as const,
                type: "free weight" as const,
                unilateral: false,
                amplitude: "full" as const,
              },
            ],
            results: [],
            plannedResults: [],
          },
        ],
      };

      store.addPlan(plan);
      store.removeExercise("Test Plan", "training1", "exercise1");

      expect(store.plans[0].trainings[0].exercises).toHaveLength(0);
    });
  });

  describe("updateExerciseInStore", () => {
    it("должен обновлять упражнение", () => {
      console.log("🧪 Тест: обновление упражнения");

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [
          {
            id: "training1",
            name: "Training 1",
            exercises: [
              {
                id: "exercise1",
                name: "Exercise 1",
                muscleGroup: "chest" as const,
                type: "free weight" as const,
                unilateral: false,
                amplitude: "full" as const,
              },
            ],
            results: [],
            plannedResults: [],
          },
        ],
      };
      const updatedExercise = {
        id: "exercise1",
        name: "Updated Exercise",
        muscleGroup: "back" as const,
        type: "machine" as const,
        unilateral: true,
        amplitude: "partial" as const,
      };

      store.addPlan(plan);
      store.updateExerciseInStore("Test Plan", "training1", updatedExercise);

      expect(store.plans[0].trainings[0].exercises[0]).toEqual(updatedExercise);
    });
  });

  describe("initializeFromDB", () => {
    it("должен инициализировать стор из БД", async () => {
      console.log("🧪 Тест: инициализация стора из БД");

      const mockData = {
        plans: [
          {
            planName: "Test Plan",
            trainings: [],
          },
        ],
      };

      const { loadFromDatabase } = require("../store/syncMiddleware");
      loadFromDatabase.mockResolvedValue(mockData);

      const store = useStore.getState();
      await store.initializeFromDB();

      expect(dbLayer.initDatabase).toHaveBeenCalled();
      expect(loadFromDatabase).toHaveBeenCalled();
      expect(store.plans).toEqual(mockData.plans);
    });

    it("должен обрабатывать ошибки инициализации", async () => {
      console.log("🧪 Тест: обработка ошибок инициализации");

      (dbLayer.initDatabase as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      const store = useStore.getState();
      await store.initializeFromDB();

      expect(console.error).toHaveBeenCalledWith(
        "Ошибка инициализации из БД:",
        expect.any(Error)
      );
    });
  });

  describe("краевые случаи", () => {
    it("должен обрабатывать пустой стор", () => {
      console.log("�� Тест: обработка пустого стора");

      const store = useStore.getState();

      expect(store.plans).toEqual([]);
    });

    it("должен обрабатывать сложную структуру данных", () => {
      console.log("🧪 Тест: обработка сложной структуры данных");

      const store = useStore.getState();
      const complexPlan = {
        planName: "Complex Plan",
        trainings: [
          {
            id: "training1",
            name: "Training 1",
            exercises: [
              {
                id: "exercise1",
                name: "Exercise 1",
                muscleGroup: "chest" as const,
                type: "free weight" as const,
                unilateral: false,
                amplitude: "full" as const,
              },
            ],
            results: [
              {
                exerciseId: "exercise1",
                weight: 100,
                reps: 10,
                date: "2024-01-01",
                amplitude: "full" as const,
              },
            ],
            plannedResults: [
              {
                exerciseId: "exercise1",
                plannedWeight: 110,
                plannedReps: 8,
                plannedDate: "2024-01-02",
                amplitude: "full" as const,
              },
            ],
          },
        ],
      };

      store.addPlan(complexPlan);

      expect(store.plans).toHaveLength(1);
      expect(store.plans[0].trainings[0].exercises).toHaveLength(1);
      expect(store.plans[0].trainings[0].results).toHaveLength(1);
      expect(store.plans[0].trainings[0].plannedResults).toHaveLength(1);
    });

    it("должен обрабатывать конфликтующие данные", () => {
      console.log("🧪 Тест: обработка конфликтующих данных");

      const store = useStore.getState();
      const plan = {
        planName: "Test Plan",
        trainings: [
          {
            id: "training1",
            name: "Training 1",
            exercises: [
              {
                id: "exercise1",
                name: "Exercise 1",
                muscleGroup: "chest" as const,
                type: "free weight" as const,
                unilateral: false,
                amplitude: "full" as const,
              },
            ],
            results: [],
            plannedResults: [],
          },
        ],
      };

      store.addPlan(plan);
      store.addPlan(plan);

      expect(store.plans).toHaveLength(2);
      expect(store.plans[0].planName).toBe("Test Plan");
      expect(store.plans[1].planName).toBe("Test Plan");
    });
  });
});
