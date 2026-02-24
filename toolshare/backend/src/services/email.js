'use strict';

/**
 * Email service — supports SendGrid and Resend as providers.
 * All transactional emails are mandatory; users cannot opt out.
 * Emails are sent in the recipient's preferred language (da/en).
 */

const sgMail = process.env.EMAIL_PROVIDER === 'sendgrid' ? require('@sendgrid/mail') : null;

if (sgMail && process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// ─── Templates ───────────────────────────────────────────────────────────────

const templates = {
  verifyEmail: {
    da: (name, link) => ({
      subject: 'Bekræft din e-mailadresse – ToolShare',
      html: `
        <p>Hej ${name},</p>
        <p>Tak fordi du oprettede en konto hos ToolShare.</p>
        <p>Klik på linket nedenfor for at bekræfte din e-mailadresse:</p>
        <p><a href="${link}">Bekræft e-mail</a></p>
        <p>Linket udløber efter 24 timer.</p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (name, link) => ({
      subject: 'Verify your email address – ToolShare',
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for creating a ToolShare account.</p>
        <p>Click the link below to verify your email address:</p>
        <p><a href="${link}">Verify email</a></p>
        <p>This link expires in 24 hours.</p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  borrowRequestReceived: {
    da: (ownerName, borrowerName, toolName, startDate, endDate, message, actionLink) => ({
      subject: `Ny låneforespørgsel for ${toolName} – ToolShare`,
      html: `
        <p>Hej ${ownerName},</p>
        <p><strong>${borrowerName}</strong> ønsker at låne dit redskab <strong>${toolName}</strong>.</p>
        <p><strong>Periode:</strong> ${startDate} – ${endDate}</p>
        ${message ? `<p><strong>Besked:</strong> ${message}</p>` : ''}
        <p><a href="${actionLink}">Se og besvar forespørgslen</a></p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (ownerName, borrowerName, toolName, startDate, endDate, message, actionLink) => ({
      subject: `New borrow request for ${toolName} – ToolShare`,
      html: `
        <p>Hi ${ownerName},</p>
        <p><strong>${borrowerName}</strong> would like to borrow your tool <strong>${toolName}</strong>.</p>
        <p><strong>Dates:</strong> ${startDate} – ${endDate}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        <p><a href="${actionLink}">View and respond to the request</a></p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  requestCancelledByBorrower: {
    da: (ownerName, borrowerName, toolName) => ({
      subject: `Låneforespørgsel trukket tilbage – ${toolName}`,
      html: `
        <p>Hej ${ownerName},</p>
        <p><strong>${borrowerName}</strong> har trukket sin forespørgsel om at låne <strong>${toolName}</strong> tilbage.</p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (ownerName, borrowerName, toolName) => ({
      subject: `Borrow request withdrawn – ${toolName}`,
      html: `
        <p>Hi ${ownerName},</p>
        <p><strong>${borrowerName}</strong> has withdrawn their request to borrow <strong>${toolName}</strong>.</p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  requestAccepted: {
    da: (borrowerName, toolName, startDate, endDate, pickupAddress, pickupNote) => ({
      subject: `Din forespørgsel er accepteret – ${toolName}`,
      html: `
        <p>Hej ${borrowerName},</p>
        <p>Din forespørgsel om at låne <strong>${toolName}</strong> er blevet accepteret!</p>
        <p><strong>Periode:</strong> ${startDate} – ${endDate}</p>
        <p><strong>Afhentningssted:</strong> ${pickupAddress}</p>
        ${pickupNote ? `<p><strong>Note:</strong> ${pickupNote}</p>` : ''}
        <p>Husk at returnere redskabet til aftalt tid.</p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (borrowerName, toolName, startDate, endDate, pickupAddress, pickupNote) => ({
      subject: `Your request has been accepted – ${toolName}`,
      html: `
        <p>Hi ${borrowerName},</p>
        <p>Your request to borrow <strong>${toolName}</strong> has been accepted!</p>
        <p><strong>Dates:</strong> ${startDate} – ${endDate}</p>
        <p><strong>Pick-up address:</strong> ${pickupAddress}</p>
        ${pickupNote ? `<p><strong>Note:</strong> ${pickupNote}</p>` : ''}
        <p>Please remember to return the tool by the agreed date.</p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  requestDeclined: {
    da: (borrowerName, toolName) => ({
      subject: `Din forespørgsel er afvist – ${toolName}`,
      html: `
        <p>Hej ${borrowerName},</p>
        <p>Din forespørgsel om at låne <strong>${toolName}</strong> er desværre blevet afvist.</p>
        <p>Du er velkommen til at søge efter andre tilgængelige redskaber på ToolShare.</p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (borrowerName, toolName) => ({
      subject: `Your request was not accepted – ${toolName}`,
      html: `
        <p>Hi ${borrowerName},</p>
        <p>Unfortunately, your request to borrow <strong>${toolName}</strong> was not accepted.</p>
        <p>Feel free to browse other available tools on ToolShare.</p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  loanOverdue: {
    da: (borrowerName, toolName, endDate) => ({
      subject: `Påmindelse: Returnering af ${toolName} er forfaldet`,
      html: `
        <p>Hej ${borrowerName},</p>
        <p>Den aftalte returneringsdato for <strong>${toolName}</strong> var <strong>${endDate}</strong>, men lånet er endnu ikke markeret som returneret.</p>
        <p>Vær venlig at returnere redskabet hurtigst muligt og markere det som returneret på ToolShare.</p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (borrowerName, toolName, endDate) => ({
      subject: `Reminder: Return of ${toolName} is overdue`,
      html: `
        <p>Hi ${borrowerName},</p>
        <p>The agreed return date for <strong>${toolName}</strong> was <strong>${endDate}</strong>, but the loan has not yet been marked as returned.</p>
        <p>Please return the tool as soon as possible and mark it as returned on ToolShare.</p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  loanReturned: {
    da: (recipientName, toolName, reviewLink) => ({
      subject: `${toolName} er returneret – efterlad en anmeldelse`,
      html: `
        <p>Hej ${recipientName},</p>
        <p>Lånet af <strong>${toolName}</strong> er nu afsluttet.</p>
        <p>Del gerne din oplevelse ved at efterlade en anmeldelse:</p>
        <p><a href="${reviewLink}">Skriv en anmeldelse</a></p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (recipientName, toolName, reviewLink) => ({
      subject: `${toolName} has been returned – leave a review`,
      html: `
        <p>Hi ${recipientName},</p>
        <p>The loan of <strong>${toolName}</strong> is now complete.</p>
        <p>Share your experience by leaving a review:</p>
        <p><a href="${reviewLink}">Write a review</a></p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  lenderAccountDeleted: {
    da: (borrowerName, toolName) => ({
      subject: `Din forespørgsel er annulleret – ${toolName}`,
      html: `
        <p>Hej ${borrowerName},</p>
        <p>Udlejeren af <strong>${toolName}</strong> har slettet sin konto. Din forespørgsel er derfor automatisk annulleret.</p>
        <p>Du er velkommen til at søge efter andre tilgængelige redskaber på ToolShare.</p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (borrowerName, toolName) => ({
      subject: `Your request has been cancelled – ${toolName}`,
      html: `
        <p>Hi ${borrowerName},</p>
        <p>The owner of <strong>${toolName}</strong> has deleted their account. Your request has been automatically cancelled.</p>
        <p>Feel free to browse other available tools on ToolShare.</p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  warning: {
    da: (userName, reason) => ({
      subject: 'Advarsel fra ToolShare',
      html: `
        <p>Hej ${userName},</p>
        <p>Du har modtaget en advarsel fra ToolShare-administrationen.</p>
        <p><strong>Årsag:</strong> ${reason}</p>
        <p>Gentagne overtrædelser kan føre til suspendering af din konto.</p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (userName, reason) => ({
      subject: 'Warning from ToolShare',
      html: `
        <p>Hi ${userName},</p>
        <p>You have received a warning from the ToolShare administration.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Repeated violations may lead to suspension of your account.</p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  suspended: {
    da: (userName, reason) => ({
      subject: 'Din konto er suspenderet – ToolShare',
      html: `
        <p>Hej ${userName},</p>
        <p>Din ToolShare-konto er blevet suspenderet.</p>
        <p><strong>Årsag:</strong> ${reason}</p>
        <p>Kontakt os hvis du mener dette er en fejl.</p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (userName, reason) => ({
      subject: 'Your account has been suspended – ToolShare',
      html: `
        <p>Hi ${userName},</p>
        <p>Your ToolShare account has been suspended.</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>Contact us if you believe this is a mistake.</p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },

  dataDownloadReady: {
    da: (userName, downloadLink) => ({
      subject: 'Dine personlige data er klar til download',
      html: `
        <p>Hej ${userName},</p>
        <p>Dine personlige data er klar. Du kan downloade dem her:</p>
        <p><a href="${downloadLink}">Download mine data</a></p>
        <p>Linket er gyldigt i 48 timer.</p>
        <p>Med venlig hilsen,<br>ToolShare-teamet</p>
      `,
    }),
    en: (userName, downloadLink) => ({
      subject: 'Your personal data is ready to download',
      html: `
        <p>Hi ${userName},</p>
        <p>Your personal data is ready. You can download it here:</p>
        <p><a href="${downloadLink}">Download my data</a></p>
        <p>This link is valid for 48 hours.</p>
        <p>Best regards,<br>The ToolShare team</p>
      `,
    }),
  },
};

// ─── Send helper ─────────────────────────────────────────────────────────────

async function sendEmail({ to, lang = 'da', templateKey, templateArgs }) {
  const langKey = lang === 'en' ? 'en' : 'da';
  const template = templates[templateKey];

  if (!template) {
    throw new Error(`Unknown email template: ${templateKey}`);
  }

  const { subject, html } = template[langKey](...templateArgs);

  const msg = {
    to,
    from: {
      email: process.env.EMAIL_FROM || 'noreply@toolshare.dk',
      name: process.env.EMAIL_FROM_NAME || 'ToolShare',
    },
    subject,
    html,
  };

  if (process.env.NODE_ENV === 'test') {
    // In test mode, skip actual delivery
    return;
  }

  if (process.env.EMAIL_PROVIDER === 'sendgrid' && sgMail) {
    await sgMail.send(msg);
  } else if (process.env.EMAIL_PROVIDER === 'resend') {
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ ...msg, from: `${msg.from.name} <${msg.from.email}>` });
  } else {
    // Development fallback — log to console
    console.warn(`[EMAIL] To: ${to} | Subject: ${subject}`);
  }
}

module.exports = { sendEmail };
