const config = require('config');
const express = require('express');
const app = express();

const server = require('http').createServer(app);
const sockApiServer = require('socket.io')(server);

const dbServer = config.get('dbserver');
const dbms = config.get('dbms');
const dbConn = require('mysql').createConnection({
  port: dbms.port,
  host: dbms.host,
  user: dbms.user,
  password: dbms.password,
  schema: dbms.schema
});

const controller = require('./mw/dbController');

sockApiServer.on('connection', (socket) => {
  console.log(`API server connected. ${new Date(Date.now())}`);

  socket.on('read', controller.read);
  socket.on('write', controller.write);
  socket.on('update', controller.update);
  socket.on('del', controller.del);

});

server.listen(dbServer.port, ()=> {
  console.log(`DB server on. ${new Date(Date.now())} port: ${dbServer.port} `);
  dbConn.connect((err) => {
    if(err) throw err;
    console.log(`mySQL connected. ${new Date(Date.now())} port: ${dbms.port} `);
  });
});