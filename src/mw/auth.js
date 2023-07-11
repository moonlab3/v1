const config = require('config');
const smtp = config.get('smtp');

const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

function AuthController () {

  sendAuthMail = async (req, res, next) => {
    let transporter = nodemailer.createTransport({
        service: smtp.service,
        host: smtp.host,
        port: smtp.port,
        secure: false,
        //requireTLS: true,
        auth: {
            user: smtp.user,
            pass: smtp.pass,
        },
    });

    let info = await transporter.sendMail({
        from: smtp.from,
        to: 'moon.twinhoonii@gmail.com, moon.youngh@gmail.com',
        //to: 'moon.youngh@kakao.com',
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

  issueToken = (args) => {
    var pk = 'hclabtest-key';
    var token = jwt.sign({ email: args.email, name: args.name, abc: args.abc }, pk, { algorithm: 'HS256' });
    return token;
  }

  emailAuth = (req, res, next) => {
    var tok = issueToken(req.params);
    var dcded = jwt.verify(tok, 'hclabtest-key');
    res.response = {token: tok, decoded: dcded};
    next();
  }

  /*    async issueing token. if you need asynchronous function, use this
  issueToken = () => {
    return new Promise((resolve, reject) => {
      var pk = 'hclabtest-key';
      var token = jwt.sign({ foo: 'bar' }, pk, { algorithm: 'HS256' }, function (err, token) {
        console.log('err: ' + err);
        resolve(token);
        //console.log(token);
      });
    })
  }

  emailAuth = async (req, res, next) => {
    res.response = await issueToken();
    console.log(res.response);
    next();
  }
  */

  verifyUser = (req, res, next) => {
    next();
  }

  const auth = {
    sendAuthMail,
    emailAuth,
    verifyUser
  }

    return auth;
}

module.exports = AuthController;

