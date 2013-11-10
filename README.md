# [ws-tether](https://github.com/georgeOsdDev/ws-tether)

**Yet Another Tethering Solution for iPhone4S.**

![Screen Shot](https://cacoo.com/diagrams/6cY90ptfX16LsR1a-9BEE8.png)

## Feature
ws-tether is tethering solution for iPhone4S using websocket and node.js.

`local-proxy` proxies browser's http(s) requests and pipe it to websocket messages.

`iPhone4S(safari)` acts as a relay point of adhoc Wifi network and 3G networks.

`local-proxy` receive websocket message and pipe it to http(s) requests.

## Usage
1.clone ws-tether into both your local Mac and cloud server

(e.g: <del>[Gehirn RS2](https://cp.gehirn.jp/#!/login)</del> Gehirn stopped for supporting websockets, but Fortunately [Heroku](https://blog.heroku.com/archives/2013/10/8/websockets-public-beta) is now supporting websocket in public beta.)


```bash
git clone http://github.com/georegeosddev/ws-tether.git
```

2.edit config.js
```bash
cp ws-tether/local-proxy/public/javascripts/config.sample.js ws-tether/local-proxy/public/javascripts/config.js
vi ws-tether/local-proxy/public/javascripts/config.js
```

```javascript
  var config = {
    localProxy : "ws://"+window.location.host
    ,serverProxy : "ws://"+YourCloudServerDomein+(":PORT") // if you chesed heroku, PORT is not necessary.

  }
```

3.create adhoc-wifi network on local Mac.

![createnetwork](https://raw.github.com/georgeOsdDev/ws-tether/master/asset/createnetwork.png)

([See How to](http://www.google.co.jp/search?q=mac+adhoc+network+&aq=f&oq=mac+adhoc+network+&sourceid=chrome&ie=UTF-8#hl=ja&tbo=d&sclient=psy-ab&q=how+to+create+adhoc+network+on+mac&oq=how+to+create+adhoc+network+on+mac&gs_l=serp.3..0i19j0i8i13i30i19l2j0i8i30i19.16.2202.1.2424.7.7.0.0.0.0.85.543.7.7.0...0.0...1c.1.2.serp.VwYYUVWZZT4&pbx=1&bav=on.2,or.r_gc.r_pw.r_qf.&fp=5e7c03991d80af1e&biw=1353&bih=651))
and make the note of Mac's ip-adress on network.
```bash
/sbin/ifconfig
```

4.start local-proxy on your local Mac.
```bash
cd ws-tether/local-proxy && npm start.
```

5.start server-proxy on your cloud server.
```bash
cd ws-tether/server-proxy && npm start.
```

6.Connect your iPhone4S to adhoc network and access bridge.html with safari.
```
http://Mac'sIP-adress:3000/bridge.html
```

7.setup chrome's proxy setting with some extentions(e.g. [Proxy Switchy!](http://switchy.samabox.com/))

use localhost:3000 for all protocol.

![createnetwork](https://raw.github.com/georgeOsdDev/ws-tether/master/asset/setupProxy.png)

8.Enjoy Browsing..

## Licence

Source code can be found on [github](https://github.com/georgeOsdDev/markdown-edit), licenced under [MIT](http://opensource.org/licenses/mit-license.php).

Developed by [Takeharu.Oshida](http://about.me/takeharu.oshida)

