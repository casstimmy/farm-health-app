import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import "@/models/Location";
import { withAuth } from "@/utils/middleware";
import { ADMIN, MANAGE, ALL_ROLES, hasRole, isObjectId } from "@/utils/permissions";
import { isValidPinFormat, hashPin } from "@/utils/pin";

// Never sent to the browser.
const HIDDEN_FIELDS = "-pin -failedLoginAttempts -lockUntil";

async function activeSuperAdminCount() {
  return User.countDocuments({ role: "SuperAdmin", isActive: { $ne: false } });
}

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      // Managers and above see the staff list. Attendants only need names for
      // dropdowns (e.g. "treated by"), so they get a minimal view.
      if (!hasRole(req.user, MANAGE)) {
        const names = await User.find({ isActive: { $ne: false } })
          .select("name role")
          .sort({ name: 1 })
          .lean();
        return res.status(200).json(names);
      }

      const users = await User.find()
        .select(HIDDEN_FIELDS)
        .populate("location", "name")
        .populate("locations", "name")
        .sort({ createdAt: -1 })
        .lean();
      return res.status(200).json(users);
    } catch (error) {
      console.error("Users GET error:", error);
      return res.status(500).json({ error: "Failed to load users" });
    }
  }

  if (req.method === "PUT") {
    try {
      const body = req.body || {};
      const { userId } = body;

      if (!isObjectId(userId)) {
        return res.status(400).json({ error: "A valid userId is required" });
      }

      const target = await User.findById(userId);
      if (!target) {
        return res.status(404).json({ error: "User not found" });
      }

      // Only these fields may be changed, whatever else is sent.
      const update = {};

      if (typeof body.name === "string" && body.name.trim()) update.name = body.name.trim().slice(0, 100);
      if (typeof body.phone === "string") update.phone = body.phone.trim().slice(0, 30);

      if (body.role !== undefined) {
        if (!ALL_ROLES.includes(body.role)) {
          return res.status(400).json({ error: `Invalid role. Must be one of: ${ALL_ROLES.join(", ")}` });
        }
        update.role = body.role;
      }

      if (body.isActive !== undefined) update.isActive = !!body.isActive;

      if (body.location !== undefined) {
        update.location = isObjectId(body.location) ? body.location : null;
      }
      if (body.locations !== undefined) {
        update.locations = Array.isArray(body.locations) ? body.locations.filter(isObjectId) : [];
      }

      if (body.pin !== undefined && body.pin !== "") {
        if (!isValidPinFormat(body.pin)) {
          return res.status(400).json({ error: "PIN must be exactly 4 digits" });
        }
        update.pin = await hashPin(body.pin);
      }

      // The system must always keep at least one working SuperAdmin.
      const losesSuperAdmin =
        target.role === "SuperAdmin" &&
        target.isActive !== false &&
        ((update.role && update.role !== "SuperAdmin") || update.isActive === false);
      if (losesSuperAdmin && (await activeSuperAdminCount()) <= 1) {
        return res.status(400).json({ error: "Cannot remove or deactivate the last SuperAdmin" });
      }

      // A new PIN or re-activation also clears any wrong-PIN lock.
      if (update.pin || update.isActive === true) {
        update.failedLoginAttempts = 0;
        update.lockUntil = null;
      }

      const updatedUser = await User.findByIdAndUpdate(userId, { $set: update }, { new: true, runValidators: true })
        .select(HIDDEN_FIELDS)
        .populate("location", "name")
        .populate("locations", "name");

      return res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Users PUT error:", error);
      return res.status(500).json({ error: "Failed to update user" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { userId } = req.body || {};

      if (!isObjectId(userId)) {
        return res.status(400).json({ error: "A valid userId is required" });
      }

      if (userId === req.user.id) {
        return res.status(400).json({ error: "You cannot delete your own account" });
      }

      const userToDelete = await User.findById(userId);
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }

      if (
        userToDelete.role === "SuperAdmin" &&
        userToDelete.isActive !== false &&
        (await activeSuperAdminCount()) <= 1
      ) {
        return res.status(400).json({ error: "Cannot delete the last SuperAdmin" });
      }

      await User.findByIdAndDelete(userId);
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Users DELETE error:", error);
      return res.status(500).json({ error: "Failed to delete user" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// Any logged-in staff member may read (see GET); only a SuperAdmin may change users.
export default withAuth(handler, { PUT: ADMIN, DELETE: ADMIN });
