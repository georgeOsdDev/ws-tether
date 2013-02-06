/*
 * ws-tether | server-proxy
 * version 0.0.1
 * author: Takeharu.Oshida
 * https://github.com/georgeOsdDev/ws-tether
 */

var url      = require('url'),
    http     = require("http"),
    zlib     = require("zlib"),
    ws       = require("websocket.io"),
    args     = process.argv;

//var node = args[0];
//var path = args[1];
var port = args[2],
    server = ws.listen(port, function () {
      console.log("server ploxy start:"+port);
    });

server.on("connection",function(socket) {
  socket.on("message",function(message) {
    var data = JSON.parse(message);
    if (data.isHttpReq) {
      var opt,req;
      // avoid gzip
      delete data.headers["Accept-Encoding"];
      console.log(data);
      opt = {
        "host":data.host,
        "hostname":data.hostname,
        "port":data.port || 80,
        "path":data.path,
        "method":data.method || "GET",
        "headers":data.headers || ""
      };

      req = http.request(opt, function(res) {
        res.setEncoding('utf8');
        var databuf = [];
        res.on('data', function (chunk) {
          databuf.push(chunk);
        });
        res.on("end",function(){
          body = databuf.join();
          zlib.deflate(body,function(e,buffer){
            if (!e){
              var retMsg = {
                "isHttpRes":true,
                "key":data.key,
                "statusCode":res.statusCode,
                "headers":res.headers,
                "response":buffer.toString('base64')
              };
              socket.send(JSON.stringify(retMsg));
            }
          });
        });
      });

      req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
      });

      if (data.body.length > 0){
        req.write(data.body);
      }
      req.end();
    }
  });
  socket.on('close', function () {
    console.log("closed");
  });
});

process.on('uncaughtException', function(err){
  console.log("uncoughtException: " + err);
});
