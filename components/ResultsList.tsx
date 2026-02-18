import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "../hooks/useColorScheme";
import * as dbLayer from "../store/dbLayer";
import useSettingsStore from "../store/settingsStore";
import { Plan } from "../store/store";

type ResultsListProps = {
  plans: Plan[];
  onResultDeleted?: () => void;
  dateFilterStart?: string;
  dateFilterEnd?: string;
  isLoading?: boolean;
};

type ResultWithExercise = {
  id?: number;
  exerciseId: string;
  exerciseName: string;
  date: string;
  weight: number;
  reps: number;
};

const ResultsList: React.FC<ResultsListProps> = ({
  plans,
  onResultDeleted,
  dateFilterStart,
  dateFilterEnd,
  isLoading = false,
}) => {
  const { theme: settingsTheme } = useSettingsStore();
  const systemTheme = useColorScheme() ?? "light";
  const currentTheme = settingsTheme === "system" ? systemTheme : settingsTheme;
  const themeColors = Colors[currentTheme];

  if (isLoading) {
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


  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (error) {
      return dateStr;
    }
  };

  const handleDelete = async (resultId: number | undefined) => {
    if (!resultId) return;
    try {
      await dbLayer.deleteResult(resultId);
      if (onResultDeleted) {
        onResultDeleted();
      }
    } catch (error) {
      console.error("Ошибка удаления результата:", error);
    }
  };

  const allResults: ResultWithExercise[] = plans
    .flatMap((plan) =>
      plan.trainings.flatMap((training) =>
        training.results
          .filter((result) => {
            if (dateFilterStart && result.date < dateFilterStart) return false;
            if (dateFilterEnd && result.date > dateFilterEnd) return false;
            return true;
          })
          .map((result) => {
            const exercise = training.exercises.find(
              (ex) => ex.id === result.exerciseId
            );
            return {
              id: result.id,
              exerciseId: result.exerciseId,
              exerciseName: exercise?.name || "unknown",
              date: result.date,
              weight: result.weight,
              reps: result.reps,
            };
          })
      )
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {allResults.map((result, index) => (
        <View
          key={`${result.id || index}-${result.date}`}
          style={[styles.resultCard, { backgroundColor: themeColors.card }]}
        >
          <View style={styles.resultContent}>
            <Text style={[styles.exerciseName, { color: themeColors.text }]}>
              {result.exerciseName}
            </Text>
            <Text style={[styles.resultText, { color: themeColors.text }]}>
              {result.weight} кг × {result.reps} повторений
            </Text>
            <Text style={[styles.dateText, { color: themeColors.text }]}>
              {formatDateTime(result.date)}
            </Text>
          </View>
          {result.id && (
            <TouchableOpacity
              onPress={() => handleDelete(result.id)}
              style={styles.deleteButton}
            >
              <MaterialIcons name="close" size={24} color={themeColors.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  resultCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minHeight: 60,
  },
  resultContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.6,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default ResultsList;
