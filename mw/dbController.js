get = (preQuery, callback) => {
    //console.log('received: ' + JSON.stringify(req));
    var result = {"status": "ok", "data": {"id":"user001", "conn":"conn004"}};
    //console.log('reply: ' + result);
    callback(result);
}

post = (req, callback) => {

}

put = (req, callback) => {

}


del= (req, callback) => {

}

module.exports = {
  get: get,
  post: post,
  put: put,
  del: del
}