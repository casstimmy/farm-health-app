"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaDownload } from "react-icons/fa";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";

export default function Reports() {
  const { businessSettings } = useContext(BusinessContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalAnimals: 0,
    totalTreatments: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [financeRes, animalsRes, treatmentRes] = await Promise.all([
        fetch("/api/finance", { headers }),
        fetch("/api/animals", { headers }),
        fetch("/api/treatment", { headers }),
      ]);

      if (financeRes.ok) {
        const finance = await financeRes.json();
        const financeData = Array.isArray(finance) ? finance : [];
        const totalIncome = financeData
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalExpenses = financeData
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const animals = await animalsRes.json();
        const treatments = await treatmentRes.json();

        setData({
          totalIncome,
          totalExpenses,
          totalAnimals: (Array.isArray(animals) ? animals : []).length,
          totalTreatments: (Array.isArray(treatments) ? treatments : []).length,
        });
      }
    } catch (err) {
      console.error("Failed to fetch report data:", err);
    } finally {
      setLoading(false);
    }
  };

  const reportCards = [
    {
      title: "Total Income",
      value: formatCurrency(data.totalIncome, businessSettings.currency),
      color: "bg-green-50",
      borderColor: "border-green-200",
      icon: "📈",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(data.totalExpenses, businessSettings.currency),
      color: "bg-red-50",
      borderColor: "border-red-200",
      icon: "📉",
    },
    {
      title: "Total Animals",
      value: data.totalAnimals,
      color: "bg-blue-50",
      borderColor: "border-blue-200",
      icon: "🐑",
    },
    {
      title: "Total Treatments",
      value: data.totalTreatments,
      color: "bg-purple-50",
      borderColor: "border-purple-200",
      icon: "💊",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Reports"
        subtitle="Generate and view comprehensive farm reports"
        gradient="from-yellow-600 to-yellow-700"
        icon="📊"
      />

      {/* Summary Cards */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
            <p className="text-gray-600 mt-4">Loading report data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportCards.map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`${card.color} border-2 ${card.borderColor} rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all`}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-700">{card.title}</p>
                  <span className="text-3xl">{card.icon}</span>
                </div>
                <p className="text-3xl font-black text-gray-900">{card.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Reports Actions */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                <FaDownload className="w-5 h-5" />
                Financial Report
              </button>
              <button className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                <FaDownload className="w-5 h-5" />
                Animal Report
              </button>
              <button className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                <FaDownload className="w-5 h-5" />
                Treatment Report
              </button>
              <button className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                <FaDownload className="w-5 h-5" />
                Inventory Report
              </button>
              <button className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                <FaDownload className="w-5 h-5" />
                Monthly Summary
              </button>
              <button className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                <FaDownload className="w-5 h-5" />
                Annual Report
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8">
            <div className="flex gap-4">
              <span className="text-blue-600 text-2xl flex-shrink-0 mt-1">📈</span>
              <div>
                <h3 className="font-bold text-lg text-blue-900 mb-2">Report Features</h3>
                <ul className="space-y-2 text-blue-800 text-sm">
                  <li>✓ Comprehensive financial analysis and trends</li>
                  <li>✓ Animal health and productivity metrics</li>
                  <li>✓ Treatment and medication tracking</li>
                  <li>✓ Inventory usage and costs</li>
                  <li>✓ Export to PDF and Excel formats</li>
                  <li>✓ Customizable date ranges and filters</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Reports.layoutType = "default";
Reports.layoutProps = { title: "Reports" };
