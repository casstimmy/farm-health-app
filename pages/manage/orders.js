"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";
import { formatCurrency } from "@/utils/formatting";
import { BusinessContext } from "@/context/BusinessContext";
import { useContext } from "react";

const emptyItem = { type: "Custom", description: "", quantity: 1, unitPrice: 0 };
const initialForm = {
  customer: "",
  location: "",
  orderDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  status: "Pending",
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
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const actionBtnClass = "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors";

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

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

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
    
    // Handle customer - can be ID or object
    let customerValue = "";
    if (typeof order.customer === "object" && order.customer?._id) {
      customerValue = order.customer._id;
    } else if (typeof order.customer === "string") {
      customerValue = order.customer;
    }
    
    // Handle location - can be ID or object
    let locationValue = "";
    if (typeof order.location === "object" && order.location?._id) {
      locationValue = order.location._id;
    } else if (typeof order.location === "string") {
      locationValue = order.location;
    }
    
    // Handle dates - with fallback
    let orderDate = "";
    let dueDate = "";
    
    if (order.orderDate) {
      const d = new Date(order.orderDate);
      if (!isNaN(d.getTime())) {
        orderDate = d.toISOString().split("T")[0];
      }
    }
    
    if (order.dueDate) {
      const d = new Date(order.dueDate);
      if (!isNaN(d.getTime())) {
        dueDate = d.toISOString().split("T")[0];
      }
    }
    
    // Handle items - with flexible structure
    let items = [{ ...emptyItem }];
    if (Array.isArray(order.items) && order.items.length > 0) {
      items = order.items.map((item) => ({
        type: item.type || (item.product ? "Product" : item.inventoryItem ? "Product" : item.animal ? "Animal" : "Custom"),
        description: item.description || item.name || "",
        quantity: Number(item.quantity || 1),
        unitPrice: Number(item.unitPrice ?? item.price ?? item.costPrice ?? 0),
      }));
    }
    
    // Set form with all available fields
    setForm({
      customer: customerValue,
      location: locationValue,
      orderDate: orderDate || new Date().toISOString().split("T")[0],
      dueDate,
      status: order.status || "Pending",
      paymentStatus: order.paymentStatus || "Unpaid",
      amountPaid: Number(order.amountPaid || 0),
      notes: order.notes || "",
      items,
    });
    
    // Scroll to form
    setTimeout(() => {
      document.querySelector("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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

  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Track customer orders and payment status" gradient="from-indigo-600 to-indigo-700" icon="🧾" />

      {(loading || roleLoading) && (
        <div className="bg-white rounded-xl border border-gray-200 p-10">
          <Loader message="Loading orders..." color="green-600" />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !roleLoading && (
      <>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
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
                <label className="block text-xs font-semibold text-gray-600 mb-1">Order Status</label>
                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["Pending", "Confirmed", "Processing", "Completed", "Cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Status</label>
                <select className="input-field" value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
                {["Unpaid", "Partially Paid", "Paid", "Refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Paid</label>
                <input type="number" min="0" step="0.01" className="input-field" placeholder="Amount paid" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <input className="input-field" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>

            <div className="h-px bg-gray-300 my-4" />

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-700">Order Items</h4>
              {(form.items || []).map((item, idx) => (
                <div key={`${idx}-${item.description}`} className="grid grid-cols-1 md:grid-cols-12 gap-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                    <select
                      className="input-field"
                      value={item.type || "Custom"}
                      onChange={(e) => {
                        const type = e.target.value;
                        const next = [...form.items];
                        next[idx] = { ...next[idx], type, description: "", unitPrice: 0 };
                        setForm({ ...form, items: next });
                      }}
                    >
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
                      <select
                        className="input-field"
                        value={item.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateItem(idx, "description", val);
                          if (item.type === "Service") {
                            const selected = services.find((s) => s.name === val);
                            if (selected) updateItem(idx, "unitPrice", Number(selected.price || 0));
                          }
                          if (item.type === "Product") {
                            const selected = inventoryItems.find((p) => p.item === val);
                            if (selected) updateItem(idx, "unitPrice", Number(selected.salesPrice || selected.price || 0));
                          }
                          if (item.type === "Animal") {
                            const selected = animals.find((a) => `${a.tagId} - ${a.name || a.breed || "Animal"}` === val);
                            if (selected) updateItem(idx, "unitPrice", Number(selected.projectedSalesPrice || selected.purchaseCost || 0));
                          }
                        }}
                      >
                        <option value="">Select item</option>
                        {item.type === "Service" && services.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
                        {item.type === "Product" && inventoryItems.map((p) => <option key={p._id} value={p.item}>{p.item}</option>)}
                        {item.type === "Animal" && animals.map((a) => (
                          <option key={a._id} value={`${a.tagId} - ${a.name || a.breed || "Animal"}`}>
                            {a.tagId} - {a.name || a.breed || "Animal"}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Qty</label>
                    <input type="number" min="0" step="0.01" className="input-field" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Price</label>
                    <input type="number" min="0" step="0.01" className="input-field" placeholder="Unit price" value={item.unitPrice} onChange={(e) => updateItem(idx, "unitPrice", e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="px-2 py-2 border border-red-300 text-red-700 rounded-lg md:col-span-2 hover:bg-red-50 font-semibold text-xs">Remove</button>
                </div>
              ))}
              <button type="button" onClick={addItem} className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50">+ Add Item</button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-300">
              <p className="font-semibold text-gray-700">Order Total: {formatCurrency(orderTotal, businessSettings.currency)}</p>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold">
                  {editingId ? "Update" : "Create"} Order
                </button>
                {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>}
              </div>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 sticky top-20 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Order Preview</h3>
            
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-600 font-semibold">CUSTOMER</p>
                <p className="text-sm font-bold text-gray-800">{customers.find(c => c._id === form.customer)?.name || "Not selected"}</p>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-600 font-semibold">LOCATION</p>
                <p className="text-sm font-bold text-gray-800">{locations.find(l => l._id === form.location)?.name || "Not selected"}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-gray-600 font-semibold">ORDER DATE</p>
                  <p className="text-sm font-bold text-gray-800">{form.orderDate || "--"}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <p className="text-xs text-gray-600 font-semibold">DUE DATE</p>
                  <p className="text-sm font-bold text-gray-800">{form.dueDate || "--"}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-600 font-semibold mb-2">STATUS</p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">{form.status}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    form.paymentStatus === "Paid" ? "bg-green-100 text-green-800" :
                    form.paymentStatus === "Partially Paid" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>{form.paymentStatus}</span>
                </div>
              </div>

              <div className="h-px bg-blue-200" />

              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-xs text-gray-600 font-semibold mb-2">ITEMS ({form.items?.length || 0})</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {(form.items || []).filter(i => i.description).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-gray-700 truncate flex-1">{item.description}</span>
                      <span className="text-gray-500">×{item.quantity}</span>
                      <span className="text-gray-800 font-semibold text-right ml-2 min-w-fit">{formatCurrency(Number(item.quantity || 0) * Number(item.unitPrice || 0), businessSettings.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3 border-2 border-indigo-300">
                <p className="text-xs text-gray-600 font-semibold mb-1">TOTAL ORDER VALUE</p>
                <p className="text-2xl font-bold text-indigo-700">{formatCurrency(orderTotal, businessSettings.currency)}</p>
                <p className="text-xs text-gray-600 mt-2">Amount Paid: <span className="font-semibold">{formatCurrency(Number(form.amountPaid || 0), businessSettings.currency)}</span></p>
                <p className="text-xs text-gray-600">Balance: <span className="font-semibold text-orange-600">{formatCurrency(orderTotal - Number(form.amountPaid || 0), businessSettings.currency)}</span></p>
              </div>

              {form.notes && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs text-gray-600 font-semibold mb-1">NOTES</p>
                  <p className="text-xs text-gray-700">{form.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                    <button onClick={() => handleEdit(order)} className={`${actionBtnClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>Edit</button>
                    <button onClick={() => handleDelete(order._id)} className={`${actionBtnClass} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>Delete</button>
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
      </>
      )}
    </div>
  );
}

OrdersPage.layoutType = "default";
OrdersPage.layoutProps = { title: "Orders" };
