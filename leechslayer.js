const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");

// ==============================
// ENV CHECK
// ==============================
const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error("❌ BOT_TOKEN not found in environment variables");
  process.exit(1);
}

console.log("🚀 Booting...");
console.log("Token length:", TOKEN.length);

// ==============================
// EXPRESS SERVER (Required for Render Web Service)
// ==============================
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is alive.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// ==============================
// DISCORD CLIENT
// ==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ==============================
// DEBUG + ERROR LOGGING
// ==============================
client.on("debug", (info) => {
  console.log("DEBUG:", info);
});

client.on("error", (err) => {
  console.error("❌ Discord client error:", err);
});

client.on("shardError", (err) => {
  console.error("❌ Shard error:", err);
});

client.on("shardReady", (id) => {
  console.log(`🟢 Shard ${id} ready`);
});

client.on("disconnect", () => {
  console.log("⚠ Disconnected from Discord");
});

// ==============================
// LOAD NAME LIST
// ==============================
let leechList = [];

function loadLeeches() {
  try {
    const data = fs.readFileSync("./leeches.json", "utf8");
    leechList = JSON.parse(data);
    console.log(`📄 Loaded ${leechList.length} names.`);
  } catch (err) {
    console.error("⚠ Could not load leeches.json:", err);
  }
}

loadLeeches();

// ==============================
// READY EVENT
// ==============================
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ==============================
// COMMAND HANDLER
// ==============================
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!check ")) {
    const name = message.content.split("!check ")[1]?.trim();

    if (!name) {
      return message.reply("Provide a name.");
    }

    const found = leechList.some(
      (entry) => entry.toLowerCase() === name.toLowerCase()
    );

    if (found) {
      message.reply(`❌ ${name} is in the leech list.`);
    } else {
      message.reply(`✅ ${name} is NOT in the leech list.`);
    }
  }
});

// ==============================
// LOGIN
// ==============================
console.log("🔐 Attempting Discord login...");

client.login(TOKEN)
  .then(() => {
    console.log("🔓 Login promise resolved.");
  })
  .catch((err) => {
    console.error("❌ Login failed:", err);
  });
