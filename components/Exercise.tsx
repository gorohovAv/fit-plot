import { getTranslation } from "@/utils/localization";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";
import useSettingsStore from "../store/settingsStore";
import useStore from "../store/store";
import useTimerStore from "../store/timerStore";
import Timer from "./Timer";

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
  const { startTimer, stopTimer, isTimerRunning } = useTimerStore();
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
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

  const handleTimerPress = () => {
    if (isTimerRunning(id)) {
      stopTimer(id);
    } else {
      startTimer(id, timerDuration ?? 60);
    }
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
          {unilateral
            ? getTranslation(language, "unilateralExercise")
            : getTranslation(language, "bilateralExercise")}{" "}
          •{" "}
          {amplitude === "full"
            ? getTranslation(language, "fullAmplitudeExercise")
            : getTranslation(language, "partialAmplitudeExercise")}
        </Text>
        {comment ? (
          <Text style={[styles.comment, { color: themeColors.icon }]}>
            {comment}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <MaterialIcons name="edit" size={20} color={themeColors.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <MaterialIcons name="delete" size={20} color={themeColors.icon} />
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
          <MaterialIcons name="analytics" size={20} color={themeColors.icon} />
        </TouchableOpacity>
      </View>

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
                {res.weight} {getTranslation(language, "kg")} × {res.reps}{" "}
                {getTranslation(language, "reps")}
              </Text>
            </View>
          ))}
        </View>
      )}

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
          placeholder={getTranslation(language, "weightPlaceholder")}
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
          placeholder={getTranslation(language, "repsPlaceholder")}
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
          <MaterialIcons name="check" size={20} color={themeColors.card} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.timerWrapper}
          onPress={handleTimerPress}
          activeOpacity={0.7}
        >
          {isTimerRunning(id) ? (
            <Timer
              exerciseId={id}
              duration={timerDuration ?? 60}
              size={40}
              strokeWidth={6}
              onEnd={() => stopTimer(id)}
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
    minHeight: 280,
    paddingRight: 80,
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
  },
  resultForm: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  weightInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: "center",
  },
  repsInput: {
    borderWidth: 1,
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
    borderRadius: 4,
    width: 30,
    alignItems: "center",
  },
  resultsList: {
    marginTop: 8,
    minHeight: 40,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
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
    width: 48,
    height: 48,
    minWidth: 48,
  },
  comment: {
    fontSize: 13,
    marginTop: 2,
    fontStyle: "italic",
  },
});
