const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const LOGO_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAACXBIWXMAAAsTAAALEwEAmpwYAAACTklEQVR4nO2ZzW4TMRDH/Qot8YSWD7XcQOJBkGjFGZ4A6Af1CBC9VEi0d24gIg4cuTflEdpLuZG0lVrRA4hjmqTrSbZrZG8SpWnSONTBjpSR5rDR2v7tX/8dbzyMXRKnr6duR4IvEsI3ElCUglcIQblMqecUUNRrRMgXTsXELTZoVFcmb0jkHyVC7BqQ+j4AnBHC12g5O2MFKwU8kgjl/w1KF8FPpID5frDLjSf0CkttakvMLPVWNiBYaofuVLr6avJmCDagS+xRfXltul3dz76hqB808k+t0uWjGtDAwBBrJzBtat8wZJmR4M8ZIWz5BiH73NTABwGAKKsUUGQhVwfqSM3KbG9ODrfVVSI53HYCbQ3sIsgH8L8s0owxMI0Vhp7+T452VG3tXtge7ozkd2FgaD8v3dpdlfz6kUL/2Ve1t/cDB0YwymqFDfTRTvjA1IAedF7vdbgZY+CRVXhYQa6Br/q15upLzhq4BX783SwSb75T9GZGxfn1dNGfu07HkCtgJctmMVqdTX9bvZPKJMtOx5BzhfPrBiDe2rBXOG8/xhlwPfekqw/rucdOx5Ar4CaAUU1WjEr6ehhjqBvwiP0JLWmF93yDkH0WRu8gJUK+EACIssma4E+Z7imMxGGggLo5DEyPW3kueGDkH843YQSchAsLpcqLzNT5lgFmHoRoDWn6HNm57n0OzCyF1OeQAs50n7BfJ2k+BHtIhJIU2YfMJtTidU4C3us304sFBHy54Fmb0GVEH9OTgLzeZYaxjTfmLOhNoYb8Wat09Yi/PSUCekbboOoAAAAASUVORK5CYII=";

const commonAttachments = [
  {
    filename: "logo.png",
    content: Buffer.from(LOGO_PNG_BASE64, "base64"),
    cid: "transitops-logo",
    contentType: "image/png"
  }
];

const buildEmailTemplate = (title, messageBody) => {
  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #080c12; color: #e8edf5; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="cid:transitops-logo" width="44" height="44" alt="TransitOps Logo" style="display: block; margin: 0 auto 12px auto; border: 0;" />
        <h1 style="color: #875A7B; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Transit<span style="color: #e8edf5;">Ops</span></h1>
      </div>
      <div style="background-color: rgba(255,255,255,0.02); padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
        <h2 style="margin-top: 0; color: #875A7B; font-size: 20px;">${title}</h2>
        ${messageBody}
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #5a6a80;">
        <p>Secured with Role-Based Access Control (RBAC) &copy; TransitOps 2026</p>
      </div>
    </div>
  `;
};

const sendOTPEmail = async (toEmail, otp) => {
  const messageBody = `
    <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">We received a request to reset your password for your TransitOps account. Use the OTP code below to proceed with the reset.</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="display: inline-block; background-color: rgba(135, 90, 123, 0.1); border: 1px solid rgba(135, 90, 123, 0.25); color: #875A7B; padding: 15px 30px; font-size: 32px; font-weight: 800; letter-spacing: 4px; border-radius: 8px;">${otp}</span>
    </div>
    <p style="font-size: 12px; color: #71717a; text-align: center;">This code will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
  `;
  const htmlContent = buildEmailTemplate("Password Reset Request", messageBody);

  const mailOptions = {
    from: `"TransitOps Support" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Your Password Reset OTP - TransitOps",
    html: htmlContent,
    attachments: commonAttachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully to " + toEmail);
    return true;
  } catch (error) {
    console.error("Error sending OTP email: ", error);
    return false;
  }
};

const sendWelcomeEmail = async (toEmail, name) => {
  const greeting = name ? `Hi ${name},` : "Welcome!";
  const messageBody = `
    <p style="font-size: 16px; font-weight: 600; color: #e8edf5;">${greeting}</p>
    <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">We're thrilled to have you on board! TransitOps is your centralized logistics hub designed to help you track vehicles, manage drivers, and oversee operations seamlessly.</p>
    <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-top: 20px;">You can now log in to your role-based workspace and start exploring.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="#" style="display: inline-block; background-color: #875A7B; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Go to Dashboard</a>
    </div>
  `;
  const htmlContent = buildEmailTemplate("Welcome to TransitOps", messageBody);

  const mailOptions = {
    from: `"TransitOps Accounts" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Welcome to TransitOps!",
    html: htmlContent,
    attachments: commonAttachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent to " + toEmail);
    return true;
  } catch (error) {
    console.error("Error sending Welcome email: ", error);
    return false;
  }
};

const sendPasswordChangeEmail = async (toEmail) => {
  const timestamp = new Date().toLocaleString();
  const messageBody = `
    <p style="font-size: 14px; color: #e8edf5; line-height: 1.6;"><strong>Your password has been successfully changed.</strong></p>
    <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">This is a security confirmation that your TransitOps account password was updated on <strong>${timestamp}</strong>.</p>
    <div style="margin: 25px 0; padding: 15px; background: rgba(244, 63, 94, 0.08); border-left: 4px solid #f43f5e; border-radius: 4px;">
      <p style="margin: 0; font-size: 13px; color: #f43f5e;">If this wasn't you, please reset your password immediately using the 'Forgot Password' link on the login page or contact support.</p>
    </div>
  `;
  const htmlContent = buildEmailTemplate("Security Alert", messageBody);

  const mailOptions = {
    from: `"TransitOps Security" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Security Alert: Password Changed",
    html: htmlContent,
    attachments: commonAttachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password change email sent to " + toEmail);
    return true;
  } catch (error) {
    console.error("Error sending Password Change email: ", error);
    return false;
  }
};

const sendBillEmail = async (toEmail, trip, companyInfo, pdfBase64, customerName) => {
  const messageBody = `
    <p style="font-size: 16px; font-weight: 600; color: #e8edf5;">Hello${customerName ? ` ${customerName}` : ''},</p>
    <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6;">Please find the details of your trip bill below. A PDF copy of the invoice is attached for your records.</p>
    
    <div style="margin: 20px 0; background-color: rgba(255,255,255,0.03); border-radius: 8px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
        <h3 style="color: #875A7B; margin-top: 0; font-size: 16px;">Trip Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e8edf5;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #a1a1aa;">Trip ID</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">${trip.id}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #a1a1aa;">Vehicle</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">${trip.vehicleName || "N/A"}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #a1a1aa;">From</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">${trip.fromLocation || trip.fromlocation}</td></tr>
            <tr><td style="padding: 8px 0; color: #a1a1aa;">To</td><td style="padding: 8px 0; text-align: right;">${trip.toLocation || trip.tolocation}</td></tr>
        </table>
    </div>

    <div style="margin: 20px 0; background-color: rgba(255,255,255,0.03); border-radius: 8px; padding: 20px; border: 1px solid rgba(255,255,255,0.05);">
        <h3 style="color: #875A7B; margin-top: 0; font-size: 16px;">Cost Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #e8edf5;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #a1a1aa;">Base Cost</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">INR ${Number(trip.baseCost || trip.basecost || 0).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #a1a1aa;">Toll Charges</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">INR ${Number(trip.tollCost || trip.tollcost || 0).toLocaleString()}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: #a1a1aa;">Other Expenses</td><td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">INR ${Number(trip.otherCost || trip.othercost || 0).toLocaleString()}</td></tr>
            <tr><td style="padding: 12px 0 0 0; color: #875A7B; font-weight: 600;">Total Amount</td><td style="padding: 12px 0 0 0; text-align: right; color: #875A7B; font-weight: 600;">INR ${Number(trip.totalCost || trip.totalcost || 0).toLocaleString()}</td></tr>
        </table>
    </div>
    
    <p style="font-size: 12px; color: #71717a; text-align: center; margin-top: 30px;">Thank you for choosing ${companyInfo?.name || 'TransitOps'}!</p>
  `;

  const htmlContent = buildEmailTemplate(`Invoice: ${trip.id}`, messageBody);

  const attachments = [...commonAttachments];
  if (pdfBase64) {
    attachments.push({
      filename: `Bill_${trip.id}.pdf`,
      content: Buffer.from(pdfBase64, 'base64'),
      contentType: 'application/pdf'
    });
  }

  const mailOptions = {
    from: `"${companyInfo?.name || 'TransitOps'} Billing" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Your Trip Invoice - ${trip.id}`,
    html: htmlContent,
    attachments: attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Bill email sent successfully to " + toEmail);
    return true;
  } catch (error) {
    console.error("Error sending Bill email: ", error);
    return false;
  }
};

module.exports = { sendOTPEmail, sendWelcomeEmail, sendPasswordChangeEmail, sendBillEmail };
