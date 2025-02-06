// Call the function to establish connection
makeWebsocket();

async function makeWebsocket() {
  const ws = new WebSocket("ws://localhost:3001");

  ws.onopen = () => {
    console.log("Connected to WebSocket server");
    ws.send(JSON.stringify({ type: "connect" }));
  };

  ws.onerror = (error) => {
    console.error(`WebSocket error: ${error.message}`);
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      // Here where JSON file is parsed and displayed in the console
      console.log("Received:", message);
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
    };
    ws.send(JSON.stringify(chatMessage));

    const textInput = document.querySelector("#inputChatMessage");
    textInput.value = "";
  });
}
