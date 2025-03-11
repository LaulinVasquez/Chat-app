//  back end server
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
        const metadata = createNewClient(parsedMessage.username);
        clients.set(ws, metadata);

        // Broadcast updated user list to ALL clients, including the new one
        sendMessageToAllClients({
          type: "usernames",
          usernames: getUsernames(clients),
        });
      } else if (parsedMessage.type === "message") {
        const metadata = clients.get(ws);
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
    
    clients.delete(ws);

    sendMessageToAllClients({
      type: "disconnect",
      username: disconnectUsername,
      usernames: getUsernames(clients),
    });
  });
});

console.log(`WebSocket server running on port localhost:${PORT}`);

function sendMessageToAllClients(message) {
  if (!message || !message.type) {
    return console.error("Message is missing or invalid");
  }

  const messageString = JSON.stringify(message);
  clients.forEach((_, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

function createNewClient(username) {
  if (!username) {
    return console.error("Username is missing");
  }
  const color = Math.floor(Math.random() * 360);
  return { color, username };
}

function getUsernames(clients) {
  return Array.from(clients.values()).map(client => client.username);
}

