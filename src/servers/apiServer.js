const express = require('express');
const app = express();
const https = require('https');
const fs = require('fs');

var key = fs.readFileSync(__dirname + '/selfsigned.key');
var cert = fs.readFileSync(__dirname + '/selfsigned.crt');
const server = https.createServer({key:key, cert: cert}, app);

const v1Router = require('../mw/v1Router')(server);

app.use(express.json());
app.use(express.urlencoded({ extended: false}));
app.use('/v1', v1Router);

const config = require('config');
const apiserver = config.get('apiserver');

process.title = process.argv[2];

server.listen(apiserver.port, () => {
  console.log(`api server on. ${new Date(Date.now())} port: ${apiserver.port} `);
  
});
