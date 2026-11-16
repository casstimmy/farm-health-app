import multiparty from "multiparty";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import crypto from "crypto";
import { withAuth } from "@/utils/middleware";

const S3BucketName = "image-bucket-admin";

const MAX_FILES = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB each
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp", "gif", "heif", "tiff"]);

async function ImageHandler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = new multiparty.Form({
      maxFilesSize: MAX_FILES * MAX_FILE_BYTES,
      maxFields: 20,
    });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (error, fields, files) => (error ? reject(error) : resolve({ fields, files })));
    });

    const uploads = Array.isArray(files?.file) ? files.file : [];
    if (uploads.length === 0) {
      return res.status(400).json({ error: "No file was uploaded" });
    }
    if (uploads.length > MAX_FILES) {
      return res.status(400).json({ error: `You can upload at most ${MAX_FILES} images at a time` });
    }

    const client = new S3Client({
      region: "eu-west-2",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    });

    const links = [];
    const failedUploads = [];

    // Process all files in parallel
    await Promise.all(
      uploads.map(async (file) => {
        // Random names: not guessable, and no collisions between simultaneous uploads.
        const baseName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

        try {
          if (file.size > MAX_FILE_BYTES) {
            throw new Error("File is larger than 10 MB");
          }

          // sharp only succeeds on real image data, whatever the file is named.
          const metadata = await sharp(file.path).metadata();
          if (!ALLOWED_FORMATS.has(metadata.format)) {
            throw new Error(`Unsupported image type: ${metadata.format || "unknown"}`);
          }

          const format = metadata.format === "png" ? "png" : "jpeg";
          const ext = format;

          // Create full and thumb buffers in parallel
          const [fullBuffer, thumbBuffer] = await Promise.all([
            sharp(file.path)
              .rotate()
              .resize({ width: 1200, withoutEnlargement: true })[format]({ quality: 85 })
              .toBuffer(),
            sharp(file.path)
              .rotate()
              .resize({ width: 400, withoutEnlargement: true })[format]({ quality: 70 })
              .toBuffer(),
          ]);

          const fullKey = `${baseName}.${ext}`;
          const thumbKey = `${baseName}_thumb.${ext}`;

          // Upload both buffers in parallel
          await Promise.all([
            client.send(
              new PutObjectCommand({
                Bucket: S3BucketName,
                Key: fullKey,
                Body: fullBuffer,
                ACL: "public-read",
                ContentType: `image/${ext}`,
              })
            ),
            client.send(
              new PutObjectCommand({
                Bucket: S3BucketName,
                Key: thumbKey,
                Body: thumbBuffer,
                ACL: "public-read",
                ContentType: `image/${ext}`,
              })
            ),
          ]);

          links.push({
            full: `https://${S3BucketName}.s3.amazonaws.com/${fullKey}`,
            thumb: `https://${S3BucketName}.s3.amazonaws.com/${thumbKey}`,
          });
        } catch (err) {
          console.error("Upload failed for file:", file.originalFilename, err.message);
          failedUploads.push(file.originalFilename);
        }
      })
    );

    if (links.length === 0) {
      return res.status(400).json({
        error: "None of the files could be uploaded. Use JPG or PNG images under 10 MB.",
        failedUploads,
      });
    }

    res.status(200).json({
      message: "Upload finished",
      links,
      failedUploads: failedUploads.length ? failedUploads : null,
      fields,
    });
  } catch (err) {
    console.error("Error during file upload:", err);
    const tooLarge = err?.code === "ETOOBIG" || err?.statusCode === 413;
    res.status(tooLarge ? 413 : 500).json({
      error: tooLarge ? "Upload is too large (10 MB per image)" : "File upload failed",
    });
  }
}

// Only logged-in staff may upload.
export default withAuth(ImageHandler);

export const config = {
  api: { bodyParser: false },
};
