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
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input-field md:col-span-2" placeholder="Post title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input-field" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Cover Image Upload</label>
            <input type="file" accept="image/*" className="input-field" onChange={handleCoverUpload} disabled={uploadingCover} />
            {uploadingCover && <p className="text-xs text-gray-500 mt-1">Uploading cover image...</p>}
            {form.coverImage && (
              <div className="mt-2 flex items-center gap-3">
                <img src={form.coverImage} alt="Cover preview" className="w-16 h-16 object-cover rounded-lg border" />
                <button type="button" onClick={() => setForm({ ...form, coverImage: "" })} className="text-xs px-2 py-1 border border-red-200 text-red-700 rounded-lg">Remove</button>
              </div>
            )}
          </div>
          <input className="input-field" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </div>
        <textarea className="input-field" rows={2} placeholder="Excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        <textarea className="input-field" rows={6} placeholder="Post content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <div className="flex flex-wrap items-center gap-4">
          <select className="input-field w-44" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.showOnSite} onChange={(e) => setForm({ ...form, showOnSite: e.target.checked })} />
            Show On Site
          </label>
          <div className="flex gap-2 ml-auto">
            {editingId && <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>}
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
              {editingId ? "Update" : "Create"} Post
            </button>
          </div>
        </div>
      </form>

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
