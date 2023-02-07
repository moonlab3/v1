const config = require('config');
const dbserver = config.get('dbserver');
const sockDBServer = require('socket.io-client')(`http://${dbserver.host}:${dbserver.port}`);
const wsServer = require('../tools/wsServer');

hscanGet = (req, res, next) => {
  if (req) {
    sockDBServer.emit('read', "asdfjkl", (result) => {
      console.log(`hscan returned with ${JSON.stringify(result)}`);
      res.writeHead(200);
      res.write(`id: ${result.data.id} conn:${result.data.conn}`);
      res.end();
    });
  }
  else {
    sockDBServer.emit('update', req.data, (result) => {

    });
  }
  next();
}

hscanPut = (req, res, next) => {
  var data = req.params.id;

}

cpGet = (req, res, next) => {

}

cpPut = (req, res, next) => {

}

afterWork = (req, res) => {

}

cpReq = (req, conn, cb) => {
  console.log(`rcv:: req: ${req.req} pdu: ${JSON.stringify(req.pdu)}`);
  switch(String(req.req)) {
    case 'BootNotification':
      wsServer.storeSocket(req.pdu.connectorSerial, conn);
      break;
    case 'Authorize':
      req.pdu.idTag = '';
      req.pdu.idTagInfo = {};
      req.pdu.idTagInfo.status = 'Accepted';
      break;
    case 'HeartBeat':
      wsServer.storeSocket(req.pdu.connectorSerial, conn);
      req.pdu.currentTime = Date.now();
      break;
    case 'MeterValues':
      req.pdu.connectorId = 0;
      req.pdu.connectorSerial = '';
      break;
    case 'StartTransaction':
      req.pdu.connectorId = 0;
      req.pdu.connectorSerial = '';
      req.pdu.idTagInfo = {};
      req.pdu.idTagInfo.status = 'Accepted';
      break;
    case 'StatusNotification':
      req.pdu.connectorId = 0;
      req.pdu.connectorSerial = '';
      req.pdu.status = '';
      break;
    case 'StopTransaction':
      req.pdu.connectorId = 0;
      req.pdu.connectorSerial = '';
      req.pdu.transactionId = 0;
      break;
  }
  wsServer.sendTo('', conn, 'conf', req);
  cb();
}


cpConf = (req, conn, cb) => {
  cb();
}

module.exports = {
  hscanGet: hscanGet,
  hscanPut: hscanPut,
  cpGet: cpGet,
  cpPut: cpPut,
  cpReq: cpReq,
  cpConf: cpConf,
  afterWork: afterWork
};