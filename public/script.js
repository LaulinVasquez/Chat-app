// Client side websocket connection
const modal = document.querySelector("#modal"); 
const formUsername = document.querySelector("#formUsername");

formUsername.addEventListener("submit", (form) => {
  form.preventDefault();
  const formData = new FormData(formUsername);
  const username = formData.get("username");
  makeWebsocket(username);
  modal.close();
});

modal.showModal();

async function makeWebsocket(username) {
  if (username === undefined) {
    return console.error("Username needs to connect to websocket");
  }
  // Change of websoccket port for heroku
  const ws = new WebSocket(
    location.protocol === "https:" ? `wss://${location.host}` : `ws://${location.host}`
  );
  
  ws.heartbeat = heartbeat;
  ws.heartbeat();

  ws.onopen = () => {
    console.log("Connected to WebSocket server");
    ws.send(
      JSON.stringify({
        type: "connect",
        username,
      })
    );
  };

  ws.onerror = (error) => {
    console.error(`WebSocket error: ${error.message}`);
  };

  ws.onmessage = async (event) => {
    let message;
    
    if (event.data instanceof Blob) {
      message = await event.data.text();
    } else {
      message = event.data;
    }
    
    try {
      const parsedMessage = JSON.parse(message);
      console.log("Received:", parsedMessage);
      
      if (parsedMessage.type === "message") {
        addMessage(parsedMessage.username, parsedMessage.body, parsedMessage.color);
      } else if (parsedMessage.type === "connect") {
        displayNotifications(`${parsedMessage.username} has joined the chat`, "info");
        addUsernameToList(parsedMessage.username);
      } else if (parsedMessage.type === "disconnect") {
        displayNotifications(`${parsedMessage.username} has left the chat`, "error");
        handleUsernameRefresh(parsedMessage.usernames);
      } else if (parsedMessage.type === "heartbeat") {
        console.log("Received heartbeat");
        ws.heartbeat();
      } else if (parsedMessage.type === "usernames") {
        handleUsernameRefresh(parsedMessage.usernames);
      } else {
        console.error("Invalid message type");
      }
    } catch (error) {
      console.error("Invalid JSON received:", message);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
  };

  const chatMessageForm = document.querySelector("#formChatMessage");
  chatMessageForm.addEventListener("submit", (form) => {
    form.preventDefault();

    const data = new FormData(chatMessageForm);
    const chatMessage = {
      type: "message",
      body: data.get("chatMessage"),
      username,
    };
    ws.send(JSON.stringify(chatMessage));

    const textInput = document.querySelector("#inputChatMessage");
    textInput.value = "";
  });

  function heartbeat() {
    clearTimeout(this.pingTimeout);
    this.pingTimeout = setTimeout(() => {
      console.error("Sorry you have been disconnected from the server");
    }, 10000 * 10 + 2000);
  }

  function addMessage(messageUsername, messageBody, messageColor) {
    if (!messageUsername || !messageBody) {
      return console.error("Invalid message");
    }
    const template = document.querySelector("#templateChatMessage");
    const messageBox = document.querySelector(".boxChatMessages");
    const newMessage = template.content.firstElementChild.cloneNode(true);
    const span = document.createElement("span");
    span.textContent = messageUsername;
    span.classList.add("bold");
    newMessage.appendChild(span);
    const messageText = document.createTextNode(`: ${messageBody}`);
    newMessage.appendChild(messageText);
    const storedUsername = localStorage.getItem("username");
    if (messageUsername === storedUsername) {
      newMessage.classList.add("chatMessage", "sent");
    } else {
      newMessage.classList.add("chatMessage", "received");
    }
    newMessage.style.backgroundColor = `hsl(${messageColor}, 50%, 50%)`;
    messageBox.appendChild(newMessage);
  }

  function addUsernameToList(username) {
    if (username === undefined) {
      return console.error("Username must be defined");
    }
    const boxUsernames = document.querySelector(".boxUsernames");
    const newUsername = document.createElement("div");
    newUsername.textContent = username;
    boxUsernames.appendChild(newUsername);
  }

  function handleUsernameRefresh(newUsernames) {
    if (!Array.isArray(newUsernames)) {
      return console.error("NewUsernames must be an array");
    }
    const boxUsernames = document.querySelector(".boxUsernames");
    boxUsernames.textContent = "";
    newUsernames.forEach(addUsernameToList);
  }

  function displayNotifications(text, type, duration = 5000) {
    if (!text) {
      return console.error("Notification needs text");
    }
    if (!["info", "error"].includes(type)) {
      return console.error("Unsupported notification type");
    }
    const notification = document.createElement("div");
    notification.textContent = text;
    notification.classList.add("notification", `notification-${type}`, "show");
    document.querySelector(".areaNotifications").appendChild(notification);
    setTimeout(() => notification.classList.add("hide"), duration);
  }
}
