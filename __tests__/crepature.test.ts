// @ts-nocheck
import { calculateSorenessLevel } from "../components/Crepature";

describe('Crepature - расчёт крепатуры мышц', () => {

  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateSorenessLevel', () => {
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

    it('должен обрабатывать отрицательную разницу во времени как 0 дней', () => {
      const lastWorkoutDate = new Date('2026-02-21T10:00:00.000Z');
      const result = calculateSorenessLevel(3, lastWorkoutDate);
      expect(result).toBe('weak');
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
  });
});
