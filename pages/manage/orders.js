"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";
import { formatCurrency } from "@/utils/formatting";
import { BusinessContext } from "@/context/BusinessContext";
import { useContext } from "react";

const emptyItem = { description: "", quantity: 1, unitPrice: 0 };
const initialForm = {
  customer: "",
  location: "",
  orderDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  status: "Pending",
  paymentStatus: "Unpaid",
  amountPaid: 0,
  notes: "",
  items: [emptyItem],
};

export default function OrdersPage() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user, isLoading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (roleLoading) return;
    if (!user || !["SuperAdmin", "Manager"].includes(user.role)) {
      router.push("/");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLoading, user]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [ordersRes, customersRes, locationsRes] = await Promise.all([
        fetch("/api/orders", { headers }),
        fetch("/api/customers", { headers }),
        fetch("/api/locations", { headers }),
      ]);
      setOrders(ordersRes.ok ? await ordersRes.json() : []);
      setCustomers(customersRes.ok ? await customersRes.json() : []);
      setLocations(locationsRes.ok ? await locationsRes.json() : []);
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

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const updateItem = (index, field, value) => {
    const next = [...form.items];
    next[index] = { ...next[index], [field]: value };
    setForm({ ...form, items: next });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, emptyItem] });
  const removeItem = (index) => {
    const next = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: next.length ? next : [emptyItem] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.items.some((x) => x.description?.trim())) {
      setError("Add at least one order item.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `/api/orders/${editingId}` : "/api/orders";
      const method = editingId ? "PUT" : "POST";
      const payload = {
        ...form,
        total: orderTotal,
        amountPaid: Number(form.amountPaid || 0),
        orderDate: form.orderDate ? new Date(form.orderDate).toISOString() : new Date().toISOString(),
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        recordedBy: user?.name || "System",
      };
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save order");
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (order) => {
    setEditingId(order._id);
    setForm({
      customer: order.customer?._id || order.customer || "",
      location: order.location?._id || order.location || "",
      orderDate: order.orderDate ? new Date(order.orderDate).toISOString().split("T")[0] : "",
      dueDate: order.dueDate ? new Date(order.dueDate).toISOString().split("T")[0] : "",
      status: order.status || "Pending",
      paymentStatus: order.paymentStatus || "Unpaid",
      amountPaid: Number(order.amountPaid || 0),
      notes: order.notes || "",
      items: Array.isArray(order.items) && order.items.length ? order.items : [emptyItem],
    });
    if (Array.isArray(order.items) && order.items.length) {
      setForm((prev) => ({
        ...prev,
        items: order.items.map((item) => ({
          description: item.description || item.name || "",
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice ?? item.price ?? 0,
        })),
      }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete order");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading || roleLoading) return <Loader message="Loading orders..." color="green-600" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Track customer orders and payment status" gradient="from-indigo-600 to-indigo-700" icon="🧾" />

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="input-field" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}>
            <option value="">Select customer</option>
            {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
            <option value="">Select location</option>
            {locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <input type="date" className="input-field" value={form.orderDate} onChange={(e) => setForm({ ...form, orderDate: e.target.value })} />
          <input type="date" className="input-field" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {["Pending", "Confirmed", "Processing", "Completed", "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-field" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
            {["Unpaid", "Partially Paid", "Paid", "Refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="number" min="0" step="0.01" className="input-field" placeholder="Amount paid" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
          <input className="input-field md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        <div className="space-y-2">
          {(form.items || []).map((item, idx) => (
            <div key={`${idx}-${item.description}`} className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <input className="input-field md:col-span-6" placeholder="Item description" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} />
              <input type="number" min="0" step="0.01" className="input-field md:col-span-2" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
              <input type="number" min="0" step="0.01" className="input-field md:col-span-2" placeholder="Unit price" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} />
              <button type="button" onClick={() => removeItem(idx)} className="px-2 py-2 border border-red-300 text-red-700 rounded-lg md:col-span-2">Remove</button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="px-3 py-2 border border-gray-300 rounded-lg">Add Item</button>
        </div>

        <div className="flex items-center justify-between">
          <p className="font-semibold">Order Total: {formatCurrency(orderTotal, businessSettings.currency)}</p>
          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
              {editingId ? "Update" : "Create"} Order
            </button>
            {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>}
          </div>
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold">Order #</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Payment</th>
              <th className="px-4 py-3 text-right text-xs font-bold">Total</th>
              <th className="px-4 py-3 text-right text-xs font-bold">Balance</th>
              <th className="px-4 py-3 text-center text-xs font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="px-4 py-3 text-sm font-semibold">{order.orderNumber}</td>
                <td className="px-4 py-3 text-sm">{order.customer?.name || order.customerName || "Walk-in"}</td>
                <td className="px-4 py-3 text-sm">{order.status}</td>
                <td className="px-4 py-3 text-sm">{order.paymentStatus}</td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(order.total || 0, businessSettings.currency)}</td>
                <td className="px-4 py-3 text-sm text-right">{formatCurrency(order.balance ?? ((order.total || 0) - (order.amountPaid || 0)), businessSettings.currency)}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(order)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Edit</button>
                    <button onClick={() => handleDelete(order._id)} className="px-2 py-1 bg-red-100 text-red-700 rounded">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>No orders yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

OrdersPage.layoutType = "default";
OrdersPage.layoutProps = { title: "Orders" };
