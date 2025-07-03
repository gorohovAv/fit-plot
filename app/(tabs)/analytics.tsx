import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { CartesianChart, Line } from "victory-native";
import useStore from "../../store/store";
import { Picker } from "@react-native-picker/picker";

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

  // Получаем список всех упражнений
  const exercises = plans.flatMap((plan) =>
    plan.trainings.flatMap((training) => training.exercises)
  );

  // Фильтрация результатов
  useEffect(() => {
    if (!selectedExercise) return;

    const results = plans
      .flatMap((plan) =>
        plan.trainings.flatMap((training) =>
          training.results.filter(
            (result) => result.exerciseId === selectedExercise
          )
        )
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (results.length === 0) {
      setChartData({ tonnage: [], maxWeight: [], maxReps: [] });
      return;
    }

    if (autoPeriod) {
      setStartDate(results[0].date);
      setEndDate(results[results.length - 1].date);
    }

    const groupedByDate = results.reduce((acc, result) => {
      const date = result.date;
      if (!acc[date]) {
        acc[date] = { tonnage: 0, maxWeight: 0, maxReps: 0 };
      }
      acc[date].tonnage += result.weight * result.reps;
      acc[date].maxWeight = Math.max(acc[date].maxWeight, result.weight);
      acc[date].maxReps = Math.max(acc[date].maxReps, result.reps);
      return acc;
    }, {} as Record<string, { tonnage: number; maxWeight: number; maxReps: number }>);

    const tonnageData = Object.entries(groupedByDate).map(([date, data]) => ({
      x: date,
      y: data.tonnage,
    }));

    const maxWeightData = Object.entries(groupedByDate).map(([date, data]) => ({
      x: date,
      y: data.maxWeight,
    }));

    const maxRepsData = Object.entries(groupedByDate).map(([date, data]) => ({
      x: date,
      y: data.maxReps,
    }));

    setChartData({
      tonnage: tonnageData,
      maxWeight: maxWeightData,
      maxReps: maxRepsData,
    });
  }, [selectedExercise, startDate, endDate, autoPeriod, plans]);

  // Рендер графика
  const renderChart = (data: ChartData, title: string, color: string) => {
    // Преобразуем даты к виду "ММ-ДД"
    const formattedData = data.map((item) => ({
      ...item,
      x: item.x.slice(5), // "YYYY-MM-DD" -> "MM-DD"
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
              // Можно добавить подписи осей, если нужно:
              // xLabel: "Дата", yLabel: "Значение"
            }}
          >
            {({ points }) => (
              <Line
                points={points.y}
                color={color}
                strokeWidth={3}
                curveType="natural" // сглаживание линии
              />
            )}
          </CartesianChart>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Форма выбора данных */}
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

      {/* Графики */}
      {chartData.tonnage.length > 0 && (
        <>
          {renderChart(chartData.tonnage, "Общий тоннаж", "#c43a31")}
          {renderChart(chartData.maxWeight, "Максимальный вес", "#2a9d8f")}
          {renderChart(chartData.maxReps, "Максимальные повторения", "#264653")}
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
