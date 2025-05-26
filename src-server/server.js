import express from "express";
import bodyParser from 'body-parser';
import cors from "cors";
import * as http from "http";
import { WebSocketServer } from "ws";

const kPort = 5175;
const kSocketPath = "/relay"
const projSockets = [];
let lastContent = null;
let lastTimestamp = null;

// This is the entry point: starts servers
export async function run(port) {

  // Create app, server, web socket servers
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  const server = http.createServer(app);
  const socketServer = new WebSocketServer({ noServer: true });

  app.get("/", getRoot);
  app.post("/", postRoot);

  // Upgrade connections to web socker
  server.on("upgrade", (request, socket, head) => {
    if (request.url === kSocketPath) {
      socketServer.handleUpgrade(request, socket, head, (ws) => {
        socketServer.emit("connection", ws, request);
      });
    }
    else {
      socket.destroy(); // Close the connection for other paths
    }
  });

  socketServer.on("connection", (ws) => {
    projSockets.push(ws);

    ws.on("close", () => {
      const ix = projSockets.indexOf(ws);
      if (ix != -1) projSockets.splice(ix, 1);
    });

    ws.on("message", (msgStr) => {
      // handleProjectorMessage(ws, JSON.parse(msgStr));
    });
  });

  // Run
  try {
    await listen(server, port);
    console.log(`Server is listening on port ${port}`);
  }
  catch (err) {
    console.error(`Server failed to start; error:\n${err}`);
  }
}

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.listen(port)
      .once('listening', resolve)
      .once('error', reject);
  });
}

const sep = "==========================================================================\n";

function getRoot(req, response) {
  let respText = "";
  if (lastContent !== null) {
    respText += sep;
    respText += lastTimestamp + "\n";
    respText += sep;
    respText += lastContent + "\n";
    respText += sep;
  }
  respText += "Relay ready\n";
  response.set('Content-Type', 'text/plain; charset=utf-8');
  response.status(200).send(respText);
}

function postRoot(req, response) {
  lastTimestamp = new Date().toISOString();
  lastContent = req.body.command;

  // const outStr = JSON.stringify(msg);
  // for (const ps of projSockets) ps.send(outStr);

  response.status(200).send("OK");
}

void run(kPort);
