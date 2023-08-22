
// with multi process, same pool.
// have to go through db server socket.io
//var myPool;
function DBConnector(dbms) {
  var trxCount = 0, dbSpeedAvg = 0;
  var log = 'yes';
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

  setLog = (yn) => {
    log = yn;
  }
  // query submit without return
  submit = (query) => {
    if (!query)
      return;
    myPool.query(query, (err, res) => {
      if(err) {
        console.error('dbConnector:submit: ' + err);
      }
    });
  }

  // query submit with return
  submitSync = (query) => {   
    if (!query)
      return null;
    //console.log('query: ' + query);
    return new Promise((resolve, reject) => {
      var start = Date.now();
      myPool.query(query, (err, res) => {
        if (err) {
          console.error('dbConnector:submitSync: ' + err);
          resolve(null);
          return;
        }
        var end = Date.now();
        trxCount++;
        dbSpeedAvg = (dbSpeedAvg * (trxCount - 1) + end - start) / trxCount;

        if(log == 'yes') 
          console.debug(`${new Date()} query submitted \n ${query}\n result: ${JSON.stringify(res)}`);
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
    setLog,
    submit,
    submitSync
  }

  return dbConnector;
}

module.exports = DBConnector;