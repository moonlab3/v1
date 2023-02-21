const dbConnector = require('../tools/dbConnector');

var dbSpeedAvg = 0, trxCount = 0;

get = async (req, callback) => {
    //console.log('reply: ' + result);

    var sql = `SELECT * FROM ${req.table} WHERE ${req.conditions[0].key} = '${req.conditions[0].value}'`;
    console.log('sql: ' + sql);
    var start = Date.now();
    var result = await dbConnector.sendQuery(sql);
    var end = Date.now();
    trxCount++;
    dbSpeedAvg = (dbSpeedAvg * (trxCount - 1) + end - start) / trxCount;
    console.log(`fetched in ${end- start} ms. average: ${dbSpeedAvg}`);
    /*
    for(var i = 0; i < result.length; i++) {
      for(var key in result[i]) {
        console.log(`${key}: ${result[i][key]}`);
      }
    }
    */

    callback(result);
}

post = (req, callback) => {

}

put = (req, callback) => {
  var sql = `UPDATE ${req.table} SET ${req.set}`

}


del = (req, callback) => {

}

showPerformance = () => {
  console.log(`transactions: ${trxCount}, average processing time(ms): ${dbSpeedAvg}`);
}

module.exports = {
  get: get,
  post: post,
  put: put,
  del: del,
  showPerformance: showPerformance
}