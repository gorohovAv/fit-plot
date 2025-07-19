import React, { useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TextInput,
} from "react-native";
import useStore, { PlannedResult, Exercise } from "../store/store";

const { height: windowHeight } = Dimensions.get("window");

type PlanScaleProps = {
  planName: string;
  trainingId: string;
};

export default function PlanScale({ planName, trainingId }: PlanScaleProps) {
  const plans = useStore((s) => s.plans);
  const addPlannedResult = useStore((s) => s.addPlannedResult);

  const plan = plans.find((p) => p.planName === planName);
  const training = plan?.trainings.find((t) => t.id === trainingId);
  const plannedResults = training?.plannedResults ?? [];
  const exercises = training?.exercises ?? [];

  const [modalVisible, setModalVisible] = useState(false);
  const [editingResult, setEditingResult] = useState<PlannedResult | null>(
    null
  );

  const scrollY = useRef(new Animated.Value(0)).current;

  const openModal = (result?: PlannedResult) => {
    setEditingResult(result ?? null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingResult(null);
  };

  const handleSave = (result: PlannedResult) => {
    addPlannedResult(planName, trainingId, result);
    closeModal();
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: PlannedResult;
    index: number;
  }) => {
    const inputRange = [(index - 2) * 100, index * 100, (index + 2) * 100];
    const opacity = scrollY.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: "clamp",
    });

    const exercise = exercises.find((ex) => ex.id === item.exerciseId);

    return (
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          opacity,
          height: 100,
        }}
      >
        <Text style={{ width: 80, textAlign: "right" }}>
          {item.plannedDate}
        </Text>
        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#007AFF",
            marginHorizontal: 16,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2,
          }}
          onPress={() => openModal(item)}
        />
        <View
          style={{
            flex: 1,
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 12,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 4,
            marginLeft: -16,
          }}
        >
          <Text>
            {exercise?.name ?? "Упражнение"}: {item.plannedWeight}х
            {item.plannedReps}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Animated.FlatList
        data={plannedResults}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 40 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      />
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 40,
          right: 40,
          backgroundColor: "#007AFF",
          borderRadius: 24,
          width: 48,
          height: 48,
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => openModal()}
      >
        <Text style={{ color: "#fff", fontSize: 32 }}>+</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide">
        <PlanResultModal
          visible={modalVisible}
          onClose={closeModal}
          exercises={exercises}
          initialResult={editingResult}
          onSave={handleSave}
        />
      </Modal>
    </View>
  );
}

type PlanResultModalProps = {
  visible: boolean;
  onClose: () => void;
  exercises: Exercise[];
  initialResult: PlannedResult | null;
  onSave: (result: PlannedResult) => void;
};

function PlanResultModal({
  visible,
  onClose,
  exercises,
  initialResult,
  onSave,
}: PlanResultModalProps) {
  const [exerciseId, setExerciseId] = useState(
    initialResult?.exerciseId ?? exercises[0]?.id ?? ""
  );
  const [plannedWeight, setPlannedWeight] = useState(
    initialResult?.plannedWeight?.toString() ?? ""
  );
  const [plannedReps, setPlannedReps] = useState(
    initialResult?.plannedReps?.toString() ?? ""
  );
  const [plannedDate, setPlannedDate] = useState(
    initialResult?.plannedDate ?? ""
  );
  const [amplitude, setAmplitude] = useState<"full" | "partial">(
    initialResult?.amplitude ?? "full"
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.3)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 320,
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <Text>Упражнение</Text>
        <View>
          {exercises.map((ex) => (
            <TouchableOpacity key={ex.id} onPress={() => setExerciseId(ex.id)}>
              <Text
                style={{
                  fontWeight: exerciseId === ex.id ? "bold" : "normal",
                }}
              >
                {ex.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text>Вес</Text>
        <TextInput
          value={plannedWeight}
          onChangeText={setPlannedWeight}
          keyboardType="numeric"
        />
        <Text>Повторения</Text>
        <TextInput
          value={plannedReps}
          onChangeText={setPlannedReps}
          keyboardType="numeric"
        />
        <Text>Дата</Text>
        <TextInput value={plannedDate} onChangeText={setPlannedDate} />
        <TouchableOpacity
          onPress={() => {
            onSave({
              exerciseId,
              plannedWeight: Number(plannedWeight),
              plannedReps: Number(plannedReps),
              plannedDate,
              amplitude,
            });
          }}
        >
          <Text>Сохранить</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text>Отмена</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
