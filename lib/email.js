// lib/email.js
// Thin wrapper around Resend's HTTP API (plain fetch, no SDK dependency —
// keeps the app's dependency list small and works identically in the Node
// runtime used by API routes and cron functions).
//
// If RESEND_API_KEY isn't set, sendEmail() logs a warning and resolves
// without throwing — this lets the whole app run and be demoed before the
// user has set up an email provider, rather than 500ing every flow that
// happens to trigger a notification (trainer approval, session reminders).
// Every outbound email is also recorded in notifications_queue so the
// console can show a delivery log regardless of whether sending is wired up.

const RESEND_API_URL = "https://api.resend.com/emails";

function fromAddress() {
  return process.env.EMAIL_FROM || "Vidyam Learning Month <onboarding@resend.dev>";
}

export async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY not set — skipping send to ${to}: "${subject}"`);
    return { skipped: true };
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: fromAddress(), to: [to], subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
  return res.json();
}

export function trainerApprovedEmail({ trainerName, loginUrl, tempPassword }) {
  return {
    subject: "You're approved to train on Vidyam Learning Month 🎉",
    html: `
      <p>Hi ${trainerName},</p>
      <p>Your trainer application for Vidyam Learning Month has been approved. You now have your own trainer dashboard where you can propose sessions, see who's registered, share materials, and post recordings.</p>
      <p><b>Dashboard:</b> <a href="${loginUrl}">${loginUrl}</a><br/>
         <b>Temporary password:</b> ${tempPassword}</p>
      <p>You'll be asked to set a new password the first time you sign in.</p>
      <p>Thank you for volunteering your time and craft — see you in the community.</p>
    `,
  };
}

// Sent when the trainer already set their own password on the /teach
// application form — there's no temp password to relay, just the good news.
export function trainerApprovedNoPasswordEmail({ trainerName, loginUrl }) {
  return {
    subject: "You're approved to train on Vidyam Learning Month 🎉",
    html: `
      <p>Hi ${trainerName},</p>
      <p>Your trainer application for Vidyam Learning Month has been approved. You now have your own trainer dashboard where you can propose sessions, see who's registered, share materials, and post recordings.</p>
      <p><b>Dashboard:</b> <a href="${loginUrl}">${loginUrl}</a></p>
      <p>Sign in with the email and password you used when you applied.</p>
      <p>Thank you for volunteering your time and craft — see you in the community.</p>
    `,
  };
}

// Sent to the *referred* person when someone refers them as a potential
// trainer/mentor/coach — a warm, personal invitation rather than a cold
// application, per the Referral feature workflow. applyUrl is the /teach
// application pre-filled with their name/email and a hidden referral tag.
export function referralInviteEmail({ referredName, referrerName, note, applyUrl }) {
  return {
    subject: `${referrerName} thinks you'd be a great trainer on Vidyam Learning Month`,
    html: `
      <p>Hi ${referredName || "there"},</p>
      <p><b>${referrerName}</b> thought you'd be a great fit to volunteer as a trainer or mentor with Vidyam Learning Month
         — a free, community-led learning initiative.</p>
      ${note ? `<p style="padding:12px 16px;border-left:3px solid #fe8502;background:#fdf3e7;">"${note}"</p>` : ""}
      <p>There's no obligation — if it sounds interesting, you can apply in a couple of minutes here:</p>
      <p><a href="${applyUrl}">${applyUrl}</a></p>
      <p>Thanks for considering it — and thank ${referrerName} too, they clearly think highly of you.</p>
      <p>— Vidyam Learning Month</p>
    `,
  };
}

// Sent to the *referrer* once the person they referred is approved as a
// trainer — recognition instead of a cash finder's fee, matching the
// non-monetary recognition model in the Onboarding & Partnership Playbook.
export function referralThankYouEmail({ referrerName, referredName }) {
  return {
    subject: `Thanks to you, ${referredName} is now training on Vidyam! 🎉`,
    html: `
      <p>Hi ${referrerName},</p>
      <p>Great news — <b>${referredName}</b>, who you referred, has been approved as a Vidyam Learning Month trainer.</p>
      <p>Thank you for helping us find great teaching talent. We'll be crediting your referral on their trainer profile
         and giving you a shout-out in the community.</p>
      <p>— Vidyam Learning Month</p>
    `,
  };
}

export function sessionReminderEmail({ learnerName, sessionTitle, date, time }) {
  return {
    subject: `Reminder: "${sessionTitle}" is coming up`,
    html: `
      <p>Hi ${learnerName},</p>
      <p>Just a reminder that <b>${sessionTitle}</b> is happening on <b>${date}${time ? ` · ${time}` : ""}</b>.</p>
      <p>See you there!</p>
      <p>— Vidyam Learning Month</p>
    `,
  };
}
