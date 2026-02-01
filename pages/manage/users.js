import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaUsers, FaSpinner, FaSave, FaTimes, FaEdit } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import StatsSummary from "@/components/shared/StatsSummary";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";

export default function ManageUsers() {
  const router = useRouter();
  const { user: currentUser, isLoading: roleLoading, isAdmin } = useRole();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState("");
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Check if current user is SuperAdmin
    if (currentUser && !isAdmin()) {
      router.push("/");
      return;
    }

    fetchUsers();
  }, [currentUser, roleLoading]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (userId, currentRole) => {
    setEditingUserId(userId);
    setEditingRole(currentRole);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingRole("");
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
          role: editingRole
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Failed to update user role");
        return;
      }

      const updatedUser = await res.json();
      setUsers(users.map(u => u._id === userId ? updatedUser : u));
      setSuccess("User role updated successfully!");
      setEditingUserId(null);
      setEditingRole("");
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Failed to update user role");
    } finally {
      setSavingUserId(null);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "SuperAdmin":
        return "bg-red-100 text-red-800";
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
      />

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
                          <option value="Manager">📋 Manager</option>
                          <option value="Attendant">👤 Attendant</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)} {user.role}
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
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleEditRole(user._id, user.role)}
                          className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-xs flex items-center gap-1"
                        >
                          <FaEdit />
                          Edit
                        </motion.button>
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
                {users.filter(u => u.role === "SuperAdmin").length}
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
                {users.filter(u => u.role !== "SuperAdmin").length}
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
