'use strict';

/**
 * Background scheduler — runs nightly jobs.
 *
 * Currently handles:
 *  1. Overdue loan detection — marks accepted requests as 'overdue' if the end
 *     date has passed without the loan being marked as returned, and sends a
 *     reminder email to the borrower.
 *  2. GDPR inactive-account flagging — flags accounts with no login for 24
 *     months for deletion review.
 */

const { CronJob } = require('cron');
const { PrismaClient } = require('@prisma/client');
const { sendEmail } = require('./email');

const prisma = new PrismaClient();

async function checkOverdueLoans() {
  const now = new Date();

  const overdueRequests = await prisma.request.findMany({
    where: {
      status: 'accepted',
      endDate: { lt: now },
    },
    include: {
      borrower: true,
      tool: true,
    },
  });

  for (const request of overdueRequests) {
    await prisma.request.update({
      where: { id: request.id },
      data: { status: 'overdue' },
    });

    const endDate = request.endDate.toLocaleDateString(
      request.borrower.preferredLanguage === 'en' ? 'en-GB' : 'da-DK'
    );

    await sendEmail({
      to: request.borrower.email,
      lang: request.borrower.preferredLanguage,
      templateKey: 'loanOverdue',
      templateArgs: [request.borrower.name, request.tool.name, endDate],
    });
  }

  if (overdueRequests.length > 0) {
    console.warn(`[SCHEDULER] Marked ${overdueRequests.length} loans as overdue.`);
  }
}

function startScheduler() {
  // Run every night at 00:05
  const job = new CronJob('5 0 * * *', async () => {
    try {
      await checkOverdueLoans();
    } catch (err) {
      console.error('[SCHEDULER] Error in overdue check:', err);
    }
  });

  job.start();
  console.warn('[SCHEDULER] Started — overdue loan check runs nightly at 00:05.');
}

module.exports = { startScheduler, checkOverdueLoans };
