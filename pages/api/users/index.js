import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const users = await User.find().select("-password").sort({ createdAt: -1 });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    try {
      const { userId, ...updateData } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      // Validate role if being updated
      if (updateData.role) {
        const validRoles = ["SuperAdmin", "Manager", "Attendant"];
        if (!validRoles.includes(updateData.role)) {
          return res.status(400).json({ error: "Invalid role. Must be one of: SuperAdmin, Manager, Attendant" });
        }

        // Prevent removing all SuperAdmins
        if (updateData.role !== "SuperAdmin") {
          const targetUser = await User.findById(userId);
          if (targetUser && targetUser.role === "SuperAdmin") {
            const superAdminCount = await User.countDocuments({ role: "SuperAdmin" });
            if (superAdminCount <= 1) {
              return res.status(400).json({ error: "Cannot remove the last SuperAdmin" });
            }
          }
        }
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "userId required" });
      }

      // Prevent deleting the last SuperAdmin
      const userToDelete = await User.findById(userId);
      if (userToDelete && userToDelete.role === "SuperAdmin") {
        const superAdminCount = await User.countDocuments({ role: "SuperAdmin" });
        if (superAdminCount <= 1) {
          return res.status(400).json({ error: "Cannot delete the last SuperAdmin" });
        }
      }

      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withRBACAuth(["SuperAdmin"])(handler);
