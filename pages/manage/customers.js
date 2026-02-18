"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";

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
  const { user, isLoading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      const [customersRes, locationsRes] = await Promise.all([
        fetch("/api/customers", { headers }),
        fetch("/api/locations", { headers }),
      ]);
      const customersData = customersRes.ok ? await customersRes.json() : [];
      const locationsData = locationsRes.ok ? await locationsRes.json() : [];
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
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

  if (loading || roleLoading) return <Loader message="Loading customers..." color="green-600" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage customer records for farm orders"
        gradient="from-cyan-600 to-cyan-700"
        icon="👥"
      />

      {error && <div className="error-message">{error}</div>}

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
                    <button onClick={() => handleEdit(customer)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Edit</button>
                    <button onClick={() => handleDelete(customer._id)} className="px-2 py-1 bg-red-100 text-red-700 rounded">Delete</button>
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
    </div>
  );
}

CustomersPage.layoutType = "default";
CustomersPage.layoutProps = { title: "Customers" };
