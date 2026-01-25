import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const { name, email, password, role } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Name, email, and PIN required" });
      }

      // Validate PIN is 4 digits
      if (!/^\d{4}$/.test(password)) {
        return res.status(400).json({ error: "PIN must be exactly 4 digits" });
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        return res.status(409).json({ error: "User with this email already exists" });
      }

      const newUser = new User({
        name,
        email,
        password: "", // Store empty password since we're using PIN
        pin: password, // Store PIN directly (4 digits)
        role: role || "Attendant"
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
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
