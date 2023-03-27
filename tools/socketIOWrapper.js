////////////////////////////////////////////
// socketClient Object with construct function
  const config = require('config');
  const dbserver = config.get('dbserver');
  const socketio = require('socket.io-client');

function SocketClient  (namespace)  {

  var io;

  if (namespace)
    io = socketio(`http://${dbserver.host}:${dbserver.port}/${namespace}`);
  else
    io = socketio(`http://${dbserver.host}:${dbserver.port}`);

  sendOnly = (msg) => {
    io.emit('noReturn', msg);
  }

  sendAndReceive = async (msg) => {
    return new Promise((resolve, reject) => {
      io.emit('withReturn', msg, (result) => {
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