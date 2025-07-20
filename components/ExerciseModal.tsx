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
import { EXERCISE_LIST } from "../constants/exerciseList"; // D:\Projects\fit-plot\constants\exerciseList.ts
import { MuscleGroup, ExerciseType } from "../store/store";

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
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {showExerciseList ? (
              <>
                <Text style={styles.modalTitle}>Выбери упражнение</Text>
                <FlatList
                  data={EXERCISE_LIST}
                  keyExtractor={(item) => item.name}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.exerciseItem}
                      onPress={() => handleSelectExercise(item)}
                    >
                      <Text>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowExerciseList(false)}
                >
                  <Text>Назад</Text>
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
                  <Text style={styles.modalTitle}>
                    {isEdit
                      ? "Редактировать упражнение"
                      : "Добавить упражнение"}
                  </Text>
                  <TouchableOpacity onPress={() => setShowExerciseList(true)}>
                    <MaterialIcons name="list" size={28} color="#1976d2" />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Название упражнения"
                  value={exercise.name}
                  onChangeText={(text) =>
                    setExercise({ ...exercise, name: text })
                  }
                  autoFocus={true}
                  blurOnSubmit={false}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Комментарий"
                  value={exercise.comment ?? ""}
                  onChangeText={(text) =>
                    setExercise({ ...exercise, comment: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Время таймера (сек)"
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
                >
                  <Picker.Item label="Тренажёр" value="machine" />
                  <Picker.Item label="Свободные веса" value="free weight" />
                  <Picker.Item label="Собственный вес" value="own weight" />
                  <Picker.Item label="Тросы" value="cables" />
                </Picker>
                <TouchableOpacity
                  style={styles.amplitudeButton}
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
                    color="black"
                  />
                  <Text>
                    {exercise.amplitude === "full"
                      ? "Полная амплитуда"
                      : "Неполная амплитуда"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.unilateralButton}
                  onPress={() =>
                    setExercise({
                      ...exercise,
                      unilateral: !exercise.unilateral,
                    })
                  }
                >
                  <Text>
                    {exercise.unilateral ? "Одностороннее" : "Двустороннее"}
                  </Text>
                </TouchableOpacity>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onClose}
                  >
                    <Text>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={() => onSubmit(exercise)}
                  >
                    <Text>{isEdit ? "Сохранить" : "Добавить"}</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
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
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  amplitudeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginBottom: 10,
    gap: 5,
  },
  unilateralButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
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
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: "center",
    marginTop: 10,
  },
  submitButton: {
    padding: 10,
    backgroundColor: "#1976d2",
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: "center",
    marginTop: 10,
  },
  exerciseItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
