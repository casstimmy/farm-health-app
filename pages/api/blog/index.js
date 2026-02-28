import dbConnect from "@/lib/mongodb";
import BlogPost from "@/models/BlogPost";
import { withRBACAuth } from "@/utils/middleware";

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const posts = await BlogPost.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json(posts);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const data = req.body || {};
      const title = data.title?.trim();
      if (!title) return res.status(400).json({ error: "Title is required" });

      const baseSlug = slugify(data.slug || title);
      let slug = baseSlug || `post-${Date.now()}`;
      let counter = 1;
      while (await BlogPost.findOne({ slug })) {
        slug = `${baseSlug}-${counter++}`;
      }

      const post = await BlogPost.create({
        title,
        slug,
        excerpt: data.excerpt || "",
        content: data.content || "",
        coverImage: data.coverImage || "",
        category: data.category || "General",
        tags: Array.isArray(data.tags) ? data.tags : [],
        author: data.author || req.user?.name || "Admin",
        status: data.status || "Draft",
        showOnSite: data.showOnSite !== false,
        publishedAt: data.status === "Published" ? new Date() : null,
      });

      return res.status(201).json(post);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
