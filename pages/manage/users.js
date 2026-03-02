import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { FaUsers, FaSpinner, FaSave, FaTimes, FaEdit, FaPlus, FaUserPlus, FaTrash } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";

export default function ManageUsers() {
  const router = useRouter();
  const { user: currentUser, isLoading: roleLoading, isAdmin } = useRole();
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState("");
  const [editingLocation, setEditingLocation] = useState("");
  const [editingLocations, setEditingLocations] = useState([]);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Add User form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ name: "", email: "", pin: "", role: "Attendant", location: "", locations: [], phone: "" });
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Check if current user is SuperAdmin or SubAdmin
    if (currentUser && !["SuperAdmin", "SubAdmin"].includes(currentUser.role)) {
      router.push("/");
      return;
    }

    fetchData();
  }, [currentUser, roleLoading]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [usersRes, locRes] = await Promise.all([
        fetch("/api/users", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("/api/locations", { headers: { "Authorization": `Bearer ${token}` } }),
      ]);
      const usersData = await usersRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
      if (locRes.ok) {
        const locsData = await locRes.json();
        setLocations(Array.isArray(locsData) ? locsData : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (userId, currentRole, currentLocation) => {
    const editUser = users.find(u => u._id === userId);
    setEditingUserId(userId);
    setEditingRole(currentRole);
    setEditingLocation(currentLocation?._id || currentLocation || "");
    setEditingLocations((editUser?.locations || []).map(l => l._id || l));
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingRole("");
    setEditingLocation("");
    setEditingLocations([]);
  };

  const handleSaveRole = async (userId) => {
    try {
      setSavingUserId(userId);
      setError("");
      const token = localStorage.getItem("token");
      
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId,
          role: editingRole,
          location: editingLocation || null,
          locations: editingLocations.length > 0 ? editingLocations : [],
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update user role");
        return;
      }

      const updatedUser = await res.json();
      setUsers(users.map(u => u._id === userId ? updatedUser : u));
      setSuccess("User updated successfully!");
      setEditingUserId(null);
      setEditingRole("");
      setEditingLocation("");
      setEditingLocations([]);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user role");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!addUserForm.name || !addUserForm.email || !addUserForm.pin) {
      setError("Name, Email, and PIN are required.");
      return;
    }
    if (!/^\d{4}$/.test(addUserForm.pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    setAddingUser(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addUserForm.name.trim(),
          email: addUserForm.email.trim().toLowerCase(),
          pin: addUserForm.pin,
          role: addUserForm.role || "Attendant",
          phone: addUserForm.phone || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register user");
      // If a location was selected, assign it
      if ((addUserForm.location || addUserForm.locations?.length) && data.user?.id) {
        const token = localStorage.getItem("token");
        await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ userId: data.user.id, location: addUserForm.location, locations: addUserForm.locations || [] }),
        });
      }
      setSuccess(`User "${addUserForm.name}" created successfully!`);
      setAddUserForm({ name: "", email: "", pin: "", role: "Attendant", location: "", locations: [], phone: "" });
      setShowAddUser(false);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to add user");
    } finally {
      setAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      setError("");
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user");
      }
      setSuccess("User deleted successfully!");
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "SuperAdmin":
        return "bg-red-100 text-red-800";
      case "SubAdmin":
        return "bg-orange-100 text-orange-800";
      case "Manager":
        return "bg-blue-100 text-blue-800";
      case "Attendant":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "SuperAdmin":
        return "👑";
      case "SubAdmin":
        return "🔑";
      case "Manager":
        return "📋";
      case "Attendant":
        return "👤";
      default:
        return "👥";
    }
  };

  const roleCounts = {
    superAdmin: users.filter(u => u.role === "SuperAdmin").length,
    subAdmin: users.filter(u => u.role === "SubAdmin").length,
    manager: users.filter(u => u.role === "Manager").length,
    attendant: users.filter(u => u.role === "Attendant").length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Page Header */}
      <PageHeader
        title="User Management"
        subtitle="Manage farm staff and access roles"
        gradient="from-orange-600 to-orange-700"
        icon="👥"
        actions={
          <button
            onClick={() => { setShowAddUser(!showAddUser); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
          >
            {showAddUser ? <FaTimes /> : <FaUserPlus />}
            {showAddUser ? "Cancel" : "Add User"}
          </button>
        }
      />

      {/* Add User Form */}
      <AnimatePresence>
        {showAddUser && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><FaUserPlus /> Add New User</h3>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Full Name *</label>
                  <input type="text" value={addUserForm.name} onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Email *</label>
                  <input type="email" value={addUserForm.email} onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" placeholder="user@farm.com" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">4-Digit PIN *</label>
                  <input type="text" maxLength={4} value={addUserForm.pin} onChange={(e) => setAddUserForm({ ...addUserForm, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 text-center tracking-widest font-mono text-lg" placeholder="0000" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Role</label>
                  <select value={addUserForm.role} onChange={(e) => setAddUserForm({ ...addUserForm, role: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500">
                    <option value="SuperAdmin">👑 SuperAdmin</option>
                    <option value="SubAdmin">🔑 SubAdmin</option>
                    <option value="Manager">📋 Manager</option>
                    <option value="Attendant">👤 Attendant</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Location</label>
                  <select value={addUserForm.location} onChange={(e) => setAddUserForm({ ...addUserForm, location: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500">
                    <option value="">No Location / All</option>
                    {locations.map((loc) => <option key={loc._id} value={loc._id}>{loc.name}</option>)}
                  </select>
                </div>
                {addUserForm.role === "SubAdmin" && (
                  <div className="col-span-full">
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Assigned Locations (SubAdmin can manage multiple)</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border-2 border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                      {locations.map((loc) => (
                        <label key={loc._id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-orange-50 rounded-lg cursor-pointer text-sm">
                          <input type="checkbox" checked={(addUserForm.locations || []).includes(loc._id)}
                            onChange={(e) => {
                              const locs = addUserForm.locations || [];
                              setAddUserForm({ ...addUserForm, locations: e.target.checked ? [...locs, loc._id] : locs.filter(l => l !== loc._id) });
                            }}
                            className="w-4 h-4 text-orange-600 rounded" />
                          <span>{loc.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Phone</label>
                  <input type="text" value={addUserForm.phone} onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500" placeholder="Optional" />
                </div>
              </div>
              <motion.button type="submit" disabled={addingUser} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                {addingUser ? <><FaSpinner className="animate-spin" /> Creating...</> : <><FaUserPlus /> Create User</>}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Stats */}
      <StatsSummary
        stats={[
          {
            label: "Total Users",
            value: users.length,
            bgColor: "bg-gray-50",
            borderColor: "border-gray-200",
            textColor: "text-gray-900",
            icon: "👥",
          },
          {
            label: "Super Admins",
            value: roleCounts.superAdmin,
            bgColor: "bg-red-50",
            borderColor: "border-red-200",
            textColor: "text-red-700",
            icon: "👑",
          },
          {
            label: "Sub Admins",
            value: roleCounts.subAdmin,
            bgColor: "bg-orange-50",
            borderColor: "border-orange-200",
            textColor: "text-orange-700",
            icon: "🔑",
          },
          {
            label: "Managers",
            value: roleCounts.manager,
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-700",
            icon: "📋",
          },
          {
            label: "Attendants",
            value: roleCounts.attendant,
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            textColor: "text-green-700",
            icon: "👤",
          },
        ]}
      />

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border-l-4 border-red-600 rounded-lg text-red-700 font-semibold"
          >
            {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-50 border-l-4 border-green-600 rounded-lg text-green-700 font-semibold"
          >
            {success}
          </motion.div>
        )}

        {loading || roleLoading ? (
          <Loader message="Loading users..." color="green-600" />
        ) : users.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <FaUsers className="text-5xl mb-3 mx-auto text-gray-400" />
            <p className="text-gray-700 font-semibold text-lg">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user, index) => (
                  <motion.tr
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-lg text-xs font-semibold">
                        {user.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingUserId === user._id ? (
                        <select
                          value={editingRole}
                          onChange={(e) => setEditingRole(e.target.value)}
                          className="px-3 py-2 border-2 border-green-400 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                        >
                          <option value="SuperAdmin">👑 SuperAdmin</option>
                          <option value="SubAdmin">🔑 SubAdmin</option>
                          <option value="Manager">📋 Manager</option>
                          <option value="Attendant">👤 Attendant</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)} {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingUserId === user._id ? (
                        <div className="space-y-2">
                          <select
                            value={editingLocation}
                            onChange={(e) => setEditingLocation(e.target.value)}
                            className="px-3 py-2 border-2 border-blue-400 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 w-full"
                          >
                            <option value="">All Locations</option>
                            {locations.map((loc) => (
                              <option key={loc._id} value={loc._id}>{loc.name}</option>
                            ))}
                          </select>
                          {editingRole === "SubAdmin" && (
                            <div className="border-2 border-orange-300 rounded-lg p-2 max-h-32 overflow-y-auto bg-orange-50">
                              <p className="text-xs font-semibold text-orange-800 mb-1">Multi-Locations:</p>
                              {locations.map((loc) => (
                                <label key={loc._id} className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-orange-100 rounded cursor-pointer text-xs">
                                  <input type="checkbox" checked={editingLocations.includes(loc._id)}
                                    onChange={(e) => {
                                      setEditingLocations(prev => e.target.checked ? [...prev, loc._id] : prev.filter(l => l !== loc._id));
                                    }}
                                    className="w-3.5 h-3.5 text-orange-600 rounded" />
                                  <span>{loc.name}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-700">
                          {user.role === "SuperAdmin" ? (
                            <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg text-xs font-semibold">🌐 All Locations</span>
                          ) : user.locations && user.locations.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.locations.map((loc) => (
                                <span key={loc._id || loc} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-semibold">📍 {loc.name || loc}</span>
                              ))}
                            </div>
                          ) : user.location?.name ? (
                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-semibold">📍 {user.location.name}</span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      📅 {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {editingUserId === user._id ? (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSaveRole(user._id)}
                            disabled={savingUserId === user._id}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-xs flex items-center gap-1 disabled:opacity-50"
                          >
                            {savingUserId === user._id ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            Save
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancelEdit}
                            disabled={savingUserId === user._id}
                            className="px-3 py-1 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1 disabled:opacity-50"
                          >
                            <FaTimes />
                            Cancel
                          </motion.button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleEditRole(user._id, user.role, user.location)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-xs flex items-center gap-1"
                          >
                            <FaEdit />
                            Edit
                          </motion.button>
                          {currentUser?.role === "SuperAdmin" && user._id !== currentUser.id && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteUser(user._id)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold text-xs flex items-center gap-1"
                            >
                              <FaTrash />
                            </motion.button>
                          )}
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Stats */}
        {users.length > 0 && (
          <div className="mt-8 pt-8 border-t-2 border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6"
            >
              <p className="text-gray-600 text-sm font-semibold">Total Users</p>
              <p className="text-4xl font-black text-green-600 mt-2">{users.length}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6"
            >
              <p className="text-gray-600 text-sm font-semibold">Administrators</p>
              <p className="text-4xl font-black text-red-600 mt-2">
                {users.filter(u => ["SuperAdmin", "SubAdmin"].includes(u.role)).length}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6"
            >
              <p className="text-gray-600 text-sm font-semibold">Managers & Attendants</p>
              <p className="text-4xl font-black text-purple-600 mt-2">
                {users.filter(u => !["SuperAdmin", "SubAdmin"].includes(u.role)).length}
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

ManageUsers.layoutType = "default";
ManageUsers.layoutProps = { title: "User Management" };
