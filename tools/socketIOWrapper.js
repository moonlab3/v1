const config = require('config');
const dbserver = config.get('dbserver');
const io = require('socket.io-client')(`http://${dbserver.host}:${dbserver.port}`);

sendOnly= (msg) => {
  io.emit('noReturn', msg);
}

sendAndReceive = (msg) => {
  return new Promise((resolve, reject) => {
    io.emit('withReturn', msg, (result) => {
      resolve(result);
    });
  });
}

module.exports = {
  sendOnly: sendOnly,
  sendAndReceive: sendAndReceive
}