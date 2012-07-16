var test = require('tap').test;
var Stream = require('stream').Stream;
var request = require('request');

var kazoo = require(__dirname+'/../index.js');

test('does this work at all?',function(t){
    var input = request('http://nodejs.org/api/index.json');
    var parser = kazoo(input);
    var c = 0;


    parser.on('data',function(){
      console.log('parser data!',arguments);
    });

    parser.on('end',function(){
      t.end();
    });
});
