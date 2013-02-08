(function(){

    var localWs = new WebSocket(config.localProxy)    // Local Mac
        ,proxyWs = new WebSocket(config.serverProxy);  // Proxy Server

    setUpWS(localWs,proxyWs,"local");
    setUpWS(proxyWs,localWs,"server");

    function setUpWS(fromWs,toWs,id){
      fromWs.onopen = function() {
        this.isReady = true;
        $("#url_"+id)
          .text(fromWs.URL)
        $("#status_"+id)
          .attr("src","/images/icon_success.png");
        var data = {
          isInit:true,
          name:"bridge"
        }
        this.send(JSON.stringify(data));
      };
      fromWs.onmessage = function(message) {
        if (toWs.isReady){
          console.log(toWs);
          console.log(message.data);
          toWs.send(message.data);
        }else{
          fromWs.send({"isBridgeFail":true});
        }
      };
      fromWs.onclose = function() {
        $("#status_"+id)
          .attr("src","/images/icon_error.png");
      };
    }
})();
