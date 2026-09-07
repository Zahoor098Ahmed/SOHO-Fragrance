import nodemailer from "nodemailer";
import { Config, SmtpAccount } from "./models.js";

const getTransporterAndSender = async () => {
  let smtpUser = process.env.SMTP_USER || "sohofragrance1@gmail.com";
  let smtpPass = process.env.SMTP_PASS || "rmbfjupdjtwxyihl";
  let smtpFromName = process.env.SMTP_FROM_NAME || "SOHO Fragrance";

  try {
    const activeAccount = await SmtpAccount.findOne({ status: "Active" });
    if (activeAccount) {
      smtpUser = activeAccount.email;
      smtpPass = activeAccount.pass;
      smtpFromName = activeAccount.senderName;
    } else {
      const dbUser = await Config.findOne({ key: "smtp_user" });
      const dbPass = await Config.findOne({ key: "smtp_pass" });
      const dbName = await Config.findOne({ key: "smtp_from_name" });

      if (dbUser && dbUser.value) smtpUser = dbUser.value;
      if (dbPass && dbPass.value) smtpPass = dbPass.value;
      if (dbName && dbName.value) smtpFromName = dbName.value;
    }
  } catch (err) {
    console.error("Failed to fetch dynamic SMTP configs from DB, using fallbacks:", err);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for 587
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    // Enforce TLS with valid security
    tls: {
      rejectUnauthorized: false,
    }
  });

  return { transporter, smtpUser, smtpFromName };
};

export const sendOTP = async (email, code, type = "register", role = "") => {
  // Prevent sending to test domains
  if (email.endsWith("@example.com") || email.endsWith("@test.com")) {
    console.log(`Skipping OTP email to dummy domain: ${email}`);
    return;
  }

  const { transporter, smtpUser, smtpFromName } = await getTransporterAndSender();

  const is2FA = type === "2fa";
  let subject = "SOHO Fragrance - Verification Code";
  let message = `Your account verification code is: <strong>${code}</strong>. Enter this code to verify your account.`;

  if (is2FA) {
    if (role === "superadmin") {
      subject = "SOHO Fragrance - Super Admin 2FA Code";
      message = `Your 2-Factor Authentication code is: <strong>${code}</strong> (valid for 10 minutes).`;
    } else if (role === "admin") {
      subject = "SOHO Fragrance - Admin 2FA Code";
      message = `Your Admin 2-Factor Authentication code is: <strong>${code}</strong> (valid for 10 minutes).`;
    } else {
      subject = "SOHO Fragrance - 2-Factor Authentication Code";
      message = `Your 2-Factor Authentication code is: <strong>${code}</strong> (valid for 10 minutes).`;
    }
  }

  const plainText = `
Maison SOHO Fragrance
Verification Code: ${code}

${message.replace(/<[^>]*>?/gm, "")}
This code is valid for 10 minutes. Please do not share it with anyone.
  `.trim();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #faf6f0; margin: 0; padding: 20px;">
      <div style="max-width: 550px; margin: auto; padding: 30px; background-color: #ffffff; border: 1px solid #e8e3dc; border-radius: 6px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4A1525; margin: 0; font-size: 24px; letter-spacing: 3px;">MAISON SOHO</h2>
          <p style="color: #A99A8C; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase;">Haute Parfumerie</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 15px; color: #333; line-height: 1.5;">Hello,</p>
        <p style="font-size: 14px; color: #555; line-height: 1.6;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4A1525; border: 1px dashed #4A1525; padding: 12px 24px; background-color: #FAF6F0; display: inline-block; border-radius: 4px;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">This is an automated security verification email from Maison SOHO Fragrance.</p>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"${smtpFromName}" <${smtpUser}>`,
    replyTo: smtpUser,
    to: email,
    subject,
    text: plainText,
    html,
    headers: {
      "X-Priority": "1",
      "Importance": "high",
      "Auto-Submitted": "auto-generated"
    }
  });
};

export const sendOrderConfirmationEmail = async (order) => {
  // Prevent sending to dummy/test domains that cause bouncebacks
  if (order.email.endsWith("@example.com") || order.email.endsWith("@test.com")) {
    console.log(`Skipping confirmation email to dummy domain: ${order.email}`);
    return;
  }

  try {
    const { transporter, smtpUser, smtpFromName } = await getTransporterAndSender();
    const cleanId = order.id.startsWith("#") ? order.id : `#${order.id}`;
    const subject = `Order Confirmed: ${cleanId} - SOHO Fragrance`;

    const plainText = `
Dear ${order.customer},

Thank you for shopping with Maison SOHO!
Your payment for Order ${cleanId} has been successfully verified by our accounts department.

ORDER DETAILS:
- Order Number: ${cleanId}
- Date: ${order.date}
- Payment: ${order.payment || "Bank Transfer"} (Verified)
${order.transactionRef ? `- TID: ${order.transactionRef}\n` : ""}- Shipping Address: ${order.address}, ${order.city}
- Items: ${order.items}
- Total Amount: Rs. ${Number(order.amount).toLocaleString()}

Your bespoke fragrance is being carefully prepared and packaged for dispatch. Estimated delivery is within 2-4 business days.

Track your order anytime at: https://sohofragrance.com/track-order?id=${encodeURIComponent(cleanId)}

Maison SOHO Fragrance · Scent Becomes Memory
Karachi, Pakistan
Support: contact@sohofragrance.com
    `.trim();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #FAF6F0; margin: 0; padding: 20px; color: #2A2421;">
        <div style="max-width: 620px; margin: auto; padding: 30px; border: 1px solid #E8E3DC; border-radius: 8px; background-color: #FFFFFF;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #A99A8C;">
            <h1 style="color: #4A1525; margin: 0; font-size: 26px; letter-spacing: 4px; font-weight: 700;">MAISON SOHO</h1>
            <p style="color: #A99A8C; margin: 5px 0 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Haute Parfumerie · Karachi</p>
          </div>

          <div style="padding: 25px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="background-color: #E8F5E9; color: #2E7D32; font-weight: 600; padding: 6px 18px; border-radius: 20px; font-size: 13px; display: inline-block; border: 1px solid #C8E6C9;">
                ✓ Payment Verified & Order Confirmed
              </span>
            </div>

            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">Dear <strong>${order.customer}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #555; margin: 0 0 20px 0;">
              We are pleased to inform you that your payment for Order <strong>${cleanId}</strong> has been successfully verified. Your fragrance order is now confirmed and being prepared for packaging and courier dispatch.
            </p>

            <div style="background-color: #FAF6F0; border: 1px solid #E8E3DC; border-radius: 6px; padding: 18px; margin-bottom: 25px;">
              <h3 style="color: #4A1525; margin: 0 0 12px 0; font-size: 15px; border-bottom: 1px solid #E0D9D0; padding-bottom: 8px;">Order Details</h3>
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #777;">Tracking Number:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #4A1525; font-family: monospace; font-size: 14px; text-align: right;">${cleanId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #777;">Order Date:</td>
                  <td style="padding: 6px 0; text-align: right; color: #2A2421;">${order.date}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #777;">Payment Method:</td>
                  <td style="padding: 6px 0; text-align: right; color: #2A2421;">${order.payment || "Bank Transfer"} (Paid & Verified)</td>
                </tr>
                ${order.transactionRef ? `
                <tr>
                  <td style="padding: 6px 0; color: #777;">Transaction Ref / TID:</td>
                  <td style="padding: 6px 0; font-family: monospace; text-align: right; color: #2A2421;">${order.transactionRef}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 6px 0; color: #777;">Delivery Address:</td>
                  <td style="padding: 6px 0; text-align: right; color: #2A2421;">${order.address}, ${order.city}</td>
                </tr>
                <tr style="border-top: 1px dashed #D0C8BF;">
                  <td style="padding: 10px 0 6px 0; color: #777;">Items Ordered:</td>
                  <td style="padding: 10px 0 6px 0; text-align: right; font-weight: 500; color: #2A2421;">${order.items}</td>
                </tr>
                <tr style="border-top: 1px solid #C4B9AD;">
                  <td style="padding: 10px 0; font-weight: bold; font-size: 14px; color: #4A1525;">Total Amount:</td>
                  <td style="padding: 10px 0; font-weight: bold; font-size: 16px; color: #4A1525; text-align: right;">Rs. ${Number(order.amount).toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #777; line-height: 1.5; margin: 0 0 20px 0; text-align: center;">
              Estimated delivery is 2-4 business days via our courier partners.
            </p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
            <p style="margin: 0 0 4px 0;">Maison SOHO Fragrance · Scent Becomes Memory</p>
            <p style="margin: 0;">For inquiries, reply directly or email contact@sohofragrance.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${smtpFromName}" <${smtpUser}>`,
      replyTo: smtpUser,
      to: order.email,
      subject,
      text: plainText,
      html,
      headers: {
        "X-Priority": "1",
        "Importance": "high",
        "Auto-Submitted": "auto-generated"
      }
    });
    console.log(`Order confirmation email successfully dispatched to ${order.email} for order ${cleanId}`);
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }
};

export const sendOrderReceivedPendingEmail = async (order) => {
  // Prevent sending to dummy/test domains
  if (order.email.endsWith("@example.com") || order.email.endsWith("@test.com")) {
    console.log(`Skipping pending email to dummy domain: ${order.email}`);
    return;
  }

  try {
    const { transporter, smtpUser, smtpFromName } = await getTransporterAndSender();
    const cleanId = order.id.startsWith("#") ? order.id : `#${order.id}`;
    const subject = `Order Received: ${cleanId} (Payment Under Verification) - SOHO Fragrance`;

    const plainText = `
Dear ${order.customer},

Thank you for placing your order at Maison SOHO!
We have received your order details and payment slip for Order ${cleanId}.

Order Summary:
- Tracking Number: ${cleanId}
- Payment: ${order.payment}
${order.transactionRef ? `- Submitted TID: ${order.transactionRef}\n` : ""}- Total Amount: Rs. ${Number(order.amount).toLocaleString()}

Our accounts team is verifying your payment with our bank statement. Once verified, you will receive an official confirmation email.

Maison SOHO Fragrance
    `.trim();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #FAF6F0; margin: 0; padding: 20px; color: #2A2421;">
        <div style="max-width: 620px; margin: auto; padding: 30px; border: 1px solid #E8E3DC; border-radius: 8px; background-color: #FFFFFF;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #A99A8C;">
            <h1 style="color: #4A1525; margin: 0; font-size: 26px; letter-spacing: 4px; font-weight: 700;">MAISON SOHO</h1>
            <p style="color: #A99A8C; margin: 5px 0 0 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">Haute Parfumerie · Karachi</p>
          </div>

          <div style="padding: 25px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="background-color: #FFF8E1; color: #F57F17; font-weight: 600; padding: 6px 18px; border-radius: 20px; font-size: 13px; display: inline-block; border: 1px solid #FFE082;">
                ⏳ Payment Proof Received — Verification Pending
              </span>
            </div>

            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 12px 0;">Dear <strong>${order.customer}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #555; margin: 0 0 20px 0;">
              Thank you for choosing Maison SOHO! We have logged your order and received your payment slip for Order <strong>${cleanId}</strong>. Our accounts team is reviewing the transaction against our bank statement.
            </p>

            <div style="background-color: #FAF6F0; border: 1px solid #E8E3DC; border-radius: 6px; padding: 18px; margin-bottom: 25px;">
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #777;">Tracking Number:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #4A1525; font-family: monospace; font-size: 14px; text-align: right;">${cleanId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #777;">Payment Method:</td>
                  <td style="padding: 6px 0; text-align: right; color: #2A2421;">${order.payment}</td>
                </tr>
                ${order.transactionRef ? `
                <tr>
                  <td style="padding: 6px 0; color: #777;">Submitted TID:</td>
                  <td style="padding: 6px 0; font-family: monospace; text-align: right; color: #2A2421;">${order.transactionRef}</td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 6px 0; color: #777;">Payable Amount:</td>
                  <td style="padding: 6px 0; font-weight: bold; font-size: 15px; color: #4A1525; text-align: right;">Rs. ${Number(order.amount).toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #777; line-height: 1.5; margin: 0 0 10px 0; text-align: center;">
              You will receive an official confirmation email once your payment is verified by our finance team.
            </p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
            <p style="margin: 0 0 4px 0;">Maison SOHO Fragrance · Scent Becomes Memory</p>
            <p style="margin: 0;">For inquiries, email contact@sohofragrance.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${smtpFromName}" <${smtpUser}>`,
      replyTo: smtpUser,
      to: order.email,
      subject,
      text: plainText,
      html,
      headers: {
        "X-Priority": "1",
        "Importance": "high",
        "Auto-Submitted": "auto-generated"
      }
    });
    console.log(`Order pending email sent to ${order.email} for order ${cleanId}`);
  } catch (err) {
    console.error("Failed to send order pending email:", err);
  }
};
