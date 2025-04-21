const http = require("http");
const express = require("express");
const app = express();

app.use(express.static("public"));
// require("dotenv").config();

const serverPort = process.env.PORT || 3000;
const server = http.createServer(app);
const WebSocket = require("ws");

let keepAliveId;

const wss =
  process.env.NODE_ENV === "production"
    ? new WebSocket.Server({ server })
    : new WebSocket.Server({ port: 5001 });

server.listen(serverPort);
console.log(`Server started on port ${serverPort} in stage ${process.env.NODE_ENV}`);

wss.on("connection", function (ws, req) {
  console.log("Connection Opened");
  console.log("Client size: ", wss.clients.size);

  if (wss.clients.size === 1) {
    console.log("first connection. starting keepalive");
    keepServerAlive();
  }

  ws.on("message", (data) => {
    let stringifiedData = data.toString();
    if (stringifiedData === 'pong') {
      console.log('keepAlive');
      return;
    }
    let parsedData;
    try {
      parsedData = JSON.parse(stringifiedData); // 將字串轉為 JSON 物件
      console.log("收到資料：", parsedData);
  
      // 假設你傳過來的 JSON 長這樣：
      // { "type": "chat", "message": "Hello" }
      if (parsedData.Action === "Test") {
        ws.send(JSON.stringify({ Status: "Success" }));
      } else if (parsedData.Action === "Unicorn") {
        ws.send(JSON.stringify({ Status: "Error" }));
      } else if (parsedData.Action === "Disconnect") {
      ws.close();  // ← 主動斷開連線
    }
    } catch (err) {
      console.error("JSON 解析失敗：", err);
      ws.send("資料格式錯誤，請傳送正確的 JSON 字串");
    }
    //ws.send(stringifiedData);
    //broadcast(ws, stringifiedData, false);
  });

  ws.on("close", (data) => {
    console.log("closing connection");

    if (wss.clients.size === 0) {
      console.log("last client disconnected, stopping keepAlive interval");
      clearInterval(keepAliveId);
    }
  });
});

// Implement broadcast function because of ws doesn't have it
const broadcast = (ws, message, includeSelf) => {
  if (includeSelf) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } else {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

/**
 * Sends a ping message to all connected clients every 50 seconds
 */
 const keepServerAlive = () => {
  keepAliveId = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('ping');
      }
    });
  }, 50000);
};


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/recv', (req, res) => {
    console.log("recv function api");
});
