
function DBConnector(dbms) {
  var trxCount = 0, dbSpeedAvg = 0;
  const dbConn = require('mysql').createConnection({
    port: dbms.port,
    host: dbms.host,
    user: dbms.user,
    password: dbms.password,
    database: dbms.database
  });

  dbConn.connect((err) => {
    if (err) throw err;
    console.error(`dbConnector:init: mySQL connected. ${new Date(Date.now())} port: ${dbms.port}`);
  });

  submitSync = async (query) => {
  //async function submitSync (query) {
    if (!query)
      return null;
    return new Promise((resolve, reject) => {
      console.log('sql: ' + query);
      var start = Date.now();
      dbConn.query(query, (err, res) => {
        if (err) {
          console.log('dbConnector:submitSync: DB error with ' + err);
          reject(err);
        }
        var end = Date.now();
        trxCount++;
        dbSpeedAvg = (dbSpeedAvg * (trxCount - 1) + end - start) / trxCount;
        console.log(`dbConnector:submitSync: success with ${res.length} records, fetched in ${end - start}ms. average: ${dbSpeedAvg}`);
        //console.log(res);
        resolve(res);
      });
    });
  }

  const dbConnector = {
    submitSync
  }

  return dbConnector;
}

module.exports = DBConnector;