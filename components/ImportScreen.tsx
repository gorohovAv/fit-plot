import useSettingsStore from "@/store/settingsStore";
import { importData, validateImport } from "@/utils/importUtils";
import { getTranslation } from "@/utils/localization";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";
import { ImportValidator, ValidationStatus } from "./ImportValidator";

interface ImportScreenProps {
  onBack: () => void;
}

export function ImportScreen({ onBack }: ImportScreenProps) {
  const [importText, setImportText] = useState("");
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>("empty");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [warningMessage, setWarningMessage] = useState<string>("");

  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const colorScheme =
    theme === "dark"
      ? Colors.dark
      : theme === "light"
        ? Colors.light
        : Colors.light;

  const handleTextChange = useCallback((text: string) => {
    setImportText(text);

    if (!text.trim()) {
      setValidationStatus("empty");
      setErrorMessage("");
      setWarningMessage("");
      return;
    }

    const validation = validateImport(text);
    setValidationStatus(validation.status);
    setErrorMessage(validation.errorMessage || "");
    setWarningMessage(validation.warningMessage || "");
  }, []);

  const handleFilePicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();

      setImportText(text);
      handleTextChange(text);
    } catch (error) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "fileOpenError")
      );
    }
  };

  const handleImport = async () => {
    if (validationStatus !== "valid") {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "validationError")
      );
      return;
    }

    try {
      await importData(importText);
      Alert.alert(
        getTranslation(language, "success"),
        getTranslation(language, "dataImportSuccess"),
        [{ text: "OK", onPress: onBack }]
      );
    } catch (error) {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "dataImportError")
      );
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colorScheme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colorScheme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colorScheme.text }]}>
          {getTranslation(language, "importData")}
        </Text>
      </View>

      <View style={styles.validatorContainer}>
        <ImportValidator
          status={validationStatus}
          errorMessage={errorMessage}
          warningMessage={warningMessage}
        />
      </View>

      <Text style={[styles.label, { color: colorScheme.text }]}>
        {getTranslation(language, "pasteTextForImport")}
      </Text>

      <TextInput
        style={[
          styles.textInput,
          {
            borderColor: colorScheme.border,
            color: colorScheme.text,
            backgroundColor: colorScheme.card,
          },
        ]}
        multiline
        numberOfLines={10}
        value={importText}
        onChangeText={handleTextChange}
        placeholder={getTranslation(language, "importFormatExample")}
        placeholderTextColor={colorScheme.placeholderText}
      />

      <TouchableOpacity
        style={[styles.fileButton, { borderColor: colorScheme.border, backgroundColor: colorScheme.card }]}
        onPress={handleFilePicker}
      >
        <Ionicons name="document-outline" size={20} color={colorScheme.text} />
        <Text style={[styles.fileButtonText, { color: colorScheme.text }]}>
          {getTranslation(language, "selectFile")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.importButton,
          {
            backgroundColor:
              validationStatus === "valid" ? colorScheme.buttonPrimary : colorScheme.buttonSecondary,
          },
        ]}
        onPress={handleImport}
        disabled={validationStatus !== "valid"}
      >
        <Text
          style={[
            styles.importButtonText,
            {
              color:
                validationStatus === "valid"
                  ? colorScheme.buttonPrimaryText
                  : colorScheme.buttonPrimaryText,
            },
          ]}
        >
          {getTranslation(language, "import")}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  validatorContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 120,
    textAlignVertical: "top",
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  fileButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  importButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
