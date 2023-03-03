const config = require('config');
const dbserver = config.get('dbserver');
const sockDBServer = require('socket.io-client')(`http://${dbserver.host}:${dbserver.port}`);

send = (msg) => {
  sockDBServer.emit('singleSync', msg);
}

sendAndReceive = (event, msg) => {
  return new Promise((resolve, reject) => {
    sockDBServer.emit(event, msg, (result) => {
      resolve(result);
    });
  });
}

module.exports = {
  send: send,
  sendAndReceive: sendAndReceive
}