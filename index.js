const { ActivityType, Client, Collection, EmbedBuilder, Events, GatewayIntentBits, DiscordjsError, Attachment, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const config = require('./config.json');

let userWallet = [];
let KKprice = 1000;

client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log('Logged in as ' + client.user.tag);
    client.user.setActivity({ type: ActivityType.Watching, name: 'you' });
});

client.on('guildCreate', guild => {
    setCommands(guild.id);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.content == 'relog') {
        deleteCommands(message.guild.id);
        setCommands(message.guild.id);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName } = interaction;
    if (commandName == 'work') {
        let coins = Math.floor(Math.random() * 100000);
        if (!userWallet[interaction.user.id]) {
            userWallet[interaction.user.id] = { coins: coins , KK: 0 };
        }
        else {
            userWallet[interaction.user.id].coins += coins;
        }
        interaction.reply(`You worked and earned ${coins} coins`);
    }
    else if (commandName == 'wallet') {
        if (!userWallet[interaction.user.id]) {
            userWallet[interaction.user.id] = { coins: 0 , KK: 0 };
        }
        interaction.reply(`You have ${userWallet[interaction.user.id].coins} coins and ${userWallet[interaction.user.id].KK} KK`);
    }
    else if (commandName == 'kk') {
        let subCommand = interaction.options.getString('subcommand');
        let count = interaction.options.getInteger('count');
        if (!userWallet[interaction.user.id]) {
            userWallet[interaction.user.id] = { coins: 0 , KK: 0 };
        }
        if (subCommand == 'buy') {
            interaction.reply(buyEvent(count, interaction.user.id));
        }
        else if (subCommand == 'sell') {
            interaction.reply(sellEvent(count, interaction.user.id));
        }
    }
});

// 60秒ごとに配当金を支給
cron.schedule('0 * * * * *', () => {
    for (let userId in userWallet) {
        if (userWallet[userId].KK > 100) {
            userWallet[userId].coins += Math.floor(userWallet[userId].KK * KKprice * 0.01) + 100;
        }
    }
});

function setCommands(guildId) {
    const commands = [];
    const commandFiles = fs.readdirSync(path.join(__dirname, './discordCommands')).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const command = require(`./discordCommands/${file}`);
        commands.push(command.data.toJSON());
    }
    for (const command of commands) {
        this.client.guilds.cache.get(guildId).commands.create(command);
    }
}
function deleteCommands(guildId) {
    this.client.guilds.cache.get(guildId).commands.set([])
        .then(() => console.log('Deleted Commands'))
        .catch(console.error);
}

function buyEvent(count, userId) {
    let total = Math.floor(KKprice * count * 1.05 + count * 0.5);
    if (userWallet[userId].coins < total) {
        return 'You do not have enough coins';
    }
    userWallet[userId].coins -= total;
    userWallet[userId].KK += count;
    KKprice += Math.floor(count * 0.1);
    console.log(KKprice);
    return `You bought ${count} KK\nPayed ${total} coins(5% commission)`;
}

function sellEvent(count, userId) {
    let total = KKprice * count;
    if (userWallet[userId].KK < count) {
        return 'You do not have enough KK';
    }
    userWallet[userId].KK -= count;
    userWallet[userId].coins += total;
    KKprice -= Math.floor(count * 0.1);
    console.log(KKprice);
    return `You sold ${count} KK`;
}

client.login(config.token);
