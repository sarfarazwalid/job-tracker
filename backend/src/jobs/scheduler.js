const cron = require('node-cron');
const Notification = require('../models/Notification');
const Interview = require('../models/Interview');
const JobApplication = require('../models/JobApplication');
const logger = require('../utils/logger');

/**
 * Scheduled job runner for generating notifications.
 * Runs daily at 08:00 (Asia/Dhaka, UTC+6).
 *
 * All checks are idempotent — re-running never creates duplicates.
 */

// ── Interview Proximity Notifications ────────────────────────────
const createInterviewReminders = async () => {
  const now = new Date();

  // 1. Interviews happening today
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const todayInterviews = await Interview.find({
    status: 'scheduled',
    interviewDate: { $gte: todayStart, $lte: todayEnd },
  }).lean();

  let created = 0;

  for (const interview of todayInterviews) {
    const existing = await Notification.findOne({
      userId: interview.userId,
      type: 'interview',
      title: { $regex: `Interview Today — ${interview.companyName}` },
      createdAt: { $gte: todayStart },
    }).lean();

    if (existing) continue;

    const dateStr = new Date(interview.interviewDate).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    await Notification.create({
      userId: interview.userId,
      type: 'interview',
      title: `Interview Today — ${interview.companyName}`,
      description: `Reminder: You have an interview for ${interview.jobTitle} at ${interview.companyName} today at ${dateStr}. Prepare well!`,
      priority: 'high',
      relatedEntityId: interview.applicationId,
      relatedEntityType: 'application',
      actionUrl: '/calendar',
    });

    created++;
  }

  // 2. Interviews happening tomorrow
  const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const tomorrowInterviews = await Interview.find({
    status: 'scheduled',
    interviewDate: { $gte: tomorrowStart, $lte: tomorrowEnd },
  }).lean();

  for (const interview of tomorrowInterviews) {
    const existing = await Notification.findOne({
      userId: interview.userId,
      type: 'interview',
      title: { $regex: `Interview Tomorrow — ${interview.companyName}` },
      createdAt: { $gte: todayStart },
    }).lean();

    if (existing) continue;

    const dateStr = new Date(interview.interviewDate).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    await Notification.create({
      userId: interview.userId,
      type: 'interview',
      title: `Interview Tomorrow — ${interview.companyName}`,
      description: `Reminder: You have an interview for ${interview.jobTitle} at ${interview.companyName} tomorrow at ${dateStr}. Prepare well!`,
      priority: 'high',
      relatedEntityId: interview.applicationId,
      relatedEntityType: 'application',
      actionUrl: '/calendar',
    });

    created++;
  }

  // 3. Interviews in the next 24 hours (for general upcoming reminder)
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const upcomingInterviews = await Interview.find({
    status: 'scheduled',
    interviewDate: { $gt: now, $lte: in24h },
  }).lean();

  for (const interview of upcomingInterviews) {
    // Skip if already covered by today/tomorrow checks
    const alreadyCovered = todayInterviews.some(i => i._id.toString() === interview._id.toString()) ||
      tomorrowInterviews.some(i => i._id.toString() === interview._id.toString());
    if (alreadyCovered) continue;

    const existing = await Notification.findOne({
      userId: interview.userId,
      type: 'interview',
      title: { $regex: `Upcoming interview — ${interview.companyName}` },
      createdAt: { $gte: todayStart },
    }).lean();

    if (existing) continue;

    const dateStr = new Date(interview.interviewDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    await Notification.create({
      userId: interview.userId,
      type: 'interview',
      title: `Interview Scheduled — ${interview.companyName}`,
      description: `You have an interview for ${interview.jobTitle} at ${interview.companyName} on ${dateStr}. Prepare well!`,
      priority: 'medium',
      relatedEntityId: interview.applicationId,
      relatedEntityType: 'application',
      actionUrl: '/calendar',
    });

    created++;
  }

  if (created > 0) {
    logger.info(`Interview notifications created: ${created}`);
  }
};

// ── Follow-up Suggestions ────────────────────────────────────────
const createFollowUpSuggestions = async () => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Find applications with status "Applied" that haven't been updated in 7+ days
  const staleApps = await JobApplication.find({
    status: 'Applied',
    updatedAt: { $lte: sevenDaysAgo },
  }).lean();

  let created = 0;

  for (const app of staleApps) {
    // Idempotency: check if a follow-up notification was already created for this application in the last 7 days
    const existing = await Notification.findOne({
      userId: app.userId,
      type: 'follow_up',
      relatedEntityId: app._id,
      createdAt: { $gte: sevenDaysAgo },
    }).lean();

    if (existing) continue;

    const daysSince = Math.floor(
      (Date.now() - new Date(app.updatedAt).getTime()) / (24 * 60 * 60 * 1000)
    );

    await Notification.create({
      userId: app.userId,
      type: 'follow_up',
      title: `Follow Up — ${app.companyName}`,
      description: `It's been ${daysSince} days since you applied to ${app.companyName} for ${app.jobTitle}. Consider following up!`,
      priority: 'medium',
      relatedEntityId: app._id,
      relatedEntityType: 'application',
      actionUrl: '/applications',
    });

    created++;
  }

  // Also check for interview-completed apps with no follow-up
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const interviewCompletedApps = await JobApplication.find({
    status: 'Interview_Completed',
    updatedAt: { $lte: threeDaysAgo },
  }).lean();

  for (const app of interviewCompletedApps) {
    const existing = await Notification.findOne({
      userId: app.userId,
      type: 'follow_up',
      relatedEntityId: app._id,
      title: { $regex: /Follow Up/ },
      createdAt: { $gte: threeDaysAgo },
    }).lean();

    if (existing) continue;

    const daysSince = Math.floor(
      (Date.now() - new Date(app.updatedAt).getTime()) / (24 * 60 * 60 * 1000)
    );

    await Notification.create({
      userId: app.userId,
      type: 'follow_up',
      title: `Follow Up — ${app.companyName}`,
      description: `Your interview with ${app.companyName} for ${app.jobTitle} was ${daysSince} days ago. Consider sending a thank-you note or following up.`,
      priority: 'medium',
      relatedEntityId: app._id,
      relatedEntityType: 'application',
      actionUrl: '/applications',
    });

    created++;
  }

  if (created > 0) {
    logger.info(`Follow-up notifications created: ${created}`);
  }
};

// ── Deadline Notifications ───────────────────────────────────────
const createDeadlineNotifications = async () => {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Find applications that are in Wishlist/Preparing status for 14+ days (potential deadline pressure)
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const stuckApps = await JobApplication.find({
    status: { $in: ['Wishlist', 'Preparing'] },
    createdAt: { $lte: fourteenDaysAgo },
  }).lean();

  let created = 0;

  for (const app of stuckApps) {
    const existing = await Notification.findOne({
      userId: app.userId,
      type: 'deadline',
      relatedEntityId: app._id,
      createdAt: { $gte: todayStart },
    }).lean();

    if (existing) continue;

    const daysSince = Math.floor(
      (Date.now() - new Date(app.createdAt).getTime()) / (24 * 60 * 60 * 1000)
    );

    await Notification.create({
      userId: app.userId,
      type: 'deadline',
      title: `Deadline Approaching — ${app.companyName}`,
      description: `You've had ${app.jobTitle} at ${app.companyName} in your ${app.status.toLowerCase()} list for ${daysSince} days. Consider applying before the opportunity expires.`,
      priority: 'medium',
      relatedEntityId: app._id,
      relatedEntityType: 'application',
      actionUrl: '/applications',
    });

    created++;
  }

  if (created > 0) {
    logger.info(`Deadline notifications created: ${created}`);
  }
};

// ── Combined job handler ─────────────────────────────────────────
const runNotificationJob = async () => {
  logger.info('Running scheduled notification job...');

  try {
    await createInterviewReminders();
  } catch (err) {
    logger.error(`Interview reminder job failed: ${err.message}`);
  }

  try {
    await createFollowUpSuggestions();
  } catch (err) {
    logger.error(`Follow-up suggestion job failed: ${err.message}`);
  }

  try {
    await createDeadlineNotifications();
  } catch (err) {
    logger.error(`Deadline notification job failed: ${err.message}`);
  }

  logger.info('Scheduled notification job complete.');
};

// ── Schedule ─────────────────────────────────────────────────────
let scheduledTask = null;

const startScheduler = () => {
  // Run daily at 08:00 AM (Asia/Dhaka / UTC+6 = 02:00 UTC)
  scheduledTask = cron.schedule('0 2 * * *', async () => {
    await runNotificationJob();
  }, {
    timezone: 'Asia/Dhaka',
  });

  logger.info('Notification scheduler started (daily at 08:00 Asia/Dhaka)');
};

const stopScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Notification scheduler stopped');
  }
};

module.exports = { startScheduler, stopScheduler, runNotificationJob };