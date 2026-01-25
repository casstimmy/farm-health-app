import { createContext, useState, useEffect } from "react";

export const BusinessContext = createContext();

export function BusinessProvider({ children }) {
  const [businessSettings, setBusinessSettings] = useState({
    businessName: "Farm Health Management",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    businessDescription: "",
    currency: "NGN",
    timezone: "UTC+1",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const fetchBusinessSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/business-settings", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setBusinessSettings({
          businessName: data.businessName || "Farm Health Management",
          businessEmail: data.businessEmail || "",
          businessPhone: data.businessPhone || "",
          businessAddress: data.businessAddress || "",
          businessDescription: data.businessDescription || "",
          currency: data.currency || "NGN",
          timezone: data.timezone || "UTC+1",
        });
      }
    } catch (error) {
      console.error("Error fetching business settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = async () => {
    await fetchBusinessSettings();
  };

  return (
    <BusinessContext.Provider value={{ businessSettings, loading, refreshSettings }}>
      {children}
    </BusinessContext.Provider>
  );
}
