
/**
 * Module dependencies.
 */

var url       = require('url'),
    http      = require('http'),
    path      = require('path'),
    fs        = require('fs'),
    ws        = require("websocket.io"),
    sanitize  = require('validator').sanitize,
    args      = process.argv;

//var node = args[0];
//var path = args[1];
var port    = args[2],
    sockets = {},
    buffer  = {};

var staticServer = http.createServer(function(req,res){
  var requestUrl = url.parse(req.url);
  if (requestUrl.host && requestUrl.hostname != "localhost"){
    if(sockets["bridge"]){
      var hash,sReq;
      hash = requestUrl.path + (new Date().toLocaleString());
      sReq = {
        "isHttpReq":true,
        "key":hash,
        "requestUrl":requestUrl,
        "host":requestUrl.host.split(":")[0],
        "port":requestUrl.port || 80,
        "path":requestUrl.path,
        "method":req.method || "GET",
        "headers":req.headers || "",
        "body":req.body || ""
      };

      buffer[hash] = {
        "req":req,
        "res":res
      }
      sockets["bridge"].send(JSON.stringify(sReq));
    }else{
      res.writeHead(500, {'Content-Type': 'text/html'});
      res.end("<html><body><p style='font-size:28px;'>bridge is not ready :(<p></body></html>");
    }

  }else{
    var extname = path.extname(req.url),
        contentType = 'text/plain';
    switch (extname) {
      case '.html':
        contentType = 'text/html';
        break;
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      default:
        contentType = 'text/plain';
    }
    fs.readFile(__dirname + "/public" + requestUrl.path, function(err, data) {
      if(!err) {
        res.writeHead(200, {'Content-Type': contentType,});
        res.end(data);
      } else {
        res.writeHead(404, {'Content-Type': 'text/html'});
        res.end("<html><body><p style='font-size:28px;'>404 Sorry :(<p></body></html>");
      }
    });
  }
}).listen(port,function(){
  console.log("start local proxy. PORT: "+port);
});

var server = ws.attach(staticServer);
server.on('connection', function (socket) {
  console.log("conn");
  socket.on("message",function(message) {
    var data = JSON.parse(message);
    if (data.isInit){
      sockets[data.name] = socket;
    }else if(data.isHttpRes && buffer[data.key]){
      var res,statusCode,response,responseHeaders;
      res = buffer[data.key].res;
      statusCode = data.statusCode;
      headers = data.responseHeaders;
      response = sanitize(data.response).entityDecode();
      res.writeHead(statusCode, headers);
      res.end(response);
    }
  });
  socket.on('close', function () {
    //console.log("closed");
  });
});
