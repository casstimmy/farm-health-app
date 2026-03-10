/**
 * Dropdown Options Manager
 * Manages persistent storage of dropdown options in browser localStorage
 * Allows users to add new options to dropdowns while maintaining defaults
 */

import {
  TASK_GROUPS,
  FREQUENCIES,
  CATEGORIES_DROPDOWN,
  PRIORITIES_DROPDOWN,
  REMINDERS_OPTIONS,
  ASSIGNED_ROLES,
  ROUTINE_OPTIONS,
} from "@/lib/taskDefaults";

const STORAGE_KEY_PREFIX = "farm_dropdown_options_";

// Define which dropdowns allow custom entries
const CUSTOM_ALLOWED = {
  taskTitles: true,
  taskGroups: true,
  frequencies: true,
  categories: true,
  reminders: true,
  priorities: true,
  assignedRoles: false, // Don't allow custom roles
  routine: false,
};

// Get stored custom options from localStorage
const getStoredOptions = (fieldType) => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${fieldType}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error(`Error reading dropdown options for ${fieldType}:`, error);
    return [];
  }
};

// Save custom options to localStorage
const saveStoredOptions = (fieldType, options) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${fieldType}`,
      JSON.stringify(Array.from(new Set(options.filter((o) => o && o.trim()))))
    );
  } catch (error) {
    console.error(`Error saving dropdown options for ${fieldType}:`, error);
  }
};

// Add new option to dropdown
export const addDropdownOption = (fieldType, newOption) => {
  if (!newOption || !newOption.trim()) return false;
  if (!CUSTOM_ALLOWED[fieldType]) return false;

  const existing = getStoredOptions(fieldType);
  if (existing.includes(newOption.trim())) return false; // Already exists

  const updated = [...existing, newOption.trim()];
  saveStoredOptions(fieldType, updated);
  return true;
};

// Remove option from custom list
export const removeDropdownOption = (fieldType, option) => {
  if (!CUSTOM_ALLOWED[fieldType]) return false;

  const existing = getStoredOptions(fieldType);
  const updated = existing.filter((o) => o !== option);
  saveStoredOptions(fieldType, updated);
  return true;
};

// Get all options for a dropdown (defaults + custom)
export const getDropdownOptions = (fieldType) => {
  const customOptions = getStoredOptions(fieldType);

  switch (fieldType) {
    case "taskTitles":
      return customOptions;
    case "taskGroups":
      return [...new Set([...TASK_GROUPS.filter((g) => g !== null), ...customOptions])];
    case "frequencies":
      return [...new Set([...FREQUENCIES.filter((f) => f !== null), ...customOptions])];
    case "categories":
      return [...new Set([...CATEGORIES_DROPDOWN, ...customOptions])];
    case "reminders":
      return [...new Set([...REMINDERS_OPTIONS.filter((r) => r !== null), ...customOptions])];
    case "priorities":
      return [...new Set([...PRIORITIES_DROPDOWN, ...customOptions])];
    case "assignedRoles":
      return ASSIGNED_ROLES;
    case "routine":
      return ROUTINE_OPTIONS;
    default:
      return [];
  }
};

// Get all custom options that were added by user
export const getCustomOptions = (fieldType) => {
  return getStoredOptions(fieldType);
};

// Clear all custom options
export const clearAllCustomOptions = () => {
  if (typeof window === "undefined") return;

  Object.keys(CUSTOM_ALLOWED).forEach((fieldType) => {
    if (CUSTOM_ALLOWED[fieldType]) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${fieldType}`);
    }
  });
};

// Export CUSTOM_ALLOWED for use in components
export { CUSTOM_ALLOWED };
