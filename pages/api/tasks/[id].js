import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import { withAuth } from "@/utils/middleware";
import { MANAGE } from "@/utils/permissions";
import { createNotification } from "@/utils/notifications";

async function handler(req, res) {
  await dbConnect();
  const decoded = req.user;

  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const task = await Task.findById(id)
        .populate("assignedTo", "name email role")
        .populate("assignedBy", "name email")
        .populate("completedBy", "name email")
        .populate("location", "name")
        .populate("animal", "tagId name");
      if (!task) return res.status(404).json({ error: "Task not found" });
      return res.status(200).json(task);
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch task" });
    }
  }

  if (req.method === "PUT") {
    try {
      let updates = { ...req.body };

      // Attendants may only report progress on a task (status + notes).
      // Reassigning, re-prioritising or rewriting a task is for managers.
      if (!MANAGE.includes(decoded.role)) {
        const progressOnly = {};
        if (updates.status !== undefined) progressOnly.status = updates.status;
        if (updates.notes !== undefined) progressOnly.notes = updates.notes;
        updates = progressOnly;
      }
      // These are set by the server, never by the request.
      delete updates._id;
      delete updates.assignedBy;
      delete updates.completedBy;
      delete updates.completedAt;

      // If marking completed, record who and when
      if (updates.status === "Completed") {
        updates.completedAt = new Date();
        updates.completedBy = decoded.id;
      }
      // If un-completing, clear completion fields
      if (updates.status && updates.status !== "Completed") {
        updates.completedAt = null;
        updates.completedBy = null;
      }

      const task = await Task.findByIdAndUpdate(id, updates, { new: true })
        .populate("assignedTo", "name email role")
        .populate("assignedBy", "name email")
        .populate("completedBy", "name email")
        .populate("location", "name")
        .populate("animal", "tagId name");
      if (!task) return res.status(404).json({ error: "Task not found" });

      // If recurring and completed, create next instance
      if (task.status === "Completed" && task.isRecurring && task.recurringInterval) {
        const nextDue = new Date(task.dueDate || Date.now());
        switch (task.recurringInterval) {
          case "Daily": nextDue.setDate(nextDue.getDate() + 1); break;
          case "Weekly": nextDue.setDate(nextDue.getDate() + 7); break;
          case "Biweekly": nextDue.setDate(nextDue.getDate() + 14); break;
          case "Monthly": nextDue.setMonth(nextDue.getMonth() + 1); break;
          case "Bi-Monthly": nextDue.setMonth(nextDue.getMonth() + 2); break;
          case "Quarterly": nextDue.setMonth(nextDue.getMonth() + 3); break;
          case "Yearly": nextDue.setFullYear(nextDue.getFullYear() + 1); break;
        }
        await Task.create({
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          assignedTo: task.assignedTo?._id || task.assignedTo,
          assignedBy: task.assignedBy?._id || task.assignedBy,
          location: task.location?._id || task.location,
          paddock: task.paddock || "",
          animal: task.animal?._id || task.animal,
          dueDate: nextDue,
          isRecurring: true,
          recurringInterval: task.recurringInterval,
          notes: task.notes,
          status: "Pending",
        });
      }

      return res.status(200).json(task);
    } catch (err) {
      return res.status(500).json({ error: err.message || "Failed to update task" });
    }
  }

  if (req.method === "DELETE") {
    try {
      if (!["SuperAdmin", "SubAdmin", "Manager"].includes(decoded.role)) {
        return res.status(403).json({ error: "Only managers can delete tasks" });
      }
      const task = await Task.findByIdAndDelete(id);
      if (!task) return res.status(404).json({ error: "Task not found" });
      return res.status(200).json({ message: "Task deleted" });
    } catch (err) {
      return res.status(500).json({ error: "Failed to delete task" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
