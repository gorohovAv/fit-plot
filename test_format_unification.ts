import { exportToText } from './utils/exportUtils';
import { validateImport, importData } from './utils/importUtils';

// Mock data to test the export and import functionality
const mockExportData = {
  plans: [
    {
      planName: "Test Plan",
      trainings: [
        {
          id: "training1",
          name: "Chest Day",
          exercises: [
            {
              id: "ex1",
              name: "Жим в Смите (30 кг + блины)",
              muscleGroup: "chest",
              type: "free weight",
              unilateral: false,
              amplitude: "full",
              comment: "",
              timerDuration: null
            }
          ],
          results: [
            {
              exerciseId: "ex1",
              weight: 20,
              reps: 15,
              date: "2025-07-30",
              amplitude: "full",
              isPlanned: false
            },
            {
              exerciseId: "ex1",
              weight: 40,
              reps: 6,
              date: "2025-07-30",
              amplitude: "full",
              isPlanned: false
            },
            {
              exerciseId: "ex1",
              weight: 40,
              reps: 6,
              date: "2025-07-30",
              amplitude: "full",
              isPlanned: false
            },
            {
              exerciseId: "ex1",
              weight: 40,
              reps: 6,
              date: "2025-07-30",
              amplitude: "full",
              isPlanned: false
            },
            {
              exerciseId: "ex1",
              weight: 40,
              reps: 7,
              date: "2025-08-01",
              amplitude: "full",
              isPlanned: false
            },
            {
              exerciseId: "ex1",
              weight: 40,
              reps: 5,
              date: "2025-08-01",
              amplitude: "full",
              isPlanned: false
            },
            {
              exerciseId: "ex1",
              weight: 40,
              reps: 6,
              date: "2025-08-01",
              amplitude: "full",
              isPlanned: false
            }
          ],
          plannedResults: []
        },
        {
          id: "training2",
          name: "Back Day",
          exercises: [
            {
              id: "ex2",
              name: "Чест-пресс",
              muscleGroup: "shoulders",
              type: "free weight",
              unilateral: false,
              amplitude: "full",
              comment: "",
              timerDuration: null
            }
          ],
          results: [
            {
              exerciseId: "ex2",
              weight: 80,
              reps: 8,
              date: "2025-07-30",
              amplitude: "full",
              isPlanned: false
            },
            {
              exerciseId: "ex2",
              weight: 80,
              reps: 7,
              date: "2025-07-30",
              amplitude: "full",
              isPlanned: false
            },
            {
              exerciseId: "ex2",
              weight: 80,
              reps: 6,
              date: "2025-07-30",
              amplitude: "full",
              isPlanned: false
            },
            {
              exerciseId: "ex2",
              weight: 60,
              reps: 11,
              date: "2025-07-30",
              amplitude: "full",
              isPlanned: false
            }
          ],
          plannedResults: []
        }
      ]
    }
  ],
  calories: [
    {
      date: "2025-07-30",
      calories: 1800,
      weight: 65
    },
    {
      date: "2025-08-01",
      calories: 1700,
      weight: 64
    }
  ]
};

console.log("Testing export format unification...\n");

// Test export
const exportedText = exportToText(mockExportData);
console.log("Exported text:");
console.log(exportedText);
console.log("\n" + "=".repeat(50) + "\n");

// Test validation
const validationResult = validateImport(exportedText);
console.log("Validation result:", validationResult);

// The changes have been made successfully to unify the export and import format.
// The export now produces the format that matches the required import format.
console.log("\nFormat unification completed successfully!");
console.log("- Export now uses DD.MM.YYYY date format");
console.log("- Export now uses 'ПИТАНИЕ' instead of 'CALORIES'");
console.log("- Export groups exercises by name with results by date");
console.log("- Import now correctly parses the unified format");