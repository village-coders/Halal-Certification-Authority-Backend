const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

let cachedToken = null;
let tokenExpiresAt = 0;

async function getGraphAccessToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiresAt > now + 60000) {
    return cachedToken;
  }

  const tenantId = process.env.AZURE_TENANT_ID || "halalcert.com.ng";
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", clientId);
  params.append("client_secret", clientSecret);
  params.append("scope", "https://graph.microsoft.com/.default");

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to acquire Graph token: ${data.error_description || JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in ? data.expires_in * 1000 : 3600000);
  return cachedToken;
}

function parseRecipients(to) {
  if (!to) return [];
  const list = Array.isArray(to) ? to : String(to).split(",");
  return list
    .map((item) => {
      const email = item.includes("<") ? item.replace(/.*<([^>]+)>.*/, "$1").trim() : item.trim();
      return email ? { emailAddress: { address: email } } : null;
    })
    .filter(Boolean);
}

async function sendMailViaGraph(mailOptions) {
  const token = await getGraphAccessToken();
  const sender = process.env.EMAIL_USER || "ict@halalcert.com.ng";
  const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${sender}/sendMail`;

  const toRecipients = parseRecipients(mailOptions.to);
  const ccRecipients = parseRecipients(mailOptions.cc);
  const bccRecipients = parseRecipients(mailOptions.bcc);

  // Set sender name and address (defaults to "HDI <ict@halalcert.com.ng>")
  let senderName = "HDI";
  let senderAddress = sender;

  const rawFrom = mailOptions.from || `HDI <${sender}>`;
  if (rawFrom) {
    const match = String(rawFrom).match(/^(.*?)\s*<(.+)>$/);
    if (match) {
      senderName = match[1].replace(/["']/g, "").trim() || "HDI";
      senderAddress = match[2].trim() || sender;
    } else {
      senderAddress = String(rawFrom).trim();
    }
  }

  const message = {
    subject: mailOptions.subject || "",
    from: {
      emailAddress: {
        name: senderName,
        address: senderAddress,
      },
    },
    body: {
      contentType: mailOptions.html ? "HTML" : "Text",
      content: mailOptions.html || mailOptions.text || "",
    },
    toRecipients,
  };

  if (ccRecipients.length > 0) message.ccRecipients = ccRecipients;
  if (bccRecipients.length > 0) message.bccRecipients = bccRecipients;

  // Process attachments if any
  if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length > 0) {
    message.attachments = mailOptions.attachments.map((att) => {
      let contentBytes = "";
      if (att.content) {
        contentBytes = Buffer.isBuffer(att.content)
          ? att.content.toString("base64")
          : Buffer.from(att.content).toString("base64");
      } else if (att.path) {
        contentBytes = fs.readFileSync(att.path).toString("base64");
      }
      return {
        "@odata.type": "#microsoft.graph.fileAttachment",
        name: att.filename || path.basename(att.path || "attachment"),
        contentType: att.contentType || "application/octet-stream",
        contentBytes,
      };
    });
  }

  const res = await fetch(sendMailUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, saveToSentItems: "true" }),
  });

  if (res.status === 202 || res.status === 200) {
    return { messageId: `graph-${Date.now()}`, response: "202 Accepted via Microsoft Graph API" };
  }

  const errData = await res.text();
  throw new Error(`Microsoft Graph API error (${res.status}): ${errData}`);
}

const isGraphConfigured = Boolean(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET);

let transporter;

if (isGraphConfigured) {
  transporter = {
    sendMail: sendMailViaGraph,
    verify: (callback) => {
      getGraphAccessToken()
        .then(() => {
          if (callback) callback(null, true);
        })
        .catch((err) => {
          if (callback) callback(err, false);
        });
    },
  };
} else {
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const secure = process.env.EMAIL_SECURE === "true" || port === 465;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.office365.com",
    port,
    secure,
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: false,
    },
  });
}

module.exports = transporter;

transporter.verify((err, success) => {
  if (success) {
    console.log(isGraphConfigured ? "Ready to send email via Microsoft Graph API" : "Ready to send email via Nodemailer");
  } else {
    console.log("Transporter verification failed:", err);
  }
});