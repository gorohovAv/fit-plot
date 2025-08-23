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
  PlannedResult,
} from "../../store/store";
import useSettingsStore from "@/store/settingsStore";
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
import * as dbLayer from "@/store/dbLayer";

type ChartData = {
  x: string;
  y: number;
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

type RawExercise = {
  id?: string;
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  unilateral: boolean;
  amplitude: "full" | "partial";
};

type RawResult = {
  exerciseId: string;
  weight: number;
  reps: number;
  date: string;
  amplitude: "full" | "partial";
};

type RawTraining = {
  id?: string;
  name: string;
  exercises: RawExercise[];
  results: RawResult[];
};

type RawPlan = {
  planName: string;
  trainings: RawTraining[];
};

export default function AnalyticsScreen() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [selectedPlannedIds, setSelectedPlannedIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [autoPeriod, setAutoPeriod] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chartData, setChartData] = useState<{
    tonnage: Dataset[];
    maxWeight: Dataset[];
    maxReps: Dataset[];
    plannedTonnage: Dataset[];
    plannedMaxWeight: Dataset[];
    plannedMaxReps: Dataset[];
  }>({
    tonnage: [],
    maxWeight: [],
    maxReps: [],
    plannedTonnage: [],
    plannedMaxWeight: [],
    plannedMaxReps: [],
  });
  const [showResultsList, setShowResultsList] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const font = useFont(require("../../assets/fonts/SpaceMono-Regular.ttf"));
  const route = useRoute();
  const theme = useSettingsStore((state) => state.theme);
  const { language } = useSettingsStore();
  const colorScheme =
    theme === "system" ? Appearance.getColorScheme?.() ?? "light" : theme;
  const themeColors = Colors[colorScheme];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      await dbLayer.initDatabase();
      const loadedPlans = await dbLayer.getAllPlansWithData();
      setPlans(loadedPlans);
    } catch (error) {
      console.error("Ошибка загрузки планов:", error);
    }
  };

  const getDayString = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatLabel = (dayStr: string) => {
    if (!dayStr || typeof dayStr !== "string") return "";
    const parts = dayStr.split("-");
    if (parts.length !== 3) return "";
    const [, month, day] = parts;
    if (!month || !day || isNaN(Number(month)) || isNaN(Number(day))) return "";
    return `${month}-${day}`;
  };

  useEffect(() => {
    setIsLoading(true);

    const processData = async () => {
      if (selectedExerciseIds.length === 0 && selectedPlannedIds.length === 0) {
        setChartData({
          tonnage: [],
          maxWeight: [],
          maxReps: [],
          plannedTonnage: [],
          plannedMaxWeight: [],
          plannedMaxReps: [],
        });
        setIsLoading(false);
        return;
      }

      const allResults: Result[] = [];
      const allPlannedResults: PlannedResult[] = [];

      selectedExerciseIds.forEach((id) => {
        plans
          .flatMap((plan: Plan) =>
            plan.trainings.flatMap((training: Training) =>
              training.results.filter(
                (result: Result) => result.exerciseId === id
              )
            )
          )
          .forEach((result: Result) => allResults.push(result));
      });

      selectedPlannedIds.forEach((plannedId) => {
        const exerciseName = plannedId.replace("planned-", "");
        const exercise = exercises.find(
          (ex: Exercise) => ex.name === exerciseName
        );
        if (exercise) {
          plans
            .flatMap((plan: Plan) =>
              plan.trainings.flatMap((training: Training) =>
                training.plannedResults.filter(
                  (planned: PlannedResult) => planned.exerciseId === exercise.id
                )
              )
            )
            .forEach((planned: PlannedResult) =>
              allPlannedResults.push(planned)
            );
        }
      });

      allResults.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      allPlannedResults.sort(
        (a, b) =>
          new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()
      );

      if (allResults.length === 0 && allPlannedResults.length === 0) {
        setChartData({
          tonnage: [],
          maxWeight: [],
          maxReps: [],
          plannedTonnage: [],
          plannedMaxWeight: [],
          plannedMaxReps: [],
        });
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
      const plannedTonnageData: Dataset[] = [];
      const plannedMaxWeightData: Dataset[] = [];
      const plannedMaxRepsData: Dataset[] = [];

      selectedExerciseIds.forEach((exerciseId) => {
        const exerciseResults = allResults.filter(
          (r) => r.exerciseId === exerciseId
        );
        const exercise = exercises.find((ex: Exercise) => ex.id === exerciseId);

        if (exerciseResults.length > 0 && exercise) {
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

          tonnageData.push({
            data: sortedDays.map((day) => ({
              x: day,
              y: groupedByDay[day].tonnage,
            })),
            axisLabel: getTranslation(language, "tonnage"),
          });

          maxWeightData.push({
            data: sortedDays.map((day) => ({
              x: day,
              y: groupedByDay[day].maxWeight,
            })),
            axisLabel: getTranslation(language, "weight"),
          });

          maxRepsData.push({
            data: sortedDays.map((day) => ({
              x: day,
              y: groupedByDay[day].maxReps,
            })),
            axisLabel: getTranslation(language, "reps"),
          });
        }
      });

      selectedPlannedIds.forEach((plannedId) => {
        const exerciseName = plannedId.replace("planned-", "");
        const exercise = exercises.find(
          (ex: Exercise) => ex.name === exerciseName
        );

        if (exercise) {
          const exercisePlannedResults = allPlannedResults.filter(
            (pr) => pr.exerciseId === exercise.id
          );

          if (exercisePlannedResults.length > 0) {
            const groupedPlannedByDay = exercisePlannedResults.reduce(
              (acc, planned) => {
                const day = getDayString(planned.plannedDate);
                if (!acc[day]) {
                  acc[day] = { tonnage: 0, maxWeight: 0, maxReps: 0 };
                }
                acc[day].tonnage += planned.plannedWeight * planned.plannedReps;
                acc[day].maxWeight = Math.max(
                  acc[day].maxWeight,
                  planned.plannedWeight
                );
                acc[day].maxReps = Math.max(
                  acc[day].maxReps,
                  planned.plannedReps
                );
                return acc;
              },
              {} as Record<
                string,
                { tonnage: number; maxWeight: number; maxReps: number }
              >
            );

            const sortedPlannedDays = Object.keys(groupedPlannedByDay).sort();

            plannedTonnageData.push({
              data: sortedPlannedDays.map((day) => ({
                x: day,
                y: groupedPlannedByDay[day].tonnage,
              })),
              axisLabel: getTranslation(language, "tonnage"),
            });

            plannedMaxWeightData.push({
              data: sortedPlannedDays.map((day) => ({
                x: day,
                y: groupedPlannedByDay[day].maxWeight,
              })),
              axisLabel: getTranslation(language, "weight"),
            });

            plannedMaxRepsData.push({
              data: sortedPlannedDays.map((day) => ({
                x: day,
                y: groupedPlannedByDay[day].maxReps,
              })),
              axisLabel: getTranslation(language, "reps"),
            });
          }
        }
      });

      setChartData({
        tonnage: tonnageData,
        maxWeight: maxWeightData,
        maxReps: maxRepsData,
        plannedTonnage: plannedTonnageData,
        plannedMaxWeight: plannedMaxWeightData,
        plannedMaxReps: plannedMaxRepsData,
      });

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
  ]);

  if (!font) {
    return null;
  }

  const exercises = plans.flatMap((plan: Plan) =>
    plan.trainings.flatMap((training: Training) => training.exercises)
  );

  const plannedResults = plans.flatMap((plan: Plan) =>
    plan.trainings.flatMap((training: Training) => training.plannedResults)
  );

  const renderChart = (
    datasets: Dataset[],
    title: string,
    colors: string[],
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
            !item.x.includes("undefined")
        ),
      }))
      .filter((dataset) => dataset.data.length > 0);

    if (filteredDatasets.length === 0) {
      return null;
    }

    const buildHighlightZones = (): Zone[] => {
      return [];
    };

    const zones = buildHighlightZones();

    const lineColors = colors.slice(0, filteredDatasets.length);

    const axisColors = {
      axis: themeColors.text,
      labels: themeColors.text,
      background: themeColors.card,
    };

    const legendItems = filteredDatasets.map((dataset, index) => {
      const fullLabel = dataset.axisLabel;
      const exerciseName = fullLabel.includes(" - ")
        ? fullLabel.split(" - ")[1]
        : fullLabel;

      return {
        label: exerciseName,
        color: lineColors[index % lineColors.length],
      };
    });

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
          legendItems={legendItems}
        />
      </View>
    );
  };

  const importPlans = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log("Выбор файла отменен.");
        return;
      }

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri);

      let importedRawData: { plans: RawPlan[] } | RawPlan | RawPlan[];
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
        rawPlansToProcess = [importedRawData as RawPlan];
      }

      const processedPlans: Plan[] = [];
      const existingPlans = await dbLayer.getAllPlansWithData();

      for (const rawPlan of rawPlansToProcess) {
        if (existingPlans.some((p: Plan) => p.planName === rawPlan.planName)) {
          console.warn(
            `План с именем "${rawPlan.planName}" уже существует. Пропускаем.`
          );
          Alert.alert(
            "Предупреждение",
            `План с именем "${rawPlan.planName}" уже существует и не будет добавлен.`
          );
          continue;
        }

        const newTrainings: Training[] = [];
        const exerciseIdMap = new Map<string, string>();

        for (const rawTraining of rawPlan.trainings) {
          const newTrainingId = uuidv4();
          const newExercises: Exercise[] = [];

          for (const rawExercise of rawTraining.exercises) {
            const newExerciseId = uuidv4();
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
              continue;
            }
            newResults.push({
              exerciseId: mappedExerciseId,
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
            plannedResults: [],
          });
        }
        processedPlans.push({
          planName: rawPlan.planName,
          trainings: newTrainings,
        });
      }

      if (processedPlans.length > 0) {
        for (const plan of processedPlans) {
          await dbLayer.savePlan(plan.planName);
          for (const training of plan.trainings) {
            await dbLayer.saveTraining(
              training.id,
              plan.planName,
              training.name
            );
            for (const exercise of training.exercises) {
              await dbLayer.saveExercise({
                id: exercise.id,
                trainingId: training.id,
                name: exercise.name,
                muscleGroup: exercise.muscleGroup,
                type: exercise.type,
                unilateral: exercise.unilateral,
                amplitude: exercise.amplitude,
              });
            }
            for (const result of training.results) {
              await dbLayer.saveResult(result);
            }
          }
        }

        await loadPlans();
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
              {selectedExerciseIds.length > 0 || selectedPlannedIds.length > 0
                ? formatTranslation(language, "selected", {
                    count:
                      selectedExerciseIds.length + selectedPlannedIds.length,
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
        (chartData.tonnage.length > 0 ||
          chartData.plannedTonnage.length > 0) && (
          <>
            {renderChart(
              chartData.tonnage,
              getTranslation(language, "generalTonnage"),
              themeColors.chartLine,
              getTranslation(language, "date"),
              getTranslation(language, "tonnage")
            )}
            {chartData.plannedTonnage.length > 0 &&
              renderChart(
                chartData.plannedTonnage,
                getTranslation(language, "generalTonnage") + " (ПЛАН)",
                themeColors.chartLine,
                getTranslation(language, "date"),
                getTranslation(language, "tonnage")
              )}
            {renderChart(
              chartData.maxWeight,
              getTranslation(language, "maxWeight"),
              themeColors.chartLine,
              getTranslation(language, "date"),
              getTranslation(language, "weight")
            )}
            {chartData.plannedMaxWeight.length > 0 &&
              renderChart(
                chartData.plannedMaxWeight,
                getTranslation(language, "maxWeight") + " (ПЛАН)",
                themeColors.chartLine,
                getTranslation(language, "date"),
                getTranslation(language, "weight")
              )}
            {renderChart(
              chartData.maxReps,
              getTranslation(language, "maxReps"),
              themeColors.chartLine,
              getTranslation(language, "date"),
              getTranslation(language, "reps")
            )}
            {chartData.plannedMaxReps.length > 0 &&
              renderChart(
                chartData.plannedMaxReps,
                getTranslation(language, "maxReps") + " (ПЛАН)",
                themeColors.chartLine,
                getTranslation(language, "date"),
                getTranslation(language, "reps")
              )}
          </>
        )
      )}

      <AnalyticsExerciseSelector
        isVisible={isModalVisible}
        exercises={exercises}
        plannedResults={plannedResults}
        selectedExerciseIds={selectedExerciseIds}
        selectedPlannedIds={selectedPlannedIds}
        onClose={() => setIsModalVisible(false)}
        onSave={(newSelectedIds, newSelectedPlannedIds) => {
          setSelectedExerciseIds(newSelectedIds);
          setSelectedPlannedIds(newSelectedPlannedIds);
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
