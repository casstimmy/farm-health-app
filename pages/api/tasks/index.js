import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import { withAuth } from "@/utils/middleware";
import { createNotification } from "@/utils/notifications";
import { buildLocationFilter } from "@/utils/locationAccess";

async function handler(req, res) {
  await dbConnect();
  const decoded = req.user;

  if (req.method === "GET") {
    try {
      const { status, assignedTo, category, priority } = req.query;
      const filter = {};

      // Apply location-based access control
      const locFilter = buildLocationFilter(decoded);
      if (locFilter) Object.assign(filter, locFilter);

      if (status && status !== "all") filter.status = status;
      if (assignedTo && assignedTo !== "all") filter.assignedTo = assignedTo;
      if (category && category !== "all") filter.category = category;
      if (priority && priority !== "all") filter.priority = priority;

      const tasks = await Task.find(filter)
        .populate("assignedTo", "name email role")
        .populate("assignedBy", "name email")
        .populate("completedBy", "name email")
        .populate("location", "name")
        .populate("animal", "tagId name")
        .sort({ dueDate: 1, priority: -1, createdAt: -1 })
        .lean();

      // Auto-mark overdue tasks
      const now = new Date();
      const updated = tasks.map((t) => {
        if (t.status !== "Completed" && t.dueDate && new Date(t.dueDate) < now) {
          return { ...t, status: "Overdue" };
        }
        return t;
      });

      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch tasks" });
    }
  }

  if (req.method === "POST") {
    try {
      if (!["SuperAdmin", "Manager", "SubAdmin"].includes(decoded.role)) {
        return res.status(403).json({ error: "Only managers can create tasks" });
      }
      const task = await Task.create({
        ...req.body,
        assignedBy: decoded.id,
      });
      const populated = await Task.findById(task._id)
        .populate("assignedTo", "name email role")
        .populate("assignedBy", "name email")
        .populate("location", "name")
        .populate("animal", "tagId name");

      // Notify the assigned user
      if (task.assignedTo) {
        try {
          await createNotification({
            userId: task.assignedTo,
            title: `New Task: ${task.title}`,
            message: `You have been assigned a new task. Priority: ${task.priority}. ${task.dueDate ? "Due: " + new Date(task.dueDate).toLocaleDateString() : ""}`,
            type: "task_assigned",
            relatedModel: "Task",
            relatedId: task._id,
            link: "/manage/tasks",
          });
        } catch (nErr) {
          console.error("Failed to send task notification:", nErr.message);
        }
      }

      return res.status(201).json(populated);
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to create task" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
