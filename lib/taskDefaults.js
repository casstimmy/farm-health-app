/**
 * Task Defaults and Templates
 * All predefined task templates for the farm system
 * Used for dropdown population and task creation automation
 */

export const TASK_TEMPLATES = [
  // Group A - Daily Operations
  { title: "Carefully Observe Animals & report any issue", taskGroup: "Group A", isRoutine: true, frequency: "Daily", reminderDaysBefore: null, category: "Operations", assignedRole: "Farm Attendant", priority: "High" },
  { title: "Clean the Pen", taskGroup: "Group A", isRoutine: true, frequency: "Daily", reminderDaysBefore: null, category: "Operations", assignedRole: "Farm Attendant", priority: "High" },
  { title: "Feed Animals", taskGroup: "Group A", isRoutine: true, frequency: "Daily", reminderDaysBefore: null, category: "Operations", assignedRole: "Farm Attendant", priority: "High" },
  { title: "Change Drinking Water", taskGroup: "Group A", isRoutine: true, frequency: "Daily", reminderDaysBefore: null, category: "Operations", assignedRole: "Farm Attendant", priority: "High" },
  
  // General & Others
  { title: "Exercise Animals", taskGroup: null, isRoutine: true, frequency: "2 days", reminderDaysBefore: null, category: "Operations", assignedRole: "Farm Attendant", priority: "Medium" },
  { title: "General Task", taskGroup: null, isRoutine: false, frequency: null, reminderDaysBefore: null, category: "Operations", assignedRole: "Farm Attendant", priority: "Low" },
  
  // Sanitation
  { title: "Remove Animal Waste", taskGroup: null, isRoutine: false, frequency: "Monthly", reminderDaysBefore: 7, category: "Sanitation", assignedRole: "Labour", priority: "High" },
  { title: "General Cleaning", taskGroup: null, isRoutine: false, frequency: "Monthly", reminderDaysBefore: null, category: "Sanitation", assignedRole: "Labour", priority: "Medium" },
  { title: "Cleaning & Rearrangement Warehouse", taskGroup: null, isRoutine: false, frequency: null, reminderDaysBefore: null, category: "Sanitation", assignedRole: "Labour", priority: "Medium" },
  { title: "Clear bush on Farm", taskGroup: null, isRoutine: false, frequency: "Every 2 Weeks", reminderDaysBefore: null, category: "Sanitation", assignedRole: "Security", priority: "Medium" },
  
  // Group B - Healthcare & Vaccinations
  { title: "Vaccination (PPR)", taskGroup: null, isRoutine: true, frequency: "Annually", reminderDaysBefore: 30, category: "Healthcare", assignedRole: "Farm Manager", priority: "High" },
  { title: "Vaccination (CD&T)", taskGroup: null, isRoutine: true, frequency: "Annually", reminderDaysBefore: 30, category: "Healthcare", assignedRole: "Farm Manager", priority: "High" },
  { title: "Vaccination (CCBP)", taskGroup: null, isRoutine: true, frequency: "Annually", reminderDaysBefore: null, category: "Healthcare", assignedRole: "Farm Manager", priority: "High" },
  { title: "Vaccination (HSV)", taskGroup: null, isRoutine: true, frequency: "Annually", reminderDaysBefore: null, category: "Healthcare", assignedRole: "Farm Manager", priority: "High" },
  { title: "Vaccination (Black Quarter)", taskGroup: null, isRoutine: true, frequency: "8 Months", reminderDaysBefore: 30, category: "Healthcare", assignedRole: "Farm Manager", priority: "High" },
  { title: "Vaccination (Goat POX)", taskGroup: null, isRoutine: true, frequency: "Annually", reminderDaysBefore: null, category: "Healthcare", assignedRole: "Farm Manager", priority: "High" },
  { title: "Vaccination (FMD)", taskGroup: null, isRoutine: true, frequency: "Annually", reminderDaysBefore: null, category: "Healthcare", assignedRole: "Farm Manager", priority: "High" },
  { title: "Vaccination (Anthrax)", taskGroup: null, isRoutine: true, frequency: "Annually", reminderDaysBefore: null, category: "Healthcare", assignedRole: "Farm Manager", priority: "High" },
  
  // Parasite Treatment (Group B)
  { title: "Deworming (Internal Parasite)", taskGroup: "Group B", isRoutine: true, frequency: "Every 8 Weeks", reminderDaysBefore: 7, category: "Parasite Treatment", assignedRole: "Farm Manager & Farm Attendant", priority: "Medium" },
  { title: "Spraying Goat (External Parasite)", taskGroup: "Group B", isRoutine: true, frequency: "Monthly", reminderDaysBefore: null, category: "Parasite Treatment", assignedRole: "Farm Manager & Farm Attendant", priority: "High" },
  { title: "Famacha scoring", taskGroup: null, isRoutine: true, frequency: "Every 8 Weeks", reminderDaysBefore: null, category: "Healthcare", assignedRole: "Farm Manager", priority: "Medium" },
  
  // Operations & Management
  { title: "Trim Hoof", taskGroup: null, isRoutine: false, frequency: "Every 6 Months", reminderDaysBefore: null, category: "Operations", assignedRole: "Farm Manager & Farm Attendant", priority: "Medium" },
  { title: "Record Animal Weight", taskGroup: null, isRoutine: true, frequency: "Every 2 Months", reminderDaysBefore: null, category: "Operations", assignedRole: "Farm Manager & Farm Attendant", priority: "Medium" },
  
  // Pasture Management
  { title: "Water Plants on the Farm", taskGroup: null, isRoutine: false, frequency: "Daily", reminderDaysBefore: null, category: "Pasture Mgt", assignedRole: "Security", priority: "Low" },
  
  // Bookkeeping
  { title: "Reconcile Inventory", taskGroup: null, isRoutine: true, frequency: "Annually", reminderDaysBefore: null, category: "Bookkeeping", assignedRole: "Farm Manager", priority: "High" },
  { title: "Financial Audit", taskGroup: null, isRoutine: true, frequency: "Every 3 Months", reminderDaysBefore: null, category: "Bookkeeping", assignedRole: "Farm Manager", priority: "High" },
  
  // General/Blank
  { title: "Blank (Enter Description)", taskGroup: null, isRoutine: false, frequency: "Monthly", reminderDaysBefore: null, category: "General", assignedRole: "Farm Attendant", priority: "Low" },
];

// Extracted unique values for dropdowns
export const TASK_GROUPS = [
  null,
  "Group A",
  "Group B",
];

export const FREQUENCIES = [
  null,
  "Daily",
  "2 days",
  "Every 2 Weeks",
  "Weekly",
  "Biweekly",
  "Every 6 Months",
  "Every 8 Weeks",
  "Every 3 Months",
  "8 Months",
  "Quarterly",
  "Bi-Monthly",
  "Monthly",
  "Annually",
  "Yearly",
];

export const CATEGORIES_DROPDOWN = [
  "Operations",
  "Sanitation",
  "Healthcare",
  "Parasite Treatment",
  "Bookkeeping",
  "Pasture Mgt",
  "General",
];

export const PRIORITIES_DROPDOWN = [
  "Low",
  "Medium",
  "High",
];

export const REMINDERS_OPTIONS = [
  null,
  "1 week",
  "14 days",
  "1 month",
  "30 days",
];

export const ASSIGNED_ROLES = [
  "Farm Attendant",
  "Labour",
  "Security",
  "Farm Manager",
  "Farm Manager & Farm Attendant",
];

export const ROUTINE_OPTIONS = [
  true,
  false,
];

// Helper function to get task template by title
export const getTaskTemplate = (taskTitle) => {
  return TASK_TEMPLATES.find(t => t.title === taskTitle);
};

// Helper function to get all unique task titles
export const getTaskTitles = () => {
  return TASK_TEMPLATES.map(t => t.title);
};

// Helper function to convert frequency string to days for reminders
export const frequencyToDays = (frequency) => {
  if (!frequency) return null;
  const freq = frequency.toLowerCase();
  
  if (freq === "daily") return 1;
  if (freq.includes("2 days")) return 2;
  if (freq.includes("2 weeks") || freq === "biweekly") return 14;
  if (freq === "weekly") return 7;
  if (freq === "every 6 months") return 180;
  if (freq === "every 8 weeks") return 56;
  if (freq === "every 3 months" || freq === "quarterly") return 90;
  if (freq === "8 months") return 240;
  if (freq === "monthly") return 30;
  if (freq === "bi-monthly") return 60;
  if (freq === "annually" || freq === "yearly") return 365;
  
  return null;
};

// Helper function to parse reminder string to days
export const reminderToDays = (reminder) => {
  if (!reminder) return 0;
  
  const reminderLower = String(reminder).toLowerCase();
  
  if (reminderLower === "1 week" || reminderLower === "7 days") return 7;
  if (reminderLower === "14 days") return 14;
  if (reminderLower === "1 month" || reminderLower === "30 days") return 30;
  
  const num = parseInt(reminderLower);
  if (!isNaN(num)) return num;
  
  return 0;
};
