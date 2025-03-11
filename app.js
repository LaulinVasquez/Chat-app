const WebSocket = require("ws");

const PORT = process.env.PORT || 3001;
const wss = new WebSocket.Server({ port: PORT });

const clients = new Map();

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("Received:", parsedMessage);

      if (parsedMessage.type === "connect") {
        if (!parsedMessage.username) {
          return console.error("Username is required for connection.");
        }

        const metadata = createNewClient(parsedMessage.username);
        clients.set(ws, metadata);

        console.log("Connected clients:", [...clients.values()]);

        const connectMessage = {
          type: "connect",
          username: metadata.username,
        };
        sendMessageToAllClients(connectMessage);
        ws.send(
          JSON.stringify({
            type: "usernames",
            usernames: getUsernames(),
          })
        );
      } else if (parsedMessage.type === "message") {
        const metadata = clients.get(ws);
        if (!metadata) {
          return console.error("Message received from unknown client");
        }
        parsedMessage.color = metadata.color;
        sendMessageToAllClients(parsedMessage);
      } else {
        console.error("Invalid message type");
      }
    } catch (error) {
      console.error("Invalid JSON received");
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    const clientMetadata = clients.get(ws);
    const disconnectUsername = clientMetadata ? clientMetadata.username : "Unknown";

    sendMessageToAllClients({
      type: "disconnect",
      username: disconnectUsername,
      usernames: getUsernames(),
    });

    clients.delete(ws);
  });
});

console.log(`WebSocket server running on port localhost:${PORT}`);

function sendMessageToAllClients(message) {
  if (!message || !message.type) {
    return console.error("Invalid message format");
  }

  const messageString = JSON.stringify(message);
  clients.forEach((_, client) => {
    if (client.readyState === WebSocket.OPEN) {
      console.log("Sending to client:", message);
      client.send(messageString);
    }
  });
}

function createNewClient(username) {
  if (!username) {
    console.error("Username is missing");
    return null;
  }
  const color = Math.floor(Math.random() * 360);
  return { color, username };
}

function getUsernames() {
  return Array.from(clients.values()).map(client => client.username);
}
