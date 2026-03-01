"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaChevronDown, FaChevronUp, FaEnvelope, FaSpinner, FaTimes, FaTruck, FaCheckCircle, FaBoxOpen } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";
import { formatCurrency } from "@/utils/formatting";
import { BusinessContext } from "@/context/BusinessContext";
import { useContext } from "react";

const STATUS_FLOW = {
  Pending: { next: "Confirmed", label: "Confirm", color: "bg-blue-600 hover:bg-blue-700", icon: "checkCircle" },
  Confirmed: { next: "Processing", label: "Process", color: "bg-amber-600 hover:bg-amber-700", icon: "boxOpen" },
  Processing: { next: "Completed", label: "Complete", color: "bg-green-600 hover:bg-green-700", icon: "truck" },
  Completed: null,
  Cancelled: null,
};

const STATUS_BADGE = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  Processing: "bg-amber-100 text-amber-800 border-amber-300",
  Completed: "bg-green-100 text-green-800 border-green-300",
  Cancelled: "bg-red-100 text-red-800 border-red-300",
};

const PAYMENT_BADGE = {
  Unpaid: "bg-red-100 text-red-700",
  "Partially Paid": "bg-yellow-100 text-yellow-700",
  Paid: "bg-green-100 text-green-700",
  Refunded: "bg-gray-100 text-gray-700",
};

const STATUS_ICON = { checkCircle: FaCheckCircle, boxOpen: FaBoxOpen, truck: FaTruck };

const emptyItem = { type: "Custom", description: "", quantity: 1, unitPrice: 0 };
const initialForm = {
  customer: "",
  location: "",
  orderDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  paymentStatus: "Unpaid",
  amountPaid: 0,
  notes: "",
  items: [{ ...emptyItem }],
};

export default function OrdersPage() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user, isLoading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [emailModal, setEmailModal] = useState(null);
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (roleLoading) return;
    if (!user || !["SuperAdmin", "Manager"].includes(user.role)) {
      router.push("/");
      return;
    }
    fetchData();
  }, [roleLoading, user]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, customersRes, locationsRes, servicesRes, inventoryRes, animalsRes] = await Promise.all([
        fetch("/api/orders", { headers }),
        fetch("/api/customers", { headers }),
        fetch("/api/locations", { headers }),
        fetch("/api/services", { headers }),
        fetch("/api/inventory", { headers }),
        fetch("/api/animals?compact=true", { headers }),
      ]);
      setOrders(ordersRes.ok ? await ordersRes.json() : []);
      setCustomers(customersRes.ok ? await customersRes.json() : []);
      setLocations(locationsRes.ok ? await locationsRes.json() : []);
      setServices(servicesRes.ok ? await servicesRes.json() : []);
      setInventoryItems(inventoryRes.ok ? await inventoryRes.json() : []);
      setAnimals(animalsRes.ok ? await animalsRes.json() : []);
    } catch (err) {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const orderTotal = useMemo(() => {
    return (form.items || []).reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unitPrice ?? item.price ?? 0);
      return sum + qty * price;
    }, 0);
  }, [form.items]);

  const resetForm = () => { setForm(initialForm); setShowForm(false); };

  const updateItem = (index, field, value) => {
    const next = [...form.items];
    next[index] = { ...next[index], [field]: value };
    setForm({ ...form, items: next });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (index) => {
    const next = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: next.length ? next : [{ ...emptyItem }] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.items.some((x) => x.description?.trim())) { setError("Add at least one order item."); return; }
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...form, status: "Pending", total: orderTotal,
        amountPaid: Number(form.amountPaid || 0),
        orderDate: form.orderDate ? new Date(form.orderDate).toISOString() : new Date().toISOString(),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        recordedBy: user?.name || "System",
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed to create order"); }
      resetForm();
      setSuccess("Order created successfully!");
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    const labels = { Confirmed: "confirm", Processing: "start processing", Completed: "mark as completed", Cancelled: "cancel" };
    if (!window.confirm(`Are you sure you want to ${labels[newStatus] || "update"} this order?`)) return;
    setUpdatingStatus(orderId);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const payload = { status: newStatus, updatedAt: new Date().toISOString() };
      if (newStatus === "Completed") {
        payload.inventoryDeducted = true;
        payload.completedAt = new Date().toISOString();
        payload.completedBy = user?.name || "System";
      }
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed to update status"); }

      if (newStatus === "Completed") {
        const order = orders.find((o) => o._id === orderId);
        if (order?.items?.length) {
          for (const item of order.items) {
            const invItem = inventoryItems.find((inv) => inv.item === (item.description || item.name));
            if (invItem) {
              await fetch(`/api/inventory/${invItem._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ quantity: Math.max(0, (invItem.quantity || 0) - Number(item.quantity || 0)) }),
              });
            }
          }
        }
      }
      setSuccess(`Order ${newStatus.toLowerCase()} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
      fetchData();
    } catch (err) { setError(err.message); } finally { setUpdatingStatus(null); }
  };

  const handleSendEmail = async () => {
    if (!emailModal) return;
    setSendingEmail(true);
    try {
      const customer = customers.find((c) => c._id === (emailModal.customer?._id || emailModal.customer));
      const email = customer?.email || emailModal.customerEmail || "";
      if (!email) { setError("No email address found for this customer."); setSendingEmail(false); return; }
      const itemsList = (emailModal.items || []).map((it) =>
        `- ${it.description || it.name || "Item"} x${it.quantity} = ${formatCurrency(Number(it.quantity || 0) * Number(it.unitPrice || it.price || 0), businessSettings.currency)}`
      ).join("\n");
      const subject = `Order ${emailModal.orderNumber} - ${emailModal.status}`;
      const body = `Dear ${customer?.name || emailModal.customerName || "Customer"},\n\nYour order ${emailModal.orderNumber} status: ${emailModal.status}\n\nOrder Details:\n${itemsList}\n\nTotal: ${formatCurrency(emailModal.total || 0, businessSettings.currency)}\n\n${emailMessage || ""}\n\nThank you,\n${businessSettings.businessName || "Farm Manager"}`;
      window.open(`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
      setSuccess("Email client opened!");
      setTimeout(() => setSuccess(""), 3000);
      setEmailModal(null);
      setEmailMessage("");
    } catch (err) { setError(err.message); } finally { setSendingEmail(false); }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch = !term || (order.orderNumber || "").toLowerCase().includes(term) || (order.customer?.name || order.customerName || "").toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "Pending").length,
    processing: orders.filter((o) => ["Confirmed", "Processing"].includes(o.status)).length,
    completed: orders.filter((o) => o.status === "Completed").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Order Management" subtitle="Create orders and manage fulfillment pipeline" gradient="from-indigo-600 to-indigo-700" icon="🧾" />

      {(loading || roleLoading) && <div className="bg-white rounded-xl border border-gray-200 p-10"><Loader message="Loading orders..." color="blue-600" /></div>}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700"><FaTimes size={14} /></button>
        </motion.div>
      )}

      {success && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
          <FaCheckCircle /> {success}
        </motion.div>
      )}

      {!loading && !roleLoading && (
        <>
          <StatsSummary stats={[
            { label: "Total Orders", value: stats.total, bgColor: "bg-gray-50", borderColor: "border-gray-200", textColor: "text-gray-900", icon: "📦" },
            { label: "Pending", value: stats.pending, bgColor: "bg-yellow-50", borderColor: "border-yellow-200", textColor: "text-yellow-700", icon: "⏳" },
            { label: "In Progress", value: stats.processing, bgColor: "bg-blue-50", borderColor: "border-blue-200", textColor: "text-blue-700", icon: "🔄" },
            { label: "Completed", value: stats.completed, bgColor: "bg-green-50", borderColor: "border-green-200", textColor: "text-green-700", icon: "✅" },
          ]} />

          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <input type="text" placeholder="Search by order # or customer..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400">
              <option value="all">All Status</option>
              {["Pending", "Confirmed", "Processing", "Completed", "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setShowForm(!showForm)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors ${showForm ? "bg-gray-200 text-gray-700" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
              {showForm ? <><FaTimes size={12} /> Cancel</> : <><FaPlus size={12} /> New Order</>}
            </button>
          </div>

          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3">
                    <h3 className="text-white font-bold flex items-center gap-2"><FaPlus size={14} /> Create New Order</h3>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Customer</label>
                        <select className="input-field" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}>
                          <option value="">Select customer</option>
                          {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Location</label>
                        <select className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
                          <option value="">Select location</option>
                          {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Order Date</label>
                        <input type="date" className="input-field" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Due Date</label>
                        <input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Status</label>
                        <select className="input-field" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                          {["Unpaid", "Partially Paid", "Paid", "Refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Paid</label>
                        <input type="number" min="0" step="0.01" className="input-field" placeholder="0" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                      <input className="input-field" placeholder="Order notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-bold text-gray-700">Order Items</h4>
                      {(form.items || []).map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                            <select className="input-field" value={item.type || "Custom"} onChange={(e) => {
                              const type = e.target.value;
                              const next = [...form.items];
                              next[idx] = { ...next[idx], type, description: "", unitPrice: 0 };
                              setForm({ ...form, items: next });
                            }}>
                              <option value="Animal">Animal</option>
                              <option value="Service">Service</option>
                              <option value="Product">Product</option>
                              <option value="Custom">Custom</option>
                            </select>
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Item</label>
                            {item.type === "Custom" ? (
                              <input className="input-field" placeholder="Item description" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
                            ) : (
                              <select className="input-field" value={item.description} onChange={(e) => {
                                const val = e.target.value;
                                updateItem(idx, "description", val);
                                if (item.type === "Service") { const s = services.find((x) => x.name === val); if (s) updateItem(idx, "unitPrice", Number(s.price || 0)); }
                                if (item.type === "Product") { const s = inventoryItems.find((x) => x.item === val); if (s) updateItem(idx, "unitPrice", Number(s.salesPrice || s.price || 0)); }
                                if (item.type === "Animal") { const s = animals.find((x) => `${x.tagId} - ${x.name || x.breed || "Animal"}` === val); if (s) updateItem(idx, "unitPrice", Number(s.projectedSalesPrice || s.purchaseCost || 0)); }
                              }}>
                                <option value="">Select item</option>
                                {item.type === "Service" && services.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
                                {item.type === "Product" && inventoryItems.map((p) => <option key={p._id} value={p.item}>{p.item}</option>)}
                                {item.type === "Animal" && animals.map((a) => <option key={a._id} value={`${a.tagId} - ${a.name || a.breed || "Animal"}`}>{a.tagId} - {a.name || a.breed || "Animal"}</option>)}
                              </select>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Qty</label>
                            <input type="number" min="0" step="0.01" className="input-field" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Price</label>
                            <input type="number" min="0" step="0.01" className="input-field" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} />
                          </div>
                          <div className="md:col-span-2 flex items-end">
                            <button type="button" onClick={() => removeItem(idx)} className="w-full px-2 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-semibold text-xs">Remove</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addItem} className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50">+ Add Item</button>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <p className="font-bold text-gray-700 text-lg">Total: {formatCurrency(orderTotal, businessSettings.currency)}</p>
                      <div className="flex gap-2">
                        <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm flex items-center gap-2">
                          {submitting ? <><FaSpinner className="animate-spin" /> Creating...</> : "Create Order"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-indigo-600 to-indigo-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Order #</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white">Payment</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-white">Total</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order, idx) => {
                    const isExpanded = expandedOrder === order._id;
                    const statusInfo = STATUS_FLOW[order.status];
                    const customerName = order.customer?.name || order.customerName || "Walk-in";
                    const orderDate = order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "—";
                    const total = Number(order.total || 0);
                    const paid = Number(order.amountPaid || 0);
                    const IconComp = statusInfo ? STATUS_ICON[statusInfo.icon] : null;
                    return (
                      <tr key={order._id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-indigo-50 transition-colors`}>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-700 cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order._id)}>{order.orderNumber}</td>
                        <td className="px-4 py-3 text-sm">{customerName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{orderDate}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[order.status] || "bg-gray-100 text-gray-700"}`}>{order.status}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${PAYMENT_BADGE[order.paymentStatus] || "bg-gray-100 text-gray-700"}`}>{order.paymentStatus}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(total, businessSettings.currency)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {statusInfo && (
                              <button onClick={() => handleStatusChange(order._id, statusInfo.next)} disabled={updatingStatus === order._id}
                                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg text-white flex items-center gap-1 transition-colors ${statusInfo.color} ${updatingStatus === order._id ? "opacity-50" : ""}`}>
                                {updatingStatus === order._id ? <FaSpinner className="animate-spin" size={10} /> : IconComp ? <IconComp size={10} /> : null}
                                <span className="hidden sm:inline">{statusInfo.label}</span>
                              </button>
                            )}
                            <button onClick={() => setEmailModal(order)} className="px-2 py-1.5 text-xs rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" title="Email">
                              <FaEnvelope size={12} />
                            </button>
                            {order.status !== "Cancelled" && order.status !== "Completed" && (
                              <button onClick={() => handleStatusChange(order._id, "Cancelled")} disabled={updatingStatus === order._id}
                                className="px-2 py-1.5 text-xs rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100" title="Cancel">
                                <FaTimes size={12} />
                              </button>
                            )}
                            <button onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                              className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100">
                              {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.map((order) => {
                    if (expandedOrder !== order._id) return null;
                    const customerName = order.customer?.name || order.customerName || "Walk-in";
                    const customerEmail = order.customer?.email || order.customerEmail || "";
                    const total = Number(order.total || 0);
                    const paid = Number(order.amountPaid || 0);
                    return (
                      <tr key={`detail-${order._id}`} className="bg-gradient-to-r from-indigo-50 to-blue-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-indigo-800">Order {order.orderNumber} — Details</h4>
                            <button onClick={() => setExpandedOrder(null)} className="text-gray-500 hover:text-gray-700"><FaChevronUp size={14} /></button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div className="bg-white rounded-lg p-3 border border-indigo-100">
                              <p className="text-xs text-gray-500 font-semibold">Customer</p>
                              <p className="text-sm font-bold">{customerName}</p>
                              {customerEmail && <p className="text-xs text-gray-500">{customerEmail}</p>}
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-indigo-100">
                              <p className="text-xs text-gray-500 font-semibold">Status</p>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border mt-1 ${STATUS_BADGE[order.status] || ""}`}>{order.status}</span>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-indigo-100">
                              <p className="text-xs text-gray-500 font-semibold">Total</p>
                              <p className="text-sm font-bold">{formatCurrency(total, businessSettings.currency)}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-indigo-100">
                              <p className="text-xs text-gray-500 font-semibold">Balance</p>
                              <p className={`text-sm font-bold ${(total - paid) > 0 ? "text-orange-600" : "text-green-600"}`}>{formatCurrency(total - paid, businessSettings.currency)}</p>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg border border-indigo-100 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-bold text-gray-600">Item</th>
                                  <th className="px-3 py-2 text-right text-xs font-bold text-gray-600">Qty</th>
                                  <th className="px-3 py-2 text-right text-xs font-bold text-gray-600">Price</th>
                                  <th className="px-3 py-2 text-right text-xs font-bold text-gray-600">Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {(order.items || []).map((item, i) => (
                                  <tr key={i}>
                                    <td className="px-3 py-2 text-sm">{item.description || item.name || "—"}</td>
                                    <td className="px-3 py-2 text-sm text-right">{item.quantity}</td>
                                    <td className="px-3 py-2 text-sm text-right">{formatCurrency(Number(item.unitPrice || item.price || 0), businessSettings.currency)}</td>
                                    <td className="px-3 py-2 text-sm text-right font-semibold">{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || item.price || 0), businessSettings.currency)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {order.notes && <p className="text-xs text-gray-500 mt-3 italic">Notes: {order.notes}</p>}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <tr><td className="px-4 py-12 text-center text-gray-500" colSpan={7}>
                      <div className="text-4xl mb-2">📦</div>
                      <p className="font-medium">No orders found</p>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <AnimatePresence>
            {emailModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setEmailModal(null)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <h3 className="text-white font-bold flex items-center gap-2"><FaEnvelope /> Send Email</h3>
                    <button onClick={() => setEmailModal(null)} className="text-white/80 hover:text-white"><FaTimes /></button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-sm">
                      <p><strong>Order:</strong> {emailModal.orderNumber}</p>
                      <p><strong>Customer:</strong> {emailModal.customer?.name || emailModal.customerName || "Walk-in"}</p>
                      <p><strong>Status:</strong> {emailModal.status}</p>
                      <p><strong>Total:</strong> {formatCurrency(emailModal.total || 0, businessSettings.currency)}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Additional Message</label>
                      <textarea value={emailMessage} onChange={(e) => setEmailMessage(e.target.value)} rows={3}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400" placeholder="Add a message..." />
                    </div>
                    <button onClick={handleSendEmail} disabled={sendingEmail}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                      {sendingEmail ? <FaSpinner className="animate-spin" /> : <FaEnvelope />} Open Email Client
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

OrdersPage.layoutType = "default";
OrdersPage.layoutProps = { title: "Orders" };
