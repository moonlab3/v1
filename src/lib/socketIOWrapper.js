  const config = require('config');
  const dbserver = config.get('dbserver');
  const socketio = require('socket.io-client');

// socket.io wrapper for synchronous flow of human interface
// apiController.js and nnmServer.js can include socket.io directly, 
// it would be very lousy and difficult to read. Hence the wrapper.

function SocketClient  (namespace)  {

  var io;

  if (namespace)
    io = socketio(`http://${dbserver.host}:${dbserver.port}/${namespace}`);
  else
    io = socketio(`http://${dbserver.host}:${dbserver.port}`);

  // send message to socket.io server without return 
  sendOnly = (msg) => {
    io.emit('cwjy', msg, null);
  }

  // send message to socket.io server with return 
  sendAndReceive = (msg) => {
    return new Promise((resolve, reject) => {
      io.emit('cwjy', msg, (result) => {
        resolve(result);
      });
    });
  }

  const socketClient  = {
    sendOnly,
    sendAndReceive
  }

  return socketClient;
}

module.exports = SocketClient;