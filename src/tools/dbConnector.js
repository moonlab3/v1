
function DBConnector(dbms) {
  var trxCount = 0, dbSpeedAvg = 0;
  const dbConn = require('mysql').createConnection({
    port: dbms.port,
    host: dbms.host,
    user: dbms.user,
    password: dbms.password,
    multipleStatements: true,
    database: dbms.database
  });

  dbConn.connect((err) => {
    if (err) throw err;
    console.error(`dbConnector:init: mySQL connected. ${new Date(Date.now())} port: ${dbms.port}`);
  });
  submit = (query) => {
    if (!query)
      return;
    //console.log('async sql: ' + query);
    dbConn.query(query, (err, res) => {
      if(err) {
        console.log('dbConnector:submit: ' + err);
      }
    });
  }

  submitSync = (query) => {
    if (!query)
      return null;
    return new Promise((resolve, reject) => {
      //console.log('sync sql: ' + query);
      var start = Date.now();
      dbConn.query(query, (err, res) => {
        if (err) {
          console.log('dbConnector:submitSync: ' + err);
          resolve(null);
        }
        var end = Date.now();
        trxCount++;
        dbSpeedAvg = (dbSpeedAvg * (trxCount - 1) + end - start) / trxCount;
        //console.log(`dbConnector:submitSync: success with ${res.length} records, fetched in ${end - start}ms. average: ${dbSpeedAvg}`);
        if(res.length > 0)
          resolve(res);
        else
          resolve(null);
      });
    });
  }

  const dbConnector = {
    submit,
    submitSync
  }

  return dbConnector;
}

module.exports = DBConnector;