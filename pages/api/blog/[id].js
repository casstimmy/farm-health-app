import dbConnect from "@/lib/mongodb";
import BlogPost from "@/models/BlogPost";
import { withRBACAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const post = await BlogPost.findById(id).lean();
      if (!post) return res.status(404).json({ error: "Post not found" });
      return res.status(200).json(post);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const data = req.body || {};
      const post = await BlogPost.findByIdAndUpdate(
        id,
        {
          title: data.title,
          excerpt: data.excerpt || "",
          content: data.content || "",
          coverImage: data.coverImage || "",
          category: data.category || "General",
          tags: Array.isArray(data.tags) ? data.tags : [],
          status: data.status || "Draft",
          showOnSite: data.showOnSite !== false,
          publishedAt: data.status === "Published" ? (data.publishedAt || new Date()) : null,
        },
        { new: true, runValidators: true }
      );
      if (!post) return res.status(404).json({ error: "Post not found" });
      return res.status(200).json(post);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const post = await BlogPost.findByIdAndDelete(id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      return res.status(200).json({ message: "Post deleted" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withRBACAuth(["SuperAdmin", "Manager"])(handler);
