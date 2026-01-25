"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import { BusinessContext } from "@/context/BusinessContext";
import { useRole } from "@/hooks/useRole";

export default function BusinessSetup() {
  const router = useRouter();
  const { refreshSettings } = useContext(BusinessContext);
  const { user, isLoading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    businessDescription: "",
    currency: "NGN",
    timezone: "UTC+1",
  });

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

    fetchSettings();
  }, [router, user, roleLoading]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/business-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data) {
        setFormData({
          businessName: data.businessName || "",
          businessEmail: data.businessEmail || "",
          businessPhone: data.businessPhone || "",
          businessAddress: data.businessAddress || "",
          businessDescription: data.businessDescription || "",
          currency: data.currency || "NGN",
          timezone: data.timezone || "UTC+1",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError("Failed to load business settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess("✓ Business settings updated successfully!");
        setTimeout(() => {
          setSuccess("");
          refreshSettings(); // Refresh context settings
        }, 1500);
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update settings");
      }
    } catch (error) {
      setError("Error updating business settings");
      console.error("Error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="animate-spin text-blue-600 mx-auto mb-3 w-12 h-12" />
          <p className="text-gray-600">Loading business settings...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        title="Business Setup"
        subtitle="Configure your farm business details"
        gradient="from-blue-600 to-blue-700"
        icon="🏢"
      />

      {/* Settings Form */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 md:p-12">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="error-message mb-6"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="success-message mb-6"
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section: Basic Information */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">📝</span>
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  required
                  placeholder="Your farm business name"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  name="businessEmail"
                  placeholder="business@farm.com"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  name="businessPhone"
                  placeholder="+234 XXX XXX XXXX"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Physical Address</label>
                <input
                  type="text"
                  name="businessAddress"
                  placeholder="Farm location address"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="label">Business Description</label>
              <textarea
                name="businessDescription"
                placeholder="Describe your farm business, what you specialize in, etc."
                value={formData.businessDescription}
                onChange={handleChange}
                rows="4"
                className="input-field"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Section: Settings */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">⚙️</span>
              Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="NGN">🇳🇬 Nigerian Naira (₦)</option>
                  <option value="USD">🇺🇸 US Dollar ($)</option>
                  <option value="EUR">🇪🇺 Euro (€)</option>
                  <option value="GBP">🇬🇧 British Pound (£)</option>
                </select>
              </div>

              <div>
                <label className="label">Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="UTC+1">UTC+1 (West Africa Time)</option>
                  <option value="UTC+2">UTC+2 (Central Africa Time)</option>
                  <option value="UTC">UTC (GMT)</option>
                  <option value="UTC-5">UTC-5 (Eastern Time)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary-lg"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
            <button
              type="button"
              onClick={() => fetchSettings()}
              className="btn-secondary-lg"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <h4 className="font-bold text-blue-900 mb-2">💡 Information</h4>
        <p className="text-blue-800 text-sm">
          These settings will be used throughout the system for business information display, currency formatting, and timezone calculations. Changes take effect immediately.
        </p>
      </div>
    </motion.div>
  );
}

BusinessSetup.layoutType = "default";
BusinessSetup.layoutProps = { title: "Business Setup" };
