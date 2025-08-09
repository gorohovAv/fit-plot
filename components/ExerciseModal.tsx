import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  Pressable,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { EXERCISE_LIST } from "../constants/exerciseList";
import { MuscleGroup, ExerciseType } from "../store/store";
import { Colors } from "../constants/Colors";
import useSettingsStore from "../store/settingsStore";
import { getTranslation } from "@/utils/localization";
import { useColorScheme } from "react-native";

export default function ExerciseModal({
  visible,
  onClose,
  onSubmit,
  initialExercise,
  isEdit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (exercise: any) => void;
  initialExercise: any;
  isEdit: boolean;
}) {
  const [showExerciseList, setShowExerciseList] = useState(false);
  const [exercise, setExercise] = useState(initialExercise);

  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const systemTheme = useColorScheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const themeColors = Colors[currentTheme || "light"];

  React.useEffect(() => {
    setExercise(initialExercise);
  }, [initialExercise, visible]);

  const handleSelectExercise = (item: any) => {
    setExercise({
      ...exercise,
      ...item,
    });
    setShowExerciseList(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: themeColors.modalOverlay },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              },
            ]}
          >
            {showExerciseList ? (
              <>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                  {getTranslation(language, "chooseExercise")}
                </Text>
                <FlatList
                  data={EXERCISE_LIST}
                  keyExtractor={(item) => item.name}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.exerciseItem,
                        {
                          borderBottomColor: themeColors.border,
                          backgroundColor: themeColors.cardSecondary,
                        },
                      ]}
                      onPress={() => handleSelectExercise(item)}
                    >
                      <Text style={{ color: themeColors.text }}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: themeColors.buttonSecondary,
                      borderColor: themeColors.border,
                    },
                  ]}
                  onPress={() => setShowExerciseList(false)}
                >
                  <Text style={{ color: themeColors.buttonSecondaryText }}>
                    {getTranslation(language, "back")}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={[styles.modalTitle, { color: themeColors.text }]}
                  >
                    {isEdit
                      ? getTranslation(language, "editExercise")
                      : getTranslation(language, "addExercise")}
                  </Text>
                  <TouchableOpacity onPress={() => setShowExerciseList(true)}>
                    <MaterialIcons
                      name="list"
                      size={28}
                      color={themeColors.tint}
                    />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: themeColors.text,
                      backgroundColor: themeColors.inputBackground,
                      borderColor: themeColors.inputBorder,
                    },
                  ]}
                  placeholder={getTranslation(language, "exerciseName")}
                  placeholderTextColor={themeColors.placeholderText}
                  value={exercise.name}
                  onChangeText={(text) =>
                    setExercise({ ...exercise, name: text })
                  }
                  autoFocus={true}
                  blurOnSubmit={false}
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: themeColors.text,
                      backgroundColor: themeColors.inputBackground,
                      borderColor: themeColors.inputBorder,
                    },
                  ]}
                  placeholder={getTranslation(language, "comment")}
                  placeholderTextColor={themeColors.placeholderText}
                  value={exercise.comment ?? ""}
                  onChangeText={(text) =>
                    setExercise({ ...exercise, comment: text })
                  }
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: themeColors.text,
                      backgroundColor: themeColors.inputBackground,
                      borderColor: themeColors.inputBorder,
                    },
                  ]}
                  placeholder={getTranslation(language, "timerDuration")}
                  placeholderTextColor={themeColors.placeholderText}
                  keyboardType="numeric"
                  value={
                    exercise.timerDuration !== undefined
                      ? exercise.timerDuration.toString()
                      : ""
                  }
                  onChangeText={(text) =>
                    setExercise({
                      ...exercise,
                      timerDuration: text ? parseInt(text) || 0 : undefined,
                    })
                  }
                />
                <View
                  style={[
                    styles.pickerContainer,
                    {
                      backgroundColor: themeColors.inputBackground,
                      borderColor: themeColors.inputBorder,
                    },
                  ]}
                >
                  <Picker
                    selectedValue={exercise.muscleGroup}
                    onValueChange={(value) =>
                      setExercise({ ...exercise, muscleGroup: value })
                    }
                    style={{
                      color: themeColors.text,
                    }}
                    dropdownIconColor={themeColors.icon}
                  >
                    <Picker.Item
                      label={getTranslation(language, "chest")}
                      value="chest"
                    />
                    <Picker.Item
                      label={getTranslation(language, "triceps")}
                      value="triceps"
                    />
                    <Picker.Item
                      label={getTranslation(language, "biceps")}
                      value="biceps"
                    />
                    <Picker.Item
                      label={getTranslation(language, "forearms")}
                      value="forearms"
                    />
                    <Picker.Item
                      label={getTranslation(language, "delts")}
                      value="delts"
                    />
                    <Picker.Item
                      label={getTranslation(language, "back")}
                      value="back"
                    />
                    <Picker.Item
                      label={getTranslation(language, "glutes")}
                      value="glutes"
                    />
                    <Picker.Item
                      label={getTranslation(language, "quads")}
                      value="quads"
                    />
                    <Picker.Item
                      label={getTranslation(language, "hamstrings")}
                      value="hamstrings"
                    />
                    <Picker.Item
                      label={getTranslation(language, "calves")}
                      value="calves"
                    />
                    <Picker.Item
                      label={getTranslation(language, "abs")}
                      value="abs"
                    />
                  </Picker>
                </View>
                <View
                  style={[
                    styles.pickerContainer,
                    {
                      backgroundColor: themeColors.inputBackground,
                      borderColor: themeColors.inputBorder,
                    },
                  ]}
                >
                  <Picker
                    selectedValue={exercise.type}
                    onValueChange={(value) =>
                      setExercise({ ...exercise, type: value })
                    }
                    style={{
                      color: themeColors.text,
                    }}
                    dropdownIconColor={themeColors.icon}
                  >
                    <Picker.Item
                      label={getTranslation(language, "machine")}
                      value="machine"
                    />
                    <Picker.Item
                      label={getTranslation(language, "freeWeight")}
                      value="free weight"
                    />
                    <Picker.Item
                      label={getTranslation(language, "ownWeight")}
                      value="own weight"
                    />
                    <Picker.Item
                      label={getTranslation(language, "cables")}
                      value="cables"
                    />
                  </Picker>
                </View>
                <TouchableOpacity
                  style={[
                    styles.amplitudeButton,
                    {
                      backgroundColor: themeColors.cardSecondary,
                      borderColor: themeColors.border,
                    },
                  ]}
                  onPress={() =>
                    setExercise({
                      ...exercise,
                      amplitude:
                        exercise.amplitude === "full" ? "partial" : "full",
                    })
                  }
                >
                  <MaterialIcons
                    name={exercise.amplitude === "full" ? "straighten" : "crop"}
                    size={24}
                    color={themeColors.icon}
                  />
                  <Text style={{ color: themeColors.text }}>
                    {exercise.amplitude === "full"
                      ? getTranslation(language, "fullAmplitude")
                      : getTranslation(language, "partialAmplitude")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unilateralButton,
                    {
                      backgroundColor: themeColors.cardSecondary,
                      borderColor: themeColors.border,
                    },
                  ]}
                  onPress={() =>
                    setExercise({
                      ...exercise,
                      unilateral: !exercise.unilateral,
                    })
                  }
                >
                  <Text style={{ color: themeColors.text }}>
                    {exercise.unilateral
                      ? getTranslation(language, "unilateral")
                      : getTranslation(language, "bilateral")}
                  </Text>
                </TouchableOpacity>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      {
                        backgroundColor: themeColors.buttonSecondary,
                        borderColor: themeColors.border,
                      },
                    ]}
                    onPress={onClose}
                  >
                    <Text style={{ color: themeColors.buttonSecondaryText }}>
                      {getTranslation(language, "cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: themeColors.buttonPrimary },
                    ]}
                    onPress={() => onSubmit(exercise)}
                  >
                    <Text style={{ color: themeColors.buttonPrimaryText }}>
                      {isEdit
                        ? getTranslation(language, "save")
                        : getTranslation(language, "add")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  amplitudeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  unilateralButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  exerciseItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderRadius: 8,
    marginBottom: 4,
  },
});
