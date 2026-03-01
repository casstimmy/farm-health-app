"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPlus, FaTimes, FaCheck, FaSpinner, FaClock, FaExclamationTriangle, FaRedo,
  FaCheckCircle, FaChevronDown, FaChevronUp, FaTrash, FaEdit,
} from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";

const CATEGORIES = ["General", "Feeding", "Treatment", "Cleaning", "Breeding", "Vaccination", "Maintenance", "Inventory", "Other"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
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
  title: "", description: "", category: "General", priority: "Medium",
  assignedTo: "", location: "", animal: "", dueDate: "", notes: "",
  isRecurring: false, recurringInterval: "",
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

  const isManager = user && ["SuperAdmin", "Manager"].includes(user.role);
  const actionBtnClass = "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors";

  useEffect(() => {
    if (roleLoading) return;
    if (!user) { router.push("/login"); return; }
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
      if (!payload.animal) delete payload.animal;

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

  const handleStatusChange = async (taskId, newStatus) => {
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
      category: task.category || "General",
      priority: task.priority || "Medium",
      assignedTo: task.assignedTo?._id || "",
      location: task.location?._id || "",
      animal: task.animal?._id || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      notes: task.notes || "",
      isRecurring: task.isRecurring || false,
      recurringInterval: task.recurringInterval || "",
    });
    setEditingId(task._id);
    setShowForm(true);
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
          <StatsSummary stats={[
            { label: "Total Tasks", value: stats.total, bgColor: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-900", icon: "📋" },
            { label: "Pending", value: stats.pending, bgColor: "bg-yellow-50", borderColor: "border-yellow-200", textColor: "text-yellow-700", icon: "⏳" },
            { label: "In Progress", value: stats.inProgress, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700", icon: "🔄" },
            { label: "Overdue", value: stats.overdue, bgColor: "bg-red-50", borderColor: "border-red-200", textColor: "text-red-700", icon: "⚠️" },
            { label: "Completed", value: stats.completed, bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700", icon: "✅" },
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
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                        <input type="text" className="input-field" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                        <textarea className="input-field" rows={2} placeholder="Task description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                        <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
                        <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Assign To</label>
                        <select className="input-field" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                          <option value="">Unassigned</option>
                          {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                        <input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                        <select className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                          <option value="">No location</option>
                          {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Related Animal</label>
                        <select className="input-field" value={form.animal} onChange={(e) => setForm({ ...form, animal: e.target.value })}>
                          <option value="">None</option>
                          {animals.map((a) => <option key={a._id} value={a._id}>{a.tagId} - {a.name || a.breed || "Animal"}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
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
                        </select>
                      )}
                    </div>
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
                        {task.status === "Pending" && (
                          <button onClick={() => handleStatusChange(task._id, "In Progress")} disabled={updatingTask === task._id}
                            className={`${actionBtnClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>
                            {updatingTask === task._id ? <FaSpinner className="animate-spin" size={10} /> : "Start"}
                          </button>
                        )}
                        {(task.status === "In Progress" || task.status === "Overdue") && (
                          <button onClick={() => handleStatusChange(task._id, "Completed")} disabled={updatingTask === task._id}
                            className={`${actionBtnClass} border-green-200 bg-green-50 text-green-700 hover:bg-green-100`}>
                            {updatingTask === task._id ? <FaSpinner className="animate-spin" size={10} /> : "Done"}
                          </button>
                        )}
                        {task.status === "Completed" && (
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
                                <p className="text-sm font-bold">{task.location?.name || "—"}</p>
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
