import nodemailer, { SendMailOptions } from 'nodemailer';

const NODEMAILER_EMAIL = 'rafaelbrvo00@gmail.com'

export async function sendMail(toEmail: string, subject: string, text: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PW
    },
  });

  const mailOptions: SendMailOptions = {
    from: NODEMAILER_EMAIL,
    to: toEmail,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    throw err
  }
}