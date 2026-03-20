/**
 * Результат расчета тренда
 */
export type TrendResult = {
  /** Тренд (наклон линейной регрессии, кг за тренировку) */
  trend: number;
  /** Достоверность (от 0 до 1) */
  confidence: number;
};

/**
 * Расчет тренда и достоверности для максимальных весов
 * 
 * @param weights - массив максимальных весов (как график максимальных весов)
 * @returns тренд и достоверность
 */
export function calculateTrend(weights: number[]): TrendResult {
  // Определение размера окна
  if (weights.length < 5) {
    return { trend: 0, confidence: 0 };
  }

  // Подготовка данных: берем последние 20 записей если > 20
  const windowSize = weights.length > 20 ? 20 : weights.length;
  const data = weights.slice(-windowSize);

  // Простое сглаживание: замена выбросов
  const smoothed = smoothData(data);

  // Расчет тренда методом наименьших квадратов (линейная регрессия)
  const trend = calculateLinearRegression(smoothed);

  // Расчет достоверности
  const outliersCount = countOutliers(data);
  const confidence = calculateConfidence(data.length, outliersCount);

  return { trend, confidence };
}

/**
 * Простое сглаживание данных с заменой выбросов
 * Если вес отличается от соседних больше чем на 20% — заменяется на среднее между соседями
 * 
 * @param data - исходные данные
 * @returns сглаженные данные
 */
function smoothData(data: number[]): number[] {
  if (data.length < 3) {
    return [...data];
  }

  const result = [...data];

  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1];
    const current = data[i];
    const next = data[i + 1];

    // Проверяем, является ли текущее значение выбросом
    if (isOutlier(current, prev, next)) {
      // Заменяем на среднее между соседями
      result[i] = (prev + next) / 2;
    }
  }

  return result;
}

/**
 * Проверка, является ли значение выбросом
 * 
 * @param current - текущее значение
 * @param prev - предыдущее значение
 * @param next - следующее значение
 * @returns true если выброс
 */
function isOutlier(current: number, prev: number, next: number): boolean {
  const threshold = 0.2; // 20%

  // Проверяем отклонение от предыдущего значения
  const deviationFromPrev = Math.abs(current - prev) / prev;
  // Проверяем отклонение от следующего значения
  const deviationFromNext = Math.abs(current - next) / next;

  return deviationFromPrev > threshold && deviationFromNext > threshold;
}

/**
 * Подсчет количества выбросов в данных
 * 
 * @param data - исходные данные
 * @returns количество выбросов
 */
function countOutliers(data: number[]): number {
  if (data.length < 3) {
    return 0;
  }

  let count = 0;

  for (let i = 1; i < data.length - 1; i++) {
    if (isOutlier(data[i], data[i - 1], data[i + 1])) {
      count++;
    }
  }

  return count;
}

/**
 * Расчет линейной регрессии методом наименьших квадратов
 * 
 * @param data - сглаженные данные
 * @returns наклон (тренд)
 */
function calculateLinearRegression(data: number[]): number {
  const n = data.length;

  if (n < 2) {
    return 0;
  }

  // sum_x = сумма индексов (0+1+2+...)
  let sumX = 0;
  // sum_y = сумма весов
  let sumY = 0;
  // sum_xy = сумма (индекс * вес)
  let sumXY = 0;
  // sum_xx = сумма (индекс * индекс)
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  // тренд = (n * sum_xy - sum_x * sum_y) / (n * sum_xx - sum_x * sum_x)
  const denominator = n * sumXX - sumX * sumX;

  if (denominator === 0) {
    return 0;
  }

  return (n * sumXY - sumX * sumY) / denominator;
}

/**
 * Расчет достоверности
 * достоверность = 1 - ((количество выбросов)^2)/(количество значений)
 *
 * @param totalCount - количество значений
 * @param outliersCount - количество выбросов
 * @returns достоверность от 0 до 1
 */
function calculateConfidence(totalCount: number, outliersCount: number): number {
  if (totalCount === 0) {
    return 0;
  }

  const confidence = 1 - (outliersCount * outliersCount) / totalCount;

  // Если получилось отрицательное, возвращаем ноль
  return Math.max(0, confidence);
}

/**
 * Уровни крепатуры
 */
export type SorenessLevel = 'none' | 'weak' | 'medium' | 'strong';

/**
 * Коэффициенты мышц для расчета крепатуры
 */
export type MuscleCoefficients = {
  chest: number;
  back: number;
  biceps: number;
  triceps: number;
  delts: number;
  legs: number;
};

/**
 * Коэффициенты мышц по умолчанию
 */
export const DEFAULT_MUSCLE_COEFFICIENTS: MuscleCoefficients = {
  chest: 1,
  back: 1,
  biceps: 1,
  triceps: 1,
  delts: 1,
  legs: 1,
};

/**
 * Расчет уровня крепатуры на основе количества сетов и времени прошедшего с тренировки
 *
 * @param sets - количество сетов
 * @param lastWorkoutDate - дата последней тренировки
 * @param muscleCoefficient - коэффициент мышцы (по умолчанию 1)
 * @returns уровень крепатуры
 */
export function calculateSorenessLevel(
  sets: number,
  lastWorkoutDate: Date,
  muscleCoefficient: number = 1,
): SorenessLevel {
  const today = new Date();
  const timeDiff = today.getTime() - lastWorkoutDate.getTime();
  const daysDiff = timeDiff / (1000 * 3600 * 24);

  if (daysDiff <= 0.1) {
    if (sets > 4) return 'strong';
    else if (sets > 3) return 'medium';
    else if (sets > 2) return 'weak';
    else return 'none';
  }

  // Применяем коэффициент мышцы к количеству сетов
  const s = (sets * muscleCoefficient) / daysDiff;

  if (s > 4) return 'strong';
  else if (s > 3) return 'medium';
  else if (s > 2) return 'weak';
  else return 'none';
}

/**
 * Расчет прогнозного максимума на 1 повторение (1RM)
 * Формула зависит от количества повторений:
 * - до 10 повторов включительно: 1rm = m * (36 / (37 - n))
 * - после 10 до 16: 1rm = (m * n * 0.0333) + m
 * - 16 включительно и больше: 1rm = (100 * m) / (101.3 - 2.67123 * n)
 *
 * @param weight - вес (m)
 * @param reps - повторения (n)
 * @returns прогнозный максимум на 1 повторение
 */
export function calculatePredicted1RM(weight: number, reps: number): number {
  if (reps <= 10) {
    return weight * (36 / (37 - reps));
  } else if (reps < 16) {
    return (weight * reps * 0.0333) + weight;
  } else {
    return (100 * weight) / (101.3 - 2.67123 * reps);
  }
}
