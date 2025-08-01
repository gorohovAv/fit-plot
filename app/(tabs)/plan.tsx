import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Button,
  Platform,
} from "react-native";
import useStore from "../../store/store";
import { Exercise, PlannedResult, Plan } from "../../store/store";
import { Picker } from "@react-native-picker/picker";
import dayjs from "dayjs";
import useSettingsStore from "../../store/settingsStore";
import { Colors } from "../../constants/Colors";

const SEASON_COLORS = [
  "#A7D8FF", // зима
  "#B6F5B6", // весна
  "#FFF7A7", // лето
  "#FFD6A7", // осень
];

function getSeasonColor(month: number) {
  if ([11, 0, 1].includes(month)) return SEASON_COLORS[0]; // зима
  if ([2, 3, 4].includes(month)) return SEASON_COLORS[1]; // весна
  if ([5, 6, 7].includes(month)) return SEASON_COLORS[2]; // лето
  return SEASON_COLORS[3]; // осень
}

function getMonthLabel(date: dayjs.Dayjs) {
  return date.format("MMMM YYYY");
}

function getMonthsRange(plannedResults: PlannedResult[]) {
  let start: dayjs.Dayjs;
  if (plannedResults.length > 0) {
    start = dayjs(plannedResults.map((r) => r.plannedDate).sort()[0]).startOf(
      "month"
    );
  } else {
    start = dayjs().startOf("month");
  }
  const end = dayjs().add(12, "month").endOf("month"); // например, показываем год вперёд
  const months = [];
  let current = start.clone();
  while (current.isBefore(end)) {
    months.push(current.clone());
    current = current.add(1, "month");
  }
  return months;
}

export default function PlanScreen() {
  const plans = useStore((s) => s.plans);
  const addPlannedResult = useStore((s) => s.addPlannedResult);

  // Для простоты берём первый план
  const plan: Plan = plans[0];
  const allExercises = plan.trainings.flatMap((t) => t.exercises);
  const plannedResults = plan.trainings.flatMap((t) => t.plannedResults);

  const months = useMemo(
    () => getMonthsRange(plannedResults),
    [plannedResults]
  );

  // Модалка
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [plannedWeight, setPlannedWeight] = useState<string>("");
  const [plannedReps, setPlannedReps] = useState<string>("");
  const [plannedDate, setPlannedDate] = useState<string>("");

  const openModal = (month: dayjs.Dayjs) => {
    setSelectedMonth(month);
    setModalVisible(true);
    setSelectedExerciseId(allExercises[0]?.id || "");
    setPlannedWeight("");
    setPlannedReps("");
    setPlannedDate(month.startOf("month").format("YYYY-MM-DD"));
  };

  const closeModal = () => setModalVisible(false);

  const handleSubmit = () => {
    if (
      !selectedMonth ||
      !selectedExerciseId ||
      !plannedWeight ||
      !plannedReps ||
      !plannedDate
    )
      return;
    // Находим тренировку, куда добавить результат
    const training = plan.trainings.find((t) =>
      t.exercises.some((e) => e.id === selectedExerciseId)
    );
    if (!training) return;
    addPlannedResult(plan.planName, training.id, {
      exerciseId: selectedExerciseId,
      plannedWeight: Number(plannedWeight),
      plannedReps: Number(plannedReps),
      plannedDate,
      amplitude: "full", // или добавить выбор
    });
    closeModal();
  };

  const theme = useSettingsStore((s) => s.theme);
  const colorScheme =
    theme === "system"
      ? Platform.OS === "web"
        ? window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : "light" // Можно заменить на react-native Appearance, если нужно
      : theme;
  const colors = Colors[colorScheme];

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: colors.background }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 16,
          color: colors.text,
        }}
      >
        Планирование результатов
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {months.map((month, idx) => (
          <View
            key={month.format("YYYY-MM")}
            style={{
              width: 120,
              height: 80,
              margin: 8,
              borderRadius: 12,
              backgroundColor: getSeasonColor(month.month()),
              opacity: 0.5,
              justifyContent: "flex-end",
              alignItems: "flex-end",
              position: "relative",
              borderColor: colors.border,
              borderWidth: 1,
            }}
          >
            <Text
              style={{
                position: "absolute",
                left: 8,
                top: 8,
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              {getMonthLabel(month)}
            </Text>
            <TouchableOpacity
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.tint,
                opacity: 0.8,
                justifyContent: "center",
                alignItems: "center",
                margin: 8,
              }}
              onPress={() => openModal(month)}
            >
              <Text
                style={{ color: colors.card, fontSize: 24, fontWeight: "bold" }}
              >
                +
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              padding: 20,
              borderRadius: 12,
              width: 300,
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                marginBottom: 8,
                color: colors.text,
              }}
            >
              Добавить плановый результат
            </Text>
            <Text style={{ color: colors.text }}>Упражнение:</Text>
            <Picker
              selectedValue={selectedExerciseId}
              onValueChange={setSelectedExerciseId}
              style={{ width: "100%", color: colors.text }}
            >
              {allExercises.map((ex) => (
                <Picker.Item key={ex.id} label={ex.name} value={ex.id} />
              ))}
            </Picker>
            <Text style={{ color: colors.text }}>Вес (кг):</Text>
            <TextInput
              value={plannedWeight}
              onChangeText={setPlannedWeight}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 8,
                borderRadius: 6,
                padding: 4,
                color: colors.text,
                backgroundColor: colors.background,
              }}
              placeholderTextColor={colors.icon}
            />
            <Text style={{ color: colors.text }}>Повторения:</Text>
            <TextInput
              value={plannedReps}
              onChangeText={setPlannedReps}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 8,
                borderRadius: 6,
                padding: 4,
                color: colors.text,
                backgroundColor: colors.background,
              }}
              placeholderTextColor={colors.icon}
            />
            <Text style={{ color: colors.text }}>
              Дата (в пределах месяца):
            </Text>
            <TextInput
              value={plannedDate}
              onChangeText={setPlannedDate}
              placeholder="YYYY-MM-DD"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 8,
                borderRadius: 6,
                padding: 4,
                color: colors.text,
                backgroundColor: colors.background,
              }}
              placeholderTextColor={colors.icon}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Button
                title="Отмена"
                onPress={closeModal}
                color={colors.error}
              />
              <Button
                title="Сохранить"
                onPress={handleSubmit}
                color={colors.success}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
