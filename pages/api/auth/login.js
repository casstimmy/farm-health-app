import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/utils/auth";
import { withRateLimit } from "@/lib/rateLimit";
import {
  isValidPinFormat,
  verifyPin,
  hashPin,
  MAX_FAILED_ATTEMPTS,
  LOCK_MINUTES,
} from "@/utils/pin";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    // Force plain strings so a crafted JSON body can't smuggle in a query object.
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const pin = typeof req.body?.pin === "string" ? req.body.pin : "";

    if (!email || !pin) {
      return res.status(400).json({ error: "Email and PIN are required" });
    }

    if (!isValidPinFormat(pin)) {
      return res.status(400).json({ error: "PIN must be exactly 4 digits" });
    }

    const user = await User.findOne({ email }).select("+pin");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Account is not active. Contact your administrator." });
    }

    const now = Date.now();
    if (user.lockUntil && user.lockUntil.getTime() > now) {
      const minutes = Math.ceil((user.lockUntil.getTime() - now) / 60000);
      return res.status(429).json({
        error: `Too many wrong PINs. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
      });
    }

    const { ok, needsRehash } = await verifyPin(pin, user.pin);

    if (!ok) {
      const attempts = (user.failedLoginAttempts || 0) + 1;
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await User.updateOne(
          { _id: user._id },
          { $set: { failedLoginAttempts: 0, lockUntil: new Date(now + LOCK_MINUTES * 60000) } }
        );
        return res.status(429).json({
          error: `Too many wrong PINs. This account is locked for ${LOCK_MINUTES} minutes.`,
        });
      }
      await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: attempts } });
      const left = MAX_FAILED_ATTEMPTS - attempts;
      return res.status(401).json({
        error: `Invalid PIN. ${left} attempt${left === 1 ? "" : "s"} left.`,
      });
    }

    // Success: clear the failure counter, and upgrade a legacy plain PIN to a hash.
    const update = { failedLoginAttempts: 0, lockUntil: null, lastLogin: new Date() };
    if (needsRehash) update.pin = await hashPin(pin);
    await User.updateOne({ _id: user._id }, { $set: update });

    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location || null,
        locations: user.locations || [],
        avatar: user.avatar || "",
        phone: user.phone || "",
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}

// Per-device brake on top of the per-account lock above.
export default withRateLimit(
  { keyPrefix: "auth-login", methods: ["POST"], windowMs: 5 * 60 * 1000, max: 40 },
  handler
);
