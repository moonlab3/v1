
req = (req) => {
  var query;
  query = `SELECT chargePointId FROM chargepoint 
           WHERE vendor = '${req.pdu.chargePointVendor}' AND model = '${req.pdu.chargePointModel}'`;
  return query;
}

res = (res) => {
  var query;

  return query;
}

module.exports = {
  req: req,
  res: res
}