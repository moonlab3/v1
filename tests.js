function init() {
  var stdin = process.openStdin();
  var test = [];
  var empty = {};
  test.push({id:"wer", value:"dfgdf"});
  stdin.on('data', (msg) => {
    var idx = msg.slice(0, 3), value = msg.slice(3, 6);
    empty.id = String(idx);
    empty.value = {};
    empty.value.idd = String(idx);
    empty.value.idx = String(value);

    console.log(`${JSON.stringify(empty)}`);
    
    /*
    if(idx == "sho") {
      var i=0;
      while(test[i]) {
        console.log(`id:${test[i].id} value:${test[i++].value}`);
      }
    }
    else if(idx == 'arm') {
      setTimeout(alarm, 5000, value);
    }

    else {
      //const found = test.find(({id}) => id == idx);
      const found = test.find(item => item.id == idx);
      if (found) {
        console.log(`found id:${found.id} value: ${found.value}`);
      }
      else {
        var p = {id: `${idx}`, value: `${value}`};
        test.push(p);
        //console.log(`pushed ${found.id}:${found.value}`);
        console.log(`pushed ${JSON.stringify(p)}`);
      }
    }
    */

  });
};

function alarm(msg){
  console.log(`alarm called with ${msg}`);
}

init();