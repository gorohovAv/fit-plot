import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import useStore from "../store/store";
import { useRoute } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import Timer from "./Timer";
import useSettingsStore from "../store/settingsStore";
import { Colors } from "../constants/Colors";

type MuscleGroup = string; // Пример: Определяем как строку, если нет других определений
type ExerciseType = string; // Пример: Определяем как строку, если нет других определений

interface Result {
  exerciseId: string;
  weight: number;
  reps: number;
  amplitude: "full" | "partial";
  date: string;
}

type ExerciseProps = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  type: ExerciseType;
  unilateral: boolean;
  reps: number;
  sets: number;
  amplitude: "full" | "partial";
  comment?: string;
  timerDuration?: number;
  onRepsChange: (reps: number) => void;
  onSetsChange: (sets: number) => void;
  onComplete: () => void;
  completed: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

export const Exercise: React.FC<ExerciseProps> = ({
  id,
  name,
  muscleGroup,
  type,
  unilateral,
  reps,
  sets,
  amplitude,
  comment,
  timerDuration,
  onRepsChange,
  onSetsChange,
  onComplete,
  completed,
  onEdit,
  onDelete,
}) => {
  const route = useRoute();
  const { workoutId, planName } = route.params as {
    workoutId: string;
    planName: string;
  };
  const navigation = useNavigation();
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState({
    weight: 0,
    reps: 0,
    amplitude: "full" as "full" | "partial",
  });
  const { plans, addResult } = useStore();
  const [showTimer, setShowTimer] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const theme = useSettingsStore((state) => state.theme);
  const colorScheme =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const themeColors = Colors[colorScheme];

  const exerciseResults =
    plans
      .find((plan) => plan.planName === planName)
      ?.trainings.find((training) => training.id === workoutId)
      ?.results.filter((res) => res.exerciseId === id)
      .slice(-5) || [];

  const handleAddResult = () => {
    const newResult: Result = {
      exerciseId: id,
      weight: result.weight,
      reps: result.reps,
      amplitude: result.amplitude,
      date: new Date().toISOString(),
    };
    addResult(planName, workoutId, newResult);
    setResult({ weight: 0, reps: 0, amplitude: "full" });
  };

  return (
    <View
      style={[
        styles.container,
        completed && { backgroundColor: themeColors.success + "22" },
        { backgroundColor: themeColors.card },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.name, { color: themeColors.text }]}>{name}</Text>
        <Text style={[styles.details, { color: themeColors.icon }]}>
          {muscleGroup} • {type} •{" "}
          {unilateral ? "Одностороннее" : "Двустороннее"} •{" "}
          {amplitude === "full" ? "Полная амплитуда" : "Неполная амплитуда"}
        </Text>
        {comment ? (
          <Text style={[styles.comment, { color: themeColors.icon }]}>
            {comment}
          </Text>
        ) : null}
      </View>

      {/* Кнопки редактирования и удаления */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <MaterialIcons name="edit" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <MaterialIcons name="delete" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            console.log("Навигация на аналитику с параметрами:", {
              exerciseId: id,
              exerciseName: name,
            });
            navigation.navigate("analytics", {
              exerciseId: id,
              exerciseName: name,
            });
          }}
          style={styles.actionButton}
        >
          <MaterialIcons name="analytics" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Список результатов */}
      {exerciseResults.length > 0 && (
        <View style={styles.resultsList}>
          {exerciseResults.map((res, index) => (
            <View key={index} style={styles.resultItem}>
              <MaterialIcons
                name={res.amplitude === "full" ? "straighten" : "crop"}
                size={16}
                color={themeColors.icon}
              />
              <Text style={[styles.resultText, { color: themeColors.icon }]}>
                {res.weight} кг × {res.reps} повторений
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Форма ввода веса, повторений и амплитуды */}
      <View style={styles.resultForm}>
        <TextInput
          style={[
            styles.weightInput,
            {
              color: themeColors.text,
              borderColor: themeColors.border,
              backgroundColor: themeColors.card,
            },
          ]}
          placeholder="Вес"
          placeholderTextColor={themeColors.icon}
          keyboardType="numeric"
          value={result.weight.toString()}
          onChangeText={(text) =>
            setResult({ ...result, weight: parseFloat(text) || 0 })
          }
        />
        <Text style={[styles.xSymbol, { color: themeColors.text }]}>×</Text>
        <TextInput
          style={[
            styles.repsInput,
            {
              color: themeColors.text,
              borderColor: themeColors.border,
              backgroundColor: themeColors.card,
            },
          ]}
          placeholder="Повторения"
          placeholderTextColor={themeColors.icon}
          keyboardType="numeric"
          value={result.reps.toString()}
          onChangeText={(text) =>
            setResult({ ...result, reps: parseInt(text) || 0 })
          }
        />
        <TouchableOpacity
          onPress={() =>
            setResult({
              ...result,
              amplitude: result.amplitude === "full" ? "partial" : "full",
            })
          }
          style={styles.amplitudeToggle}
        >
          <MaterialIcons
            name={result.amplitude === "full" ? "straighten" : "crop"}
            size={24}
            color={themeColors.icon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: themeColors.success },
          ]}
          onPress={handleAddResult}
          activeOpacity={0.7}
        >
          <MaterialIcons name="check" size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.timerWrapper}
          onPress={() => {
            setShowTimer(false);
            setTimeout(() => {
              setTimerKey((k) => k + 1);
              setShowTimer(true);
            }, 10);
          }}
          activeOpacity={0.7}
        >
          {showTimer ? (
            <Timer
              key={timerKey}
              duration={timerDuration ?? 60}
              size={40}
              strokeWidth={6}
              onEnd={() => setShowTimer(false)}
            />
          ) : (
            <MaterialIcons name="timer" size={32} color={themeColors.icon} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 36,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#f8f8f8",
    minHeight: 280,
  },
  completed: {
    backgroundColor: "#e8f5e9",
  },
  header: {
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  details: {
    fontSize: 14,
    color: "#666",
  },
  resultForm: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  weightInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  repsInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  xSymbol: {
    marginHorizontal: 8,
  },
  confirmButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: "#4caf50",
    borderRadius: 4,
    width: 30,
    alignItems: "center",
  },
  resultsList: {
    marginTop: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    color: "#666",
  },
  actions: {
    position: "absolute",
    right: 12,
    top: 24,
    flexDirection: "column",
    gap: 8,
  },
  actionButton: {
    padding: 20,
  },
  amplitudeToggle: {
    marginLeft: 8,
    padding: 4,
  },
  timerWrapper: {
    marginLeft: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
  comment: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
    fontStyle: "italic",
  },
});
