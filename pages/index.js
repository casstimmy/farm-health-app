"use client";

import { useEffect, useState, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaPlus, FaHeart, FaWeight, FaPills, FaBoxOpen, FaChartLine, FaSkull, FaLeaf, FaDollarSign, FaExclamationTriangle } from "react-icons/fa";
import dynamic from "next/dynamic";
import { BusinessContext } from "@/context/BusinessContext";
import Loader from "@/components/Loader";
import { getCachedData, invalidateCache } from "@/utils/cache";

// Lazy-load Chart.js components to reduce initial bundle size
const ChartLoader = () => <div className="h-48 flex items-center justify-center text-gray-400">Loading chart...</div>;
const Pie = dynamic(() => import("react-chartjs-2").then(mod => mod.Pie), { ssr: false, loading: ChartLoader });
const Bar = dynamic(() => import("react-chartjs-2").then(mod => mod.Bar), { ssr: false, loading: ChartLoader });
const Doughnut = dynamic(() => import("react-chartjs-2").then(mod => mod.Doughnut), { ssr: false, loading: ChartLoader });

// Register Chart.js components (lazy - only when charts render)
if (typeof window !== "undefined") {
  import("chart.js").then(({ Chart, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend }) => {
    Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);
  });
}

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#06b6d4", "#84cc16", "#e11d48"];
const SPECIES_EMOJI = { Goat: "🐐", Cattle: "🐄", Cow: "🐄", Sheep: "🐑", Pig: "🐖", Chicken: "🐔", Poultry: "🐔", Horse: "🐴", Rabbit: "🐇", Fish: "🐟", Turkey: "🦃", Duck: "🦆", Dog: "🐕", Cat: "🐈" };
const getSpeciesEmoji = (species) => SPECIES_EMOJI[species] || "🐾";

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
  const [dashboardReady, setDashboardReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [user, setUser] = useState(null);
  const [data, setData] = useState({ animals: [], inventory: [], treatments: [], finance: [], mortality: [], breeding: [], healthRecords: [], feeding: [] });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token || !userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));

    async function fetchData() {
      try {
        setLoading(true);
        setLoadError("");
        const headers = { Authorization: `Bearer ${token}` };
        const fetchApi = async (name, endpoint) => {
          try {
            const payload = await getCachedData(
              `api/home/${name}`,
              async () => {
                const response = await fetch(endpoint, { headers });
                if (!response.ok) {
                  throw new Error(`${name} failed (${response.status})`);
                }
                const data = await response.json();
                return Array.isArray(data) ? data : [];
              },
              60 * 1000
            );
            return { ok: true, data: payload };
          } catch (error) {
            return { ok: false, data: [] };
          }
        };
        
        // Fetch all data directly in parallel — simple and reliable
        const [animals, inventory, treatments, finance, mortality, breeding, healthRecords, feeding] = await Promise.all([
          fetchApi("animals", "/api/animals"),
          fetchApi("inventory", "/api/inventory"),
          fetchApi("treatment", "/api/treatment"),
          fetchApi("finance", "/api/finance"),
          fetchApi("mortality", "/api/mortality"),
          fetchApi("breeding", "/api/breeding"),
          fetchApi("health-records", "/api/health-records"),
          fetchApi("feeding", "/api/feeding"),
        ]);
        
        const successCount = [animals, inventory, treatments, finance, mortality, breeding, healthRecords, feeding].filter((item) => item.ok).length;
        const minimumMajorityReady = successCount >= 5 && animals.ok && inventory.ok;

        setData({
          animals: animals.data,
          inventory: inventory.data,
          treatments: treatments.data,
          finance: finance.data,
          mortality: mortality.data,
          breeding: breeding.data,
          healthRecords: healthRecords.data,
          feeding: feeding.data,
        });

        if (!minimumMajorityReady) {
          invalidateCache("api/home/animals");
          invalidateCache("api/home/inventory");
          invalidateCache("api/home/treatment");
          invalidateCache("api/home/finance");
          invalidateCache("api/home/mortality");
          invalidateCache("api/home/breeding");
          invalidateCache("api/home/health-records");
          invalidateCache("api/home/feeding");
          setDashboardReady(false);
          setLoadError("Dashboard is waiting on required data. Check connection and retry.");
          return;
        }

        setDashboardReady(true);
      } catch (err) {
        console.error("Dashboard load failed:", err);
        setDashboardReady(false);
        setLoadError("Dashboard failed to load. Please retry.");
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

  // ─── Computed Stats ───
  const stats = useMemo(() => {
    const { animals, inventory, treatments, finance, mortality, breeding, healthRecords, feeding } = data;
    const alive = animals.filter(a => a.status === "Alive");
    const totalAnimals = animals.length;
    const aliveCount = alive.length;
    const deadCount = animals.filter(a => a.status === "Dead").length;
    const soldCount = animals.filter(a => a.status === "Sold").length;
    const quarantinedCount = animals.filter(a => a.status === "Quarantined").length;
    const maleCount = alive.filter(a => a.gender === "Male").length;
    const femaleCount = alive.filter(a => a.gender === "Female").length;

    // Species breakdown (all animal types)
    const speciesMap = {};
    alive.forEach(a => { 
      const sp = a.species || "Unknown";
      speciesMap[sp] = (speciesMap[sp] || 0) + 1; 
    });

    // Breed distribution
    const breedMap = {};
    alive.forEach(a => { breedMap[a.breed || "Unknown"] = (breedMap[a.breed || "Unknown"] || 0) + 1; });

    // Species-breed breakdown for detail
    const speciesBreedMap = {};
    alive.forEach(a => {
      const sp = a.species || "Unknown";
      if (!speciesBreedMap[sp]) speciesBreedMap[sp] = { total: 0, male: 0, female: 0, breeds: {} };
      speciesBreedMap[sp].total++;
      if (a.gender === "Male") speciesBreedMap[sp].male++;
      if (a.gender === "Female") speciesBreedMap[sp].female++;
      const br = a.breed || "Unknown";
      speciesBreedMap[sp].breeds[br] = (speciesBreedMap[sp].breeds[br] || 0) + 1;
    });

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

    // Breeding — includes populated doe/buck with tagId and name
    const totalBreeding = breeding.length;
    const delivered = breeding.filter(b => b.pregnancyStatus === "Delivered");
    const totalKids = delivered.reduce((s, b) => s + (b.kidsAlive || 0), 0);
    const confirmed = breeding.filter(b => b.pregnancyStatus === "Confirmed").length;
    const pendingBreeding = breeding.filter(b => b.pregnancyStatus === "Pending").length;

    // Treatments & health
    const activeTreatments = healthRecords.filter(h => h.recoveryStatus === "Under Treatment" || h.recoveryStatus === "Improving").length;
    const recovered = healthRecords.filter(h => h.recoveryStatus === "Recovered").length;

    // Recent records — sorted newest first
    const recentTreatments = [...healthRecords].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const recentFeedings = [...feeding].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const recentBreeding = [...breeding].sort((a, b) => new Date(b.matingDate || b.createdAt || 0) - new Date(a.matingDate || a.createdAt || 0));
    const recentMortality = [...mortality].sort((a, b) => new Date(b.dateOfDeath || b.createdAt || 0) - new Date(a.dateOfDeath || a.createdAt || 0));

    // Expense by category
    const expByCat = {};
    finance.filter(f => f.type === "Expense").forEach(f => {
      expByCat[f.category || "Other"] = (expByCat[f.category || "Other"] || 0) + (f.amount || 0);
    });

    // Weight averages by species
    const weightBySpecies = {};
    alive.forEach(a => {
      if (a.currentWeight > 0) {
        const sp = a.species || "Unknown";
        if (!weightBySpecies[sp]) weightBySpecies[sp] = { total: 0, count: 0 };
        weightBySpecies[sp].total += a.currentWeight;
        weightBySpecies[sp].count++;
      }
    });
    Object.keys(weightBySpecies).forEach(sp => {
      weightBySpecies[sp].avg = Math.round(weightBySpecies[sp].total / weightBySpecies[sp].count * 10) / 10;
    });

    return {
      totalAnimals, aliveCount, deadCount, soldCount, quarantinedCount, maleCount, femaleCount,
      speciesMap, breedMap, speciesBreedMap,
      totalIncome, totalExpense, netPL,
      totalPurchaseCost, totalFeedCost, totalMedCost, totalProjectedSales,
      totalItems, lowStock, inventoryValue,
      totalDeaths, mortalityLoss,
      totalBreeding, delivered: delivered.length, totalKids, confirmed, pendingBreeding,
      activeTreatments, recovered,
      recentTreatments, recentFeedings, recentBreeding, recentMortality,
      expByCat, weightBySpecies,
    };
  }, [data]);

  // ─── Chart Data ───
  const speciesChart = {
    labels: Object.keys(stats.speciesMap),
    datasets: [{ data: Object.values(stats.speciesMap), backgroundColor: CHART_COLORS.slice(0, Object.keys(stats.speciesMap).length) }],
  };

  const breedChart = {
    labels: Object.keys(stats.breedMap),
    datasets: [{ data: Object.values(stats.breedMap), backgroundColor: CHART_COLORS }],
  };

  const expenseChart = {
    labels: Object.keys(stats.expByCat).slice(0, 8),
    datasets: [{ label: "Amount", data: Object.values(stats.expByCat).slice(0, 8), backgroundColor: CHART_COLORS.slice(0, 8) }],
  };

  const genderChart = {
    labels: ["Male", "Female"],
    datasets: [{ data: [stats.maleCount, stats.femaleCount], backgroundColor: ["#3b82f6", "#ec4899"] }],
  };

  if (!user) return null;

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-8 py-8 -mx-6 -mt-10 md:-mx-12 md:-mt-12 mb-8 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">{businessSettings?.businessName || "Farm Dashboard"}</h1>
            <p className="text-green-50 text-lg">Welcome back, <span className="font-bold text-white">{user.name}</span>! 👋</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            {!isOnline && (
              <span className="px-3 py-1.5 bg-orange-500/90 text-white rounded-lg text-sm font-semibold">📡 Offline</span>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <Loader message="Loading dashboard..." color="green-600" />
      ) : !dashboardReady ? (
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h2 className="text-lg font-bold text-red-700 mb-2">Dashboard not ready</h2>
          <p className="text-sm text-gray-600 mb-4">{loadError || "Required data is still loading."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
          >
            Retry Load
          </button>
        </div>
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

          {/* ─── Section: Livestock by Species ─── */}
          <SectionTitle icon="🐾" title="Livestock by Species" />
          {Object.keys(stats.speciesMap).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
              {Object.entries(stats.speciesBreedMap).map(([species, info]) => (
                <motion.div key={species} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-green-300 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getSpeciesEmoji(species)}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{species}</h3>
                      <p className="text-xs text-gray-500">{info.total} total</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs mt-1">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">♂ {info.male}</span>
                    <span className="px-2 py-0.5 bg-pink-50 text-pink-700 rounded font-semibold">♀ {info.female}</span>
                  </div>
                  {Object.keys(info.breeds).length > 0 && (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      {Object.entries(info.breeds).slice(0, 3).map(([breed, count]) => (
                        <p key={breed} className="text-xs text-gray-500 truncate">{breed}: <span className="font-semibold text-gray-700">{count}</span></p>
                      ))}
                      {Object.keys(info.breeds).length > 3 && <p className="text-xs text-gray-400">+{Object.keys(info.breeds).length - 3} more</p>}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptySection message="No animals registered yet" className="mb-8" />
          )}

          {/* Herd Overview KPIs */}
          <SectionTitle icon="📊" title="Herd Overview" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
            <KPI label="Total" value={fmt(stats.totalAnimals)} color="bg-blue-50 border-blue-200" icon="🐾" />
            <KPI label="Alive" value={fmt(stats.aliveCount)} color="bg-green-50 border-green-200" icon="✅" />
            <KPI label="Dead" value={fmt(stats.deadCount)} color="bg-red-50 border-red-200" icon="💀" />
            <KPI label="Sold" value={fmt(stats.soldCount)} color="bg-yellow-50 border-yellow-200" icon="💵" />
            <KPI label="Males" value={fmt(stats.maleCount)} color="bg-indigo-50 border-indigo-200" icon="♂️" />
            <KPI label="Females" value={fmt(stats.femaleCount)} color="bg-pink-50 border-pink-200" icon="♀️" />
            <KPI label="Quarantined" value={fmt(stats.quarantinedCount)} color="bg-orange-50 border-orange-200" icon="🔒" />
            <KPI label="On Treatment" value={fmt(stats.activeTreatments)} color="bg-amber-50 border-amber-200" icon="💊" />
          </div>

          {/* Financial Overview */}
          <SectionTitle icon="💰" title="Financial Overview" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KPI label="Total Income" value={fmtMoney(stats.totalIncome, currency)} color="bg-green-50 border-green-200" icon="📈" />
            <KPI label="Total Expenses" value={fmtMoney(stats.totalExpense, currency)} color="bg-red-50 border-red-200" icon="📉" />
            <KPI label="Net P/L" value={fmtMoney(stats.netPL, currency)} color={stats.netPL >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} icon={stats.netPL >= 0 ? "📊" : "⚠️"} />
            <KPI label="Projected Sales" value={fmtMoney(stats.totalProjectedSales, currency)} color="bg-blue-50 border-blue-200" icon="🎯" />
            <KPI label="Feed Costs" value={fmtMoney(stats.totalFeedCost, currency)} color="bg-orange-50 border-orange-200" icon="🌾" />
            <KPI label="Mortality Loss" value={fmtMoney(stats.mortalityLoss, currency)} color="bg-gray-50 border-gray-200" icon="💀" />
          </div>

          {/* Breeding & Operations */}
          <SectionTitle icon="💕" title="Breeding & Operations" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KPI label="Breeding Records" value={fmt(stats.totalBreeding)} color="bg-pink-50 border-pink-200" icon="💕" />
            <KPI label="Confirmed" value={fmt(stats.confirmed)} color="bg-blue-50 border-blue-200" icon="🤰" />
            <KPI label="Pending" value={fmt(stats.pendingBreeding)} color="bg-yellow-50 border-yellow-200" icon="⏳" />
            <KPI label="Delivered" value={fmt(stats.delivered)} color="bg-green-50 border-green-200" icon="🐣" />
            <KPI label="Kids Born" value={fmt(stats.totalKids)} color="bg-emerald-50 border-emerald-200" icon="🎉" />
            <KPI label="Total Deaths" value={fmt(stats.totalDeaths)} color="bg-red-50 border-red-200" icon="🪦" />
          </div>

          {/* Inventory KPIs */}
          <SectionTitle icon="📦" title="Inventory" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            <KPI label="Inventory Items" value={fmt(stats.totalItems)} color="bg-indigo-50 border-indigo-200" icon="📦" />
            <KPI label="Low Stock" value={fmt(stats.lowStock.length)} color={stats.lowStock.length > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"} icon="⚠️" />
            <KPI label="Inventory Value" value={fmtMoney(stats.inventoryValue, currency)} color="bg-purple-50 border-purple-200" icon="🏷️" />
            <KPI label="Recovered" value={fmt(stats.recovered)} color="bg-teal-50 border-teal-200" icon="✅" />
          </div>

          {/* Average Weight by Species */}
          {Object.keys(stats.weightBySpecies).length > 0 && (
            <>
              <SectionTitle icon="⚖️" title="Average Weight by Species" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                {Object.entries(stats.weightBySpecies).map(([sp, w]) => (
                  <KPI key={sp} label={sp} value={`${w.avg} kg`} color="bg-purple-50 border-purple-200" icon={getSpeciesEmoji(sp)} />
                ))}
              </div>
            </>
          )}

          {/* Charts Row */}
          <SectionTitle icon="📈" title="Visual Analytics" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ChartCard title="Species Distribution">
              {Object.keys(stats.speciesMap).length > 0 ? (
                <Doughnut data={speciesChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } } }} />
              ) : <NoData />}
            </ChartCard>
            <ChartCard title="Breed Distribution">
              {Object.keys(stats.breedMap).length > 0 ? (
                <Doughnut data={breedChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } } }} />
              ) : <NoData />}
            </ChartCard>
            <ChartCard title="Gender Split">
              {(stats.maleCount + stats.femaleCount) > 0 ? (
                <Pie data={genderChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } } }} />
              ) : <NoData />}
            </ChartCard>
            <ChartCard title="Expenses by Category">
              {Object.keys(stats.expByCat).length > 0 ? (
                <Bar data={expenseChart} options={{ responsive: true, maintainAspectRatio: false, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }} />
              ) : <NoData />}
            </ChartCard>
          </div>

          {/* Activity Feeds */}
          <SectionTitle icon="📋" title="Recent Activity" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Recent Breeding */}
            <ListCard title="Breeding Updates" icon="💕" items={
              stats.recentBreeding.slice(0, 6).map(b => ({
                label: `${b.doe?.tagId || b.doe?.name || "?"} × ${b.buck?.tagId || b.buck?.name || "?"}`,
                meta: `${b.pregnancyStatus || "—"}${b.kidsAlive > 0 ? ` • ${b.kidsAlive} kids` : ""}${b.matingDate ? ` • ${new Date(b.matingDate).toLocaleDateString()}` : ""}`,
                emoji: b.pregnancyStatus === "Delivered" ? "🐣" : b.pregnancyStatus === "Confirmed" ? "🤰" : b.pregnancyStatus === "Not Pregnant" ? "❌" : "⏳",
              }))
            } emptyText="No breeding records" link="/manage/breeding" />

            {/* Recent Health Records */}
            <ListCard title="Health Records" icon="🏥" items={
              stats.recentTreatments.slice(0, 6).map(h => ({
                label: h.animalTagId || h.animal?.tagId || h.animal?.name || "Unknown",
                meta: `${h.symptoms || h.diagnosis || "Treatment"} • ${h.recoveryStatus || "—"}`,
                emoji: h.recoveryStatus === "Recovered" ? "✅" : h.recoveryStatus === "Improving" ? "📈" : h.recoveryStatus === "Deteriorating" ? "📉" : "💊",
              }))
            } emptyText="No health records" link="/manage/health-records" />

            {/* Low Stock Alerts */}
            <ListCard title="Low Stock Alerts" icon="⚠️" items={
              stats.lowStock.slice(0, 6).map(i => ({
                label: i.item || i.name,
                meta: `${i.quantity} ${i.unit || "units"} remaining (min: ${i.minStock || 10})`,
                emoji: i.quantity <= 0 ? "🚨" : "📦",
              }))
            } emptyText="All stock levels are healthy ✅" link="/manage/inventory" />

            {/* Recent Mortality */}
            <ListCard title="Recent Mortality" icon="🪦" items={
              stats.recentMortality.slice(0, 6).map(m => ({
                label: m.animal?.tagId || m.animalTagId || "Unknown",
                meta: `${m.causeOfDeath || "Unknown cause"}${m.dateOfDeath ? ` • ${new Date(m.dateOfDeath).toLocaleDateString()}` : ""}`,
                emoji: "💀",
              }))
            } emptyText="No mortality records" link="/manage/mortality" />
          </div>
        </>
      )}
    </>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
      <span>{icon}</span>{title}
    </h2>
  );
}

function EmptySection({ message, className = "" }) {
  return (
    <div className={`bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 ${className}`}>
      {message}
    </div>
  );
}

function KPI({ label, value, color, icon }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`${color} border-2 p-3 rounded-xl shadow-sm hover:shadow-md transition-all`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-semibold text-gray-600 truncate">{label}</span>
      </div>
      <div className="text-lg font-black text-gray-900 truncate">{value}</div>
    </motion.div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800 text-sm">{title}</h3></div>
      <div className="p-4 h-56">{children}</div>
    </div>
  );
}

function NoData() {
  return <div className="flex items-center justify-center h-full text-gray-400 text-sm">No data available</div>;
}

function ListCard({ title, icon, items, emptyText, link }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><span>{icon}</span>{title}</h3>
        {link && <Link href={link} className="text-xs text-green-600 font-semibold hover:underline">View All →</Link>}
      </div>
      <ul className="space-y-1.5">
        {items.length > 0 ? items.map((i, idx) => (
          <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 hover:bg-green-50 transition-all">
            <span className="text-sm flex-shrink-0 mt-0.5">{i.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 text-xs truncate">{i.label}</div>
              <div className="text-xs text-gray-500 truncate">{i.meta}</div>
            </div>
          </li>
        )) : <li className="text-gray-400 text-xs text-center py-4">{emptyText}</li>}
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
