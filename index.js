const https = require('https');
const fs = require('fs');
const cron = require('node-cron');
const config = require('./config.json');
const DataManager = require('./modules/dataManager');
const dataManager = new DataManager();

// Web Server Options

const options = {
    key: fs.readFileSync(config.ssl.key),
    cert: fs.readFileSync(config.ssl.cert)
};
const port = config.port;

// Web Server

const server = https.createServer(options, (req, res) => {
    let url = req.url;
    let method = req.method;
    let ipadr = getIPadr(req);
    if (method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end();
    }

    ////////////////
    // GET Method //
    ////////////////

    else if (method === 'GET') {
        if (url === '/userWallets/') {
            // ユーザーのウォレット情報を送信するAPI
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            let userID = new URLSearchParams(req.url.split('?')[1]).get('userID');
            if (userID) {
                if (dataManager.userWallets[userID]) {
                    res.end(JSON.stringify(dataManager.userWallets[userID]));
                }
                else {
                    res.end(JSON.stringify({ error: 'User not found' }));
                }
            }
            else {
                res.end(JSON.stringify(dataManager.userWallets));
            }
        }
        else if (url === '/coinbase/') {
            // コインベースの情報を送信するAPI
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            let coinbasePublicData = dataManager.coinbase.forEach((coinbase) => {
                return {
                    name: coinbase.name,
                    price: coinbase.price
                };
            });
            res.end(JSON.stringify(coinbasePublicData));
        }
        else {
            res.writeHead(404, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    }

    /////////////////
    // POST Method //
    /////////////////

    else if (method === 'POST') {
        // ユーザーのウォレット情報を更新するAPI
        //
        // Data Example:
        // {
        //     "userID": "user1",
        //     "token": "$afc3d7$token",
        //     "type": "sell",
        //     "amount": 10
        // }
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
            let data;
            try {
                data = JSON.parse(body);
            }
            catch (e) {
                console.log(`Error has occurred on JSON.parse\ndata: ${body}`);
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Bad Request' }));
                return;
            }
            if (url === '/exchange/') {
                if (dataManager.coinbase.find((coinbase) => coinbase.token === data.token)) {
                    // 正しいトークンを受信した場合
                    if (dataManager.userWallets[data.userID] === undefined) {// ユーザーのウォレット情報が存在しない場合0で初期化
                        dataManager.userWallets[data.userID] = {
                            coins: 0,
                        };
                    }
                    let coinbaseIndex = dataManager.coinbase.findIndex((coinbase) => coinbase.token === data.token);
                    let totalPrice = dataManager.coinbase[coinbaseIndex].price * data.amount;
                    if (data.type === 'sell') {
                        // 売却処理
                        dataManager.userWallets[data.userID].coins += totalPrice;
                        dataManager.coinbase[coinbaseIndex].price -= Math.round(data.amount * 0.1 + Math.random() * 10);
                        res.writeHead(200);
                        res.end();
                    }
                    else if (data.type === 'buy') {
                        // 購入処理
                        if (dataManager.userWallets[data.userID].coins >= totalPrice) {
                            dataManager.userWallets[data.userID].coins -= totalPrice;
                            dataManager.coinbase[coinbaseIndex].price += Math.round(data.amount * 0.1 + Math.random() * 10);
                            res.writeHead(200);
                            res.end();
                        }
                    }
                    else {
                        res.writeHead(400);
                        res.end(JSON.stringify({ error: 'Bad Request' }));
                    }
                }
            }
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not found' }));
        });
    }

    //////////////////
    // Other Method //
    //////////////////

    else {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    }
});

// リバースプロキシを使用した場合に正確な接続元IPアドレスを取得する関数
function getIPadr(req) {
    if (req.headers['x-forwarded-for']) return req.headers['x-forwarded-for'];
    if (req.connection && req.connection.remoteAddress) return req.connection.remoteAddress;
    if (req.connection.socket && req.connection.socket.remoteAddress) return req.connection.socket.remoteAddress;
    if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress;
    return '0.0.0.0';
};

// Schedule Cron Job

// every 5 minutes
cron.schedule('*/5 * * * *', () => {
    dataManager.saveData('userWallets');
});

// every day at 00:00
cron.schedule('0 0 * * *', () => {
    // earned interest
    let itrRandom = Math.round(Math.random() * 10);
    dataManager.userWallets.forEach((wallet) => {
        wallet.coins += Math.round(wallet.coins * 0.01) + itrRandom;
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
