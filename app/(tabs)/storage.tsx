import { View, Text, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function StorageScreen() {
  const [storageData, setStorageData] = useState<[string, string | null][]>([]);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  useEffect(() => {
    const loadStorage = async () => {
      const keys = await AsyncStorage.getAllKeys();
      const result = await AsyncStorage.multiGet(keys);
      setStorageData(result);
    };
    loadStorage();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        AsyncStorage Dump
      </Text>
      <ScrollView>
        {storageData.map(([key, value]) => (
          <View key={key} style={styles.item}>
            <Text style={[styles.key, { color: colors.tint }]}>{key}:</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {value ? JSON.stringify(JSON.parse(value), null, 2) : "null"}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  item: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  key: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  value: {
    fontFamily: "SpaceMono",
  },
});
