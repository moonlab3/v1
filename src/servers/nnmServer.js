process.title = process.argv[2];
process.env.SUPPRESS_NO_CONFIG_WARNING = 'y';
process.env.NODE_APP_INSTANCE = 1;

const NNMSERVER_MONITORING_INTERVAL_SECS = 10;

const config = require('config');
const dbms = config.get('dbms');

const connDBServer = require('../tools/socketIOWrapper')('nnmServer');
const dbConnector = require('../tools/dbConnector')(dbms);
const monitor = require('../mw/monitor')(dbConnector);
var monitorIns;

function updateRequest(cwjy) {
  //console.log('update Request: ' + JSON.stringify(cwjy));
  connDBServer.sendOnly('nnm', cwjy);

}

function init() {
  console.log('notification and monitoring server on.');
  monitor.registerSender(updateRequest);
  //startMonitor(60 * NNMSERVER_MONITORING_INTERVAL_SECS);
}

function stopMonitor() {
  clearInterval(monitorIns);
}

function startMonitor(sec) {
  monitorIns = setInterval(monitor.watch, 1000 * sec);
}

init();

