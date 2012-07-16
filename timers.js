
var microtime = require('microtime');

module.exports =  {
  t:{},
  counts:{unicode:0},
  start:function(name){
    if(!this.t[name]) this.t[name] = {total:0,start:0,samples:0};
    this.t[name].samples++;
    this.t[name].start = microtime.nowDouble()
  },
  stop:function(name){
    if(this.t[name]) {
      this.t[name].total += microtime.nowDouble()-this.t[name].start;
    }
  },
  results:function(){
    var z = this
     , times = this.t
     ;

    Object.keys(times).forEach(function(k){
       times[k].avg = times[k].total/times[k].samples;
    });

    times.counts = this.counts;
    return times;
  }//,
  //microtime:function(t){
    //var c = {mis:[2,2],ms:[1,3],ns:[4,0],s:[0,4]};
  //  if(!t)t = process.hrtime();
  //  return t[0]*1000*1000+t[1]/1000/1000;
  //}
};

