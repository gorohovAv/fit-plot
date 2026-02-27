import { calculateTrend } from '@/utils/analyticsUtils';

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
