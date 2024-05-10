const fs = require('fs');
module.exports = class DataManager {
    constructor() {
        this.discordServerData = JSON.parse(fs.readFileSync('./data/discordServerData.json', 'utf8'));
        this.minecraftServerData = JSON.parse(fs.readFileSync('./data/minecraftServerData.json', 'utf8'));
    }
    saveData(type) {
        if (type === 'discord') {
            fs.writeFileSync('./data/discordServerData.json', JSON.stringify(this.discordServerData, null, 4), 'utf8');
        }
    }
}
