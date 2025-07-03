import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { CartesianChart, Line } from "victory-native";
import useStore from "../../store/store";
import { Picker } from "@react-native-picker/picker";
import { useFont } from "@shopify/react-native-skia";

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
    const [, month, day] = dayStr.split("-");
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
    // Форматируем подписи X как MM-DD
    const formattedData = data.map((item) => ({
      ...item,
      x: formatLabel(item.x),
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={{ height: 220 }}>
          <CartesianChart
            data={formattedData}
            xKey="x"
            yKeys={["y"]}
            axisOptions={{
              labelColor: "#888",
              tickCount: 5,
              lineColor: "#ccc",
              font: font,
            }}
          >
            {({ points }) => (
              <Line
                points={points.y}
                color={color}
                strokeWidth={3}
                curveType="natural"
              />
            )}
          </CartesianChart>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
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
      </View>

      {chartData.tonnage.length > 0 && (
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
