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
                  Выбери упражнение
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
                  <Text style={{ color: themeColors.text }}>Назад</Text>
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
                      ? "Редактировать упражнение"
                      : "Добавить упражнение"}
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
                  placeholder="Название упражнения"
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
                  placeholder="Комментарий"
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
                  placeholder="Время таймера (сек)"
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
                  <Picker.Item label="Грудь" value="chest" />
                  <Picker.Item label="Трицепс" value="triceps" />
                  <Picker.Item label="Бицепс" value="biceps" />
                  <Picker.Item label="Предплечья" value="forearms" />
                  <Picker.Item label="Плечи" value="delts" />
                  <Picker.Item label="Спина" value="back" />
                  <Picker.Item label="Ягодицы" value="glutes" />
                  <Picker.Item label="Квадрицепсы" value="quads" />
                  <Picker.Item label="Бицепс бедра" value="hamstrings" />
                  <Picker.Item label="Икры" value="calves" />
                  <Picker.Item label="Пресс" value="abs" />
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
                  <Picker.Item label="Тренажёр" value="machine" />
                  <Picker.Item label="Свободные веса" value="free weight" />
                  <Picker.Item label="Собственный вес" value="own weight" />
                  <Picker.Item label="Тросы" value="cables" />
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
                      ? "Полная амплитуда"
                      : "Неполная амплитуда"}
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
                    {exercise.unilateral ? "Одностороннее" : "Двустороннее"}
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
                    <Text style={{ color: themeColors.text }}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: themeColors.tint },
                    ]}
                    onPress={() => onSubmit(exercise)}
                  >
                    <Text style={{ color: themeColors.background }}>
                      {isEdit ? "Сохранить" : "Добавить"}
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
