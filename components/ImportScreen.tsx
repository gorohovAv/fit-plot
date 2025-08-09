import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ImportValidator, ValidationStatus } from "./ImportValidator";
import { validateImport, importData } from "@/utils/importUtils";
import useSettingsStore from "@/store/settingsStore";
import { getTranslation } from "@/utils/localization";

interface ImportScreenProps {
  onBack: () => void;
}

export function ImportScreen({ onBack }: ImportScreenProps) {
  const [importText, setImportText] = useState("");
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>("empty");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [warningMessage, setWarningMessage] = useState<string>("");

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const borderColor = useThemeColor({}, "border");
  const cardColor = useThemeColor({}, "card");
  const buttonPrimary = useThemeColor({}, "buttonPrimary");
  const buttonPrimaryText = useThemeColor({}, "buttonPrimaryText");
  const buttonSecondary = useThemeColor({}, "buttonSecondary");
  const placeholderColor = useThemeColor({}, "placeholderText");

  const language = useSettingsStore((state) => state.language);

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

  const handleImport = () => {
    if (validationStatus !== "valid") {
      Alert.alert(
        getTranslation(language, "error"),
        getTranslation(language, "validationError")
      );
      return;
    }

    try {
      importData(importText);
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
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: textColor }]}>
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

      <Text style={[styles.label, { color: textColor }]}>
        {getTranslation(language, "pasteTextForImport")}
      </Text>

      <TextInput
        style={[
          styles.textInput,
          {
            borderColor,
            color: textColor,
            backgroundColor: cardColor,
          },
        ]}
        multiline
        numberOfLines={10}
        value={importText}
        onChangeText={handleTextChange}
        placeholder={getTranslation(language, "importFormatExample")}
        placeholderTextColor={placeholderColor}
      />

      <TouchableOpacity
        style={[styles.fileButton, { borderColor, backgroundColor: cardColor }]}
        onPress={handleFilePicker}
      >
        <Ionicons name="document-outline" size={20} color={textColor} />
        <Text style={[styles.fileButtonText, { color: textColor }]}>
          {getTranslation(language, "selectFile")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.importButton,
          {
            backgroundColor:
              validationStatus === "valid" ? buttonPrimary : buttonSecondary,
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
                  ? buttonPrimaryText
                  : buttonPrimaryText,
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
