const config = require('config');
const dbserver = config.get('dbserver');
const io = require('socket.io-client')(`http://${dbserver.host}:${dbserver.port}`);

send = (msg) => {
  io.emit('singleSync', msg);
}

sendAndReceive = (event, msg) => {
  return new Promise((resolve, reject) => {
    io.emit(event, msg, (result) => {
      resolve(result);
    });
  });
}

module.exports = {
  send: send,
  sendAndReceive: sendAndReceive
}