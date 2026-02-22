const https = require("https");

console.log("Testing Discord API reachability...");

https.get("https://discord.com/api/v10/gateway", (res) => {
  console.log("Status Code:", res.statusCode);
}).on("error", (err) => {
  console.error("NETWORK ERROR:", err);
});
