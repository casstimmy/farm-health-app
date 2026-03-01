"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaShieldAlt, FaCheckCircle, FaTimesCircle, FaKey } from "react-icons/fa";
import PageHeader from "@/components/shared/PageHeader";
import { useRole } from "@/hooks/useRole";
import Loader from "@/components/Loader";

export default function RolesPermissions() {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useRole();
  const [roles, setRoles] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Check if user is SuperAdmin
    if (user && !isAdmin()) {
      router.push("/");
      return;
    }

    loadRolesInfo();
  }, [user, isLoading]);

  const loadRolesInfo = () => {
    // Define all system roles with their permissions
    const systemRoles = [
      {
        _id: "1",
        name: "SuperAdmin",
        description: "Full system access and administration",
        color: "from-red-500 to-pink-500",
        bgColor: "bg-red-50",
        badgeColor: "bg-red-100 text-red-800",
        permissions: [
          { feature: "Animals", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Health Records", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Treatments", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Inventory", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Feeding Records", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Weight Tracking", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Finance", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Transactions", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Reports", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Users Management", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Roles & Permissions", access: ["View", "Manage"] },
          { feature: "Business Setup", access: ["View", "Edit"] },
          { feature: "Locations", access: ["View", "Create", "Edit", "Delete"] },
          { feature: "Notifications", access: ["View", "Manage"] }
        ]
      },
      {
        _id: "2",
        name: "Manager",
        description: "Can manage farm operations and view reports",
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50",
        badgeColor: "bg-blue-100 text-blue-800",
        permissions: [
          { feature: "Animals", access: ["View", "Create", "Edit"] },
          { feature: "Health Records", access: ["View", "Create", "Edit"] },
          { feature: "Treatments", access: ["View", "Create", "Edit"] },
          { feature: "Inventory", access: ["View", "Create", "Edit"] },
          { feature: "Feeding Records", access: ["View", "Create", "Edit"] },
          { feature: "Weight Tracking", access: ["View", "Create", "Edit"] },
          { feature: "Finance", access: ["View", "Create", "Edit"] },
          { feature: "Transactions", access: ["View", "Create", "Edit"] },
          { feature: "Reports", access: ["View"] },
          { feature: "Users Management", access: ["View"] },
          { feature: "Roles & Permissions", access: [] },
          { feature: "Business Setup", access: ["View", "Edit"] },
          { feature: "Locations", access: ["View", "Edit"] },
          { feature: "Notifications", access: ["View"] }
        ]
      },
      {
        _id: "3",
        name: "Attendant",
        description: "Can record data and view animal records",
        color: "from-green-500 to-emerald-500",
        bgColor: "bg-green-50",
        badgeColor: "bg-green-100 text-green-800",
        permissions: [
          { feature: "Animals", access: ["View"] },
          { feature: "Health Records", access: ["View", "Create"] },
          { feature: "Treatments", access: ["View", "Create"] },
          { feature: "Inventory", access: ["View"] },
          { feature: "Feeding Records", access: ["View", "Create"] },
          { feature: "Weight Tracking", access: ["View", "Create"] },
          { feature: "Finance", access: [] },
          { feature: "Transactions", access: [] },
          { feature: "Reports", access: [] },
          { feature: "Users Management", access: [] },
          { feature: "Roles & Permissions", access: [] },
          { feature: "Business Setup", access: [] },
          { feature: "Locations", access: [] },
          { feature: "Notifications", access: [] }
        ]
      }
    ];

    setRoles(systemRoles);
    setPageLoading(false);
  };

  const togglePermission = (roleId, featureIdx, permission) => {
    const updatedRoles = roles.map(role => {
      if (role._id === roleId) {
        const updatedPerms = role.permissions.map((perm, idx) => {
          if (idx === featureIdx) {
            const newAccess = perm.access.includes(permission)
              ? perm.access.filter(a => a !== permission)
              : [...perm.access, permission];
            return { ...perm, access: newAccess };
          }
          return perm;
        });
        return { ...role, permissions: updatedPerms };
      }
      return role;
    });
    setRoles(updatedRoles);
  };

  const saveRoleChanges = async () => {
    // This would be saved to the backend in a real app
    // For now, we'll just show a success message
    alert("Role permissions have been updated successfully!");
    setEditingRole(null);
  };

  if (pageLoading || isLoading) {
    return (
      <div className="space-y-8">
        <Loader message="Loading roles & permissions..." color="green-600" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader 
        title="Roles & Permissions" 
        description="Manage user roles and their access levels"
        icon={<FaShieldAlt className="w-8 h-8" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <motion.div
            key={role._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={`${role.bgColor} border-l-4 border-green-600 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all`}
          >
            {/* Role Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center text-white text-2xl shadow-lg`}>
                <FaKey className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{role.name}</h3>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
              <button
                onClick={() => setEditingRole(editingRole === role._id ? null : role._id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  editingRole === role._id
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                {editingRole === role._id ? "Cancel Edit" : "Edit"}
              </button>
            </div>

            {/* Permissions Grid */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {role.permissions.map((perm, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 hover:border-green-400 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-semibold text-gray-900 text-sm">{perm.feature}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {editingRole === role._id ? (
                      <div className="flex flex-wrap gap-2 w-full">
                        {["View", "Create", "Edit", "Delete", "Manage"].map((access) => (
                          <button
                            key={access}
                            onClick={() => togglePermission(role._id, idx, access)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                              perm.access.includes(access)
                                ? `${role.badgeColor} border-2 border-green-500`
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-300"
                            }`}
                          >
                            <FaCheckCircle className="w-3 h-3" />
                            {access}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <>
                        {perm.access.length > 0 ? (
                          perm.access.map((access, i) => (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:shadow-md transition-all ${role.badgeColor}`}
                            >
                              <FaCheckCircle className="w-3 h-3" />
                              {access}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            <FaTimesCircle className="w-3 h-3" />
                            No Access
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* User Count Badge */}
            <div className="mt-6 pt-6 border-t border-gray-300">
              {editingRole === role._id ? (
                <button
                  onClick={saveRoleChanges}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
                >
                  Save Changes
                </button>
              ) : (
                <p className="text-xs text-gray-600 text-center">
                  {role.name === "SuperAdmin" && "👑 System Administrator"}
                  {role.name === "Manager" && "👔 Farm Manager"}
                  {role.name === "Attendant" && "👷 Farm Attendant"}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Role Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-md border border-gray-200"
      >
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaShieldAlt className="w-5 h-5 text-green-600" />
          Permission Levels
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <FaCheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">View</p>
              <p className="text-xs text-gray-600">Read-only access to view data</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <FaCheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Create</p>
              <p className="text-xs text-gray-600">Can add new records</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <FaCheckCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Edit & Delete</p>
              <p className="text-xs text-gray-600">Can modify and remove records</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Current User Info */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="bg-green-50 border-l-4 border-green-600 rounded-2xl p-6 shadow-md"
        >
          <p className="text-gray-700 font-semibold">
            You are logged in as <span className="text-green-600 font-bold">{user.name}</span> with 
            <span className="ml-1 px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold">{user.role}</span> 
            role
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

RolesPermissions.layoutType = "default";
RolesPermissions.layoutProps = { title: "Roles & Permissions" };
