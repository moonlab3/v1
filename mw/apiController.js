const config = require('config');
const dbserver = config.get('dbserver');
const sockDBServer = require('socket.io-client')(`http://${dbserver.host}:${dbserver.port}`);
const wsServer = require('../tools/wsServer');

hscanGet = (req, res, next) => {
  var preQuery = { todo: "single", table: "connector", 
                    connectorSerial: req.params.connectorSerial, userId:req.params.userId };
  sockDBServer.emit('get', preQuery, (result) => {
    console.debug(`hscan returned with ${JSON.stringify(result)}`);
    res.writeHead(200);
    res.write(`id: ${result.data.id} conn:${result.data.conn}`);
    res.end();
  });

  next();
}

hscanPut = (req, res, next) => {
  var preQuery = { todo: "", table: "connector", connectorSerial: req.params.connectorSerial, user}

}

cpGet = (req, res, next) => {
  var preQuery = { todo: "single", table: "connector", chargepointid: req.params.cpId };
}

cpPut = (req, res, next) => {

}

afterWork = (req, conn) => {
  //wsServer.sendTo('', conn, 'conf', req);
}

cpReq = (req, conn) => {
  console.debug(`rcv:: req: ${req.req} pdu: ${JSON.stringify(req.pdu)}`);
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
    case 'ShowArray':
      wsServer.showAllArray();
      break;
  }
  wsServer.sendTo('', conn, 'conf', req);
}


cpConf = (req, conn) => {
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