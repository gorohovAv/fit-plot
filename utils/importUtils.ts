import useStore, { Exercise, Result, Training } from "@/store/store";
import { EXERCISE_LIST } from "@/constants/exerciseList";

export type ValidationResult = {
  status: "empty" | "valid" | "invalid";
  errorMessage?: string;
  warningMessage?: string;
};

export function validateImport(text: string): ValidationResult {
  if (!text.trim()) {
    return { status: "empty" };
  }

  const lines = text.split("\n").filter((line) => line.trim());
  let currentExercise = "";
  let hasResults = false;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    const trimmedLine = line.trim();

    if (!trimmedLine) continue;

    if (trimmedLine.match(/^\d+\)/)) {
      continue;
    }

    if (
      !trimmedLine.match(/^\d+х\d+/) &&
      !trimmedLine.match(/^\d{2}\.\d{2}\.\d{4}$/)
    ) {
      const exerciseExists = EXERCISE_LIST.some(
        (ex) => ex.name.toLowerCase() === trimmedLine.toLowerCase()
      );

      if (!exerciseExists) {
        return {
          status: "invalid",
          errorMessage: `Строка ${lineNumber}: Неизвестное упражнение "${trimmedLine}"`,
        };
      }

      currentExercise = trimmedLine;
    } else if (trimmedLine.match(/^\d+х\d+/)) {
      const parts = trimmedLine.split(" ");
      if (parts.length < 2) {
        return {
          status: "invalid",
          errorMessage: `Строка ${lineNumber}: Неверный формат результата "${trimmedLine}"`,
        };
      }

      const weightReps = parts[0];
      const date = parts[1];

      if (!weightReps.match(/^\d+х\d+$/)) {
        return {
          status: "invalid",
          errorMessage: `Строка ${lineNumber}: Неверный формат веса и повторений "${weightReps}"`,
        };
      }

      if (!date.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        return {
          status: "invalid",
          errorMessage: `Строка ${lineNumber}: Неверный формат даты "${date}"`,
        };
      }

      hasResults = true;
    }
  }

  if (!hasResults) {
    return {
      status: "invalid",
      errorMessage: "Не найдено ни одного результата для импорта",
    };
  }

  return { status: "valid" };
}

export function importData(text: string): void {
  const store = useStore.getState();
  const lines = text.split("\n").filter((line) => line.trim());

  let currentExercise = "";
  let currentTraining = "";
  let exercises: Exercise[] = [];
  let results: Result[] = [];
  let trainingSections: { name: string; exercises: string[] }[] = [];
  let currentSection: { name: string; exercises: string[] } | null = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (trimmedLine.match(/^Тренировка\s+/)) {
      if (currentSection) {
        trainingSections.push(currentSection);
      }
      currentSection = { name: trimmedLine, exercises: [] };
    } else if (trimmedLine.match(/^\d+\)/)) {
      if (currentSection) {
        currentSection.exercises.push(trimmedLine.replace(/^\d+\)\s*/, ""));
      }
    } else if (
      !trimmedLine.match(/^\d+х\d+/) &&
      !trimmedLine.match(/^\d{2}\.\d{2}\.\d{4}$/)
    ) {
      const exerciseData = EXERCISE_LIST.find(
        (ex) => ex.name.toLowerCase() === trimmedLine.toLowerCase()
      );

      if (exerciseData) {
        const exercise: Exercise = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: exerciseData.name,
          muscleGroup: exerciseData.muscleGroup,
          type: exerciseData.type,
          unilateral: exerciseData.unilateral,
          amplitude: exerciseData.amplitude,
        };
        exercises.push(exercise);
        currentExercise = exercise.id;
      }
    } else if (trimmedLine.match(/^\d+х\d+/)) {
      const parts = trimmedLine.split(" ");
      if (parts.length >= 2 && currentExercise) {
        const [weightReps, date] = parts;
        const [weight, reps] = weightReps.split("х").map(Number);

        const result: Result = {
          exerciseId: currentExercise,
          weight,
          reps,
          date,
          amplitude: "full",
        };
        results.push(result);
      }
    }
  }

  if (currentSection) {
    trainingSections.push(currentSection);
  }

  if (trainingSections.length > 0) {
    trainingSections.forEach((section, index) => {
      const training: Training = {
        id: Date.now().toString() + index,
        name: section.name,
        exercises: exercises.filter((ex) =>
          section.exercises.some(
            (sectionEx) => sectionEx.toLowerCase() === ex.name.toLowerCase()
          )
        ),
        results: results.filter((result) =>
          section.exercises.some((sectionEx) => {
            const exercise = exercises.find(
              (ex) => ex.id === result.exerciseId
            );
            return (
              exercise &&
              sectionEx.toLowerCase() === exercise.name.toLowerCase()
            );
          })
        ),
        plannedResults: [],
      };

      if (training.exercises.length > 0) {
        store.addTraining("Основной план", training);
      }
    });
  } else {
    const training: Training = {
      id: Date.now().toString(),
      name: "Импортированная тренировка",
      exercises,
      results,
      plannedResults: [],
    };

    if (training.exercises.length > 0) {
      store.addTraining("Основной план", training);
    }
  }
}
