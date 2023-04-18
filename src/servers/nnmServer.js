process.title = process.argv[2];
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
process.env.NODE_APP_INSTANCE = 1;

const config = require('config');
const dbms = config.get('dbms');

const connDBServer = require('../tools/socketIOWrapper')('nnmServer');
const dbConnector = require('../tools/dbConnector')(dbms);
const monitor = require('../mw/monitor')(dbConnector);

function updateRequest(cwjy) {
  //cwjy = { action: 'admin', user: 'admin', connector: 'admin' };
  //console.log('update Request: ' + JSON.stringify(cwjy));
  connDBServer.sendOnly(cwjy);

}

function init() {
  console.log('notification and monitoring server on.');
  monitor.registerSender(updateRequest);

  setInterval(monitor.watch, 1000 * 60 * 60 );    //  every hour
  

}

init();

