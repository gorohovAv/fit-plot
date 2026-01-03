import useCaloriesStore from "@/store/calloriesStore";
import useSettingsStore from "@/store/settingsStore";
import useStore, { MuscleGroup, Plan, Result } from "@/store/store";
import { getTranslation } from "@/utils/localization";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
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
          (ex) => ex.id === result.exerciseId
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
    text += "CALORIES\n";
    data.calories.forEach((entry) => {
      text += `${entry.weight}kg ${entry.calories} kcal ${entry.date}\n`;
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

type PDFExerciseData = {
  exerciseId: string;
  exerciseName: string;
  weightData: number[];
  tonnageData: number[];
  repsData: number[];
};

type PDFMetrics = {
  totalSets: number;
  setsByMuscleGroup: Record<MuscleGroup, number>;
};

function getDayString(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function preparePDFData(data: ExportData): {
  metrics: PDFMetrics;
  exercises: PDFExerciseData[];
  uniqueDates: string[];
} {
  const allResults: Result[] = [];
  const exerciseMap = new Map<
    string,
    { name: string; muscleGroup: MuscleGroup }
  >();

  data.plans.forEach((plan) => {
    plan.trainings.forEach((training) => {
      training.exercises.forEach((exercise) => {
        exerciseMap.set(exercise.id, {
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
        });
      });

      training.results.forEach((result) => {
        allResults.push(result);
      });
    });
  });

  const uniqueDates = Array.from(
    new Set(allResults.map((r) => getDayString(r.date)))
  ).sort();

  const metrics: PDFMetrics = {
    totalSets: allResults.length,
    setsByMuscleGroup: {
      chest: 0,
      triceps: 0,
      biceps: 0,
      forearms: 0,
      delts: 0,
      back: 0,
      glutes: 0,
      quads: 0,
      hamstrings: 0,
      calves: 0,
    },
  };

  allResults.forEach((result) => {
    const exercise = exerciseMap.get(result.exerciseId);
    if (exercise) {
      const muscleGroup = exercise.muscleGroup;
      if (metrics.setsByMuscleGroup[muscleGroup] !== undefined) {
        metrics.setsByMuscleGroup[muscleGroup]++;
      }
    }
  });

  const exerciseDataMap = new Map<string, PDFExerciseData>();

  allResults.forEach((result) => {
    const exercise = exerciseMap.get(result.exerciseId);
    if (!exercise) return;

    if (!exerciseDataMap.has(result.exerciseId)) {
      exerciseDataMap.set(result.exerciseId, {
        exerciseId: result.exerciseId,
        exerciseName: exercise.name,
        weightData: [],
        tonnageData: [],
        repsData: [],
      });
    }
  });

  const exercises: PDFExerciseData[] = [];

  exerciseDataMap.forEach((exerciseData) => {
    const exerciseResults = allResults.filter(
      (r) => r.exerciseId === exerciseData.exerciseId
    );

    if (exerciseResults.length === 0) return;

    const groupedByDay = exerciseResults.reduce((acc, result) => {
      const day = getDayString(result.date);
      if (!acc[day]) {
        acc[day] = { tonnage: 0, maxWeight: 0, maxReps: 0 };
      }
      acc[day].tonnage += result.weight * result.reps;
      acc[day].maxWeight = Math.max(acc[day].maxWeight, result.weight);
      acc[day].maxReps = Math.max(acc[day].maxReps, result.reps);
      return acc;
    }, {} as Record<string, { tonnage: number; maxWeight: number; maxReps: number }>);

    const sortedDays = Object.keys(groupedByDay).sort();

    if (sortedDays.length < 10) {
      return;
    }

    const startDate = new Date(sortedDays[0]);
    const endDate = new Date(sortedDays[sortedDays.length - 1]);
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const periodSize = totalDays / 10;

    const periods: {
      start: Date;
      end: Date;
      weight: number;
      tonnage: number;
      reps: number;
    }[] = [];

    for (let i = 0; i < 10; i++) {
      const periodStart = new Date(startDate);
      periodStart.setDate(periodStart.getDate() + i * periodSize);
      const periodEnd = new Date(startDate);
      periodEnd.setDate(periodEnd.getDate() + (i + 1) * periodSize - 1);
      if (i === 9) periodEnd.setTime(endDate.getTime());

      let maxWeight = 0;
      let maxTonnage = 0;
      let maxReps = 0;

      sortedDays.forEach((day) => {
        const dayDate = new Date(day);
        if (dayDate >= periodStart && dayDate <= periodEnd) {
          const dayData = groupedByDay[day];
          maxWeight = Math.max(maxWeight, dayData.maxWeight);
          maxTonnage = Math.max(maxTonnage, dayData.tonnage);
          maxReps = Math.max(maxReps, dayData.maxReps);
        }
      });

      periods.push({
        start: periodStart,
        end: periodEnd,
        weight: maxWeight,
        tonnage: maxTonnage,
        reps: maxReps,
      });
    }

    exerciseData.weightData = periods.map((p) => p.weight);
    exerciseData.tonnageData = periods.map((p) => p.tonnage);
    exerciseData.repsData = periods.map((p) => p.reps);

    exercises.push(exerciseData);
  });

  return { metrics, exercises, uniqueDates };
}

export function hasEnoughDataForPDF(data: ExportData): boolean {
  const allResults: Result[] = [];

  data.plans.forEach((plan) => {
    plan.trainings.forEach((training) => {
      training.results.forEach((result) => {
        allResults.push(result);
      });
    });
  });

  const uniqueDates = Array.from(
    new Set(allResults.map((r) => getDayString(r.date)))
  );

  return uniqueDates.length >= 10;
}

function generatePDFHTML(
  metrics: PDFMetrics,
  exercises: PDFExerciseData[],
  language: string
): string {
  const muscleGroupNames: Record<MuscleGroup, string> = {
    chest: getTranslation(language, "chest"),
    triceps: getTranslation(language, "triceps"),
    biceps: getTranslation(language, "biceps"),
    forearms: getTranslation(language, "forearms"),
    delts: getTranslation(language, "delts"),
    back: getTranslation(language, "back"),
    glutes: getTranslation(language, "glutes"),
    quads: getTranslation(language, "quads"),
    hamstrings: getTranslation(language, "hamstrings"),
    calves: getTranslation(language, "calves"),
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const muscleGroupCards = Object.entries(metrics.setsByMuscleGroup)
    .filter(([_, count]) => count > 0)
    .map(
      ([group, count]) => `
      <div class="metric-card">
        <div class="metric-title">${
          muscleGroupNames[group as MuscleGroup]
        }</div>
        <div class="metric-value">${count}</div>
      </div>
    `
    )
    .join("");

  const exerciseCharts = exercises
    .map((exercise) => {
      const maxWeight = Math.max(...exercise.weightData, 1);
      const maxTonnage = Math.max(...exercise.tonnageData, 1);
      const maxReps = Math.max(...exercise.repsData, 1);

      const weightBars = exercise.weightData
        .map(
          (value, index) => `
        <div class="bar-container">
          <div class="bar" style="height: ${(value / maxWeight) * 100}%"></div>
          <div class="bar-value">${value.toFixed(1)}</div>
        </div>
      `
        )
        .join("");

      const tonnageBars = exercise.tonnageData
        .map(
          (value, index) => `
        <div class="bar-container">
          <div class="bar" style="height: ${(value / maxTonnage) * 100}%"></div>
          <div class="bar-value">${Math.round(value)}</div>
        </div>
      `
        )
        .join("");

      const repsBars = exercise.repsData
        .map(
          (value, index) => `
        <div class="bar-container">
          <div class="bar" style="height: ${(value / maxReps) * 100}%"></div>
          <div class="bar-value">${Math.round(value)}</div>
        </div>
      `
        )
        .join("");

      return `
      <div class="exercise-section">
        <h2 class="exercise-title">${exercise.exerciseName}</h2>
        <div class="chart-container">
          <h3 class="chart-title">${getTranslation(language, "weight")}</h3>
          <div class="chart">${weightBars}</div>
        </div>
        <div class="chart-container">
          <h3 class="chart-title">${getTranslation(language, "tonnage")}</h3>
          <div class="chart">${tonnageBars}</div>
        </div>
        <div class="chart-container">
          <h3 class="chart-title">${getTranslation(language, "reps")}</h3>
          <div class="chart">${repsBars}</div>
        </div>
      </div>
    `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      background: white;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #1a1a1a;
    }
    .header .date {
      font-size: 16px;
      color: #666;
    }
    .metrics-section {
      margin-bottom: 40px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .metric-card {
      background: #f5f5f5;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 1px solid #e0e0e0;
    }
    .metric-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #1a1a1a;
    }
    .exercise-section {
      margin-bottom: 50px;
      page-break-inside: avoid;
    }
    .exercise-title {
      font-size: 24px;
      margin-bottom: 30px;
      color: #1a1a1a;
      border-bottom: 2px solid #e0e0e0;
      padding-bottom: 10px;
    }
    .chart-container {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .chart-title {
      font-size: 18px;
      margin-bottom: 15px;
      color: #333;
    }
    .chart {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 300px;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    .bar-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      margin: 0 5px;
    }
    .bar {
      width: 100%;
      background: linear-gradient(to top, #4a90e2, #6bb3ff);
      border-radius: 4px 4px 0 0;
      min-height: 5px;
      margin-bottom: 5px;
    }
    .bar-value {
      font-size: 11px;
      color: #666;
      margin-top: 5px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .exercise-section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${getTranslation(language, "exportData")}</h1>
    <div class="date">${dateStr}</div>
  </div>

  <div class="metrics-section">
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-title">${getTranslation(language, "totalSets")}</div>
        <div class="metric-value">${metrics.totalSets}</div>
      </div>
      ${muscleGroupCards}
    </div>
  </div>

  ${exerciseCharts}
</body>
</html>
  `;
}

export async function exportToPDF(data: ExportData): Promise<void> {
  const language = useSettingsStore.getState().language;
  const { metrics, exercises } = preparePDFData(data);
  const html = generatePDFHTML(metrics, exercises, language);

  const { uri } = await Print.printToFileAsync({ html });
  const pdfUri = FileSystem.documentDirectory + "fitplot_export.pdf";
  await FileSystem.moveAsync({ from: uri, to: pdfUri });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(pdfUri);
  }
}
