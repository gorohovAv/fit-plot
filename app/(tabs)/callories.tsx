import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import Plot from "../../components/Plot";
import useCaloriesStore from "../../store/calloriesStore";
import useSettingsStore from "../../store/settingsStore";
import { Colors } from "../../constants/Colors";

export default function CaloriesScreen() {
  const [calories, setCalories] = useState("");
  const [weight, setWeight] = useState("");
  const { entries, addEntry, getEntryByDate } = useCaloriesStore();

  const theme = useSettingsStore((state) => state.theme);
  const colorScheme =
    theme === "dark"
      ? Colors.dark
      : theme === "light"
      ? Colors.light
      : Colors.light;

  const today = new Date().toISOString().split("T")[0];
  const todayEntry = getEntryByDate(today);

  const handleSave = () => {
    const caloriesNum = parseInt(calories);
    const weightNum = parseFloat(weight);

    if (!calories || !weight) {
      Alert.alert("Ошибка", "Заполните все поля");
      return;
    }

    if (isNaN(caloriesNum) || caloriesNum <= 0) {
      Alert.alert("Ошибка", "Введите корректное количество калорий");
      return;
    }

    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert("Ошибка", "Введите корректный вес");
      return;
    }

    addEntry({
      date: today,
      calories: caloriesNum,
      weight: weightNum,
    });

    setCalories("");
    setWeight("");
    Alert.alert("Успех", "Данные сохранены");
  };

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartData = sortedEntries.map((entry) => ({
    x: entry.date,
    y: entry.calories,
  }));

  const weightData = sortedEntries.map((entry) => ({
    x: entry.date,
    y: entry.weight,
  }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colorScheme.background }]}
    >
      <View
        style={[styles.formContainer, { backgroundColor: colorScheme.card }]}
      >
        <Text style={[styles.title, { color: colorScheme.text }]}>Калории</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colorScheme.text }]}>
            Калории за день
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
            placeholder="Введите количество калорий"
            keyboardType="numeric"
            placeholderTextColor={colorScheme.icon}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colorScheme.text }]}>
            Ваш вес (кг)
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
            placeholder="Введите ваш вес"
            keyboardType="numeric"
            placeholderTextColor={colorScheme.icon}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colorScheme.tint }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: colorScheme.card }]}>
            Сохранить
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
              Сегодня:
            </Text>
            <Text style={[styles.todayText, { color: colorScheme.text }]}>
              Калории: {todayEntry.calories} ккал
            </Text>
            <Text style={[styles.todayText, { color: colorScheme.text }]}>
              Вес: {todayEntry.weight} кг
            </Text>
          </View>
        )}
      </View>

      {sortedEntries.length > 0 && (
        <View
          style={[styles.chartContainer, { backgroundColor: colorScheme.card }]}
        >
          <Text style={[styles.chartTitle, { color: colorScheme.text }]}>
            График калорий и веса
          </Text>
          <Plot
            data={chartData}
            secondData={weightData}
            secondYAxisLabel="Вес (кг)"
            secondYAxisColor={colorScheme.chartLine[1]}
            width={350}
            height={250}
            margin={{ top: 20, right: 50, bottom: 40, left: 50 }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
