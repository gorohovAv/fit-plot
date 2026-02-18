import AnalyticsExerciseSelector from "@/components/AnalyticsExerciseSelector";
import Crepature from "@/components/Crepature";
import Plot from "@/components/Plot";
import ResultsList from "@/components/ResultsList";
import { Colors } from "@/constants/Colors";
import useSettingsStore from "@/store/settingsStore";
import { formatTranslation, getTranslation } from "@/utils/localization";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRoute } from "@react-navigation/native";
import { useFont } from "@shopify/react-native-skia";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Appearance,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as dbLayer from "../../store/dbLayer";
import { Plan, PlannedResult, Result } from "../../store/store";

type ChartData = {
  x: string;
  y: number;
}[];

type Dataset = {
  data: ChartData;
  axisLabel: string;
  name?: string;
};

type Zone = {
  startDate: string;
  endDate: string;
  color: string;
};

export default function AnalyticsScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [selectedPlannedIds, setSelectedPlannedIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [autoPeriod] = useState<boolean>(true);
  const [dateFilterStart, setDateFilterStart] = useState<string>("");
  const [dateFilterEnd, setDateFilterEnd] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState<boolean>(false);
  const [chartData, setChartData] = useState<{
    tonnage: Dataset[];
    maxWeight: Dataset[];
    maxReps: Dataset[];
    avgWeight: Dataset[];
    minWeight: Dataset[];
    workoutTime: Dataset[];
  }>({
    tonnage: [],
    maxWeight: [],
    maxReps: [],
    avgWeight: [],
    minWeight: [],
    workoutTime: [],
  });
  const [absoluteMaxWeight, setAbsoluteMaxWeight] = useState<{ exerciseId: string; exerciseName: string; maxWeight: number }[]>([]);
  const [showResultsList, setShowResultsList] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [isRenderingResults, setIsRenderingResults] = useState<boolean>(false);
  const [resultsViewPending, setResultsViewPending] = useState<boolean>(false);

  const [caloriesEntries, setCaloriesEntries] = useState<
    { date: string; calories: number; weight: number }[]
  >([]);
  const [maintenanceCalories, setMaintenanceCalories] = useState<number | null>(
    null,
  );

  const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"));
  const route = useRoute();
  const theme = useSettingsStore((state) => state.theme);
  const { language, visibleMetrics } = useSettingsStore();
  const colorScheme =
    theme === "system" ? (Appearance.getColorScheme?.() ?? "light") : theme;
  const themeColors = Colors[colorScheme];

  const loadPlansFromDB = async () => {
    console.log('[AnalyticsScreen] loadPlansFromDB: Starting...');
    try {
      const planNames = await dbLayer.getAllPlans();
      console.log('[AnalyticsScreen] loadPlansFromDB: Got plan names:', planNames);
      const loadedPlans: Plan[] = [];

      for (const { planName } of planNames) {
        const trainings = await dbLayer.getTrainingsByPlan(planName);
        console.log('[AnalyticsScreen] loadPlansFromDB: Loading plan:', planName, 'trainings:', trainings.length);
        const planTrainings: any[] = [];

        for (const training of trainings) {
          const exercises = await dbLayer.getExercisesByTraining(training.id);
          const exerciseIds = exercises.map((e) => e.id);
          const rows = await dbLayer.getResultsForExerciseIds(exerciseIds);

          const results: Result[] = [];
          const plannedResults: PlannedResult[] = [];
          for (const r of rows) {
            if (r.isPlanned) {
              plannedResults.push({
                exerciseId: r.exerciseId,
                plannedWeight: r.weight,
                plannedReps: r.reps,
                plannedDate: r.date,
                amplitude: r.amplitude,
              });
            } else {
              results.push({
                id: r.id,
                exerciseId: r.exerciseId,
                weight: r.weight,
                reps: r.reps,
                date: r.date,
                amplitude: r.amplitude,
              });
            }
          }

          planTrainings.push({
            id: training.id,
            name: training.name,
            exercises,
            results,
            plannedResults,
          });
        }

        loadedPlans.push({
          planName,
          trainings: planTrainings,
        });
      }

      console.log('[AnalyticsScreen] loadPlansFromDB: Loaded', loadedPlans.length, 'plans');
      setPlans(loadedPlans);
    } catch (error) {
      console.error('[AnalyticsScreen] loadPlansFromDB: Error:', error);
      throw error;
    }
  };

  const loadCaloriesFromDB = async () => {
    console.log('[AnalyticsScreen] loadCaloriesFromDB: Starting...');
    try {
      const entries = await dbLayer.getCalorieEntries();
      console.log('[AnalyticsScreen] loadCaloriesFromDB: Loaded', entries.length, 'entries');
      const maintenance = await dbLayer.getMaintenanceCalories();
      console.log('[AnalyticsScreen] loadCaloriesFromDB: Loaded maintenance:', maintenance);

      setCaloriesEntries(entries);
      setMaintenanceCalories(maintenance);
    } catch (error) {
      console.error('[AnalyticsScreen] loadCaloriesFromDB: Error:', error);
      throw error;
    }
  };

  const getEntryByDate = (date: string) => {
    return caloriesEntries.find((entry) => entry.date === date);
  };

  useEffect(() => {
    console.log('[AnalyticsScreen] Starting initial data load');
    const loadInitialData = async () => {
      console.log('[AnalyticsScreen] isLoading already true from init');
      try {
        await loadPlansFromDB();
        await loadCaloriesFromDB();
        console.log('[AnalyticsScreen] Initial DB load complete, setting isInitialLoadComplete=true');
        setIsInitialLoadComplete(true);
      } catch (error) {
        console.error('[AnalyticsScreen] Error during initial load:', error);
        setIsLoading(false);
        setIsInitialLoadComplete(true);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (resultsViewPending && showResultsList) {
      const timer = setTimeout(() => {
        setResultsViewPending(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [resultsViewPending, showResultsList]);

  const getDayString = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (route.params) {
      const { exerciseId, exerciseName } = route.params as {
        exerciseId?: string;
        exerciseName?: string;
      };
      if (exerciseId && exerciseName) {
        const allExercises = plans
          .flatMap((plan) =>
            plan.trainings.flatMap((training) => training.exercises || []),
          )
          .filter((exercise) => exercise && exercise.id && exercise.name);

        const exercise = allExercises.find((ex) => ex.id === exerciseId);
        if (exercise) {
          setSelectedExerciseIds([exerciseId]);
          setSelectedPlannedIds([]);
        }
      }
    }
  }, [route.params, plans]);

  useEffect(() => {
    // Не запускаем обработку данных до завершения начальной загрузки
    if (!isInitialLoadComplete) {
      console.log('[AnalyticsScreen] processData: waiting for initial load to complete');
      return;
    }
    
    console.log('[AnalyticsScreen] processData useEffect triggered, plans.length:', plans.length);
    
    const processData = async () => {
      console.log('[AnalyticsScreen] processData: Starting');

      const exercises = plans
        .flatMap((plan) =>
          plan.trainings.flatMap((training) => training.exercises || []),
        )
        .filter((exercise) => exercise && exercise.id && exercise.name);

      console.log('[AnalyticsScreen] processData: Found', exercises.length, 'exercises');
      console.log('[AnalyticsScreen] processData: selectedExerciseIds:', selectedExerciseIds, 'selectedPlannedIds:', selectedPlannedIds);

      if (selectedExerciseIds.length === 0 && selectedPlannedIds.length === 0) {
        console.log('[AnalyticsScreen] processData: No exercises selected, setting isLoading=false');
        setChartData({
          tonnage: [],
          maxWeight: [],
          maxReps: [],
          avgWeight: [],
          minWeight: [],
          workoutTime: [],
        });
        setIsLoading(false);
        return;
      }

      const allResults: Result[] = [];
      const allPlannedResults: PlannedResult[] = [];

      selectedExerciseIds.forEach((id) => {
        plans
          .flatMap((plan) =>
            plan.trainings.flatMap((training) =>
              training.results.filter((result) => {
                if (result.exerciseId !== id) return false;
                if (dateFilterStart && result.date < dateFilterStart)
                  return false;
                if (dateFilterEnd && result.date > dateFilterEnd) return false;
                return true;
              }),
            ),
          )
          .forEach((result) => allResults.push(result));
      });

      selectedPlannedIds.forEach((plannedId) => {
        const exerciseName = plannedId.replace("planned-", "");
        const exercise = exercises.find((ex) => ex.name === exerciseName);
        if (exercise) {
          plans
            .flatMap((plan) =>
              plan.trainings.flatMap((training) =>
                training.plannedResults.filter((planned) => {
                  if (planned.exerciseId !== exercise.id) return false;
                  if (dateFilterStart && planned.plannedDate < dateFilterStart)
                    return false;
                  if (dateFilterEnd && planned.plannedDate > dateFilterEnd)
                    return false;
                  return true;
                }),
              ),
            )
            .forEach((planned) => allPlannedResults.push(planned));
        }
      });

      allResults.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      allPlannedResults.sort(
        (a, b) =>
          new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime(),
      );

      if (allResults.length === 0 && allPlannedResults.length === 0) {
        setChartData({
          tonnage: [],
          maxWeight: [],
          maxReps: [],
          minWeight: [],
          workoutTime: [],
          avgWeight: [],
        });
        setAbsoluteMaxWeight([]);
        setIsLoading(false);
        return;
      }

      if (autoPeriod) {
        const allDates = [
          ...allResults.map((r) => r.date),
          ...allPlannedResults.map((pr) => pr.plannedDate),
        ].sort();
        if (allDates.length > 0) {
          setStartDate(getDayString(allDates[0]));
          setEndDate(getDayString(allDates[allDates.length - 1]));
        }
      }

      const tonnageData: Dataset[] = [];
      const maxWeightData: Dataset[] = [];
      const maxRepsData: Dataset[] = [];
      const avgWeightData: Dataset[] = [];
      const minWeightData: Dataset[] = [];
      const workoutTimeData: Dataset[] = [];

      selectedExerciseIds.forEach((exerciseId) => {
        const exerciseResults = allResults.filter(
          (r) => r.exerciseId === exerciseId,
        );
        const exercise = exercises.find((ex) => ex.id === exerciseId);

        if (exerciseResults.length > 0 && exercise) {
          const groupedByDay = exerciseResults.reduce(
            (acc, result) => {
              const day = getDayString(result.date);
              if (!acc[day]) {
                acc[day] = { tonnage: 0, maxWeight: 0, maxReps: 0, totalWeight: 0, count: 0, minWeight: Infinity, timestamps: [] as string[] };
              }
              acc[day].tonnage += result.weight * result.reps;
              acc[day].maxWeight = Math.max(acc[day].maxWeight, result.weight);
              acc[day].maxReps = Math.max(acc[day].maxReps, result.reps);
              acc[day].totalWeight += result.weight;
              acc[day].count += 1;
              acc[day].minWeight = Math.min(acc[day].minWeight, result.weight);
              acc[day].timestamps.push(result.date);
              return acc;
            },
            {} as Record<
              string,
              { tonnage: number; maxWeight: number; maxReps: number; totalWeight: number; count: number; minWeight: number; timestamps: string[] }
            >,
          );

          const sortedDays = Object.keys(groupedByDay).sort();

          tonnageData.push({
            data: sortedDays.map((day) => ({
              x: day,
              y: groupedByDay[day].tonnage,
            })),
            axisLabel: getTranslation(language, "tonnage"),
            name: exercise.name,
          });

          maxWeightData.push({
            data: sortedDays.map((day) => ({
              x: day,
              y: groupedByDay[day].maxWeight,
            })),
            axisLabel: getTranslation(language, "weightLabel"),
            name: exercise.name,
          });

          maxRepsData.push({
            data: sortedDays.map((day) => ({
              x: day,
              y: groupedByDay[day].maxReps,
            })),
            axisLabel: getTranslation(language, "reps"),
            name: exercise.name,
          });

          avgWeightData.push({
            data: sortedDays.map((day) => ({
              x: day,
              y: groupedByDay[day].count > 0 ? groupedByDay[day].totalWeight / groupedByDay[day].count : 0,
            })),
            axisLabel: getTranslation(language, "weightLabel"),
            name: exercise.name,
          });

          minWeightData.push({
            data: sortedDays.map((day) => ({
              x: day,
              y: groupedByDay[day].minWeight,
            })),
            axisLabel: getTranslation(language, "weightLabel"),
            name: exercise.name,
          });

          workoutTimeData.push({
            data: sortedDays.map((day) => {
              const times = groupedByDay[day].timestamps;
              if (times.length < 2) {
                return { x: day, y: 0 };
              }
              const sortedTimes = times.sort();
              const earliest = new Date(sortedTimes[0]).getTime();
              const latest = new Date(sortedTimes[sortedTimes.length - 1]).getTime();
              const durationMinutes = Math.round((latest - earliest) / (1000 * 60));
              return { x: day, y: durationMinutes };
            }),
            axisLabel: getTranslation(language, "minutes"),
            name: exercise.name,
          });
        }
      });

      selectedPlannedIds.forEach((plannedId) => {
        const exerciseName = plannedId.replace("planned-", "");
        const exercise = exercises.find((ex) => ex.name === exerciseName);

        if (exercise) {
          const exercisePlannedResults = allPlannedResults.filter(
            (pr) => pr.exerciseId === exercise.id,
          );

          if (exercisePlannedResults.length > 0) {
            const groupedPlannedByDay = exercisePlannedResults.reduce(
              (acc, planned) => {
                const day = getDayString(planned.plannedDate);
                if (!acc[day]) {
                  acc[day] = { tonnage: 0, maxWeight: 0, maxReps: 0, totalWeight: 0, count: 0, minWeight: Infinity, timestamps: [] as string[] };
                }
                acc[day].tonnage += planned.plannedWeight * planned.plannedReps;
                acc[day].maxWeight = Math.max(
                  acc[day].maxWeight,
                  planned.plannedWeight,
                );
                acc[day].maxReps = Math.max(
                  acc[day].maxReps,
                  planned.plannedReps,
                );
                acc[day].totalWeight += planned.plannedWeight;
                acc[day].count += 1;
                acc[day].minWeight = Math.min(acc[day].minWeight, planned.plannedWeight);
                acc[day].timestamps.push(planned.plannedDate);
                return acc;
              },
              {} as Record<
                string,
                { tonnage: number; maxWeight: number; maxReps: number; totalWeight: number; count: number; minWeight: number; timestamps: string[] }
              >,
            );

            const sortedPlannedDays = Object.keys(groupedPlannedByDay).sort();

            tonnageData.push({
              data: sortedPlannedDays.map((day) => ({
                x: day,
                y: groupedPlannedByDay[day].tonnage,
              })),
              axisLabel: getTranslation(language, "tonnage"),
              name: `${exercise.name} (план)`,
            });

            maxWeightData.push({
              data: sortedPlannedDays.map((day) => ({
                x: day,
                y: groupedPlannedByDay[day].maxWeight,
              })),
              axisLabel: getTranslation(language, "weightLabel"),
              name: `${exercise.name} (план)`,
            });

            maxRepsData.push({
              data: sortedPlannedDays.map((day) => ({
                x: day,
                y: groupedPlannedByDay[day].maxReps,
              })),
              axisLabel: getTranslation(language, "reps"),
              name: `${exercise.name} (план)`,
            });

            avgWeightData.push({
              data: sortedPlannedDays.map((day) => ({
                x: day,
                y: groupedPlannedByDay[day].count > 0 ? groupedPlannedByDay[day].totalWeight / groupedPlannedByDay[day].count : 0,
              })),
              axisLabel: getTranslation(language, "weightLabel"),
              name: `${exercise.name} (план)`,
            });

            minWeightData.push({
              data: sortedPlannedDays.map((day) => ({
                x: day,
                y: groupedPlannedByDay[day].minWeight,
              })),
              axisLabel: getTranslation(language, "weightLabel"),
              name: `${exercise.name} (план)`,
            });

            workoutTimeData.push({
              data: sortedPlannedDays.map((day) => {
                const times = groupedPlannedByDay[day].timestamps;
                if (times.length < 2) return { x: day, y: 0 };
                const sortedTimes = times.sort();
                const earliest = new Date(sortedTimes[0]).getTime();
                const latest = new Date(sortedTimes[sortedTimes.length - 1]).getTime();
                const durationMinutes = Math.round((latest - earliest) / (1000 * 60));
                return { x: day, y: durationMinutes };
              }),
              axisLabel: getTranslation(language, "minutes"),
              name: `${exercise.name} (план)`,
            });
          }
        }
      });

      // Расчет абсолютного максимума веса за все время
      const absoluteMaxMap: Record<string, { exerciseId: string; exerciseName: string; maxWeight: number }> = {};
      selectedExerciseIds.forEach((exerciseId) => {
        const exercise = exercises.find((ex) => ex.id === exerciseId);
        if (exercise) {
          const exerciseResults = allResults.filter((r) => r.exerciseId === exerciseId);
          if (exerciseResults.length > 0) {
            const maxWeight = Math.max(...exerciseResults.map((r) => r.weight));
            absoluteMaxMap[exerciseId] = {
              exerciseId,
              exerciseName: exercise.name,
              maxWeight,
            };
          }
        }
      });
      setAbsoluteMaxWeight(Object.values(absoluteMaxMap));

      setChartData({
        tonnage: tonnageData,
        maxWeight: maxWeightData,
        maxReps: maxRepsData,
        avgWeight: avgWeightData,
        minWeight: minWeightData,
        workoutTime: workoutTimeData,
      });

      console.log('[AnalyticsScreen] processData: Data processed, setting isLoading=false');
      setIsLoading(false);
    };

    processData();
  }, [
    selectedExerciseIds,
    selectedPlannedIds,
    startDate,
    endDate,
    autoPeriod,
    plans,
    route.params,
    dateFilterStart,
    dateFilterEnd,
    language,
    visibleMetrics,
    isInitialLoadComplete,
  ]);

  console.log('[AnalyticsScreen] Render, isLoading:', isLoading, 'plans.length:', plans.length, 'font:', !!font);

  // Показываем лоадер, если идет загрузка ИЛИ если шрифт еще не загрузился
  if (isLoading || !font) {
    console.log('[AnalyticsScreen] Rendering loader screen, isLoading:', isLoading, 'font:', !!font);
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeColors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.primary} style={{ transform: [{ scale: 4 }] }} />
      </View>
    );
  }

  const exercises = plans
    .flatMap((plan) =>
      plan.trainings.flatMap((training) => training.exercises || []),
    )
    .filter((exercise) => exercise && exercise.id && exercise.name);

  const plannedResults = plans
    .flatMap((plan) =>
      plan.trainings.flatMap((training) => training.plannedResults || []),
    )
    .filter((planned) => planned && planned.exerciseId && planned.plannedDate);

  const getAllResults = () => {
    return plans
      .flatMap((plan) =>
        plan.trainings.flatMap((training) => training.results || []),
      )
      .filter((result) => {
        if (dateFilterStart && result.date < dateFilterStart) return false;
        if (dateFilterEnd && result.date > dateFilterEnd) return false;
        return true;
      });
  };

  const calculateMetrics = () => {
    const allResults = getAllResults();
    if (allResults.length === 0) {
      return {
        avgSetsPerWeek: null,
        avgTonnageProgress: null,
        avgWeightProgress: null,
      };
    }

    const allDates = allResults.map((r) => r.date).sort();
    const start = new Date(allDates[0]);
    const end = new Date(allDates[allDates.length - 1]);
    const daysDiff = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const weeks = daysDiff / 7;
    const avgSetsPerWeek = weeks > 0 ? allResults.length / weeks : null;

    let avgTonnageProgress = null;
    let avgWeightProgress = null;

    if (daysDiff >= 30) {
      const periods: { start: Date; end: Date }[] = [];
      let currentStart = new Date(start);
      while (currentStart <= end) {
        const currentEnd = new Date(currentStart);
        currentEnd.setDate(currentEnd.getDate() + 29);
        if (currentEnd > end) currentEnd.setTime(end.getTime());
        periods.push({
          start: new Date(currentStart),
          end: new Date(currentEnd),
        });
        currentStart = new Date(currentEnd);
        currentStart.setDate(currentStart.getDate() + 1);
      }

      if (periods.length >= 2) {
        const tonnageProgresses: number[] = [];
        const weightProgresses: number[] = [];

        for (let i = 0; i < periods.length - 1; i++) {
          const period1 = periods[i];
          const period2 = periods[i + 1];

          const period1Results = allResults.filter((r) => {
            const date = new Date(r.date);
            return date >= period1.start && date <= period1.end;
          });
          const period2Results = allResults.filter((r) => {
            const date = new Date(r.date);
            return date >= period2.start && date <= period2.end;
          });

          const period1TonnageByExercise: Record<string, number> = {};
          const period2TonnageByExercise: Record<string, number> = {};
          const period1WeightByExercise: Record<string, number> = {};
          const period2WeightByExercise: Record<string, number> = {};

          period1Results.forEach((r) => {
            if (!period1TonnageByExercise[r.exerciseId]) {
              period1TonnageByExercise[r.exerciseId] = 0;
              period1WeightByExercise[r.exerciseId] = 0;
            }
            period1TonnageByExercise[r.exerciseId] += r.weight * r.reps;
            period1WeightByExercise[r.exerciseId] = Math.max(
              period1WeightByExercise[r.exerciseId],
              r.weight,
            );
          });

          period2Results.forEach((r) => {
            if (!period2TonnageByExercise[r.exerciseId]) {
              period2TonnageByExercise[r.exerciseId] = 0;
              period2WeightByExercise[r.exerciseId] = 0;
            }
            period2TonnageByExercise[r.exerciseId] += r.weight * r.reps;
            period2WeightByExercise[r.exerciseId] = Math.max(
              period2WeightByExercise[r.exerciseId],
              r.weight,
            );
          });

          const exerciseIds = new Set([
            ...Object.keys(period1TonnageByExercise),
            ...Object.keys(period2TonnageByExercise),
          ]);

          const tonnageDiffs: number[] = [];
          const weightDiffs: number[] = [];

          exerciseIds.forEach((exerciseId) => {
            const tonnage1 = period1TonnageByExercise[exerciseId] || 0;
            const tonnage2 = period2TonnageByExercise[exerciseId] || 0;
            if (tonnage1 > 0 && tonnage2 > 0) {
              tonnageDiffs.push(tonnage2 - tonnage1);
            }

            const weight1 = period1WeightByExercise[exerciseId] || 0;
            const weight2 = period2WeightByExercise[exerciseId] || 0;
            if (weight1 > 0 && weight2 > 0) {
              weightDiffs.push(weight2 - weight1);
            }
          });

          if (tonnageDiffs.length > 0) {
            const avgTonnageDiff =
              tonnageDiffs.reduce((a, b) => a + b, 0) / tonnageDiffs.length;
            tonnageProgresses.push(avgTonnageDiff);
          }

          if (weightDiffs.length > 0) {
            const avgWeightDiff =
              weightDiffs.reduce((a, b) => a + b, 0) / weightDiffs.length;
            weightProgresses.push(avgWeightDiff);
          }
        }

        if (tonnageProgresses.length > 0) {
          avgTonnageProgress =
            tonnageProgresses.reduce((a, b) => a + b, 0) /
            tonnageProgresses.length;
        }

        if (weightProgresses.length > 0) {
          avgWeightProgress =
            weightProgresses.reduce((a, b) => a + b, 0) /
            weightProgresses.length;
        }
      }
    }

    return {
      avgSetsPerWeek,
      avgTonnageProgress,
      avgWeightProgress,
    };
  };

  const metrics = calculateMetrics();
  const showMetrics =
    selectedExerciseIds.length === 0 && selectedPlannedIds.length === 0;

  const renderChart = (
    datasets: Dataset[],
    title: string,
    colors: string[],
    xLabel: string,
    yLabel: string,
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
              {getTranslation(language, "loadingData")}
            </Text>
          </View>
        </View>
      );
    }

    if (!datasets || datasets.length === 0) {
      return null;
    }

    const filteredDatasets = datasets
      .map((dataset) => ({
        ...dataset,
        data: dataset.data.filter(
          (item) =>
            item.x &&
            typeof item.x === "string" &&
            item.x.split("-").length === 3 &&
            !item.x.includes("undefined"),
        ),
      }))
      .filter((dataset) => dataset.data.length > 0);

    if (filteredDatasets.length === 0) {
      return null;
    }

    const buildHighlightZones = (): Zone[] => {
      if (!maintenanceCalories || filteredDatasets.length === 0) return [];

      const allDataPoints = filteredDatasets.flatMap((dataset) => dataset.data);
      if (allDataPoints.length === 0) return [];

      const start = new Date(allDataPoints[0].x);
      const end = new Date(allDataPoints[allDataPoints.length - 1].x);

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
          const entry = getEntryByDate(key);
          if (entry) {
            sum += entry.calories;
            cnt += 1;
          }
        }
        if (cnt > 0) {
          const avg = sum / cnt;
          const color =
            avg < maintenanceCalories
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

    const lineColors = colors.slice(0, filteredDatasets.length);

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
          datasets={filteredDatasets}
          lineColors={lineColors}
          axisColors={axisColors}
          zones={zones}
          width={350}
          height={300}
          margin={{ top: 20, right: 80, bottom: 80, left: 80 }}
          showLegend={true}
        />
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {isLoading && (
        <BlurView
          style={styles.fullScreenLoader}
          intensity={50}
          tint={colorScheme === "dark" ? "dark" : "light"}
        >
          <View style={styles.loaderContent}>
            <ActivityIndicator size="large" color={themeColors.primary} />
            <Text
              style={[
                styles.centeredLoadingText,
                { color: themeColors.text, marginTop: 16, textAlign: "center" },
              ]}
            >
              {getTranslation(language, "loadingData")}
            </Text>
          </View>
        </BlurView>
      )}

      {!isLoading && (
        <>
          <View style={styles.form}>
            {showResultsList ? (
              <View style={styles.pickerPlaceholder} />
            ) : (
              <TouchableOpacity
                onPress={() => setIsModalVisible(true)}
                style={[
                  styles.pickerButton,
                  { borderColor: themeColors.border },
                ]}
              >
                <Text
                  style={[styles.pickerButtonText, { color: themeColors.text }]}
                >
                  {selectedExerciseIds.length > 0 ||
                  selectedPlannedIds.length > 0
                    ? formatTranslation(language, "selected", {
                        count:
                          selectedExerciseIds.length +
                          selectedPlannedIds.length,
                      })
                    : getTranslation(language, "selectExercises")}
                </Text>
              </TouchableOpacity>
            )}
            <MaterialIcons
              name={showResultsList ? "bar-chart" : "list"}
              size={24}
              color={themeColors.icon}
              onPress={() => {
                const newValue = !showResultsList;
                if (newValue) {
                  setResultsViewPending(true);
                }
                setShowResultsList(newValue);
              }}
              style={styles.icon}
            />
          </View>

          {showResultsList ? (
            plans.length === 0 ||
            (plans.length > 0 && isLoading) ||
            resultsViewPending ? (
              <View style={styles.resultsListLoader}>
                <ActivityIndicator size="large" color={themeColors.primary} />
                <Text
                  style={[
                    styles.centeredLoadingText,
                    {
                      color: themeColors.text,
                      marginTop: 16,
                      textAlign: "center",
                    },
                  ]}
                >
                  {getTranslation(language, "loadingData")}
                </Text>
              </View>
            ) : (
              <>
                {isRenderingResults && (
                  <View style={styles.resultsListLoader}>
                    <ActivityIndicator
                      size="large"
                      color={themeColors.primary}
                    />
                    <Text
                      style={[
                        styles.centeredLoadingText,
                        {
                          color: themeColors.text,
                          marginTop: 16,
                          textAlign: "center",
                        },
                      ]}
                    >
                      {getTranslation(language, "loadingData")}
                    </Text>
                  </View>
                )}
                <ResultsList
                  plans={plans}
                  dateFilterStart={dateFilterStart}
                  dateFilterEnd={dateFilterEnd}
                  onResultDeleted={() => {
                    loadPlansFromDB();
                  }}
                  isLoading={isLoading}
                />
              </>
            )
          ) : (
            <>
              {showMetrics && (
                <View style={styles.metricsContainer}>
                  <View
                    style={[
                      styles.metricCard,
                      { backgroundColor: themeColors.card },
                    ]}
                  >
                    <Text
                      style={[styles.metricTitle, { color: themeColors.text }]}
                    >
                      Среднее количество подходов в неделю
                    </Text>
                    <Text
                      style={[styles.metricValue, { color: themeColors.text }]}
                    >
                      {metrics.avgSetsPerWeek !== null
                        ? metrics.avgSetsPerWeek.toFixed(1)
                        : "—"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCard,
                      { backgroundColor: themeColors.card },
                    ]}
                  >
                    <Text
                      style={[styles.metricTitle, { color: themeColors.text }]}
                    >
                      Средний прогресс тоннажа
                    </Text>
                    <Text
                      style={[styles.metricValue, { color: themeColors.text }]}
                    >
                      {metrics.avgTonnageProgress !== null
                        ? `${
                            metrics.avgTonnageProgress > 0 ? "+" : ""
                          }${metrics.avgTonnageProgress.toFixed(1)} кг`
                        : "—"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.metricCard,
                      { backgroundColor: themeColors.card },
                    ]}
                  >
                    <Text
                      style={[styles.metricTitle, { color: themeColors.text }]}
                    >
                      Средний прогресс веса
                    </Text>
                    <Text
                      style={[styles.metricValue, { color: themeColors.text }]}
                    >
                      {metrics.avgWeightProgress !== null
                        ? `${
                            metrics.avgWeightProgress > 0 ? "+" : ""
                          }${metrics.avgWeightProgress.toFixed(1)} кг`
                        : "—"}
                    </Text>
                  </View>
                </View>
              )}
              {selectedExerciseIds.length > 0 && absoluteMaxWeight.length > 0 && (
                <View style={styles.metricsContainer}>
                  <View
                    style={[
                      styles.metricCard,
                      { backgroundColor: themeColors.card },
                    ]}
                  >
                    <Text
                      style={[styles.metricTitle, { color: themeColors.text }]}
                    >
                      Абсолютный максимум веса
                    </Text>
                    {absoluteMaxWeight.map((item) => (
                      <View key={item.exerciseId} style={styles.absoluteMaxRow}>
                        <Text
                          style={[styles.absoluteMaxExercise, { color: themeColors.text }]}
                          numberOfLines={1}
                        >
                          {item.exerciseName}
                        </Text>
                        <Text
                          style={[styles.absoluteMaxValue, { color: themeColors.text }]}
                        >
                          {item.maxWeight.toFixed(1)} кг
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {chartData.tonnage.length > 0 && (
                <>
                  {visibleMetrics.tonnage && renderChart(
                    chartData.tonnage,
                    getTranslation(language, "generalTonnage"),
                    themeColors.chartLine,
                    getTranslation(language, "date"),
                    getTranslation(language, "tonnage"),
                  )}
                  {visibleMetrics.maxWeight && renderChart(
                    chartData.maxWeight,
                    getTranslation(language, "maxWeight"),
                    themeColors.chartLine,
                    getTranslation(language, "date"),
                    getTranslation(language, "weightLabel"),
                  )}
                  {visibleMetrics.maxReps && renderChart(
                    chartData.maxReps,
                    getTranslation(language, "maxReps"),
                    themeColors.chartLine,
                    getTranslation(language, "date"),
                    getTranslation(language, "reps"),
                  )}
                  {visibleMetrics.avgWeight && renderChart(
                    chartData.avgWeight,
                    getTranslation(language, "avgWeight"),
                    themeColors.chartLine,
                    getTranslation(language, "date"),
                    getTranslation(language, "weightLabel"),
                  )}
                  {visibleMetrics.minWeight && renderChart(
                    chartData.minWeight,
                    getTranslation(language, "minWeight"),
                    themeColors.chartLine,
                    getTranslation(language, "date"),
                    getTranslation(language, "weightLabel"),
                  )}
                  {visibleMetrics.workoutTime && renderChart(
                    chartData.workoutTime,
                    getTranslation(language, "workoutTime"),
                    themeColors.chartLine,
                    getTranslation(language, "date"),
                    getTranslation(language, "minutes"),
                  )}
                </>
              )}

              {showMetrics && (
                <View style={styles.crepatureContainer}>
                  <Crepature />
                </View>
              )}
            </>
          )}

          <AnalyticsExerciseSelector
            isVisible={isModalVisible}
            exercises={exercises}
            plannedResults={plannedResults}
            selectedExerciseIds={selectedExerciseIds}
            selectedPlannedIds={selectedPlannedIds}
            dateFilterStart={dateFilterStart}
            dateFilterEnd={dateFilterEnd}
            onClose={() => setIsModalVisible(false)}
            onSave={(
              newSelectedIds,
              newSelectedPlannedIds,
              newDateStart,
              newDateEnd,
            ) => {
              setSelectedExerciseIds(newSelectedIds);
              setSelectedPlannedIds(newSelectedPlannedIds);
              setDateFilterStart(newDateStart);
              setDateFilterEnd(newDateEnd);
              setIsModalVisible(false);
            }}
          />
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
  fullScreenLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loaderContent: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    borderRadius: 10,
  },
  centeredLoadingText: {
    fontSize: 16,
    fontWeight: "normal",
    marginTop: 16,
  },
  resultsListLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  metricsContainer: {
    marginBottom: 24,
  },
  metricCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  absoluteMaxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
    marginTop: 8,
  },
  absoluteMaxExercise: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  absoluteMaxValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  crepatureContainer: {
    marginVertical: 16,
    alignItems: "center",
  },
});
