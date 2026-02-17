import { getTranslation } from "@/utils/localization";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";
import * as dbLayer from "../store/dbLayer";
import useSettingsStore from "../store/settingsStore";
import useTimerStore from "../store/timerStore";
import { ExerciseVisibilityToggle } from "./ExerciseVisibilityToggle";
import { SwitchLeftIcon } from "./SwitchLeftIcon";
import { SwitchRightIcon } from "./SwitchRightIcon";
import Timer from "./Timer";

type MuscleGroup = string;
type ExerciseType = string;

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
  hidden?: boolean;
  right?: boolean;
  onRepsChange: (reps: number) => void;
  onSetsChange: (sets: number) => void;
  onComplete: () => void;
  completed: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleHidden?: (
    exerciseId: string,
    hidden: boolean,
  ) => Promise<void> | void;
  onToggleRight?: (
    exerciseId: string,
    right: boolean,
  ) => Promise<void> | void;
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
  hidden: hiddenFromProps = false,
  right: rightFromProps = false,
  onRepsChange,
  onSetsChange,
  onComplete,
  completed,
  onEdit,
  onDelete,
  onToggleHidden,
  onToggleRight,
}) => {
  const route = useRoute();
  const { workoutId, planName } = route.params as {
    workoutId: string;
    planName: string;
  };
  const navigation = useNavigation();
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState({
    weight: "",
    reps: "",
    amplitude: "full" as "full" | "partial",
  });
  const [exerciseResults, setExerciseResults] = useState<Result[]>([]);
  const [hidden, setHidden] = useState(Boolean(hiddenFromProps));
  const [right, setRight] = useState(Boolean(rightFromProps));
  const [commentEditing, setCommentEditing] = useState(false);
  const [commentText, setCommentText] = useState(comment || "");
  const { startTimer, stopTimer, isTimerRunning } = useTimerStore();
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  let colorScheme: "light" | "dark" = "light";
  if (theme === "dark") {
    colorScheme = "dark";
  } else if (theme === "light") {
    colorScheme = "light";
  } else {
    colorScheme =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  }
  const themeColors = Colors[colorScheme];

  const loadExerciseResults = async () => {
    try {
      const results = await dbLayer.getResultsByExercise(id);
      const maxMicrohistorySize =
        useSettingsStore.getState().maxMicrohistorySize;
      const formattedResults: Result[] = results
        .filter((r: any) => !r.isPlanned)
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, maxMicrohistorySize)
        .map((r: any) => ({
          exerciseId: r.exerciseId,
          weight: r.weight,
          reps: r.reps,
          amplitude: r.amplitude,
          date: r.date,
        }))
        .reverse();
      setExerciseResults(formattedResults);
    } catch (error) {
      console.error("Ошибка загрузки результатов упражнения из БД:", error);
    }
  };

  useEffect(() => {
    loadExerciseResults();
  }, [id]);

  useEffect(() => {
    const unsubscribe = useSettingsStore.subscribe(
      (state) => state.maxMicrohistorySize,
      () => {
        loadExerciseResults();
      },
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setHidden(Boolean(hiddenFromProps));
  }, [hiddenFromProps]);

  useEffect(() => {
    setRight(Boolean(rightFromProps));
  }, [rightFromProps]);

  useEffect(() => {
    setCommentText(comment || "");
  }, [comment]);

  const handleAddResult = async () => {
    const weight = parseFloat(result.weight.replace(",", ".")) || 0;
    const reps = parseInt(result.reps) || 0;

    if (weight <= 0 || reps <= 0) {
      return;
    }

    const newResult: Result = {
      exerciseId: id,
      weight: weight,
      reps: reps,
      amplitude: result.amplitude,
      date: new Date().toISOString(),
    };

    await dbLayer.saveResult({
      ...newResult,
      isPlanned: false,
    });

    setResult({ weight: "", reps: "", amplitude: "full" });

    await loadExerciseResults();
  };

  const handleTimerPress = () => {
    if (isTimerRunning(id)) {
      stopTimer(id);
    } else {
      startTimer(id, timerDuration ?? 60);
    }
  };

  const handleToggleVisibility = async (
    exerciseId: string,
    newHidden: boolean,
  ) => {
    console.log("[Exercise] toggle hidden icon:", exerciseId, "->", newHidden);
    if (onToggleHidden) {
      await onToggleHidden(exerciseId, newHidden);
    } else {
      await dbLayer.updateExerciseHidden(exerciseId, newHidden);
    }
    setHidden(newHidden);
  };

  const handleToggleRight = async (
    exerciseId: string,
    newRight: boolean,
  ) => {
    console.log("[Exercise] toggle right:", exerciseId, "->", newRight);
    setRight(newRight);
    if (onToggleRight) {
      await onToggleRight(exerciseId, newRight);
    } else {
      await dbLayer.updateExerciseRight(exerciseId, newRight);
    }
  };

  const handleSaveComment = async () => {
    setCommentEditing(false);
    // Сохраняем комментарий через обновление упражнения
    await dbLayer.saveExercise({
      id,
      trainingId: workoutId,
      name,
      muscleGroup,
      type,
      unilateral,
      amplitude,
      comment: commentText,
      timerDuration,
      hidden,
      right,
    });
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
        <View style={styles.commentRow}>
          {commentEditing ? (
            <TextInput
              style={[
                styles.commentInput,
                {
                  color: themeColors.text,
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.card,
                },
              ]}
              value={commentText}
              onChangeText={setCommentText}
              autoFocus
              multiline
            />
          ) : (
            <Text
              style={[
                styles.commentText,
                { color: themeColors.text },
                !commentText && styles.commentEmpty,
              ]}
            >
              {commentText || getTranslation(language, "addNote")}
            </Text>
          )}
          <TouchableOpacity
            style={styles.commentIcon}
            onPress={() => {
              if (commentEditing) {
                handleSaveComment();
              } else {
                setCommentEditing(true);
              }
            }}
          >
            <MaterialIcons
              name={commentEditing ? "check" : "edit"}
              size={20}
              color={themeColors.icon}
            />
          </TouchableOpacity>
        </View>
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
            navigation.navigate(
              "analytics" as never,
              {
                exerciseId: id,
                exerciseName: name,
              } as never,
            );
          }}
          style={styles.actionButton}
        >
          <MaterialIcons name="analytics" size={20} color={themeColors.icon} />
        </TouchableOpacity>
        <ExerciseVisibilityToggle
          exerciseId={id}
          hidden={hidden}
          onToggle={handleToggleVisibility}
        />
        {unilateral && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleToggleRight(id, !right)}
          >
            {right ? (
              <SwitchRightIcon color={themeColors.icon} size={24} />
            ) : (
              <SwitchLeftIcon color={themeColors.icon} size={24} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {exerciseResults.length > 0 && (
        <View style={styles.resultsList}>
          {exerciseResults.map((res, index) => {
            const resultDate = new Date(res.date);
            const today = new Date();
            const isToday = resultDate.toDateString() === today.toDateString();

            return (
              <View key={index} style={styles.resultItem}>
                <MaterialIcons
                  name={res.amplitude === "full" ? "straighten" : "crop"}
                  size={16}
                  color={themeColors.icon}
                />
                <Text style={[styles.resultText, { color: themeColors.icon }]}>
                  {res.weight} {getTranslation(language, "kg")} × {res.reps}{" "}
                  {getTranslation(language, "repsUnit")}
                  {!isToday && (
                    <Text
                      style={[styles.dateText, { color: themeColors.icon }]}
                    >
                      {" "}
                      ({resultDate.toLocaleDateString()})
                    </Text>
                  )}
                </Text>
              </View>
            );
          })}
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
          value={result.weight}
          onChangeText={(text) => setResult({ ...result, weight: text })}
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
          value={result.reps}
          onChangeText={(text) => setResult({ ...result, reps: text })}
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
            <View style={styles.timerComponent}>
              <Timer
                exerciseId={id}
                duration={timerDuration ?? 60}
                size={40}
                strokeWidth={6}
                onEnd={() => stopTimer(id)}
              />
            </View>
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
  dateText: {
    fontSize: 12,
    fontStyle: "italic",
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
  timerComponent: {
    alignItems: "center",
    justifyContent: "center",
  },
  comment: {
    fontSize: 13,
    marginTop: 2,
    fontStyle: "italic",
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  commentText: {
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
  },
  commentEmpty: {
    fontStyle: "italic",
    opacity: 0.6,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    borderWidth: 1,
    borderRadius: 4,
    padding: 4,
    minHeight: 32,
  },
  commentIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
