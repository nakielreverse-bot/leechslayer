const { Client, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TOKEN = process.env.BOT_TOKEN;
const DATA_FILE = './leeches.json';

let leeches = new Set();

if (fs.existsSync(DATA_FILE)) {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  data.forEach(name => leeches.add(name.toLowerCase()));
}

function saveLeeches() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([...leeches]), 'utf-8');
}

client.once('ready', async () => {
  console.log(`LeechSlayer online as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('check')
      .setDescription('Check if username is a leech')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Username to check')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('add')
      .setDescription('Add a username to the leech list')
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Username to add')
          .setRequired(true)
      ),
  ];

  await client.application.commands.set(commands);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const name = interaction.options.getString('name').toLowerCase();

  if (interaction.commandName === 'check') {
    if (leeches.has(name)) {
      await interaction.reply(`✅ ${name} is a leech`);
    } else {
      await interaction.reply(`❌ ${name} is not a leech`);
    }
  }

  if (interaction.commandName === 'add') {
    if (leeches.has(name)) {
      return interaction.reply(`⚠️ ${name} already exists in the list`);
    }
    leeches.add(name);
    saveLeeches();
    await interaction.reply(`✅ ${name} added to the leech list`);
  }
});

client.login(TOKEN);
