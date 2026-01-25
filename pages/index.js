"use client";

import { useEffect, useState, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaSpinner, FaPlus, FaHeart, FaWeight, FaPills, FaBoxOpen, FaChartLine } from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import { BusinessContext } from "@/context/BusinessContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const formatNumber = (value = 0) => Number(value).toLocaleString("en-US");
const formatMoney = (value = 0, currency = "NGN") => {
  const symbol = currency === "NGN" ? "₦" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£";
  return `${symbol}${Number(value).toLocaleString("en-US")}`;
};

export default function Home() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [allAnimals, setAllAnimals] = useState([]);
  const [allInventory, setAllInventory] = useState([]);
  const [allTreatments, setAllTreatments] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  /* =======================
     FETCH DATA
  ======================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    async function fetchData() {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${token}` };

        const [animalsRes, inventoryRes, treatmentRes] = await Promise.all([
          fetch("/api/animals", { headers }),
          fetch("/api/inventory", { headers }),
          fetch("/api/treatment", { headers }),
        ]);

        const animals = await animalsRes.json();
        const inventory = await inventoryRes.json();
        const treatments = await treatmentRes.json();

        setAllAnimals(Array.isArray(animals) ? animals : []);
        setAllInventory(Array.isArray(inventory) ? inventory : []);
        setAllTreatments(Array.isArray(treatments) ? treatments : []);
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  /* =======================
     DATE FILTER
  ======================= */
  const isWithinPeriod = (date) => {
    const now = new Date();
    const d = new Date(date);

    if (selectedPeriod === "today") return d.toDateString() === now.toDateString();
    if (selectedPeriod === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo && d <= now;
    }
    if (selectedPeriod === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  };

  /* =======================
     FILTERED DATA
  ======================= */
  const filteredTreatments = useMemo(
    () => allTreatments.filter((t) => isWithinPeriod(t.createdAt)),
    [allTreatments, selectedPeriod]
  );

  const filteredInventory = useMemo(
    () => allInventory.filter((i) => isWithinPeriod(i.dateAdded)),
    [allInventory, selectedPeriod]
  );

  /* =======================
     KPIs
  ======================= */
  const kpis = useMemo(() => {
    const totalAnimals = allAnimals.length;
    const healthyAnimals = allAnimals.filter((a) => a.healthStatus === "healthy").length;
    const treatmentCount = filteredTreatments.length;
    const inventoryValue = filteredInventory.reduce((sum, i) => sum + (i.quantity * (i.price || 0)), 0);
    const lowStockCount = filteredInventory.filter((i) => i.quantity < (i.minStock || 10)).length;

    return {
      totalAnimals,
      healthyAnimals,
      treatmentCount,
      inventoryValue,
      lowStockCount,
    };
  }, [allAnimals, filteredTreatments, filteredInventory]);

  /* =======================
     INVENTORY BY CATEGORY
  ======================= */
  const inventoryByCategory = useMemo(() => {
    const map = {};
    filteredInventory.forEach((item) => {
      const cat = item.category || "Other";
      map[cat] = (map[cat] || 0) + item.quantity;
    });
    return map;
  }, [filteredInventory]);

  /* =======================
     TREATMENTS BY TYPE
  ======================= */
  const treatmentsByType = useMemo(() => {
    const map = {};
    filteredTreatments.forEach((t) => {
      const type = t.type || "General";
      map[type] = (map[type] || 0) + 1;
    });
    return map;
  }, [filteredTreatments]);

  /* =======================
     CHART DATA
  ======================= */
  const inventoryChart = {
    labels: Object.keys(inventoryByCategory),
    datasets: [
      {
        label: "Stock Quantity",
        data: Object.values(inventoryByCategory),
        backgroundColor: "#10b981",
      },
    ],
  };

  const treatmentChart = {
    labels: Object.keys(treatmentsByType),
    datasets: [
      {
        label: "Treatment Count",
        data: Object.values(treatmentsByType),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  if (!user) return null;

  return (
    <>
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-10 -mx-6 -mt-10 md:-mx-12 md:-mt-12 mb-10 rounded-b-3xl shadow-lg">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{businessSettings.businessName}</h1>
            <p className="text-green-50 text-xl font-light">Welcome back, <span className="font-bold text-white">{user.name}</span>! 👋</p>
          </div>
          <select
            className="bg-white text-gray-900 border-2 border-green-200 px-6 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-300 font-semibold shadow-lg"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="today">📅 Today</option>
            <option value="week">📊 This Week</option>
            <option value="month">📈 This Month</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="text-center">
            <FaSpinner className="animate-spin text-green-600 w-16 h-16 mx-auto" />
            <p className="mt-6 text-gray-600 font-medium text-lg">Loading your data...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <QuickActionCard href="/manage/animals" icon={<FaPlus />} label="Add Animal" color="from-blue-500 to-blue-600" />
              <QuickActionCard href="/manage/breeding" icon={<FaHeart />} label="Breeding" color="from-pink-500 to-rose-600" />
              <QuickActionCard href="/manage/weight" icon={<FaWeight />} label="Record Weight" color="from-purple-500 to-purple-600" />
              <QuickActionCard href="/manage/treatments" icon={<FaPills />} label="Treatment" color="from-teal-500 to-teal-600" />
              <QuickActionCard href="/manage/inventory" icon={<FaBoxOpen />} label="Inventory" color="from-orange-500 to-orange-600" />
              <QuickActionCard href="/manage/reports" icon={<FaChartLine />} label="Reports" color="from-green-500 to-green-600" />
            </div>
          </div>

          {/* Period Selector */}
          <div className="mb-8 flex gap-4">
            {['today', 'week', 'month'].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === p
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {/* KPIs Grid - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <KpiCard label="Total Animals" value={formatNumber(kpis.totalAnimals)} color="bg-blue-50" />
            <KpiCard label="Healthy Animals" value={formatNumber(kpis.healthyAnimals)} color="bg-green-50" />
            <KpiCard label="Low Stock Items" value={formatNumber(kpis.lowStockCount)} color="bg-red-50" />
          </div>

          {/* Charts - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <ChartCard title="Inventory by Category">
              {inventoryByCategory && Object.keys(inventoryByCategory).length > 0 ? (
                <Bar
                  data={{
                    labels: Object.keys(inventoryByCategory),
                    datasets: [
                      {
                        label: 'Count',
                        data: Object.values(inventoryByCategory),
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data</div>
              )}
            </ChartCard>

            <ChartCard title="Treatments by Type">
              {treatmentsByType && Object.keys(treatmentsByType).length > 0 ? (
                <Bar
                  data={{
                    labels: Object.keys(treatmentsByType),
                    datasets: [
                      {
                        label: 'Count',
                        data: Object.values(treatmentsByType),
                        backgroundColor: 'rgba(139, 92, 246, 0.8)',
                        borderColor: 'rgba(139, 92, 246, 1)',
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No data</div>
              )}
            </ChartCard>
          </div>

          {/* Lists - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ListCard
              title="Recent Animals"
              items={[...allAnimals]
                .reverse()
                .slice(0, 5)
                .map((a) => ({ label: a.name || 'Unknown', meta: a.breed || 'N/A', emoji: '🐑' }))}
            />
            <ListCard
              title="Recent Treatments"
              items={[...filteredTreatments]
                .reverse()
                .slice(0, 5)
                .map((t) => ({ label: t.type || 'Unknown', meta: `${new Date(t.createdAt).toLocaleDateString()}`, emoji: '💉' }))}
            />
            <ListCard
              title="Low Stock Items"
              items={filteredInventory
                .filter((inv) => inv.quantity < inv.minStock)
                .slice(0, 5)
                .map((inv) => ({ label: inv.name || 'Unknown', meta: `${inv.quantity}/${inv.minStock}`, emoji: '⚠️' }))}
            />
          </div>
        </>
      )}
    </>
  );
}

/* =======================
   UI COMPONENTS
======================= */
function KpiCard({ label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className={`${color} border-2 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-default hover:scale-105 hover:-translate-y-1`}
    >
      <div className="space-y-3">
        <div className="text-4xl font-black text-gray-900 tracking-tight">{value}</div>
        <div className="text-gray-700 font-bold text-base">{label}</div>
      </div>
    </motion.div>
  );
}

function ChartCard({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:shadow-2xl transition-all hover:border-green-200 overflow-hidden"
    >
      <div className="p-8 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="p-8 h-96">
        {children}
      </div>
    </motion.div>
  );
}

function ListCard({ title, items }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 hover:shadow-2xl transition-all hover:border-green-200"
    >
      <h2 className="text-xl font-bold text-gray-900 mb-6">{title}</h2>
      <ul className="space-y-3">
        {items.length ? (
          items.map((i, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gradient-to-r from-gray-50 to-transparent p-4 rounded-xl border-2 border-gray-200 hover:border-green-300 hover:bg-green-50/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{i.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{i.label}</div>
                  <div className="text-sm text-gray-600 truncate">{i.meta}</div>
                </div>
              </div>
            </motion.li>
          ))
        ) : (
          <li className="text-gray-400 italic text-center py-4">No data</li>
        )}
      </ul>
    </motion.div>
  );
}

function QuickActionCard({ href, icon, label, color }) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        className={`bg-gradient-to-r ${color} text-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all cursor-pointer`}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-sm font-bold">{label}</span>
        </div>
      </motion.div>
    </Link>
  );
}

// Specify layout for this page
Home.layoutType = "default";
Home.layoutProps = { title: "Dashboard" };
