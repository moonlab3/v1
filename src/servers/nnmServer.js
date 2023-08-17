process.title = process.argv[2];
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
process.env.NODE_APP_INSTANCE = 1;


const connDBServer = require('../tools/socketIOWrapper')('nnmServer');

var constants = require('../lib/constants');
const config = require('config');
const dbms = config.get('dbms');
const monitor = require('../mw/monitor')(dbms);
var monitorIns;

function updateRequest(cwjy) {
  //console.log('update Request: ' + JSON.stringify(cwjy));
  connDBServer.sendOnly('nnm', cwjy);

}

function init() {
  console.log('notification and monitoring server on.');
  monitor.registerSender(updateRequest);

  startMonitor(60 * constants.NNMSVR_MONITORING_INTERVAL_MIN);
}

function stopMonitor() {
  clearInterval(monitorIns);
}

function startMonitor(sec) {
  monitorIns = setInterval(monitor.watch, 1000 * sec);
}

init();

