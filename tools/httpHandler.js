
makeQuery = (cwjy) => {
  var query;
  switch (cwjy.action) {
    case 'ConnectorCheck':
      query = `SELECT status, occupyingUserId, occupyingEnd FROM connector 
              WHERE connectorSerial = '${cwjy.queryObj.connectorSerial}'`;
      break;
    case 'Charge':
      query = `UPDATE connector SET status = 'charging'
              WHERE connectorSerial = '${cwjy.queryObj.connectorSerial}'`;
      break;
    case 'Reserve':
      break;
    case 'Angry':
      break;
    case 'Alarm':
      break;
    case 'Report':
      break;
  }
  return query;
}

makeMessage = (obj) => {

}

res = (res) => {
  var query;

  return query;
}

module.exports = {
  makeQuery: makeQuery,
  makeMessage: makeMessage,
  res: res
}