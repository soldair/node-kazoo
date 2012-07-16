var test = require('tap').test;
var Stream = require('stream').Stream;
var fs = require('fs');

var kazoo = require('../index.js');


test('kazoo package.json',function(t){
  var input = fs.createReadStream(__dirname+'/../package.json');
  var parser = kazoo(input)//,{logState:true});

  var count = {
    keys:0,
    values:0,
    objects:0,
    arrays:0
  };

  parser.on('openobject',function(k){
    count.objects++;
  })

  parser.on('openarray',function(){
    count.arrays++;
  });

  parser.on('key',function(){
    count.keys++;
  });

  parser.on('value',function(){
    count.values++; 
  });

  parser.on('end',function(){
    console.log('counts: ',count);
    console.log('UPTIME: ',process.uptime());
    console.log(parser.timer.results());
    t.end();
  }); 
});


function humanMemoryUse(){
  var s = [],m = process.memoryUsage();
  for( var i in m){
          s.push(i+': '+humanSize(m[i]));
  }
  return s.join(' , ');
}

function humanSize(size){
  var unit = ['b','kb','mb','gb','tb','pb']
  ,i = Math.floor(Math.log(size)/Math.log(1024))
  ,v = (size/Math.pow(1024,i))+'';
  
  if(v.indexOf('.') != -1) {
          v = v.substr(0,v.indexOf('.')+3);
  }
  return v+' '+unit[i];
}
