const fs = require("fs");
const { Client, GatewayIntentBits } = require("discord.js");
const auth = require("./auth.json");
let rates;
let currencies;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", () => {
    console.log("Ready!");
    if (fs.existsSync("./rates.json")) {
        rates = JSON.parse(fs.readFileSync("./rates.json", "utf-8")).rates;
    }
    if (fs.existsSync("./currencies.json")) {
        currencies = JSON.parse(fs.readFileSync("./currencies.json", "utf-8"));
    }
    if (!fs.existsSync("./currencies.json")) {
        fetch(`https://openexchangerates.org/api/currencies.json?app_id=${auth.key}`)
            .then((res) => {
                res.text().then((data) => {
                    fs.writeFileSync("./currencies.json", data);
                });
            });
    }
});

client.on("messageCreate", (msg) => {
    let args = msg.content.toLowerCase().split(" ");
    if (args[0] === "$calc") {
        if (args.length >= 4) {
            process(msg, args);
        } else if (args.length === 3) {
            args.push("1");
            process(msg, args);
        } else {
            msg.channel.send("error: not enough arguments");
        }
    }
    if (args[0] === "$update" && msg.author.id === auth.id) {
        update();
    }
    if (args[0] === "$terminate" && msg.author.id === auth.id) {
        client.destroy();
    }
});

function update() {
    fetch(`https://openexchangerates.org/api/latest.json?app_id=${auth.key}`)
        .then((res) => {
            res.text().then((data) => {
                fs.writeFileSync("./rates.json", data);
                rates = JSON.parse(fs.readFileSync("./rates.json", "utf-8")).rates;
            });
        });
}

function process(msg, args) {
    let currOne = args[1].toUpperCase();
    let currTwo = args[2].toUpperCase();
    let amount = parseFloat(args[3]);
    if (rates[currOne] === undefined || rates[currTwo] === undefined) {
        msg.channel.send("error: invalid currency code");
    } else if (Number.isNaN(amount) || amount <= 0 || amount > 1000000000000) {
        msg.channel.send("error: invalid amount, must be between 0 and 1 000 000 000 000");
    } else {
        let ratio = rates[currTwo] / rates[currOne];
        let calcAmount = amount * ratio;
        let message = `${amount.toFixed(2)} ${currOne} (${currencies[currOne]}) is equivalent to ${calcAmount.toFixed(2)} ${currTwo} (${currencies[currTwo]})`;
        msg.channel.send(message);
    }
}

client.login(auth.token);