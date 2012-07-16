var Stream = require('stream').Stream
, lexers = require('./lexers.js')
, timer = require('./timers.js')
;

var DEBUG_TIMERS = false;


module.exports = function(stream,options){
  var outstream = new Stream();
  var _state;

  options = options || {};
  if(options.debug) DEBUG_TIMERS = true;

  var parser = {
    options:{},
    states:{value:'value',string:'string',number:'number',literal:'literal',key:'key',delim:'delim',separator:'separator'},
    setState:function(v){
      this.sbuf = '';
      this.sdata = {}; 
      this.state = v;
    },
    state:'value',
    sbuf:'',
    sdata:{},
    tree:[],
    parse:function(string){
      for(var i=0;i<string.length;++i) {
        c = string.charAt(i);
        this.chr(string.charAt(i));
      }
    },
    chr:function(c){
      if(this.state != this.states.string && (c == "\t" || c == "\n" || c == "\r" || c == " "))
        return;

      if(options.logState) console.log('chr: '+c+' state: '+this.state);
      lexers[this.state](this,c);
    },
    error:function(c,msg){
      msg = msg || '';
      if(msg.length) msg = '['+msg+']'
      stream.emit('error',new Error(msg+' invalid character "'+c+'" found while in state "'+this.state+'" '));
    },
    buffer:function(c){
      this.sbuf += c;
    },
    emit:function(){
         outstream.emit.apply(outstream,arguments);
    }
  };

  stream.on('data',function(buf){
    parser.parse(buf.toString?buf.toString('utf8'):buf);
    delete buf;
  });

  stream.on('end',function(){
      //process.nextTick(function(){
        outstream.emit('end');
      //});
  });

  outstream.timer = timer;
  return outstream;
}
