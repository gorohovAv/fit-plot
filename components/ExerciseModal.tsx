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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { EXERCISE_LIST } from "../constants/exerciseList";
import { MuscleGroup, ExerciseType } from "../store/store";
import { Colors } from "../constants/Colors";
import useSettingsStore from "../store/settingsStore";
import { getTranslation } from "@/utils/localization";

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
  const colorScheme =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  const themeColors = Colors[colorScheme];

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
            { backgroundColor: themeColors.background + "CC" },
          ]}
        >
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
                        { borderBottomColor: themeColors.border },
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
                    { backgroundColor: themeColors.background },
                  ]}
                  onPress={() => setShowExerciseList(false)}
                >
                  <Text style={{ color: themeColors.text }}>
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
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                    },
                  ]}
                  placeholder={getTranslation(language, "exerciseName")}
                  placeholderTextColor={themeColors.tabIconDefault}
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
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                    },
                  ]}
                  placeholder={getTranslation(language, "comment")}
                  placeholderTextColor={themeColors.tabIconDefault}
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
                      backgroundColor: themeColors.background,
                      borderColor: themeColors.border,
                    },
                  ]}
                  placeholder={getTranslation(language, "timerDuration")}
                  placeholderTextColor={themeColors.tabIconDefault}
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
                <Picker
                  selectedValue={exercise.muscleGroup}
                  onValueChange={(value) =>
                    setExercise({ ...exercise, muscleGroup: value })
                  }
                  style={{
                    color: themeColors.text,
                    backgroundColor: themeColors.background,
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
                <Picker
                  selectedValue={exercise.type}
                  onValueChange={(value) =>
                    setExercise({ ...exercise, type: value })
                  }
                  style={{
                    color: themeColors.text,
                    backgroundColor: themeColors.background,
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
                <TouchableOpacity
                  style={[
                    styles.amplitudeButton,
                    { backgroundColor: themeColors.background },
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
                    { backgroundColor: themeColors.background },
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
                      { backgroundColor: themeColors.background },
                    ]}
                    onPress={onClose}
                  >
                    <Text style={{ color: themeColors.text }}>
                      {getTranslation(language, "cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: themeColors.tint },
                    ]}
                    onPress={() => onSubmit(exercise)}
                  >
                    <Text style={{ color: themeColors.background }}>
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
    width: "80%",
    padding: 20,
    borderRadius: 10,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  amplitudeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    gap: 5,
  },
  unilateralButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
    marginTop: 10,
  },
  submitButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
    marginTop: 10,
  },
  exerciseItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
});
