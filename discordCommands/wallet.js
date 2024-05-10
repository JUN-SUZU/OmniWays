const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wallet')
        .setDescription('現在の所有金額を確認します')
};
