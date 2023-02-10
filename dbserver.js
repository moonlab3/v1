const config = require('config');
const express = require('express');
const app = express();

const server = require('http').createServer(app);
const sockApiServer = require('socket.io')(server);

const dbServer = config.get('dbserver');
const dbms = config.get('dbms');

const controller = require('./mw/dbController');

const dbConnector = require('./tools/dbConnector');

sockApiServer.on('connection', (socket) => {
  console.log(`API server connected. ${new Date(Date.now())}`);

  socket.on('get', controller.get);       // read
  socket.on('post', controller.post);     // create
  socket.on('put', controller.put);       // update
  socket.on('del', controller.del);       // delete

});

server.listen(dbServer.port, ()=> {
  console.log(`DB server on. ${new Date(Date.now())} port: ${dbServer.port} `);

  dbConnector.init(dbms);
});
