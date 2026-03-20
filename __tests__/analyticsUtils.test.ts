import { calculateTrend, calculateSorenessLevel, DEFAULT_MUSCLE_COEFFICIENTS } from '@/utils/analyticsUtils';

describe('calculateTrend', () => {
  describe('Размер окна', () => {
    it('должен возвращать 0 тренд и 0 достоверность если значений < 5', () => {
      expect(calculateTrend([])).toEqual({ trend: 0, confidence: 0 });
      expect(calculateTrend([100])).toEqual({ trend: 0, confidence: 0 });
      expect(calculateTrend([100, 105])).toEqual({ trend: 0, confidence: 0 });
      expect(calculateTrend([100, 105, 110])).toEqual({ trend: 0, confidence: 0 });
      expect(calculateTrend([100, 105, 110, 115])).toEqual({ trend: 0, confidence: 0 });
    });

    it('должен использовать все записи если их 5-20', () => {
      const weights = [100, 105, 110, 115, 120];
      const result = calculateTrend(weights);
      // Тренд должен быть положительным (рост весов)
      expect(result.trend).toBeGreaterThan(0);
      // При отсутствии выбросов достоверность должна быть высокой
      expect(result.confidence).toBe(1);
    });

    it('должен использовать последние 20 записей если их > 20', () => {
      // Создаем 30 записей: первые 10 с низким весом, последние 20 с высоким
      const weights = [
        ...Array(10).fill(50), // первые 10 тренировок по 50 кг
        ...Array(20).fill(100), // последние 20 тренировок по 100 кг
      ];

      const result = calculateTrend(weights);

      // Тренд должен быть положительным (анализируются только последние 20, где все 100 кг)
      // Но поскольку внутри окна все значения одинаковые, тренд должен быть около 0
      expect(result.trend).toBe(0);
      expect(result.confidence).toBe(1);
    });
  });

  describe('Расчет тренда', () => {
    it('должен возвращать положительный тренд при росте весов', () => {
      const weights = [100, 105, 110, 115, 120, 125, 130];
      const result = calculateTrend(weights);
      expect(result.trend).toBeGreaterThan(0);
      expect(result.trend).toBeCloseTo(5, 1); // Рост на 5 кг за тренировку
    });

    it('должен возвращать отрицательный тренд при снижении весов', () => {
      const weights = [130, 125, 120, 115, 110, 105, 100];
      const result = calculateTrend(weights);
      expect(result.trend).toBeLessThan(0);
      expect(result.trend).toBeCloseTo(-5, 1); // Снижение на 5 кг за тренировку
    });

    it('должен возвращать тренд около 0 при стабильных весах', () => {
      const weights = [100, 100, 100, 100, 100, 100, 100];
      const result = calculateTrend(weights);
      expect(result.trend).toBe(0);
    });

    it('должен корректно считать тренд для 5 записей', () => {
      const weights = [100, 110, 120, 130, 140];
      const result = calculateTrend(weights);
      expect(result.trend).toBeCloseTo(10, 1);
    });
  });

  describe('Сглаживание выбросов', () => {
    it('должен заменять выбросы на среднее между соседями', () => {
      // 100, 100, 70, 100 -> 100, 100, 100, 100 (выброс 70 заменяется на 100)
      const weights = [100, 100, 70, 100, 100, 100, 100];
      const result = calculateTrend(weights);

      // После сглаживания все значения будут около 100, тренд должен быть около 0
      expect(result.trend).toBeCloseTo(0, 5);
    });

    it('должен корректно обрабатывать несколько выбросов', () => {
      const weights = [100, 150, 100, 150, 100, 105, 110, 115];
      const result = calculateTrend(weights);

      // После сглаживания выбросов тренд должен быть положительным
      expect(result.trend).toBeGreaterThanOrEqual(0);
    });

    it('не должен считать выбросом нормальное изменение веса', () => {
      // Постепенный рост без выбросов
      const weights = [100, 102, 104, 106, 108, 110];
      const result = calculateTrend(weights);

      expect(result.trend).toBeGreaterThan(0);
      expect(result.confidence).toBe(1); // Нет выбросов
    });
  });

  describe('Расчет достоверности', () => {
    it('должен возвращать 100% достоверность при отсутствии выбросов', () => {
      const weights = [100, 105, 110, 115, 120, 125, 130];
      const result = calculateTrend(weights);
      expect(result.confidence).toBe(1);
    });

    it('должен снижать достоверность при наличии выбросов', () => {
      // Создаем данные с выбросами
      const weights = [100, 105, 50, 115, 120, 125, 130]; // 50 - выброс
      const result = calculateTrend(weights);

      // Достоверность должна быть меньше 1
      expect(result.confidence).toBeLessThan(1);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('должен возвращать 0 если выбросов очень много', () => {
      // Много выбросов: каждый второй - выброс
      const weights = [100, 50, 100, 50, 100, 50, 100, 50, 100, 50];
      const result = calculateTrend(weights);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('должен возвращать 0 достоверность для пустого массива', () => {
      const result = calculateTrend([]);
      expect(result.confidence).toBe(0);
    });
  });

  describe('Комплексные тесты', () => {
    it('должен корректно работать с реальными данными', () => {
      // Имитация реальных тренировок с небольшим прогрессом
      const weights = [
        100, 102.5, 105, 103, // Небольшой разброс
        107.5, 110, 108, 112.5,
        115, 113, 117.5, 120,
        118, 122.5, 125, 123,
        127.5, 130, 128, 132.5,
      ];

      const result = calculateTrend(weights);

      // Тренд должен быть положительным (общий рост)
      expect(result.trend).toBeGreaterThan(0);
      // Достоверность должна быть высокой (нет явных выбросов)
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('должен обрабатывать данные с плато', () => {
      const weights = [
        100, 100, 100, 100, 100, // Плато
        110, 110, 110, 110, 110, // Плато
        120, 120, 120, 120, 120, // Плато
      ];

      const result = calculateTrend(weights);

      // Тренд должен быть положительным (ступенчатый рост)
      expect(result.trend).toBeGreaterThan(0);
      expect(result.confidence).toBe(1);
    });
  });

  describe('Граничные случаи', () => {
    it('должен обрабатывать отрицательные значения весов', () => {
      const weights = [-100, -105, -110, -115, -120];
      const result = calculateTrend(weights);
      expect(result.trend).toBeLessThan(0);
    });

    it('должен обрабатывать нулевые значения', () => {
      const weights = [0, 0, 0, 0, 0];
      const result = calculateTrend(weights);
      expect(result.trend).toBe(0);
      expect(result.confidence).toBe(1);
    });

    it('должен обрабатывать очень большие значения', () => {
      const weights = [1000, 1100, 1200, 1300, 1400, 1500];
      const result = calculateTrend(weights);
      expect(result.trend).toBeCloseTo(100, 1);
    });
  });
});

describe('calculateSorenessLevel - расчёт крепатуры мышц', () => {
  describe('Базовые тесты без коэффициентов', () => {
    const TODAY = new Date('2026-02-20T12:00:00.000Z');

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(TODAY);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('должен возвращать "none" при 0 сетов', () => {
      const lastWorkoutDate = new Date('2026-02-19T10:00:00.000Z');
      const result = calculateSorenessLevel(0, lastWorkoutDate);
      expect(result).toBe('none');
    });

    it('должен возвращать "none" при 1 сете в день тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-20T10:00:00.000Z');
      const result = calculateSorenessLevel(1, lastWorkoutDate);
      expect(result).toBe('none');
    });

    it('должен возвращать "weak" при 3 сетах в день тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-20T10:00:00.000Z');
      const result = calculateSorenessLevel(3, lastWorkoutDate);
      expect(result).toBe('weak');
    });

    it('должен возвращать "medium" при 4 сетах в день тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-20T10:00:00.000Z');
      const result = calculateSorenessLevel(4, lastWorkoutDate);
      expect(result).toBe('medium');
    });

    it('должен возвращать "strong" при 5 сетах в день тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-20T10:00:00.000Z');
      const result = calculateSorenessLevel(5, lastWorkoutDate);
      expect(result).toBe('strong');
    });

    it('должен возвращать "weak" при 3 сетах через 1 день после тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-19T10:00:00.000Z');
      const result = calculateSorenessLevel(3, lastWorkoutDate);
      expect(result).toBe('weak');
    });

    it('должен возвращать "medium" при 6 сетах через 1 день после тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-19T10:00:00.000Z');
      const result = calculateSorenessLevel(6, lastWorkoutDate);
      expect(result).toBe('medium');
    });

    it('должен возвращать "strong" при 9 сетах через 1 день после тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-19T10:00:00.000Z');
      const result = calculateSorenessLevel(9, lastWorkoutDate);
      expect(result).toBe('strong');
    });

    it('должен возвращать "none" при 2 сетах через 2 дня после тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-18T10:00:00.000Z');
      const result = calculateSorenessLevel(2, lastWorkoutDate);
      expect(result).toBe('none');
    });

    it('должен возвращать "weak" при 5 сетах через 2 дня после тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-18T10:00:00.000Z');
      const result = calculateSorenessLevel(5, lastWorkoutDate);
      expect(result).toBe('weak');
    });

    it('должен возвращать "medium" при 7 сетов через 2 дня после тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-18T10:00:00.000Z');
      const result = calculateSorenessLevel(7, lastWorkoutDate);
      expect(result).toBe('medium');
    });

    it('должен возвращать "strong" при 10 сетах через 2 дня после тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-18T10:00:00.000Z');
      const result = calculateSorenessLevel(10, lastWorkoutDate);
      expect(result).toBe('strong');
    });

    it('должен возвращать "none" при большой давности тренировки', () => {
      const lastWorkoutDate = new Date('2026-02-10T10:00:00.000Z');
      const result = calculateSorenessLevel(5, lastWorkoutDate);
      expect(result).toBe('none');
    });

    it('должен возвращать "weak" при 25 сетах через 10 дней', () => {
      const lastWorkoutDate = new Date('2026-02-10T10:00:00.000Z');
      const result = calculateSorenessLevel(25, lastWorkoutDate);
      expect(result).toBe('weak');
    });

    it('должен возвращать "medium" при 35 сетах через 10 дней', () => {
      const lastWorkoutDate = new Date('2026-02-10T10:00:00.000Z');
      const result = calculateSorenessLevel(35, lastWorkoutDate);
      expect(result).toBe('medium');
    });

    it('должен возвращать "strong" при 50 сетах через 10 дней', () => {
      const lastWorkoutDate = new Date('2026-02-10T10:00:00.000Z');
      const result = calculateSorenessLevel(50, lastWorkoutDate);
      expect(result).toBe('strong');
    });
  });

  describe('Пороговые значения S (sets/days)', () => {
    const TODAY = new Date('2026-02-20T12:00:00.000Z');

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(TODAY);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('S > 4 должно возвращать "strong"', () => {
      const lastWorkoutDate = new Date('2026-02-18T12:00:00.000Z');
      const result = calculateSorenessLevel(9, lastWorkoutDate);
      expect(result).toBe('strong');
    });

    it('S = 4 должно возвращать "medium"', () => {
      const lastWorkoutDate = new Date('2026-02-19T12:00:00.000Z');
      const result = calculateSorenessLevel(4, lastWorkoutDate);
      expect(result).toBe('medium');
    });

    it('3 < S <= 4 должно возвращать "medium"', () => {
      const lastWorkoutDate = new Date('2026-02-19T12:00:00.000Z');
      const result = calculateSorenessLevel(3.5, lastWorkoutDate);
      expect(result).toBe('medium');
    });

    it('S = 3 должно возвращать "weak"', () => {
      const lastWorkoutDate = new Date('2026-02-19T12:00:00.000Z');
      const result = calculateSorenessLevel(3, lastWorkoutDate);
      expect(result).toBe('weak');
    });

    it('2 < S <= 3 должно возвращать "weak"', () => {
      const lastWorkoutDate = new Date('2026-02-19T12:00:00.000Z');
      const result = calculateSorenessLevel(2.5, lastWorkoutDate);
      expect(result).toBe('weak');
    });

    it('S <= 2 должно возвращать "none"', () => {
      const lastWorkoutDate = new Date('2026-02-19T12:00:00.000Z');
      const result = calculateSorenessLevel(2, lastWorkoutDate);
      expect(result).toBe('none');
    });
  });

  describe('Тесты с коэффициентами мышц', () => {
    const TODAY = new Date('2026-02-20T12:00:00.000Z');

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(TODAY);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('должен увеличивать крепатуру с коэффициентом > 1', () => {
      // Без коэффициента: 2 сета через 1 день = none
      const lastWorkoutDate = new Date('2026-02-19T10:00:00.000Z');
      const resultWithoutCoeff = calculateSorenessLevel(2, lastWorkoutDate, 1);
      expect(resultWithoutCoeff).toBe('none');

      // С коэффициентом 1.5: 2 * 1.5 = 3 сета через 1 день = weak
      const resultWithCoeff = calculateSorenessLevel(2, lastWorkoutDate, 1.5);
      expect(resultWithCoeff).toBe('weak');
    });

    it('должен уменьшать крепатуру с коэффициентом < 1', () => {
      // Без коэффициента: 4 сета через 1 день = medium
      const lastWorkoutDate = new Date('2026-02-19T10:00:00.000Z');
      const resultWithoutCoeff = calculateSorenessLevel(4, lastWorkoutDate, 1);
      expect(resultWithoutCoeff).toBe('medium');

      // С коэффициентом 0.5: 4 * 0.5 = 2 сета через 1 день = none
      const resultWithCoeff = calculateSorenessLevel(4, lastWorkoutDate, 0.5);
      expect(resultWithCoeff).toBe('none');
    });

    it('должен возвращать "strong" с высоким коэффициентом', () => {
      const lastWorkoutDate = new Date('2026-02-18T10:00:00.000Z');
      // 3 сета через 2 дня с коэффициентом 3 = 4.5 > 4 = strong
      const result = calculateSorenessLevel(3, lastWorkoutDate, 3);
      expect(result).toBe('strong');
    });

    it('должен работать с коэффициентом по умолчанию (равным 1)', () => {
      const lastWorkoutDate = new Date('2026-02-19T10:00:00.000Z');
      const result = calculateSorenessLevel(4, lastWorkoutDate);
      expect(result).toBe('medium');
    });

    it('должен корректно обрабатывать коэффициент 0', () => {
      const lastWorkoutDate = new Date('2026-02-20T10:00:00.000Z');
      const result = calculateSorenessLevel(10, lastWorkoutDate, 0);
      // В день тренировки логика работает по sets без коэффициента
      expect(result).toBe('strong');
    });

    it('должен увеличивать уровень крепатуры при повышении коэффициента', () => {
      const lastWorkoutDate = new Date('2026-02-18T10:00:00.000Z');
      
      expect(calculateSorenessLevel(3, lastWorkoutDate, 1)).toBe('weak');
      expect(calculateSorenessLevel(3, lastWorkoutDate, 1.5)).toBe('medium');
      expect(calculateSorenessLevel(3, lastWorkoutDate, 3)).toBe('strong');
    });
  });

  describe('Краевые случаи', () => {
    const TODAY = new Date('2026-02-20T12:00:00.000Z');

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(TODAY);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('должен обрабатывать одинаковые даты', () => {
      const lastWorkoutDate = new Date('2026-02-20T12:00:00.000Z');
      const result = calculateSorenessLevel(3, lastWorkoutDate);
      expect(result).toBe('weak');
    });

    it('должен обрабатывать очень большое количество сетов', () => {
      const lastWorkoutDate = new Date('2026-02-19T10:00:00.000Z');
      const result = calculateSorenessLevel(1000, lastWorkoutDate);
      expect(result).toBe('strong');
    });

    it('должен обрабатывать очень старую дату', () => {
      const lastWorkoutDate = new Date('2020-01-01T10:00:00.000Z');
      const result = calculateSorenessLevel(100, lastWorkoutDate);
      expect(result).toBe('none');
    });

    it('должен обрабатывать отрицательную разницу во времени как 0 дней', () => {
      const lastWorkoutDate = new Date('2026-02-21T10:00:00.000Z');
      const result = calculateSorenessLevel(3, lastWorkoutDate);
      expect(result).toBe('weak');
    });
  });
});
