import { formatTranslation, getTranslation } from "@/utils/localization";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import VerticalBarChart from "../../components/VerticalBarChart";
import { Colors } from "../../constants/Colors";
import { useSteps } from "../../hooks/useSteps";
import useCaloriesStore from "../../store/calloriesStore";
import useSettingsStore from "../../store/settingsStore";

export default function CaloriesScreen() {
  const [calories, setCalories] = useState("");
  const [weight, setWeight] = useState("");
  const [maintenanceCaloriesInput, setMaintenanceCaloriesInput] = useState("");
  const [isEditingMaintenance, setIsEditingMaintenance] = useState(false);

  const {
    entries,
    addEntry,
    getEntryByDate,
    maintenanceCalories,
    setMaintenanceCalories,
  } = useCaloriesStore();
  const { language } = useSettingsStore();
  const {
    todaySteps,
    isTracking,
    isAvailable,
    refreshSteps,
    startTracking,
    stopTracking,
  } = useSteps();

  const theme = useSettingsStore((state) => state.theme);
  const colorScheme =
    theme === "dark"
      ? Colors.dark
      : theme === "light"
      ? Colors.light
      : Colors.light;

  const today = new Date().toISOString().split("T")[0];
  const todayEntry = getEntryByDate(today);

  // Initialize form with today's data if it exists
  useEffect(() => {
    if (todayEntry) {
      setCalories(todayEntry.calories.toString());
      setWeight(todayEntry.weight.toString());
    }
  }, [todayEntry]);

  // Инициализация поля maintenance calories
  useEffect(() => {
    if (maintenanceCalories !== null) {
      setMaintenanceCaloriesInput(maintenanceCalories.toString());
      setIsEditingMaintenance(false);
    } else {
      setIsEditingMaintenance(true);
    }
  }, [maintenanceCalories]);

  //useEffect(() => {
    //const interval = setInterval(() => {
      //refreshSteps();
    //}, 10000); // обновляем каждые 10 секунд

    //return () => clearInterval(interval);
  //}, []);

  const handleSave = () => {
    const caloriesNum = parseInt(calories);
    const weightNum = parseFloat(weight);

    if (!calories || !weight) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "fillAllFields")
      );
      return;
    }

    if (isNaN(caloriesNum) || caloriesNum <= 0) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "enterValidCalories")
      );
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "enterValidWeight")
      );
      return;
    }

    addEntry({
      date: today,
      calories: caloriesNum,
      weight: weightNum,
    });

    // Don't clear the form if updating today's entry
    if (!todayEntry) {
      setCalories("");
      setWeight("");
    }
    //Alert.alert(
      //getTranslation(language, "success"),
      //getTranslation(language, "dataSaved")
    //);
  };

  const handleMaintenanceCaloriesSave = () => {
    const maintenanceNum = parseInt(maintenanceCaloriesInput);

    if (!maintenanceCaloriesInput) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "enterMaintenanceCalories")
      );
      return;
    }

    if (isNaN(maintenanceNum) || maintenanceNum <= 0) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "enterValidMaintenanceCalories")
      );
      return;
    }

    setMaintenanceCalories(maintenanceNum);
    setIsEditingMaintenance(false);
    //Alert.alert(getTranslation(language, "maintenanceCaloriesSaved"));
  };

  const handleEditMaintenance = () => {
    setIsEditingMaintenance(true);
  };

  const handleStepTrackingToggle = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colorScheme.background }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Форма калорий на поддержание */}
        <View
          style={[styles.formContainer, { backgroundColor: colorScheme.card }]}
        >
          <Text style={[styles.title, { color: colorScheme.text }]}>
            {getTranslation(language, "maintenanceCalories")}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme.text }]}>
              {getTranslation(language, "maintenanceCaloriesPerDay")}
            </Text>
            <View style={styles.maintenanceContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.maintenanceInput,
                  {
                    backgroundColor: colorScheme.card,
                    color: colorScheme.text,
                    borderColor: colorScheme.border,
                  },
                  !isEditingMaintenance && styles.disabledInput,
                ]}
                value={maintenanceCaloriesInput}
                onChangeText={setMaintenanceCaloriesInput}
                placeholder={getTranslation(
                  language,
                  "enterMaintenanceCalories"
                )}
                keyboardType="numeric"
                placeholderTextColor={colorScheme.icon}
                editable={isEditingMaintenance}
              />
              {isEditingMaintenance ? (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colorScheme.tint },
                  ]}
                  onPress={handleMaintenanceCaloriesSave}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: colorScheme.card },
                    ]}
                  >
                    {getTranslation(language, "save")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colorScheme.warning },
                  ]}
                  onPress={handleEditMaintenance}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      { color: colorScheme.card },
                    ]}
                  >
                    {getTranslation(language, "change")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {maintenanceCalories && (
            <View
              style={[
                styles.maintenanceInfo,
                { backgroundColor: colorScheme.success + "22" },
              ]}
            >
              <Text
                style={[
                  styles.maintenanceInfoText,
                  { color: colorScheme.success },
                ]}
              >
                {formatTranslation(language, "maintenanceCaloriesValue", {
                  value: maintenanceCalories,
                })}
              </Text>
            </View>
          )}
        </View>

        <View
          style={[styles.formContainer, { backgroundColor: colorScheme.card }]}
        >
          <Text style={[styles.title, { color: colorScheme.text }]}>
            {getTranslation(language, "calories")}
          </Text>

          {isAvailable && (
            <View
              style={[
                styles.stepsContainer,
                { backgroundColor: colorScheme.success + "22" },
              ]}
            >
              <Text style={[styles.stepsTitle, { color: colorScheme.success }]}>
                Шаги сегодня: {todaySteps}
              </Text>
              <Text style={[styles.stepsSubtitle, { color: colorScheme.text }]}>
                Калории от шагов: {Math.round(todaySteps * 0.04)}
              </Text>
              <TouchableOpacity
                style={[
                  styles.trackingButton,
                  {
                    backgroundColor: isTracking
                      ? colorScheme.error
                      : colorScheme.tint,
                  },
                ]}
                onPress={handleStepTrackingToggle}
              >
                <Text
                  style={[
                    styles.trackingButtonText,
                    { color: colorScheme.card },
                  ]}
                >
                  {isTracking
                    ? "Остановить отслеживание"
                    : "Начать отслеживание"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme.text }]}>
              {getTranslation(language, "caloriesPerDay")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme.card,
                  color: colorScheme.text,
                  borderColor: colorScheme.border,
                },
              ]}
              value={calories}
              onChangeText={setCalories}
              placeholder={getTranslation(language, "enterCalories")}
              keyboardType="numeric"
              placeholderTextColor={colorScheme.icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colorScheme.text }]}>
              {getTranslation(language, "yourWeight")}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colorScheme.card,
                  color: colorScheme.text,
                  borderColor: colorScheme.border,
                },
              ]}
              value={weight}
              onChangeText={setWeight}
              placeholder={getTranslation(language, "enterYourWeight")}
              keyboardType="numeric"
              placeholderTextColor={colorScheme.icon}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colorScheme.tint }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, { color: colorScheme.card }]}>
              {todayEntry
                ? getTranslation(language, "update") || "Обновить"
                : getTranslation(language, "save")
              }
            </Text>
          </TouchableOpacity>

          {todayEntry && (
            <View
              style={[
                styles.todayInfo,
                { backgroundColor: colorScheme.success + "22" },
              ]}
            >
              <Text style={[styles.todayTitle, { color: colorScheme.success }]}>
                {getTranslation(language, "today")}
              </Text>
              <Text style={[styles.todayText, { color: colorScheme.text }]}>
                {formatTranslation(language, "caloriesValue", {
                  value: todayEntry.calories,
                })}
              </Text>
              <Text style={[styles.todayText, { color: colorScheme.text }]}>
                {formatTranslation(language, "weightValue", {
                  value: todayEntry.weight,
                })}
              </Text>
              {maintenanceCalories && (
                <Text style={[styles.todayText, { color: colorScheme.text }]}>
                  {formatTranslation(language, "deviationFromMaintenance", {
                    value:
                      todayEntry.calories - maintenanceCalories > 0
                        ? "+" + (todayEntry.calories - maintenanceCalories)
                        : (
                            todayEntry.calories - maintenanceCalories
                          ).toString(),
                  })}
                </Text>
              )}
            </View>
          )}
        </View>

        {sortedEntries.length > 0 && (
          <View
            style={[
              styles.chartContainer,
              { backgroundColor: colorScheme.card },
            ]}
          >
            <Text style={[styles.chartTitle, { color: colorScheme.text }]}>
              {getTranslation(language, "caloriesAndWeightChart")}
            </Text>
            <VerticalBarChart
              data={sortedEntries.map(entry => ({
                date: entry.date,
                calories: entry.calories,
                weight: entry.weight,
              }))}
              caloriesColor={colorScheme.chartLine[0]}
              weightColor={colorScheme.chartLine[1]}
              textColor={colorScheme.text}
              backgroundColor={colorScheme.card}
            />

            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: colorScheme.chartLine[0] }
                  ]}
                />
                <Text style={[styles.legendText, { color: colorScheme.text }]}>
                  Калории (вверх)
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: colorScheme.chartLine[1] }
                  ]}
                />
                <Text style={[styles.legendText, { color: colorScheme.text }]}>
                  Вес (вниз)
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 100,
  },
  formContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  stepsContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  stepsSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  trackingButton: {
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  trackingButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  maintenanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  maintenanceInput: {
    flex: 1,
  },
  disabledInput: {
    opacity: 0.7,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  maintenanceInfo: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  maintenanceInfoText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  todayInfo: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  todayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  todayText: {
    fontSize: 14,
    marginBottom: 4,
  },
  chartContainer: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
