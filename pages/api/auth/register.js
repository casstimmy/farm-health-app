import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const { name, email, pin, role, phone } = req.body;

      if (!email || !pin || !name) {
        return res.status(400).json({ error: "Name, email, and PIN are required" });
      }

      // Validate PIN is 4 digits
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      }

      // Check for existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      // Create new user with PIN only (no password)
      const newUser = new User({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        pin: pin,
        role: role || "Attendant",
        phone: phone || "",
        isActive: true
      });

      await newUser.save();

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Server error. Please try again." });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
