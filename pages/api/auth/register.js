import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { verifyToken, getTokenFromRequest } from "@/utils/auth";
import { withRateLimit } from "@/lib/rateLimit";
import { isValidPinFormat, hashPin } from "@/utils/pin";
import { ALL_ROLES, isObjectId } from "@/utils/permissions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Is the caller a logged-in, active SuperAdmin?
 * (Checked against the database, not just the token.)
 */
async function getCallingSuperAdmin(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded?.id) return null;
  const caller = await User.findById(decoded.id).select("role isActive").lean();
  return caller && caller.isActive !== false && caller.role === "SuperAdmin" ? caller : null;
}

/**
 * POST /api/auth/register
 *
 * Three cases:
 *  1. Called by a SuperAdmin (Users page): may choose the role and locations;
 *     the account is active immediately.
 *  2. Very first account in an empty system: becomes the SuperAdmin, so a new
 *     install can be set up.
 *  3. Anyone else (public sign-up page): always an Attendant, and inactive
 *     until a SuperAdmin activates it. The role in the request is ignored.
 */
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const body = req.body || {};
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const pin = typeof body.pin === "string" ? body.pin : "";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";

    if (!email || !pin || !name) {
      return res.status(400).json({ error: "Name, email, and PIN are required" });
    }
    if (!EMAIL_PATTERN.test(email) || email.length > 200) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    if (!isValidPinFormat(pin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    }

    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const superAdmin = await getCallingSuperAdmin(req);
    const isFirstUser = !superAdmin && (await User.estimatedDocumentCount()) === 0;

    let role = "Attendant";
    let isActive = false;
    let location = null;
    let locations = [];

    if (superAdmin) {
      if (body.role !== undefined && !ALL_ROLES.includes(body.role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${ALL_ROLES.join(", ")}` });
      }
      role = body.role || "Attendant";
      isActive = true;
      if (isObjectId(body.location)) location = body.location;
      if (Array.isArray(body.locations)) locations = body.locations.filter(isObjectId);
    } else if (isFirstUser) {
      role = "SuperAdmin";
      isActive = true;
    }

    const newUser = await User.create({
      name,
      email,
      pin: await hashPin(pin),
      role,
      phone,
      isActive,
      location,
      locations,
    });

    return res.status(201).json({
      message: isActive
        ? "User registered successfully"
        : "Account created. An administrator must activate it before you can log in.",
      pendingActivation: !isActive,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "User with this email already exists" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}

export default withRateLimit(
  { keyPrefix: "auth-register", methods: ["POST"], windowMs: 10 * 60 * 1000, max: 20 },
  handler
);
