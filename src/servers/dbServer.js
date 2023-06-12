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
//const csmsController = require('../mw/csmsLogics')(dbms);
//const mailer = require('./tools/mail');


io.of('apiServer').on('connection', (socket) => {
  // communication channel with API server
  // socket router for mobile app and evse API
  console.log(`dbServer: connected with ${socket.nsp.name}. ${new Date(Date.now())}`);
  
  socket.onAny(controller.preProcess);
  socket.on('cwjy', controller.extRequest);

});

io.of('nnmServer').on('connection', (socket) => {
  // communication channel with Notification and Mailing server
  // socket router for mobile app and evse API
  console.log(`dbServer: connected with ${socket.nsp.name}. ${new Date(Date.now())}`);
  socket.onAny(controller.preProcess);
  socket.on('cwjy', controller.nnmRequest);
});

/*
io.of('csmsServer').on('connection', (socket) => {
  console.log(`dbServer: connected with ${socket.nsp.name}. ${new Date(Date.now())}`);

  socket.onAny(csmsController.preProcess);
  socket.on('cwjy', csmsController.request);
});
*/

server.listen(dbServer.port, ()=> {
  // DB server initiation. setTxCount is for transaction ID(number)
  console.log(`DB server on. ${new Date(Date.now())} port: ${dbServer.port} `);
  controller.setTxCount();

  //mailer.init(config.mailsvr);
});
