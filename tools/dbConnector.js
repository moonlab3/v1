var dbConn;

init = function (dbms) {
  dbConn = require('mysql').createConnection({
    port: dbms.port,
    host: dbms.host,
    user: dbms.user,
    password: dbms.password,
    schema: dbms.schema
  });

  dbConn.connect((err) => {
    if (err) throw err;
    console.error(`mySQL connected. ${new Date(Date.now())} port: ${dbms.port}`);
  });
}

sendQuery = function(query) {
  dbConn.query(query, (err, res) => {
    if(err) {
      console.error('db error with ' + err);
      return null;
    }
    else {
      console.debug('success with ' + res.length + 'records');
    }
    return res;
  });
}

module.exports = {
  init: init,
  sendQuery: sendQuery
}