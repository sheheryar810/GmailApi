const express = require("express");
const app = express();

app.use(express.json());


process.on("uncaughtException", (err) => {
  console.error(err);
});

const PORT = process.env.PORT || 9000;

// Run Scheduled job
require("./job/scheduler")

app.listen(PORT, () => {
  console.log(`SERVICE UP ON PORT: ${PORT}`);
});
