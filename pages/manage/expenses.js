"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaTimes, FaCheck, FaSpinner, FaMoneyBillWave, FaReceipt } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { getCachedData, invalidateCache } from "@/utils/cache";

const EXPENSE_CATEGORIES = [
  "Feed",
  "Medication",
  "Transport",
  "Utilities",
  "Equipment",
  "Labor",
  "Maintenance",
  "Petty Cash",
  "Admin",
  "Other",
];

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Check", "Mobile Money"];

const initialForm = {
  title: "",
  amount: "",
  category: "Feed",
  date: new Date().toISOString().split("T")[0],
  paymentMethod: "Cash",
  description: "",
  notes: "",
};

export default function ExpenseEntry() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const currency = businessSettings?.currency || "NGN";
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ ...initialForm });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchExpenses();
  }, [router]);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await getCachedData("api/expenses", async () => {
        const res = await fetch("/api/expenses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.ok ? await res.json() : [];
      }, 3 * 60 * 1000);
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.title.trim() || !formData.amount || !formData.category) {
      setError("Please fill in title, amount, and category");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save expense");
      }

      setSuccess("Expense recorded successfully!");
      setFormData({ ...initialForm });
      fetchExpenses();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Today's expenses
  const todayExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.toDateString() === new Date().toDateString();
  });
  const todayTotal = todayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalAll = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Record Expense"
          subtitle="Quick expense entry - accessible to all staff"
          gradient="from-amber-500 to-orange-500"
          icon="$"
          actions={
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors font-medium shadow-md"
            >
              {showForm ? <FaTimes /> : <FaPlus />}
              {showForm ? "Hide Form" : "Add Expense"}
            </button>
          }
        />
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10">
          <Loader message="Loading expenses..." color="amber-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record Expense"
        subtitle="Quick expense entry — accessible to all staff"
        gradient="from-amber-500 to-orange-500"
        icon="💸"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg transition-colors font-medium shadow-md"
          >
            {showForm ? <FaTimes /> : <FaPlus />}
            {showForm ? "Hide Form" : "Add Expense"}
          </button>
        }
      />

      {/* Messages */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700"><FaTimes /></button>
        </motion.div>
      )}
      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          <FaCheck className="inline mr-2" />{success}
        </motion.div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Today&apos;s Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(todayTotal, currency)}</p>
          <p className="text-xs text-gray-500">{todayExpenses.length} record{todayExpenses.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAll, currency)}</p>
          <p className="text-xs text-gray-500">{expenses.length} record{expenses.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="text-sm text-gray-600">Recent Entries</p>
          <p className="text-2xl font-bold text-gray-900">{expenses.slice(0, 1)[0]?.title || "—"}</p>
          <p className="text-xs text-gray-500">{expenses[0] ? formatCurrency(expenses[0].amount, currency) : "No entries yet"}</p>
        </div>
      </div>

      {/* Expense Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FaMoneyBillWave /> New Expense
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">💸 Expense Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Title / Item *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="e.g. Goat Feed, Diesel Fuel"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Amount *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => handleChange("amount", e.target.value)}
                      placeholder="0.00"
                      className="input-field"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleChange("category", e.target.value)}
                      className="input-field"
                      required
                    >
                      {EXPENSE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => handleChange("paymentMethod", e.target.value)}
                      className="input-field"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="Optional details"
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                <h4 className="font-bold text-gray-700 mb-3">📝 Notes (optional)</h4>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Any additional notes..."
                  className="input-field h-20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...initialForm })}
                  className="px-5 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold disabled:opacity-60 flex items-center gap-2 shadow-md"
                >
                  {submitting ? <><FaSpinner className="animate-spin" /> Saving...</> : <><FaReceipt /> Record Expense</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Expenses Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <FaReceipt className="text-amber-500" /> Today&apos;s Expenses
          </h3>
        </div>
        {todayExpenses.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">💸</span>
            <p className="text-gray-500 text-lg">No expenses recorded today</p>
            <p className="text-gray-400 text-sm mt-1">Use the form above to add your first expense</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayExpenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{exp.title}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600">
                      {formatCurrency(exp.amount, currency)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{exp.paymentMethod}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

ExpenseEntry.layoutType = "default";
ExpenseEntry.layoutProps = { title: "Record Expense" };

