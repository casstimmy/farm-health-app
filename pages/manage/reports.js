"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import Loader from "@/components/Loader";
import { BusinessContext } from "@/context/BusinessContext";
import { PERIOD_OPTIONS } from "@/utils/filterHelpers";
import { formatCurrency } from "@/utils/formatting";

export default function Reports() {
  const router = useRouter();
  const { businessSettings } = useContext(BusinessContext);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [locations, setLocations] = useState([]);
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchLocations();
  }, [router]);

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPeriod, filterLocation]);

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.ok ? await res.json() : [];
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setLocations([]);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const qs = new URLSearchParams({
        period: filterPeriod,
        location: filterLocation,
      });
      const res = await fetch(`/api/reports/summary?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch report summary");
      }
      setSummary(await res.json());
    } catch (err) {
      setError(err.message || "Failed to fetch report summary");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const netProfit = useMemo(() => {
    if (!summary) return 0;
    return Number(summary.totalIncome || 0) - Number(summary.totalExpenses || 0);
  }, [summary]);

  const f = (val) => formatCurrency(val || 0, businessSettings.currency);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Fast server-side summary for operations, finance, customers, and orders"
        gradient="from-yellow-600 to-yellow-700"
        icon="📊"
      />

      <FilterBar
        searchTerm=""
        onSearchChange={() => {}}
        placeholder=""
        filters={[
          { value: filterPeriod, onChange: setFilterPeriod, options: PERIOD_OPTIONS },
          {
            value: filterLocation,
            onChange: setFilterLocation,
            options: [{ value: "all", label: "All Locations" }, ...locations.map((l) => ({ value: l._id, label: l.name }))],
          },
        ]}
      />

      {loading ? (
        <Loader message="Loading report summary..." color="yellow-600" />
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !summary ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-600">No report data available.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Total Income" value={f(summary.totalIncome)} tone="green" />
            <Card title="Total Expenses" value={f(summary.totalExpenses)} tone="red" />
            <Card title="Net Profit/Loss" value={f(netProfit)} tone={netProfit >= 0 ? "emerald" : "red"} />
            <Card title="Total Animals" value={summary.totalAnimals} tone="blue" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
              <h3 className="text-lg font-bold text-gray-900">Animal Economics</h3>
              <Row label="Alive / Dead / Sold" value={`${summary.aliveAnimals} / ${summary.deadAnimals} / ${summary.soldAnimals}`} />
              <Row label="Purchase Cost" value={f(summary.totalPurchaseCost)} />
              <Row label="Feed Cost" value={f(summary.totalFeedCost)} />
              <Row label="Medication Cost" value={f(summary.totalMedicationCost)} />
              <Row label="Projected Sales" value={f(summary.totalProjectedSales)} />
              <Row label="Estimated Profit" value={f(summary.totalEstimatedProfit)} />
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
              <h3 className="text-lg font-bold text-gray-900">Operations</h3>
              <Row label="Treatments" value={summary.totalTreatments} />
              <Row label="Treatment Cost" value={f(summary.treatmentCost)} />
              <Row label="Feedings" value={summary.totalFeedings} />
              <Row label="Feeding Cost" value={f(summary.feedingCost)} />
              <Row label="Mortalities" value={summary.totalMortalities} />
              <Row label="Mortality Loss" value={f(summary.mortalityLoss)} />
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
              <h3 className="text-lg font-bold text-gray-900">Inventory & Losses</h3>
              <Row label="Inventory Items" value={summary.totalInventoryItems} />
              <Row label="Inventory Value" value={f(summary.totalInventoryValue)} />
              <Row label="Total Consumed" value={summary.totalConsumed} />
              <Row label="Loss Records" value={summary.totalLossRecords} />
              <Row label="Inventory Loss Value" value={f(summary.totalInventoryLoss)} />
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-2">
              <h3 className="text-lg font-bold text-gray-900">Customer Orders</h3>
              <Row label="Customers (Active)" value={`${summary.activeCustomers} / ${summary.totalCustomers}`} />
              <Row label="Orders (Total)" value={summary.totalOrders} />
              <Row label="Completed Orders" value={summary.completedOrders} />
              <Row label="Pending Orders" value={summary.pendingOrders} />
              <Row label="Order Revenue" value={f(summary.orderRevenue)} />
              <Row label="Outstanding Balance" value={f(summary.orderOutstanding)} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value, tone = "gray" }) {
  const toneMap = {
    green: "bg-green-50 border-green-200 text-green-800",
    red: "bg-red-50 border-red-200 text-red-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    gray: "bg-gray-50 border-gray-200 text-gray-800",
  };
  return (
    <div className={`rounded-xl border p-5 ${toneMap[tone] || toneMap.gray}`}>
      <p className="text-sm font-semibold opacity-80">{title}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm border-b border-gray-100 py-1">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

Reports.layoutType = "default";
Reports.layoutProps = { title: "Reports" };
