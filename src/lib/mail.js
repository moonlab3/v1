const nodemailer = require('nodemailer');

let transporter;
init = (config) => {

  transporter = nodemailer.createTransport({
    service: config.service,
    host: config.host,
    port: config.port,
    secure: false,
    auth: {
      user: config.user,
      pass: config.password
    },
  });

}

send = (email, type) => {
  var message;
  switch(String(type)) {
    case 'signup':
      message.subject = 'HcLab Sign Up Authetication';
      message.text = 'hi this is a test.';
      break;
    case 'login':
      message.subject = 'HcLab Login Authentication';
      message.text = 'This is also a test for a login.';
      break;
  }
  transporter.sendMail({
    from: `"HcLab " <moon.lab2@gmail.com>`,
    to: email,
    subject: message.subject,
    text: message.text
  });

}




module.exports = {
  init: init,
  send: send
}