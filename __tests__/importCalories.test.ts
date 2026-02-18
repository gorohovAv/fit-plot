import { validateImport, importData } from "../utils/importUtils";
import * as dbLayer from "../store/dbLayer";

// Мокируем dbLayer для перехвата вызовов сохранения калорий
jest.mock("../store/dbLayer", () => ({
  initDatabase: jest.fn().mockResolvedValue(undefined),
  saveCalorieEntry: jest.fn().mockResolvedValue(undefined),
  savePlan: jest.fn().mockResolvedValue(undefined),
  saveTraining: jest.fn().mockResolvedValue(undefined),
  saveExercise: jest.fn().mockResolvedValue(undefined),
  saveResult: jest.fn().mockResolvedValue(undefined),
  getCalorieEntries: jest.fn().mockResolvedValue([]),
  getMaintenanceCalories: jest.fn().mockResolvedValue(null),
}));

jest.mock("../store/syncMiddleware", () => ({
  createSyncMiddleware: jest.fn(() => (config: any) => config),
}));

describe("Импорт калорий", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("должен корректно парсить и сохранять калории из формата КАЛЛОРАЖ", async () => {
    const importText = `КАЛЛОРАЖ
2400 ккал 74.5 кг 10.02.2026
2600 ккал 75.0 кг 12.02.2026
2700 ккал 75.2 кг 14.02.2026`;

    const validation = validateImport(importText);
    expect(validation.status).toBe("valid");

    await importData(importText);

    // Проверяем, что saveCalorieEntry был вызван 3 раза
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledTimes(3);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-10", 2400, 74.5);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-12", 2600, 75.0);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-14", 2700, 75.2);
  });

  it("должен парсить калории с разными форматами веса", async () => {
    const importText = `КАЛЛОРАЖ
2400 ккал 74,5 кг 10.02.2026
2600 ккал 75.0 кг 12.02.2026`;

    const validation = validateImport(importText);
    expect(validation.status).toBe("valid");

    await importData(importText);

    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledTimes(2);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-10", 2400, 74.5);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-12", 2600, 75.0);
  });

  it("должен парсить калории с kcal вместо ккал", async () => {
    const importText = `КАЛЛОРАЖ
2400 kcal 74.5 kg 10.02.2026
2600 kcal 75.0 kg 12.02.2026`;

    const validation = validateImport(importText);
    expect(validation.status).toBe("valid");

    await importData(importText);

    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledTimes(2);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-10", 2400, 74.5);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-12", 2600, 75.0);
  });

  it("должен игнорировать некорректные строки калорий", async () => {
    const importText = `КАЛЛОРАЖ
2400 ккал 74.5 кг 10.02.2026
некорректная строка
2600 ккал 75.0 кг 12.02.2026`;

    const validation = validateImport(importText);
    expect(validation.status).toBe("invalid");

    await importData(importText);

    // Должны сохраниться только корректные записи
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledTimes(2);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-10", 2400, 74.5);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-12", 2600, 75.0);
  });

  it("должен парсить смешанные данные (упражнения + калории)", async () => {
    const importText = `Жим лежа
80х10 10.02.2026
82.5х8 12.02.2026

Приседания со штангой
100х10 10.02.2026

КАЛЛОРАЖ
2400 ккал 74.5 кг 10.02.2026
2600 ккал 75.0 кг 12.02.2026`;

    const validation = validateImport(importText);
    expect(validation.status).toBe("valid");

    await importData(importText);

    // Проверяем сохранение калорий
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledTimes(2);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-10", 2400, 74.5);
    expect(dbLayer.saveCalorieEntry).toHaveBeenCalledWith("2026-02-12", 2600, 75.0);

    // Проверяем сохранение результатов упражнений
    expect(dbLayer.saveResult).toHaveBeenCalled();
  });
});
