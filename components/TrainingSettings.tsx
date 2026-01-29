import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";
import * as dbLayer from "../store/dbLayer";
import useSettingsStore from "../store/settingsStore";
import { Exercise } from "../store/store";

interface TrainingSettingsProps {
  trainingId: string;
  exercises: Exercise[];
  onBack: () => void;
}

interface ExerciseSetting {
  exerciseId: string;
  exerciseName: string;
  setsCount: number;
  hidden: boolean;
}

export const TrainingSettings: React.FC<TrainingSettingsProps> = ({
  trainingId,
  exercises,
  onBack,
}) => {
  const [settings, setSettings] = useState<ExerciseSetting[]>([]);
  const theme = useSettingsStore((state) => state.theme);
  // language не используется здесь

  const colorScheme =
    theme === "dark" ? "dark" : theme === "light" ? "light" : "light";
  const themeColors = Colors[colorScheme];

  const loadSettings = useCallback(async () => {
    try {
      const trainingSettings = await dbLayer.getTrainingSettings(trainingId);
      const settingsMap = new Map(
        trainingSettings.map((s: any) => [s.exerciseId, s])
      );

      const loadedSettings: ExerciseSetting[] = exercises.map((exercise) => {
        const setting = settingsMap.get(exercise.id);
        return {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          setsCount: setting?.setsCount ?? 0,
          hidden: setting?.hidden ?? exercise.hidden ?? false,
        };
      });

      setSettings(loadedSettings);
    } catch (error) {
      console.error("Ошибка загрузки настроек тренировки:", error);
    }
  }, [exercises, trainingId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSetsCount = async (exerciseId: string, setsCount: number) => {
    const setting = settings.find((s) => s.exerciseId === exerciseId);
    if (!setting) return;

    const updatedSetting = {
      ...setting,
      setsCount,
    };

    await dbLayer.saveTrainingSetting({
      trainingId,
      exerciseId,
      setsCount,
      hidden: setting.hidden,
    });

    setSettings((prev) =>
      prev.map((s) => (s.exerciseId === exerciseId ? updatedSetting : s))
    );
  };

  const toggleHidden = async (exerciseId: string) => {
    const setting = settings.find((s) => s.exerciseId === exerciseId);
    if (!setting) return;

    const newHidden = !setting.hidden;

    console.log(
      "[TrainingSettings] toggle hidden from settings:",
      exerciseId,
      "->",
      newHidden
    );
    await dbLayer.updateExerciseHidden(exerciseId, newHidden);
    await dbLayer.saveTrainingSetting({
      trainingId,
      exerciseId,
      setsCount: setting.setsCount,
      hidden: newHidden,
    });

    setSettings((prev) =>
      prev.map((s) =>
        s.exerciseId === exerciseId ? { ...s, hidden: newHidden } : s
      )
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        {
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>}
        <Text style={[styles.title, { color: themeColors.text }]}>
          Настройки тренировки
        </Text>
      </View>

      <FlatList
        data={settings}
        keyExtractor={(item) => item.exerciseId}
        renderItem={({ item }) => (
          <View
            style={[
              styles.settingCard,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            <Text
              style={[styles.exerciseName, { color: themeColors.text }]}
              numberOfLines={1}
            >
              {item.exerciseName}
            </Text>
            <TextInput
              style={[
                styles.setsInput,
                {
                  color: themeColors.text,
                  borderColor: themeColors.border,
                  backgroundColor: themeColors.background,
                },
              ]}
              placeholder="0"
              placeholderTextColor={themeColors.icon}
              keyboardType="numeric"
              value={item.setsCount.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                updateSetsCount(item.exerciseId, value);
              }}
            />
            <TouchableOpacity
              onPress={() => toggleHidden(item.exerciseId)}
              style={styles.checkbox}
            >
              <MaterialIcons
                name={item.hidden ? "check-box-outline-blank" : "check-box"}
                size={24}
                color={item.hidden ? themeColors.icon : themeColors.tint}
              />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    marginRight: 12,
  },
  setsInput: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: "center",
    marginRight: 12,
  },
  checkbox: {
    padding: 4,
  },
});
