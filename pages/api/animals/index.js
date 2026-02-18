import dbConnect from "@/lib/mongodb";
import Animal from "@/models/Animal";
import { withAuth, withRBACAuth } from "@/utils/middleware";

const SORTABLE_FIELDS = new Set([
  "createdAt",
  "tagId",
  "name",
  "species",
  "status",
  "currentWeight",
  "purchaseCost",
  "projectedSalesPrice",
]);

function encodeCursor(value, id) {
  return Buffer.from(JSON.stringify({ value, id })).toString("base64");
}

function decodeCursor(cursor) {
  try {
    const parsed = JSON.parse(Buffer.from(String(cursor), "base64").toString("utf8"));
    return parsed && parsed.id !== undefined ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeCursorValue(field, value) {
  if (field === "createdAt") return new Date(value);
  if (["currentWeight", "purchaseCost", "projectedSalesPrice"].includes(field)) {
    return Number(value);
  }
  return value;
}

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      // All authenticated users can view animals
      const { archived, compact, paginate, page, limit, q, status, cursor, sortBy, sortDir, includeTotal } = req.query;
      const filter = archived === "true"
        ? { isArchived: true }
        : { isArchived: { $ne: true } };

      if (status && status !== "all") {
        if (status === "Archived") {
          filter.isArchived = true;
        } else {
          filter.status = status;
        }
      }

      if (q && String(q).trim()) {
        const regex = new RegExp(String(q).trim(), "i");
        filter.$or = [
          { tagId: regex },
          { name: regex },
          { species: regex },
          { breed: regex },
        ];
      }

      const isCompact = compact === "true" || compact === "1";
      const shouldPaginate = paginate === "true" || paginate === "1";
      const shouldUseCursor = !!cursor || req.query.cursorPaginate === "true" || req.query.cursorPaginate === "1";
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const safeSortBy = SORTABLE_FIELDS.has(sortBy) ? sortBy : "createdAt";
      const safeSortDir = String(sortDir).toLowerCase() === "asc" ? 1 : -1;
      const sortSpec = { [safeSortBy]: safeSortDir, _id: safeSortDir };
      let query = Animal.find(filter).sort(sortSpec);

      if (isCompact) {
        query = query.select({
          tagId: 1,
          name: 1,
          species: 1,
          breed: 1,
          gender: 1,
          status: 1,
          isArchived: 1,
          location: 1,
          currentWeight: 1,
          purchaseCost: 1,
          totalFeedCost: 1,
          totalMedicationCost: 1,
          projectedSalesPrice: 1,
          marginPercent: 1,
          images: { $slice: 1 },
          createdAt: 1,
          updatedAt: 1,
        });
      } else {
        query = query
          .populate("sire", "tagId name")
          .populate("dam", "tagId name")
          .populate("location", "name");
      }

      if (shouldUseCursor) {
        let cursorFilter = { ...filter };
        const decoded = cursor ? decodeCursor(cursor) : null;

        if (decoded) {
          const cursorValue = normalizeCursorValue(safeSortBy, decoded.value);
          const idCmp = safeSortDir === 1 ? "$gt" : "$lt";
          const valueCmp = safeSortDir === 1 ? "$gt" : "$lt";

          cursorFilter = {
            ...cursorFilter,
            $and: [
              ...(cursorFilter.$and || []),
              {
                $or: [
                  { [safeSortBy]: { [valueCmp]: cursorValue } },
                  { [safeSortBy]: cursorValue, _id: { [idCmp]: decoded.id } },
                ],
              },
            ],
          };
        }

        let cursorQuery = Animal.find(cursorFilter).sort(sortSpec);
        if (isCompact) {
          cursorQuery = cursorQuery.select({
            tagId: 1,
            name: 1,
            species: 1,
            breed: 1,
            gender: 1,
            status: 1,
            isArchived: 1,
            location: 1,
            currentWeight: 1,
            purchaseCost: 1,
            totalFeedCost: 1,
            totalMedicationCost: 1,
            projectedSalesPrice: 1,
            marginPercent: 1,
            images: { $slice: 1 },
            createdAt: 1,
            updatedAt: 1,
          });
        } else {
          cursorQuery = cursorQuery
            .populate("sire", "tagId name")
            .populate("dam", "tagId name")
            .populate("location", "name");
        }

        const rows = await cursorQuery.limit(limitNum + 1).lean();
        const hasMore = rows.length > limitNum;
        const items = hasMore ? rows.slice(0, limitNum) : rows;

        let nextCursor = null;
        if (hasMore && items.length > 0) {
          const last = items[items.length - 1];
          nextCursor = encodeCursor(last[safeSortBy], String(last._id));
        }

        const payload = {
          items,
          limit: limitNum,
          sortBy: safeSortBy,
          sortDir: safeSortDir === 1 ? "asc" : "desc",
          nextCursor,
          hasMore,
        };

        if (includeTotal === "true" || includeTotal === "1") {
          payload.total = await Animal.countDocuments(filter);
        }

        return res.status(200).json(payload);
      }

      if (shouldPaginate) {
        const [total, animals] = await Promise.all([
          Animal.countDocuments(filter),
          query.skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
        ]);
        const totalPages = Math.max(1, Math.ceil(total / limitNum));
        return res.status(200).json({
          items: animals,
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
        });
      }

      const animals = await query.lean();
      res.status(200).json(animals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      // Only SuperAdmin and Manager can create animals
      if (!["SuperAdmin", "Manager"].includes(req.user?.role)) {
        return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      }

      const animalData = req.body;

      if (!animalData.tagId) {
        return res.status(400).json({ error: "tagId is required" });
      }

      // Convert sire/dam tagId strings to ObjectId refs
      if (animalData.sire && typeof animalData.sire === "string" && !animalData.sire.match(/^[0-9a-fA-F]{24}$/)) {
        const sireAnimal = await Animal.findOne({ tagId: animalData.sire });
        animalData.sire = sireAnimal ? sireAnimal._id : null;
      }
      if (animalData.dam && typeof animalData.dam === "string" && !animalData.dam.match(/^[0-9a-fA-F]{24}$/)) {
        const damAnimal = await Animal.findOne({ tagId: animalData.dam });
        animalData.dam = damAnimal ? damAnimal._id : null;
      }

      // Map legacy field names
      if (animalData.sireId !== undefined) {
        if (!animalData.sire) animalData.sire = animalData.sireId;
        delete animalData.sireId;
      }
      if (animalData.damId !== undefined) {
        if (!animalData.dam) animalData.dam = animalData.damId;
        delete animalData.damId;
      }
      if (animalData.weight !== undefined && animalData.currentWeight === undefined) {
        animalData.currentWeight = animalData.weight;
        delete animalData.weight;
      }
      // Remove fields that no longer exist on the model
      delete animalData.myNotes;

      const newAnimal = new Animal({
        ...animalData,
        createdAt: new Date()
      });

      await newAnimal.save();
      res.status(201).json(newAnimal);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ error: "Animal with this tagId already exists" });
      }
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withAuth(handler);
