"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaDatabase, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaFileExcel, FaCloudUploadAlt, FaTimes, FaClipboard, FaInfoCircle } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import { useRole } from "@/hooks/useRole";
import { invalidateCachePattern } from "@/utils/cache";

const SEED_CATEGORIES = [
  { key: "locations", label: "Locations", icon: "📍", desc: "Farm locations and zones" },
  { key: "inventoryCategories", label: "Inventory Categories", icon: "📦", desc: "Category types" },
  { key: "inventoryItems", label: "Inventory Items", icon: "🧴", desc: "Feed, medicine, equipment" },
  { key: "feedTypes", label: "Feed Types", icon: "🌾", desc: "Feed type definitions" },
  { key: "animals", label: "Animals", icon: "🐾", desc: "Sample animal profiles" },
  { key: "treatments", label: "Treatments", icon: "💊", desc: "Treatment records" },
  { key: "healthRecords", label: "Health Records", icon: "🏥", desc: "Health records" },
  { key: "feedingRecords", label: "Feeding Records", icon: "🍽️", desc: "Feeding history" },
  { key: "weightRecords", label: "Weight Records", icon: "⚖️", desc: "Weight tracking" },
  { key: "vaccinationRecords", label: "Vaccinations", icon: "💉", desc: "Vaccination records" },
  { key: "breedingRecords", label: "Breeding", icon: "❤️", desc: "Breeding history" },
  { key: "mortalityRecords", label: "Mortality", icon: "💀", desc: "Mortality records" },
  { key: "financialTransactions", label: "Finances", icon: "💰", desc: "Income & expenses" },
  { key: "services", label: "Services", icon: "🔧", desc: "Farm services" },
];

const PASTE_DATA_TYPES = [
  { value: "animals", label: "Animals" },
  { value: "inventory", label: "Inventory" },
  { value: "finance", label: "Finance" },
  { value: "locations", label: "Locations" },
  { value: "inventory categories", label: "Inventory Categories" },
  { value: "feed types", label: "Feed Types" },
];

export default function SeedDatabase() {
  const router = useRouter();
  const { user, isLoading: roleLoading, isAdmin } = useRole();
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

  // Paste import
  const [pasteData, setPasteData] = useState("");
  const [pasteDataType, setPasteDataType] = useState("animals");
  const [pasting, setPasting] = useState(false);
  const [pasteProgress, setPasteProgress] = useState(0);
  const [pasteResult, setPasteResult] = useState(null);

  // Active tab
  const [activeTab, setActiveTab] = useState("seed");

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
        <FaSpinner className="animate-spin text-purple-600 text-3xl" />
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

  // ──── Seed Handler ────
  const handleSeed = async () => {
    if (!confirm("⚠️ This will insert sample data into your database. Existing records with the same unique IDs will be skipped. Continue?")) return;

    setSeeding(true);
    setResult(null);
    setError("");
    setSeedProgress(0);
    setSeedStep("Connecting to database...");

    const steps = [
      "Connecting to database...", "Creating locations...", "Setting up categories...",
      "Adding inventory items...", "Creating feed types...", "Registering animals...",
      "Adding health records...", "Recording treatments...", "Inserting feeding data...",
      "Adding weight records...", "Creating vaccinations...", "Setting up breeding...",
      "Recording mortality...", "Adding financial records...", "Creating services...", "Finalizing..."
    ];
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setSeedStep(steps[stepIdx]);
        setSeedProgress(Math.min(90, (stepIdx / steps.length) * 100));
      }
    }, 1200);

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
      setResult(data.results || data);
      invalidateCachePattern("api/");
    } catch (err) {
      clearInterval(progressInterval);
      setError("Failed to seed database. Please try again.");
      setSeedProgress(0);
    } finally {
      setSeeding(false);
    }
  };

  // ──── Excel Handlers ────
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
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
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) { setExcelFile(file); setImportResult(null); }
  };

  const handleImportExcel = async () => {
    if (!excelFile) return;
    setImporting(true);
    setImportProgress(0);
    setImportResult(null);
    setError("");

    try {
      // Read file as base64
      const arrayBuffer = await excelFile.arrayBuffer();
      const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ""));
      
      setImportProgress(30);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/import-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fileData: base64 }),
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
    } catch (err) {
      setError("Import failed: " + err.message);
      setImportProgress(0);
    } finally {
      setImporting(false);
    }
  };

  // ──── Paste Handler ────
  const handlePasteImport = async () => {
    if (!pasteData.trim()) return;
    setPasting(true);
    setPasteProgress(0);
    setPasteResult(null);
    setError("");

    try {
      setPasteProgress(20);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/import-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pasteData, dataType: pasteDataType }),
      });
      setPasteProgress(80);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Paste import failed");
        setPasteProgress(0);
        return;
      }

      setPasteProgress(100);
      setPasteResult(data);
      invalidateCachePattern("api/");
    } catch (err) {
      setError("Paste import failed: " + err.message);
      setPasteProgress(0);
    } finally {
      setPasting(false);
    }
  };

  const resultItems = result
    ? SEED_CATEGORIES.map((cat) => ({ label: cat.label, icon: cat.icon, count: result[cat.key] || 0 }))
    : [];

  const tabs = [
    { id: "seed", label: "🌱 Seed Data", desc: "Insert sample data" },
    { id: "excel", label: "📄 Excel / CSV", desc: "Drag & drop files" },
    { id: "paste", label: "📋 Copy & Paste", desc: "Paste from spreadsheet" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title="Data Management"
        subtitle="Seed sample data, import from Excel, or paste from spreadsheet"
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

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id 
                ? "bg-white shadow-md text-purple-700" 
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            }`}>
            <div>{tab.label}</div>
            <div className="text-xs font-normal mt-0.5 opacity-70">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* ──── Tab: Seed Sample Data ──── */}
      <AnimatePresence mode="wait">
        {activeTab === "seed" && (
          <motion.div key="seed" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaDatabase /> Seed Sample Data</h3>
              <p className="text-purple-200 text-sm mt-1">Insert realistic test data for all categories — existing records are skipped</p>
            </div>
            <div className="p-6">
              {/* Available data grid */}
              <p className="text-sm font-semibold text-gray-700 mb-3">All available seed data ({SEED_CATEGORIES.length} categories):</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
                {SEED_CATEGORIES.map((cat) => (
                  <div key={cat.key} className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg text-sm hover:bg-purple-100 transition-colors">
                    <span className="text-lg">{cat.icon}</span>
                    <div className="min-w-0">
                      <span className="text-gray-700 font-medium text-xs block truncate">{cat.label}</span>
                      <p className="text-xs text-gray-400 truncate">{cat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
                <p className="text-yellow-800 text-xs">
                  <FaExclamationTriangle className="inline mr-1" />
                  Existing records with the same unique IDs will be <strong>skipped</strong>, not overwritten. This is safe to run multiple times.
                </p>
              </div>

              {/* Progress */}
              <AnimatePresence>
                {seeding && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-6">
                    <ProgressBox step={seedStep} progress={seedProgress} color="purple" />
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={handleSeed} disabled={seeding || !isOnline}
                className={`w-full px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  seeding || !isOnline ? "bg-gray-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg active:scale-[0.98]"
                }`}>
                {seeding ? <><FaSpinner className="animate-spin" /> Seeding...</> : <><FaDatabase /> Seed All Data</>}
              </button>
            </div>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-green-200 bg-green-50 p-6">
                  <h4 className="text-green-800 font-semibold text-sm mb-3 flex items-center gap-2"><FaCheckCircle /> Seeding Complete!</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {resultItems.map((item) => (
                      <div key={item.label} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-green-100 text-sm">
                        <span className="text-gray-700 flex items-center gap-1.5"><span className="text-sm">{item.icon}</span><span className="text-xs">{item.label}</span></span>
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
                        {result.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ──── Tab: Excel / CSV Import ──── */}
        {activeTab === "excel" && (
          <motion.div key="excel" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaFileExcel /> Import from Excel / CSV</h3>
              <p className="text-green-200 text-sm mt-1">Drag & drop Excel or CSV files to bulk-import data</p>
            </div>
            <div className="p-6">
              {/* Drop zone */}
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

              {/* Format info */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-blue-800 text-xs font-semibold mb-1 flex items-center gap-1"><FaInfoCircle /> Expected Format:</p>
                <p className="text-blue-700 text-xs">
                  Each sheet name must match a data type: <strong>Animals</strong>, <strong>Inventory</strong>, <strong>Finance</strong>, <strong>Locations</strong>, <strong>Inventory Categories</strong>, <strong>Feed Types</strong>. First row = column headers matching the model fields.
                </p>
              </div>

              {/* Progress */}
              <AnimatePresence>
                {importing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                    <ProgressBox step="Importing data..." progress={importProgress} color="green" />
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={handleImportExcel} disabled={!excelFile || importing || !isOnline}
                className={`w-full mt-4 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  !excelFile || importing || !isOnline ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:shadow-lg active:scale-[0.98]"
                }`}>
                {importing ? <><FaSpinner className="animate-spin" /> Importing...</> : <><FaCloudUploadAlt /> Import Data</>}
              </button>

              <ImportResultBox result={importResult} />
            </div>
          </motion.div>
        )}

        {/* ──── Tab: Copy & Paste ──── */}
        {activeTab === "paste" && (
          <motion.div key="paste" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaClipboard /> Copy & Paste Import</h3>
              <p className="text-orange-100 text-sm mt-1">Paste data directly from Excel, Google Sheets, or any spreadsheet</p>
            </div>
            <div className="p-6">
              {/* Data type selector */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 block mb-1">Data Type</label>
                <select value={pasteDataType} onChange={e => setPasteDataType(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-orange-400 focus:ring-orange-400 outline-none">
                  {PASTE_DATA_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                </select>
              </div>

              {/* Paste area */}
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 block mb-1">Paste Data</label>
                <textarea
                  value={pasteData}
                  onChange={e => setPasteData(e.target.value)}
                  onPaste={e => {
                    // Allow natural paste behavior
                    setTimeout(() => setPasteData(e.target.value), 0);
                  }}
                  placeholder={"Paste tab-separated or comma-separated data here...\n\nExample (first row = headers):\ntagId\tname\tspecies\tbreed\tgender\nG001\tBella\tGoat\tBoer\tFemale\nC001\tDaisy\tCattle\tHolstein\tFemale"}
                  rows={10}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:border-orange-400 focus:ring-orange-400 outline-none resize-y"
                />
                {pasteData && (
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">{pasteData.trim().split("\n").length} lines</p>
                    <button onClick={() => { setPasteData(""); setPasteResult(null); }} className="text-xs text-red-500 hover:text-red-700">Clear</button>
                  </div>
                )}
              </div>

              {/* Format info */}
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
                <p className="text-orange-800 text-xs font-semibold mb-1 flex items-center gap-1"><FaInfoCircle /> How to use:</p>
                <ul className="text-orange-700 text-xs space-y-0.5 list-disc list-inside">
                  <li>Copy cells from Excel or Google Sheets (tab-separated format)</li>
                  <li>Or use comma-separated (CSV) format</li>
                  <li>First row must be column headers matching model fields</li>
                  <li>Duplicate unique entries (e.g. tagId, name) will be skipped</li>
                </ul>
              </div>

              {/* Progress */}
              <AnimatePresence>
                {pasting && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4">
                    <ProgressBox step="Importing pasted data..." progress={pasteProgress} color="orange" />
                  </motion.div>
                )}
              </AnimatePresence>

              <button onClick={handlePasteImport} disabled={!pasteData.trim() || pasting || !isOnline}
                className={`w-full px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  !pasteData.trim() || pasting || !isOnline ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 hover:shadow-lg active:scale-[0.98]"
                }`}>
                {pasting ? <><FaSpinner className="animate-spin" /> Importing...</> : <><FaClipboard /> Import Pasted Data</>}
              </button>

              <ImportResultBox result={pasteResult} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Shared Components ───

function ProgressBox({ step, progress, color = "purple" }) {
  const colors = {
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", track: "bg-purple-200", bar: "from-purple-500 to-indigo-500", pct: "text-purple-600", spin: "text-purple-600" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-800", track: "bg-green-200", bar: "from-green-500 to-emerald-500", pct: "text-green-600", spin: "text-green-600" },
    orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", track: "bg-orange-200", bar: "from-orange-500 to-amber-500", pct: "text-orange-600", spin: "text-orange-600" },
  };
  const c = colors[color] || colors.purple;

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
      <div className="flex items-center gap-3 mb-3">
        <FaSpinner className={`animate-spin ${c.spin}`} />
        <span className={`text-sm font-semibold ${c.text}`}>{step}</span>
      </div>
      <div className={`w-full ${c.track} rounded-full h-3 overflow-hidden`}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }}
          className={`h-full bg-gradient-to-r ${c.bar} rounded-full`} />
      </div>
      <p className={`text-xs ${c.pct} mt-2 text-right font-bold`}>{Math.round(progress)}%</p>
    </div>
  );
}

function ImportResultBox({ result }) {
  if (!result) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
      <h4 className="text-green-800 font-semibold text-sm flex items-center gap-2 mb-2"><FaCheckCircle /> Import Complete!</h4>
      <div className="flex gap-4 text-sm mb-2">
        <span className="text-green-700"><strong>{result.imported || 0}</strong> imported</span>
        {result.skipped > 0 && <span className="text-yellow-700"><strong>{result.skipped}</strong> skipped (duplicates)</span>}
      </div>
      {result.sheets && Object.keys(result.sheets).length > 0 && (
        <div className="space-y-1">
          {Object.entries(result.sheets).map(([sheet, info]) => (
            <div key={sheet} className="flex justify-between bg-white rounded-lg px-3 py-1.5 border border-green-100 text-xs">
              <span className="text-gray-700 font-medium">{sheet}</span>
              <span className="text-green-700">{info.imported} imported, {info.skipped} skipped</span>
            </div>
          ))}
        </div>
      )}
      {result.errors?.length > 0 && (
        <div className="mt-2 text-xs text-yellow-700 bg-yellow-50 rounded-lg p-2 border border-yellow-200">
          {result.errors.slice(0, 5).map((e, i) => <p key={i}>• {e}</p>)}
          {result.errors.length > 5 && <p className="text-gray-500">...and {result.errors.length - 5} more</p>}
        </div>
      )}
    </motion.div>
  );
}

SeedDatabase.layoutType = "default";
SeedDatabase.layoutProps = { title: "Data Management" };
