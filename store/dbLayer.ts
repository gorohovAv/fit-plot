import { openDatabaseAsync } from "expo-sqlite";

let db: any = null;

const getDatabase = async () => {
  if (!db) {
    db = await openDatabaseAsync("fitplot.db");
  }
  return db;
};

export const initDatabase = async () => {
  const database = await getDatabase();

  const createTables = [
    `CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      planName TEXT UNIQUE NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS trainings (
      id TEXT PRIMARY KEY,
      planName TEXT NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (planName) REFERENCES plans (planName)
    )`,
    `CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      trainingId TEXT NOT NULL,
      name TEXT NOT NULL,
      muscleGroup TEXT NOT NULL,
      type TEXT NOT NULL,
      unilateral BOOLEAN NOT NULL,
      amplitude TEXT NOT NULL,
      comment TEXT,
      timerDuration INTEGER,
      FOREIGN KEY (trainingId) REFERENCES trainings (id)
    )`,
    `CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exerciseId TEXT NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      date TEXT NOT NULL,
      amplitude TEXT NOT NULL,
      isPlanned BOOLEAN NOT NULL DEFAULT 0,
      FOREIGN KEY (exerciseId) REFERENCES exercises (id)
    )`,
    `CREATE TABLE IF NOT EXISTS calories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      calories INTEGER NOT NULL,
      weight REAL NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    )`,
  ];

  for (const sql of createTables) {
    await database.runAsync(sql);
  }
};

// Методы для работы с планами
export const savePlan = async (planName: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO plans (planName) VALUES (?)",
    [planName]
  );
};

export const deletePlan = async (planName: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM plans WHERE planName = ?", [planName]);
};

export const getAllPlans = async (): Promise<{ planName: string }[]> => {
  const database = await getDatabase();
  const result = await database.getAllAsync("SELECT planName FROM plans");
  return result;
};

// Методы для работы с тренировками
export const saveTraining = async (
  trainingId: string,
  planName: string,
  name: string
): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO trainings (id, planName, name) VALUES (?, ?, ?)",
    [trainingId, planName, name]
  );
};

export const deleteTraining = async (trainingId: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM trainings WHERE id = ?", [trainingId]);
  await database.runAsync("DELETE FROM exercises WHERE trainingId = ?", [
    trainingId,
  ]);
};

export const getTrainingsByPlan = async (
  planName: string
): Promise<{ id: string; name: string }[]> => {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    "SELECT id, name FROM trainings WHERE planName = ?",
    [planName]
  );
  return result;
};

// Методы для работы с упражнениями
export const saveExercise = async (exercise: {
  id: string;
  trainingId: string;
  name: string;
  muscleGroup: string;
  type: string;
  unilateral: boolean;
  amplitude: string;
  comment?: string;
  timerDuration?: number;
}): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT OR REPLACE INTO exercises
     (id, trainingId, name, muscleGroup, type, unilateral, amplitude, comment, timerDuration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      exercise.id,
      exercise.trainingId,
      exercise.name,
      exercise.muscleGroup,
      exercise.type,
      exercise.unilateral ? 1 : 0,
      exercise.amplitude,
      exercise.comment || null,
      exercise.timerDuration || null,
    ]
  );
};

export const deleteExercise = async (exerciseId: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM exercises WHERE id = ?", [exerciseId]);
  await database.runAsync("DELETE FROM results WHERE exerciseId = ?", [
    exerciseId,
  ]);
};

export const getExercisesByTraining = async (
  trainingId: string
): Promise<any[]> => {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    "SELECT * FROM exercises WHERE trainingId = ?",
    [trainingId]
  );
  return result.map((row) => ({
    ...row,
    unilateral: Boolean(row.unilateral),
  }));
};

// Методы для работы с результатами
export const saveResult = async (result: {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  amplitude: string;
  isPlanned?: boolean;
}): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO results (exerciseId, weight, reps, date, amplitude, isPlanned)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      result.exerciseId,
      result.weight,
      result.reps,
      result.date,
      result.amplitude,
      result.isPlanned ? 1 : 0,
    ]
  );
};

export const getResultsByExercise = async (
  exerciseId: string
): Promise<any[]> => {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    "SELECT * FROM results WHERE exerciseId = ? ORDER BY date DESC",
    [exerciseId]
  );
  return result.map((row) => ({
    ...row,
    isPlanned: Boolean(row.isPlanned),
  }));
};

// Методы для работы с калориями
export const saveCalorieEntry = async (
  date: string,
  calories: number,
  weight: number
): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO calories (date, calories, weight) VALUES (?, ?, ?)",
    [date, calories, weight]
  );
};

export const deleteCalorieEntry = async (date: string): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync("DELETE FROM calories WHERE date = ?", [date]);
};

export const getCalorieEntries = async (): Promise<
  { date: string; calories: number; weight: number }[]
> => {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    "SELECT date, calories, weight FROM calories ORDER BY date DESC"
  );
  return result;
};

// Методы для работы с настройками
export const saveSetting = async (
  key: string,
  value: string
): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    [key, value]
  );
};

export const getSetting = async (key: string): Promise<string | null> => {
  const database = await getDatabase();
  const result = await database.getFirstAsync(
    "SELECT value FROM settings WHERE key = ?",
    [key]
  );
  return result ? result.value : null;
};

export const getAllSettings = async (): Promise<
  { key: string; value: string }[]
> => {
  const database = await getDatabase();
  const result = await database.getAllAsync("SELECT key, value FROM settings");
  return result;
};

export const logAllTables = async () => {
  const database = await getDatabase();

  try {
    console.log("=== ЛОГ ВСЕХ ТАБЛИЦ БАЗЫ ДАННЫХ ===");

    const tables = [
      { name: "plans", query: "SELECT * FROM plans" },
      { name: "trainings", query: "SELECT * FROM trainings" },
      { name: "exercises", query: "SELECT * FROM exercises" },
      { name: "results", query: "SELECT * FROM results" },
      { name: "calories", query: "SELECT * FROM calories" },
      { name: "settings", query: "SELECT * FROM settings" },
    ];

    for (const table of tables) {
      try {
        const result = await database.getAllAsync(table.query);
        console.log(`\n📋 Таблица: ${table.name}`);
        console.log(`Количество записей: ${result.length}`);
        if (result.length > 0) {
          console.log("Данные:", JSON.stringify(result, null, 2));
        } else {
          console.log("Таблица пуста");
        }
      } catch (error) {
        console.log(`❌ Ошибка чтения таблицы ${table.name}:`, error);
      }
    }

    console.log("=== КОНЕЦ ЛОГА ТАБЛИЦ ===\n");
  } catch (error) {
    console.error("Ошибка логирования таблиц:", error);
  }
};
