const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

console.log("BOOTING...");

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  console.error("❌ BOT_TOKEN not found in environment variables");
  process.exit(1);
}

// ----------------------
// Express server (keeps Render happy)
// ----------------------
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ----------------------
// Discord client
// ----------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Ready event
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Error handling
client.on("error", (error) => {
  console.error("Discord client error:", error);
});

client.on("shardError", (error) => {
  console.error("Shard error:", error);
});

// Auto reconnect logic
client.on("disconnect", () => {
  console.log("⚠️ Disconnected. Attempting reconnect...");
});

// Login
client.login(TOKEN).catch((err) => {
  console.error("❌ Login failed:", err);
});
