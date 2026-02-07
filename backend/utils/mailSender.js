const nodemailer = require("nodemailer");

/**
 * Email Service for SkillSwap
 * Uses environment variables for security
 * 
 * Required ENV variables:
 * - SMTP_HOST (default: smtp.gmail.com)
 * - SMTP_PORT (default: 465)
 * - SMTP_USER (your email)
 * - SMTP_PASS (app password, NOT your regular password)
 * - SMTP_FROM (sender email address)
 */

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 * @param {string} [options.text] - Plain text content (optional)
 * @returns {Promise<Object>} - Nodemailer info object
 */
const sendMail = async ({ to, subject, html, text }) => {
  // Check if email is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("Email not configured. Skipping email send.");
    return null;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error.message);
    throw error;
  }
};

/**
 * Email Templates
 */
const emailTemplates = {
  // Welcome email after registration
  welcome: (userName) => ({
    subject: "Welcome to SkillSwap! 🎉",
    html: `
      <table width='100%' cellspacing='0' cellpadding='0' style='background:#f2f4f7; padding:30px 0;'>
        <tr>
          <td align='center'>
            <table width='600' cellspacing='0' cellpadding='0' 
                   style='background:#ffffff; border-radius:12px; 
                          border:1px solid #e3e6ec; padding:28px; 
                          font-family:Arial,Helvetica,sans-serif; 
                          color:#1f1f1f; line-height:1.6;'>
              <tr>
                <td align='center' style='font-size:24px; font-weight:700; padding-bottom:10px;'>
                  <span style='color:#000000;'>Skill</span><span style='color:#0066cc;'>Swap</span>
                </td>
              </tr>
              <tr>
                <td align='center' style='font-size:18px; font-weight:600; color:#333;'>
                  Welcome to the Community! 🎉
                </td>
              </tr>
              <tr><td style='height:20px'></td></tr>
              <tr>
                <td style='font-size:14px;'>
                  Dear <strong>${userName}</strong>,
                  <br><br>
                  Thank you for joining <strong>SkillSwap</strong>! You're now part of a community 
                  where people exchange skills and learn from each other.
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td style='font-size:14px;'>
                  <strong>Here's what you can do next:</strong>
                  <ul style='margin:10px 0; padding-left:20px;'>
                    <li>Complete your profile with skills you can offer</li>
                    <li>Add skills you want to learn</li>
                    <li>Browse other users and send swap requests</li>
                  </ul>
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <a href='${process.env.FRONTEND_URL || "http://localhost:5173"}' 
                     style='background:#000000; color:#ffffff; padding:12px 30px; 
                            text-decoration:none; border-radius:6px; font-weight:600;
                            display:inline-block;'>
                    Get Started
                  </a>
                </td>
              </tr>
              <tr><td style='height:24px'></td></tr>
              <tr>
                <td style='font-size:13px; color:#666;' align='center'>
                  Best regards,<br>
                  The <strong>SkillSwap</strong> Team
                </td>
              </tr>
              <tr><td style='height:16px'></td></tr>
              <tr>
                <td style='font-size:11px; color:#999;' align='center'>
                  © ${new Date().getFullYear()} SkillSwap. All rights reserved.<br>
                  This is an automated email. Please do not reply directly.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  }),

  // Swap request notification
  swapRequest: (toUserName, fromUserName, skillOffered, skillWanted) => ({
    subject: `New Swap Request from ${fromUserName} 🔄`,
    html: `
      <table width='100%' cellspacing='0' cellpadding='0' style='background:#f2f4f7; padding:30px 0;'>
        <tr>
          <td align='center'>
            <table width='600' cellspacing='0' cellpadding='0' 
                   style='background:#ffffff; border-radius:12px; 
                          border:1px solid #e3e6ec; padding:28px; 
                          font-family:Arial,Helvetica,sans-serif; 
                          color:#1f1f1f; line-height:1.6;'>
              <tr>
                <td align='center' style='font-size:24px; font-weight:700; padding-bottom:10px;'>
                  <span style='color:#000000;'>Skill</span><span style='color:#0066cc;'>Swap</span>
                </td>
              </tr>
              <tr>
                <td align='center' style='font-size:18px; font-weight:600; color:#333;'>
                  New Swap Request! 🔄
                </td>
              </tr>
              <tr><td style='height:20px'></td></tr>
              <tr>
                <td style='font-size:14px;'>
                  Dear <strong>${toUserName}</strong>,
                  <br><br>
                  Great news! <strong>${fromUserName}</strong> wants to swap skills with you.
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <table cellspacing='0' cellpadding='0' 
                         style='background:#f5f7fa; border:1px solid #d8dbe2; 
                                border-radius:10px; padding:16px 24px;'>
                    <tr>
                      <td style='font-size:14px; color:#333;'>
                        <strong>They Offer:</strong> ${skillOffered}<br>
                        <strong>They Want:</strong> ${skillWanted}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <a href='${process.env.FRONTEND_URL || "http://localhost:5173"}/swaps' 
                     style='background:#000000; color:#ffffff; padding:12px 30px; 
                            text-decoration:none; border-radius:6px; font-weight:600;
                            display:inline-block;'>
                    View Request
                  </a>
                </td>
              </tr>
              <tr><td style='height:24px'></td></tr>
              <tr>
                <td style='font-size:13px; color:#666;' align='center'>
                  Best regards,<br>
                  The <strong>SkillSwap</strong> Team
                </td>
              </tr>
              <tr><td style='height:16px'></td></tr>
              <tr>
                <td style='font-size:11px; color:#999;' align='center'>
                  © ${new Date().getFullYear()} SkillSwap. All rights reserved.<br>
                  This is an automated email. Please do not reply directly.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  }),

  // Swap status update
  swapStatusUpdate: (userName, status, skillOffered, skillWanted) => ({
    subject: `Swap Request ${status === "accepted" ? "Accepted ✅" : status === "rejected" ? "Declined ❌" : status === "completed" ? "Completed 🎉" : "Updated"}`,
    html: `
      <table width='100%' cellspacing='0' cellpadding='0' style='background:#f2f4f7; padding:30px 0;'>
        <tr>
          <td align='center'>
            <table width='600' cellspacing='0' cellpadding='0' 
                   style='background:#ffffff; border-radius:12px; 
                          border:1px solid #e3e6ec; padding:28px; 
                          font-family:Arial,Helvetica,sans-serif; 
                          color:#1f1f1f; line-height:1.6;'>
              <tr>
                <td align='center' style='font-size:24px; font-weight:700; padding-bottom:10px;'>
                  <span style='color:#000000;'>Skill</span><span style='color:#0066cc;'>Swap</span>
                </td>
              </tr>
              <tr>
                <td align='center' style='font-size:18px; font-weight:600; color:#333;'>
                  Swap Request Update
                </td>
              </tr>
              <tr><td style='height:20px'></td></tr>
              <tr>
                <td style='font-size:14px;'>
                  Dear <strong>${userName}</strong>,
                  <br><br>
                  Your swap request has been updated.
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <div style='
                    font-size:20px;
                    font-weight:bold;
                    background:${status === "accepted" ? "#dcfce7" : status === "rejected" ? "#fee2e2" : status === "completed" ? "#dbeafe" : "#f5f7fa"};
                    border:1px solid ${status === "accepted" ? "#86efac" : status === "rejected" ? "#fca5a5" : status === "completed" ? "#93c5fd" : "#d8dbe2"};
                    color:${status === "accepted" ? "#166534" : status === "rejected" ? "#991b1b" : status === "completed" ? "#1e40af" : "#333"};
                    border-radius:10px;
                    padding:14px 24px;
                    display:inline-block;'>
                    ${status.toUpperCase()}
                  </div>
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <table cellspacing='0' cellpadding='0' 
                         style='background:#f5f7fa; border:1px solid #d8dbe2; 
                                border-radius:10px; padding:16px 24px;'>
                    <tr>
                      <td style='font-size:14px; color:#333;'>
                        <strong>Skill Offered:</strong> ${skillOffered}<br>
                        <strong>Skill Wanted:</strong> ${skillWanted}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <a href='${process.env.FRONTEND_URL || "http://localhost:5173"}/swaps' 
                     style='background:#000000; color:#ffffff; padding:12px 30px; 
                            text-decoration:none; border-radius:6px; font-weight:600;
                            display:inline-block;'>
                    View Swaps
                  </a>
                </td>
              </tr>
              <tr><td style='height:24px'></td></tr>
              <tr>
                <td style='font-size:13px; color:#666;' align='center'>
                  Best regards,<br>
                  The <strong>SkillSwap</strong> Team
                </td>
              </tr>
              <tr><td style='height:16px'></td></tr>
              <tr>
                <td style='font-size:11px; color:#999;' align='center'>
                  © ${new Date().getFullYear()} SkillSwap. All rights reserved.<br>
                  This is an automated email. Please do not reply directly.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  }),

  // Password reset OTP email
  passwordReset: (userName, otp) => ({
    subject: "Password Reset OTP - SkillSwap 🔐",
    html: `
      <table width='100%' cellspacing='0' cellpadding='0' style='background:#f2f4f7; padding:30px 0;'>
        <tr>
          <td align='center'>
            <table width='600' cellspacing='0' cellpadding='0' 
                   style='background:#ffffff; border-radius:12px; 
                          border:1px solid #e3e6ec; padding:28px; 
                          font-family:Arial,Helvetica,sans-serif; 
                          color:#1f1f1f; line-height:1.6;'>
              <tr>
                <td align='center' style='font-size:24px; font-weight:700; padding-bottom:10px;'>
                  <span style='color:#000000;'>Skill</span><span style='color:#0066cc;'>Swap</span>
                </td>
              </tr>
              <tr>
                <td align='center' style='font-size:18px; font-weight:600; color:#333;'>
                  Password Reset Request 🔐
                </td>
              </tr>
              <tr><td style='height:20px'></td></tr>
              <tr>
                <td style='font-size:14px;'>
                  Dear <strong>${userName}</strong>,
                  <br><br>
                  We received a request to reset your password. Use the following One-Time Password (OTP) to complete your verification:
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <div style='
                    font-size:32px;
                    font-weight:bold;
                    background:#f5f7fa;
                    border:1px solid #d8dbe2;
                    border-radius:10px;
                    padding:16px 32px;
                    display:inline-block;
                    letter-spacing:8px;
                    color:#000;'>
                    ${otp}
                  </div>
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td style='font-size:14px;'>
                  This OTP is valid for <strong>10 minutes</strong>. Please do not share it with anyone.
                  <br><br>
                  If you did not request this password reset, please ignore this email or contact our support team.
                </td>
              </tr>
              <tr><td style='height:24px'></td></tr>
              <tr>
                <td style='font-size:13px; color:#666;' align='center'>
                  Best regards,<br>
                  The <strong>SkillSwap</strong> Team
                </td>
              </tr>
              <tr><td style='height:16px'></td></tr>
              <tr>
                <td style='font-size:11px; color:#999;' align='center'>
                  © ${new Date().getFullYear()} SkillSwap. All rights reserved.<br>
                  This is an automated email. Please do not reply directly.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  }),

  // Swap completed celebration email
  swapCompleted: (userName, partnerName, skillOffered, skillWanted) => ({
    subject: "Swap Completed! 🎉 Congratulations!",
    html: `
      <table width='100%' cellspacing='0' cellpadding='0' style='background:#f2f4f7; padding:30px 0;'>
        <tr>
          <td align='center'>
            <table width='600' cellspacing='0' cellpadding='0' 
                   style='background:#ffffff; border-radius:12px; 
                          border:1px solid #e3e6ec; padding:28px; 
                          font-family:Arial,Helvetica,sans-serif; 
                          color:#1f1f1f; line-height:1.6;'>
              <tr>
                <td align='center' style='font-size:24px; font-weight:700; padding-bottom:10px;'>
                  <span style='color:#000000;'>Skill</span><span style='color:#0066cc;'>Swap</span>
                </td>
              </tr>
              <tr>
                <td align='center' style='font-size:24px; padding:10px 0;'>
                  🎉🎊✨
                </td>
              </tr>
              <tr>
                <td align='center' style='font-size:18px; font-weight:600; color:#22c55e;'>
                  Swap Successfully Completed!
                </td>
              </tr>
              <tr><td style='height:20px'></td></tr>
              <tr>
                <td style='font-size:14px;'>
                  Dear <strong>${userName}</strong>,
                  <br><br>
                  Congratulations! Your skill swap with <strong>${partnerName}</strong> has been successfully completed!
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <table cellspacing='0' cellpadding='0' 
                         style='background:#dcfce7; border:1px solid #86efac; 
                                border-radius:10px; padding:16px 24px;'>
                    <tr>
                      <td style='font-size:14px; color:#166534;'>
                        <strong>You Taught:</strong> ${skillOffered}<br>
                        <strong>You Learned:</strong> ${skillWanted}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td style='font-size:14px;'>
                  Don't forget to leave feedback for <strong>${partnerName}</strong> to help the community!
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <a href='${process.env.FRONTEND_URL || "http://localhost:5173"}/swaps' 
                     style='background:#22c55e; color:#ffffff; padding:12px 30px; 
                            text-decoration:none; border-radius:6px; font-weight:600;
                            display:inline-block;'>
                    Leave Feedback
                  </a>
                </td>
              </tr>
              <tr><td style='height:24px'></td></tr>
              <tr>
                <td style='font-size:13px; color:#666;' align='center'>
                  Keep swapping and learning!<br>
                  The <strong>SkillSwap</strong> Team
                </td>
              </tr>
              <tr><td style='height:16px'></td></tr>
              <tr>
                <td style='font-size:11px; color:#999;' align='center'>
                  © ${new Date().getFullYear()} SkillSwap. All rights reserved.<br>
                  This is an automated email. Please do not reply directly.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  }),

  // Admin announcement email
  adminAnnouncement: (userName, title, content, type) => ({
    subject: `${type === "warning" ? "⚠️" : type === "maintenance" ? "🔧" : type === "update" ? "🆕" : "📢"} ${title} - SkillSwap`,
    html: `
      <table width='100%' cellspacing='0' cellpadding='0' style='background:#f2f4f7; padding:30px 0;'>
        <tr>
          <td align='center'>
            <table width='600' cellspacing='0' cellpadding='0' 
                   style='background:#ffffff; border-radius:12px; 
                          border:1px solid #e3e6ec; padding:28px; 
                          font-family:Arial,Helvetica,sans-serif; 
                          color:#1f1f1f; line-height:1.6;'>
              <tr>
                <td align='center' style='font-size:24px; font-weight:700; padding-bottom:10px;'>
                  <span style='color:#000000;'>Skill</span><span style='color:#0066cc;'>Swap</span>
                </td>
              </tr>
              <tr>
                <td align='center' style='font-size:18px; font-weight:600; color:#333;'>
                  ${type === "warning" ? "⚠️ Important Notice" : type === "maintenance" ? "🔧 Maintenance Update" : type === "update" ? "🆕 Platform Update" : "📢 Announcement"}
                </td>
              </tr>
              <tr><td style='height:20px'></td></tr>
              <tr>
                <td style='font-size:14px;'>
                  Dear <strong>${userName}</strong>,
                </td>
              </tr>
              <tr><td style='height:12px'></td></tr>
              <tr>
                <td align='center'>
                  <table cellspacing='0' cellpadding='0' width='100%'
                         style='background:${type === "warning" ? "#fef3c7" : type === "maintenance" ? "#e0e7ff" : "#f0fdf4"}; 
                                border:1px solid ${type === "warning" ? "#fcd34d" : type === "maintenance" ? "#a5b4fc" : "#86efac"}; 
                                border-radius:10px; padding:20px;'>
                    <tr>
                      <td style='font-size:16px; font-weight:600; color:#333; padding-bottom:10px;'>
                        ${title}
                      </td>
                    </tr>
                    <tr>
                      <td style='font-size:14px; color:#555;'>
                        ${content}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr><td style='height:18px'></td></tr>
              <tr>
                <td align='center'>
                  <a href='${process.env.FRONTEND_URL || "http://localhost:5173"}' 
                     style='background:#000000; color:#ffffff; padding:12px 30px; 
                            text-decoration:none; border-radius:6px; font-weight:600;
                            display:inline-block;'>
                    Visit SkillSwap
                  </a>
                </td>
              </tr>
              <tr><td style='height:24px'></td></tr>
              <tr>
                <td style='font-size:13px; color:#666;' align='center'>
                  Best regards,<br>
                  The <strong>SkillSwap</strong> Team
                </td>
              </tr>
              <tr><td style='height:16px'></td></tr>
              <tr>
                <td style='font-size:11px; color:#999;' align='center'>
                  © ${new Date().getFullYear()} SkillSwap. All rights reserved.<br>
                  This is an automated email. Please do not reply directly.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  }),
};

module.exports = {
  sendMail,
  emailTemplates,
};




