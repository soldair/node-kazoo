

var lexers = module.exports = {
  value:function(parser,c){

    if(c == "{") {
      //objects
      parser.emit('openobject');
      parser.tree.push('}');
      parser.setState(parser.states.key);

    } else if(c == "[" || c == ']') {
      //arrays
      
      if(c == '[') parser.emit('openarray');
      //handle close here for empty array.
      else {
        if(DEBUG_TIMERS) timer.stop('value');
        parser.setState(parser.states.delim);
        this.delim(parser,c)
        return;
      }
      parser.tree.push(']');
      parser.setState(parser.states.value);
    } else if(c == '"') {
      //strings
      parser.setState(parser.states.string);
    } else if(c < 10 || c == '-' ) {
      //numbers
      parser.setState(parser.states.number);
      this.number(parser,c);

    } else if(c == 't' || c == 'f' || c == 'n') {
      //literals
      parser.setState(parser.states.literal);
      if(!literalmap[c]) {
        return parser.error(c,'invalid start of literal found in state buffer');
      }
      parser.sdata.literal = literalmap[c];
      parser.sdata.next = 1; 

    } else {
      parser.error(c);
    }
  },
  key:function(parser,c){
    if (c == '"'){
      parser.setState(parser.states.string);
      parser.sdata.returnState = parser.states.separator;
    } else if(c == "}") {
      parser.setState(parser.states.delim);
      this.delim(parser,c);
    } else parser.error(c);
  },
  separator:function(parser,c){

    if(c == ":") {
      parser.setState(parser.states.value);
    } else {
      parser.error(c,'expected separator');
    }
  },
  delim:function(parser,c){

    if(c == parser.tree[parser.tree.length-1]) {
      //closed a structure!
      var closed = parser.tree.pop();

      if(closed == ']') parser.emit('closearray');
      else parser.emit('closeobject');

      if(!parser.tree.length) {
        parser.setState(parser.states.value);
        parser.emit('jsonclose');
      }

    } else if (c === ','){
      if(parser.tree[parser.tree.length-1] == '}') {
        parser.setState(parser.states.key);
      } else {
        parser.setState(parser.states.value);
      }
    } else {
      parser.error(c,'expecting comma');
    }
  },
  string:function(parser,c){
    if(parser.sdata.escaped) {
      if(parser.sdata.unicode) {
        parser.sdata.unicode += c;
        if(parser.sdata.unicode.length == 4) {
          ++timer.counts.unicode;
          c = String.fromCharCode(parseInt(parser.sdata.unicode,16));
          if(c) parser.buffer(c);
          else parser.error(parser.sdata.unicode,'invalid escaped unicode sequence');

          parser.sdata.escaped = false;
          parser.sdata.unicode = false;

          return;
        }
      } else if(c == '"' || c == 'n' || c == 't' || c == "\\" || c == 'r' || c == '/' || c == 'f' || c == 'b') {
        c = escapemap['\\'+c];
        parser.buffer(c);
        parser.sdata.escaped = false;
      } else if (c == 'u' ){
        parser.sdata.unicode = '';
      } else {
        parser.error(c,'invalid escaped character');
      }
    } else if (c == '\\') {
      parser.sdata.escaped = true;
    } else if(c == '"') {

      if(parser.sdata.returnState == 'separator'){
        parser.emit('key',parser.sbuf);
      } else { 
        parser.emit('value',parser.sbuf);
      }
      // transition to next state.
      if(parser.sdata.returnState) parser.setState(parser.sdata.returnState);
      else if(!parser.tree.length) parser.setState(parser.states.value);
      else parser.setState(parser.states.delim);
    }
  },
  literal:function(parser,c){
    if(c == parser.sdata.literal.charAt(parser.sdata.next)) { 
      ++parser.sdata.next;
      if( parser.sdata.literal.length == parser.sdata.next) {
        //completed literal
        parser.emit('value',parser.sdata.literal == 'null'?null:parser.sdata.literal === 'true');
        parser.setState(parser.states.delim);
      }
    } else {
      parser.error(c,'invalid for literal "'+parser.sdata.literal+'"');
    } 
  },
  number:function(parser,c){

    if(c == ',' || c == parser.tree[parser.tree.length-1]) {
      var num = Number(parser.sbuf);
      if(isNaN(num)) {
        return parser.error(parser.sbuf,'invalid number')
      }

      parser.emit('value',num);
      parser.setState(parser.states.delim);
      this.delim(parser,c);

    } else if(parser.sbuf.length > (parser.options.numberBufferMax || 40)) {
      parser.error(parser.sbuf+c,'numberBufferMax Exceded. max: '+(parser.options.numberBufferMax || 40))
    } else if (c < 10 || c == '.' || c == '+' || c == 'e' || c == 'E' || c == '.' || c == '-') {
      parser.buffer(c);
    } else {
      parser.error(c,'invalid character in number '+parser.sbuf);
    }
  }
}
, escapemap = {'\\"':"\"",'\\\\':'\\','\\/':'\/','\\t':"\t",'\\r':"\r",'\\n':"\n",'\\f':"\f",'\\b':"\b"}
, literalmap = {t:'true',f:'false',n:'null'}

