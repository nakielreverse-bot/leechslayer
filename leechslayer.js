const http = require("http");
const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

// ================= KEEP RENDER ALIVE =================
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("LeechSlayer running.");
}).listen(process.env.PORT || 10000);

// ================= CONFIG =================
const TOKEN = process.env.BOT_TOKEN;
const DATA_FILE = "./leeches.json";

// ================= LOAD DATA =================
let leeches = new Set();

if (fs.existsSync(DATA_FILE)) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  data.forEach(name => leeches.add(name.toLowerCase()));
}

// ================= SAVE DATA =================
function saveLeeches() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([...leeches], null, 2));
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
      .setDescription("Add a username to the leech list")
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
    const raw = interaction.options.getString("username") || "";
    const name = raw.toLowerCase().trim();

    if (!name) {
      return interaction.reply("⚠ Please provide a username.");
    }

    // CHECK COMMAND
    if (interaction.commandName === "check") {
      if (leeches.has(name)) {
        return interaction.reply(`❌ ${name} is a leech.`);
      } else {
        return interaction.reply(`✅ ${name} is not a leech.`);
      }
    }

    // ADD COMMAND
    if (interaction.commandName === "add") {
      if (leeches.has(name)) {
        return interaction.reply(`⚠ ${name} already exists in the list.`);
      }

      leeches.add(name);
      saveLeeches();

      return interaction.reply(`✅ ${name} added successfully.`);
    }

  } catch (err) {
    console.error("Command error:", err);
    if (!interaction.replied) {
      await interaction.reply("❌ Something went wrong.");
    }
  }
});

// ================= LOGIN =================
client.login(TOKEN);
