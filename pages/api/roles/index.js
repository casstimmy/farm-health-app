import dbConnect from "@/lib/mongodb";
import RolePermission from "@/models/RolePermission";
import { withAuth } from "@/utils/middleware";

// Default permissions used when no DB records exist
const DEFAULT_PERMISSIONS = {
  SuperAdmin: {
    description: "Full system access and administration",
    permissions: [
      { feature: "Animals", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Health Records", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Treatments", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Inventory", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Feeding Records", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Weight Tracking", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Finance", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Transactions", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Reports", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Users Management", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Roles & Permissions", access: ["View", "Manage"] },
      { feature: "Business Setup", access: ["View", "Edit"] },
      { feature: "Locations", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Tasks", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Expenses", access: ["View", "Create", "Edit", "Delete"] },
      { feature: "Notifications", access: ["View", "Manage"] },
    ],
  },
  Admin: {
    description: "Location-scoped administrator",
    permissions: [
      { feature: "Animals", access: ["View", "Create", "Edit"] },
      { feature: "Health Records", access: ["View", "Create", "Edit"] },
      { feature: "Treatments", access: ["View", "Create", "Edit"] },
      { feature: "Inventory", access: ["View", "Create", "Edit"] },
      { feature: "Feeding Records", access: ["View", "Create", "Edit"] },
      { feature: "Weight Tracking", access: ["View", "Create", "Edit"] },
      { feature: "Finance", access: ["View", "Create"] },
      { feature: "Transactions", access: ["View", "Create"] },
      { feature: "Reports", access: ["View"] },
      { feature: "Users Management", access: ["View"] },
      { feature: "Roles & Permissions", access: [] },
      { feature: "Business Setup", access: ["View"] },
      { feature: "Locations", access: ["View"] },
      { feature: "Tasks", access: ["View", "Create", "Edit"] },
      { feature: "Expenses", access: ["View", "Create", "Edit"] },
      { feature: "Notifications", access: ["View", "Manage"] },
    ],
  },
  Manager: {
    description: "Can manage farm operations and view reports",
    permissions: [
      { feature: "Animals", access: ["View", "Create", "Edit"] },
      { feature: "Health Records", access: ["View", "Create", "Edit"] },
      { feature: "Treatments", access: ["View", "Create", "Edit"] },
      { feature: "Inventory", access: ["View", "Create", "Edit"] },
      { feature: "Feeding Records", access: ["View", "Create", "Edit"] },
      { feature: "Weight Tracking", access: ["View", "Create", "Edit"] },
      { feature: "Finance", access: ["View", "Create", "Edit"] },
      { feature: "Transactions", access: ["View", "Create", "Edit"] },
      { feature: "Reports", access: ["View"] },
      { feature: "Users Management", access: ["View"] },
      { feature: "Roles & Permissions", access: [] },
      { feature: "Business Setup", access: ["View", "Edit"] },
      { feature: "Locations", access: ["View", "Edit"] },
      { feature: "Tasks", access: ["View", "Create", "Edit"] },
      { feature: "Expenses", access: ["View", "Create", "Edit"] },
      { feature: "Notifications", access: ["View"] },
    ],
  },
  Attendant: {
    description: "Can record data and view animal records",
    permissions: [
      { feature: "Animals", access: ["View"] },
      { feature: "Health Records", access: ["View", "Create"] },
      { feature: "Treatments", access: ["View", "Create"] },
      { feature: "Inventory", access: ["View"] },
      { feature: "Feeding Records", access: ["View", "Create"] },
      { feature: "Weight Tracking", access: ["View", "Create"] },
      { feature: "Finance", access: [] },
      { feature: "Transactions", access: [] },
      { feature: "Reports", access: [] },
      { feature: "Users Management", access: [] },
      { feature: "Roles & Permissions", access: [] },
      { feature: "Business Setup", access: [] },
      { feature: "Locations", access: [] },
      { feature: "Tasks", access: ["View", "Create"] },
      { feature: "Expenses", access: ["View", "Create"] },
      { feature: "Notifications", access: [] },
    ],
  },
};

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      let roles = await RolePermission.find({}).lean();

      // If no roles exist in DB, seed with defaults
      if (!roles || roles.length === 0) {
        const seeds = Object.entries(DEFAULT_PERMISSIONS).map(([roleName, data]) => ({
          roleName,
          description: data.description,
          permissions: data.permissions,
        }));
        roles = await RolePermission.insertMany(seeds);
        roles = roles.map((r) => r.toObject());
      }

      res.status(200).json(roles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      // Only SuperAdmin can update permissions
      if (req.user?.role !== "SuperAdmin") {
        return res.status(403).json({ error: "Forbidden: Only SuperAdmin can modify permissions" });
      }

      const { roleName, permissions, description } = req.body;
      if (!roleName) {
        return res.status(400).json({ error: "roleName is required" });
      }

      const updated = await RolePermission.findOneAndUpdate(
        { roleName },
        { permissions, ...(description ? { description } : {}) },
        { new: true, upsert: true, runValidators: true }
      );

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
