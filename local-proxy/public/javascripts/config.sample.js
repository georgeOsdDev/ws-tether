(function(global){
  var config = {
    localProxy : "ws://"+window.location.host
    ,serverProxy : "ws://example.com:port"
  }
  global.config = config;
})(this);
