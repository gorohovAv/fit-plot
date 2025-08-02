import {
  createSyncMiddleware,
  loadFromDatabase,
} from "../store/syncMiddleware";
import * as dbLayer from "../store/dbLayer";

// Мокаем модуль dbLayer
jest.mock("../store/dbLayer", () => ({
  savePlan: jest.fn(),
  saveTraining: jest.fn(),
  saveExercise: jest.fn(),
  saveResult: jest.fn(),
  saveSetting: jest.fn(),
  saveCalorieEntry: jest.fn(),
  getAllPlans: jest.fn(),
  getTrainingsByPlan: jest.fn(),
  getExercisesByTraining: jest.fn(),
  getResultsByExercise: jest.fn(),
  getAllSettings: jest.fn(),
  getCalorieEntries: jest.fn(),
}));

describe("syncMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  describe("createSyncMiddleware", () => {
    it("должен создавать middleware без ошибок", () => {
      console.log("🧪 Тест: создание middleware");
      const middleware = createSyncMiddleware();
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe("function");
    });

    it("должен вызывать оригинальный set и синхронизацию", () => {
      console.log("🧪 Тест: вызов set и синхронизация");
      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => ({}));

      const config = middleware((set, get) => ({
        test: "value",
        setTest: (value: string) => set({ test: value }),
      }));

      const store = config(mockSet, mockGet, {} as any);
      store.setTest("new value");

      expect(mockSet).toHaveBeenCalledWith({ test: "new value" });
    });
  });

  describe("syncToDatabase - краевые случаи", () => {
    it("должен обрабатывать undefined состояния", () => {
      console.log("🧪 Тест: обработка undefined состояний");
      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => undefined);

      const config = middleware((set, get) => ({
        test: "value",
      }));

      const store = config(mockSet, mockGet, {} as any);
      expect(console.warn).toHaveBeenCalledWith(
        "syncToDatabase: prevState или newState undefined"
      );
    });

    it("должен обрабатывать пустой стор", () => {
      console.log("�� Тест: обработка пустого стора");
      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => ({ plans: [] }));

      const config = middleware((set, get) => ({
        plans: [],
        setPlans: (plans: any[]) => set({ plans }),
      }));

      const store = config(mockSet, mockGet, {} as any);
      store.setPlans([]);

      expect(mockSet).toHaveBeenCalledWith({ plans: [] });
    });

    it("должен обрабатывать полный стор с данными", () => {
      console.log("🧪 Тест: обработка полного стора");
      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => ({
        plans: [
          {
            planName: "Test Plan",
            trainings: [
              {
                id: "training1",
                name: "Training 1",
                exercises: [
                  {
                    id: "exercise1",
                    name: "Exercise 1",
                    muscleGroup: "chest",
                    type: "free weight",
                    unilateral: false,
                    amplitude: "full",
                    trainingId: "training1",
                  },
                ],
                results: [],
                plannedResults: [],
              },
            ],
          },
        ],
      }));

      const config = middleware((set, get) => ({
        plans: [],
        setPlans: (plans: any[]) => set({ plans }),
      }));

      const store = config(mockSet, mockGet, {} as any);
      store.setPlans([
        {
          planName: "Test Plan",
          trainings: [
            {
              id: "training1",
              name: "Training 1",
              exercises: [
                {
                  id: "exercise1",
                  name: "Exercise 1",
                  muscleGroup: "chest",
                  type: "free weight",
                  unilateral: false,
                  amplitude: "full",
                  trainingId: "training1",
                },
              ],
              results: [],
              plannedResults: [],
            },
          ],
        },
      ]);

      expect(dbLayer.savePlan).toHaveBeenCalledWith("Test Plan");
      expect(dbLayer.saveTraining).toHaveBeenCalledWith(
        "training1",
        "Test Plan",
        "Training 1"
      );
      expect(dbLayer.saveExercise).toHaveBeenCalledWith({
        id: "exercise1",
        name: "Exercise 1",
        muscleGroup: "chest",
        type: "free weight",
        unilateral: false,
        amplitude: "full",
        trainingId: "training1",
      });
    });
  });

  describe("syncPlans", () => {
    it("должен обрабатывать невалидные планы", () => {
      console.log("�� Тест: обработка невалидных планов");
      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => ({ plans: null }));

      const config = middleware((set, get) => ({
        plans: [],
        setPlans: (plans: any[]) => set({ plans }),
      }));

      const store = config(mockSet, mockGet, {} as any);
      store.setPlans(null);

      expect(console.warn).toHaveBeenCalledWith(
        "syncPlans: plans не является массивом"
      );
    });

    it("должен синхронизировать планы с тренировками и упражнениями", () => {
      console.log("🧪 Тест: синхронизация планов с тренировками");
      const plans = [
        {
          planName: "Test Plan",
          trainings: [
            {
              id: "training1",
              name: "Training 1",
              exercises: [
                {
                  id: "exercise1",
                  name: "Exercise 1",
                  muscleGroup: "chest",
                  type: "free weight",
                  unilateral: false,
                  amplitude: "full",
                  trainingId: "training1",
                },
              ],
              results: [
                {
                  exerciseId: "exercise1",
                  weight: 100,
                  reps: 10,
                  date: "2024-01-01",
                  amplitude: "full",
                },
              ],
              plannedResults: [
                {
                  exerciseId: "exercise1",
                  plannedWeight: 110,
                  plannedReps: 8,
                  plannedDate: "2024-01-02",
                  amplitude: "full",
                },
              ],
            },
          ],
        },
      ];

      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => ({ plans: [] }));

      const config = middleware((set, get) => ({
        plans: [],
        setPlans: (plans: any[]) => set({ plans }),
      }));

      const store = config(mockSet, mockGet, {} as any);
      store.setPlans(plans);

      expect(dbLayer.savePlan).toHaveBeenCalledWith("Test Plan");
      expect(dbLayer.saveTraining).toHaveBeenCalledWith(
        "training1",
        "Test Plan",
        "Training 1"
      );
      expect(dbLayer.saveExercise).toHaveBeenCalledWith({
        id: "exercise1",
        name: "Exercise 1",
        muscleGroup: "chest",
        type: "free weight",
        unilateral: false,
        amplitude: "full",
        trainingId: "training1",
      });
      expect(dbLayer.saveResult).toHaveBeenCalledWith({
        exerciseId: "exercise1",
        weight: 100,
        reps: 10,
        date: "2024-01-01",
        amplitude: "full",
        isPlanned: false,
      });
      expect(dbLayer.saveResult).toHaveBeenCalledWith({
        exerciseId: "exercise1",
        weight: 110,
        reps: 8,
        date: "2024-01-02",
        amplitude: "full",
        isPlanned: true,
      });
    });
  });

  describe("syncSettings", () => {
    it("должен синхронизировать настройки", () => {
      console.log("🧪 Тест: синхронизация настроек");
      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => ({ theme: "light" }));

      const config = middleware((set, get) => ({
        theme: "light",
        weight: 70,
        devMode: false,
        setTheme: (theme: string) => set({ theme }),
      }));

      const store = config(mockSet, mockGet, {} as any);
      store.setTheme("dark");

      expect(dbLayer.saveSetting).toHaveBeenCalledWith("theme", "dark");
    });

    it("должен обрабатывать undefined настройки", () => {
      console.log("🧪 Тест: обработка undefined настроек");
      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => ({ theme: "light" }));

      const config = middleware((set, get) => ({
        theme: "light",
        setTheme: (theme: string) => set({ theme }),
      }));

      const store = config(mockSet, mockGet, {} as any);
      store.setTheme(undefined);

      expect(dbLayer.saveSetting).toHaveBeenCalledWith("theme", "system");
    });
  });

  describe("syncCalories", () => {
    it("должен синхронизировать калории", () => {
      console.log("🧪 Тест: синхронизация калорий");
      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => ({ entries: [] }));

      const config = middleware((set, get) => ({
        entries: [],
        setEntries: (entries: any[]) => set({ entries }),
      }));

      const store = config(mockSet, mockGet, {} as any);
      store.setEntries([
        {
          date: "2024-01-01",
          calories: 2000,
          weight: 70,
        },
      ]);

      expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith(
        "2024-01-01",
        2000,
        70
      );
    });

    it("должен обрабатывать невалидные записи калорий", () => {
      console.log("�� Тест: обработка невалидных записей калорий");
      const middleware = createSyncMiddleware();
      const mockSet = jest.fn();
      const mockGet = jest.fn(() => ({ entries: [] }));

      const config = middleware((set, get) => ({
        entries: [],
        setEntries: (entries: any[]) => set({ entries }),
      }));

      const store = config(mockSet, mockGet, {} as any);
      store.setEntries([null, { date: "2024-01-01" }, { calories: 2000 }]);

      expect(dbLayer.saveCalorieEntry).not.toHaveBeenCalled();
    });
  });
});

describe("loadFromDatabase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("должен загружать данные из БД", async () => {
    console.log("🧪 Тест: загрузка данных из БД");

    (dbLayer.getAllPlans as jest.Mock).mockResolvedValue([
      { planName: "Test Plan" },
    ]);
    (dbLayer.getTrainingsByPlan as jest.Mock).mockResolvedValue([
      { id: "training1", name: "Training 1" },
    ]);
    (dbLayer.getExercisesByTraining as jest.Mock).mockResolvedValue([
      {
        id: "exercise1",
        name: "Exercise 1",
        muscleGroup: "chest",
        type: "free weight",
        unilateral: 0,
        amplitude: "full",
        trainingId: "training1",
      },
    ]);
    (dbLayer.getResultsByExercise as jest.Mock).mockResolvedValue([
      {
        exerciseId: "exercise1",
        weight: 100,
        reps: 10,
        date: "2024-01-01",
        amplitude: "full",
        isPlanned: 0,
      },
    ]);
    (dbLayer.getAllSettings as jest.Mock).mockResolvedValue([
      { key: "theme", value: "dark" },
      { key: "weight", value: "75" },
      { key: "devMode", value: "true" },
    ]);
    (dbLayer.getCalorieEntries as jest.Mock).mockResolvedValue([
      { date: "2024-01-01", calories: 2000, weight: 70 },
    ]);

    const result = await loadFromDatabase();

    expect(result).toEqual({
      plans: [
        {
          planName: "Test Plan",
          trainings: [
            {
              id: "training1",
              name: "Training 1",
              exercises: [
                {
                  id: "exercise1",
                  name: "Exercise 1",
                  muscleGroup: "chest",
                  type: "free weight",
                  unilateral: false,
                  amplitude: "full",
                  trainingId: "training1",
                },
              ],
              results: [
                {
                  exerciseId: "exercise1",
                  weight: 100,
                  reps: 10,
                  date: "2024-01-01",
                  amplitude: "full",
                },
              ],
              plannedResults: [],
            },
          ],
        },
      ],
      settings: {
        theme: "dark",
        weight: 75,
        devMode: true,
      },
      calories: [
        {
          date: "2024-01-01",
          calories: 2000,
          weight: 70,
        },
      ],
    });
  });

  it("должен обрабатывать ошибки загрузки", async () => {
    console.log("🧪 Тест: обработка ошибок загрузки");

    (dbLayer.getAllPlans as jest.Mock).mockRejectedValue(new Error("DB Error"));

    const result = await loadFromDatabase();

    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith(
      "Ошибка загрузки из БД:",
      expect.any(Error)
    );
  });

  it("должен загружать пустые данные", async () => {
    console.log("🧪 Тест: загрузка пустых данных");

    (dbLayer.getAllPlans as jest.Mock).mockResolvedValue([]);
    (dbLayer.getAllSettings as jest.Mock).mockResolvedValue([]);
    (dbLayer.getCalorieEntries as jest.Mock).mockResolvedValue([]);

    const result = await loadFromDatabase();

    expect(result).toEqual({
      plans: [],
      settings: {
        theme: "system",
        weight: 70,
        devMode: false,
      },
      calories: [],
    });
  });
});
