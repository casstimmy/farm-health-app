import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import Finance from "@/models/Finance";
import Treatment from "@/models/Treatment";
import MortalityRecord from "@/models/MortalityRecord";
import BreedingRecord from "@/models/BreedingRecord";
import Inventory from "@/models/Inventory";
import InventoryLoss from "@/models/InventoryLoss";
import FeedingRecord from "@/models/FeedingRecord";
import HealthRecord from "@/models/HealthRecord";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import { withRBACAuth } from "@/utils/middleware";
import { getDateRange } from "@/utils/filterHelpers";

function addDateRange(query, field, period) {
  const range = getDateRange(period);
  if (!range) return query;
  return {
    ...query,
    [field]: { $gte: range.from, $lte: range.to },
  };
}

function addLocation(query, location) {
  if (!location || location === "all") return query;
  return { ...query, location };
}

async function sumByMatch(Model, match, field) {
  const result = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
  return Number(result?.[0]?.total || 0);
}

async function sumInventoryValue() {
  const result = await Inventory.aggregate([
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $multiply: [
              { $ifNull: ["$quantity", 0] },
              { $ifNull: [{ $ifNull: ["$costPrice", "$price"] }, 0] },
            ],
          },
        },
      },
    },
  ]);
  return Number(result?.[0]?.total || 0);
}

async function handler(req, res) {
  await dbConnect();

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { period = "all", location = "all" } = req.query;

    const animalQuery = addLocation({}, location);
    const financeQuery = addLocation(addDateRange({}, "date", period), location);
    const treatmentQuery = addDateRange({}, "date", period);
    const mortalityQuery = addLocation(addDateRange({}, "dateOfDeath", period), location);
    const breedingQuery = addLocation(addDateRange({}, "matingDate", period), location);
    const lossQuery = addDateRange({}, "date", period);
    const feedingQuery = addLocation(addDateRange({}, "date", period), location);
    const healthQuery = addLocation(addDateRange({}, "date", period), location);
    const customerQuery = addLocation({}, location);
    const orderQuery = addLocation(addDateRange({}, "orderDate", period), location);

    const [
      totalAnimals,
      aliveAnimals,
      deadAnimals,
      soldAnimals,
      totalPurchaseCost,
      totalFeedCost,
      totalMedicationCost,
      totalProjectedSales,
      totalIncome,
      totalExpenses,
      totalTreatments,
      treatmentCost,
      totalMortalities,
      mortalityLoss,
      totalBreedings,
      successfulBreedings,
      totalKidsAlive,
      breedingIncome,
      totalInventoryItems,
      totalInventoryValue,
      totalConsumed,
      totalLossRecords,
      totalInventoryLoss,
      totalFeedings,
      feedingCost,
      totalCustomers,
      activeCustomers,
      totalOrders,
      completedOrders,
      pendingOrders,
      orderRevenue,
      orderOutstanding,
    ] = await Promise.all([
      Animal.countDocuments(animalQuery),
      Animal.countDocuments({ ...animalQuery, status: "Alive" }),
      Animal.countDocuments({ ...animalQuery, status: "Dead" }),
      Animal.countDocuments({ ...animalQuery, status: "Sold" }),
      sumByMatch(Animal, animalQuery, "purchaseCost"),
      sumByMatch(Animal, animalQuery, "totalFeedCost"),
      sumByMatch(Animal, animalQuery, "totalMedicationCost"),
      sumByMatch(Animal, animalQuery, "projectedSalesPrice"),
      sumByMatch(Finance, { ...financeQuery, type: "Income" }, "amount"),
      sumByMatch(Finance, { ...financeQuery, type: "Expense" }, "amount"),
      Treatment.countDocuments(treatmentQuery),
      sumByMatch(Treatment, treatmentQuery, "totalCost"),
      MortalityRecord.countDocuments(mortalityQuery),
      sumByMatch(MortalityRecord, mortalityQuery, "estimatedValue"),
      BreedingRecord.countDocuments(breedingQuery),
      BreedingRecord.countDocuments({ ...breedingQuery, pregnancyStatus: "Delivered" }),
      sumByMatch(BreedingRecord, breedingQuery, "kidsAlive"),
      sumByMatch(Finance, { ...financeQuery, category: "Breeding Income", type: "Income" }, "amount"),
      Inventory.countDocuments({}),
      sumInventoryValue(),
      sumByMatch(Inventory, {}, "totalConsumed"),
      InventoryLoss.countDocuments(lossQuery),
      sumByMatch(InventoryLoss, lossQuery, "totalLoss"),
      FeedingRecord.countDocuments(feedingQuery),
      sumByMatch(FeedingRecord, feedingQuery, "totalFeedCost"),
      Customer.countDocuments(customerQuery),
      Customer.countDocuments({ ...customerQuery, isActive: true }),
      Order.countDocuments(orderQuery),
      Order.countDocuments({ ...orderQuery, status: "Completed" }),
      Order.countDocuments({ ...orderQuery, status: "Pending" }),
      sumByMatch(Order, { ...orderQuery, status: { $ne: "Cancelled" } }, "total"),
      sumByMatch(Order, { ...orderQuery, status: { $ne: "Cancelled" } }, "balance"),
    ]);

    return res.status(200).json({
      period,
      location,
      totalIncome,
      totalExpenses,
      totalAnimals,
      aliveAnimals,
      deadAnimals,
      soldAnimals,
      totalPurchaseCost,
      totalFeedCost,
      totalMedicationCost,
      totalProjectedSales,
      totalEstimatedProfit: totalProjectedSales - totalPurchaseCost - totalFeedCost - totalMedicationCost,
      totalTreatments,
      treatmentCost,
      totalMortalities,
      mortalityLoss,
      totalBreedings,
      successfulBreedings,
      totalKidsAlive,
      breedingIncome,
      totalInventoryItems,
      totalInventoryValue,
      totalConsumed,
      totalLossRecords,
      totalInventoryLoss,
      totalFeedings,
      feedingCost,
      totalCustomers,
      activeCustomers,
      totalOrders,
      completedOrders,
      pendingOrders,
      orderRevenue,
      orderOutstanding,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
