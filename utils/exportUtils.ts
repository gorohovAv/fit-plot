import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import useStore, { Plan, Exercise, Result } from "@/store/store";
import useCaloriesStore from "@/store/calloriesStore";

export interface ExportData {
  plans: Plan[];
  calories: { date: string; calories: number; weight: number }[];
}

export async function exportToExcel(data: ExportData): Promise<void> {
  const workbook = XLSX.utils.book_new();

  const plansData = [];
  const resultsData = [];
  const caloriesData = [];

  data.plans.forEach((plan) => {
    plan.trainings.forEach((training) => {
      training.exercises.forEach((exercise, index) => {
        plansData.push({
          План: plan.planName,
          Тренировка: training.name,
          Упражнение: exercise.name,
          "Группа мышц": exercise.muscleGroup,
          Тип: exercise.type,
          Одностороннее: exercise.unilateral ? "Да" : "Нет",
          Амплитуда: exercise.amplitude,
          Комментарий: exercise.comment || "",
          "Таймер (сек)": exercise.timerDuration || "",
        });
      });
    });
  });

  data.plans.forEach((plan) => {
    plan.trainings.forEach((training) => {
      training.results.forEach((result) => {
        const exercise = training.exercises.find(
          (ex) => ex.id === result.exerciseId
        );
        resultsData.push({
          План: plan.planName,
          Тренировка: training.name,
          Упражнение: exercise?.name || "Неизвестно",
          "Вес (кг)": result.weight,
          Повторения: result.reps,
          Дата: result.date,
          Амплитуда: result.amplitude,
        });
      });
    });
  });

  data.calories.forEach((entry) => {
    caloriesData.push({
      Дата: entry.date,
      Калории: entry.calories,
      "Вес (кг)": entry.weight,
    });
  });

  const plansSheet = XLSX.utils.json_to_sheet(plansData);
  const resultsSheet = XLSX.utils.json_to_sheet(resultsData);
  const caloriesSheet = XLSX.utils.json_to_sheet(caloriesData);

  XLSX.utils.book_append_sheet(workbook, plansSheet, "Планы и упражнения");
  XLSX.utils.book_append_sheet(workbook, resultsSheet, "Результаты");
  XLSX.utils.book_append_sheet(workbook, caloriesSheet, "Калории и вес");

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
          (result) => result.exerciseId === exercise.id
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
    text += "КАЛЛОРАЖ\n";
    data.calories.forEach((entry) => {
      text += `${entry.weight}кг ${entry.calories} ккал ${entry.date}\n`;
    });
  }

  return text;
}

export async function exportDataToFile(
  data: ExportData,
  format: "excel" | "text"
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
