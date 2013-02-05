(function(global){
  var config = {
    localServer : "ws://"+window.location.host
    ,proxyServer : "ws://example.com:port"
  }
  global.config = config;
})(this);
