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
        "headers":data.headers || "",
        "encoding":null
      };
      var req = http.request(opt, function(res) {
        res.setEncoding("utf-8");
        var buffer = [];

        res.on("data",function(chunk){
          buffer.push(chunk);
        });

        res.on("end",function(){
          var sendData;
          if(res.headers["content-encoding"] === "gzip"){
              // sendData = {
              //   "isHttpRes":true,
              //   "key":data.key,
              //   "statusCode":res.statusCode,
              //   "headers":res.headers,
              //   "response":buffer.toString("base64")
              // };
              // socket.send(JSON.stringify(sendData));
            zlib.gunzip(buffer.join(""),function(e,str){
              if(e){
                console.log(e);
                var errData = {
                  "isHttpErr":true,
                  "key":data.key
                };
                socket.send(JSON.stringify(errData));
              }else{
                console.log(str);
                var sendData = {
                  "isHttpRes":true,
                  "key":data.key,
                  "statusCode":res.statusCode,
                  "headers":res.headers,
                  "response":str
                };
                socket.send(JSON.stringify(sendData));
              }
            });
          }else{
            sendData = {
              "isHttpRes":true,
              "key":data.key,
              "statusCode":res.statusCode,
              "headers":res.headers,
              "response":buffer.join("")
            };
            socket.send(JSON.stringify(sendData));
          }
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
      var srvSocket,requestUrl,sendData;
      requestUrl = data.requestUrl;
      srvSocket = net.connect(requestUrl.port, requestUrl.hostname, function() {
        console.log("https connect");
        tcpClients[data.key] = srvSocket;
        sendData = {
          "isHttpsConnect":true,
          "key":data.key
        };
        socket.send(JSON.stringify(sendData));
        var head = new Buffer(data.head.toString(),"base64");
        srvSocket.write(head);
      });
      srvSocket.on("data",function(httpsdata){
      console.log("https data received");
        sendData = {
          "isHttpsData":true,
          "key":data.key,
          "dataStr":httpsdata.toString("base64")
        };
        socket.send(JSON.stringify(sendData));
      });
      var errhandler = function(){
        sendData = {
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
    } else if (data.isHttpsData){
      console.log("https data send");
      var client = tcpClients[data.key];
      var d = new Buffer(data.dataStr.toString(),"base64");
      client.write(d);
    }
  });
  socket.on('close', function () {
    console.log("closed");
  });
});

// process.on('uncaughtException', function(err){
//   console.log("uncoughtException: " + err);
// });

