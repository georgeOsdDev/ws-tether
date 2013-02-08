/*
 * ws-tether | server-proxy
 * version 0.0.1
 * author: Takeharu.Oshida
 * https://github.com/georgeOsdDev/ws-tether
 */

var url  = require('url'),
    net  = require("net"),
    http = require("http"),
    zlib = require("zlib"),
    ws   = require("websocket.io"),
    args = process.argv;

//var node = args[0];
//var path = args[1];
var port = args[2],
    server = ws.listen(port, function () {
      console.log("server ploxy start:"+port);
    });

var tcpClients = {};

server.on("connection",function(socket) {
  socket.on("message",function(message) {
    var data = JSON.parse(message);
    if (data.isHttpReq){
      var opt = {
        "host":data.host,
        "hostname":data.hostname,
        "port":data.port || 80,
        "path":data.path,
        "method":data.method || "GET",
        "headers":data.headers || ""
      };
      var req = http.request(opt, function(res) {
        var chunkList = [];

        res.on("data",function(chunk){
          chunkList.push(chunk);
        });

        res.on("end",function(){
          var size,buffer,sendData;
          size = parseInt(res.headers["content-length"],10);
          buffer = Buffer.concat(chunkList,size);
          sendData = {
            "isHttpRes":true,
            "key":data.key,
            "statusCode":res.statusCode,
            "headers":res.headers,
            "response":buffer.toString("base64")
          };
          socket.send(JSON.stringify(sendData));
        });
      });

      req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        var errData = {
          "isHttpErr":true,
          "key":data.key
        };
        socket.send(JSON.stringify(errData));
      });

      if (data.body.length > 0){
        req.write(data.body);
      }
      req.end();

    } else if (data.isHttpsConnect){
      var srvSocket,requestUrl;
      requestUrl = data.requestUrl;
      srvSocket = net.connect(requestUrl.port, requestUrl.hostname, function() {
        console.log("https connect");
        tcpClients[data.key] = srvSocket;
        var sendData = {
          "isHttpsConnect":true,
          "key":data.key
        };
        socket.send(JSON.stringify(sendData));
        var head = new Buffer(data.head.toString(),"base64");
        srvSocket.write(head);
      });

      srvSocket.on("data",function(httpsdata){
        srvSocket.pause();
        var sendData = {
          "isHttpsData":true,
          "key":data.key,
          "dataStr":httpsdata.toString("base64")
        };
        socket.send(JSON.stringify(sendData));
        srvSocket.resume();
      });

      var errhandler = function(){
        var sendData = {
          "isHttpsEnd":true,
          "key":data.key
        };
        socket.send(JSON.stringify(sendData));
        delete tcpClients[data.key];
      };
      srvSocket.on('end', function() {
        console.log('socket end');
        errhandler();
      });
      srvSocket.on('timeout',function(){
        console.log('socket timeout');
        errhandler();
      });
      srvSocket.on('error',function(){
        console.log('soclet error');
        errhandler();
      });
      srvSocket.on('close',function(){
        console.log('socket closed');
        errhandler();
      });

    } else if (data.isHttpsData && tcpClients[data.key]){
      console.log("https data send");
      var client = tcpClients[data.key];
      client.pause();
      var d = new Buffer(data.dataStr.toString(),"base64");
      client.write(d);
      client.resume();
    }
  });
  socket.on('close', function () {
    console.log("closed");
  });
});

process.on('uncaughtException', function(err){
  console.log("uncoughtException:");
  console.log(err);
});

