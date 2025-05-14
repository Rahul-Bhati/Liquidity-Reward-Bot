import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`;
const connection = new Connection(HELIUS_RPC, 'confirmed');
const FARM_PROGRAM_ID = new PublicKey('FarmqiPv5eAj3j1GMdMCMUGXqPUvmquZtMy86QH6rzhG');

async function fetchAllFarms() {
    try {
        const { data } = await axios.get('https://api.raydium.io/v2/sdk/farm-v2/mainnet.json', {
            timeout: 10_000,
        });
        return data;
    } catch (err) {
        console.error('Failed to fetch farm list:', err.message);
        throw new Error('Could not fetch Raydium farm list');
    }
}

function deriveUserPositionPDA(farmId, userPubkey) {
    const seeds = [Buffer.from('position'), farmId.toBuffer(), userPubkey.toBuffer()];
    return PublicKey.findProgramAddressSync(seeds, FARM_PROGRAM_ID);
}

async function checkAccountExists(accountPubkey) {
    try {
        const info = await connection.getAccountInfo(accountPubkey);
        return !!info && info.owner.equals(FARM_PROGRAM_ID);
    } catch (err) {
        console.error(`Error checking account ${accountPubkey}:`, err.message);
        return false;
    }
}

function decodeUserPosition(data) {
    // Placeholder: Replace with actual decoding
    return {
        stakedAmount: 0,
        pendingRewards: 0,
    };
}

export default async function trackFarms(address) {
    try {
        if (!address) return 'No wallet address provided.';
        let userPublicKey;
        try {
            userPublicKey = new PublicKey(address);
        } catch {
            return 'Invalid wallet address.';
        }

        const allFarms = await fetchAllFarms();
        const userPositions = [];

        for (const farmIdStr in allFarms) {
            const farmId = new PublicKey(farmIdStr);
            const [positionPDA] = deriveUserPositionPDA(farmId, userPublicKey);
            const exists = await checkAccountExists(positionPDA);
            if (!exists) continue;

            const accountInfo = await connection.getAccountInfo(positionPDA);
            if (!accountInfo || !accountInfo.data) continue;

            const position = decodeUserPosition(accountInfo.data);
            userPositions.push({
                farmId: farmId.toBase58(),
                position,
            });
        }

        if (userPositions.length === 0) return 'No farm positions found for this wallet.';

        const responseLines = userPositions.map(
            (pos) =>
                `Farm: ${pos.farmId}\n  → Staked: ${pos.position.stakedAmount}\n  → Pending: ${pos.position.pendingRewards}`,
        );

        return `🌾 Raydium Farm Summary:\n\n${responseLines.join('\n\n')}`;
    } catch (err) {
        console.error('Error in trackFarms:', err);
        return 'An error occurred while tracking farms. Please try again later.';
    }
}
