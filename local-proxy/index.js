/*
 * ws-tether | local-proxy
 * version 0.0.1
 * author: Takeharu.Oshida
 * https://github.com/georgeOsdDev/ws-tether
 */

var url       = require('url'),
    http      = require('http'),
    net       = require('net'),
    path      = require('path'),
    fs        = require('fs'),
    ws        = require("websocket.io"),
    filed     = require('filed'),
    args      = process.argv;

//var node = args[0];
//var path = args[1];
var port    = args[2],
    webSockets = {},
    clientList  = {};

var staticServer = http.createServer(function(req,res){
  var requestUrl = url.parse(req.url);
  if (requestUrl.host && requestUrl.hostname != "localhost"){
    if (webSockets.bridge) {
      doHttpProxy(req,res);
    } else {
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.end("<html><body><p style='font-size:28px;'>bridge is not ready :(<p></body></html>");
    }
  }else{
    filed(__dirname + "/public" + requestUrl.path).pipe(res);
  }
}).listen(port,function(){
  console.log("start local proxy. PORT: "+port);
});
staticServer.on("connect",doHttpsProxy);

var server = ws.attach(staticServer);
server.on('connection', function (socket){
  console.log("conn");
  socket.on("message",function(message) {
    var data = JSON.parse(message);
    var client,statusCode,response,headers,body,buf;
    client = clientList[data.key];
    if (data.isInit){
      webSockets[data.name] = socket;
    }else if(data.isBridgeFail){
      if(client.res){
        client.res.writeHead(500, {'Content-Type': 'text/html'});
        client.res.end("<html><body><p style='font-size:28px;'>500 proxy server error :(<p></body></html>");
      }else if (client.socket){
        client.socket.end("bridge is not ready :(");
      }
    }else if(data.isHttpRes && client){
      statusCode = data.statusCode;
      headers = data.headers;
      client.res.writeHead(statusCode, headers);
      buf = new Buffer(data.response,"base64");
      client.res.end(buf);
    }else if(data.isHttpErr && client){
      console.log("http err");
      client.res.writeHead(500, {'Content-Type': 'text/html'});
      client.res.end("<html><body><p style='font-size:28px;'>500 proxy server error :(<p></body></html>");
    }else if(data.isHttpsConnect && client){
      console.log("https connect");
      client.socket.write('HTTP/1.1 200 Connection Established\r\n' +
                          'Proxy-agent: Node-Proxy\r\n' +
                          '\r\n');
    }else if(data.isHttpsData && client){
      client.socket.pause();
      console.log("https data received");
      buf = new Buffer(data.dataStr,"base64");
      client.socket.write(buf);
      client.socket.resume();
    }else if(data.isHttpsEnd && client){
      console.log("https end");
      client.socket.end();
    }
    // socket.resume();
  });
  socket.on('close', function () {
    //console.log("closed");
  });
});

function doHttpProxy(req,res){
  req.pause();
  var requestUrl,key,proxyRequest;
  requestUrl = url.parse(req.url);
  key = req.url +"_"+ (new Date().getMilliseconds());
  data = {
    "isHttpReq":true,
    "key":key,
    "requestUrl":requestUrl,
    "host":requestUrl.host.split(":")[0],
    "hostname":requestUrl.hostname,
    "port":requestUrl.port || 80,
    "path":requestUrl.path,
    "method":req.method || "GET",
    "headers":req.headers || "",
    "body":req.body || ""
  };
  clientList[key] = {
    "req":req,
    "res":res
  };
  webSockets.bridge.send(JSON.stringify(data));
  req.resume();
}

function doHttpsProxy(req,clientSocket,head){
  if (webSockets.bridge) {
    var requestUrl,key,data;
    requestUrl = url.parse('https://' + req.url);
    key = req.url +"_"+ (new Date().getMilliseconds());
    data = {
      "isHttpsConnect":true,
      "key":key,
      "requestUrl":requestUrl,
      "head":head.toString("base64")
    };

    clientList[key] = {
      "req":req,
      "socket":clientSocket
    };
    webSockets.bridge.send(JSON.stringify(data));
    clientSocket.on("data",function(data){
      clientSocket.pause();
      console.log("httpsdata send");
      var sendData = {
        "isHttpsData":true,
        "key":key,
        "dataStr":data.toString("base64")
      };
      webSockets.bridge.send(JSON.stringify(sendData));
      clientSocket.resume();
    });
  } else {
    clientSocket.end("bridge is not ready :(");
  }
}
