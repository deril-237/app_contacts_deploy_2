import * as nodemailer from 'nodemailer';
import { config } from "dotenv";
config();

const transport = nodemailer.createTransport({
  service: process.env.MAIL_HOST,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  },
  debug: true,
  logger: true,
});

export async function sendMail(to: string, title: string, body: string) {
  try {
    const info = await transport.sendMail({
      from: `Contact register ${process.env.MAIL_USER}`,
      to,
      subject: title,
      html: body
    });
    return info;
  } catch (error) {
    console.log(error);
    throw error;
  }
}