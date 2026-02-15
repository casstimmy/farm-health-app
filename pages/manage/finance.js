"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaTrash, FaSpinner, FaCheck, FaChartPie, FaChartBar } from "react-icons/fa";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useRole } from "@/hooks/useRole";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const EXPENSE_CATEGORIES = [
  "Feed", "Medication", "Transport", "Utilities", "Equipment",
  "Labor", "Admin", "Maintenance", "Petty Cash", "Other",
];

const CATEGORY_COLORS = [
  "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#10b981",
  "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#6b7280",
];

export default function Finance() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user, isLoading: roleLoading } = useRole();
  const [allFinance, setAllFinance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [chartMode, setChartMode] = useState("pie");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    title: "", description: "", amount: "", category: "Feed",
    type: "expense", paymentMethod: "Cash", vendor: "", invoiceNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (user && !["SuperAdmin", "Manager"].includes(user.role)) { router.push("/"); return; }
    fetchFinance();
  }, [router, user, roleLoading]);

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/finance", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setAllFinance(await res.json());
    } catch (err) {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) { setError("Title and Amount required."); return; }
    setSubmitting(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData, amount: parseFloat(formData.amount),
          date: new Date().toISOString(),
          month: new Date().toLocaleString("default", { month: "long" }),
          status: "Completed", recordedBy: user?.name || "Unknown",
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      setSuccess("Record added!"); setShowForm(false);
      setFormData({ title: "", description: "", amount: "", category: "Feed", type: "expense", paymentMethod: "Cash", vendor: "", invoiceNumber: "" });
      fetchFinance(); setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/finance/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed"); fetchFinance();
      setSuccess("Deleted!"); setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message); }
    finally { setDeleting(null); }
  };

  const expenses = allFinance.filter((f) => f.type === "expense");
  const income = allFinance.filter((f) => f.type === "income");
  const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalIncome = income.reduce((s, e) => s + (e.amount || 0), 0);
  const netPL = totalIncome - totalExpense;

  const expensesByCategory = useMemo(() =>
    EXPENSE_CATEGORIES.map((cat) => ({
      category: cat,
      amount: expenses.filter((e) => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0),
    })).filter((c) => c.amount > 0),
  [expenses]);

  const pieData = {
    labels: expensesByCategory.map((c) => c.category),
    datasets: [{ data: expensesByCategory.map((c) => c.amount), backgroundColor: expensesByCategory.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]), borderWidth: 2, borderColor: "#fff" }],
  };
  const barData = {
    labels: expensesByCategory.map((c) => c.category),
    datasets: [{ label: "Expense", data: expensesByCategory.map((c) => c.amount), backgroundColor: expensesByCategory.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]), borderRadius: 6 }],
  };
  const barOpts = { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: (v) => formatCurrency(v, businessSettings.currency) } } } };
  const pieOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 14, padding: 12 } }, tooltip: { callbacks: { label: (c) => `${c.label}: ${formatCurrency(c.raw, businessSettings.currency)}` } } } };

  const filtered = allFinance.filter((f) => {
    const ms = !searchTerm || f.title?.toLowerCase().includes(searchTerm.toLowerCase()) || f.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const mc = filterCategory === "all" || f.category === filterCategory;
    const mt = filterType === "all" || f.type === filterType;
    return ms && mc && mt;
  });

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <PageHeader title="Finance" subtitle="Track income, expenses, and financial analytics" icon="💰"
        actions={<button onClick={() => { setShowForm(!showForm); setError(""); }} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium">
          {showForm ? <FaTimes /> : <FaPlus />} {showForm ? "Cancel" : "Add Record"}
        </button>}
      />

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">{error}<button onClick={() => setError("")} className="ml-4"><FaTimes /></button></div>}
      {success && <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">{success}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4"><p className="text-sm text-gray-600">Total Income</p><p className="text-xl font-bold text-green-700">{formatCurrency(totalIncome, businessSettings.currency)}</p></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-sm text-gray-600">Total Expenses</p><p className="text-xl font-bold text-red-700">{formatCurrency(totalExpense, businessSettings.currency)}</p></div>
        <div className={`border rounded-xl p-4 ${netPL >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}><p className="text-sm text-gray-600">Net P&L</p><p className={`text-xl font-bold ${netPL >= 0 ? "text-blue-700" : "text-orange-700"}`}>{formatCurrency(netPL, businessSettings.currency)}</p></div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4"><p className="text-sm text-gray-600">Records</p><p className="text-xl font-bold text-purple-700">{allFinance.length}</p></div>
      </div>

      {/* Charts */}
      {expensesByCategory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Expenses by Category</h3>
            <div className="flex gap-2">
              <button onClick={() => setChartMode("pie")} className={`p-2 rounded-lg ${chartMode === "pie" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}><FaChartPie size={16} /></button>
              <button onClick={() => setChartMode("bar")} className={`p-2 rounded-lg ${chartMode === "bar" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}><FaChartBar size={16} /></button>
            </div>
          </div>
          <div className="h-72">{chartMode === "pie" ? <Pie data={pieData} options={pieOpts} /> : <Bar data={barData} options={barOpts} />}</div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add Financial Record</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none">
                  <option value="expense">Expense</option><option value="income">Income</option>
                </select></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Amount *</label>
                <input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none" required /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Payment</label>
                <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none">
                  <option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="Check">Check</option><option value="Mobile Money">Mobile Money</option></select></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Vendor</label>
                <input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none" /></div>
              <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none" /></div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:opacity-60">
                {submitting ? <FaSpinner className="animate-spin" /> : <FaCheck />} Add Record</button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Filter */}
      <FilterBar searchTerm={searchTerm} onSearchChange={setSearchTerm} placeholder="Search..."
        filters={[
          { value: filterCategory, onChange: setFilterCategory, options: [{ value: "all", label: "All Categories" }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))] },
          { value: filterType, onChange: setFilterType, options: [{ value: "all", label: "All Types" }, { value: "income", label: "Income" }, { value: "expense", label: "Expense" }] },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16"><span className="text-5xl block mb-4">💰</span><p className="text-gray-500 text-lg">No records found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-900 uppercase">Type</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-900 uppercase">Title</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-900 uppercase">Category</th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-900 uppercase">Vendor</th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-gray-900 uppercase">Amount</th>
                  <th className="px-5 py-4 text-center text-xs font-bold text-gray-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((r, idx) => (
                  <motion.tr key={r._id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="hover:bg-gray-50">
                    <td className="px-5 py-4 text-sm">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-4 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${r.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{r.type === "income" ? "Income" : "Expense"}</span></td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{r.title}</td>
                    <td className="px-5 py-4 text-sm"><span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">{r.category || "—"}</span></td>
                    <td className="px-5 py-4 text-sm text-gray-700">{r.vendor || "—"}</td>
                    <td className={`px-5 py-4 text-sm text-right font-bold ${r.type === "income" ? "text-green-700" : "text-red-700"}`}>{r.type === "income" ? "+" : "-"}{formatCurrency(r.amount || 0, businessSettings.currency)}</td>
                    <td className="px-5 py-4 text-sm text-center">
                      {user?.role === "SuperAdmin" && (
                        <button onClick={() => handleDelete(r._id)} disabled={deleting === r._id} className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg disabled:opacity-50">
                          {deleting === r._id ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

Finance.layoutType = "default";
Finance.layoutProps = { title: "Finance" };
