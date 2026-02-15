"use client";

import { useEffect, useState, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaSpinner, FaPlus, FaHeart, FaWeight, FaPills, FaBoxOpen, FaChartLine, FaSkull, FaLeaf, FaDollarSign, FaExclamationTriangle } from "react-icons/fa";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import { BusinessContext } from "@/context/BusinessContext";
import Loader from "@/components/Loader";
import { getCachedData, invalidateCachePattern } from "@/utils/cache";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const fmt = (v = 0) => Number(v).toLocaleString("en-US");
const fmtMoney = (v = 0, c = "NGN") => {
  const s = c === "NGN" ? "₦" : c === "USD" ? "$" : c === "EUR" ? "€" : "£";
  return `${s}${Number(v).toLocaleString("en-US")}`;
};

export default function Home() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const currency = businessSettings?.currency || "NGN";
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ animals: [], inventory: [], treatments: [], finance: [], mortality: [], breeding: [], healthRecords: [], feeding: [] });
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) { router.push("/login"); return; }
    setUser(JSON.parse(userData));

    async function fetchData() {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };
        const fetchApi = (endpoint) => fetch(endpoint, { headers }).then(r => r.json());
        
        // Use cache with 5-minute TTL for dashboard data
        const [animals, inventory, treatments, finance, mortality, breeding, healthRecords, feeding] = await Promise.all([
          getCachedData("api/animals", () => fetchApi("/api/animals"), 5 * 60 * 1000),
          getCachedData("api/inventory", () => fetchApi("/api/inventory"), 5 * 60 * 1000),
          getCachedData("api/treatment", () => fetchApi("/api/treatment"), 5 * 60 * 1000),
          getCachedData("api/finance", () => fetchApi("/api/finance"), 5 * 60 * 1000),
          getCachedData("api/mortality", () => fetchApi("/api/mortality"), 5 * 60 * 1000),
          getCachedData("api/breeding", () => fetchApi("/api/breeding"), 5 * 60 * 1000),
          getCachedData("api/health-records", () => fetchApi("/api/health-records"), 5 * 60 * 1000),
          getCachedData("api/feeding", () => fetchApi("/api/feeding"), 5 * 60 * 1000),
        ]);
        
        setData({
          animals: Array.isArray(animals) ? animals : [],
          inventory: Array.isArray(inventory) ? inventory : [],
          treatments: Array.isArray(treatments) ? treatments : [],
          finance: Array.isArray(finance) ? finance : [],
          mortality: Array.isArray(mortality) ? mortality : [],
          breeding: Array.isArray(breeding) ? breeding : [],
          healthRecords: Array.isArray(healthRecords) ? healthRecords : [],
          feeding: Array.isArray(feeding) ? feeding : [],
        });
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const handleSeedDatabase = async () => {
    if (!confirm("Seed the database with sample data? This will add test records.")) return;
    setSeedLoading(true); setSeedResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/seed", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (!res.ok) { setSeedResult({ success: false, message: d.error || "Failed" }); }
      else {
        // Clear all cache after seeding
        invalidateCachePattern(/^api\//);
        setSeedResult({ success: true, message: "Database seeded! ✓", results: d.results }); 
        setTimeout(() => window.location.reload(), 2000); 
      }
    } catch (err) { setSeedResult({ success: false, message: err.message }); }
    finally { setSeedLoading(false); }
  };

  // ─── Computed Stats ───
  const stats = useMemo(() => {
    const { animals, inventory, treatments, finance, mortality, breeding, healthRecords, feeding } = data;
    const alive = animals.filter(a => a.status === "Alive");
    const totalAnimals = animals.length;
    const aliveCount = alive.length;
    const deadCount = animals.filter(a => a.status === "Dead").length;
    const maleCount = alive.filter(a => a.gender === "Male").length;
    const femaleCount = alive.filter(a => a.gender === "Female").length;

    // Breed distribution
    const breedMap = {};
    alive.forEach(a => { breedMap[a.breed || "Unknown"] = (breedMap[a.breed || "Unknown"] || 0) + 1; });

    // Financial
    const totalIncome = finance.filter(f => f.type === "Income").reduce((s, f) => s + (f.amount || 0), 0);
    const totalExpense = finance.filter(f => f.type === "Expense").reduce((s, f) => s + (f.amount || 0), 0);
    const netPL = totalIncome - totalExpense;

    // Animal value
    const totalPurchaseCost = animals.reduce((s, a) => s + (a.purchaseCost || 0), 0);
    const totalFeedCost = animals.reduce((s, a) => s + (a.totalFeedCost || 0), 0);
    const totalMedCost = animals.reduce((s, a) => s + (a.totalMedicationCost || 0), 0);
    const totalProjectedSales = alive.reduce((s, a) => s + (a.projectedSalesPrice || 0), 0);

    // Inventory
    const totalItems = inventory.length;
    const lowStock = inventory.filter(i => i.quantity < (i.minStock || 10));
    const inventoryValue = inventory.reduce((s, i) => s + ((i.quantity || 0) * (i.costPrice || i.price || 0)), 0);

    // Mortality
    const totalDeaths = mortality.length;
    const mortalityLoss = mortality.reduce((s, m) => s + (m.estimatedValue || 0), 0);

    // Breeding
    const totalBreeding = breeding.length;
    const delivered = breeding.filter(b => b.pregnancyStatus === "Delivered");
    const totalKids = delivered.reduce((s, b) => s + (b.kidsAlive || 0), 0);
    const confirmed = breeding.filter(b => b.pregnancyStatus === "Confirmed").length;

    // Treatments & health
    const activeTreatments = healthRecords.filter(h => h.recoveryStatus === "Under Treatment" || h.recoveryStatus === "Improving").length;
    const recovered = healthRecords.filter(h => h.recoveryStatus === "Recovered").length;

    // Recent records (last 7 days)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const recentTreatments = healthRecords.filter(h => new Date(h.date) >= weekAgo);
    const recentFeedings = feeding.filter(f => new Date(f.date) >= weekAgo);

    // Expense by category
    const expByCat = {};
    finance.filter(f => f.type === "Expense").forEach(f => {
      expByCat[f.category || "Other"] = (expByCat[f.category || "Other"] || 0) + (f.amount || 0);
    });

    return {
      totalAnimals, aliveCount, deadCount, maleCount, femaleCount, breedMap,
      totalIncome, totalExpense, netPL,
      totalPurchaseCost, totalFeedCost, totalMedCost, totalProjectedSales,
      totalItems, lowStock, inventoryValue,
      totalDeaths, mortalityLoss,
      totalBreeding, delivered: delivered.length, totalKids, confirmed,
      activeTreatments, recovered, recentTreatments, recentFeedings,
      expByCat,
    };
  }, [data]);

  // ─── Chart Data ───
  const breedChart = {
    labels: Object.keys(stats.breedMap),
    datasets: [{ data: Object.values(stats.breedMap), backgroundColor: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"] }],
  };

  const expenseChart = {
    labels: Object.keys(stats.expByCat).slice(0, 8),
    datasets: [{ label: "Amount (₦)", data: Object.values(stats.expByCat).slice(0, 8), backgroundColor: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"] }],
  };

  const genderChart = {
    labels: ["Male", "Female"],
    datasets: [{ data: [stats.maleCount, stats.femaleCount], backgroundColor: ["#3b82f6", "#ec4899"] }],
  };

  if (!user) return null;

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-8 -mx-6 -mt-10 md:-mx-12 md:-mt-12 mb-8 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{businessSettings?.businessName || "Farm Dashboard"}</h1>
            <p className="text-green-50 text-lg">Welcome back, <span className="font-bold text-white">{user.name}</span>! 👋</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            {user?.role === "SuperAdmin" && (
              <motion.button onClick={handleSeedDatabase} disabled={seedLoading || !isOnline} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="bg-white text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-green-50 shadow-lg disabled:opacity-50 flex items-center gap-2">
                {seedLoading ? <><FaSpinner className="animate-spin w-4 h-4" /><span className="text-sm">Seeding...</span></> : <><span>🌱</span><span className="text-sm hidden sm:inline">Seed DB</span></>}
              </motion.button>
            )}
          </div>
        </div>
      </header>

      {!isOnline && (
        <div className="mb-6 p-4 rounded-lg border-l-4 bg-orange-50 border-orange-500 text-orange-700 font-semibold flex items-center gap-2">
          📡 You are currently offline.
        </div>
      )}

      {seedResult && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg border-l-4 font-semibold ${seedResult.success ? "bg-green-50 border-green-500 text-green-700" : "bg-red-50 border-red-500 text-red-700"}`}>
          <div>{seedResult.message}</div>
          {seedResult.results && (
            <div className="mt-2 text-sm space-y-1">
              {Object.entries(seedResult.results).filter(([k]) => k !== "errors").map(([key, value]) => (
                <div key={key}>• {key.replace(/([A-Z])/g, " $1").trim()}: {typeof value === "number" ? value : JSON.stringify(value)}</div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {loading ? (
        <Loader message="Loading dashboard..." color="green-600" />
      ) : (
        <>
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <QA href="/manage/animals" icon={<FaPlus />} label="Animals" color="from-blue-500 to-blue-600" />
              <QA href="/manage/health-records" icon={<FaPills />} label="Health Records" color="from-teal-500 to-teal-600" />
              <QA href="/manage/breeding" icon={<FaHeart />} label="Breeding" color="from-pink-500 to-rose-600" />
              <QA href="/manage/weight" icon={<FaWeight />} label="Weight" color="from-purple-500 to-purple-600" />
              <QA href="/manage/inventory" icon={<FaBoxOpen />} label="Inventory" color="from-orange-500 to-orange-600" />
              <QA href="/manage/reports" icon={<FaChartLine />} label="Reports" color="from-green-500 to-green-600" />
            </div>
          </div>

          {/* KPI Row 1 - Herd Overview */}
          <h2 className="text-lg font-bold text-gray-900 mb-3">🐐 Herd Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <KPI label="Total Animals" value={fmt(stats.totalAnimals)} color="bg-blue-50 border-blue-200" icon="🐐" />
            <KPI label="Alive" value={fmt(stats.aliveCount)} color="bg-green-50 border-green-200" icon="✅" />
            <KPI label="Dead" value={fmt(stats.deadCount)} color="bg-red-50 border-red-200" icon="💀" />
            <KPI label="Males" value={fmt(stats.maleCount)} color="bg-indigo-50 border-indigo-200" icon="♂️" />
            <KPI label="Females" value={fmt(stats.femaleCount)} color="bg-pink-50 border-pink-200" icon="♀️" />
            <KPI label="Active Treatments" value={fmt(stats.activeTreatments)} color="bg-amber-50 border-amber-200" icon="💊" />
          </div>

          {/* KPI Row 2 - Financial Overview */}
          <h2 className="text-lg font-bold text-gray-900 mb-3">💰 Financial Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <KPI label="Total Income" value={fmtMoney(stats.totalIncome, currency)} color="bg-green-50 border-green-200" icon="📈" />
            <KPI label="Total Expenses" value={fmtMoney(stats.totalExpense, currency)} color="bg-red-50 border-red-200" icon="📉" />
            <KPI label="Net P/L" value={fmtMoney(stats.netPL, currency)} color={stats.netPL >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} icon={stats.netPL >= 0 ? "📊" : "⚠️"} />
            <KPI label="Projected Sales" value={fmtMoney(stats.totalProjectedSales, currency)} color="bg-blue-50 border-blue-200" icon="🎯" />
            <KPI label="Feed Costs" value={fmtMoney(stats.totalFeedCost, currency)} color="bg-orange-50 border-orange-200" icon="🌾" />
            <KPI label="Mortality Loss" value={fmtMoney(stats.mortalityLoss, currency)} color="bg-gray-50 border-gray-200" icon="💀" />
          </div>

          {/* KPI Row 3 - Operations */}
          <h2 className="text-lg font-bold text-gray-900 mb-3">📋 Operations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <KPI label="Inventory Items" value={fmt(stats.totalItems)} color="bg-indigo-50 border-indigo-200" icon="📦" />
            <KPI label="Low Stock" value={fmt(stats.lowStock.length)} color={stats.lowStock.length > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"} icon="⚠️" />
            <KPI label="Inventory Value" value={fmtMoney(stats.inventoryValue, currency)} color="bg-purple-50 border-purple-200" icon="🏷️" />
            <KPI label="Breeding Records" value={fmt(stats.totalBreeding)} color="bg-pink-50 border-pink-200" icon="💕" />
            <KPI label="Kids Born" value={fmt(stats.totalKids)} color="bg-green-50 border-green-200" icon="🐣" />
            <KPI label="Confirmed Pregnant" value={fmt(stats.confirmed)} color="bg-blue-50 border-blue-200" icon="🤰" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <ChartCard title="Breed Distribution">
              {Object.keys(stats.breedMap).length > 0 ? (
                <Doughnut data={breedChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12 } } } }} />
              ) : <NoData />}
            </ChartCard>
            <ChartCard title="Gender Split">
              {(stats.maleCount + stats.femaleCount) > 0 ? (
                <Pie data={genderChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12 } } } }} />
              ) : <NoData />}
            </ChartCard>
            <ChartCard title="Expenses by Category">
              {Object.keys(stats.expByCat).length > 0 ? (
                <Bar data={expenseChart} options={{ responsive: true, maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }} />
              ) : <NoData />}
            </ChartCard>
          </div>

          {/* Lists Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Health Records */}
            <ListCard title="Recent Health Records" icon="🏥" items={
              stats.recentTreatments.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 5).map(h => ({
                label: h.animalTagId || h.animal?.tagId || "Unknown",
                meta: `${h.symptoms || h.diagnosis || "Treatment"} • ${h.recoveryStatus || "—"}`,
                emoji: h.recoveryStatus === "Recovered" ? "✅" : h.recoveryStatus === "Improving" ? "📈" : "💊",
              }))
            } emptyText="No recent health records" link="/manage/health-records" />

            {/* Low Stock Alerts */}
            <ListCard title="Low Stock Alerts" icon="⚠️" items={
              stats.lowStock.slice(0, 5).map(i => ({
                label: i.item,
                meta: `${i.quantity} ${i.unit || "units"} remaining (min: ${i.minStock})`,
                emoji: "📦",
              }))
            } emptyText="All stock levels are healthy" link="/manage/inventory" />

            {/* Recent Breeding */}
            <ListCard title="Breeding Updates" icon="💕" items={
              data.breeding.slice(0, 5).map(b => ({
                label: `${b.doe?.tagId || "?"} × ${b.buck?.tagId || "?"}`,
                meta: `${b.pregnancyStatus} ${b.kidsAlive > 0 ? `• ${b.kidsAlive} kids` : ""}`,
                emoji: b.pregnancyStatus === "Delivered" ? "🐣" : b.pregnancyStatus === "Confirmed" ? "🤰" : "⏳",
              }))
            } emptyText="No breeding records" link="/manage/breeding" />
          </div>
        </>
      )}
    </>
  );
}

function KPI({ label, value, color, icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`${color} border-2 p-4 rounded-xl shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs font-semibold text-gray-600 truncate">{label}</span>
      </div>
      <div className="text-xl font-black text-gray-900 truncate">{value}</div>
    </motion.div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">{title}</h3></div>
      <div className="p-5 h-64">{children}</div>
    </div>
  );
}

function NoData() {
  return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>;
}

function ListCard({ title, icon, items, emptyText, link }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2"><span>{icon}</span>{title}</h3>
        {link && <Link href={link} className="text-xs text-green-600 font-semibold hover:underline">View All →</Link>}
      </div>
      <ul className="space-y-2">
        {items.length > 0 ? items.map((i, idx) => (
          <li key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 hover:bg-green-50 transition-all">
            <span className="text-lg flex-shrink-0">{i.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 text-sm truncate">{i.label}</div>
              <div className="text-xs text-gray-500 truncate">{i.meta}</div>
            </div>
          </li>
        )) : <li className="text-gray-400 text-sm text-center py-4">{emptyText}</li>}
      </ul>
    </div>
  );
}

function QA({ href, icon, label, color }) {
  return (
    <Link href={href}>
      <motion.div whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
        className={`bg-gradient-to-r ${color} text-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all cursor-pointer`}>
        <div className="flex flex-col items-center text-center gap-1">
          <span className="text-xl">{icon}</span>
          <span className="text-xs font-bold">{label}</span>
        </div>
      </motion.div>
    </Link>
  );
}

Home.layoutType = "default";
Home.layoutProps = { title: "Dashboard" };
