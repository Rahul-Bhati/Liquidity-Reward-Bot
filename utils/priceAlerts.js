import axios from 'axios';
import { sendTelegramAlert } from '../server.js';

export default async function checkPriceAlerts(user) {
    // console.log("user ", user);
    try {
        const now = new Date();

        const timeElapsed = user.lastAlertTimestamp ? (now - user.lastAlertTimestamp.getTime()) / 60000 : 0; // in minutes
        const daysSinceReset = user.lastResetTimestamp ? (now - user.lastResetTimestamp.getTime()) / 86400000 : 0; // in days

        // Reset alert count once per day
        if (daysSinceReset >= 1) {
            user.alertCount = 0;
            user.lastResetTimestamp = new Date();
        }

        // Loop over all positions
        for (const position of user.positions) {
            if (!position.alertsEnabled) continue;

            if (user.alertCount >= 10) {
                bot.sendMessage(user.telegramId, "⏳ *Daily Limit Reached!* You've received the maximum 10 alerts today. Alerts will resume tomorrow.");
                break;
            }

            const response = await axios.get(
                `https://solana-gateway.moralis.io/token/mainnet/pairs/${position.pairAddress}/stats`,
                {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        'X-API-Key': process.env.MORALIS_API
                    },
                }
            );

            const currentPrice = parseFloat(response.data.currentUsdPrice);

            // 🔄 Update current price and last checked timestamp
            position.currentPosition = currentPrice;
            position.lastChecked = new Date();

            let alertMessage = null;

            console.log("currentPrice => ", currentPrice);

            if (currentPrice < position.minRange) {
                alertMessage = `⚠️ *Price Alert!* Token dropped below $${position.minRange}! Current price: $${currentPrice}`;
            } else if (currentPrice > position.maxRange) {
                alertMessage = `🚀 *Price Alert!* Token surged past $${position.maxRange}! Current price: $${currentPrice}`;
            }

            console.log("alertMessage => ", alertMessage);

            if (alertMessage) {
                sendTelegramAlert(user.telegramId, alertMessage);
                user.alertCount += 1;
                user.lastAlertTimestamp = new Date();
            }
        }

        // Save updated user info
        await user.save();
    } catch (error) {
        console.error("Error checking price alerts:", error);
    }
}



// import axios from 'axios';

// export default async function checkPriceAlerts(user) {
//     console.log("user ", user);
//     try {
//         const options = {
//             method: 'GET',
//             headers: {
//                 accept: 'application/json',
//                 'X-API-Key': process.env.MORALIS_API
//             },
//         };
//         const response = await axios.get(`https://solana-gateway.moralis.io/token/mainnet/pairs/${user.pairAddress}/stats`, options);
//         const currentPrice = parseFloat(response.data.currentUsdPrice);

//         const now = new Date();
//         const timeElapsed = user.lastAlertTimestamp ? (now - user.lastAlertTimestamp.getTime()) / 60000 : 0; // Minutes passed
//         const daysSinceReset = user.lastResetTimestamp ? (now - user.lastResetTimestamp.getTime()) / 86400000 : 0; // Days passed

//         // **Reset alert count every new day**
//         if (daysSinceReset >= 1) {
//             user.alertCount = 0;
//             user.lastResetTimestamp = new Date();
//             await user.save();
//         }

//         if (user.alertCount < 10) {
//             let alertMessage = null;

//             if (currentPrice < user.minRange) {
//                 alertMessage = `⚠️ *Price Alert!* ${user.tokenSymbol} dropped below $${user.minRange}! Current price: $${currentPrice}`;
//             } else if (currentPrice > user.maxRange) {
//                 alertMessage = `🚀 *Price Alert!* ${user.tokenSymbol} surged past $${user.maxRange}! Current price: $${currentPrice}`;
//             }

//             console.log(alertMessage);

//             if (alertMessage) {
//                 sendTelegramAlert(user.chatId, alertMessage);
//                 user.alertCount += 1;
//                 user.lastAlertTimestamp = new Date();
//                 await user.save();
//             }
//         } else {
//             bot.sendMessage(user.chatId, "⏳ *Daily Limit Reached!* You've received the maximum 10 alerts today. Alerts will resume tomorrow.");
//         }
//     } catch (error) {
//         console.error("Error fetching price:", error);
//     }
// }