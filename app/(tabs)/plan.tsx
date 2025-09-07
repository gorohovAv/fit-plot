import { MaterialIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/Colors";
import useSettingsStore from "../../store/settingsStore";
import useStore, { Exercise, Plan, PlannedResult } from "../../store/store";
import { getTranslation } from "../../utils/localization";

// Цвета сезонов для светлой темы
const SEASON_COLORS_LIGHT = {
  winter: "#A7D8FF", // Зимний голубой
  spring: "#B6F5B6", // Весенний зеленый
  summer: "#FFF7A7", // Летний желтый
  autumn: "#FFD6A7", // Осенний оранжевый
};

// Цвета сезонов для темной темы
const SEASON_COLORS_DARK = {
  winter: "#4A90E2", // Темный зимний голубой
  spring: "#7ED321", // Темный весенний зеленый
  summer: "#F5A623", // Темный летний желтый
  autumn: "#D0743C", // Темный осенний оранжевый
};

// Material Icons для сезонов
const SEASON_ICONS = {
  winter: "ac-unit" as const,
  spring: "local-florist" as const,
  summer: "wb-sunny" as const,
  autumn: "nature" as const,
};

// Названия сезонов
const SEASON_NAMES = {
  winter: { english: "Winter", russian: "Зима" },
  spring: { english: "Spring", russian: "Весна" },
  summer: { english: "Summer", russian: "Лето" },
  autumn: { english: "Autumn", russian: "Осень" },
};

function getSeason(month: number): keyof typeof SEASON_COLORS_LIGHT {
  if ([11, 0, 1].includes(month)) return "winter";
  if ([2, 3, 4].includes(month)) return "spring";
  if ([5, 6, 7].includes(month)) return "summer";
  return "autumn";
}

function getSeasonMonths(
  season: keyof typeof SEASON_COLORS_LIGHT,
  year: number
) {
  switch (season) {
    case "winter":
      return [11, 0, 1].map((month) =>
        month === 11
          ? dayjs()
              .year(year - 1)
              .month(month)
          : dayjs().year(year).month(month)
      );
    case "spring":
      return [2, 3, 4].map((month) => dayjs().year(year).month(month));
    case "summer":
      return [5, 6, 7].map((month) => dayjs().year(year).month(month));
    case "autumn":
      return [8, 9, 10].map((month) => dayjs().year(year).month(month));
  }
}

function getSeasonsData(plannedResults: PlannedResult[]) {
  const currentDate = dayjs();
  const currentYear = currentDate.year();
  const currentMonth = currentDate.month();
  const currentSeason = getSeason(currentMonth);

  const seasons: Array<{
    season: keyof typeof SEASON_COLORS_LIGHT;
    year: number;
    months: dayjs.Dayjs[];
    results: PlannedResult[];
    id: string;
  }> = [];

  const seasonKeys: (keyof typeof SEASON_COLORS_LIGHT)[] = [
    "winter",
    "spring",
    "summer",
    "autumn",
  ];

  // Находим индекс текущего сезона
  const currentSeasonIndex = seasonKeys.indexOf(currentSeason);

  // Генерируем 8 сезонов начиная с текущего
  for (let i = 0; i < 8; i++) {
    const seasonIndex = (currentSeasonIndex + i) % 4;
    const season = seasonKeys[seasonIndex];

    // Определяем год для этого сезона
    let year = currentYear;
    if (i >= 4 - currentSeasonIndex) {
      year = currentYear + 1;
    }
    if (i >= 4 - currentSeasonIndex + 4) {
      year = currentYear + 2;
    }

    const months = getSeasonMonths(season, year);
    const seasonResults = plannedResults.filter((result) => {
      const resultDate = dayjs(result.plannedDate);
      return months.some(
        (month) =>
          resultDate.year() === month.year() &&
          resultDate.month() === month.month()
      );
    });

    seasons.push({
      season,
      year,
      months,
      results: seasonResults,
      id: `${season}-${year}`,
    });
  }

  return seasons;
}

interface SeasonZoneProps {
  season: keyof typeof SEASON_COLORS_LIGHT;
  year: number;
  results: PlannedResult[];
  allExercises: Exercise[];
  colors: any;
  language: string;
  isDark: boolean;
  onAddResult: (season: keyof typeof SEASON_COLORS_LIGHT, year: number) => void;
}

function SeasonZone({
  season,
  year,
  results,
  allExercises,
  colors,
  language,
  isDark,
  onAddResult,
}: SeasonZoneProps) {
  const seasonName =
    SEASON_NAMES[season][language as "english" | "russian"] ||
    SEASON_NAMES[season].english;
  const seasonColors = isDark ? SEASON_COLORS_DARK : SEASON_COLORS_LIGHT;
  const seasonColor = seasonColors[season];

  return (
    <View style={{ marginBottom: 32 }}>
      {/* Баннер сезона */}
      <View
        style={{
          backgroundColor: seasonColor,
          borderRadius: 16,
          padding: 20,
          marginBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "bold",
              color: isDark ? "#fff" : "#333",
              marginBottom: 4,
            }}
          >
            {seasonName} {year}
          </Text>
        </View>
        <MaterialIcons
          name={SEASON_ICONS[season]}
          size={48}
          color={isDark ? "#fff" : "#333"}
        />
      </View>

      {/* Список планируемых результатов */}
      <View style={{ paddingHorizontal: 4 }}>
        {results.length > 0 ? (
          results.map((result, index) => {
            const exercise = allExercises.find(
              (ex) => ex.id === result.exerciseId
            );
            return (
              <View
                key={`${result.exerciseId}-${result.plannedDate}-${index}`}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: seasonColor,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                    marginBottom: 4,
                  }}
                >
                  {exercise?.name || "Unknown Exercise"}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {result.plannedWeight}{" "}
                    {getTranslation(language as any, "kg")} ×{" "}
                    {result.plannedReps}{" "}
                    {getTranslation(language as any, "reps")}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 14 }}>
                    {dayjs(result.plannedDate).format("DD.MM.YYYY")}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text
            style={{
              color: colors.textSecondary,
              fontStyle: "italic",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {language === "russian"
              ? "Нет запланированных результатов"
              : "No planned results"}
          </Text>
        )}

        {/* Кнопка добавления */}
        <TouchableOpacity
          style={{
            backgroundColor: colors.tint,
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 8,
          }}
          onPress={() => onAddResult(season, year)}
        >
          <MaterialIcons
            name="add"
            size={20}
            color={colors.buttonPrimaryText}
          />
          <Text
            style={{
              color: colors.buttonPrimaryText,
              fontSize: 16,
              fontWeight: "600",
              marginLeft: 8,
            }}
          >
            {getTranslation(language as any, "addPlannedResult")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function PlanScreen() {
  const plans = useStore((s) => s.plans);
  const addPlannedResult = useStore((s) => s.addPlannedResult);
  const language = useSettingsStore((s) => s.language);

  const plan: Plan = plans[0];
  const allExercises = plan?.trainings.flatMap((t) => t.exercises) || [];
  const plannedResults = plan?.trainings.flatMap((t) => t.plannedResults) || [];

  const seasonsData = useMemo(
    () => getSeasonsData(plannedResults),
    [plannedResults]
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<
    keyof typeof SEASON_COLORS_LIGHT | null
  >(null);
  const [selectedYear, setSelectedYear] = useState<number>(0);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [plannedWeight, setPlannedWeight] = useState<string>("");
  const [plannedReps, setPlannedReps] = useState<string>("");
  const [plannedDate, setPlannedDate] = useState<string>("");

  const openModal = (
    season: keyof typeof SEASON_COLORS_LIGHT,
    year: number
  ) => {
    setSelectedSeason(season);
    setSelectedYear(year);
    setModalVisible(true);
    setSelectedExerciseId(allExercises[0]?.id || "");
    setPlannedWeight("");
    setPlannedReps("");

    const seasonMonths = getSeasonMonths(season, year);
    const firstMonth = seasonMonths[0];
    setPlannedDate(firstMonth.format("YYYY-MM-DD"));
  };

  const closeModal = () => setModalVisible(false);

  const handleSubmit = () => {
    if (
      !selectedSeason ||
      !selectedExerciseId ||
      !plannedWeight ||
      !plannedReps ||
      !plannedDate
    )
      return;

    const training = plan.trainings.find((t) =>
      t.exercises.some((e) => e.id === selectedExerciseId)
    );
    if (!training) return;

    addPlannedResult(plan.planName, training.id, {
      exerciseId: selectedExerciseId,
      plannedWeight: Number(plannedWeight),
      plannedReps: Number(plannedReps),
      plannedDate,
      amplitude: "full",
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
        : "light"
      : theme;
  const colors = Colors[colorScheme];
  const isDark = colorScheme === "dark";

  if (!plan) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16 }}>
          {getTranslation(language, "selectPlanToStart")}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 24,
            color: colors.text,
          }}
        >
          {getTranslation(language, "resultsPlanning")}
        </Text>

        {seasonsData.map((seasonData) => (
          <SeasonZone
            key={seasonData.id}
            season={seasonData.season}
            year={seasonData.year}
            results={seasonData.results}
            allExercises={allExercises}
            colors={colors}
            language={language}
            isDark={isDark}
            onAddResult={openModal}
          />
        ))}
      </ScrollView>

      {/* Модальное окно для добавления результата */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.modalOverlay,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              padding: 24,
              borderRadius: 16,
              width: "90%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 16,
                color: colors.text,
                textAlign: "center",
              }}
            >
              {getTranslation(language, "addPlannedResult")}
            </Text>

            {selectedSeason && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <MaterialIcons
                  name={SEASON_ICONS[selectedSeason]}
                  size={24}
                  color={colors.textSecondary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: 16,
                  }}
                >
                  {
                    SEASON_NAMES[selectedSeason][
                      language as "english" | "russian"
                    ]
                  }{" "}
                  {selectedYear}
                </Text>
              </View>
            )}

            <Text style={{ color: colors.text, marginBottom: 8 }}>
              {getTranslation(language, "exercise")}:
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                marginBottom: 16,
                backgroundColor: colors.inputBackground,
              }}
            >
              <Picker
                selectedValue={selectedExerciseId}
                onValueChange={setSelectedExerciseId}
                style={{ color: colors.text }}
              >
                {allExercises.map((ex) => (
                  <Picker.Item key={ex.id} label={ex.name} value={ex.id} />
                ))}
              </Picker>
            </View>

            <Text style={{ color: colors.text, marginBottom: 8 }}>
              {getTranslation(language, "weightKg")}:
            </Text>
            <TextInput
              value={plannedWeight}
              onChangeText={setPlannedWeight}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 16,
                borderRadius: 8,
                padding: 12,
                color: colors.text,
                backgroundColor: colors.inputBackground,
              }}
              placeholderTextColor={colors.placeholderText}
            />

            <Text style={{ color: colors.text, marginBottom: 8 }}>
              {getTranslation(language, "repetitions")}:
            </Text>
            <TextInput
              value={plannedReps}
              onChangeText={setPlannedReps}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 16,
                borderRadius: 8,
                padding: 12,
                color: colors.text,
                backgroundColor: colors.inputBackground,
              }}
              placeholderTextColor={colors.placeholderText}
            />

            <Text style={{ color: colors.text, marginBottom: 8 }}>
              {getTranslation(language, "dateWithinMonth")}:
            </Text>
            <TextInput
              value={plannedDate}
              onChangeText={setPlannedDate}
              placeholder="YYYY-MM-DD"
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: 24,
                borderRadius: 8,
                padding: 12,
                color: colors.text,
                backgroundColor: colors.inputBackground,
              }}
              placeholderTextColor={colors.placeholderText}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  marginRight: 8,
                  backgroundColor: colors.buttonSecondary,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
                onPress={closeModal}
              >
                <MaterialIcons
                  name="close"
                  size={18}
                  color={colors.buttonSecondaryText}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    color: colors.buttonSecondaryText,
                    fontWeight: "600",
                  }}
                >
                  {getTranslation(language, "cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  marginLeft: 8,
                  backgroundColor: colors.buttonSuccess,
                  padding: 12,
                  borderRadius: 8,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
                onPress={handleSubmit}
              >
                <MaterialIcons
                  name="check"
                  size={18}
                  color={colors.buttonSuccessText}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{ color: colors.buttonSuccessText, fontWeight: "600" }}
                >
                  {getTranslation(language, "saveResult")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
