const config = require('config');
const dbms = config.get('dbms');

const connDBServer = require('../tools/socketIOWrapper')('nnmServer');
const dbConnector = require('../tools/dbConnector')(dbms);

function init() {
  console.log('notification and monitoring server opened. not listening.');

  updateRequest();
}

function updateRequest() {
  cwjy = { action: 'admin', user: 'admin', connector: 'admin' };
  connDBServer.sendOnly(cwjy);

}

process.title = process.argv[2];

init();

