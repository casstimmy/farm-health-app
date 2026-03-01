"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";
import { formatCurrency } from "@/utils/formatting";
import { BusinessContext } from "@/context/BusinessContext";
import { useContext } from "react";

const initialForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  location: "",
  isActive: true,
  notes: "",
};

export default function CustomersPage() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const { user, isLoading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [invoiceCustomer, setInvoiceCustomer] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([{ type: "Service", name: "", qty: 1, price: 0 }]);
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [savingInvoice, setSavingInvoice] = useState(false);
  const actionBtnClass = "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors";

  useEffect(() => {
    if (roleLoading || !router.isReady) return;
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!user) return;
    if (!["SuperAdmin", "Manager"].includes(user.role)) {
      router.push("/");
      return;
    }
    fetchData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLoading, user, router.isReady]);

  useEffect(() => {
    const onFocus = () => {
      const token = localStorage.getItem("token");
      if (token && user && ["SuperAdmin", "Manager"].includes(user.role)) fetchData(token);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user]);

  const fetchData = async (existingToken = "") => {
    setLoading(true);
    setError("");
    try {
      const token = existingToken || localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [customersRes, locationsRes, servicesRes, inventoryRes, animalsRes] = await Promise.all([
        fetch("/api/customers", { headers }),
        fetch("/api/locations", { headers }),
        fetch("/api/services", { headers }),
        fetch("/api/inventory", { headers }),
        fetch("/api/animals?compact=true", { headers }),
      ]);
      const customersData = customersRes.ok ? await customersRes.json() : [];
      const locationsData = locationsRes.ok ? await locationsRes.json() : [];
      const servicesData = servicesRes.ok ? await servicesRes.json() : [];
      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : [];
      const animalsData = animalsRes.ok ? await animalsRes.json() : [];
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setServices(Array.isArray(servicesData) ? servicesData : []);
      setInventoryItems(Array.isArray(inventoryData) ? inventoryData : []);
      setAnimals(Array.isArray(animalsData) ? animalsData : []);
    } catch (err) {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Customer name is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save customer");
      }
      resetForm();
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingId(customer._id);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      location: customer.location?._id || customer.location || "",
      isActive: customer.isActive !== false,
      notes: customer.notes || "",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete customer");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateInvoiceItem = (index, field, value) => {
    const next = [...invoiceItems];
    next[index] = { ...next[index], [field]: value };
    setInvoiceItems(next);
  };

  const addInvoiceItem = () => {
    setInvoiceItems((prev) => [...prev, { type: "Service", name: "", qty: 1, price: 0 }]);
  };

  const removeInvoiceItem = (index) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const invoiceTotal = invoiceItems.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0);

  const handleGenerateInvoice = async () => {
    if (!invoiceCustomer) return;
    setSavingInvoice(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        title: `Invoice - ${invoiceCustomer.name}`,
        description: `Customer invoice for ${invoiceCustomer.name}`,
        amount: invoiceTotal,
        category: "Customer Invoice",
        type: "Income",
        paymentMethod: "Cash",
        vendor: invoiceCustomer.name,
        date: new Date().toISOString(),
        notes: invoiceNotes,
      };
      await fetch("/api/finance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const lineRows = invoiceItems
        .map((item, i) => `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;">${item.type}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;">${item.name || "-"}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.qty}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(item.price || 0, businessSettings.currency)}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatCurrency((item.qty || 0) * (item.price || 0), businessSettings.currency)}</td>
        </tr>`)
        .join("");
      const invoiceNo = `INV-${Date.now()}`;
      const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
      const businessAddr = businessSettings.businessAddress || "";
      const businessPhone = businessSettings.businessPhone || "";
      const businessEmail = businessSettings.businessEmail || "";
      const html = `<!DOCTYPE html>
<html><head><title>Invoice ${invoiceNo}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; }
  .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 40px 48px; position: relative; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 3px solid #0f766e; }
  .brand h1 { font-size: 26px; color: #0f766e; margin-bottom: 4px; }
  .brand p { font-size: 11px; color: #6b7280; line-height: 1.5; }
  .invoice-meta { text-align: right; }
  .invoice-meta .inv-label { font-size: 28px; font-weight: 800; color: #0f766e; letter-spacing: 2px; }
  .invoice-meta p { font-size: 11px; color: #6b7280; margin-top: 4px; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 32px; }
  .party { flex: 1; }
  .party h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 8px; font-weight: 700; }
  .party p { font-size: 13px; color: #374151; line-height: 1.6; }
  .party .name { font-weight: 700; font-size: 15px; color: #111827; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #0f766e; color: #fff; padding: 10px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
  thead th:first-child { border-radius: 8px 0 0 0; }
  thead th:last-child { border-radius: 0 8px 0 0; }
  .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
  .totals-box { width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #374151; }
  .totals-row.grand { border-top: 2px solid #0f766e; padding-top: 12px; margin-top: 4px; font-size: 18px; font-weight: 800; color: #0f766e; }
  .notes { background: #f9fafb; border-radius: 8px; padding: 16px 20px; margin-bottom: 32px; }
  .notes h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin-bottom: 6px; }
  .notes p { font-size: 12px; color: #4b5563; line-height: 1.5; }
  .footer { position: absolute; bottom: 40px; left: 48px; right: 48px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 32px 40px; } }
</style>
</head><body>
<div class="page">
  <div class="header">
    <div class="brand">
      <h1>${businessSettings.businessName || "Farm Manager"}</h1>
      ${businessAddr ? `<p>${businessAddr}</p>` : ""}
      ${businessPhone ? `<p>Tel: ${businessPhone}</p>` : ""}
      ${businessEmail ? `<p>${businessEmail}</p>` : ""}
    </div>
    <div class="invoice-meta">
      <div class="inv-label">INVOICE</div>
      <p><strong>${invoiceNo}</strong></p>
      <p>Date: ${todayStr}</p>
    </div>
  </div>
  <div class="parties">
    <div class="party">
      <h3>Bill To</h3>
      <p class="name">${invoiceCustomer.name}</p>
      ${invoiceCustomer.email ? `<p>${invoiceCustomer.email}</p>` : ""}
      ${invoiceCustomer.phone ? `<p>${invoiceCustomer.phone}</p>` : ""}
      ${invoiceCustomer.address ? `<p>${invoiceCustomer.address}</p>` : ""}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="text-align:left;width:40px;">#</th>
        <th style="text-align:left;">Type</th>
        <th style="text-align:left;">Description</th>
        <th style="text-align:center;width:60px;">Qty</th>
        <th style="text-align:right;width:120px;">Unit Price</th>
        <th style="text-align:right;width:120px;">Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>
  <div class="totals">
    <div class="totals-box">
      <div class="totals-row"><span>Subtotal</span><span>${formatCurrency(invoiceTotal, businessSettings.currency)}</span></div>
      <div class="totals-row grand"><span>Total Due</span><span>${formatCurrency(invoiceTotal, businessSettings.currency)}</span></div>
    </div>
  </div>
  ${invoiceNotes ? `<div class="notes"><h4>Notes</h4><p>${invoiceNotes}</p></div>` : ""}
  <div class="footer">
    <p>Thank you for your business! &bull; ${businessSettings.businessName || "Farm Manager"}</p>
  </div>
</div>
<script>window.onload = function() { window.print(); };</script>
</body></html>`;
      const w = window.open("", "_blank");
      if (w) {
        w.document.open();
        w.document.write(html);
        w.document.close();
      }
      setInvoiceCustomer(null);
      setInvoiceItems([{ type: "Service", name: "", qty: 1, price: 0 }]);
      setInvoiceNotes("");
    } catch (err) {
      setError(err.message || "Failed to generate invoice");
    } finally {
      setSavingInvoice(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage customer records for farm orders"
        gradient="from-cyan-600 to-cyan-700"
        icon="👥"
      />

      {(loading || roleLoading) && (
        <div className="bg-white rounded-xl border border-gray-200 p-10">
          <Loader message="Loading customers..." color="green-600" />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !roleLoading && (
      <>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="input-field" placeholder="Customer name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input-field" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className="input-field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input-field md:col-span-2" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <select className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}>
          <option value="">No location</option>
          {locations.map((loc) => (
            <option key={loc._id} value={loc._id}>{loc.name}</option>
          ))}
        </select>
        <input className="input-field md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Active
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg">
            {editingId ? "Update" : "Add"} Customer
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold">Name</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Location</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Status</th>
              <th className="px-4 py-3 text-center text-xs font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((customer) => (
              <tr key={customer._id}>
                <td className="px-4 py-3 text-sm font-semibold">{customer.name}</td>
                <td className="px-4 py-3 text-sm">{customer.phone || "—"}</td>
                <td className="px-4 py-3 text-sm">{customer.email || "—"}</td>
                <td className="px-4 py-3 text-sm">{customer.location?.name || "—"}</td>
                <td className="px-4 py-3 text-sm">{customer.isActive ? "Active" : "Inactive"}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(customer)} className={`${actionBtnClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>Edit</button>
                    <button onClick={() => handleDelete(customer._id)} className={`${actionBtnClass} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>Delete</button>
                    <button
                      onClick={() => setInvoiceCustomer(customer)}
                      className={`${actionBtnClass} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
                    >
                      Invoice
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={6}>No customers yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {invoiceCustomer && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-4xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Generate Invoice for {invoiceCustomer.name}</h3>
              <button onClick={() => setInvoiceCustomer(null)} className="px-3 py-1 border rounded">Close</button>
            </div>
            <div className="space-y-2">
              {invoiceItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                    <select
                      className="input-field"
                      value={item.type}
                      onChange={(e) => {
                        const type = e.target.value;
                        const next = [...invoiceItems];
                        next[idx] = { ...next[idx], type, name: "", qty: 1, price: 0 };
                        setInvoiceItems(next);
                      }}
                    >
                    <option value="Service">Service</option>
                    <option value="Product">Product</option>
                    <option value="Animal">Animal</option>
                    <option value="Custom">Custom</option>
                    </select>
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Item</label>
                    {item.type === "Custom" ? (
                      <input
                        className="input-field"
                        placeholder="Enter custom item"
                        value={item.name}
                        onChange={(e) => updateInvoiceItem(idx, "name", e.target.value)}
                      />
                    ) : (
                      <select
                        className="input-field"
                        value={item.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateInvoiceItem(idx, "name", value);
                          if (item.type === "Service") {
                            const selected = services.find((s) => s.name === value);
                            if (selected) updateInvoiceItem(idx, "price", Number(selected.price || 0));
                          }
                          if (item.type === "Product") {
                            const selected = inventoryItems.find((i) => i.item === value);
                            if (selected) updateInvoiceItem(idx, "price", Number(selected.salesPrice || selected.price || 0));
                          }
                          if (item.type === "Animal") {
                            const selected = animals.find((a) => `${a.tagId} - ${a.name || a.breed || "Animal"}` === value);
                            if (selected) updateInvoiceItem(idx, "price", Number(selected.projectedSalesPrice || selected.purchaseCost || 0));
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
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
                    <input type="number" min="1" className="input-field" value={item.qty} onChange={(e) => updateInvoiceItem(idx, "qty", Number(e.target.value || 1))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Unit Price</label>
                    <input type="number" min="0" step="0.01" className="input-field" value={item.price} onChange={(e) => updateInvoiceItem(idx, "price", Number(e.target.value || 0))} />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button type="button" onClick={() => removeInvoiceItem(idx)} className="w-full px-2 py-2 border border-red-300 text-red-700 rounded">X</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addInvoiceItem} className="px-3 py-2 border rounded">Add Line</button>
            </div>
            <textarea className="input-field" rows={2} placeholder="Invoice notes" value={invoiceNotes} onChange={(e) => setInvoiceNotes(e.target.value)} />
            <div className="flex items-center justify-between">
              <p className="font-bold">Total: {formatCurrency(invoiceTotal, businessSettings.currency)}</p>
              <button onClick={handleGenerateInvoice} disabled={savingInvoice || invoiceTotal <= 0} className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50">
                {savingInvoice ? "Generating..." : "Generate & Print Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

CustomersPage.layoutType = "default";
CustomersPage.layoutProps = { title: "Customers" };
