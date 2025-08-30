import { create } from "zustand";
import useCaloriesStore from "../store/calloriesStore";
import * as dbLayer from "../store/dbLayer";

jest.mock("../store/dbLayer", () => ({
  initDatabase: jest.fn(),
  getCalorieEntries: jest.fn(),
  saveCalorieEntry: jest.fn(),
  deleteCalorieEntry: jest.fn(),
}));

jest.mock("../store/syncMiddleware", () => ({
  createSyncMiddleware: jest.fn(() => (config: any) => config),
}));

describe("calloriesStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe("addEntry", () => {
    it("должен добавлять новую запись", () => {
      console.log("🧪 Тест: добавление новой записи калорий");

      const store = useCaloriesStore.getState();
      const initialLength = store.entries.length;

      store.addEntry({
        date: "2024-01-01",
        calories: 2000,
        weight: 70,
      });

      expect(store.entries).toHaveLength(initialLength + 1);
      expect(store.entries[store.entries.length - 1]).toEqual({
        date: "2024-01-01",
        calories: 2000,
        weight: 70,
      });
    });

    it("должен обрабатывать дублирующиеся записи", () => {
      console.log("�� Тест: обработка дублирующихся записей");

      const store = useCaloriesStore.getState();
      const entry = {
        date: "2024-01-01",
        calories: 2000,
        weight: 70,
      };

      store.addEntry(entry);
      store.addEntry(entry);

      expect(store.entries).toHaveLength(2);
      expect(store.entries).toEqual([entry, entry]);
    });
  });

  describe("updateEntry", () => {
    it("должен обновлять существующую запись", () => {
      console.log("🧪 Тест: обновление существующей записи");

      const store = useCaloriesStore.getState();
      const originalEntry = {
        date: "2024-01-01",
        calories: 2000,
        weight: 70,
      };
      const updatedEntry = {
        date: "2024-01-01",
        calories: 2200,
        weight: 71,
      };

      store.addEntry(originalEntry);
      store.updateEntry("2024-01-01", updatedEntry);

      expect(store.entries).toHaveLength(1);
      expect(store.entries[0]).toEqual(updatedEntry);
    });

    it("должен игнорировать обновление несуществующей записи", () => {
      console.log("🧪 Тест: игнорирование обновления несуществующей записи");

      const store = useCaloriesStore.getState();
      const initialEntries = [...store.entries];

      store.updateEntry("2024-01-01", {
        date: "2024-01-01",
        calories: 2000,
        weight: 70,
      });

      expect(store.entries).toEqual(initialEntries);
    });
  });

  describe("deleteEntry", () => {
    it("должен удалять существующую запись", () => {
      console.log("🧪 Тест: удаление существующей записи");

      const store = useCaloriesStore.getState();
      const entry = {
        date: "2024-01-01",
        calories: 2000,
        weight: 70,
      };

      store.addEntry(entry);
      const initialLength = store.entries.length;

      store.deleteEntry("2024-01-01");

      expect(store.entries).toHaveLength(initialLength - 1);
      expect(
        store.entries.find((e) => e.date === "2024-01-01")
      ).toBeUndefined();
    });

    it("должен игнорировать удаление несуществующей записи", () => {
      console.log("🧪 Тест: игнорирование удаления несуществующей записи");

      const store = useCaloriesStore.getState();
      const initialEntries = [...store.entries];

      store.deleteEntry("2024-01-01");

      expect(store.entries).toEqual(initialEntries);
    });
  });

  describe("getEntryByDate", () => {
    it("должен находить запись по дате", () => {
      console.log("�� Тест: поиск записи по дате");

      const store = useCaloriesStore.getState();
      const entry = {
        date: "2024-01-01",
        calories: 2000,
        weight: 70,
      };

      store.addEntry(entry);
      const foundEntry = store.getEntryByDate("2024-01-01");

      expect(foundEntry).toEqual(entry);
    });

    it("должен возвращать undefined для несуществующей даты", () => {
      console.log("🧪 Тест: возврат undefined для несуществующей даты");

      const store = useCaloriesStore.getState();
      const foundEntry = store.getEntryByDate("2024-01-01");

      expect(foundEntry).toBeUndefined();
    });
  });

  describe("initializeFromDB", () => {
    it("должен инициализировать стор из БД", async () => {
      console.log("🧪 Тест: инициализация из БД");

      const mockEntries = [
        { date: "2024-01-01", calories: 2000, weight: 70 },
        { date: "2024-01-02", calories: 2100, weight: 71 },
      ];

      (dbLayer.getCalorieEntries as jest.Mock).mockResolvedValue(mockEntries);

      const store = useCaloriesStore.getState();
      await store.initializeFromDB();

      expect(dbLayer.initDatabase).toHaveBeenCalled();
      expect(dbLayer.getCalorieEntries).toHaveBeenCalled();
      expect(store.entries).toEqual(mockEntries);
    });

    it("должен обрабатывать ошибки инициализации", async () => {
      console.log("🧪 Тест: обработка ошибок инициализации");

      (dbLayer.initDatabase as jest.Mock).mockRejectedValue(
        new Error("DB Error")
      );

      const store = useCaloriesStore.getState();
      await store.initializeFromDB();

      expect(console.error).toHaveBeenCalledWith(
        "Ошибка инициализации калорий из БД:",
        expect.any(Error)
      );
    });

    it("должен обрабатывать пустые данные из БД", async () => {
      console.log("�� Тест: обработка пустых данных из БД");

      (dbLayer.getCalorieEntries as jest.Mock).mockResolvedValue([]);

      const store = useCaloriesStore.getState();
      await store.initializeFromDB();

      expect(store.entries).toEqual([]);
    });
  });

  describe("краевые случаи", () => {
    it("должен обрабатывать пустой стор", () => {
      console.log("�� Тест: обработка пустого стора");

      const store = useCaloriesStore.getState();

      expect(store.entries).toEqual([]);
      expect(store.getEntryByDate("2024-01-01")).toBeUndefined();
    });

    it("должен обрабатывать множество записей", () => {
      console.log("🧪 Тест: обработка множества записей");

      const store = useCaloriesStore.getState();
      const entries = Array.from({ length: 100 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, "0")}`,
        calories: 2000 + i,
        weight: 70 + i * 0.1,
      }));

      entries.forEach((entry) => store.addEntry(entry));

      expect(store.entries).toHaveLength(100);
      expect(store.entries[0]).toEqual(entries[0]);
      expect(store.entries[99]).toEqual(entries[99]);
    });

    it("должен обрабатывать конфликтующие данные", () => {
      console.log("🧪 Тест: обработка конфликтующих данных");

      const store = useCaloriesStore.getState();

      store.addEntry({ date: "2024-01-01", calories: 2000, weight: 70 });
      store.updateEntry("2024-01-01", {
        date: "2024-01-01",
        calories: 2200,
        weight: 71,
      });
      store.addEntry({ date: "2024-01-01", calories: 2400, weight: 72 });

      expect(store.entries).toHaveLength(2);
      expect(store.entries.find((e) => e.date === "2024-01-01")?.calories).toBe(
        2400
      );
    });
  });
});
