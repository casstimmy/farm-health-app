import dbConnect from "@/lib/mongodb";
import BusinessSettings from "@/models/BusinessSettings";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      let settings = await BusinessSettings.findOne().populate("owner");
      if (!settings) {
        settings = new BusinessSettings({
          businessName: "My Farm",
          currency: "NGN",
        });
        await settings.save();
      }
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      return res.status(500).json({ error: "Failed to fetch settings" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { businessName, businessEmail, businessPhone, businessAddress, businessDescription, currency, timezone } = req.body;

      let settings = await BusinessSettings.findOne();
      if (!settings) {
        settings = new BusinessSettings();
      }

      if (businessName) settings.businessName = businessName;
      if (businessEmail) settings.businessEmail = businessEmail;
      if (businessPhone) settings.businessPhone = businessPhone;
      if (businessAddress) settings.businessAddress = businessAddress;
      if (businessDescription) settings.businessDescription = businessDescription;
      if (currency) settings.currency = currency;
      if (timezone) settings.timezone = timezone;

      await settings.save();
      return res.status(200).json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      return res.status(500).json({ error: "Failed to update settings" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
