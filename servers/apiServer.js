const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');

var key = fs.readFileSync(__dirname + '/selfsigned.key');
var cert = fs.readFileSync(__dirname + '/selfsigned.crt');
const server = https.createServer({key:key, cert: cert}, app);
const wss = require('../tools/websocketWrapper');

//const hscanRouter = require('../mw/hscanRouter');
//const userRouter = require('../mw/userRouter');
//const cpRouter = require('../mw/cpRouter');
//const hostRouter = require('../mw/hostRouter');
const v1Router = require('../mw/v1Router');

app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use('/v1', v1Router);
//app.use('/v1/hscan', hscanRouter);
//app.use('/v1/user', userRouter);
//app.use('/v1/cp', cpRouter);
//app.use('/v1/host', hostRouter);

// wrong URL response
// wrong URL response
// wrong URL response

const config = require('config');
const apiserver = config.get('apiserver');

process.title = process.argv[2];

server.listen(apiserver.port, () => {
  console.log(`api server on. ${new Date(Date.now())} port: ${apiserver.port} `);
  wss.init(server);
  require('../mw/wsRouter')();
  
});
