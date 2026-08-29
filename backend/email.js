import nodemailer from "nodemailer";
import { Config, SmtpAccount } from "./models.js";

export const sendOTP = async (email, code, type = "register", role = "") => {
  // Resolve SMTP credentials dynamically from database, fallback to environment
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
    secure: false, // true for port 465, false for port 587
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const is2FA = type === "2fa";
  let subject = "SOHO Fragrance - Account Verification Code";
  let message = `Thank you for registering at Maison SOHO. Your verification code is: <strong>${code}</strong>. Enter this code to verify your account.`;

  if (is2FA) {
    if (role === "superadmin") {
      subject = "SOHO Fragrance - Super Admin 2FA Code";
      message = `A login request was made for the Super Admin account. Your 2-Factor Authentication (2FA) code is: <strong>${code}</strong>. This code is specifically for the Super Admin login and is valid for 10 minutes.`;
    } else if (role === "admin") {
      subject = "SOHO Fragrance - Admin 2FA Code";
      message = `A login request was made for the Admin account. Your 2-Factor Authentication (2FA) code is: <strong>${code}</strong>. This code is specifically for the Admin login and is valid for 10 minutes.`;
    } else {
      subject = "SOHO Fragrance - 2-Factor Authentication Code";
      message = `Your 2-Factor Authentication (2FA) code is: <strong>${code}</strong>. It is valid for 10 minutes. Please do not share this code.`;
    }
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2 style="color: #4A1525; text-align: center;">Maison SOHO Fragrance</h2>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      <p style="font-size: 16px; color: #333;">Hello,</p>
      <p style="font-size: 16px; color: #333;">${message}</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4A1525; border: 1px dashed #4A1525; padding: 10px 20px; background-color: #FAF6F0; display: inline-block;">${code}</span>
      </div>
      <p style="font-size: 12px; color: #777; text-align: center;">This is an automated security email. Please do not reply directly.</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"${smtpFromName}" <${smtpUser}>`,
    to: email,
    subject,
    html,
  });
};

