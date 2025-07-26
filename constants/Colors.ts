/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

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
    background: "#f8f9fa",
    card: "#fff",
    border: "#e0e0e0",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#b0b8c1",
    tabIconSelected: tintColorLight,
    error: "#ff6b6b",
    success: "#6bcf63",
    warning: "#f7b731",
    chartLine: chartColorsLight,
    chartGrid: "#e0e0e0",
    chartBackground: "#fff",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    card: "#23272a",
    border: "#23272a",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#4b535a",
    tabIconSelected: tintColorDark,
    error: "#ff5252",
    success: "#4cd137",
    warning: "#ffe156",
    chartLine: chartColorsDark,
    chartGrid: "#23272a",
    chartBackground: "#181a1b",
  },
};
