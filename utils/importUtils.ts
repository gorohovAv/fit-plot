import useCaloriesStore from "@/store/calloriesStore";
import * as dbLayer from "@/store/dbLayer";
import { Exercise, Plan, Training } from "@/store/store";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";

export interface ExportData {
  plans: Plan[];
  calories: { date: string; calories: number; weight: number }[];
}

interface PlansDataRow {
  Plan: string;
  Training: string;
  Exercise: string;
  MuscleGroup: string;
  Type: string;
  Unilateral: string;
  Amplitude: string;
  Comment: string;
  Timer: string;
}

interface ResultsDataRow {
  Plan: string;
  Training: string;
  Exercise: string;
  Weight: number;
  Reps: number;
  Date: string;
  Amplitude: string;
}

interface CaloriesDataRow {
  Date: string;
  Calories: number;
  Weight: number;
}

export async function exportToExcel(data: ExportData): Promise<void> {
  const workbook = XLSX.utils.book_new();

  const plansData: PlansDataRow[] = [];
  const resultsData: ResultsDataRow[] = [];
  const caloriesData: CaloriesDataRow[] = [];

  data.plans.forEach((plan) => {
    plan.trainings.forEach((training) => {
      training.exercises.forEach((exercise, index) => {
        plansData.push({
          Plan: plan.planName,
          Training: training.name,
          Exercise: exercise.name,
          MuscleGroup: exercise.muscleGroup,
          Type: exercise.type,
          Unilateral: exercise.unilateral ? "Yes" : "No",
          Amplitude: exercise.amplitude,
          Comment: exercise.comment || "",
          Timer: exercise.timerDuration?.toString() || "",
        });
      });
    });
  });

  data.plans.forEach((plan) => {
    plan.trainings.forEach((training) => {
      training.results.forEach((result) => {
        const exercise = training.exercises.find(
          (ex) => ex.id === result.exerciseId,
        );
        resultsData.push({
          Plan: plan.planName,
          Training: training.name,
          Exercise: exercise?.name || "Unknown",
          Weight: result.weight,
          Reps: result.reps,
          Date: result.date,
          Amplitude: result.amplitude,
        });
      });
    });
  });

  data.calories.forEach((entry) => {
    caloriesData.push({
      Date: entry.date,
      Calories: entry.calories,
      Weight: entry.weight,
    });
  });

  const plansSheet = XLSX.utils.json_to_sheet(plansData);
  const resultsSheet = XLSX.utils.json_to_sheet(resultsData);
  const caloriesSheet = XLSX.utils.json_to_sheet(caloriesData);

  XLSX.utils.book_append_sheet(workbook, plansSheet, "Plans and Exercises");
  XLSX.utils.book_append_sheet(workbook, resultsSheet, "Results");
  XLSX.utils.book_append_sheet(workbook, caloriesSheet, "Calories and Weight");

  const wbout = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
  const uri = FileSystem.documentDirectory + "fitplot_export.xlsx";

  await FileSystem.writeAsStringAsync(uri, wbout, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri);
  }
}

export function exportToText(data: ExportData): string {
  let text = "";

  data.plans.forEach((plan) => {
    plan.trainings.forEach((training) => {
      text += `${training.name}\n`;

      training.exercises.forEach((exercise, index) => {
        text += `${index + 1}) ${exercise.name}\n`;
      });

      text += "\n";
    });
  });

  text += "\n";

  data.plans.forEach((plan) => {
    plan.trainings.forEach((training) => {
      training.exercises.forEach((exercise) => {
        const exerciseResults = training.results.filter(
          (result) => result.exerciseId === exercise.id,
        );

        if (exerciseResults.length > 0) {
          text += `${exercise.name}\n`;

          exerciseResults.forEach((result) => {
            text += `${result.weight}х${result.reps} ${result.date}\n`;
          });

          text += "\n";
        }
      });
    });
  });

  if (data.calories.length > 0) {
    text += "CALORIES\n";
    data.calories.forEach((entry) => {
      text += `${entry.weight}kg ${entry.calories} kcal ${entry.date}\n`;
    });
  }

  return text;
}

export async function exportDataToFile(
  data: ExportData,
  format: "excel" | "text",
): Promise<void> {
  if (format === "excel") {
    await exportToExcel(data);
  } else {
    const text = exportToText(data);
    const uri = FileSystem.documentDirectory + "fitplot_export.txt";

    await FileSystem.writeAsStringAsync(uri, text, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  }
}

export function getExportData(): ExportData {
  const store = useStore.getState();
  const caloriesStore = useCaloriesStore.getState();

  return {
    plans: store.plans,
    calories: caloriesStore.entries,
  };
}

export interface ValidationResult {
  status: "empty" | "valid" | "invalid";
  errorMessage?: string;
  warningMessage?: string;
}

export function validateImport(text: string): ValidationResult {
  if (!text.trim()) {
    return { status: "empty" };
  }

  const lines = text.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    return { status: "empty" };
  }

  let hasValidData = false;
  let hasErrors = false;
  let errorMessages: string[] = [];
  let warningMessages: string[] = [];
  let inNutritionSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const upperLine = trimmedLine.toUpperCase();
    if (
      upperLine === "ПИТАНИЕ" ||
      upperLine === "NUTRITION" ||
      upperLine === "КАЛЛОРАЖ"
    ) {
      inNutritionSection = true;
      hasValidData = true;
      continue;
    }

    if (inNutritionSection) {
      const nutritionMatch = trimmedLine.match(
        /^(\d+)\s+(ккал|kcal)\s+(\d+(?:[.,]\d+)?)\s+(кг|kg)\s+(\d{1,2}\.\d{1,2}\.\d{4})$/,
      );
      if (nutritionMatch) {
        const calories = parseInt(nutritionMatch[1]);
        const weightStr = nutritionMatch[3].replace(",", ".");
        const weight = parseFloat(weightStr);
        const dateStr = nutritionMatch[5];

        if (calories > 0 && weight > 0) {
          hasValidData = true;
          continue;
        }
      }

      hasErrors = true;
      errorMessages.push(
        `Неверный формат строки в секции питания: ${trimmedLine}`,
      );
      continue;
    }

    const isExerciseName =
      !trimmedLine.includes("х") &&
      !trimmedLine.includes("x") &&
      !trimmedLine.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/) &&
      !trimmedLine.match(/^\d+[.,]?\d*\s*x\s*\d+[.,]?\d*/i);

    if (isExerciseName) {
      hasValidData = true;
      continue;
    }

    const parts = trimmedLine.split(/\s+/);
    let hasValidFormat = false;

    for (const part of parts) {
      if (part.includes("х") || part.includes("x")) {
        const weightReps = part.split(/[хx]/);
        if (weightReps.length === 2) {
          const weightStr = weightReps[0].replace(",", ".");
          const repsStr = weightReps[1].replace(",", ".");
          const weight = parseFloat(weightStr);
          const reps = parseFloat(repsStr);

          if (!isNaN(weight) && !isNaN(reps) && weight >= 0 && reps > 0) {
            hasValidFormat = true;
            hasValidData = true;
          }
        }
      } else if (part.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
        hasValidFormat = true;
        hasValidData = true;
      } else if (
        part.length > 0 &&
        !part.match(/^\d+$/) &&
        !part.includes("х") &&
        !part.includes("x")
      ) {
        hasValidFormat = true;
      }
    }

    if (!hasValidFormat && trimmedLine.length > 0) {
      hasErrors = true;
      errorMessages.push(`Неверный формат строки: ${trimmedLine}`);
    }
  }

  if (hasErrors) {
    return {
      status: "invalid",
      errorMessage: errorMessages.join("\n"),
    };
  }

  if (hasValidData) {
    return {
      status: "valid",
      warningMessage:
        warningMessages.length > 0 ? warningMessages.join("\n") : undefined,
    };
  }

  return {
    status: "invalid",
    errorMessage: "Не найдены данные для импорта",
  };
}

export async function importData(text: string): Promise<void> {
  const lines = text.split("\n").filter((line) => line.trim());

  let currentExercise = "";
  let importedPlan: Plan | null = null;
  let importedTraining: Training | null = null;
  let exerciseMap = new Map<string, Exercise>();
  let inNutritionSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const upperLine = trimmedLine.toUpperCase();
    if (
      upperLine === "ПИТАНИЕ" ||
      upperLine === "NUTRITION" ||
      upperLine === "КАЛЛОРАЖ"
    ) {
      inNutritionSection = true;
      continue;
    }

    if (inNutritionSection) {
      const nutritionMatch = trimmedLine.match(
        /^(\d+)\s+(ккал|kcal)\s+(\d+(?:[.,]\d+)?)\s+(кг|kg)\s+(\d{1,2}\.\d{1,2}\.\d{4})$/,
      );
      if (nutritionMatch) {
        const calories = parseInt(nutritionMatch[1]);
        const weightStr = nutritionMatch[3].replace(",", ".");
        const weight = parseFloat(weightStr);
        const dateStr = nutritionMatch[5];

        const [day, month, year] = dateStr.split(".");
        const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0",
        )}`;

        if (calories > 0 && weight > 0) {
          // Сохраняем напрямую в БД
          await dbLayer.saveCalorieEntry(formattedDate, calories, weight);
        }
      }
      continue;
    }

    const isExerciseName =
      !trimmedLine.includes("х") &&
      !trimmedLine.includes("x") &&
      !trimmedLine.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/) &&
      !trimmedLine.match(/^\d+[.,]?\d*\s*x\s*\d+[.,]?\d*/i);

    if (isExerciseName) {
      currentExercise = trimmedLine;

      if (!importedPlan) {
        const planName = `Импортированный план ${new Date().toLocaleDateString()}`;
        importedPlan = {
          planName: planName,
          trainings: [],
        };

        await dbLayer.savePlan(planName);
      }

      if (!importedTraining) {
        const trainingId =
          Date.now().toString() + Math.random().toString(36).substr(2, 9);
        importedTraining = {
          id: trainingId,
          name: "Импортированная тренировка",
          exercises: [],
          results: [],
          plannedResults: [],
        };

        await dbLayer.saveTraining(
          trainingId,
          importedPlan.planName,
          importedTraining.name,
        );
      }
      continue;
    }

    if (currentExercise) {
      const parts = trimmedLine.split(/\s+/);
      const datePart = parts[parts.length - 1];

      if (datePart.match(/^\d{1,2}\.\d{1,2}\.\d{4}$/)) {
        const [day, month, year] = datePart.split(".");
        const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];

          if (part.includes("х") || part.includes("x")) {
            const weightReps = part.split(/[хx]/);
            if (weightReps.length === 2) {
              const weightStr = weightReps[0].replace(",", ".");
              const repsStr = weightReps[1].replace(",", ".");
              const weight = parseFloat(weightStr);
              const reps = parseFloat(repsStr);

              if (!isNaN(weight) && !isNaN(reps) && weight >= 0 && reps > 0) {
                if (currentExercise && importedTraining) {
                  let exercise = exerciseMap.get(currentExercise);
                  if (!exercise) {
                    exercise = {
                      id:
                        Date.now().toString() +
                        Math.random().toString(36).substr(2, 9),
                      name: currentExercise,
                      muscleGroup: "chest",
                      type: "free weight",
                      unilateral: false,
                      amplitude: "full",
                    };
                    exerciseMap.set(currentExercise, exercise);
                    importedTraining.exercises.push(exercise);

                    await dbLayer.saveExercise({
                      ...exercise,
                      trainingId: importedTraining.id,
                    });
                  }

                  await dbLayer.saveResult({
                    exerciseId: exercise.id,
                    weight: weight,
                    reps: Math.round(reps),
                    date: formattedDate,
                    amplitude: "full",
                    isPlanned: false,
                  });
                }
              }
            }
          }
        }
      }
    }
  }
}
