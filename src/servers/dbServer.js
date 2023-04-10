const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const config = require('config');
const dbServer = config.get('dbserver');
const dbms = config.get('dbms');

const controller = require('../mw/logics')(dbms);
//const mailer = require('./tools/mail');

process.title = process.argv[2];

io.of('apiServer').on('connection', (socket) => {
  console.log(`dbServer: connected with ${socket.nsp.name}. ${new Date(Date.now())}`);
  
  socket.onAny(controller.preProcess);
  socket.on('withReturn', controller.withReturn);
  socket.on('noReturn', controller.noReturn);

});

io.of('nnmServer').on('connection', (socket) => {
  console.log(`dbServer: connected with ${socket.nsp.name}. ${new Date(Date.now())}`);
  socket.onAny(controller.preProcess);
  socket.on('withReturn', controller.withReturn);
  socket.on('noReturn', controller.noReturn);
});

server.listen(dbServer.port, ()=> {
  console.log(`DB server on. ${new Date(Date.now())} port: ${dbServer.port} `);
  controller.setTxCount();

  //mailer.init(config.mailsvr);
});
