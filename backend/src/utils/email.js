import nodemailer from 'nodemailer';

// Create transporter for sending emails
const emailService = (process.env.EMAIL_SERVICE || 'gmail').toLowerCase();
const emailHost = process.env.EMAIL_HOST;
const emailPort = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
const emailSecure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : undefined;
const emailUser = process.env.EMAIL_USER || 'support@smartEVote.com';
const emailPass = process.env.EMAIL_PASSWORD || 'your-app-password';
const enableDebug = (process.env.EMAIL_DEBUG || '').toLowerCase() === 'true';

// Build transporter options with sensible defaults
let transporterOptions = {};

if (emailHost) {
  // Explicit SMTP configuration
  transporterOptions = {
    host: emailHost,
    port: emailPort ?? 587,
    secure: emailSecure ?? false,
    auth: { user: emailUser, pass: emailPass },
    logger: enableDebug,
    debug: enableDebug
  };
} else if (emailService === 'gmail') {
  // Gmail service with explicit secure defaults
  transporterOptions = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: emailUser, pass: emailPass },
    logger: enableDebug,
    debug: enableDebug
  };
} else {
  // Generic service fallback
  transporterOptions = {
    service: emailService,
    auth: { user: emailUser, pass: emailPass },
    logger: enableDebug,
    debug: enableDebug
  };
}

const transporter = nodemailer.createTransport(transporterOptions);

// Verify transporter on startup for easier diagnostics in development
(async () => {
  try {
    const maskedUser = emailUser.replace(/(^.).+(@.+$)/, (_, a, b) => `${a}***${b}`);
    console.log('[email] Initializing transporter with:', {
      mode: emailHost ? 'SMTP' : 'SERVICE',
      service: emailHost ? undefined : emailService,
      host: emailHost || (emailService === 'gmail' ? 'smtp.gmail.com' : undefined),
      port: emailHost ? (emailPort ?? 587) : (emailService === 'gmail' ? 465 : undefined),
      secure: emailHost ? (emailSecure ?? false) : (emailService === 'gmail' ? true : undefined),
      user: maskedUser,
      debug: enableDebug
    });
    await transporter.verify();
    console.log('[email] Transporter verified and ready to send mail');
  } catch (err) {
    console.warn('[email] Transporter verification failed:', err?.message || err);
  }
})();

// Email template for OTP verification
const generateOTPEmailTemplate = (userName, otp, electionTitle) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>OTP Verification - Smart eVoting</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 10px;
        }
        .title {
          color: #1e293b;
          font-size: 20px;
          margin: 0;
        }
        .otp-container {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background-color: #f1f5f9;
          border-radius: 8px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
        }
        .info {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .warning {
          color: #dc2626;
          font-weight: 600;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 14px;
        }
        .button {
          display: inline-block;
          background-color: #667eea;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          margin: 10px 0;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏛️ Smart eVoting</div>
          <h1 class="title">OTP Verification Required</h1>
        </div>
        
        <p>Hello <strong>${userName}</strong>,</p>
        
        <p>You are attempting to cast your vote in the election: <strong>"${electionTitle}"</strong></p>
        
        <p>To ensure the security of your vote, please use the following One-Time Password (OTP):</p>
        
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
          <p>Enter this code in the OTP verification field</p>
        </div>
        
        <div class="info">
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for <strong>5 minutes only</strong></li>
            <li>Do not share this OTP with anyone</li>
            <li>Smart eVoting staff will never ask for your OTP</li>
            <li>If you didn't request this OTP, please ignore this email</li>
          </ul>
        </div>
        
        <p>Once you enter the correct OTP, you will be able to cast your vote securely.</p>
        
        <div class="footer">
          <p>This is an automated message from Smart eVoting System</p>
          <p>For support, contact: trueevote@gmail.com</p>
          <p>© 2025 TrueEVote Smart eVoting. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send OTP email
export const sendOTPEmail = async (to, userName, otp, electionTitle) => {
  try {
    const mailOptions = {
      from: `"Smart eVoting System" <${process.env.EMAIL_USER || 'support@smartEVote.com'}>`,
      to: to,
      subject: `OTP Verification Required - ${electionTitle}`,
      html: generateOTPEmailTemplate(userName, otp, electionTitle)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Function to send vote confirmation email
export const sendVoteConfirmationEmail = async (to, userName, electionTitle, candidateName) => {
  try {
    const mailOptions = {
      from: `"Smart eVoting System" <${process.env.EMAIL_USER || 'support@smartEVote.com'}>`,
      to: to,
      subject: `Vote Confirmation - ${electionTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Vote Confirmation - Smart eVoting</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .success { background-color: #d1fae5; border: 1px solid #10b981; padding: 15px; border-radius: 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏛️ Smart eVoting</h1>
              <h2>Vote Confirmation</h2>
            </div>
            
            <div class="success">
              <h3>✅ Your vote has been successfully recorded!</h3>
              <p><strong>Election:</strong> ${electionTitle}</p>
              <p><strong>Your Choice:</strong> ${candidateName}</p>
              <p><strong>Vote Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p>Thank you for participating in the democratic process!</p>
            
            <div class="footer">
              <p>This is an automated confirmation from Smart eVoting System</p>
              <p>© 2025 TrueEVote Smart eVoting. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Vote confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending vote confirmation email:', error);
    return { success: false, error: error.message };
  }
};

export default transporter; 