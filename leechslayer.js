const http = require("http");
const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const axios = require("axios");

// ====== RENDER FREE FIX ======
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("LeechSlayer running.");
}).listen(process.env.PORT || 3000);

// ====== CONFIG ======
const TOKEN = process.env.BOT_TOKEN;
const DATA_FILE = "./leeches.json";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

// ====== LOAD DATA ======
let leeches = new Set();

if (fs.existsSync(DATA_FILE)) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  data.forEach(name => leeches.add(name.toLowerCase()));
}

// ====== SAVE LOCALLY ======
function saveLeeches() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([...leeches], null, 2));
}

// ====== PUSH TO GITHUB ======
async function pushToGitHub() {
  try {
    const path = "leeches.json";

    const { data } = await axios.get(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`
        }
      }
    );

    const sha = data.sha;

    await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        message: "Update leeches.json via LeechSlayer bot",
        content: Buffer.from(JSON.stringify([...leeches], null, 2)).toString("base64"),
        sha: sha
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`
        }
      }
    );

    console.log("GitHub updated successfully.");
  } catch (error) {
    console.error("GitHub push error:", error.response?.data || error.message);
  }
}

// ====== DISCORD CLIENT ======
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
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
      .setDescription("Add a username to the leech list")
      .addStringOption(option =>
        option.setName("username")
          .setDescription("Username to add")
          .setRequired(true)
      )
  ];

  await client.application.commands.set(commands);
});

// ====== COMMAND HANDLER ======
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const name = interaction.options.getString("username").toLowerCase();

  if (interaction.commandName === "check") {
    if (leeches.has(name)) {
      return interaction.reply(`❌ ${name} is a leech.`);
    } else {
      return interaction.reply(`✅ ${name} is not a leech.`);
    }
  }

  if (interaction.commandName === "add") {
    if (leeches.has(name)) {
      return interaction.reply(`⚠ ${name} already exists in the list.`);
    }

    leeches.add(name);
    saveLeeches();
    await pushToGitHub();

    return interaction.reply(`✅ ${name} added to the leech list.`);
  }
});

client.login(TOKEN);
