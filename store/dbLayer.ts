import { openDatabaseAsync } from "expo-sqlite";

let db: any = null;
let initPromise: Promise<void> | null = null;
let isInitialized = false;
let isInitializing = false;

// Функция для безопасного открытия БД с retry
const openDatabaseWithRetry = async (retries = 3, delay = 100): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await openDatabaseAsync("fitplot.db");
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) {
        console.error(`Ошибка открытия БД после ${retries} попыток:`, error);
        throw error;
      }
      console.warn(`Попытка ${i + 1} открытия БД не удалась, повтор через ${delay}ms:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Увеличиваем задержку экспоненциально
    }
  }
  throw new Error("Не удалось открыть БД после всех попыток");
};

export const getDatabase = async () => {
  // Ждем завершения инициализации, если она идет
  if (initPromise) {
    await initPromise;
  }

  if (!db) {
    db = await openDatabaseWithRetry();
  }
  return db;
};

export const initDatabase = async () => {
  // Если уже инициализирована, возвращаемся
  if (isInitialized) {
    return;
  }

  // Если инициализация уже идет, ждем её завершения
  if (isInitializing && initPromise) {
    await initPromise;
    return;
  }

  // Начинаем инициализацию
  isInitializing = true;
  initPromise = (async () => {
    try {
      // Открываем БД напрямую, без вызова getDatabase, чтобы избежать циклической зависимости
      if (!db) {
        db = await openDatabaseWithRetry();
      }
      const database = db;

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
      hidden BOOLEAN NOT NULL DEFAULT 0,
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
    `CREATE TABLE IF NOT EXISTS training_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trainingId TEXT NOT NULL,
      exerciseId TEXT NOT NULL,
      setsCount INTEGER NOT NULL DEFAULT 0,
      hidden BOOLEAN NOT NULL DEFAULT 0,
      UNIQUE(trainingId, exerciseId),
      FOREIGN KEY (trainingId) REFERENCES trainings (id),
      FOREIGN KEY (exerciseId) REFERENCES exercises (id)
    )`,
  ];

  // Создаем таблицы
  for (const sql of createTables) {
    await database.runAsync(sql);
  }

  try {
    await database.runAsync(
      "ALTER TABLE exercises ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT 0"
    );
  } catch (error: any) {
    if (!error?.message?.includes("duplicate column")) {
      console.warn("Ошибка добавления колонки hidden в exercises:", error);
    }
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
    `CREATE INDEX IF NOT EXISTS idx_training_settings_trainingId ON training_settings(trainingId)`,
    `CREATE INDEX IF NOT EXISTS idx_training_settings_exerciseId ON training_settings(exerciseId)`,
  ];

  // Создаем индексы
  for (const sql of createIndexes) {
    await database.runAsync(sql);
  }

      isInitialized = true;
      console.log("БД успешно инициализирована");
    } catch (error) {
      console.error("Ошибка инициализации БД:", error);
      // Сбрасываем состояние при ошибке, чтобы можно было повторить попытку
      db = null;
      isInitialized = false;
      throw error;
    } finally {
      isInitializing = false;
    }
  })();

  await initPromise;
};

// Вспомогательная функция для безопасного выполнения операций с БД
const safeDbOperation = async <T>(
  operation: (db: any) => Promise<T>,
  retries = 3
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      const database = await getDatabase();
      return await operation(database);
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) {
        console.error("Ошибка операции с БД после всех попыток:", error);
        throw error;
      }
      // Если ошибка связана с подключением, сбрасываем его
      if (error?.message?.includes("NullPointerException") ||
          error?.message?.includes("prepareAsync")) {
        console.warn(`Попытка ${i + 1} операции с БД не удалась, сброс подключения:`, error);
        db = null;
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      } else {
        throw error; // Для других ошибок не повторяем
      }
    }
  }
  throw new Error("Не удалось выполнить операцию с БД");
};

// Методы для работы с планами
export const savePlan = async (planName: string): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync(
      "INSERT OR REPLACE INTO plans (planName) VALUES (?)",
      [planName]
    );
  });
};

export const deletePlan = async (planName: string): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync("DELETE FROM plans WHERE planName = ?", [planName]);
  });
};

export const getAllPlans = async (): Promise<{ planName: string }[]> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getAllAsync("SELECT planName FROM plans");
    return result;
  });
};

// Методы для работы с тренировками
export const saveTraining = async (
  trainingId: string,
  planName: string,
  name: string
): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync(
      "INSERT OR REPLACE INTO trainings (id, planName, name) VALUES (?, ?, ?)",
      [trainingId, planName, name]
    );
  });
};

export const deleteTraining = async (trainingId: string): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync("DELETE FROM trainings WHERE id = ?", [trainingId]);
    await database.runAsync("DELETE FROM exercises WHERE trainingId = ?", [
      trainingId,
    ]);
  });
};

export const getTrainingsByPlan = async (
  planName: string
): Promise<{ id: string; name: string }[]> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getAllAsync(
      "SELECT id, name FROM trainings WHERE planName = ?",
      [planName]
    );
    return result;
  });
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
  hidden?: boolean;
}): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync(
      `INSERT OR REPLACE INTO exercises
       (id, trainingId, name, muscleGroup, type, unilateral, amplitude, comment, timerDuration, hidden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        exercise.hidden ? 1 : 0,
      ]
    );
  });
};

export const deleteExercise = async (exerciseId: string): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync("DELETE FROM exercises WHERE id = ?", [exerciseId]);
    await database.runAsync("DELETE FROM results WHERE exerciseId = ?", [
      exerciseId,
    ]);
  });
};

export const getExercisesByTraining = async (
  trainingId: string
): Promise<any[]> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getAllAsync(
      "SELECT * FROM exercises WHERE trainingId = ?",
      [trainingId]
    );
    return result.map((row: any) => ({
      ...row,
      unilateral: Boolean(row.unilateral),
      hidden: row.hidden !== undefined ? Boolean(row.hidden) : false,
    }));
  });
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
  await safeDbOperation(async (database) => {
    // Проверяем, существует ли уже такой результат
    const existing = await database.getFirstAsync(
      `SELECT id FROM results
       WHERE exerciseId = ? AND weight = ? AND reps = ? AND date = ? AND amplitude = ? AND isPlanned = ?`,
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
  });
};

export const getResultsByExercise = async (
  exerciseId: string
): Promise<any[]> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getAllAsync(
      "SELECT * FROM results WHERE exerciseId = ? ORDER BY date DESC",
      [exerciseId]
    );
    return result.map((row: any) => ({
      ...row,
      isPlanned: Boolean(row.isPlanned),
    }));
  });
};

export const getResultsForExerciseIds = async (exerciseIds: string[]) => {
  if (!exerciseIds || exerciseIds.length === 0) return [];
  return await safeDbOperation(async (database) => {
    const placeholders = exerciseIds.map(() => "?").join(",");
    const rows = await database.getAllAsync(
      `SELECT exerciseId, weight, reps, date, amplitude, isPlanned
       FROM results
       WHERE exerciseId IN (${placeholders})
       ORDER BY date DESC`,
      exerciseIds
    );
    return rows.map((r: any) => ({ ...r, isPlanned: Boolean(r.isPlanned) }));
  });
};

// Методы для работы с калориями
export const saveCalorieEntry = async (
  date: string,
  calories: number,
  weight: number
): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync(
      "INSERT OR REPLACE INTO calories (date, calories, weight) VALUES (?, ?, ?)",
      [date, calories, weight]
    );
  });
};

export const deleteCalorieEntry = async (date: string): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync("DELETE FROM calories WHERE date = ?", [date]);
  });
};

export const getCalorieEntries = async (): Promise<
  { date: string; calories: number; weight: number }[]
> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getAllAsync(
      "SELECT date, calories, weight FROM calories ORDER BY date DESC"
    );
    return result;
  });
};

// Методы для работы с настройками
export const saveSetting = async (
  key: string,
  value: string
): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [key, value]
    );
  });
};

export const getSetting = async (key: string): Promise<string | null> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getFirstAsync(
      "SELECT value FROM settings WHERE key = ?",
      [key]
    );
    return result ? result.value : null;
  });
};

export const getAllSettings = async (): Promise<
  { key: string; value: string }[]
> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getAllAsync("SELECT key, value FROM settings");
    return result;
  });
};

// Методы для работы с шагами
export const saveStepsFallback = async (steps: number): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync("INSERT INTO stepsFallback (steps) VALUES (?)", [
      steps,
    ]);
  });
};

export const getLatestStepsFallback = async (): Promise<number> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getFirstAsync(
      "SELECT steps FROM stepsFallback ORDER BY timestamp DESC LIMIT 1"
    );
    return result ? result.steps : 0;
  });
};

export const getStepsForDate = async (date: string): Promise<number> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getFirstAsync(
      "SELECT steps FROM stepsFallback WHERE DATE(timestamp) = ? ORDER BY timestamp DESC LIMIT 1",
      [date]
    );
    return result ? result.steps : 0;
  });
};

export const clearOldStepsFallback = async (
  daysToKeep: number = 7
): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync(
      "DELETE FROM stepsFallback WHERE timestamp < datetime('now', '-? days')",
      [daysToKeep]
    );
  });
};

export const saveMaintenanceCalories = async (
  calories: number
): Promise<void> => {
  await saveSetting("maintenanceCalories", calories.toString());
};

export const getMaintenanceCalories = async (): Promise<number | null> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getFirstAsync(
      "SELECT value FROM settings WHERE key = 'maintenanceCalories'"
    );
    return result ? parseFloat(result.value) : null;
  });
};

export const saveTrainingSetting = async (setting: {
  trainingId: string;
  exerciseId: string;
  setsCount: number;
  hidden: boolean;
}): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync(
      `INSERT OR REPLACE INTO training_settings
       (trainingId, exerciseId, setsCount, hidden)
       VALUES (?, ?, ?, ?)`,
      [
        setting.trainingId,
        setting.exerciseId,
        setting.setsCount,
        setting.hidden ? 1 : 0,
      ]
    );
  });
};

export const getTrainingSettings = async (
  trainingId: string
): Promise<any[]> => {
  return await safeDbOperation(async (database) => {
    const result = await database.getAllAsync(
      "SELECT * FROM training_settings WHERE trainingId = ?",
      [trainingId]
    );
    return result.map((row: any) => ({
      ...row,
      hidden: Boolean(row.hidden),
    }));
  });
};

export const updateExerciseHidden = async (
  exerciseId: string,
  hidden: boolean
): Promise<void> => {
  await safeDbOperation(async (database) => {
    await database.runAsync(
      "UPDATE exercises SET hidden = ? WHERE id = ?",
      [hidden ? 1 : 0, exerciseId]
    );
  });
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
