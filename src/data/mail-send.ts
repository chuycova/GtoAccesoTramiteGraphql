import * as nodemailer from "nodemailer";

export class MailService {
  private _transporter: nodemailer.Transporter = nodemailer.createTransport({
    service: process.env.SMTPPORT,
    host: process.env.HOST,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  constructor() { }

  sendMail(titulo: string,to: string[], subject: string, html: string){
    const options = {
      from: titulo + ' <'+process.env.MAIL_USER+'>',
      to,
      subject,
      html,
    };
    this._transporter.sendMail(options, (error, info) => {
      if (error) {
        console.log("error");
      } else {
      }
    });
  }
}
