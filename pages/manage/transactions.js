"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useRole } from "@/hooks/useRole";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import StatsSummary from "@/components/shared/StatsSummary";

const EXPENSE_CATEGORIES = [
  "Feed",
  "Medication",
  "Transport",
  "Utilities",
  "Equipment",
  "Labor",
  "Admin",
  "Maintenance",
  "Petty Cash",
  "Other",
];

export default function Transactions() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user, isLoading: roleLoading } = useRole();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "Feed",
    paymentMethod: "Cash",
    vendor: "",
    invoiceNumber: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Check if user has permission (SuperAdmin or Manager)
    if (user && !["SuperAdmin", "Manager"].includes(user.role)) {
      router.push("/");
      return;
    }

    fetchExpenses();
  }, [router, user, roleLoading]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/finance?type=expense", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          type: "expense",
          date: new Date().toISOString(),
          month: new Date().toLocaleString('default', { month: 'long' }),
          status: "Completed",
          recordedBy: user?.name || "Unknown"
        }),
      });

      if (res.ok) {
        setFormData({
          title: "",
          description: "",
          amount: "",
          category: "Feed",
          paymentMethod: "Cash",
          vendor: "",
          invoiceNumber: ""
        });
        setShowForm(false);
        fetchExpenses();
      } else {
        alert("Failed to add expense");
      }
    } catch (err) {
      console.error("Failed to submit expense:", err);
      alert("Error submitting expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/finance/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        fetchExpenses();
      } else {
        alert("Failed to delete expense");
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  const filteredExpenses = expenses.filter(
    (exp) =>
      (searchTerm === "" ||
        exp.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterCategory === "all" || exp.category === filterCategory)
  );

  const totalExpense = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Expense Management"
        subtitle="Track and manage farm expenses"
        gradient="from-orange-600 to-orange-700"
        icon="💸"
      />

      {/* Summary Cards */}
      <StatsSummary
        stats={[
          {
            label: "Total Expenses",
            value: formatCurrency(totalExpense, businessSettings.currency),
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            textColor: "text-orange-700",
            icon: "📊",
          },
          {
            label: "Expenses This Month",
            value: formatCurrency(
              expenses
                .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
                .reduce((sum, e) => sum + (e.amount || 0), 0),
              businessSettings.currency
            ),
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-700",
            icon: "📅",
          },
          {
            label: "Total Records",
            value: expenses.length.toString(),
            bgColor: "bg-purple-50",
            borderColor: "border-purple-200",
            textColor: "text-purple-700",
            icon: "📝",
          },
        ]}
      />

      {/* Add Expense Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaPlus className="text-orange-600" /> Add New Expense
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Diesel Purchase"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Amount ({businessSettings.currency}) *</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="e.g., 25000"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  required
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Check">Check</option>
                  <option value="Mobile Money">Mobile Money</option>
                </select>
              </div>

              {/* Vendor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor/Supplier</label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC Fuel Station"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Number</label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., INV-001"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add any relevant notes..."
                rows="3"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add Expense"}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Controls */}
      <FilterBar
        searchPlaceholder="Search expenses..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterOptions={[
          { value: "all", label: "All Categories" },
          ...EXPENSE_CATEGORIES.map(cat => ({ value: cat, label: cat }))
        ]}
        filterValue={filterCategory}
        onFilterChange={setFilterCategory}
        showAddButton={true}
        onAddClick={() => setShowForm(!showForm)}
        isAddActive={showForm}
      />

      {/* Expenses Cards View */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="text-gray-600 mt-4">Loading transactions...</p>
          </div>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-200">
          <p className="text-gray-500 text-lg">No expenses found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg"
          >
            Add First Expense
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExpenses.map((expense, idx) => (
            <motion.div
              key={expense._id || idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{expense.title}</h3>
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                      {expense.category}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="text-gray-600 text-sm mb-3">{expense.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>📅 {new Date(expense.date).toLocaleDateString()}</span>
                    {expense.vendor && <span>🏪 {expense.vendor}</span>}
                    {expense.paymentMethod && <span>💳 {expense.paymentMethod}</span>}
                    {expense.invoiceNumber && <span>🧾 {expense.invoiceNumber}</span>}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(expense.amount, businessSettings.currency)}
                  </p>
                  <button
                    onClick={() => handleDelete(expense._id)}
                    className="mt-2 p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                    title="Delete expense"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

Transactions.layoutType = "default";
Transactions.layoutProps = { title: "Expenses" };
