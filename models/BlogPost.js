import mongoose from "mongoose";

const BlogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, trim: true, index: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    category: { type: String, default: "General", index: true },
    tags: { type: [String], default: [] },
    author: { type: String, default: "Admin" },
    status: { type: String, enum: ["Draft", "Published"], default: "Draft", index: true },
    showOnSite: { type: Boolean, default: true, index: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.BlogPost || mongoose.model("BlogPost", BlogPostSchema);
