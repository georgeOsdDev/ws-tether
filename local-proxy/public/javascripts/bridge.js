(function(){

    var localWs = new WebSocket(config.localProxy)    // Local Mac
        ,proxyWs = new WebSocket(config.serverProxy);  // Proxy Server

    setUpWS(localWs,proxyWs,"local");
    setUpWS(proxyWs,localWs,"server");

    function setUpWS(fromWs,toWs,id){
      fromWs.onopen = function() {
        //console.log("connected: "+fromWs.URL);
        $("#url_"+id)
          .text(fromWs.URL)
        $("#status_"+id)
          .attr("src","/images/icon_success.png");
        var data = {
          isInit:true,
          name:"bridge"
        }
        fromWs.send(JSON.stringify(data));
      };
      fromWs.onmessage = function(message) {
        //dispatch message
        toWs.send(message.data);
      };
      fromWs.onclose = function() {
        $("#status_"+id)
          .attr("src","/images/icon_error.png");
      };
    }
})();
