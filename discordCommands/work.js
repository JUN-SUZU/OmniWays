const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('work')
        .setDescription('働いてコインを稼ぎます')
};
