/**
 * Email notification utilities using Nodemailer
 */

import nodemailer from 'nodemailer';

export interface EmailConfig {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    console.warn('SMTP configuration not found. Email notifications will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send an email notification
 */
export async function sendEmail(config: EmailConfig): Promise<void> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log('Email not configured. Would send:', config.subject);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@ai-firewall.local',
      to: Array.isArray(config.to) ? config.to.join(', ') : config.to,
      subject: config.subject,
      html: config.html,
      text: config.text,
    });
    
    console.log(`Email sent to ${config.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send alert notification email
 */
export async function sendAlertNotification(
  recipient: string,
  alert: { title: string; description: string; severity: string }
): Promise<void> {
  const severityColors = {
    Low: '#4CAF50',
    Medium: '#FF9800',
    High: '#F44336',
    Critical: '#D32F2F',
  };

  const color = severityColors[alert.severity as keyof typeof severityColors] || '#666';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .alert-box { border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; background-color: #f5f5f5; }
          .severity { display: inline-block; padding: 5px 10px; border-radius: 3px; background-color: ${color}; color: white; font-weight: bold; font-size: 12px; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Firewall Alert</h2>
          <div class="alert-box">
            <h3 style="margin-top: 0;">${alert.title}</h3>
            <p>${alert.description}</p>
            <p><span class="severity">${alert.severity}</span></p>
          </div>
          <div class="footer">
            <p>This is an automated alert from your AI Firewall Management System.</p>
            <p>Please review and take appropriate action if necessary.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: recipient,
    subject: `[Alert: ${alert.severity}] ${alert.title}`,
    html,
  });
}

/**
 * Send deployment notification email
 */
export async function sendDeploymentNotification(
  recipient: string,
  deployment: { policyName: string; status: string; device: string; message?: string }
): Promise<void> {
  const statusColors = {
    Success: '#4CAF50',
    Failed: '#F44336',
    InProgress: '#2196F3',
  };

  const color = statusColors[deployment.status as keyof typeof statusColors] || '#666';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .status-box { border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; background-color: #f5f5f5; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 3px; background-color: ${color}; color: white; font-weight: bold; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Policy Deployment ${deployment.status}</h2>
          <div class="status-box">
            <h3 style="margin-top: 0;">Policy: ${deployment.policyName}</h3>
            <p>Device: ${deployment.device}</p>
            <p>Status: <span class="status">${deployment.status}</span></p>
            ${deployment.message ? `<p>Message: ${deployment.message}</p>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated notification from your AI Firewall Management System.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: recipient,
    subject: `Policy Deployment ${deployment.status}: ${deployment.policyName}`,
    html,
  });
}

