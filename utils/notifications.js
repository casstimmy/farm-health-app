import Notification from "@/models/Notification";

/**
 * Create a notification for a user
 * @param {Object} params
 * @param {string} params.userId - The user to notify
 * @param {string} params.title - Notification title
 * @param {string} params.message - Detail message
 * @param {string} params.type - Type: task_assigned, task_reminder, order_new, system, alert
 * @param {string} params.relatedModel - Model name: Task, Order, Animal
 * @param {string} params.relatedId - ID of related document
 * @param {string} params.link - Frontend link to navigate to
 */
export async function createNotification({ userId, title, message = "", type = "system", relatedModel = "", relatedId = null, link = "" }) {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      relatedModel,
      relatedId,
      isRead: false,
      link,
    });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotifications(userIds, { title, message = "", type = "system", relatedModel = "", relatedId = null, link = "" }) {
  try {
    const docs = userIds.map((userId) => ({
      user: userId,
      title,
      message,
      type,
      relatedModel,
      relatedId,
      isRead: false,
      link,
    }));
    await Notification.insertMany(docs);
  } catch (err) {
    console.error("Failed to create notifications:", err.message);
  }
}
