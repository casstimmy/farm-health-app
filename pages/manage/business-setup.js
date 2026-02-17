"use client";

import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import axios from "axios";
import { FaSpinner, FaUpload, FaTrash, FaImage } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import { BusinessContext } from "@/context/BusinessContext";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";

const DEFAULT_HERO_IMAGE = "https://images.unsplash.com/photo-1577720643272-265a02b3d099?q=80&w=2070&auto=format&fit=crop";

export default function BusinessSetup() {
  const router = useRouter();
  const { refreshSettings } = useContext(BusinessContext);
  const { user, isLoading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    businessDescription: "",
    businessLogo: "",
    loginHeroImage: "",
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
          businessLogo: data.businessLogo || "",
          loginHeroImage: data.loginHeroImage || "",
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await axios.post("/api/upload", formDataUpload);
      const uploaded = res.data?.links || [];
      
      if (uploaded.length > 0) {
        const imageUrl = uploaded[0]?.full || uploaded[0];
        setFormData((prev) => ({ ...prev, loginHeroImage: imageUrl }));
        setSuccess("Image uploaded successfully!");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError("Failed to upload image - no URL returned");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error uploading image: " + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await axios.post("/api/upload", formDataUpload);
      const uploaded = res.data?.links || [];
      
      if (uploaded.length > 0) {
        const imageUrl = uploaded[0]?.full || uploaded[0];
        setFormData((prev) => ({ ...prev, businessLogo: imageUrl }));
        setSuccess("Logo uploaded successfully!");
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError("Failed to upload logo - no URL returned");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error uploading logo: " + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, businessLogo: "" }));
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, loginHeroImage: "" }));
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
        <Loader message="Loading business settings..." color="blue-600" fullPage />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Basic Information</h3>
            <p className="text-sm text-gray-500 mb-6">Core details about your farm business</p>

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

          {/* Section: Business Logo */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Logo</h3>
            <p className="text-sm text-gray-500 mb-6">
              Displayed in the navigation bar and throughout the application. Recommended: 200×200px or larger.
            </p>

            <div className="space-y-4">
              {/* Logo Preview */}
              <div className="relative w-full max-w-xs h-40 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                {formData.businessLogo ? (
                  <img
                    src={formData.businessLogo}
                    alt="Business logo preview"
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = '<div class="text-gray-300 text-sm">No preview</div>';
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-sm">No logo uploaded</div>
                )}
                {formData.businessLogo && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">Custom</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex flex-wrap gap-3">
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      Upload Logo
                    </>
                  )}
                </button>
                {formData.businessLogo && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <FaTrash />
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200"></div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Settings</h3>
            <p className="text-sm text-gray-500 mb-6">Regional and formatting preferences</p>

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

          {/* Divider */}
          <div className="border-t border-gray-200"></div>

          {/* Section: Login Hero Image */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Login Page Hero Image</h3>
            <p className="text-sm text-gray-500 mb-6">
              Displayed on the login and registration pages. A default farm image is used if none is set.
            </p>

            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
                <img
                  src={formData.loginHeroImage || DEFAULT_HERO_IMAGE}
                  alt="Login hero preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = DEFAULT_HERO_IMAGE;
                  }}
                />
                {formData.loginHeroImage && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">Custom</span>
                  </div>
                )}
                {!formData.loginHeroImage && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">Default</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex flex-wrap gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <FaUpload />
                      Upload Image
                    </>
                  )}
                </button>
                {formData.loginHeroImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <FaTrash />
                    Remove
                  </button>
                )}
              </div>

              {/* URL Input (optional manual entry) */}
              <div>
                <label className="label">Or enter image URL directly</label>
                <input
                  type="url"
                  name="loginHeroImage"
                  placeholder="https://example.com/your-image.jpg"
                  value={formData.loginHeroImage}
                  onChange={handleChange}
                  className="input-field"
                />
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
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h4 className="font-medium text-gray-800 mb-1 text-sm">Note</h4>
        <p className="text-gray-600 text-sm">
          These settings are used throughout the system for display, currency formatting, and timezone calculations. Changes take effect immediately.
        </p>
      </div>
    </motion.div>
  );
}

BusinessSetup.layoutType = "default";
BusinessSetup.layoutProps = { title: "Business Setup" };
