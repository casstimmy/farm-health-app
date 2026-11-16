import dbConnect from "@/lib/mongodb";
import Treatment from "@/models/Treatment";
import HealthRecord from "@/models/HealthRecord";
import { withAuth } from "@/utils/middleware";
import { ADMIN, MANAGE } from "@/utils/permissions";
import { denyIfOutsideLocation } from "@/utils/recordAccess";

function isObjectIdString(value) {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

function normalizePayload(payload) {
  const data = { ...payload };
  if (!data.animal && data.animalId) data.animal = data.animalId;
  delete data.animalId;

  if (data.medication && !isObjectIdString(data.medication)) {
    data.medicationName = data.medicationName || data.medication;
    data.medication = undefined;
  }

  if (data.type && !data.notes) {
    data.notes = `Type: ${data.type}`;
  }

  return data;
}

async function handler(req, res) {
  await dbConnect();

  const {
    query: { id },
    method,
  } = req;

  // Staff may only touch records that belong to their own location(s).
  if (await denyIfOutsideLocation(req, res, Treatment, id)) return;

  if (method === "DELETE") {
    try {
      const deleted = await Treatment.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Treatment not found" });
      }
      res.status(200).json({ message: "Treatment deleted" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (method === "PUT") {
    try {
      const normalized = normalizePayload(req.body || {});
      const updated = await Treatment.findByIdAndUpdate(id, normalized, { new: true, runValidators: true });
      if (!updated) {
        return res.status(404).json({ error: "Treatment not found" });
      }

      // Sync recoveryStatus to linked HealthRecord
      try {
        const syncFields = {
          recoveryStatus: updated.recoveryStatus || "",
          postWeight: updated.postWeight,
          postObservation: updated.postObservation || "",
          completionDate: updated.completionDate || null,
        };
        await HealthRecord.findOneAndUpdate(
          { linkedTreatment: id },
          syncFields
        );
      } catch (syncErr) {
        console.warn("Health record sync failed:", syncErr.message);
      }

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler, { PUT: MANAGE, DELETE: ADMIN });
