var constants = require('../lib/constants');
const config = require('config');
const smtp = config.get('smtp');
const service = config.get('service');

const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const uaparser = require('ua-parser-js');

function AuthController () {
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

  const connDBServer = require('../lib/socketIOWrapper')('auth');

  sendAuthMail = async (req, res, next) => {

    // TODO
    // check if the email is registered already

    var authItem = { email: req.params.email, exp: (Date.now() + constants.EMAIL_AUTH_EXPIRY), 
                    code: Math.round(Math.random() * 900000 + 100000) };
    
    authList.push(authItem);

    var serviceUrl = (process.platform == 'linux') ? service.baseUrl : service.macUrl;
    let info = await transporter.sendMail({
        from: smtp.from,
        to: req.params.email,
        subject: 'HcLab email verification',
        html: `<HTML>
                <HEAD>
                 <META HTTP-EQUIV="Cache-Control" CONTENT="no-cache, no-store">
                 <META HTTP-EQUIV="Expires" CONTENT="0">
                </HEAD>
                <BODY> 
                 <A HREF = "${serviceUrl}/authentication/email/${authItem.code}"> Click here </A>
                </BODY>
               </HTML>`
    }).catch(console.error);

    console.log('sent: ' + JSON.stringify(info));

    res.response = { responseCode:  { type: 'page', name: 'waiting email verification' }, result: [] };
    next();
  }

  emailAuthStatus = async (req, res, next) => {
    var cwjy = { action: "AuthStatus", email: req.params.email};
    var resultDB = await connDBServer.sendAndReceive(cwjy);
    res.response = (resultDB) ? 
            { responseCode: { type: 'page', name: 'verification' }, result: [{ status: resultDB[0].authStatus }] } :
            { responseCode: { type: 'error', name: 'verification' }, result: [{ status: 'not found' }] };
    
    next();
  }

  signup = (req, res, next) => {
    var cwjy = { action: "SignUp", email: req.body.email, password: req.body.password};
    connDBServer.sendOnly(cwjy);
  }

  sendAuthPhone = (req, res, next) => {

  }

  phoneStatus = (req, res, next) => {

  }

  emailAuth = (req, res, next) => {
    var index = authList.findIndex(i => i.code == req.params.code);
    if(index >= 0 && authList[index].exp < Date.now()) {
      connDBServer.sendOnly({ action: "EmailAuth", email: authList[index].email} );
      authList.splice(index, 1);
      res.response = { responseCode: { type: 'page', name: 'verification' }, result: [{status: 'Success'}] };
    } else {
      console.log('verification failed');
      res.response = { responseCode: { type: 'page', name: 'verification' }, result: [{status: 'Failed' }] };
    }
    /*
    var index = authList.findIndex(i => i.code == req.params.code);
    if(index >= 0 && authList[index].exp < Date.now()) {
      dbConnector.submit(`INSERT INTO user (email, created, authStatus)
                          VALUES (${authList[index].email}, CURRENT_TIMESTAMP, 'Accepted')`);
      authList.splice(index, 1);
      res.response = { responseCode: { type: 'page', name: 'verification' }, result: [{status: 'Success'}] };
    } else {
      console.log('verification failed');
      res.response = { responseCode: { type: 'page', name: 'verification' }, result: [{status: 'Failed' }] };
    }
    res.response = {token: tok, decoded: dcded};
    */

    console.log(res.response);
    next();
  }


  login = async (req, res, next) => {
    var cwjy = { action: 'Login', email: req.body.email, password: req.body.password };
    var result = await connDBServer.sendAndReceive(cwjy);
    var token = jwt.sign({ email: req.body.email, exp: Math.floor(Date.now()/1000 + 3600) }, pk, { algorithm: 'HS256'});
    if(result) {
      var ua = uaparser(req.headers['user-agent']);
      console.log(JSON.stringify(ua));
      // TODO
      // last loggedIn update to DB
    }
    res.response = (result) ? { responseCode: { type: 'page', name: 'welcome' }, result: [{ status: 'success', token: token}] } :
                              { responseCode: { type: 'page', name: 'welcome' }, result: [{ status: 'fail'}] };

    next();
  }

  autoLogin = (req, res, next) => {

    var token = String(req.headers['authorization']).split(' ');
    if (token[0] != 'Bearer') {
      console.log('No Bear.');
      res.json({ responseCode: { type: 'error', name: 'wrong token'}, result: ['I hope you follow RFC recommendations. I dont want it either tho']});
      return;
    }
    try {
      var decode = jwt.verify(token[1], pk);
    } catch (e) {
      console.log('verification failed: ' + e);
      res.json({ responseCode: { type: 'error', name: 'wrong token'}, result: [] });
      return;
    }
    res.response = { responseCode: { type: 'page', name: 'welcome' }, result: [] };
    console.log('decoded: ' + JSON.stringify(decode));
    next();

    /*
    if(req.params.f == 'e')
      res.sendFile('/Users/leo/v1/emily.jpg');          // for showing image
    else 
      res.download('/Users/leo/v1/dump0703.sql');
      */
  }

  // for test
  getToken = async (req, res, next) => {
    var cwjy = { action: 'AuthStatus', email: req.params.test };
    var result = await connDBServer.sendAndReceive(cwjy);
    if(!result) {
      res.json({ responseCode: { type: 'error', name: 'no such a userId'}, result: [] });
      return;
    }
    console.log('userId: ' + result[0].userId);
    var token = jwt.sign({ userId: result[0].userId}, pk, { algorithm: 'HS256' });
    res.response = token;
    next();
  }

  verify = (req, res, next) => {

    var token = String(req.headers['authorization']).split(' ');
    if (token[0] != 'Bearer') {
      console.log('No Bear.');
      res.json({ responseCode: { type: 'error', name: 'wrong token'}, result: ['I hope you follow RFC recommendations. I dont want it either tho']});
      return;
    }
    try {
      var decode = jwt.verify(token[1], pk);
    } catch (e) {
      console.log('verification failed: ' + e);
      res.json({ responseCode: { type: 'error re-login', name: 'wrong token'}, result: [] });
      return;
    }

    console.log('userid: ' + decode.userId);
    req.params.user = decode.userId;
    req.body.user = decode.userId;

    next();
  }

  test = (req, res, next) => {
    var authorization = req.headers['authorization'];
    console.log('authorization: ' + authorization);
    try {
      var decode = jwt.verify(authorization, pk);
    } catch (e) {
      console.log('verification failed: ' + e);
      res.response = 'wrong token';
      next();
      return;
    }
    res.response = decode;
    next();
  }
  const auth = {
    test,
    sendAuthMail,
    emailAuthStatus,
    signup,
    sendAuthPhone,
    phoneStatus,
    emailAuth,
    login,
    autoLogin,
    getToken,
    verify
  }

    return auth;
}

module.exports = AuthController;

