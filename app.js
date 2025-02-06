const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3001 });
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("Client connected");
// This where the server receives the message from the client (check script.js, ws.onopen)
  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("Received:", parsedMessage);

      if (parsedMessage.type === "connect") {
        const metadata = createNewCliente();
        clients.set(ws, metadata);

        const connectMessage = {
          type: "connect",
          body: "New user has connected",
        };
        sendMessageToAllClients(clients, connectMessage);
      } else if (parsedMessage.type === "message") {
        const metadata = clients.get(ws);
        parsedMessage.color = metadata.color; // Assign color to message
        sendMessageToAllClients(clients, parsedMessage);
      } else {
        console.error("Invalid message type");
      }
    } catch (error) {
      console.error("Invalid JSON received");
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

console.log("WebSocket server running on ws://localhost:3001");

function sendMessageToAllClients(clients, message) {
  if (!(clients instanceof Map)) {
    return console.error("Incorrect clients value");
  }
  if (!message || typeof message !== "object") {
    return console.error("Message to send is missing or incorrect");
  }
  if (!message.type) {
    return console.error("Message type is missing");
  }

  const messageString = JSON.stringify(message);

  clients.forEach((_, client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
}

function createNewCliente() {
  return { color: Math.floor(Math.random() * 360) };
}
