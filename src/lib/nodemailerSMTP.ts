import * as nodemailer from 'nodemailer';

export class GMailService {
  private _transporter: nodemailer.Transporter;
  constructor() {
    this._transporter = nodemailer.createTransport(
      `smtps://godinetorres@gmail.com:Octubre19@smtp.gmail.com`
    );
  }
  sendMail(to: string, subject: string, content: string) {
    let options = {
      from: 'godinetorres@gmail.com',
      to: to,
      subject: subject,
      text: content,
    };

    this._transporter.sendMail(options, (error, info) => {
      if (error) {
        return console.log(`error: ${error}`);
      }
      // console.log(`Message Sent ${info.response}`);
    });
  }
}
