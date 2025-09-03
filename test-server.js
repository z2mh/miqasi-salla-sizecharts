const express = require("express");
const app = express();

// Test route
app.get("/salla/settings", (req, res) => {
  res.json({ message: "Settings page working!" });
});

app.get("/test", (req, res) => {
  res.json({ message: "Test working!" });
});

app.listen(3001, () => {
  console.log("Test server running on port 3001");
});