var dbConn;
var trxCount = 0, dbSpeedAvg = 0;

init = function (dbms) {
  dbConn = require('mysql').createConnection({
    port: dbms.port,
    host: dbms.host,
    user: dbms.user,
    password: dbms.password,
    database: dbms.database
  });

  dbConn.connect((err) => {
    if (err) throw err;
    console.error(`mySQL connected. ${new Date(Date.now())} port: ${dbms.port}`);
  });
}

submitSync = async (query) => {
  if(!query)
    return null;
  return new Promise((resolve, reject) => {
    console.log('sql: ' + query);
    var start = Date.now();
    dbConn.query(query, (err, res) => {
      if (err) {
        console.log('DB error with ' + err);
        reject(err);
      }
      var end = Date.now();
      trxCount++;
      dbSpeedAvg = (dbSpeedAvg * (trxCount - 1) + end - start) / trxCount;
      console.log(`success with ${res.length} records, fetched in ${end - start}ms. average: ${dbSpeedAvg}`);
      console.log(res);
      resolve(res);
    });
  });
}

admin = function (query, auth) {
  if(auth) {
    console.log('admin mode: ' +  query);

  }

}

module.exports = {
  init: init,
  submitSync: submitSync,
  admin: admin
}