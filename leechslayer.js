const http = require("http");
const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const axios = require("axios");

// ====== RENDER KEEP ALIVE (Free Web Service Fix) ======
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

    let sha = null;

    try {
      const { data } = await axios.get(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`
          }
        }
      );
      sha = data.sha;
    } catch (err) {
      // File does not exist yet — that's fine
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    await axios.put(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        message: "Update leeches.json via LeechSlayer bot",
        content: Buffer.from(JSON.stringify([...leeches], null, 2)).toString("base64"),
        ...(sha && { sha })
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
    throw error;
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
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    // Prevent Discord timeout during cold start
    await interaction.deferReply({ ephemeral: true });

    const raw = interaction.options.getString("username") || "";
    const name = raw.toLowerCase().trim();

    if (!name) {
      return interaction.editReply("⚠ Please provide a username.");
    }

    if (interaction.commandName === "check") {
      if (leeches.has(name)) {
        return interaction.editReply(`❌ ${name} is a leech.`);
      } else {
        return interaction.editReply(`✅ ${name} is not a leech.`);
      }
    }

    if (interaction.commandName === "add") {
      if (leeches.has(name)) {
        return interaction.editReply(`⚠ ${name} already exists in the list.`);
      }

      leeches.add(name);
      saveLeeches();
      await pushToGitHub();

      return interaction.editReply(`✅ ${name} added and pushed to GitHub.`);
    }

  } catch (err) {
    console.error("Command error:", err);
    try {
      await interaction.editReply("❌ Something went wrong. Check Render logs.");
    } catch {}
  }
});

client.login(TOKEN);
