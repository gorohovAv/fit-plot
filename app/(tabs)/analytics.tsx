import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Appearance,
  ActivityIndicator,
} from "react-native";
import { CartesianChart, Line } from "victory-native";
import useStore, {
  Plan,
  Training,
  Exercise,
  Result,
  MuscleGroup,
  ExerciseType,
} from "../../store/store";
import useSettingsStore from "@/store/settingsStore";
import useCaloriesStore from "@/store/calloriesStore";
import { Colors } from "@/constants/Colors";
import { Picker } from "@react-native-picker/picker";
import { Circle, useFont } from "@shopify/react-native-skia";
import Plot from "@/components/Plot";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ResultsList from "@/components/ResultsList";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";
import { useRoute } from "@react-navigation/native";
import AnalyticsExerciseSelector from "@/components/AnalyticsExerciseSelector";
import { getTranslation, formatTranslation } from "@/utils/localization";
import { logAllTables } from "@/store/dbLayer";

type ChartData = {
  x: string; // Дата
  y: number; // Значение (тоннаж, вес, повторения)
}[];

type Dataset = {
  data: ChartData;
  axisLabel: string;
};

type Zone = {
  startDate: string;
  endDate: string;
  color: string;
};

// Определяем типы для "сырых" импортированных данных (без гарантированных ID)
type RawExercise = {
  id?: string; // ID может быть, но мы его перегенерируем
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  unilateral: boolean;
  amplitude: "full" | "partial";
};

type RawResult = {
  exerciseId: string; // Этот ID будет ссылаться на исходный ID из JSON
  weight: number;
  reps: number;
  date: string;
  amplitude: "full" | "partial";
};

type RawTraining = {
  id?: string; // ID может быть, но мы его перегенерируем
  name: string;
  exercises: RawExercise[];
  results: RawResult[];
};

type RawPlan = {
  planName: string;
  trainings: RawTraining[];
};

export default function AnalyticsScreen() {
  const { plans } = useStore();
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [autoPeriod, setAutoPeriod] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chartData, setChartData] = useState<{
    tonnage: ChartData;
    maxWeight: ChartData;
    maxReps: ChartData;
  }>({ tonnage: [], maxWeight: [], maxReps: [] });
  const [showResultsList, setShowResultsList] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"));
  const route = useRoute();
  const theme = useSettingsStore((state) => state.theme);
  const { language } = useSettingsStore();
  const colorScheme =
    theme === "system" ? Appearance.getColorScheme?.() ?? "light" : theme;
  const themeColors = Colors[colorScheme];

  const settingsStore = useSettingsStore();
  const caloriesStore = useCaloriesStore();

  // Хелпер для получения даты в формате YYYY-MM-DD
  const getDayString = (dateStr: string) => {
    const d = new Date(dateStr);
    // Корректно обрабатываем часовой пояс
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Хелпер для красивого отображения на графике (MM-DD)
  const formatLabel = (dayStr: string) => {
    if (!dayStr || typeof dayStr !== "string") return "";
    const parts = dayStr.split("-");
    if (parts.length !== 3) return "";
    const [, month, day] = parts;
    // Проверяем, что month и day существуют и это числа
    if (!month || !day || isNaN(Number(month)) || isNaN(Number(day))) return "";
    return `${month}-${day}`;
  };

  useEffect(() => {
    setIsLoading(true);

    const processData = async () => {
      if (selectedExerciseIds.length === 0) {
        setChartData({ tonnage: [], maxWeight: [], maxReps: [] });
        setIsLoading(false);
        return;
      }

      const allResults: Result[] = [];
      selectedExerciseIds.forEach((id) => {
        plans
          .flatMap((plan) =>
            plan.trainings.flatMap((training) =>
              training.results.filter((result) => result.exerciseId === id)
            )
          )
          .forEach((result) => allResults.push(result));
      });

      allResults.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      if (allResults.length === 0) {
        setChartData({ tonnage: [], maxWeight: [], maxReps: [] });
        setIsLoading(false);
        return;
      }

      if (autoPeriod) {
        setStartDate(getDayString(allResults[0].date));
        setEndDate(getDayString(allResults[allResults.length - 1].date));
      }

      const groupedByDay = allResults.reduce((acc, result) => {
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

      const tonnageData = sortedDays.map((day) => ({
        x: day,
        y: groupedByDay[day].tonnage,
      }));

      const maxWeightData = sortedDays.map((day) => ({
        x: day,
        y: groupedByDay[day].maxWeight,
      }));

      const maxRepsData = sortedDays.map((day) => ({
        x: day,
        y: groupedByDay[day].maxReps,
      }));

      setChartData({
        tonnage: tonnageData,
        maxWeight: maxWeightData,
        maxReps: maxRepsData,
      });

      setIsLoading(false);
    };

    processData();
  }, [
    selectedExerciseIds,
    startDate,
    endDate,
    autoPeriod,
    plans,
    route.params,
  ]);

  if (!font) {
    return null;
  }

  const exercises = plans.flatMap((plan) =>
    plan.trainings.flatMap((training) => training.exercises)
  );

  const renderChart = (
    data: ChartData,
    title: string,
    color: string,
    xLabel: string,
    yLabel: string
  ) => {
    if (isLoading) {
      return (
        <View
          style={[styles.chartContainer, { backgroundColor: themeColors.card }]}
        >
          <Text style={[styles.chartTitle, { color: themeColors.text }]}>
            {title}
          </Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text style={[styles.loadingText, { color: themeColors.text }]}>
              Загрузка данных...
            </Text>
          </View>
        </View>
      );
    }

    const filteredData = data.filter(
      (item) =>
        item.x &&
        typeof item.x === "string" &&
        item.x.split("-").length === 3 &&
        !item.x.includes("undefined")
    );

    const datasets: Dataset[] = [];

    // Добавляем датасеты только для выбранных упражнений
    selectedExerciseIds.forEach((id) => {
      const exerciseResults = plans
        .flatMap((plan) =>
          plan.trainings.flatMap((training) => training.results)
        )
        .filter((result) => result.exerciseId === id)
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      if (exerciseResults.length > 0) {
        const groupedForExercise = exerciseResults.reduce((acc, result) => {
          const day = getDayString(result.date);
          if (!acc[day]) {
            acc[day] = { tonnage: 0, maxWeight: 0, maxReps: 0 };
          }
          acc[day].tonnage += result.weight * result.reps;
          acc[day].maxWeight = Math.max(acc[day].maxWeight, result.weight);
          acc[day].maxReps = Math.max(acc[day].maxReps, result.reps);
          return acc;
        }, {} as Record<string, { tonnage: number; maxWeight: number; maxReps: number }>);

        const sortedDaysForExercise = Object.keys(groupedForExercise).sort();

        if (title.includes("тоннаж")) {
          datasets.push({
            data: sortedDaysForExercise.map((day) => ({
              x: day,
              y: groupedForExercise[day].tonnage,
            })),
            axisLabel: yLabel,
          });
        } else if (title.includes("Максимальный вес")) {
          datasets.push({
            data: sortedDaysForExercise.map((day) => ({
              x: day,
              y: groupedForExercise[day].maxWeight,
            })),
            axisLabel: yLabel,
          });
        } else if (title.includes("Максимальные повторения")) {
          datasets.push({
            data: sortedDaysForExercise.map((day) => ({
              x: day,
              y: groupedForExercise[day].maxReps,
            })),
            axisLabel: yLabel,
          });
        }
      }
    });

    // Если нет выбранных упражнений, показываем общие данные
    if (datasets.length === 0) {
      datasets.push({
        data: filteredData,
        axisLabel: yLabel,
      });
    }

    const buildHighlightZones = (): Zone[] => {
      if (!caloriesStore.maintenanceCalories || filteredData.length === 0)
        return [];
      const start = new Date(filteredData[0].x);
      const end = new Date(filteredData[filteredData.length - 1].x);

      const startOfWeek = (d: Date) => {
        const nd = new Date(d);
        const day = nd.getDay();
        const diff = (day + 6) % 7;
        nd.setDate(nd.getDate() - diff);
        nd.setHours(0, 0, 0, 0);
        return nd;
      };
      const addDays = (d: Date, n: number) => {
        const nd = new Date(d);
        nd.setDate(nd.getDate() + n);
        return nd;
      };

      const zones: Zone[] = [];
      let wStart = startOfWeek(start);
      while (wStart <= end) {
        const wEnd = addDays(wStart, 6);
        let sum = 0;
        let cnt = 0;
        for (
          let d = new Date(wStart);
          d <= wEnd && d <= end;
          d = addDays(d, 1)
        ) {
          const key = getDayString(d.toISOString());
          const entry = caloriesStore.getEntryByDate(key);
          if (entry) {
            sum += entry.calories;
            cnt += 1;
          }
        }
        if (cnt > 0) {
          const avg = sum / cnt;
          const color =
            avg < caloriesStore.maintenanceCalories
              ? themeColors.chartZoneDeficit
              : themeColors.chartZoneSurplus;
          const zs = getDayString(wStart.toISOString());
          const ze = getDayString((wEnd > end ? end : wEnd).toISOString());
          zones.push({ startDate: zs, endDate: ze, color });
        }
        wStart = addDays(wStart, 7);
      }
      return zones;
    };

    const zones = buildHighlightZones();

    const lineColors = [color, ...themeColors.chartLine.slice(1)];

    const axisColors = {
      axis: themeColors.text,
      labels: themeColors.text,
      background: themeColors.card,
    };

    return (
      <View
        style={[styles.chartContainer, { backgroundColor: themeColors.card }]}
      >
        <Text style={[styles.chartTitle, { color: themeColors.text }]}>
          {title}
        </Text>
        <Plot
          datasets={datasets}
          lineColors={lineColors}
          axisColors={axisColors}
          zones={zones}
          width={350}
          height={220}
          margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
        />
      </View>
    );
  };
  // --- Функция импорта данных ---
  const importPlans = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json", // Разрешаем выбирать только JSON-файлы
        copyToCacheDirectory: true, // Копируем файл во временную директорию для доступа
      });

      if (result.canceled) {
        console.log("Выбор файла отменен.");
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      let importedRawData: { plans: RawPlan[] } | RawPlan | RawPlan[]; // Гибкий тип для входных данных
      try {
        importedRawData = JSON.parse(fileContent);
      } catch (parseError) {
        Alert.alert(
          "Ошибка",
          "Не удалось прочитать файл. Убедитесь, что это валидный JSON."
        );
        console.error("Ошибка при парсинге JSON:", parseError);
        return;
      }

      let rawPlansToProcess: RawPlan[];

      // Определяем, является ли корневой элемент массивом планов, объектом с полем 'plans' или одним планом
      if (Array.isArray(importedRawData)) {
        rawPlansToProcess = importedRawData as RawPlan[];
      } else if (
        typeof importedRawData === "object" &&
        importedRawData !== null &&
        "plans" in importedRawData &&
        Array.isArray(importedRawData.plans)
      ) {
        rawPlansToProcess = importedRawData.plans as RawPlan[];
      } else {
        // Если это одиночный план
        rawPlansToProcess = [importedRawData as RawPlan];
      }

      const processedPlans: Plan[] = [];
      const { addPlan, plans: existingPlans } = useStore.getState();

      for (const rawPlan of rawPlansToProcess) {
        // Проверяем, существует ли план с таким именем
        if (existingPlans.some((p) => p.planName === rawPlan.planName)) {
          console.warn(
            `План с именем "${rawPlan.planName}" уже существует. Пропускаем.`
          );
          Alert.alert(
            "Предупреждение",
            `План с именем "${rawPlan.planName}" уже существует и не будет добавлен.`
          );
          continue; // Пропускаем этот план
        }

        const newTrainings: Training[] = [];
        const exerciseIdMap = new Map<string, string>(); // Карта старых ID упражнений к новым ID для текущего плана

        for (const rawTraining of rawPlan.trainings) {
          const newTrainingId = uuidv4(); // Генерируем новый ID для тренировки
          const newExercises: Exercise[] = [];

          for (const rawExercise of rawTraining.exercises) {
            const newExerciseId = uuidv4(); // Генерируем новый ID для упражнения
            // Сохраняем соответствие старого ID (если есть) новому ID
            if (rawExercise.id) {
              exerciseIdMap.set(rawExercise.id, newExerciseId);
            }
            newExercises.push({
              id: newExerciseId,
              name: rawExercise.name,
              muscleGroup: rawExercise.muscleGroup,
              type: rawExercise.type,
              unilateral: rawExercise.unilateral,
              amplitude: rawExercise.amplitude,
            });
          }

          const newResults: Result[] = [];
          for (const rawResult of rawTraining.results) {
            const mappedExerciseId = exerciseIdMap.get(rawResult.exerciseId);
            if (!mappedExerciseId) {
              console.warn(
                `Не удалось найти упражнение с ID ${rawResult.exerciseId} для результата в плане "${rawPlan.planName}". Пропускаем результат.`
              );
              continue; // Пропускаем результат, если нет соответствия упражнения
            }
            newResults.push({
              exerciseId: mappedExerciseId, // Используем новый ID упражнения
              weight: rawResult.weight,
              reps: rawResult.reps,
              date: rawResult.date,
              amplitude: rawResult.amplitude,
            });
          }

          newTrainings.push({
            id: newTrainingId,
            name: rawTraining.name,
            exercises: newExercises,
            results: newResults,
          });
        }
        processedPlans.push({
          planName: rawPlan.planName,
          trainings: newTrainings,
        });
      }

      if (processedPlans.length > 0) {
        processedPlans.forEach((plan) => addPlan(plan));
        Alert.alert(
          "Успех",
          `Успешно импортировано ${processedPlans.length} план(а/ов)!`
        );
      } else {
        Alert.alert(
          "Информация",
          "Не было новых планов для импорта или все импортированные планы уже существуют."
        );
      }
    } catch (error) {
      console.error("Произошла ошибка при импорте данных:", error);
      Alert.alert(
        "Ошибка",
        "Произошла ошибка при импорте данных. Пожалуйста, попробуйте снова."
      );
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.form}>
        {showResultsList ? (
          <View style={styles.pickerPlaceholder} />
        ) : (
          <TouchableOpacity
            onPress={() => setIsModalVisible(true)}
            style={[styles.pickerButton, { borderColor: themeColors.border }]}
          >
            <Text
              style={[styles.pickerButtonText, { color: themeColors.text }]}
            >
              {selectedExerciseIds.length > 0
                ? formatTranslation(language, "selected", {
                    count: selectedExerciseIds.length,
                  })
                : getTranslation(language, "selectExercises")}
            </Text>
          </TouchableOpacity>
        )}
        <MaterialIcons
          name={showResultsList ? "bar-chart" : "list"}
          size={24}
          color={themeColors.icon}
          onPress={() => setShowResultsList(!showResultsList)}
          style={styles.icon}
        />
      </View>

      {showResultsList ? (
        <ResultsList plans={plans} />
      ) : (
        chartData.tonnage.length > 0 && (
          <>
            {renderChart(
              chartData.tonnage,
              getTranslation(language, "generalTonnage"),
              themeColors.chartLine[0],
              getTranslation(language, "date"),
              getTranslation(language, "tonnage")
            )}
            {renderChart(
              chartData.maxWeight,
              getTranslation(language, "maxWeight"),
              themeColors.chartLine[1],
              getTranslation(language, "date"),
              getTranslation(language, "weight")
            )}
            {renderChart(
              chartData.maxReps,
              getTranslation(language, "maxReps"),
              themeColors.chartLine[2],
              getTranslation(language, "date"),
              getTranslation(language, "reps")
            )}
          </>
        )
      )}

      <AnalyticsExerciseSelector
        isVisible={isModalVisible}
        exercises={exercises}
        selectedExerciseIds={selectedExerciseIds}
        onClose={() => setIsModalVisible(false)}
        onSave={(newSelectedIds) => {
          setSelectedExerciseIds(newSelectedIds);
          setIsModalVisible(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  form: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    marginTop: 20,
  },
  picker: {
    flex: 1,
    marginRight: 8,
  },
  pickerButton: {
    flex: 1,
    marginRight: 8,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerButtonText: {
    fontSize: 16,
  },
  pickerPlaceholder: {
    flex: 1,
    marginRight: 8,
    marginTop: 30,
    paddingTop: 0,
  },
  icon: {
    marginLeft: 8,
    alignSelf: "center",
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
});
