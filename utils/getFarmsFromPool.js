import { Connection, PublicKey } from '@solana/web3.js';
import { LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk';
import axios from "axios";

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

// const raydiumPoolId = 'Bzc9NZfMqkXR6fz1DBph7BDf9BroyEf6pnzESP7v5iiw'; // Example: SOL/USDC Pool ID // FRhB8L7Y9Qq41qZXYLtC2nw8An1RJfLLxRF2x9RwLLMo
// p mint - > 6JDPHdZEgQ5YtercMxNiSvVtVTkvWADvxA2x6xR3XHC8
async function getLpMintAddress(poolId) {
    try {
        const poolPublicKey = new PublicKey(poolId);

        // Fetch the account information for the liquidity pool
        const accountInfo = await connection.getAccountInfo(poolPublicKey);

        if (!accountInfo) {
            console.error(`Account with address ${poolId} not found.`);
            return null;
        }

        // Decode the account data using the Raydium V4 liquidity pool layout
        // Make sure you are using the correct layout for the specific pool version
        const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(accountInfo.data);

        // The lp_mint address is available in the decoded state
        const lpMintAddress = poolState.lpMint.toBase58();

        console.log(`LP Mint Address for pool ${poolId}: ${lpMintAddress}`);

        
        return lpMintAddress;

    } catch (error) {
        console.error(`Error fetching or decoding pool data: ${error}`);
        return null;
    }
}

function formatFarmMessage(farms) {
    let msg = `🌾 *Active Farms Overview*\n\n`;

    for (const farm of farms) {
        msg += `🔹 *LP Mint:* \`${farm.lpMint}\`\n`;
        msg += `💰 *TVL:* $${farm.tvl.toFixed(2)}\n`;
        msg += `💎 *LP Price:* $${farm.lpPrice.toFixed(2)}\n`;
        msg += `📊 *Total APR:* ${(farm.apr * 100).toFixed(2)}%\n\n`;

        msg += `🎁 *Rewards From Different Farms: *\n\n`;

        for (const reward of farm.rewardInfo) {
            const aprDisplay = reward.apr > 0 ? `${(reward.apr * 100).toFixed(2)}%` : '0 ⚠️';

            msg += `  • ${reward.token} - ${reward.emissionPerSecond}/sec | APR: ${aprDisplay} \n`;
            msg += `     ⏳ ${reward.openTime} → ${reward.endTime} \n \n`;
        }

        msg += `\n━━━━━━━━━━━━━━\n\n`;
    }

    return msg;
}

function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    }).replace(',', '').replace('at', '');
}

export default async function getFarmsFromPool(poolId) {
    const lpmint = await getLpMintAddress(poolId);

    // get all farms
    const res = await axios .get(`https://api-v3.raydium.io/farms/info/lp?lp=${lpmint}&pageSize=100&page=1`);
    // console.log("farms => ", res.data.data.data);

    const fetchedFarms = res.data.data.data;
    
    const seenLpMints = new Map();
    const farms = [];

    for (const farm of fetchedFarms) {
        const lpMint = farm.lpMint?.address || farm.lpMint?.toBase58?.() || 'UNKNOWN_LP';
        const apr = farm.apr ?? 0;
        const rewardInfo = (farm.rewardInfos || []).map(r => ({
            token: r.mint?.symbol?.trim() || r.token?.trim() || 'UNKNOWN',
            emissionPerSecond: r.perSecond || r.emissionPerSecond || '0',
            apr: r.apr ?? 0,
            openTime: r.openTime ? formatDate(r.openTime) : 'N/A',
            endTime: r.endTime ? formatDate(r.endTime) : 'N/A',
        }));

        if (seenLpMints.has(lpMint)) {
            const existing = seenLpMints.get(lpMint);
            existing.apr += apr;
            existing.rewardInfo.push(...rewardInfo);
        } else {
            const data = {
                programId: farm.programId,
                tvl: farm.tvl ?? 0,
                lpPrice: farm.lpPrice ?? 0,
                apr,
                lpMint,
                rewardInfo,
            };
            seenLpMints.set(lpMint, data);
            farms.push(data);
        }
    }

    

    const telegramMessage = formatFarmMessage(farms);
    console.log(telegramMessage);

    return telegramMessage;
}

// Call the function
// getLpMintAddress(raydiumPoolId);