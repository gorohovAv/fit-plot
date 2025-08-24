import { MMKV } from "react-native-mmkv";

export const mmkvStore = new MMKV({ id: "main" });
export const mmkvSettings = new MMKV({ id: "settings" });
export const mmkvCalories = new MMKV({ id: "calories" });
