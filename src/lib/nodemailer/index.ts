import nodemailer from "nodemailer"
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from "@/lib/nodemailer/templates"

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  }
})

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
  const htmlTemplate = 
    WELCOME_EMAIL_TEMPLATE
      .replace("{{name}}", name)
      .replace("{{intro}}", intro);

  const mailOptions = {
    from: "'Budget Tracker <budgetTracker@example.com>'",
    to: email,
    subject: `Welcome to budget tracker - your finance toolkit is ready!`,
    text: 'Thanks for joining budget tracker',
    html: htmlTemplate
  }

  await transporter.sendMail(mailOptions);
}

export const sendNewsSummaryEmail = async (
    { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
    const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE
        .replace('{{date}}', date)
        .replace('{{newsContent}}', newsContent);

    const mailOptions = {
        from: `"Budget Tracker News" <budgetTracker@example.com>`,
        to: email,
        subject: `📈 Finance News Summary Today - ${date}`,
        text: `Today's finance news summary from budgetTracker`,
        html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
};