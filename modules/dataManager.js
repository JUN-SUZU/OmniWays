const fs = require('fs');
module.exports = class DataManager {
    constructor() {
        this.userWallets = JSON.parse(fs.readFileSync('./data/userWallets.json', 'utf8'));
        this.coinbase = JSON.parse(fs.readFileSync('./data/coinbase.json', 'utf8'));
    }
    saveData(type) {
        if (type === 'userWallets') {
            fs.writeFileSync('./data/userWallets.json', JSON.stringify(this.userWallets, null, 4));
        }
    }
}
