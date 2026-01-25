import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import sharp from "sharp";
import { verifyToken, getTokenFromRequest } from "@/utils/auth";

// Create directories if they don't exist
const uploadDir = path.join(process.cwd(), "public/uploads");
const animalsDir = path.join(uploadDir, "animals");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(animalsDir)) {
  fs.mkdirSync(animalsDir, { recursive: true });
}

export default async function handler(req, res) {
  // Verify auth
  const token = getTokenFromRequest(req);
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { file } = req.body;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Handle base64 encoded file
    const base64Data = file.split(",")[1] || file;
    const buffer = Buffer.from(base64Data, "base64");

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const filename = `${timestamp}_${randomStr}.jpg`;
    const thumbFilename = `${timestamp}_${randomStr}_thumb.jpg`;

    // Full path
    const fullPath = path.join(animalsDir, filename);
    const thumbPath = path.join(animalsDir, thumbFilename);

    // Resize and save full image
    await sharp(buffer)
      .resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 })
      .toFile(fullPath);

    // Resize and save thumbnail
    await sharp(buffer)
      .resize(400, 400, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 70 })
      .toFile(thumbPath);

    // Return URLs
    res.status(200).json({
      full: `/uploads/animals/${filename}`,
      thumb: `/uploads/animals/${thumbFilename}`,
      message: "Image uploaded successfully"
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

