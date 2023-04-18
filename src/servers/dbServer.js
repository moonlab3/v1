process.title = process.argv[2];
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
process.env.NODE_APP_INSTANCE = 1;

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const config = require('config');
const dbServer = config.get('dbserver');
const dbms = config.get('dbms');

const controller = require('../mw/logics')(dbms);
//const mailer = require('./tools/mail');


io.of('apiServer').on('connection', (socket) => {
  console.log(`dbServer: connected with ${socket.nsp.name}. ${new Date(Date.now())}`);
  
  socket.on('withReturn', controller.withReturn);
  //socket.on('noReturn', controller.noReturn);
  socket.onAny(controller.preProcess);

});

io.of('nnmServer').on('connection', (socket) => {
  console.log(`dbServer: connected with ${socket.nsp.name}. ${new Date(Date.now())}`);
  socket.onAny(controller.preProcess);
  socket.on('withReturn', controller.withReturn);
  //socket.on('noReturn', controller.noReturn);
});

server.listen(dbServer.port, ()=> {
  console.log(`DB server on. ${new Date(Date.now())} port: ${dbServer.port} `);
  controller.setTxCount();

  //mailer.init(config.mailsvr);
});
