read = (req, callback) => {
    console.log('received: ' + JSON.stringify(req));
    //setTimeout(sendrr, 100);
    var result = {"status": "ok", "data": {"id":"user001", "conn":"conn004"}};
    console.log('reply: ' + result);
    callback(result);
}

write = (req, callback) => {

}

update = (req, callback) => {

}


del= (req, callback) => {

}

module.exports = {
  read: read,
  write: write,
  update: update,
  del: del
}