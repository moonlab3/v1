var dbConn;

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

sendQuery = function(query) {
  return new Promise((resolve, reject) => {
    dbConn.query(query, (err, res) => {
      if (err) {
        console.error('db error with ' + err);
        reject(null);
        //return null;
      }
      else {
        console.log('success with ' + res.length + 'records');
        resolve(res);
        //return res;
      }
    });

  });
}

module.exports = {
  init: init,
  sendQuery: sendQuery
}