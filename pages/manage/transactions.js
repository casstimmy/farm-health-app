"use client";

import { useState, useEffect, useMemo, useContext, useRef } from "react";
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

export default function Transactions() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user, isLoading: roleLoading } = useRole();
  const [allFinance, setAllFinance] = useState([]); // income + expenses
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all"); // "all" | "income" | "expense"
  const [chartMode, setChartMode] = useState("pie"); // "pie" | "bar"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "Feed",
    type: "expense",
    paymentMethod: "Cash",
    vendor: "",
    invoiceNumber: "",
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
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/finance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAllFinance(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError("Failed to fetch finance data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) { setError("Title and Amount are required."); return; }

    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date().toISOString(),
          month: new Date().toLocaleString("default", { month: "long" }),
          status: "Completed",
          recordedBy: user?.name || "Unknown",
        }),
      });
      if (!res.ok) throw new Error("Failed to add record");
      setSuccess("Record added!");
      setFormData({ title: "", description: "", amount: "", category: "Feed", type: "expense", paymentMethod: "Cash", vendor: "", invoiceNumber: "" });
      setShowForm(false);
      fetchFinance();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/finance/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSuccess("Record deleted!");
      fetchFinance();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  // Separate income and expenses
  const expenses = allFinance.filter((f) => f.type === "expense");
  const income = allFinance.filter((f) => f.type === "income");

  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalIncome = income.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netPL = totalIncome - totalExpense;

  const thisMonthExpenses = expenses.filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const thisMonthIncome = income.filter((e) => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Expenses by category for charts
  const expensesByCategory = useMemo(() => {
    return EXPENSE_CATEGORIES.map((cat) => ({
      category: cat,
      amount: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0),
    })).filter((c) => c.amount > 0);
  }, [expenses]);

  // Chart data
  const pieData = {
    labels: expensesByCategory.map((c) => c.category),
    datasets: [{
      data: expensesByCategory.map((c) => c.amount),
      backgroundColor: expensesByCategory.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]),
      borderWidth: 2,
      borderColor: "#fff",
    }],
  };

  const barData = {
    labels: expensesByCategory.map((c) => c.category),
    datasets: [{
      label: "Expense Amount",
      data: expensesByCategory.map((c) => c.amount),
      backgroundColor: expensesByCategory.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]),
      borderRadius: 6,
    }],
  };

  const barOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { callback: (v) => formatCurrency(v, businessSettings.currency) } },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "right", labels: { boxWidth: 14, padding: 12, font: { size: 12 } } },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw, businessSettings.currency)}` },
      },
    },
  };

  // Filter
  const filtered = allFinance.filter((f) => {
    const matchSearch = searchTerm === "" ||
      f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === "all" || f.category === filterCategory;
    const matchType = filterType === "all" || f.type === filterType;
    return matchSearch && matchCategory && matchType;
  });

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Expenses"
        subtitle="Track income, expenses, and financial analytics"
        icon="💸"
        actions={
          <button
            onClick={() => { setShowForm(!showForm); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Cancel" : "Add Record"}
          </button>
        }
      />

      {/* Messages */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
          <button onClick={() => setError("")} className="ml-4 text-red-500"><FaTimes /></button>
        </motion.div>
      )}
      {success && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          {success}
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(totalIncome, businessSettings.currency)}</p>
          <p className="text-xs text-gray-500 mt-1">This month: {formatCurrency(thisMonthIncome, businessSettings.currency)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-xl font-bold text-red-700">{formatCurrency(totalExpense, businessSettings.currency)}</p>
          <p className="text-xs text-gray-500 mt-1">This month: {formatCurrency(thisMonthExpenses, businessSettings.currency)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${netPL >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
          <p className="text-sm text-gray-600">Net Profit/Loss</p>
          <p className={`text-xl font-bold ${netPL >= 0 ? "text-blue-700" : "text-orange-700"}`}>
            {formatCurrency(netPL, businessSettings.currency)}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Records</p>
          <p className="text-xl font-bold text-purple-700">{allFinance.length}</p>
          <p className="text-xs text-gray-500 mt-1">{income.length} income | {expenses.length} expense</p>
        </div>
      </div>

      {/* Charts Section */}
      {expensesByCategory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Expenses by Category</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartMode("pie")}
                className={`p-2 rounded-lg transition-colors ${chartMode === "pie" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                title="Pie Chart"
              >
                <FaChartPie size={16} />
              </button>
              <button
                onClick={() => setChartMode("bar")}
                className={`p-2 rounded-lg transition-colors ${chartMode === "bar" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                title="Bar Chart"
              >
                <FaChartBar size={16} />
              </button>
            </div>
          </div>
          <div className="h-72">
            {chartMode === "pie" ? (
              <Pie data={pieData} options={pieOptions} />
            ) : (
              <Bar data={barData} options={barOptions} />
            )}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white rounded-xl shadow-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Add Financial Record</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Diesel Purchase"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>
              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>
              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>
              {/* Vendor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Vendor/Supplier</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="e.g., ABC Store"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>
              {/* Invoice */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="INV-001"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>
              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:opacity-60">
                {submitting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Add Record
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-4">
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search transactions..."
          filters={[
            {
              value: filterCategory,
              onChange: setFilterCategory,
              options: [
                { value: "all", label: "All Categories" },
                ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c })),
              ],
            },
            {
              value: filterType,
              onChange: setFilterType,
              options: [
                { value: "all", label: "All Types" },
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
              ],
            },
          ]}
        />
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">💸</span>
            <p className="text-gray-500 text-lg">No transactions found</p>
          </div>
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
                  <th className="px-5 py-4 text-left text-xs font-bold text-gray-900 uppercase">Payment</th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-gray-900 uppercase">Amount</th>
                  <th className="px-5 py-4 text-center text-xs font-bold text-gray-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((record, idx) => (
                  <motion.tr
                    key={record._id || idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {record.date ? new Date(record.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {record.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{record.title}</td>
                    <td className="px-5 py-4 text-sm">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                        {record.category || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{record.vendor || "—"}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{record.paymentMethod || "—"}</td>
                    <td className={`px-5 py-4 text-sm text-right font-bold ${record.type === "income" ? "text-green-700" : "text-red-700"}`}>
                      {record.type === "income" ? "+" : "-"}{formatCurrency(record.amount || 0, businessSettings.currency)}
                    </td>
                    <td className="px-5 py-4 text-sm text-center">
                      {user?.role === "SuperAdmin" && (
                        <button
                          onClick={() => handleDelete(record._id)}
                          disabled={deleting === record._id}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === record._id ? <FaSpinner className="animate-spin" size={14} /> : <FaTrash size={14} />}
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

Transactions.layoutType = "default";
Transactions.layoutProps = { title: "Expenses" };
