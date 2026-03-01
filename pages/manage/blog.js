"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PageHeader from "@/components/shared/PageHeader";
import Loader from "@/components/Loader";
import { useRole } from "@/hooks/useRole";

const initialForm = {
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  category: "General",
  tags: "",
  status: "Draft",
  showOnSite: true,
};

export default function BlogManagement() {
  const router = useRouter();
  const { user, isLoading: roleLoading } = useRole();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const actionBtnClass = "px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors";

  useEffect(() => {
    if (roleLoading) return;
    if (!user || !["SuperAdmin", "Manager"].includes(user.role)) {
      router.push("/");
      return;
    }
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleLoading, user]);

  const fetchPosts = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/blog", { headers: { Authorization: `Bearer ${token}` } });
      const data = res.ok ? await res.json() : [];
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const url = editingId ? `/api/blog/${editingId}` : "/api/blog";
      const method = editingId ? "PUT" : "POST";
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save post");
      }
      resetForm();
      fetchPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (post) => {
    setEditingId(post._id);
    setForm({
      title: post.title || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      coverImage: post.coverImage || "",
      category: post.category || "General",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      status: post.status || "Draft",
      showOnSite: post.showOnSite !== false,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this blog post?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete post");
      fetchPosts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Failed to upload cover image");
      const data = await res.json();
      const uploaded = data?.links?.[0];
      const url = uploaded?.full || uploaded || "";
      if (!url) throw new Error("No image URL returned");
      setForm((prev) => ({ ...prev, coverImage: url }));
    } catch (err) {
      setError(err.message || "Cover image upload failed");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Management"
        subtitle="Manage e-commerce blog posts, visibility, and publishing status"
        gradient="from-violet-600 to-indigo-700"
        icon="📝"
      />

      {(loading || roleLoading) && (
        <div className="bg-white rounded-xl border border-gray-200 p-10">
          <Loader message="Loading blog posts..." color="green-600" />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      {!loading && !roleLoading && (
      <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Blog Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input-field" placeholder="Post title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="input-field" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Cover Image Upload</label>
              <input type="file" accept="image/*" className="input-field" onChange={handleCoverUpload} disabled={uploadingCover} />
              {uploadingCover && <p className="text-xs text-gray-500 mt-1">Uploading cover image...</p>}
              {form.coverImage && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={form.coverImage} alt="Cover preview" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                  <button type="button" onClick={() => setForm({ ...form, coverImage: "" })} className="text-xs px-3 py-1.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-semibold">Remove</button>
                </div>
              )}
            </div>

            <textarea className="input-field" rows={2} placeholder="Excerpt (short summary)" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Post Content</label>
              <textarea className="input-field" rows={8} placeholder="Write your post content here..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>

            <input className="input-field" placeholder="Tags (comma separated, e.g: farming, animals, tips)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />

            <div className="h-px bg-gray-300 my-4" />

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-600">Status:</label>
                <select className="input-field w-40" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </div>
              
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.showOnSite} onChange={(e) => setForm({ ...form, showOnSite: e.target.checked })} className="w-4 h-4 rounded" />
                Show On Site
              </label>
              
              <div className="flex gap-2 ml-auto">
                {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>}
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-semibold disabled:bg-gray-400">
                  {editingId ? "Update" : "Create"} Post
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Blog Preview Panel */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border-2 border-violet-200 p-5 sticky top-20 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">👁️ Preview</h3>
            
            {/* Cover Image Preview */}
            {form.coverImage && (
              <div className="rounded-xl overflow-hidden border-2 border-violet-300 bg-white">
                <img src={form.coverImage} alt="Cover" className="w-full h-40 object-cover" />
              </div>
            )}
            
            {/* Blog Card Preview */}
            <div className="bg-white rounded-xl border border-violet-200 p-4 space-y-3 shadow-sm hover:shadow-md transition-all">
              <div className="space-y-2">
                <div className="flex items-start gap-2 justify-between">
                  <h2 className="text-lg font-bold text-gray-900 line-clamp-2">{form.title || "Your Post Title"}</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    form.status === "Published" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>{form.status}</span>
                </div>
                
                <div className="flex gap-2 items-center text-xs text-gray-500">
                  <span className="bg-violet-100 text-violet-700 px-2 py-1 rounded-full font-semibold">{form.category || "General"}</span>
                  {form.showOnSite ? (
                    <span className="text-green-700 font-semibold">✓ Visible</span>
                  ) : (
                    <span className="text-orange-700 font-semibold">⊘ Hidden</span>
                  )}
                </div>
              </div>

              <div className="h-px bg-violet-200" />

              {form.excerpt && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-700 line-clamp-2">{form.excerpt}</p>
                </div>
              )}

              {form.content && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 line-clamp-3">{form.content}</p>
                </div>
              )}

              {form.tags && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {form.tags.split(",").map((tag, idx) => (
                    <span key={idx} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-400 pt-2">
                📅 {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-900 mb-2">💡 Preview Tips:</p>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li>Title must be provided</li>
                <li>Featured image recommended</li>
                <li>Excerpt appears in listings</li>
                <li>Tags help with search</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold">Title</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Category</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Status</th>
              <th className="px-4 py-3 text-left text-xs font-bold">Show On Site</th>
              <th className="px-4 py-3 text-center text-xs font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((post) => (
              <tr key={post._id}>
                <td className="px-4 py-3 text-sm font-semibold">{post.title}</td>
                <td className="px-4 py-3 text-sm">{post.category || "General"}</td>
                <td className="px-4 py-3 text-sm">{post.status}</td>
                <td className="px-4 py-3 text-sm">{post.showOnSite ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(post)} className={`${actionBtnClass} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}>Edit</button>
                    <button onClick={() => handleDelete(post._id)} className={`${actionBtnClass} border-red-200 bg-red-50 text-red-700 hover:bg-red-100`}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>No blog posts yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}

BlogManagement.layoutType = "default";
BlogManagement.layoutProps = { title: "Blog Management" };
