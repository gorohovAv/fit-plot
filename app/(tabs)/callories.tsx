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

export default function CaloriesScreen() {
  const [calories, setCalories] = useState("");
  const [weight, setWeight] = useState("");
  const { entries, addEntry, getEntryByDate } = useCaloriesStore();

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
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Калории</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Калории за день</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="Введите количество калорий"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ваш вес (кг)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Введите ваш вес"
            keyboardType="numeric"
            placeholderTextColor="#888"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Сохранить</Text>
        </TouchableOpacity>

        {todayEntry && (
          <View style={styles.todayInfo}>
            <Text style={styles.todayTitle}>Сегодня:</Text>
            <Text style={styles.todayText}>
              Калории: {todayEntry.calories} ккал
            </Text>
            <Text style={styles.todayText}>Вес: {todayEntry.weight} кг</Text>
          </View>
        )}
      </View>

      {sortedEntries.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>График калорий и веса</Text>
          <Plot
            data={chartData}
            secondData={weightData}
            secondYAxisLabel="Вес (кг)"
            secondYAxisColor="#e74c3c"
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
    backgroundColor: "#f8f9fa",
  },
  formContainer: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
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
    color: "#2c3e50",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#2c3e50",
  },
  saveButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  todayInfo: {
    backgroundColor: "#e8f5e8",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  todayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 8,
  },
  todayText: {
    fontSize: 14,
    color: "#2c3e50",
    marginBottom: 4,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
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
    color: "#2c3e50",
    marginBottom: 16,
    textAlign: "center",
  },
});
