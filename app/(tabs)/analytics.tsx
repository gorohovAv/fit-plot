import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { CartesianChart, Line } from "victory-native";
import useStore from "../../store/store";
import { Picker } from "@react-native-picker/picker";
import { Circle, useFont } from "@shopify/react-native-skia";
import Plot from "@/components/Plot";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import ResultsList from "@/components/ResultsList";

type ChartData = {
  x: string; // Дата
  y: number; // Значение (тоннаж, вес, повторения)
}[];

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
