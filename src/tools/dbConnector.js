
// with multi process, same pool.
// have to go through db server socket.io
//var myPool;
function DBConnector(dbms) {
//function DBConnector() {
  var trxCount = 0, dbSpeedAvg = 0;
  var myPool = require('mysql').createPool({
    port: dbms.port,
    host: dbms.host,
    user: dbms.user,
    password: dbms.password,
    multipleStatements: true,
    database: dbms.database
  });

  /*
  setPool = (pool) => {
    myPool = pool;
  }
  */

  // query submit without return
  submit = (query) => {
    if (!query)
      return;
    //dbConn.query(query, (err, res) => {
    myPool.query(query, (err, res) => {
      if(err) {
        console.log('dbConnector:submit: ' + err);
      }
    });
  }

  // query submit with return
  submitSync = (query) => {   
    if (!query)
      return null;
    return new Promise((resolve, reject) => {
      var start = Date.now();
      //dbConn.query(query, (err, res) => {
      myPool.query(query, (err, res) => {
        if (err) {
          console.log('dbConnector:submitSync: ' + err);
          resolve(null);
          return;
        }
        var end = Date.now();
        trxCount++;
        dbSpeedAvg = (dbSpeedAvg * (trxCount - 1) + end - start) / trxCount;

        console.log(`query: ${query}\n result: ${JSON.stringify(res)}`);
        if(res.length > 0)
          resolve(res);
        else if(res.length == undefined)
          resolve('ok');
        else
          resolve(null);
      });
    });
  }

  const dbConnector = {
    //setPool,
    submit,
    submitSync
  }

  return dbConnector;
}

module.exports = DBConnector;