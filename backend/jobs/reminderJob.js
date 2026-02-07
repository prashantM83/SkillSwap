const cron = require("node-cron");
const Session = require("../models/Session");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendMail } = require("../utils/mailSender");

// Send notification helper
const sendReminderNotification = async (io, userId, notification, onlineUsers) => {
  const savedNotification = await Notification.create({
    userId,
    ...notification,
  });

  // Send real-time notification if user is online
  const socketId = onlineUsers?.get?.(userId.toString());
  if (socketId) {
    io.to(socketId).emit("notification", savedNotification);
  }

  return savedNotification;
};

// Email reminder template
const getReminderEmail = (userName, session, hoursUntil) => {
  const timeLabel = hoursUntil === 24 ? "tomorrow" : "in 1 hour";
  const urgencyColor = hoursUntil === 24 ? "#3b82f6" : "#f59e0b";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${urgencyColor};">⏰ Session Reminder</h2>
      <p>Hi ${userName},</p>
      <p>Your skill swap session is coming up <strong>${timeLabel}</strong>!</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
        <h3 style="margin-top: 0;">${session.title}</h3>
        <p><strong>Date & Time:</strong> ${new Date(session.scheduledAt).toLocaleString()}</p>
        <p><strong>Duration:</strong> ${session.duration} minutes</p>
        ${session.meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${session.meetingLink}">${session.meetingLink}</a></p>` : ""}
        ${session.meetingType === "jitsi" ? `<p><strong>Video Call:</strong> Built-in Jitsi video will be available in the session</p>` : ""}
        ${session.location ? `<p><strong>Location:</strong> ${session.location}</p>` : ""}
      </div>
      <p>Don't forget to prepare for your session!</p>
      <p style="color: #666; font-size: 14px;">Log in to view details or make any last-minute changes.</p>
    </div>
  `;
};

// Initialize reminder cron jobs
const initializeReminderJobs = (io, onlineUsers) => {
  console.log("📅 Initializing session reminder cron jobs...");

  // Run every 5 minutes to check for upcoming sessions
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      
      // 24-hour reminders (sessions starting in 23-24 hours)
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);

      const sessions24h = await Session.find({
        status: "scheduled",
        reminder24hSent: false,
        scheduledAt: {
          $gte: in23Hours,
          $lte: in24Hours,
        },
      })
        .populate("hostUserId", "name email")
        .populate("guestUserId", "name email");

      // Send 24-hour reminders
      for (const session of sessions24h) {
        console.log(`📧 Sending 24h reminder for session: ${session.title}`);

        // Send to both participants
        const participants = [session.hostUserId, session.guestUserId];

        for (const user of participants) {
          // Send email
          try {
            await sendMail(
              user.email,
              `⏰ Reminder: Session in 24 hours - ${session.title}`,
              getReminderEmail(user.name, session, 24)
            );
          } catch (emailError) {
            console.error(`Failed to send 24h reminder email to ${user.email}:`, emailError);
          }

          // Send in-app notification
          try {
            await sendReminderNotification(io, user._id, {
              type: "session_reminder",
              title: "Session Tomorrow",
              message: `Reminder: "${session.title}" is scheduled for tomorrow`,
              data: {
                sessionId: session._id,
                scheduledAt: session.scheduledAt,
                hoursUntil: 24,
              },
            }, onlineUsers);
          } catch (notifError) {
            console.error(`Failed to send 24h notification to ${user._id}:`, notifError);
          }
        }

        // Mark reminder as sent
        session.reminder24hSent = true;
        await session.save();
      }

      // 1-hour reminders (sessions starting in 55-65 minutes)
      const in1Hour = new Date(now.getTime() + 65 * 60 * 1000);
      const in55Min = new Date(now.getTime() + 55 * 60 * 1000);

      const sessions1h = await Session.find({
        status: "scheduled",
        reminder1hSent: false,
        scheduledAt: {
          $gte: in55Min,
          $lte: in1Hour,
        },
      })
        .populate("hostUserId", "name email")
        .populate("guestUserId", "name email");

      // Send 1-hour reminders
      for (const session of sessions1h) {
        console.log(`📧 Sending 1h reminder for session: ${session.title}`);

        const participants = [session.hostUserId, session.guestUserId];

        for (const user of participants) {
          // Send email
          try {
            await sendMail(
              user.email,
              `⏰ Starting Soon: Session in 1 hour - ${session.title}`,
              getReminderEmail(user.name, session, 1)
            );
          } catch (emailError) {
            console.error(`Failed to send 1h reminder email to ${user.email}:`, emailError);
          }

          // Send in-app notification
          try {
            await sendReminderNotification(io, user._id, {
              type: "session_reminder",
              title: "Session in 1 Hour",
              message: `Your session "${session.title}" starts in 1 hour!`,
              data: {
                sessionId: session._id,
                scheduledAt: session.scheduledAt,
                hoursUntil: 1,
              },
            }, onlineUsers);
          } catch (notifError) {
            console.error(`Failed to send 1h notification to ${user._id}:`, notifError);
          }
        }

        // Mark reminder as sent
        session.reminder1hSent = true;
        await session.save();
      }

      // Auto-mark sessions as no-show if past scheduled time by 30 minutes and still scheduled
      const past30Min = new Date(now.getTime() - 30 * 60 * 1000);
      await Session.updateMany(
        {
          status: "scheduled",
          scheduledAt: { $lt: past30Min },
        },
        {
          $set: { status: "no-show" },
        }
      );

    } catch (error) {
      console.error("Error in reminder cron job:", error);
    }
  });

  console.log("✅ Reminder cron jobs initialized (runs every 5 minutes)");
};

module.exports = { initializeReminderJobs };
