
makeQuery = (req) => {
  var query;
  switch (req.action) {
    case 'Charge':
      query = `SELECT status, occupyingUserId, occupyingEnd FROM connector 
              WHERE connectorSerial = '${req.connectorSerial}'`;
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