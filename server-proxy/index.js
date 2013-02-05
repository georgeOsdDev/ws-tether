var url       = require('url'),
    http     = require("http"),
    ws       = require("websocket.io"),
    sanitize = require('validator').sanitize,
    args     = process.argv;

//var node = args[0];
//var path = args[1];
var port = args[2],
    server = ws.listen(port, function () {
      console.log("ws start:"+port);
    });

server.on("connection",function(socket) {
  socket.on("message",function(message) {
    var data = JSON.parse(message);
    if (data.isHttpReq) {
      var opt,req;
      opt = {
        "host":data.host,
        "port":data.port || 80,
        "path":data.path,
        "method":data.method || "GET",
        "headers":data.headers || ""
      };

      req = http.request(opt,function(res){
          var socketResponse = [];
          res.on('data',function(chunk){
            if(res.headers["transfer-encoding"]==="chunked"){
              socketResponse.push(chunk.toString("binary"));
            }else{
              socketResponse.push(chunk);
            }
          });
          res.on('end',function(){
            var retMsg = {
              "isHttpRes":true,
              "key":data.key,
              "statusCode":res.statusCode,
              "headers":res.headers,
              "response":sanitize(socketResponse.join()).xss()
            }
            socket.send(JSON.stringify(retMsg));
          });
      });
      req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
      });
      // write data to request body
      if (data.body.length > 0){
        req.write(data.body);
      }
      req.write('data\n');
      req.end();
    }
  });
  socket.on('close', function () {
    // console.log("closed");
  });
});

// process.on('uncaughtException', function(err){
//   console.log("uncoughtException: " + err);
// });
