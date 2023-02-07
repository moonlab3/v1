const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');

var key = fs.readFileSync(__dirname + '/selfsigned.key');
var cert = fs.readFileSync(__dirname + '/selfsigned.crt');
const server = https.createServer({key:key, cert: cert}, app);
const wsServer = require('./tools/wsServer');

const hscanRouter = require('./mw/hscanRouter');
const userRouter = require('./mw/userRouter');
const cpRouter = require('./mw/cpRouter');

app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use('/hscan', hscanRouter);
app.use('/user', userRouter);
app.use('/cp', cpRouter);

const config = require('config');
const apiserver = config.get('apiserver');

server.listen(apiserver.port, () => {
  console.log(`api server on. ${new Date(Date.now())} port: ${apiserver.port} `);
  wsServer.initServer(server);
  require('./mw/wsRouter')();
  
});
