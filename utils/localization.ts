export const translations = {
  english: {
    // Settings
    theme: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
    weight: "Weight (kg)",
    enterWeight: "Enter weight",
    developerMode: "Developer mode",
    importData: "Import data",

    // Calories
    calories: "Calories",
    caloriesPerDay: "Calories per day",
    enterCalories: "Enter calories",
    yourWeight: "Your weight (kg)",
    enterYourWeight: "Enter your weight",
    save: "Save",
    today: "Today:",
    caloriesValue: "Calories: {value} kcal",
    weightValue: "Weight: {value} kg",
    caloriesAndWeightChart: "Calories and weight chart",
    error: "Error",
    fillAllFields: "Fill all fields",
    enterValidCalories: "Enter valid calories",
    enterValidWeight: "Enter valid weight",
    success: "Success",
    dataSaved: "Data saved",

    // Workout Plan
    selectPlan: "Select plan",
    noWorkoutsInPlan: "No workouts in plan",
    selectPlanToStart: "Select plan to start",
    addWorkout: "+ Add workout",
    workoutName: "Workout name",
    enterName: "Enter name",
    cancel: "Cancel",
    add: "Add",
    resultsPlanning: "Results planning",

    // Analytics
    selectExercises: "Select exercises",
    selected: "Selected: {count} exercises",
    generalTonnage: "General tonnage",
    maxWeight: "Max weight",
    maxReps: "Max reps",
    date: "Date",
    tonnage: "Tonnage",
    weight: "Weight",
    reps: "Reps",

    // Common
    loading: "Loading...",
    errorOccurred: "An error occurred",
    tryAgain: "Try again",
    confirm: "Confirm",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
  },
  russian: {
    // Settings
    theme: "Тема",
    system: "Системная",
    light: "Светлая",
    dark: "Тёмная",
    weight: "Собственный вес (кг)",
    enterWeight: "Введите вес",
    developerMode: "Режим разработчика",
    importData: "Импорт данных",

    // Calories
    calories: "Калории",
    caloriesPerDay: "Калории за день",
    enterCalories: "Введите количество калорий",
    yourWeight: "Ваш вес (кг)",
    enterYourWeight: "Введите ваш вес",
    save: "Сохранить",
    today: "Сегодня:",
    caloriesValue: "Калории: {value} ккал",
    weightValue: "Вес: {value} кг",
    caloriesAndWeightChart: "График калорий и веса",
    error: "Ошибка",
    fillAllFields: "Заполните все поля",
    enterValidCalories: "Введите корректное количество калорий",
    enterValidWeight: "Введите корректный вес",
    success: "Успех",
    dataSaved: "Данные сохранены",

    // Workout Plan
    selectPlan: "Выберите план",
    noWorkoutsInPlan: "Нет тренировок в плане",
    selectPlanToStart: "Выберите план для начала",
    addWorkout: "+ Добавить тренировку",
    workoutName: "Название тренировки",
    enterName: "Введите название",
    cancel: "Отмена",
    add: "Добавить",
    resultsPlanning: "Планирование результатов",

    // Analytics
    selectExercises: "Выберите упражнения",
    selected: "Выбрано: {count} упражн.",
    generalTonnage: "Общий тоннаж",
    maxWeight: "Максимальный вес",
    maxReps: "Максимальные повторения",
    date: "Дата",
    tonnage: "Тоннаж",
    weight: "Вес",
    reps: "Повторения",

    // Common
    loading: "Загрузка...",
    errorOccurred: "Произошла ошибка",
    tryAgain: "Попробуйте снова",
    confirm: "Подтвердить",
    delete: "Удалить",
    edit: "Редактировать",
    close: "Закрыть",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.english;

export const getTranslation = (
  language: Language,
  key: TranslationKey
): string => {
  return translations[language][key];
};

export const formatTranslation = (
  language: Language,
  key: TranslationKey,
  params: Record<string, string | number> = {}
): string => {
  let translation = getTranslation(language, key);

  Object.entries(params).forEach(([param, value]) => {
    translation = translation.replace(`{${param}}`, String(value));
  });

  return translation;
};
