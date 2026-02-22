const http = require("http");
const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const axios = require("axios");

// ================= KEEP RENDER ALIVE =================
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("LeechSlayer running.");
}).listen(process.env.PORT || 10000);

// ================= CONFIG =================
const TOKEN = process.env.BOT_TOKEN;
const DATA_FILE = "./leeches.json";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

// ================= LOAD DATA =================
let leeches = new Set();

if (fs.existsSync(DATA_FILE)) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  data.forEach(name => leeches.add(name.toLowerCase()));
}

// ================= SAVE LOCAL =================
function saveLeeches() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([...leeches], null, 2));
}

// ================= PUSH TO GITHUB =================
async function pushToGitHub() {
  const path = "leeches.json";
  let sha = null;

  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );
    sha = data.sha;
  } catch (err) {
    if (err.response?.status !== 404) throw err;
  }

  await axios.put(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
    {
      message: "Update leeches.json via LeechSlayer",
      content: Buffer.from(JSON.stringify([...leeches], null, 2)).toString("base64"),
      ...(sha && { sha })
    },
    { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
  );
}

// ================= DISCORD CLIENT =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("clientReady", async () => {
  console.log(`LeechSlayer online as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("check")
      .setDescription("Check if username is a leech")
      .addStringOption(option =>
        option.setName("username")
          .setDescription("Username to check")
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName("add")
      .setDescription("Add username to leech list")
      .addStringOption(option =>
        option.setName("username")
          .setDescription("Username to add")
          .setRequired(true)
      )
  ];

  await client.application.commands.set(commands);
});

// ================= COMMAND HANDLER =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const name = interaction.options.getString("username").toLowerCase().trim();

    if (interaction.commandName === "check") {
      if (leeches.has(name)) {
        return interaction.reply(`❌ ${name} is a leech.`);
      } else {
        return interaction.reply(`✅ ${name} is not a leech.`);
      }
    }

    if (interaction.commandName === "add") {
      if (leeches.has(name)) {
        return interaction.reply(`⚠ ${name} already exists.`);
      }

      leeches.add(name);
      saveLeeches();
      await pushToGitHub();

      return interaction.reply(`✅ ${name} added and synced to GitHub.`);
    }

  } catch (err) {
    console.error("Command error:", err);
    if (!interaction.replied) {
      await interaction.reply("❌ Something went wrong.");
    }
  }
});

// ================= LOGIN WITH ERROR LOGGING =================
client.login(TOKEN)
  .then(() => console.log("Discord login successful"))
  .catch(err => console.error("LOGIN FAILED:", err));
