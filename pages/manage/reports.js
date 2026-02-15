"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaDownload } from "react-icons/fa";
import { BusinessContext } from "@/context/BusinessContext";
import { useAnimalData } from "@/context/AnimalDataContext";
import { formatCurrency } from "@/utils/formatting";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { PERIOD_OPTIONS, filterByPeriod, filterByLocation } from "@/utils/filterHelpers";

export default function Reports() {
  const { businessSettings } = useContext(BusinessContext);
  const { fetchAnimals: fetchGlobalAnimals } = useAnimalData();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");

  // Raw data arrays
  const [rawFinance, setRawFinance] = useState([]);
  const [rawAnimals, setRawAnimals] = useState([]);
  const [rawTreatments, setRawTreatments] = useState([]);
  const [rawMortalities, setRawMortalities] = useState([]);
  const [rawBreedings, setRawBreedings] = useState([]);
  const [rawInventory, setRawInventory] = useState([]);
  const [rawLosses, setRawLosses] = useState([]);
  const [rawFeedings, setRawFeedings] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [financeRes, animalsData, treatmentRes, mortalityRes, breedingRes, inventoryRes, lossRes, feedingRes, locRes] = await Promise.all([
        fetch("/api/finance", { headers }),
        fetchGlobalAnimals(),
        fetch("/api/treatment", { headers }),
        fetch("/api/mortality", { headers }),
        fetch("/api/breeding", { headers }),
        fetch("/api/inventory", { headers }),
        fetch("/api/inventory-loss", { headers }),
        fetch("/api/feeding", { headers }),
        fetch("/api/locations", { headers }),
      ]);

      setRawFinance(financeRes.ok ? await financeRes.json() : []);
      setRawAnimals(Array.isArray(animalsData) ? animalsData : []);
      setRawTreatments(treatmentRes.ok ? await treatmentRes.json() : []);
      setRawMortalities(mortalityRes.ok ? await mortalityRes.json() : []);
      setRawBreedings(breedingRes.ok ? await breedingRes.json() : []);
      setRawInventory(inventoryRes.ok ? await inventoryRes.json() : []);
      setRawLosses(lossRes.ok ? await lossRes.json() : []);
      setRawFeedings(feedingRes.ok ? await feedingRes.json() : []);
      setLocations(locRes.ok ? await locRes.json() : []);
    } catch (err) {
      console.error("Failed to fetch report data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Compute filtered data based on period and location
  const data = useMemo(() => {
    const finance = filterByLocation(filterByPeriod(Array.isArray(rawFinance) ? rawFinance : [], filterPeriod), filterLocation);
    const animals = Array.isArray(rawAnimals) ? rawAnimals : [];
    const treatments = filterByLocation(filterByPeriod(Array.isArray(rawTreatments) ? rawTreatments : [], filterPeriod), filterLocation);
    const mortalities = filterByLocation(filterByPeriod(Array.isArray(rawMortalities) ? rawMortalities : [], filterPeriod), filterLocation);
    const breedings = filterByPeriod(Array.isArray(rawBreedings) ? rawBreedings : [], filterPeriod, "matingDate");
    const inventory = Array.isArray(rawInventory) ? rawInventory : [];
    const losses = filterByPeriod(Array.isArray(rawLosses) ? rawLosses : [], filterPeriod);
    const feedings = filterByLocation(filterByPeriod(Array.isArray(rawFeedings) ? rawFeedings : [], filterPeriod), filterLocation);

    // Filter animals by location
    const filteredAnimals = filterLocation === "all" ? animals : animals.filter((a) => {
      const loc = a.location?._id || a.location;
      return loc === filterLocation;
    });

    const totalIncome = finance.filter((t) => t.type === "Income").reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalExpenses = finance.filter((t) => t.type === "Expense").reduce((sum, t) => sum + (t.amount || 0), 0);

    const financeByCategory = {};
    finance.forEach((f) => {
      const cat = f.category || "Uncategorized";
      if (!financeByCategory[cat]) financeByCategory[cat] = { income: 0, expense: 0 };
      if (f.type === "Income") financeByCategory[cat].income += f.amount || 0;
      else financeByCategory[cat].expense += f.amount || 0;
    });

    const aliveAnimals = filteredAnimals.filter((a) => a.status === "Alive").length;
    const deadAnimals = filteredAnimals.filter((a) => a.status === "Dead").length;
    const soldAnimals = filteredAnimals.filter((a) => a.status === "Sold").length;
    const totalPurchaseCost = filteredAnimals.reduce((s, a) => s + (a.purchaseCost || 0), 0);
    const totalFeedCost = filteredAnimals.reduce((s, a) => s + (a.totalFeedCost || 0), 0);
    const totalMedicationCost = filteredAnimals.reduce((s, a) => s + (a.totalMedicationCost || 0), 0);
    const totalProjectedSales = filteredAnimals.reduce((s, a) => s + (a.projectedSalesPrice || 0), 0);
    const totalEstimatedProfit = totalProjectedSales - totalPurchaseCost - totalFeedCost - totalMedicationCost;

    const treatmentCost = treatments.reduce((s, t) => s + (t.totalCost || 0), 0);
    const mortalityLoss = mortalities.reduce((s, m) => s + (m.estimatedValue || 0), 0);

    const successfulBreedings = breedings.filter((b) => b.pregnancyStatus === "Delivered").length;
    const totalKidsAlive = breedings.reduce((s, b) => s + (b.kidsAlive || 0), 0);
    const breedingIncome = finance.filter((f) => f.category === "Breeding Income").reduce((s, f) => s + (f.amount || 0), 0);

    const totalInventoryValue = inventory.reduce((s, i) => s + (i.quantity || 0) * (i.costPrice || i.price || 0), 0);
    const totalConsumed = inventory.reduce((s, i) => s + (i.totalConsumed || 0), 0);

    const totalInventoryLoss = losses.reduce((s, l) => s + (l.totalLoss || 0), 0);
    const lossByType = {};
    losses.forEach((l) => {
      if (!lossByType[l.type]) lossByType[l.type] = { count: 0, total: 0 };
      lossByType[l.type].count += 1;
      lossByType[l.type].total += l.totalLoss || 0;
    });

    const feedingCost = feedings.reduce((s, f) => s + (f.totalCost || 0), 0);

    return {
      totalIncome, totalExpenses, financeByCategory,
      totalAnimals: filteredAnimals.length, aliveAnimals, deadAnimals, soldAnimals,
      totalPurchaseCost, totalFeedCost, totalMedicationCost, totalProjectedSales, totalEstimatedProfit,
      totalTreatments: treatments.length, treatmentCost,
      totalMortalities: mortalities.length, mortalityLoss,
      totalBreedings: breedings.length, successfulBreedings, totalKidsAlive, breedingIncome,
      totalInventoryItems: inventory.length, totalInventoryValue, totalConsumed,
      totalLossRecords: losses.length, totalInventoryLoss, lossByType,
      totalFeedings: feedings.length, feedingCost,
    };
  }, [rawFinance, rawAnimals, rawTreatments, rawMortalities, rawBreedings, rawInventory, rawLosses, rawFeedings, filterPeriod, filterLocation]);

  const f = (val) => formatCurrency(val, businessSettings.currency);
  const netProfit = data.totalIncome - data.totalExpenses;

  return (
    <div className="space-y-8">
      <PageHeader title="Reports & Analytics" subtitle="Comprehensive farm financial and operational reports" gradient="from-yellow-600 to-yellow-700" icon="📊" />

      {/* Period & Location Filters */}
      <FilterBar
        searchTerm=""
        onSearchChange={() => {}}
        placeholder=""
        filters={[
          { value: filterPeriod, onChange: setFilterPeriod, options: PERIOD_OPTIONS },
          { value: filterLocation, onChange: setFilterLocation, options: [{ value: "all", label: "All Locations" }, ...locations.map((l) => ({ value: l._id, label: l.name }))] },
        ]}
      />

      {loading ? (
        <Loader message="Loading report data..." color="yellow-600" />
      ) : (
        <>
          {/* Top-Level Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Total Income", value: f(data.totalIncome), icon: "📈", color: "bg-green-50", border: "border-green-200", text: "text-green-800" },
              { title: "Total Expenses", value: f(data.totalExpenses), icon: "📉", color: "bg-red-50", border: "border-red-200", text: "text-red-800" },
              { title: "Net Profit/Loss", value: f(netProfit), icon: netProfit >= 0 ? "💰" : "⚠️", color: netProfit >= 0 ? "bg-emerald-50" : "bg-red-50", border: netProfit >= 0 ? "border-emerald-200" : "border-red-300", text: netProfit >= 0 ? "text-emerald-800" : "text-red-800" },
              { title: "Total Animals", value: data.totalAnimals, icon: "🐑", color: "bg-blue-50", border: "border-blue-200", text: "text-blue-800" },
            ].map((card, idx) => (
              <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className={`${card.color} border-2 ${card.border} rounded-2xl shadow-lg p-6`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-gray-700">{card.title}</p>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <p className={`text-2xl font-black ${card.text}`}>{card.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Animal P&L */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">🐑 Animal Profit & Loss</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200"><p className="text-xs text-gray-500">Alive</p><p className="text-xl font-bold text-blue-700">{data.aliveAnimals}</p></div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200"><p className="text-xs text-gray-500">Dead</p><p className="text-xl font-bold text-red-700">{data.deadAnimals}</p></div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200"><p className="text-xs text-gray-500">Total Purchase Cost</p><p className="text-lg font-bold text-gray-800">{f(data.totalPurchaseCost)}</p></div>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200"><p className="text-xs text-gray-500">Total Feed Cost</p><p className="text-lg font-bold text-orange-700">{f(data.totalFeedCost)}</p></div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200"><p className="text-xs text-gray-500">Medication Cost</p><p className="text-lg font-bold text-red-700">{f(data.totalMedicationCost)}</p></div>
              <div className={`rounded-xl p-4 border ${data.totalEstimatedProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-300'}`}><p className="text-xs text-gray-500">Est. Animal Profit</p><p className={`text-lg font-bold ${data.totalEstimatedProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{f(data.totalEstimatedProfit)}</p></div>
            </div>
            <div className="mt-3 bg-purple-50 rounded-xl p-4 border border-purple-200"><p className="text-xs text-gray-500">Total Projected Sales Value</p><p className="text-xl font-bold text-purple-700">{f(data.totalProjectedSales)}</p></div>
          </div>

          {/* Mortality & Breeding Impact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">💀 Mortality Impact</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-xl p-4 border border-red-200"><p className="text-xs text-gray-500">Deaths</p><p className="text-2xl font-bold text-red-700">{data.totalMortalities}</p></div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200"><p className="text-xs text-gray-500">Mortality Loss</p><p className="text-xl font-bold text-red-700">{f(data.mortalityLoss)}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-green-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">💕 Breeding Income</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-xl p-4 border border-green-200"><p className="text-xs text-gray-500">Successful</p><p className="text-2xl font-bold text-green-700">{data.successfulBreedings} / {data.totalBreedings}</p></div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200"><p className="text-xs text-gray-500">Breeding Income</p><p className="text-xl font-bold text-green-700">{f(data.breedingIncome)}</p></div>
              </div>
              <div className="mt-3 bg-blue-50 rounded-xl p-3 border border-blue-200"><p className="text-xs text-gray-500">Kids Born Alive: <span className="font-bold text-blue-700">{data.totalKidsAlive}</span></p></div>
            </div>
          </div>

          {/* Inventory & Losses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-amber-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">📦 Inventory Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><p className="text-xs text-gray-500">Total Items</p><p className="text-2xl font-bold text-amber-700">{data.totalInventoryItems}</p></div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><p className="text-xs text-gray-500">Total Value</p><p className="text-xl font-bold text-amber-700">{f(data.totalInventoryValue)}</p></div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200"><p className="text-xs text-gray-500">Total Consumed</p><p className="text-xl font-bold text-orange-700">{data.totalConsumed} units</p></div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><p className="text-xs text-gray-500">Feedings</p><p className="text-xl font-bold text-amber-700">{data.totalFeedings}</p><p className="text-xs text-gray-500">Cost: {f(data.feedingCost)}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">📉 Inventory Losses</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-red-50 rounded-xl p-4 border border-red-200"><p className="text-xs text-gray-500">Loss Records</p><p className="text-2xl font-bold text-red-700">{data.totalLossRecords}</p></div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200"><p className="text-xs text-gray-500">Total Loss Value</p><p className="text-xl font-bold text-red-700">{f(data.totalInventoryLoss)}</p></div>
              </div>
              {Object.keys(data.lossByType).length > 0 && (
                <div className="mt-3 space-y-2">
                  {Object.entries(data.lossByType).map(([type, info]) => (
                    <div key={type} className="flex justify-between items-center text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="font-semibold text-gray-700">{type}</span>
                      <div className="text-right"><span className="text-gray-500">{info.count} records</span><span className="ml-3 font-bold text-red-700">{f(info.total)}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Treatment & Operations */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">💊 Treatments & Operations</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200"><p className="text-xs text-gray-500">Total Treatments</p><p className="text-2xl font-bold text-purple-700">{data.totalTreatments}</p></div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200"><p className="text-xs text-gray-500">Treatment Cost</p><p className="text-xl font-bold text-purple-700">{f(data.treatmentCost)}</p></div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><p className="text-xs text-gray-500">Feeding Records</p><p className="text-2xl font-bold text-amber-700">{data.totalFeedings}</p></div>
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200"><p className="text-xs text-gray-500">Feeding Cost</p><p className="text-xl font-bold text-amber-700">{f(data.feedingCost)}</p></div>
            </div>
          </div>

          {/* Finance Breakdown */}
          {Object.keys(data.financeByCategory).length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">📋 Finance by Category</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Category</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-green-700">Income</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-red-700">Expense</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Object.entries(data.financeByCategory).map(([cat, vals]) => {
                      const net = vals.income - vals.expense;
                      return (
                        <tr key={cat} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{cat}</td>
                          <td className="px-4 py-3 text-sm text-right text-green-700">{vals.income > 0 ? f(vals.income) : "—"}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-700">{vals.expense > 0 ? f(vals.expense) : "—"}</td>
                          <td className={`px-4 py-3 text-sm text-right font-bold ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{f(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Generate Reports */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Financial Report", gradient: "from-green-600 to-green-700" },
                { label: "Animal Report", gradient: "from-blue-600 to-blue-700" },
                { label: "Treatment Report", gradient: "from-purple-600 to-purple-700" },
                { label: "Inventory Report", gradient: "from-amber-600 to-amber-700" },
                { label: "Loss & Wastage Report", gradient: "from-red-600 to-red-700" },
                { label: "Breeding Report", gradient: "from-pink-600 to-pink-700" },
              ].map((btn) => (
                <button key={btn.label} className={`flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r ${btn.gradient} text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105`}>
                  <FaDownload className="w-5 h-5" /> {btn.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Reports.layoutType = "default";
Reports.layoutProps = { title: "Reports" };
