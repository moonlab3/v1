const nodemailer = require('nodemailer');

function AuthController () {

  sendAuthMail = async (req, res, next) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        //requireTLS: true,
        auth: {
            user: 'hclab.dev1@gmail.com',
            pass: 'ifbinfhidljqadia',
        },
    });

    let info = await transporter.sendMail({
        from: `"HcLab" <hclab.dev1@gmail.com>`,
        //to: 'moon.twinhoonii@gmail.com, moon.youngh@gmail.com',
        to: 'moon.youngh@kakao.com',
        subject: 'nangoru test 8',
        html: `<HTML> <HEAD>
                    <META HTTP-EQUIV="Cache-Control" CONTENT="no-cache, no-store">
                    <META HTTP-EQUIV="Expires" CONTENT="0">
                    </HEAD>
                    <BODY> NANGORU </BODY>
                    </HTML> `
    }).catch(console.error);

    console.log('sent: ' + JSON.stringify(info));

    res.response = { responseCode:  {type: 'page', name: 'waiting email verifying' } , result: [] };
    next();

  }

  emailAuth = (req, res, next) => {
  }

  verifyUser = (req, res, next) => {
  }
    const auth = {
        sendAuthMail,
        emailAuth,
        verifyUser
    }

    return auth;
}

module.exports = AuthController;

