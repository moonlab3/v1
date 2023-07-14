var constants = require('../lib/constants');
const config = require('config');
const smtp = config.get('smtp');
const dbms = config.get('dbms');
const service = config.get('service');
//const os = require('os');
//console.log(os.networkInterfaces());

const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

function AuthController () {
  const dbConnector = require('../tools/dbConnector')(dbms);
  var pk = service.privatekey;
  var authList = [];

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

  sendAuthMail = async (req, res, next) => {

    //var code = jwt.sign({ email: req.params.email, exp: (Date.now() + constants.EMAIL_AUTH_EXPIRY)}, pk, { algorithm: 'HS256' });
    var authItem = { email: req.params.email, exp: (Date.now() + constants.EMAIL_AUTH_EXPIRY), 
                    code: Math.round(Math.random() * 900000 + 100000) };
    
    authList.push(authItem);


    let info = await transporter.sendMail({
        from: smtp.from,
        to: req.params.email,
        subject: 'HcLab email verification',
        html: `<HTML> <HEAD>
                    <META HTTP-EQUIV="Cache-Control" CONTENT="no-cache, no-store">
                    <META HTTP-EQUIV="Expires" CONTENT="0">
                    </HEAD>
                    <BODY> 
                    <A HREF = "${service.macUrl}/authentication/email/${authItem.code}"> Click here </A>
                    </BODY>
                    </HTML> `
    }).catch(console.error);

    console.log('sent: ' + JSON.stringify(info));

    res.response = { responseCode:  {type: 'page', name: 'waiting email verification' } , result: [] };
    next();
  }

  emailAuth = (req, res, next) => {
    var index = authList.findIndex(i => i.code == req.params.code);
    if(index >= 0 && authList[index].exp < Date.now()) {
      authList.splice(index, 1);
      //dbConnector.submit(`UPDATE user SET authStatus = 'Accepted' WHERE email = '${authList[index].email}'`);
      dbConnector.submit(`INSERT INTO user (userId, email, authStatus)
                          VALUES ()`);
    } else {
      console.log('verification failed');
      res.response = { responseCode: { type: 'error', name: 'verification failed' }, result: [] };
    }
    next();
    /*
    try {
      var decode = jwt.verify(req.params.code, pk);
    } catch (e) {
      console.log('verification failed: ' + e);
      res.response = 'wrong token';
      next();
      return;
    }

    if (decode.exp > Date.now()) {
      console.log(decode.exp + "::" + Date.now());
      res.response = 'verification done.';
    }
    else {
      res.response = 'jwt expired.';
    }
    */

    //res.response = {token: tok, decoded: dcded};
    console.log(res.response);
    next();
  }

  test = (req, res, next) => {

    var code = req.params.code;
    console.log(code);
    res.response = 'ok';
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
    test,
    sendAuthMail,
    emailAuth,
    verifyUser
  }

    return auth;
}

module.exports = AuthController;

