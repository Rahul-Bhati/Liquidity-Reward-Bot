import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import TelegramBot from 'node-telegram-bot-api';
import User from './models/User.js';
import axios from 'axios';
import checkPriceAlerts from './utils/priceAlerts.js';
import WebSocket from 'ws';
import getFarmsFromPool from './utils/getFarmsFromPool.js';
import trackFarms from './utils/trackFarmsReward.js';

dotenv.config();
const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Function to start the price alert scheduler
setInterval(async () => {
    try {
        console.log("🔄 Running price alert scheduler...");

        // Ensure database connection before querying
        if (!mongoose.connection.readyState) {
            throw new Error("Database connection lost.");
        }

        const users = await User.find({ "positions.alertsEnabled": true });

        if (users.length === 0) {
            console.log("⏳ No users have enabled alerts. Skipping this cycle.");
            return;
        }

        for (const user of users) {
            try {
                await checkPriceAlerts(user);
                console.log(`✅ Alerts checked for user ${user.telegramId}`);
            } catch (userError) {
                console.error(`❌ Failed checking alerts for user ${user.telegramId}:`, userError);
            }
        }
    } catch (err) {
        console.error("❌ Scheduler error: Failed to fetch users for price alert:", err);
    }
}, 6000); // Runs every 10 minutes

// const ws = new WebSocket(`wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`);

// ws.on('open', () => {
//     console.log("✅ Connected to Helius WebSocket for live pool updates.");
// });

// async function subscribeToTrackedPools() {
//     try {
//         const users = await User.find({ "positions.alertsEnabled": true });

//         let subscribedPools = new Set();

//         users.forEach(user => {
//             user.positions.forEach(position => {
//                 if (position.alertsEnabled) {
//                     subscribedPools.add(position.pairAddress);
//                 }
//             });
//         });

//         subscribedPools.forEach(poolAddress => {
//             console.log(`🔗 Subscribing to pool: ${poolAddress}`);
//             ws.send(JSON.stringify({
//                 jsonrpc: "2.0",
//                 id: 1,
//                 method: "accountSubscribe",
//                 // method: "programSubscribe",
//                 params: [poolAddress, { "encoding": "jsonParsed", "commitment": "finalized" }]
//             }));
//         });

//     } catch (error) {
//         console.error("❌ Error subscribing to pools:", error);
//     }
// }

// // Subscribe to pools when WebSocket connects
// ws.on("open", subscribeToTrackedPools);

// ws.on("message", async (data) => {
//     const response = JSON.parse(data);

//     console.log("response => ", JSON.stringify(response, null ,2));
//     if (!response.params?.result) return;

//     const poolAddress = response.params.result.poolAddress;
//     const tokenPrice = parseFloat(response.params.result.tokenPriceUSD);

//     console.log("poolAddress => ", poolAddress);
//     console.log("tokenPrice => ", tokenPrice);

//     // Fetch users tracking this pool
//     const users = await User.find({ "positions.pairAddress": poolAddress });

//     console.log("users => ", users);

//     for (const user of users) {
//         for (const position of user.positions) {
//             if (!position.alertsEnabled) continue;

//             let alertMessage = null;

//             if (tokenPrice < position.minRange) {
//                 alertMessage = `⚠️ *Price Alert!* ${position.tokenSymbol} dropped below $${position.minRange}! Current price: $${tokenPrice}`;
//             } else if (tokenPrice > position.maxRange) {
//                 alertMessage = `🚀 *Price Alert!* ${position.tokenSymbol} surged past $${position.maxRange}! Current price: $${tokenPrice}`;
//             }

//             console.log("alertMessage => ", alertMessage);

//             if (alertMessage) {
//                 sendTelegramAlert(user.telegramId, alertMessage);
//                 position.currentPosition = tokenPrice;
//                 position.lastChecked = new Date();
//                 user.alertCount += 1;
//                 user.lastAlertTimestamp = new Date();
//             }
//         }
//         await user.save();
//     }
// });
// ws.on("error", (err) => {
//     console.error("❌ WebSocket error:", err);
// });

// ws.on("close", () => {
//     console.log("🔄 WebSocket disconnected, reconnecting...");
//     setTimeout(() => {
//         ws = new WebSocket(`wss://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`);
//         ws.on("open", subscribeToTrackedPools); // Re-subscribe pools on reconnect
//     }, 5000);
// });


// Basic health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});


// Command to start tracking
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const commandList = `
Welcome! Here are the available commands:
/start - Start the bot
/setwallet <walletAddress> - Set your wallet address
/addposition <pairAddress> <minRange> <maxRange> - Add a tracking position
/help - Get detailed information about commands
    `;

    const menuOptions = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Set Wallet", callback_data: "set_wallet" }],
                [{ text: "Add Position", callback_data: "add_position" }],
                [{ text: "Help", callback_data: "help" }]
            ]
        }
    };

    bot.sendMessage(chatId, commandList, menuOptions);
});

bot.onText(/\/menu/, async (msg) => {
    try {
        const chatId = msg.chat.id;

        if (!chatId) {
            throw new Error("Invalid chat ID.");
        }

        const menuOptions = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📥 Set Wallet", callback_data: "set_wallet" }],
                    [{ text: "➕ Add Position", callback_data: "add_position" }],
                    [{ text: "❓ Help", callback_data: "help" }]
                ]
            }
        };

        bot.sendMessage(chatId, "🔽 *Main Menu* 🔽\nPlease select an option below:", {
            parse_mode: "Markdown",
            reply_markup: menuOptions
        });

    } catch (error) {
        console.error("Error displaying menu:", error);
        bot.sendMessage(msg.chat.id, "⚠️ *Something went wrong!*\nPlease try again later.");
    }
});

// Save user wallet address
bot.onText(/\/setwallet (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const walletAddress = match[1];

    if (!walletAddress || walletAddress.length < 20) {
        return bot.sendMessage(chatId, "⚠️ *Invalid wallet address!* Please check and try again.", { parse_mode: "Markdown" });
    }


    let user = await User.findOne({ telegramId: chatId });
    if (!user) {
        user = new User({ telegramId: chatId, walletAddress });
        await user.save();
        bot.sendMessage(chatId, 'Wallet address saved!');
    } else {
        user.walletAddress = walletAddress;
        await user.save();
        bot.sendMessage(chatId, 'Wallet address updated!');
    }
});

// see the pair or detail
// Save user wallet address
bot.onText(/\/pairDetail (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const pairAddress = match[1];

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            'X-API-Key': process.env.MORALIS_API
        },
    };
    try {
        const response = await axios.get(`https://solana-gateway.moralis.io/token/mainnet/pairs/${pairAddress}/stats`, options);

        const data = response.data;
        if (!data || !data.pairLabel) {
            throw new Error("Invalid or incomplete data received from Moralis.");
        }
        const message = `
📊 *Liquidity Pool Details*
———————————————
💱 *Pair:* ${data.pairLabel}
💰 *Current Price:* $${parseFloat(data.currentUsdPrice).toFixed(2)}
🌊 *Total Liquidity:* $${parseFloat(data.totalLiquidityUsd).toFixed(2)}
📈 *Price Change (24h):* ${data.pricePercentChange["24h"] > 0 ? "🟢" : "🔴"} ${data.pricePercentChange["24h"].toFixed(2)}%
📉 *Liquidity Change (24h):* ${data.liquidityPercentChange["24h"] > 0 ? "🟢" : "🔴"} ${data.liquidityPercentChange["24h"].toFixed(2)}%
🛒 *Buys (24h):* ${data.buys["24h"]} | *Sells (24h):* ${data.sells["24h"]}
📊 *Volume (24h):* $${parseFloat(data.totalVolume["24h"]).toFixed(2)}

———————————————
`;

        //         const message = `📊 Liquidity Pool Details
        // ———————————————
        // 💱 Pair: SOL/USDC
        // 💰 Current Price: $145.25
        // 🌊 Total Liquidity: $26144.30
        // 📈 Price Change (24h): 🔴 -1.79%
        // 📉 Liquidity Change (24h): 🔴 -1.16%
        // 🛒 Buys (24h): 12130 | Sells (24h): 10595
        // 📊 Volume (24h): $116273.56

        // ———————————————`

        bot.sendMessage(chatId, message, { parse_mode: "Markdown" });

        // Ask user for LP tracking input
        //         bot.sendMessage(chatId, `
        // Which token do you want to track in this pool?
        // Select an option below:`, {
        //             reply_markup: {
        //                 inline_keyboard: [
        //                     [{ text: data.tokenSymbol, callback_data: `track_${data.tokenSymbol}` }],
        //                     [{ text: "Other Token", callback_data: "track_other" }]
        //                 ]
        //             }
        //         });

        bot.sendMessage(chatId, `
🌐 *Track a Token in This Pool*

🔹 Please specify which token you want to monitor.
🔹 Use the following format to set your LP position:

📌 Format:
\`/addposition <pairAddress> <token-symbol> <minRange> <maxRange>\`

✨ Example:
\`/addposition 44dsfsd433 SOL 125 200\`

📢 Ensure the token symbol and range values are correct before proceeding.
`);

    } catch (error) {
        console.error("Error fetching pair details:", error);
        bot.sendMessage(chatId, "⚠️ Failed to fetch pool details. Please try again later.");
    }
});


bot.onText(/\/addposition (.+) (.+) (.+) (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const pairAddress = match[1];
    const tokenSymbol = match[2];
    const minRange = parseFloat(match[3]);
    const maxRange = parseFloat(match[4]);

    // Validate inputs
    if (isNaN(minRange) || isNaN(maxRange) || minRange <= 0 || maxRange <= 0) {
        return bot.sendMessage(chatId, "⚠️ *Invalid input!*\nEnsure you enter a valid numeric range.\nExample: `/addposition <pairAddress> SOL 125 200`", { parse_mode: "Markdown" });
    }

    if (minRange >= maxRange) {
        return bot.sendMessage(chatId, "⚠️ *Invalid range!*\nMinimum range must be less than maximum range.", { parse_mode: "Markdown" });
    }

    try {
        let user = await User.findOne({ telegramId: chatId });
        if (!user) {
            user = new User({ telegramId: chatId, positions: [] });
        }

        user.positions.push({
            pairAddress,
            tokenSymbol,
            minRange,
            maxRange,
            currentPosition: 0, // Initialize with 0 or fetch current price
            lastChecked: new Date()
        });

        await user.save();

        bot.sendMessage(chatId, `
✅ *Position Added Successfully!*
🔹 *Token:* ${tokenSymbol}
📌 *Pair Address:* ${pairAddress}
📉 *Min Range:* ${minRange}
📈 *Max Range:* ${maxRange}

Would you like to enable alerts for this position?
`, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Enable Alerts ✅", callback_data: `enable_alerts_${pairAddress}` }],
                    [{ text: "Disable Alerts ❌", callback_data: `disable_alerts_${pairAddress}` }]
                ]
            }
        });
    } catch (error) {
        console.error("Error adding position:", error);
        bot.sendMessage(chatId, "❌ *Failed to add position!*\nSomething went wrong. Please try again later.", { parse_mode: "Markdown" });
    }
});

bot.onText(/\/getFarmsFromPoolId (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const poolId = match?.[1]?.trim();

    if (!poolId) {
        return bot.sendMessage(chatId, '❌ Please provide a valid pool ID.');
    }

    try {
        const farms = await getFarmsFromPool(poolId);

        if (!farms || farms.length === 0) {
            return bot.sendMessage(chatId, `⚠️ No farms found for Pool ID: \`${poolId}\``, { parse_mode: 'Markdown' });
        }

        // const response = farms.map((farm, idx) => `*Farm ${idx + 1}*\n\`${JSON.stringify(farm, null, 2)}\``).join('\n\n');
        await bot.sendMessage(chatId, farms, { parse_mode: 'Markdown' });

    } catch (err) {
        console.error(`Error fetching farms for Pool ID ${poolId}:`, err);
        await bot.sendMessage(chatId, `❌ Error fetching farms: \`${err.message || err}\``, { parse_mode: 'Markdown' });
    }
});

bot.onText(/\/trackReward (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const address = match?.[1]?.trim();
    const result = await trackFarms(address);
    bot.sendMessage(chatId, result);
});

bot.on("callback_query", async (callbackQuery) => {
    try {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        console.log("data => ", data);

        // Ensure `data` is valid before processing
        if (!data) {
            throw new Error("Invalid callback data received.");
        }

        if (data.startsWith("track_")) {
            const token = data.split("_")[1];

            bot.sendMessage(chatId, `
🔍 You've selected *${token}* for tracking.

Do you want to set:
✅ A *minimum LP range*?
🚀 A *maximum LP range*?
Select an option:`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Set Min Range", callback_data: `set_min_${token}` }],
                        [{ text: "Set Max Range", callback_data: `set_max_${token}` }]
                    ]
                }
            });
        }

        if (data.startsWith("enable_alerts_")) {
            const pairAddress = data.split("_")[2];
            console.log("chatId => ", chatId);

            if (!pairAddress) {
                throw new Error("Pair Address not found in callback data.");
            }
            const res = await User.updateOne(
                { telegramId: chatId, "positions.pairAddress": pairAddress },
                { $set: { "positions.$.alertsEnabled": true } },
                { upsert: false }
            );
            console.log("response ", res);
            bot.sendMessage(chatId, "✅ *Alerts enabled!* You’ll receive updates when price crosses your set range.");
        }

        if (data.startsWith("disable_alerts_")) {
            const pairAddress = data.split("_")[2];
            if (!pairAddress) {
                throw new Error("Pair Address not found in callback data.");
            }
            await User.updateOne(
                { telegramId: chatId, "positions.pairAddress": pairAddress },
                { $set: { "positions.$.alertsEnabled": false } },
                { upsert: false }
            );
            bot.sendMessage(chatId, "❌ *Alerts disabled!* You will no longer receive price updates.");
        }

        if (data === "set_wallet") {
            bot.sendMessage(chatId, "Please send your wallet address using /setwallet <walletAddress>");
        } else if (data === "add_position") {
            bot.sendMessage(chatId, "Use /addposition <pairAddress> <minRange> <maxRange> to add a position.");
        } else if (data === "help") {
            bot.sendMessage(chatId, "Available commands:\n/start - Start bot\n/setwallet - Set wallet\n/addposition - Add position\n/help - Get help.");
        }

    } catch (error) {
        console.error("Error handling callback query:", error);
        bot.sendMessage(callbackQuery.message.chat.id, "⚠️ An error occurred while processing your request. Please try again.");
    }
});

export function sendTelegramAlert(chatId, message) {
    try {
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error("Failed to send Telegram alert:", err);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
