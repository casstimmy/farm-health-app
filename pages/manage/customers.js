"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";

const initialForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  location: "",
  isActive: true,
  notes: "",
};

function displayName(c) {
  if (!c) return "";
  if (c.firstName || c.lastName) return `${c.firstName || ""} ${c.lastName || ""}`.trim();
  if (c.displayName) return c.displayName;
  if (c.name) return c.name;
  return "";
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const mountedRef = useRef(true);
  const fetchRef = useRef(0);

  const actionBtnClass = "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors";

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (roleLoading || !router.isReady) return;
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (!user) return;
    if (!["SuperAdmin", "Manager"].includes(user.role)) { router.push("/"); return; }
    fetchData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLoading, user, router.isReady]);

  const fetchData = async (existingToken = "") => {
    const fetchId = ++fetchRef.current;
    setLoading(true);
    setError("");
    try {
      const token = existingToken || localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const [customersRes, locationsRes] = await Promise.all([
        fetch("/api/customers", { headers }),
        fetch("/api/locations", { headers }),
      ]);
      if (fetchId !== fetchRef.current || !mountedRef.current) return;
      const customersData = customersRes.ok ? await customersRes.json() : [];
      const locationsData = locationsRes.ok ? await locationsRes.json() : [];
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
    } catch (err) {
      if (fetchId === fetchRef.current && mountedRef.current) {
        setError("Failed to load customers.");
      }
    } finally {
      if (fetchId === fetchRef.current && mountedRef.current) {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName.trim() && !form.lastName.trim()) {
      setError("Customer first or last name is required.");
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
      firstName: customer.firstName || "",
      lastName: customer.lastName || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || (customer.addresses?.[0]?.street || ""),
      location: customer.location?._id || customer.location || "",
      isActive: customer.isActive !== false,
      notes: customer.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = displayName(c).toLowerCase();
    return name.includes(term) || (c.email || "").toLowerCase().includes(term) || (c.phone || "").includes(term);
  });

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

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 text-lg font-bold">&times;</button>
        </div>
      )}

      {!loading && !roleLoading && (
        <>
          {/* Customer Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 px-5 py-3">
              <h3 className="text-white font-bold text-sm">
                {editingId ? "\u270F\uFE0F Edit Customer" : "\u2795 Add New Customer"}
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <input className="input-field" placeholder="First Name *" value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input className="input-field" placeholder="Last Name *" value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <input className="input-field" placeholder="Phone" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="input-field" placeholder="Email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <input className="input-field" placeholder="Address" value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <select className="input-field" value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}>
                <option value="">No location</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>{loc.name}</option>
                ))}
              </select>
              <input className="input-field md:col-span-2" placeholder="Notes" value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
                Active
              </label>
              <div className="md:col-span-3 flex gap-2 justify-end pt-2 border-t border-gray-100">
                {editingId && (
                  <button type="button" onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50">
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold">
                  {submitting ? "Saving..." : editingId ? "Update Customer" : "Add Customer"}
                </button>
              </div>
            </div>
          </form>

          {/* Search */}
          <div className="flex items-center gap-3">
            <input type="text" placeholder="Search customers by name, email, or phone..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400" />
            <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Customer Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-white">Location</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustomers.map((customer, idx) => (
                    <tr key={customer._id} className={(idx % 2 === 0 ? "bg-white" : "bg-gray-50") + " hover:bg-cyan-50 transition-colors"}>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{displayName(customer)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{customer.phone || "\u2014"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{customer.email || "\u2014"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{customer.location?.name || "\u2014"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${customer.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {customer.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleEdit(customer)}
                            className={`${actionBtnClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>Edit</button>
                          <button onClick={() => handleDelete(customer._id)}
                            className={`${actionBtnClass} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td className="px-4 py-12 text-center text-gray-500" colSpan={6}>
                        <div className="text-4xl mb-2">{"\uD83D\uDC65"}</div>
                        <p className="font-medium">No customers found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

CustomersPage.layoutType = "default";
CustomersPage.layoutProps = { title: "Customers" };
