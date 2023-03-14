const express = require('express');
const app = express();

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const config = require('config');
const dbServer = config.get('dbserver');
const dbms = config.get('dbms');

const controller = require('./mw/logics');
const connector = require('./tools/dbConnector');
//const mailer = require('./tools/mail');

io.on('connection', (socket) => {
  console.log(`API server connected. ${new Date(Date.now())}`);
  
  socket.onAny(controller.preProcess);
  socket.on('single', controller.single);
  socket.on('singleSync', controller.singleSync);
  socket.on('multiple', controller.multiple);

});

server.listen(dbServer.port, ()=> {
  console.log(`DB server on. ${new Date(Date.now())} port: ${dbServer.port} `);

  connector.init(dbms);
  //mailer.init(config.mailsvr);
});
