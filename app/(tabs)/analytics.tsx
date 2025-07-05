import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { CartesianChart, Line } from "victory-native";
import useStore, {
  Plan,
  Training,
  Exercise,
  Result,
  MuscleGroup,
  ExerciseType,
} from "../../store/store";
import { Picker } from "@react-native-picker/picker";
import { Circle, useFont } from "@shopify/react-native-skia";
import Plot from "@/components/Plot";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ResultsList from "@/components/ResultsList";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { v4 as uuidv4 } from "uuid";

type ChartData = {
  x: string; // Дата
  y: number; // Значение (тоннаж, вес, повторения)
}[];

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
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [autoPeriod, setAutoPeriod] = useState<boolean>(true);
  const [chartData, setChartData] = useState<{
    tonnage: ChartData;
    maxWeight: ChartData;
    maxReps: ChartData;
  }>({ tonnage: [], maxWeight: [], maxReps: [] });
  const [showResultsList, setShowResultsList] = useState<boolean>(false);

  const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"));

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
    if (!selectedExercise) return;

    console.log("[Analytics] Выбрано упражнение:", selectedExercise);

    const results = plans
      .flatMap((plan) =>
        plan.trainings.flatMap((training) =>
          training.results.filter(
            (result) => result.exerciseId === selectedExercise
          )
        )
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log("[Analytics] Результаты для графика:", results);

    if (results.length === 0) {
      setChartData({ tonnage: [], maxWeight: [], maxReps: [] });
      return;
    }

    if (autoPeriod) {
      setStartDate(getDayString(results[0].date));
      setEndDate(getDayString(results[results.length - 1].date));
    }

    // Группировка по дням
    const groupedByDay = results.reduce((acc, result) => {
      const day = getDayString(result.date);
      if (!acc[day]) {
        acc[day] = { tonnage: 0, maxWeight: 0, maxReps: 0 };
      }
      acc[day].tonnage += result.weight * result.reps;
      acc[day].maxWeight = Math.max(acc[day].maxWeight, result.weight);
      acc[day].maxReps = Math.max(acc[day].maxReps, result.reps);
      return acc;
    }, {} as Record<string, { tonnage: number; maxWeight: number; maxReps: number }>);

    // Сортируем по дате
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

    console.log("[Analytics] Данные для графика тоннажа:", tonnageData);
    console.log("[Analytics] Данные для графика макс. веса:", maxWeightData);
    console.log(
      "[Analytics] Данные для графика макс. повторений:",
      maxRepsData
    );

    setChartData({
      tonnage: tonnageData,
      maxWeight: maxWeightData,
      maxReps: maxRepsData,
    });
  }, [selectedExercise, startDate, endDate, autoPeriod, plans]);

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
    // Оставляем только валидные точки
    const filteredData = data.filter(
      (item) =>
        item.x &&
        typeof item.x === "string" &&
        item.x.split("-").length === 3 &&
        !item.x.includes("undefined")
    );

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Plot
          data={filteredData}
          width={350}
          height={220}
          margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
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
  // --- Конец функции импорта данных ---

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {showResultsList ? (
          <View style={styles.pickerPlaceholder} />
        ) : (
          <Picker
            selectedValue={selectedExercise}
            onValueChange={(itemValue) => setSelectedExercise(itemValue)}
            style={styles.picker}
          >
            <Picker.Item label="Выберите упражнение" value="" />
            {exercises.map((exercise) => (
              <Picker.Item
                key={exercise.id}
                label={exercise.name}
                value={exercise.id}
              />
            ))}
          </Picker>
        )}
        {showResultsList && ( // Показываем иконку импорта только в режиме списка
          <MaterialIcons
            name="cloud-upload" // Иконка для загрузки
            size={24}
            color="#000"
            onPress={importPlans} // Вызываем функцию импорта
            style={styles.icon}
          />
        )}
        <MaterialIcons
          name={showResultsList ? "bar-chart" : "list"}
          size={24}
          color="#000"
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
              "Общий тоннаж",
              "#c43a31",
              "Дата",
              "Тоннаж"
            )}
            {renderChart(
              chartData.maxWeight,
              "Максимальный вес",
              "#2a9d8f",
              "Дата",
              "Вес"
            )}
            {renderChart(
              chartData.maxReps,
              "Максимальные повторения",
              "#264653",
              "Дата",
              "Повторения"
            )}
          </>
        )
      )}
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
  },
  picker: {
    flex: 1,
    marginRight: 8,
  },
  pickerPlaceholder: {
    flex: 1,
    marginRight: 8,
    marginTop: 30,
    paddingTop: 30,
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
});
