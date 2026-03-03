import dbConnect from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { withAuth } from "@/utils/middleware";

async function handler(req, res) {
  await dbConnect();
  const decoded = req.user;

  if (req.method === "GET") {
    try {
      const { unreadOnly } = req.query;
      const filter = { user: decoded.id };
      if (unreadOnly === "true") filter.isRead = false;

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const unreadCount = await Notification.countDocuments({ user: decoded.id, isRead: false });

      return res.status(200).json({ notifications, unreadCount });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { markAllRead, notificationId } = req.body;
      if (markAllRead) {
        await Notification.updateMany({ user: decoded.id, isRead: false }, { isRead: true });
        return res.status(200).json({ message: "All notifications marked as read" });
      }
      if (notificationId) {
        await Notification.findOneAndUpdate(
          { _id: notificationId, user: decoded.id },
          { isRead: true }
        );
        return res.status(200).json({ message: "Notification marked as read" });
      }
      return res.status(400).json({ error: "Provide markAllRead or notificationId" });
    } catch (err) {
      return res.status(500).json({ error: "Failed to update notifications" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default withAuth(handler);
