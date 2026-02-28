"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { FaPlus, FaTimes, FaTrash, FaSpinner, FaCheck, FaChartPie, FaChartBar, FaEdit } from "react-icons/fa";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import { useRole } from "@/hooks/useRole";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { PERIOD_OPTIONS, filterByPeriod, filterByLocation } from "@/utils/filterHelpers";
import { invalidateCache } from "@/utils/cache";

// Lazy-load Chart.js to reduce bundle size
const ChartLoader = () => <div className="h-48 flex items-center justify-center text-gray-400">Loading chart...</div>;
const Pie = dynamic(() => import("react-chartjs-2").then(mod => mod.Pie), { ssr: false, loading: ChartLoader });
const Bar = dynamic(() => import("react-chartjs-2").then(mod => mod.Bar), { ssr: false, loading: ChartLoader });

if (typeof window !== "undefined") {
  import("chart.js").then(({ Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement }) => {
    Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);
  });
}

const EXPENSE_CATEGORIES = ["Feed", "Medication", "Transport", "Utilities", "Equipment", "Labor", "Admin", "Maintenance", "Petty Cash", "Other"];
const CATEGORY_COLORS = ["#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#10b981", "#ec4899", "#6366f1", "#14b8a6", "#f97316", "#6b7280"];

const initialForm = { title: "", description: "", amount: "", category: "Feed", type: "Expense", paymentMethod: "Cash", vendor: "", invoiceNumber: "", date: new Date().toISOString().split("T")[0], location: "", notes: "" };

export default function Transactions() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user, isLoading: roleLoading } = useRole();
  const [allFinance, setAllFinance] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [chartMode, setChartMode] = useState("pie");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({ ...initialForm });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (user && !["SuperAdmin", "Manager"].includes(user.role)) { router.push("/"); return; }
    fetchData();
  }, [router, user, roleLoading]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [finData, locData] = await Promise.all([
        fetch("/api/finance", { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : [])),
        fetch("/api/locations", { headers: { Authorization: `Bearer ${token}` } }).then((r) => (r.ok ? r.json() : [])),
      ]);
      setAllFinance(finData);
      setLocations(locData || []);
    } catch (err) { setError("Failed to fetch data"); }
    finally { setLoading(false); }
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setFormData({
      title: record.title || "",
      description: record.description || "",
      amount: record.amount || "",
      category: record.category || "Feed",
      type: record.type || "Expense",
      paymentMethod: record.paymentMethod || "Cash",
      vendor: record.vendor || "",
      invoiceNumber: record.invoiceNumber || "",
      date: record.date ? new Date(record.date).toISOString().split("T")[0] : "",
      location: record.location?._id || record.location || "",
      notes: record.notes || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) { setError("Title and Amount required."); return; }
    setSubmitting(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `/api/finance/${editingId}` : "/api/finance";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount), date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(), month: new Date(formData.date || Date.now()).toLocaleString("default", { month: "long" }), status: "Completed", recordedBy: user?.name || "Unknown", location: formData.location || undefined }) });
      if (!res.ok) throw new Error("Failed");
      setSuccess(editingId ? "Updated!" : "Record added!");
      setShowForm(false); setEditingId(null); setFormData({ ...initialForm });
      fetchData(); setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    setDeleting(id);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/finance/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      setSuccess("Deleted!"); fetchData(); setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.message); }
    finally { setDeleting(null); }
  };

  const expenses = allFinance.filter((f) => f.type?.toLowerCase() === "expense");
  const income = allFinance.filter((f) => f.type?.toLowerCase() === "income");
  const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalIncome = income.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netPL = totalIncome - totalExpense;
  const thisMonthExpenses = expenses.filter((e) => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + (e.amount || 0), 0);
  const thisMonthIncome = income.filter((e) => new Date(e.date).getMonth() === new Date().getMonth()).reduce((sum, e) => sum + (e.amount || 0), 0);

  const expensesByCategory = useMemo(() =>
    EXPENSE_CATEGORIES.map((cat) => ({
      category: cat,
      amount: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0),
    })).filter((c) => c.amount > 0),
  [expenses]);

  const pieData = { labels: expensesByCategory.map((c) => c.category), datasets: [{ data: expensesByCategory.map((c) => c.amount), backgroundColor: expensesByCategory.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]), borderWidth: 2, borderColor: "#fff" }] };
  const barData = { labels: expensesByCategory.map((c) => c.category), datasets: [{ label: "Expense Amount", data: expensesByCategory.map((c) => c.amount), backgroundColor: expensesByCategory.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]), borderRadius: 6 }] };
  const barOpts = { indexAxis: "y", responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { callback: (v) => formatCurrency(v, businessSettings.currency) } } } };
  const pieOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { boxWidth: 14, padding: 12 } }, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw, businessSettings.currency)}` } } } };

  let filtered = allFinance.filter((f) => {
    const matchSearch = !searchTerm || f.title?.toLowerCase().includes(searchTerm.toLowerCase()) || f.description?.toLowerCase().includes(searchTerm.toLowerCase()) || f.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = filterCategory === "all" || f.category === filterCategory;
    const matchType = filterType === "all" || f.type?.toLowerCase() === filterType.toLowerCase();
    return matchSearch && matchCategory && matchType;
  });
  filtered = filterByPeriod(filtered, filterPeriod);
  filtered = filterByLocation(filtered, filterLocation);

  return (
    <div className="space-y-6">
      <PageHeader title="Finance & Expenses" subtitle="Track income, expenses, and financial analytics" icon="💸"
        actions={<button onClick={() => { setShowForm(!showForm); setError(""); setEditingId(null); setFormData({ ...initialForm }); }} className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium">{showForm ? <FaTimes /> : <FaPlus />} {showForm ? "Cancel" : "Add Record"}</button>}
      />

      {loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-10">
          <Loader message="Loading transactions..." color="orange-600" />
        </div>
      )}

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="error-message flex items-center justify-between"><span>{error}</span><button onClick={() => setError("")} className="text-red-500"><FaTimes /></button></motion.div>}
      {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="success-message"><FaCheck className="inline mr-2" />{success}</motion.div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4"><p className="text-sm text-gray-600">Total Income</p><p className="text-xl font-bold text-green-700">{formatCurrency(totalIncome, businessSettings.currency)}</p><p className="text-xs text-gray-500 mt-1">This month: {formatCurrency(thisMonthIncome, businessSettings.currency)}</p></div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4"><p className="text-sm text-gray-600">Total Expenses</p><p className="text-xl font-bold text-red-700">{formatCurrency(totalExpense, businessSettings.currency)}</p><p className="text-xs text-gray-500 mt-1">This month: {formatCurrency(thisMonthExpenses, businessSettings.currency)}</p></div>
        <div className={`border rounded-xl p-4 ${netPL >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}><p className="text-sm text-gray-600">Net P&L</p><p className={`text-xl font-bold ${netPL >= 0 ? "text-blue-700" : "text-orange-700"}`}>{formatCurrency(netPL, businessSettings.currency)}</p></div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4"><p className="text-sm text-gray-600">Records</p><p className="text-xl font-bold text-purple-700">{allFinance.length}</p><p className="text-xs text-gray-500 mt-1">{income.length} income | {expenses.length} expense</p></div>
      </div>

      {expensesByCategory.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Expenses by Category</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => setChartMode("pie")} className={`p-2 rounded-lg transition-colors ${chartMode === "pie" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}><FaChartPie size={16} /></button>
              <button onClick={() => setChartMode("bar")} className={`p-2 rounded-lg transition-colors ${chartMode === "bar" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600"}`}><FaChartBar size={16} /></button>
            </div>
          </div>
          <div className="h-72">{chartMode === "pie" ? <Pie data={pieData} options={pieOpts} /> : <Bar data={barData} options={barOpts} />}</div>
        </div>
      )}

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-orange-600 px-6 py-3"><h3 className="text-lg font-bold text-white">{editingId ? "Edit Financial Record" : "Add Financial Record"}</h3></div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
              <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">💸 Transaction Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="label">Type *</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="input-field"><option value="Expense">Expense</option><option value="Income">Income</option></select></div>
                <div><label className="label">Title *</label><input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Diesel Purchase" className="input-field" required /></div>
                <div><label className="label">Amount *</label><input type="number" step="0.01" min="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" className="input-field" required /></div>
                <div><label className="label">Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-field" /></div>
                <div><label className="label">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input-field">{EXPENSE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div><label className="label">Payment Method</label><select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="input-field"><option value="Cash">Cash</option><option value="Bank Transfer">Bank Transfer</option><option value="Check">Check</option><option value="Mobile Money">Mobile Money</option></select></div>
                <div><label className="label">Vendor</label><input type="text" value={formData.vendor} onChange={(e) => setFormData({ ...formData, vendor: e.target.value })} placeholder="e.g., ABC Store" className="input-field" /></div>
                <div><label className="label">Invoice No.</label><input type="text" value={formData.invoiceNumber} onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })} placeholder="INV-001" className="input-field" /></div>
                <div><label className="label">Location</label><select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field"><option value="">-- Select Location --</option>{locations.map((loc) => <option key={loc._id} value={loc._id}>{loc.name}</option>)}</select></div>
              </div>
            </div>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">📝 Description</h4>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} placeholder="Optional notes..." className="input-field" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:opacity-60">{submitting ? <FaSpinner className="animate-spin" /> : <FaCheck />} {editingId ? "Update" : "Add Record"}</button>
            </div>
          </form>
        </motion.div>
      )}

      <FilterBar searchTerm={searchTerm} onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }} placeholder="Search transactions..."
        filters={[
          { value: filterCategory, onChange: (v) => { setFilterCategory(v); setCurrentPage(1); }, options: [{ value: "all", label: "All Categories" }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))] },
          { value: filterType, onChange: (v) => { setFilterType(v); setCurrentPage(1); }, options: [{ value: "all", label: "All Types" }, { value: "Income", label: "Income" }, { value: "Expense", label: "Expense" }] },
          { value: filterPeriod, onChange: (v) => { setFilterPeriod(v); setCurrentPage(1); }, options: PERIOD_OPTIONS },
          { value: filterLocation, onChange: (v) => { setFilterLocation(v); setCurrentPage(1); }, options: [{ value: "all", label: "All Locations" }, ...locations.map((l) => ({ value: l._id, label: l.name }))] },
        ]}
      />

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16"><span className="text-5xl mb-4 block">💸</span><p className="text-gray-500 text-lg">No transactions found</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 uppercase">Location</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(() => {
                    const totalPages = Math.ceil(filtered.length / itemsPerPage);
                    const safePage = Math.min(currentPage, totalPages);
                    const startIdx = (safePage - 1) * itemsPerPage;
                    const paginatedRecords = filtered.slice(startIdx, startIdx + itemsPerPage);
                    return paginatedRecords.map((record, idx) => (
                      <motion.tr key={record._id || idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{record.date ? new Date(record.date).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.type?.toLowerCase() === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{record.type?.toLowerCase() === "income" ? "Income" : "Expense"}</span></td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">{record.title}</td>
                        <td className="px-4 py-3 text-sm"><span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">{record.category || "—"}</span></td>
                        <td className="px-4 py-3 text-sm text-gray-700">{record.vendor || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{record.paymentMethod || "—"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{record.location?.name || "—"}</td>
                        <td className={`px-4 py-3 text-sm text-right font-bold ${record.type?.toLowerCase() === "income" ? "text-green-700" : "text-red-700"}`}>{record.type?.toLowerCase() === "income" ? "+" : "-"}{formatCurrency(record.amount || 0, businessSettings.currency)}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleEdit(record)} className="p-1.5 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg" title="Edit"><FaEdit size={13} /></button>
                            <button onClick={() => handleDelete(record._id)} disabled={deleting === record._id} className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg disabled:opacity-50" title="Delete">{deleting === record._id ? <FaSpinner className="animate-spin" size={13} /> : <FaTrash size={13} />}</button>
                          </div>
                        </td>
                      </motion.tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            {(() => {
              const totalPages = Math.ceil(filtered.length / itemsPerPage);
              const safePage = Math.min(currentPage, totalPages);
              if (totalPages <= 1) return null;
              const startIdx = (safePage - 1) * itemsPerPage + 1;
              const endIdx = Math.min(safePage * itemsPerPage, filtered.length);
              const maxVisiblePages = 5;
              let startPage = Math.max(1, safePage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              if (endPage - startPage + 1 < maxVisiblePages) startPage = Math.max(1, endPage - maxVisiblePages + 1);
              const pages = [];
              for (let i = startPage; i <= endPage; i++) pages.push(i);
              return (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>Showing {startIdx}–{endIdx} of {filtered.length}</span>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded-lg px-2 py-1 text-sm bg-white">
                      {[10, 15, 25, 50].map(n => <option key={n} value={n}>{n} per page</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(1)} disabled={safePage === 1} className="px-2.5 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">«</button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="px-2.5 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
                    {pages.map(page => (
                      <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${page === safePage ? "bg-orange-600 text-white border border-orange-600" : "border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"}`}>{page}</button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="px-2.5 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages} className="px-2.5 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">»</button>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}

Transactions.layoutType = "default";
Transactions.layoutProps = { title: "Expenses" };
