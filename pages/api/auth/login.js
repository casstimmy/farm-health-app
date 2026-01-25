import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { generateToken } from "@/utils/auth";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "POST") {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password/PIN required" });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      let isPasswordValid = false;

      // Check if input is 4-digit PIN
      if (/^\d{4}$/.test(password)) {
        // PIN-based login: compare with stored PIN
        if (user.pin && user.pin === password) {
          isPasswordValid = true;
        } else if (!user.pin) {
          // For demo mode: allow any 4-digit PIN if no PIN is set
          isPasswordValid = true;
        } else {
          isPasswordValid = false;
        }
      } else {
        // Password-based login: check against bcrypt hashed password
        isPasswordValid = await bcrypt.compare(password, user.password);
      }

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = generateToken(user);

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
