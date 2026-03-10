"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus, FaTimes, FaCheck, FaSpinner, FaClock, FaExclamationTriangle, FaRedo,
  FaCheckCircle, FaChevronDown, FaChevronUp, FaTrash, FaEdit,
} from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import { formatDateForInput } from "@/utils/formatting";
import StatsSummary from "@/components/shared/StatsSummary";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";
import { getClientLocationIds } from "@/utils/locationAccess";
import AddOptionModal from "@/components/tasks/AddOptionModal";
import { TASK_TEMPLATES, CATEGORIES_DROPDOWN, PRIORITIES_DROPDOWN, getDropdownOptions, getTaskTitles, getTaskTemplate, reminderToDays } from "@/lib/taskDefaults";

const CATEGORIES = ["General", "Feeding", "Treatment", "Cleaning", "Breeding", "Vaccination", "Maintenance", "Inventory", "Other", ...CATEGORIES_DROPDOWN];
const PRIORITIES = ["Low", "Medium", "High", "Urgent", ...PRIORITIES_DROPDOWN];
const STATUSES = ["Pending", "In Progress", "Completed", "Overdue"];

const PRIORITY_BADGE = {
  Low: "bg-gray-100 text-gray-700 border-gray-300",
  Medium: "bg-blue-100 text-blue-700 border-blue-300",
  High: "bg-orange-100 text-orange-700 border-orange-300",
  Urgent: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_BADGE = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-300",
  Completed: "bg-green-100 text-green-800 border-green-300",
  Overdue: "bg-red-100 text-red-800 border-red-300",
};

const CATEGORY_ICON = {
  Feeding: "🍽️", Treatment: "💊", Cleaning: "🧹", Breeding: "💕",
  Vaccination: "💉", Maintenance: "🔧", Inventory: "📦", General: "📋", Other: "📝",
};

const initialForm = {
  title: "", description: "", taskGroup: "", isRoutine: false, frequency: "",
  category: "General", priority: "Medium", reminderFormat: "",
  assignedTo: "", location: "", paddock: "", animal: "", dueDate: "", notes: "",
  isRecurring: false, recurringInterval: "", reminderDaysBefore: "",
};

export default function TasksPage() {
  const router = useRouter();
  const { user, isLoading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedTask, setExpandedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingTask, setUpdatingTask] = useState(null);

  // Dropdown states
  const [dropdownOptions, setDropdownOptions] = useState({
    taskTitles: [],
    taskGroups: [],
    frequencies: [],
    categories: [],
    reminders: [],
  });
  const [addOptionModal, setAddOptionModal] = useState({ isOpen: false, fieldType: null, fieldLabel: null });
  
  // Hydrate dropdown options on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setDropdownOptions({
        taskTitles: getTaskTitles(),
        taskGroups: getDropdownOptions("taskGroups"),
        frequencies: getDropdownOptions("frequencies"),
        categories: getDropdownOptions("categories"),
        reminders: getDropdownOptions("reminders"),
      });
    }
  }, []);

  const isManager = user && ["SuperAdmin", "SubAdmin", "Manager"].includes(user.role);
  const actionBtnClass = "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors";

  // Filter locations by user's assigned locations
  const userLocations = useMemo(() => {
    if (!locations.length || !user) return locations;
    const allowedIds = getClientLocationIds(user);
    if (!allowedIds) return locations; // SuperAdmin sees all
    return locations.filter(loc => allowedIds.includes(loc._id));
  }, [locations, user]);

  // Filter animals based on selected location/paddock in the task form
  const filteredAnimals = useMemo(() => {
    if (!form.location) return animals;
    let result = animals.filter((a) => {
      const animalLocId = typeof a.location === "object" ? a.location?._id : a.location;
      return String(animalLocId) === String(form.location);
    });
    if (form.paddock) {
      result = result.filter((a) => a.paddock === form.paddock);
    }
    return result;
  }, [animals, form.location, form.paddock]);

  useEffect(() => {
    if (roleLoading) return;
    // Check localStorage token to prevent premature redirect during hydration
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (!user) return; // Wait for useRole to hydrate user from localStorage
    fetchData();
  }, [roleLoading, user]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [tasksRes, usersRes, locRes, animalsRes] = await Promise.all([
        fetch("/api/tasks", { headers }),
        fetch("/api/users", { headers }).catch(() => ({ ok: false })),
        fetch("/api/locations", { headers }).catch(() => ({ ok: false })),
        fetch("/api/animals?compact=true", { headers }).catch(() => ({ ok: false })),
      ]);
      setTasks(tasksRes.ok ? await tasksRes.json() : []);
      setUsers(usersRes.ok ? await usersRes.json() : []);
      setLocations(locRes.ok ? await locRes.json() : []);
      setAnimals(animalsRes.ok ? await animalsRes.json() : []);
    } catch (err) {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setForm(initialForm); setShowForm(false); setEditingId(null); };

  // Open Add Option Modal
  const openAddOptionModal = (fieldType, fieldLabel) => {
    setAddOptionModal({ isOpen: true, fieldType, fieldLabel });
  };

  // Handle option added - refresh dropdown
  const handleOptionAdded = (fieldType) => {
    setDropdownOptions(prev => ({
      ...prev,
      [fieldType]: getDropdownOptions(fieldType),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Task title is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const payload = { ...form };
      if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();
      if (!payload.assignedTo) delete payload.assignedTo;
      if (!payload.location) delete payload.location;
      if (!payload.paddock) delete payload.paddock;
      if (!payload.animal) delete payload.animal;
      if (!payload.taskGroup) delete payload.taskGroup;
      if (!payload.frequency) delete payload.frequency;
      if (!payload.reminderFormat) delete payload.reminderFormat;

      const url = editingId ? `/api/tasks/${editingId}` : "/api/tasks";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save task"); }
      resetForm();
      setSuccess(editingId ? "Task updated!" : "Task created!");
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (taskId, newStatus, task = null) => {
    // For Vaccination/Deworming recurring tasks marked Done, redirect to health records
    if (newStatus === "Completed" && task && task.isRecurring && ["Vaccination", "Treatment"].includes(task.category)) {
      // First update the task status
      setUpdatingTask(taskId);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error("Failed to update task");
        // Build query params for health record prefill
        const params = new URLSearchParams();
        params.set("fromTask", "true");
        params.set("taskTitle", task.title || "");
        if (task.location?._id) params.set("location", task.location._id);
        if (task.paddock) params.set("paddock", task.paddock);
        if (task.animal?._id) params.set("animal", task.animal._id);
        if (task.category === "Vaccination") params.set("treatmentType", "Vaccination");
        if (task.category === "Treatment") params.set("treatmentType", "Deworming");
        if (task.notes) params.set("notes", task.notes);
        if (task.assignedTo?.name) params.set("treatedBy", task.assignedTo.name);
        router.push(`/manage/health-records?${params.toString()}`);
        return;
      } catch (err) { setError(err.message); setUpdatingTask(null); return; }
    }
    setUpdatingTask(taskId);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update task");
      setSuccess(`Task marked as ${newStatus}!`);
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } catch (err) { setError(err.message); } finally { setUpdatingTask(null); }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete task");
      setSuccess("Task deleted!");
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } catch (err) { setError(err.message); }
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title || "",
      description: task.description || "",
      taskGroup: task.taskGroup || "",
      isRoutine: task.isRoutine || false,
      frequency: task.frequency || "",
      category: task.category || "General",
      priority: task.priority || "Medium",
      reminderFormat: task.reminderFormat || "",
      assignedTo: task.assignedTo?._id || "",
      location: task.location?._id || "",
      paddock: task.paddock || "",
      animal: task.animal?._id || "",
      dueDate: formatDateForInput(task.dueDate),
      notes: task.notes || "",
      isRecurring: task.isRecurring || false,
      recurringInterval: task.recurringInterval || "",
      reminderDaysBefore: task.reminderDaysBefore || "",
    });
    setEditingId(task._id);
    setShowForm(true);
  };

  // Handle task template selection - auto-fill fields
  const handleTaskSelection = (taskTitle) => {
    const template = getTaskTemplate(taskTitle);
    if (!template) {
      setForm(prev => ({ ...prev, title: taskTitle }));
      return;
    }

    // Auto-fill from template
    const reminderDays = reminderToDays(template.reminderDaysBefore);
    setForm(prev => ({
      ...prev,
      title: template.title,
      taskGroup: template.taskGroup || "",
      isRoutine: template.isRoutine || false,
      frequency: template.frequency || "",
      category: template.category || "General",
      priority: template.priority || "Medium",
      reminderFormat: template.reminderDaysBefore || "",
      reminderDaysBefore: reminderDays || "",
    }));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesStatus = filterStatus === "all" ? true : filterStatus === "active" ? !["Completed"].includes(task.status) : task.status === filterStatus;
      const matchesCategory = filterCategory === "all" || task.category === filterCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || (task.title || "").toLowerCase().includes(term) || (task.description || "").toLowerCase().includes(term) || (task.assignedTo?.name || "").toLowerCase().includes(term);
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [tasks, filterStatus, filterCategory, searchTerm]);

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "Pending").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
    overdue: tasks.filter((t) => t.status === "Overdue").length,
  }), [tasks]);

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Task Management"
        subtitle="Assign, track, and manage farm tasks"
        gradient="from-violet-600 to-purple-700"
        icon="✅"
      />

      {(loading || roleLoading) && (
        <div className="bg-white rounded-xl border border-gray-200 p-10">
          <Loader message="Loading tasks..." color="purple-600" />
        </div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700"><FaTimes size={14} /></button>
        </motion.div>
      )}

      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
          <FaCheckCircle /> {success}
        </motion.div>
      )}

      {!loading && !roleLoading && (
        <>
          <StatsSummary activeFilter={filterStatus} stats={[
            { label: "Total Tasks", value: stats.total, bgColor: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-900", icon: "📋", filterKey: "all", onClick: () => setFilterStatus(filterStatus === "all" ? "active" : "all") },
            { label: "Pending", value: stats.pending, bgColor: "bg-yellow-50", borderColor: "border-yellow-200", textColor: "text-yellow-700", icon: "⏳", filterKey: "Pending", onClick: () => setFilterStatus(filterStatus === "Pending" ? "active" : "Pending") },
            { label: "In Progress", value: stats.inProgress, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700", icon: "🔄", filterKey: "In Progress", onClick: () => setFilterStatus(filterStatus === "In Progress" ? "active" : "In Progress") },
            { label: "Overdue", value: stats.overdue, bgColor: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700", icon: "⚠️", filterKey: "Overdue", onClick: () => setFilterStatus(filterStatus === "Overdue" ? "active" : "Overdue") },
            { label: "Completed", value: stats.completed, bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700", icon: "✅", filterKey: "Completed", onClick: () => setFilterStatus(filterStatus === "Completed" ? "active" : "Completed") },
          ]} />

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400">
              <option value="active">Active Tasks</option>
              <option value="all">All Tasks</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400">
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {isManager && (
              <button onClick={() => { if (showForm && !editingId) { resetForm(); } else { setEditingId(null); setForm(initialForm); setShowForm(!showForm); } }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${showForm ? "bg-gray-200 text-gray-700" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
                {showForm ? <><FaTimes size={12} /> Cancel</> : <><FaPlus size={12} /> New Task</>}
              </button>
            )}
          </div>

          {/* Task Form */}
          <AnimatePresence>
            {showForm && isManager && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-3">
                    <h3 className="text-white font-bold flex items-center gap-2">{editingId ? <FaEdit size={14} /> : <FaPlus size={14} />} {editingId ? "Edit Task" : "Create New Task"}</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Task Title/Template Selection */}
                      <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-1">
                          <label className="block text-xs font-semibold text-gray-600  flex-1">Task Template</label>
                          <button
                            type="button"
                            onClick={() => openAddOptionModal("taskTitles", "Task")}
                            className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded border border-violet-300 hover:bg-violet-200 flex items-center gap-1"
                          >
                            <FaPlus size={10} /> Add
                          </button>
                        </div>
                        <select
                          className="input-field"
                          value={form.title}
                          onChange={(e) => handleTaskSelection(e.target.value)}
                        >
                          <option value="">Select from templates...</option>
                          {dropdownOptions.taskTitles.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Title (can override template) */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Task Title / Name * {form.title && <span className="text-violet-600">(from template)</span>}
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Or enter custom task title"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                        <textarea
                          className="input-field"
                          rows={2}
                          placeholder="Task description"
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                      </div>

                      {/* Task Group */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label className="block text-xs font-semibold text-gray-600 flex-1">Task Group</label>
                          <button
                            type="button"
                            onClick={() => openAddOptionModal("taskGroups", "Task Group")}
                            className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded border border-violet-300 hover:bg-violet-200"
                          >
                            +
                          </button>
                        </div>
                        <select
                          className="input-field"
                          value={form.taskGroup}
                          onChange={(e) => setForm({ ...form, taskGroup: e.target.value })}
                        >
                          <option value="">None</option>
                          {dropdownOptions.taskGroups.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Routine */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Routine (Yes/No)</label>
                        <select
                          className="input-field"
                          value={form.isRoutine}
                          onChange={(e) => setForm({ ...form, isRoutine: e.target.value === "true" })}
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>

                      {/* Frequency */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label className="block text-xs font-semibold text-gray-600 flex-1">Frequency</label>
                          <button
                            type="button"
                            onClick={() => openAddOptionModal("frequencies", "Frequency")}
                            className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded border border-violet-300 hover:bg-violet-200"
                          >
                            +
                          </button>
                        </div>
                        <select
                          className="input-field"
                          value={form.frequency}
                          onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                        >
                          <option value="">Select frequency</option>
                          {dropdownOptions.frequencies.map((f) => (
                            <option key={f} value={f}>
                              {f}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Category */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label className="block text-xs font-semibold text-gray-600 flex-1">Category</label>
                          <button
                            type="button"
                            onClick={() => openAddOptionModal("categories", "Category")}
                            className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded border border-violet-300 hover:bg-violet-200"
                          >
                            +
                          </button>
                        </div>
                        <select
                          className="input-field"
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Priority */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                        <select
                          className="input-field"
                          value={form.priority}
                          onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reminder Format */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label className="block text-xs font-semibold text-gray-600 flex-1">Reminder</label>
                          <button
                            type="button"
                            onClick={() => openAddOptionModal("reminders", "Reminder")}
                            className="text-xs px-1.5 py-0.5 bg-violet-100 text-violet-700 rounded border border-violet-300 hover:bg-violet-200"
                          >
                            +
                          </button>
                        </div>
                        <select
                          className="input-field"
                          value={form.reminderFormat}
                          onChange={(e) => setForm({ ...form, reminderFormat: e.target.value, reminderDaysBefore: reminderToDays(e.target.value) || "" })}
                        >
                          <option value="">None</option>
                          {dropdownOptions.reminders.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Assign To (user staff) */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Responsible Person *</label>
                        <select
                          className="input-field"
                          value={form.assignedTo}
                          onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                          required
                        >
                          <option value="">Unassigned</option>
                          {users.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name} ({u.role})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-gray-400 mt-0.5">✓ Select from your staff</p>
                      </div>

                      {/* Due Date */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                        <input
                          type="date"
                          className="input-field"
                          value={form.dueDate}
                          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                        />
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                        <select
                          className="input-field"
                          value={form.location}
                          onChange={(e) => setForm({ ...form, location: e.target.value, paddock: "" })}
                        >
                          <option value="">No location</option>
                          {userLocations.map((l) => (
                            <option key={l._id} value={l._id}>
                              {l.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {form.location &&
                        (() => {
                          const loc = userLocations.find((l) => l._id === form.location);
                          const paddocks = loc?.paddocks || [];
                          if (paddocks.length === 0) return null;
                          return (
                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Paddock / Shed</label>
                              <select
                                className="input-field"
                                value={form.paddock}
                                onChange={(e) => setForm({ ...form, paddock: e.target.value })}
                              >
                                <option value="">None</option>
                                {paddocks.map((p) => (
                                  <option key={p._id} value={p.name}>
                                    {p.name} ({p.type})
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })()}

                      {/* Related Animal */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Related Animal</label>
                        <select
                          className="input-field"
                          value={form.animal}
                          onChange={(e) => setForm({ ...form, animal: e.target.value })}
                        >
                          <option value="">
                            {form.location && form.paddock ? `All in paddock (${filteredAnimals.length} animals)` : "None"}
                          </option>
                          {filteredAnimals.map((a) => (
                            <option key={a._id} value={a._id}>
                              {a.tagId} - {a.name || a.breed || "Animal"}
                            </option>
                          ))}
                        </select>
                        {form.location && form.paddock && filteredAnimals.length > 0 && !form.animal && (
                          <p className="text-[10px] text-green-600 mt-0.5 font-medium">✓ Task applies to all {filteredAnimals.length} animals in {form.paddock}</p>
                        )}
                        {form.location && !form.paddock && <p className="text-[10px] text-gray-400 mt-0.5">Select a paddock to auto-target all animals in it</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked, recurringInterval: e.target.checked ? "Daily" : "" })} />
                        <span className="font-semibold text-gray-700">Recurring</span>
                      </label>
                      {form.isRecurring && (
                        <select className="input-field w-auto" value={form.recurringInterval} onChange={(e) => setForm({ ...form, recurringInterval: e.target.value })}>
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Biweekly">Biweekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Bi-Monthly">Bi-Monthly</option>
                          <option value="Quarterly">Quarterly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      )}
                    </div>
                    {/* Reminder Before Due Date */}
                    {form.dueDate && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">🔔 Reminder Before Due Date</label>
                        <select className="input-field w-auto" value={form.reminderDaysBefore} onChange={(e) => setForm({ ...form, reminderDaysBefore: e.target.value })}>
                          <option value="">No reminder</option>
                          <option value="1">1 day before</option>
                          <option value="2">2 days before</option>
                          <option value="3">3 days before</option>
                          <option value="5">5 days before</option>
                          <option value="7">1 week before</option>
                          <option value="14">2 weeks before</option>
                          <option value="30">1 month before</option>
                        </select>
                        <p className="text-[10px] text-gray-400 mt-0.5">Reminders will be sent daily from the selected date until due date</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                      <input className="input-field" placeholder="Additional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 text-sm">Cancel</button>
                      <button type="submit" disabled={submitting} className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2">
                        {submitting ? <><FaSpinner className="animate-spin" /> Saving...</> : editingId ? "Update Task" : "Create Task"}
                      </button>
                    </div>
                  </div>
                </form>

                {/* Add Option Modals */}
                <AddOptionModal
                  fieldType={addOptionModal.fieldType}
                  fieldLabel={addOptionModal.fieldLabel}
                  isOpen={addOptionModal.isOpen && addOptionModal.fieldType === "taskTitles"}
                  onClose={() => setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null })}
                  onOptionAdded={() => {
                    handleOptionAdded("taskTitles");
                    setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null });
                  }}
                />
                <AddOptionModal
                  fieldType={addOptionModal.fieldType}
                  fieldLabel={addOptionModal.fieldLabel}
                  isOpen={addOptionModal.isOpen && addOptionModal.fieldType === "taskGroups"}
                  onClose={() => setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null })}
                  onOptionAdded={() => {
                    handleOptionAdded("taskGroups");
                    setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null });
                  }}
                />
                <AddOptionModal
                  fieldType={addOptionModal.fieldType}
                  fieldLabel={addOptionModal.fieldLabel}
                  isOpen={addOptionModal.isOpen && addOptionModal.fieldType === "frequencies"}
                  onClose={() => setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null })}
                  onOptionAdded={() => {
                    handleOptionAdded("frequencies");
                    setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null });
                  }}
                />
                <AddOptionModal
                  fieldType={addOptionModal.fieldType}
                  fieldLabel={addOptionModal.fieldLabel}
                  isOpen={addOptionModal.isOpen && addOptionModal.fieldType === "categories"}
                  onClose={() => setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null })}
                  onOptionAdded={() => {
                    handleOptionAdded("categories");
                    setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null });
                  }}
                />
                <AddOptionModal
                  fieldType={addOptionModal.fieldType}
                  fieldLabel={addOptionModal.fieldLabel}
                  isOpen={addOptionModal.isOpen && addOptionModal.fieldType === "reminders"}
                  onClose={() => setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null })}
                  onOptionAdded={() => {
                    handleOptionAdded("reminders");
                    setAddOptionModal({ isOpen: false, fieldType: null, fieldLabel: null });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task Cards */}
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-medium text-gray-600">No tasks found</p>
              <p className="text-sm text-gray-400 mt-1">Create a new task to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task, idx) => {
                const isExpanded = expandedTask === task._id;
                const daysUntil = getDaysUntilDue(task.dueDate);
                const isOverdue = task.status === "Overdue" || (daysUntil !== null && daysUntil < 0 && task.status !== "Completed");

                return (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`bg-white rounded-xl border overflow-hidden transition-shadow hover:shadow-md ${
                      isOverdue ? "border-red-200" : task.status === "Completed" ? "border-green-200" : "border-gray-200"
                    }`}
                  >
                    {/* Task Row */}
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : task._id)}>
                      {/* Status indicator */}
                      <div className={`w-2 h-10 rounded-full flex-shrink-0 ${
                        task.status === "Completed" ? "bg-green-500" :
                        isOverdue ? "bg-red-500" :
                        task.status === "In Progress" ? "bg-blue-500" : "bg-yellow-400"
                      }`} />

                      {/* Category icon */}
                      <span className="text-xl flex-shrink-0">{CATEGORY_ICON[task.category] || "📋"}</span>

                      {/* Title & meta */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-sm truncate ${task.status === "Completed" ? "line-through text-gray-400" : "text-gray-900"}`}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {task.assignedTo?.name && (
                            <span className="text-xs text-gray-500">→ {task.assignedTo.name}</span>
                          )}
                          {task.dueDate && (
                            <span className={`text-xs ${isOverdue ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                              {isOverdue ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? "Due today" : daysUntil === 1 ? "Due tomorrow" : `${daysUntil}d left`}
                            </span>
                          )}
                          {task.isRecurring && <span className="text-xs text-violet-600 flex items-center gap-0.5"><FaRedo size={8} /> {task.recurringInterval}</span>}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${PRIORITY_BADGE[task.priority] || ""}`}>{task.priority}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_BADGE[task.status] || ""}`}>{task.status}</span>
                      </div>

                      {/* Quick actions */}
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {/* Start button: only shown to the assigned person (not the assigner) */}
                        {task.status === "Pending" && (() => {
                          const isAssigner = user && task.assignedBy && (task.assignedBy._id === user.id || task.assignedBy._id === user._id);
                          const isAssignee = user && task.assignedTo && (task.assignedTo._id === user.id || task.assignedTo._id === user._id);
                          // Assigner doesn't see Start, they see Complete directly
                          if (isAssigner && !isAssignee) {
                            return (
                              <button onClick={() => handleStatusChange(task._id, "Completed", task)} disabled={updatingTask === task._id}
                                className={`${actionBtnClass} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}>
                                {updatingTask === task._id ? <FaSpinner className="animate-spin" size={10} /> : "Done"}
                              </button>
                            );
                          }
                          return (
                            <button onClick={() => handleStatusChange(task._id, "In Progress")} disabled={updatingTask === task._id}
                              className={`${actionBtnClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>
                              {updatingTask === task._id ? <FaSpinner className="animate-spin" size={10} /> : "Start"}
                            </button>
                          );
                        })()}
                        {(task.status === "In Progress" || task.status === "Overdue") && (
                          <button onClick={() => handleStatusChange(task._id, "Completed", task)} disabled={updatingTask === task._id}
                            className={`${actionBtnClass} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}>
                            {updatingTask === task._id ? <FaSpinner className="animate-spin" size={10} /> : "Done"}
                          </button>
                        )}
                        {task.status === "Completed" && isManager && (
                          <button onClick={() => handleStatusChange(task._id, "Pending")} disabled={updatingTask === task._id}
                            className={`${actionBtnClass} border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100`}>
                            Reopen
                          </button>
                        )}
                        {isExpanded ? <FaChevronUp className="text-gray-400 ml-1" size={12} /> : <FaChevronDown className="text-gray-400 ml-1" size={12} />}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-gray-100">
                          <div className="px-4 py-4 bg-gradient-to-r from-violet-50 to-purple-50 space-y-3">
                            {task.description && (
                              <p className="text-sm text-gray-700">{task.description}</p>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="bg-white rounded-lg p-3 border border-violet-100">
                                <p className="text-xs text-gray-500 font-semibold">Category</p>
                                <p className="text-sm font-bold">{CATEGORY_ICON[task.category]} {task.category}</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-violet-100">
                                <p className="text-xs text-gray-500 font-semibold">Assigned To</p>
                                <p className="text-sm font-bold">{task.assignedTo?.name || "Unassigned"}</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-violet-100">
                                <p className="text-xs text-gray-500 font-semibold">Location</p>
                                <p className="text-sm font-bold">{task.location?.name || "—"}{task.paddock ? ` → ${task.paddock}` : ""}</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-violet-100">
                                <p className="text-xs text-gray-500 font-semibold">Due Date</p>
                                <p className="text-sm font-bold">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}</p>
                              </div>
                            </div>
                            {task.animal && (
                              <div className="bg-white rounded-lg p-3 border border-violet-100 inline-block">
                                <p className="text-xs text-gray-500 font-semibold">Related Animal</p>
                                <p className="text-sm font-bold">{task.animal.tagId} - {task.animal.name || "Animal"}</p>
                              </div>
                            )}
                            {task.notes && (
                              <p className="text-xs text-gray-500 italic">Notes: {task.notes}</p>
                            )}
                            {task.completedAt && (
                              <p className="text-xs text-green-600">Completed on {new Date(task.completedAt).toLocaleString()} by {task.completedBy?.name || "—"}</p>
                            )}
                            {task.assignedBy && (
                              <p className="text-xs text-gray-400">Created by {task.assignedBy.name}</p>
                            )}
                            {isManager && (
                              <div className="flex gap-2 pt-2 border-t border-violet-100">
                                <button onClick={() => handleEdit(task)} className={`${actionBtnClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>
                                  <span className="flex items-center gap-1"><FaEdit size={10} /> Edit</span>
                                </button>
                                <button onClick={() => handleDelete(task._id)} className={`${actionBtnClass} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>
                                  <span className="flex items-center gap-1"><FaTrash size={10} /> Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

TasksPage.layoutType = "default";
TasksPage.layoutProps = { title: "Tasks" };
