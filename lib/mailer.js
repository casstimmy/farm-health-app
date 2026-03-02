import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an order status update email to a customer.
 * @param {Object} opts
 * @param {string} opts.to - recipient email
 * @param {string} opts.customerName - customer display name
 * @param {string} opts.orderNumber - e.g. ORD-20260301-1234
 * @param {string} opts.status - Confirmed | Processing | Completed
 * @param {Array}  opts.items - order line items [{description, quantity, unitPrice}]
 * @param {number} opts.total
 * @param {string} opts.currency - e.g. "NGN"
 * @param {string} opts.businessName
 * @param {string} [opts.notes]
 */
export async function sendOrderStatusEmail({
  to,
  customerName,
  orderNumber,
  status,
  items = [],
  total = 0,
  currency = "NGN",
  businessName = "Farm Manager",
  notes = "",
}) {
  const statusMessages = {
    Confirmed: "Your order has been confirmed and is being prepared.",
    Processing: "Your order is now being processed.",
    Completed: "Your order has been completed and is ready!",
  };

  const statusColors = {
    Confirmed: "#2563eb",
    Processing: "#d97706",
    Completed: "#16a34a",
  };

  const statusEmoji = {
    Confirmed: "✅",
    Processing: "🔄",
    Completed: "🎉",
  };

  const formatPrice = (amount) => {
    const num = Number(amount || 0);
    return `${currency} ${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const itemRows = items
    .map(
      (item, i) =>
        `<tr style="background:${i % 2 === 0 ? "#ffffff" : "#f9fafb"};">
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;">${item.description || "Item"}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:14px;">${item.quantity || 1}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;">${formatPrice(item.unitPrice || item.price || 0)}</td>
          <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:14px;font-weight:600;">${formatPrice((item.quantity || 1) * (item.unitPrice || item.price || 0))}</td>
        </tr>`
    )
    .join("");

  const color = statusColors[status] || "#6b7280";
  const emoji = statusEmoji[status] || "📦";
  const message = statusMessages[status] || `Your order status has been updated to ${status}.`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <!-- Header -->
        <tr>
          <td style="background:${color};padding:28px 32px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:22px;">${emoji} Order ${status}</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${orderNumber}</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="font-size:16px;color:#1f2937;margin:0 0 8px;">Dear <strong>${customerName}</strong>,</p>
            <p style="font-size:14px;color:#4b5563;margin:0 0 24px;line-height:1.6;">${message}</p>

            <!-- Status Badge -->
            <div style="text-align:center;margin-bottom:24px;">
              <span style="display:inline-block;background:${color};color:#fff;padding:8px 24px;border-radius:20px;font-size:14px;font-weight:700;letter-spacing:0.5px;">${status.toUpperCase()}</span>
            </div>

            <!-- Items Table -->
            ${items.length > 0 ? `
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 16px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:700;border-bottom:2px solid #e5e7eb;">Item</th>
                  <th style="padding:10px 16px;text-align:center;font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:700;border-bottom:2px solid #e5e7eb;">Qty</th>
                  <th style="padding:10px 16px;text-align:right;font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:700;border-bottom:2px solid #e5e7eb;">Price</th>
                  <th style="padding:10px 16px;text-align:right;font-size:12px;text-transform:uppercase;color:#6b7280;font-weight:700;border-bottom:2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>` : ""}

            <!-- Total -->
            <div style="text-align:right;padding:12px 16px;background:#f9fafb;border-radius:8px;margin-bottom:20px;">
              <span style="font-size:18px;font-weight:800;color:${color};">Total: ${formatPrice(total)}</span>
            </div>

            ${notes ? `<div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin-bottom:20px;"><p style="margin:0;font-size:13px;color:#92400e;"><strong>Note:</strong> ${notes}</p></div>` : ""}

            <p style="font-size:14px;color:#4b5563;margin:0;line-height:1.6;">Thank you for your patronage!</p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const subject = `${emoji} Order ${orderNumber} — ${status}`;

  await transporter.sendMail({
    from: `"${businessName}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  return { success: true, to, subject };
}
