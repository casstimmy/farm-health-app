"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaDatabase, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaFileExcel, FaCloudUploadAlt, FaTimes } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";
import { invalidateCachePattern } from "@/utils/cache";
import { useAnimalData } from "@/context/AnimalDataContext";

const SEED_CATEGORIES = [
  { key: "locations", label: "Locations", icon: "📍", desc: "Farm locations and zones" },
  { key: "inventoryCategories", label: "Inventory Categories", icon: "📦", desc: "Category types" },
  { key: "inventoryItems", label: "Inventory Items", icon: "🧴", desc: "Feed, medicine, equipment" },
  { key: "feedTypes", label: "Feed Types", icon: "🌾", desc: "Feed type definitions" },
  { key: "animals", label: "Animals", icon: "🐐", desc: "Sample animal profiles" },
  { key: "treatments", label: "Treatments", icon: "💊", desc: "Treatment records" },
  { key: "feedingRecords", label: "Feeding Records", icon: "🍽️", desc: "Feeding history" },
  { key: "weightRecords", label: "Weight Records", icon: "⚖️", desc: "Weight tracking" },
  { key: "vaccinationRecords", label: "Vaccinations", icon: "💉", desc: "Vaccination records" },
  { key: "breedingRecords", label: "Breeding", icon: "❤️", desc: "Breeding history" },
  { key: "mortalityRecords", label: "Mortality", icon: "💀", desc: "Mortality records" },
  { key: "financialTransactions", label: "Finances", icon: "💰", desc: "Income & expenses" },
];

export default function SeedDatabase() {
  const router = useRouter();
  const { user, isLoading: roleLoading, isAdmin } = useRole();
  const { forceRefresh: forceRefreshAnimals } = useAnimalData();
  const [seeding, setSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedStep, setSeedStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  // Excel import
  const [dragActive, setDragActive] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (roleLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader message="Loading..." />
      </div>
    );
  }

  if (!user || !isAdmin()) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only SuperAdmin can manage data.</p>
        </div>
      </div>
    );
  }

  const handleSeed = async () => {
    if (!confirm("⚠️ This will insert sample data into your database. Existing records with the same unique IDs will be skipped. Continue?")) {
      return;
    }

    setSeeding(true);
    setResult(null);
    setError("");
    setSeedProgress(0);
    setSeedStep("Connecting to database...");

    const steps = ["Connecting to database...", "Creating locations...", "Adding inventory...", "Creating animals...", "Adding records...", "Finalizing..."];
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setSeedStep(steps[stepIdx]);
        setSeedProgress(Math.min(90, (stepIdx / steps.length) * 100));
      }
    }, 1500);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      clearInterval(progressInterval);

      if (!res.ok) {
        setError(data.error || "Seeding failed");
        setSeedProgress(0);
        return;
      }

      setSeedProgress(100);
      setSeedStep("Complete!");
      setResult(data.results);
      invalidateCachePattern("api/");
      forceRefreshAnimals();
    } catch (err) {
      clearInterval(progressInterval);
      setError("Failed to seed database. Please try again.");
      setSeedProgress(0);
    } finally {
      setSeeding(false);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv"))) {
      setExcelFile(file);
      setImportResult(null);
    } else {
      setError("Please upload an Excel (.xlsx, .xls) or CSV file");
      setTimeout(() => setError(""), 3000);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      setImportResult(null);
    }
  };

  const handleImportExcel = async () => {
    if (!excelFile) return;
    setImporting(true);
    setImportProgress(0);
    setImportResult(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", excelFile);
      setImportProgress(20);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/import-excel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      setImportProgress(80);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
        setImportProgress(0);
        return;
      }

      setImportProgress(100);
      setImportResult(data);
      invalidateCachePattern("api/");
      forceRefreshAnimals();
    } catch (err) {
      setError("Import failed: " + err.message);
      setImportProgress(0);
    } finally {
      setImporting(false);
    }
  };

  const resultItems = result
    ? SEED_CATEGORIES.map((cat) => ({ label: cat.label, icon: cat.icon, count: result[cat.key] || 0 }))
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <PageHeader
        title="Data Management"
        subtitle="Seed sample data or import from Excel"
        gradient="from-purple-600 to-indigo-600"
        icon="🌱"
      />

      {!isOnline && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg border-l-4 bg-orange-50 border-orange-500 text-orange-700 font-semibold flex items-center gap-2">
          <span>📡</span><span>You are currently offline. Data operations are disabled.</span>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between">
          <span><FaExclamationTriangle className="inline mr-2" />{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700"><FaTimes /></button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seed Sample Data Card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaDatabase /> Seed Sample Data</h3>
            <p className="text-purple-200 text-sm mt-1">Insert realistic test data for demonstration</p>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Available seed data:</p>
              <div className="grid grid-cols-2 gap-2">
                {SEED_CATEGORIES.map((cat) => (
                  <div key={cat.key} className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg text-sm">
                    <span>{cat.icon}</span>
                    <div>
                      <span className="text-gray-700 font-medium">{cat.label}</span>
                      <p className="text-xs text-gray-500">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
              <p className="text-yellow-800 text-xs">
                <FaExclamationTriangle className="inline mr-1" />
                Existing records with the same unique IDs will be <strong>skipped</strong>, not overwritten.
              </p>
            </div>

            <AnimatePresence>
              {seeding && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FaSpinner className="animate-spin text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">{seedStep}</span>
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-3 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${seedProgress}%` }} transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" />
                    </div>
                    <p className="text-xs text-purple-600 mt-2 text-right font-medium">{Math.round(seedProgress)}%</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={handleSeed} disabled={seeding || !isOnline}
              className={`w-full px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                seeding || !isOnline ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg active:scale-[0.98]"
              }`}>
              {seeding ? <><FaSpinner className="animate-spin" /> Seeding...</> : !isOnline ? <><span>📡</span> Offline</> : <><FaDatabase /> Seed Database Now</>}
            </button>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-green-200 bg-green-50 p-6">
                <h4 className="text-green-800 font-semibold text-sm mb-3 flex items-center gap-2"><FaCheckCircle /> Seeding Complete!</h4>
                <div className="grid grid-cols-2 gap-2">
                  {resultItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-100 text-sm">
                      <span className="text-gray-700 flex items-center gap-1.5"><span className="text-xs">{item.icon}</span>{item.label}</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-xs ${item.count > 0 ? "text-green-700 bg-green-100" : "text-gray-400 bg-gray-100"}`}>
                        {item.count > 0 ? `+${item.count}` : "0"}
                      </span>
                    </div>
                  ))}
                </div>
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 font-semibold text-xs mb-1">Warnings:</p>
                    <ul className="list-disc list-inside text-yellow-700 text-xs space-y-0.5">
                      {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Excel Import Card */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaFileExcel /> Import from Excel</h3>
            <p className="text-green-200 text-sm mt-1">Drag & drop Excel or CSV files to import data</p>
          </div>
          <div className="p-6">
            <div
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive ? "border-green-500 bg-green-50 scale-[1.02]" : excelFile ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50"
              }`}>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
              {excelFile ? (
                <div className="space-y-2">
                  <FaFileExcel className="text-green-500 text-4xl mx-auto" />
                  <p className="text-sm font-semibold text-gray-900">{excelFile.name}</p>
                  <p className="text-xs text-gray-500">{(excelFile.size / 1024).toFixed(1)} KB</p>
                  <button onClick={(e) => { e.stopPropagation(); setExcelFile(null); setImportResult(null); }}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto"><FaTimes size={10} /> Remove</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <FaCloudUploadAlt className={`text-4xl mx-auto ${dragActive ? "text-green-500" : "text-gray-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Drag & drop your Excel or CSV file here</p>
                    <p className="text-xs text-gray-500 mt-1">or click to browse • .xlsx, .xls, .csv supported</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-blue-800 text-xs font-semibold mb-1">Expected Format:</p>
              <p className="text-blue-700 text-xs">
                Each sheet should represent a data type (Animals, Inventory, etc). First row = column headers. Matching headers will be auto-mapped.
              </p>
            </div>

            <AnimatePresence>
              {importing && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FaSpinner className="animate-spin text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Importing data...</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-3 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${importProgress}%` }} transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                    </div>
                    <p className="text-xs text-green-600 mt-2 text-right font-medium">{Math.round(importProgress)}%</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={handleImportExcel} disabled={!excelFile || importing || !isOnline}
              className={`w-full mt-4 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                !excelFile || importing || !isOnline ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-[0.98]"
              }`}>
              {importing ? <><FaSpinner className="animate-spin" /> Importing...</> : <><FaCloudUploadAlt /> Import Data</>}
            </button>

            <AnimatePresence>
              {importResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                  <h4 className="text-green-800 font-semibold text-sm flex items-center gap-2 mb-2"><FaCheckCircle /> Import Complete!</h4>
                  <p className="text-sm text-green-700">{importResult.imported || 0} records imported. {importResult.skipped ? `${importResult.skipped} skipped.` : ""}</p>
                  {importResult.errors?.length > 0 && (
                    <div className="mt-2 text-xs text-yellow-700">{importResult.errors.slice(0, 5).map((e, i) => <p key={i}>• {e}</p>)}</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

SeedDatabase.layoutType = "default";
SeedDatabase.layoutProps = { title: "Data Management" };
