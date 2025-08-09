/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#00bcd4";

const chartColorsLight = [
  "#0a7ea4", // основной акцент
  "#ff6b6b", // красный
  "#6bcf63", // зелёный
  "#f7b731", // жёлтый
  "#a259f7", // фиолетовый
  "#34ace0", // голубой
  "#ffb8b8", // розовый
  "#ffa502", // оранжевый
  "#2ed573", // мятный
  "#1e90ff", // синий
];

const chartColorsDark = [
  "#00bcd4", // основной акцент
  "#ff5252", // красный
  "#4cd137", // зелёный
  "#ffe156", // жёлтый
  "#a55eea", // фиолетовый
  "#00a8ff", // голубой
  "#ffb8b8", // розовый
  "#ff793f", // оранжевый
  "#05c46b", // мятный
  "#1e90ff", // синий
];

export const Colors = {
  light: {
    text: "#11181C",
    textSecondary: "#687076",
    background: "#f8f9fa",
    card: "#fff",
    cardSecondary: "#f8f9fa",
    border: "#e0e0e0",
    borderLight: "#f0f0f0",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#b0b8c1",
    tabIconSelected: tintColorLight,
    error: "#ff6b6b",
    success: "#6bcf63",
    warning: "#f7b731",
    info: "#17a2b8",
    primary: tintColorLight,
    secondary: "#6c757d",
    chartLine: chartColorsLight,
    chartGrid: "#e0e0e0",
    chartBackground: "#fff",
    modalOverlay: "rgba(0, 0, 0, 0.5)",
    // Цвета для кнопок
    buttonPrimary: tintColorLight,
    buttonPrimaryText: "#fff",
    buttonSecondary: "#6c757d",
    buttonSecondaryText: "#fff",
    buttonDanger: "#dc3545",
    buttonDangerText: "#fff",
    buttonSuccess: "#28a745",
    buttonSuccessText: "#fff",
    buttonText: "#fff",
    buttonTextSecondary: "#fff",
    // Цвета для селекторов тем/языков
    selectorOption: "#f8f9fa",
    selectorOptionSelected: tintColorLight,
    selectorOptionText: "#11181C",
    selectorOptionTextSelected: "#fff",
    // Цвета для форм
    inputBackground: "#fff",
    inputBorder: "#ced4da",
    placeholderText: "#6c757d",
  },
  dark: {
    text: "#ECEDEE",
    textSecondary: "#9BA1A6",
    background: "#151718",
    card: "#23272a",
    cardSecondary: "#1a1d20",
    border: "#3a3f45",
    borderLight: "#2d3238",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#4b535a",
    tabIconSelected: tintColorDark,
    error: "#ff5252",
    success: "#4cd137",
    warning: "#ffe156",
    info: "#17a2b8",
    primary: tintColorDark,
    secondary: "#6c757d",
    chartLine: chartColorsDark,
    chartGrid: "#3a3f45",
    chartBackground: "#181a1b",
    modalOverlay: "rgba(0, 0, 0, 0.7)",
    // Цвета для кнопок
    buttonPrimary: tintColorDark,
    buttonPrimaryText: "#151718",
    buttonSecondary: "#495057",
    buttonSecondaryText: "#ECEDEE",
    buttonDanger: "#dc3545",
    buttonDangerText: "#fff",
    buttonSuccess: "#28a745",
    buttonSuccessText: "#fff",
    buttonText: "#151718",
    buttonTextSecondary: "#ECEDEE",
    // Цвета для селекторов тем/языков
    selectorOption: "#23272a",
    selectorOptionSelected: tintColorDark,
    selectorOptionText: "#ECEDEE",
    selectorOptionTextSelected: "#151718",
    // Цвета для форм
    inputBackground: "#23272a",
    inputBorder: "#3a3f45",
    placeholderText: "#6c757d",
  },
};
