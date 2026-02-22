const http = require("http");
const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const axios = require("axios");

// ================= KEEP RENDER ALIVE =================
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("LeechSlayer running.");
}).listen(process.env.PORT || 3000);

// ================= ENV =================
const TOKEN = process.env.BOT_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;

if (!TOKEN) {
  console.error("FATAL: BOT_TOKEN missing");
  process.exit(1);
}

console.log("BOOTING...");

// ================= DATA =================
const DATA_FILE = "./leeches.json";
let leeches = new Set();

if (fs.existsSync(DATA_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (Array.isArray(data)) {
      data.forEach(n => leeches.add(n.toLowerCase()));
    }
  } catch (e) {
    console.error("JSON load error:", e);
  }
}

function saveLocal() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([...leeches], null, 2));
}

async function pushToGitHub() {
  if (!GITHUB_TOKEN) return;

  const path = "leeches.json";
  let sha = null;

  try {
    try {
      const res = await axios.get(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );
      sha = res.data.sha;
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }

    await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        message: "Update leeches.json",
        content: Buffer.from(JSON.stringify([...leeches], null, 2)).toString("base64"),
        ...(sha && { sha })
      },
      { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
    );

    console.log("GitHub updated successfully.");
  } catch (err) {
    console.error("GitHub push error:", err.response?.data || err.message);
  }
}

// ================= DISCORD =================
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", async () => {
  console.log(`READY as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("check")
      .setDescription("Check username")
      .addStringOption(o =>
        o.setName("username")
         .setDescription("Username")
         .setRequired(true)
      ),

    new SlashCommandBuilder()
      .setName("add")
      .setDescription("Add username")
      .addStringOption(o =>
        o.setName("username")
         .setDescription("Username")
         .setRequired(true)
      )
  ];

  await client.application.commands.set(commands);
  console.log("Slash commands registered.");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  await interaction.deferReply();

  const name = interaction.options.getString("username").toLowerCase().trim();

  if (interaction.commandName === "check") {
    if (leeches.has(name)) {
      return interaction.editReply(`❌ ${name} is a leech.`);
    }
    return interaction.editReply(`✅ ${name} is not a leech.`);
  }

  if (interaction.commandName === "add") {
    if (leeches.has(name)) {
      return interaction.editReply(`⚠ ${name} already exists.`);
    }

    leeches.add(name);
    saveLocal();
    await pushToGitHub();

    return interaction.editReply(`✅ ${name} added & pushed to GitHub.`);
  }
});

client.login(TOKEN)
  .then(() => console.log("Discord login successful"))
  .catch(err => {
    console.error("LOGIN FAILED:", err);
    process.exit(1);
  });
