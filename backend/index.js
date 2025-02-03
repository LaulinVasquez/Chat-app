const express = require("express");
// This is to call the server from any origin ;)
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: true }));

app.post("/authenticate", async (req, res) => {
  const { username } = req.body;
  return res.json({ username: username, secret: "sha256..." });
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
    });