const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");

// ==============================
// Environment Check
// ==============================
const TOKEN = process.env.BOT_TOKEN;

if (!TOKEN) {
  console.error("❌ BOT_TOKEN not found in environment variables");
  process.exit(1);
}

console.log("🚀 Booting...");

// ==============================
// Express Server (Required for Render Web Service)
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
// Discord Client
// ==============================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ==============================
// Load Name List
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
// Ready Event
// ==============================
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ==============================
// Message Command
// ==============================
client.on("messageCreate", (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!check ")) {
    const name = message.content.split("!check ")[1].trim();

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
// Login
// ==============================
client.login(TOKEN).catch((err) => {
  console.error("❌ Login failed:", err);
});
