import { openDatabaseAsync } from "expo-sqlite";
import { Plan, Training, Exercise, Result, PlannedResult } from "./store";

let db: any = null;

export const getDatabase = async () => {
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
    `CREATE TABLE IF NOT EXISTS stepsFallback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      steps INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ];

  // Создаем таблицы
  for (const sql of createTables) {
    await database.runAsync(sql);
  }

  // Добавляем индексы для производительности
  const createIndexes = [
    // Самые критичные для loadPlansFromDB()
    `CREATE INDEX IF NOT EXISTS idx_trainings_planName ON trainings(planName)`,
    `CREATE INDEX IF NOT EXISTS idx_exercises_trainingId ON exercises(trainingId)`,
    `CREATE INDEX IF NOT EXISTS idx_results_exerciseId ON results(exerciseId)`,

    // Для фильтрации по датам в аналитике
    `CREATE INDEX IF NOT EXISTS idx_results_date ON results(date)`,

    // Композитный индекс для самых частых запросов
    `CREATE INDEX IF NOT EXISTS idx_results_exerciseId_date ON results(exerciseId, date)`,

    // Для stepsFallback запросов
    `CREATE INDEX IF NOT EXISTS idx_stepsFallback_timestamp ON stepsFallback(timestamp)`,

    // Для поиска упражнений по группе мышц
    `CREATE INDEX IF NOT EXISTS idx_exercises_muscleGroup ON exercises(muscleGroup)`,
  ];

  // Создаем индексы
  for (const sql of createIndexes) {
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
  return result.map((row: any) => ({
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

  // Проверяем, существует ли уже такой результат
  const existing = await database.getFirstAsync(
    `SELECT id FROM results
     WHERE id = ? AND exerciseId = ? AND weight = ? AND reps = ? AND date = ? AND amplitude = ? AND isPlanned = ?`,
    [
      result.exerciseId,
      result.weight,
      result.reps,
      result.date,
      result.amplitude,
      result.isPlanned ? 1 : 0,
    ]
  );

  if (!existing) {
    // Добавляем только если не существует
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
  }
};

export const getResultsByExercise = async (
  exerciseId: string
): Promise<any[]> => {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    "SELECT * FROM results WHERE exerciseId = ? ORDER BY date DESC",
    [exerciseId]
  );
  return result.map((row: any) => ({
    ...row,
    isPlanned: Boolean(row.isPlanned),
  }));
};

export const getResultsForExerciseIds = async (exerciseIds: string[]) => {
  if (!exerciseIds || exerciseIds.length === 0) return [];
  const database = await getDatabase();
  const placeholders = exerciseIds.map(() => "?").join(",");
  const rows = await database.getAllAsync(
    `SELECT exerciseId, weight, reps, date, amplitude, isPlanned
     FROM results
     WHERE exerciseId IN (${placeholders})
     ORDER BY date DESC`,
    exerciseIds
  );
  return rows.map((r: any) => ({ ...r, isPlanned: Boolean(r.isPlanned) }));
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

// Методы для работы с шагами
export const saveStepsFallback = async (steps: number): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync("INSERT INTO stepsFallback (steps) VALUES (?)", [
    steps,
  ]);
};

export const getLatestStepsFallback = async (): Promise<number> => {
  const database = await getDatabase();
  const result = await database.getFirstAsync(
    "SELECT steps FROM stepsFallback ORDER BY timestamp DESC LIMIT 1"
  );
  return result ? result.steps : 0;
};

export const getStepsForDate = async (date: string): Promise<number> => {
  const database = await getDatabase();
  const result = await database.getFirstAsync(
    "SELECT steps FROM stepsFallback WHERE DATE(timestamp) = ? ORDER BY timestamp DESC LIMIT 1",
    [date]
  );
  return result ? result.steps : 0;
};

export const clearOldStepsFallback = async (
  daysToKeep: number = 7
): Promise<void> => {
  const database = await getDatabase();
  await database.runAsync(
    "DELETE FROM stepsFallback WHERE timestamp < datetime('now', '-? days')",
    [daysToKeep]
  );
};

export const saveMaintenanceCalories = async (
  calories: number
): Promise<void> => {
  await saveSetting("maintenanceCalories", calories.toString());
};

export const getMaintenanceCalories = async (): Promise<number | null> => {
  const database = await getDatabase();
  const result = await database.getFirstAsync(
    "SELECT value FROM settings WHERE key = 'maintenanceCalories'"
  );
  return result ? parseFloat(result.value) : null;
};

export const logAllTables = async () => {
  /*
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
      { name: "stepsFallback", query: "SELECT * FROM stepsFallback" },
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
  }*/
};

export const savePlannedResult = async (plannedResult: {
  exerciseId: string;
  plannedWeight: number;
  plannedReps: number;
  plannedDate: string;
  amplitude: string;
}): Promise<void> => {
  const database = await getDatabase();

  const existing = await database.getFirstAsync(
    `SELECT id FROM results
     WHERE exerciseId = ? AND weight = ? AND reps = ? AND date = ? AND amplitude = ? AND isPlanned = ?`,
    [
      plannedResult.exerciseId,
      plannedResult.plannedWeight,
      plannedResult.plannedReps,
      plannedResult.plannedDate,
      plannedResult.amplitude,
      1,
    ]
  );

  if (!existing) {
    await database.runAsync(
      `INSERT INTO results (exerciseId, weight, reps, date, amplitude, isPlanned)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        plannedResult.exerciseId,
        plannedResult.plannedWeight,
        plannedResult.plannedReps,
        plannedResult.plannedDate,
        plannedResult.amplitude,
        1,
      ]
    );
  }
};

export const getPlannedResultsByExercise = async (
  exerciseId: string
): Promise<any[]> => {
  const database = await getDatabase();
  const result = await database.getAllAsync(
    "SELECT * FROM results WHERE exerciseId = ? AND isPlanned = 1 ORDER BY date DESC",
    [exerciseId]
  );
  return result.map((row: any) => ({
    exerciseId: row.exerciseId,
    plannedWeight: row.weight,
    plannedReps: row.reps,
    plannedDate: row.date,
    amplitude: row.amplitude,
    isPlanned: true,
  }));
};

export const getAllPlansWithData = async (): Promise<Plan[]> => {
  const database = await getDatabase();

  const plans = await database.getAllAsync("SELECT planName FROM plans");
  const result: Plan[] = [];

  for (const plan of plans) {
    const trainings = await database.getAllAsync(
      "SELECT id, name FROM trainings WHERE planName = ?",
      [plan.planName]
    );

    const planTrainings: Training[] = [];

    for (const training of trainings) {
      const exercises = await database.getAllAsync(
        "SELECT * FROM exercises WHERE trainingId = ?",
        [training.id]
      );

      const trainingExercises: Exercise[] = exercises.map((ex: any) => ({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        type: ex.type,
        unilateral: Boolean(ex.unilateral),
        amplitude: ex.amplitude,
        comment: ex.comment,
        timerDuration: ex.timerDuration,
      }));

      const results: Result[] = [];
      const plannedResults: PlannedResult[] = [];

      for (const exercise of trainingExercises) {
        const exerciseResults = await database.getAllAsync(
          "SELECT * FROM results WHERE exerciseId = ? AND isPlanned = 0 ORDER BY date DESC",
          [exercise.id]
        );

        const exercisePlannedResults = await database.getAllAsync(
          "SELECT * FROM results WHERE exerciseId = ? AND isPlanned = 1 ORDER BY date DESC",
          [exercise.id]
        );

        results.push(
          ...exerciseResults.map((r: any) => ({
            exerciseId: r.exerciseId,
            weight: r.weight,
            reps: r.reps,
            date: r.date,
            amplitude: r.amplitude,
          }))
        );

        plannedResults.push(
          ...exercisePlannedResults.map((r: any) => ({
            exerciseId: r.exerciseId,
            plannedWeight: r.weight,
            plannedReps: r.reps,
            plannedDate: r.date,
            amplitude: r.amplitude,
          }))
        );
      }

      planTrainings.push({
        id: training.id,
        name: training.name,
        exercises: trainingExercises,
        results,
        plannedResults,
      });
    }

    result.push({
      planName: plan.planName,
      trainings: planTrainings,
    });
  }

  return result;
};
