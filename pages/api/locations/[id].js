import dbConnect from "@/lib/mongodb";
import Location from "@/models/Location";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const location = await Location.findById(id).lean();
      if (!location) return res.status(404).json({ error: "Location not found" });
      return res.status(200).json(location);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const { action, paddock, paddockId, ...fields } = req.body || {};

      // ── Paddock sub-operations via action field ──
      if (action === "add-paddock") {
        if (!paddock?.name?.trim()) return res.status(400).json({ error: "Paddock name is required" });
        const location = await Location.findByIdAndUpdate(
          id,
          { $push: { paddocks: paddock } },
          { new: true, runValidators: true }
        );
        if (!location) return res.status(404).json({ error: "Location not found" });
        return res.status(200).json(location);
      }

      if (action === "update-paddock") {
        if (!paddockId) return res.status(400).json({ error: "paddockId is required" });
        const setObj = {};
        if (paddock?.name !== undefined) setObj["paddocks.$.name"] = paddock.name;
        if (paddock?.type !== undefined) setObj["paddocks.$.type"] = paddock.type;
        if (paddock?.capacity !== undefined) setObj["paddocks.$.capacity"] = paddock.capacity;
        if (paddock?.description !== undefined) setObj["paddocks.$.description"] = paddock.description;
        if (paddock?.isActive !== undefined) setObj["paddocks.$.isActive"] = paddock.isActive;
        const location = await Location.findOneAndUpdate(
          { _id: id, "paddocks._id": paddockId },
          { $set: setObj },
          { new: true, runValidators: true }
        );
        if (!location) return res.status(404).json({ error: "Location or paddock not found" });
        return res.status(200).json(location);
      }

      if (action === "delete-paddock") {
        if (!paddockId) return res.status(400).json({ error: "paddockId is required" });
        const location = await Location.findByIdAndUpdate(
          id,
          { $pull: { paddocks: { _id: paddockId } } },
          { new: true }
        );
        if (!location) return res.status(404).json({ error: "Location not found" });
        return res.status(200).json(location);
      }

      // ── Default: update location fields ──
      const updateData = {};
      if (fields.name !== undefined) updateData.name = fields.name;
      if (fields.description !== undefined) updateData.description = fields.description;
      if (fields.address !== undefined) updateData.address = fields.address;
      if (fields.city !== undefined) updateData.city = fields.city;
      if (fields.state !== undefined) updateData.state = fields.state;
      if (fields.isActive !== undefined) updateData.isActive = fields.isActive;
      if (fields.paddocks !== undefined) updateData.paddocks = fields.paddocks;

      const location = await Location.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!location) return res.status(404).json({ error: "Location not found" });
      return res.status(200).json(location);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const location = await Location.findByIdAndDelete(id);
      if (!location) return res.status(404).json({ error: "Location not found" });
      return res.status(200).json({ message: "Location deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PATCH — add/update/remove individual paddocks
  if (req.method === "PATCH") {
    try {
      const { action, paddock, paddockId } = req.body || {};
      const location = await Location.findById(id);
      if (!location) return res.status(404).json({ error: "Location not found" });

      if (action === "addPaddock") {
        if (!paddock?.name?.trim()) return res.status(400).json({ error: "Paddock name is required" });
        location.paddocks.push(paddock);
      } else if (action === "updatePaddock") {
        const idx = location.paddocks.findIndex((p) => p._id.toString() === paddockId);
        if (idx === -1) return res.status(404).json({ error: "Paddock not found" });
        if (paddock.name !== undefined) location.paddocks[idx].name = paddock.name;
        if (paddock.type !== undefined) location.paddocks[idx].type = paddock.type;
        if (paddock.capacity !== undefined) location.paddocks[idx].capacity = paddock.capacity;
        if (paddock.description !== undefined) location.paddocks[idx].description = paddock.description;
        if (paddock.isActive !== undefined) location.paddocks[idx].isActive = paddock.isActive;
      } else if (action === "removePaddock") {
        location.paddocks = location.paddocks.filter((p) => p._id.toString() !== paddockId);
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }

      await location.save();
      return res.status(200).json(location);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
