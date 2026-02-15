import { useEffect, useState, useContext } from "react";
import { BusinessContext } from "@/context/BusinessContext";
import { formatCurrency } from "@/utils/formatting";
import StatCard from "@/components/shared/StatCard";

export default function DashboardStats() {
  const { businessSettings } = useContext(BusinessContext);
  const [stats, setStats] = useState({
    animals: 0,
    treatments: 0,
    feedings: 0,
    inventory: 0,
    finance: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");

      const animalsRes = await fetch("/api/animals", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const animals = await animalsRes.json();

      const inventoryRes = await fetch("/api/inventory", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const inventory = await inventoryRes.json();

      const financeRes = await fetch("/api/finance", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const finance = await financeRes.json();

      const treatmentRes = await fetch("/api/treatment", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const treatmentData = await treatmentRes.json();

      const feedingRes = await fetch("/api/feeding", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const feedingData = await feedingRes.json();

      const treatments = Array.isArray(treatmentData) ? treatmentData.length : 0;
      const feedings = Array.isArray(feedingData) ? feedingData.length : 0;

      setStats({
        animals: Array.isArray(animals) ? animals.length : 0,
        treatments,
        feedings,
        inventory: Array.isArray(inventory) ? inventory.length : 0,
        finance: Array.isArray(finance) ? finance.reduce((sum, f) => sum + (f.amount || 0), 0) : 0
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <StatCard title="Animals" count={stats.animals} icon="🐑" bgColor="bg-blue-600" />
      <StatCard title="Treatments" count={stats.treatments} icon="💊" bgColor="bg-orange-600" />
      <StatCard title="Feedings" count={stats.feedings} icon="🍽️" bgColor="bg-amber-600" />
      <StatCard title="Inventory" count={stats.inventory} icon="📦" bgColor="bg-purple-600" />
      <StatCard title="Finance" count={formatCurrency(stats.finance, businessSettings.currency)} icon="💰" bgColor="bg-green-600" />
    </div>
  );
}
