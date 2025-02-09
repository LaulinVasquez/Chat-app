const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3001 });
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      console.log("Received:", parsedMessage);

      if (parsedMessage.type === "connect") {
        const metadata = createNewCliente(parsedMessage.username);
        clients.set(ws, metadata);

        const connectMessage = {
          type: "connect",
          username: metadata.username,
        };
        sendMessageToAllClients(clients, connectMessage);
        ws.send(
          JSON.stringify({
            type: "usernames",
            usernames: getUsername(clients),
          })
        );
      } else if (parsedMessage.type === "message") {
        const metadata = clients.get(ws);
        parsedMessage.color = metadata.color;
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
    const clientMetadata = clients.get(ws);
    const disconnectUsername = clientMetadata ? clientMetadata.username : "Unknown";

    sendMessageToAllClients(clients, {
      type: "disconnect",
      username: disconnectUsername,
      usernames: getUsername(clients),
    });

    clients.delete(ws);
  });
});

console.log("WebSocket server running on ws://172.20.10.3:3001");

function sendMessageToAllClients(clients, message) {
  if (!(clients instanceof Map)) {
    return console.error("Incorrect clients value");
  }
  if (!message) {
    return console.error("Message to send is missing");
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

function createNewCliente(username) {
  if (!username) {
    return console.error("Username is missing");
  }
  const color = Math.floor(Math.random() * 360);
  return { color, username };
}

function getUsername(clients) {
  const usernames = [];
  clients.forEach((value) => {
    usernames.push(value.username);
  });
  return usernames;
}
