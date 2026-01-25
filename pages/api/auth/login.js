import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { generateToken } from "@/utils/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const { email, pin } = req.body;

      if (!email || !pin) {
        return res.status(400).json({ error: "Email and PIN are required" });
      }

      // Validate PIN format
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ error: "Account is deactivated. Contact administrator." });
      }

      // Verify PIN
      if (user.pin !== pin) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user);

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar || "",
          phone: user.phone || ""
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Server error. Please try again." });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
