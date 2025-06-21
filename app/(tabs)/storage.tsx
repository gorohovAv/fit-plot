import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import useStore from "@/store/store";
import * as Clipboard from "expo-clipboard";

export default function StorageScreen() {
  const [storageContent, setStorageContent] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const store = useStore();

  useEffect(() => {
    updateStorageContent();
  }, [store]);

  const updateStorageContent = () => {
    setStorageContent(JSON.stringify(store, null, 2));
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(storageContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearStorage = () => {
    Alert.alert(
      "Очистить хранилище",
      "Вы уверены, что хотите полностью очистить хранилище?",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Очистить",
          style: "destructive",
          onPress: () => {
            useStore.persist.clearStorage();
            updateStorageContent();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Zustand Store Debug
      </Text>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={copyToClipboard}
          style={[styles.button, { backgroundColor: colors.tint }]}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {copied ? "Скопировано!" : "Копировать JSON"}
          </Text>
        </Pressable>

        <Pressable
          onPress={clearStorage}
          style={[styles.button, { backgroundColor: colors.tabIconSelected }]}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Очистить хранилище
          </Text>
        </Pressable>
      </View>

      <ScrollView>
        <Text style={[styles.content, { color: colors.text }]}>
          {storageContent}
        </Text>
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
  content: {
    fontFamily: "SpaceMono",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "bold",
  },
});
