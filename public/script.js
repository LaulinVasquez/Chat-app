const modal = document.querySelector("#modal"); 
const formUsername = document.querySelector("#formUsername");

formUsername.addEventListener("submit", (form) => {
  form.preventDefault();
  const formData = new FormData(formUsername);
  const username = formData.get("username");
  makeWebsocket(username);
  modal.close();
  
});
// Call the function to establish connection

modal.showModal()
async function makeWebsocket(username) {
  if (username === undefined) {
    return console.error("Username needs to connect to websocket");
  }
  const ws = new WebSocket(
    location.protocol === "https:"
      ? `wss://${location.host}`
      : `ws://localhost:3001`
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

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      // Here where JSON file is parsed and displayed in the browser console
      console.log("Received:", message);
      if (message.type === "message") {
        addMessage(message.username, message.body, message.color);
      } else if (message.type === "connect") {
        displayNotifications(`
          ${message.username} has joined the chat`,
           "info"
          );
        addUsernameToList(message.username);
      } else if (message.type === "disconnect") {
        displayNotifications(`
          ${message.username} has left the chat`,
           "error"
          );
        handleUsernameRefresh(message.usernames);
      } else if (message.type === "heartbeat") {
        console.log("Received heartbeat");
        ws.heartbeat();
      } else if (message.type === "usernames") {
        handleUsernameRefresh(message.usernames);
      } else {
        console.error("Invalid message type");
      }
    } catch (error) {
      console.error("Invalid JSON received:", event.data);
    }
  };

  ws.onclose = () => {
    console.log("WebSocket connection closed");
  };

  // Move form event listener outside of ws.onmessage
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

    // Get the username of the current user
    const storedUsername = localStorage.getItem("username");

    // If the message was sent by the current user, align it right
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
      return console.error("Username must be define");
    }
    const boxUsernames = document.querySelector(".boxUsernames");
    const newUsername = document.createElement("div");
    newUsername.textContent = username;
    boxUsernames.appendChild(newUsername);
  }

  function handleUsernameRefresh(newUsernames) {
    if (newUsernames instanceof Array === false) {
      return console.error("NewUsernames must be defined");
    }

    const boxUsernames = document.querySelector(".boxUsernames");
    boxUsernames.textContent = "";
    newUsernames.forEach((username) => {
      addUsernameToList(username);
    });
  }

  function displayNotifications(text, type, duration = 5000) {
    if (text === undefined) {
      return console.error("Notification needs to have a text");
    }
    if (["info", "error"].includes(type) === false) {
      return console.error("type of notification not supported");
    }
    if (duration === undefined) {
      return console.error("Duration must be defined");
    }
    const notification = document.createElement("div");
    notification.textContent = text;

    notification.classList.add("notification");
    notification.classList.add(`notification-${type}`);
    notification.classList.add("show");

    const areaNotifications = document.querySelector(".areaNotifications");
    areaNotifications.appendChild(notification);

    setTimeout(() => {
      notification.classList.add("hide");
    }, duration);
  }
}
