const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kk')
		.setDescription('株を売買します')
        .addStringOption(option =>
            option.setName('subcommand')
                .setDescription('buy or sell')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('count')
                .setRequired(true))
};
