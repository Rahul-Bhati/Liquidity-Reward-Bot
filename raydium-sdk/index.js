import { LIQUIDITY_STATE_LAYOUT_V4 } from "@raydium-io/raydium-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import axios from "axios";

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
// const [userStakePda] = PublicKey.findProgramAddressSync(
//     [
//         Buffer.from("user"),
//         new PublicKey("CwjpqZN2F7SPDN29egMh41JkjMKGpiTEAkRsywRVjeQJ").toBuffer(),
//         new PublicKey("E3PTKzzCkNENMQm4rS3RiCoGAzbB8LNcbCYVxGRD3LBz").toBuffer(),
//     ],
//     new PublicKey("FarmqiPv5eAj3j1GMdMCMUGXqPUvmquZtMy86QH6rzhG")
// );

// const accountInfo = await connection.getAccountInfo(userStakePda);

// console.log(accountInfo);

async function getLpMintAddress(poolId) {
    try {
        const poolPublicKey = new PublicKey(poolId);

        // Fetch the account information for the liquidity pool
        const accountInfo = await connection.getAccountInfo(poolPublicKey);

        if (!accountInfo) {
            console.error(`Account with address ${poolId} not found.`);
            return null;
        }

        console.log(accountInfo);

        // Decode the account data using the Raydium V4 liquidity pool layout
        // Make sure you are using the correct layout for the specific pool version
        const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(accountInfo.data);

        console.log(poolState);

        // The lp_mint address is available in the decoded state
        const lpMintAddress = poolState.lpMint.toBase58();

        console.log(`LP Mint Address for pool ${poolId}: ${lpMintAddress}`);


        return lpMintAddress;

    } catch (error) {
        console.error(`Error fetching or decoding pool data: ${error}`);
        return null;
    }
}

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

const userPoolLpMint = await getLpMintAddress("DSUvc5qf5LJHHV5e2tD184ixotSnCnwj7i4jJa4Xsrmt");
// const allFarms = await fetchAllFarms();
// const userPositions = [];

// const availableFarm = [
//     ...allFarms.raydium.filter(farm => farm.lpMint === userPoolLpMint),
//     ...allFarms.fusion.filter(farm => farm.lpMint === userPoolLpMint),
//     ...allFarms.ecosystem.filter(farm => farm.lpMint === userPoolLpMint)
// ];

console.log("userPoolLpMint", userPoolLpMint);
// console.log("availableFarm", availableFarm);

// ---------------------------------------------------------------------------------------------------------

// import { Connection, PublicKey } from '@solana/web3.js';
// import axios from "axios";

// const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed"); 
// const FARM_PROGRAM_ID = new PublicKey('FarmqiPv5eAj3j1GMdMCMUGXqPUvmquZtMy86QH6rzhG');

// async function fetchAllFarms() {
//     const response = await axios.get('https://api.raydium.io/v2/sdk/farm-v2/mainnet.json');
//     return response.data;
// }

// function deriveUserPositionPDA(farmId, userPublicKey) {
//     const seeds = [Buffer.from('position'), farmId.toBuffer(), userPublicKey.toBuffer()];
//     return PublicKey.findProgramAddressSync(seeds, FARM_PROGRAM_ID);
// }

// async function checkAccountExists(accountPublicKey) {
//     const accountInfo = await connection.getAccountInfo(accountPublicKey);
//     return accountInfo && accountInfo.owner.equals(FARM_PROGRAM_ID);
// }

// function decodeUserPosition(accountData) {
//     // Placeholder: Implement actual decoding logic
//     return { stakedAmount: 0, pendingRewards: 0 };
// }

// const userPublicKey = new PublicKey("9CpT5vomrjMKzQN89qrDNpyPPR5GhnP5wACsSU3rPxyN");
// console.log(userPublicKey)

// async function trackFarm() {
//     try {
//         const userPublicKey = new PublicKey("9CpT5vomrjMKzQN89qrDNpyPPR5GhnP5wACsSU3rPxyN");
//         const allFarms = await fetchAllFarms();
//         console.log("all farms => ", allFarms);
//         const userPositions = [];
//         for (const farmIdStr in allFarms) {
//             console.log("farmIdStr => ", farmIdStr.id, farmIdStr.programId);
//             const farmId = new PublicKey(farmIdStr);
//             const [positionPDA] = deriveUserPositionPDA(farmId, userPublicKey);
//             if (await checkAccountExists(positionPDA)) {
//                 const accountInfo = await connection.getAccountInfo(positionPDA);
//                 const position = decodeUserPosition(accountInfo.data);
//                 userPositions.push({ farmId: farmId.toString(), position });
//             }
//         }
//         let responseText = 'Your Raydium farm positions:\n';
//         if (userPositions.length > 0) {
//             userPositions.forEach(pos => {
//                 responseText += `Farm ID: ${pos.farmId}, Staked Amount: ${pos.position.stakedAmount}, Pending Rewards: ${pos.position.pendingRewards}\n`;
//             });
//         } else {
//             responseText += 'No farm positions found.';
//         }
//         console.log("Response => ", responseText);
//     } catch (error) {
//         console.log('Error: ' + error.message);
//     }
// };

// trackFarm();



// import axios from "axios";

// const res = await axios.get('https://api-v3.raydium.io/farms/info/lp?lp=8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu&pageSize=100&page=1');
// console.log("farms => ",res.data);

// import { Connection, PublicKey } from "@solana/web3.js";
// import { fetchMultipleFarmInfoAndUpdate, getAssociatedLedgerAccount, getAssociatedLedgerPoolAccount } from "@raydium-io/raydium-sdk-v2"
// import fs from 'fs';

// const poolJson = JSON.parse(fs.readFileSync('./farm_for_pool_Bzc9NZfMqkXR6fz1DBph7BDf9BroyEf6pnzESP7v5iiw.json', 'utf-8'));

// // Set up connection
// const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

// // The user's wallet
// const owner = new PublicKey("9CpT5vomrjMKzQN89qrDNpyPPR5GhnP5wACsSU3rPxyN");

// // Fetch this from a farm pools list (e.g. Raydium SDK)
// const farmPools = [/* array of farm pool JSONs (from raydium or elsewhere) */];

// // Get current chain time (in seconds)
// const chainTime = Math.floor(Date.now() / 1000);

// // Fetch info
// const farmInfo = await fetchMultipleFarmInfoAndUpdate({
//     connection,
//     farmPools: ["32gX5UBpTcsm2V8f91g1xE5zJDf9bzeUyH1Qusku1Gff"],
//     owner,
//     chainTime,
// });
// // lp mint  : 6JDPHdZEgQ5YtercMxNiSvVtVTkvWADvxA2x6xR3XHC8
// // pool id : Bzc9NZfMqkXR6fz1DBph7BDf9BroyEf6pnzESP7v5iiw
//  // getAssociatedLedgerAccount()

// const data =  await getAssociatedLedgerAccount({
//     programId: "FarmqiPv5eAj3j1GMdMCMUGXqPUvmquZtMy86QH6rzhG",  // from farm info
//     poolId: "ju7HDSUvpp5a2d7ZgbuPTBdsXGrjsjvJ1ibFfWftT3B",            // farm pool ID (Pubkey)
//     owner: "79NxwzxRBCfFXEyk8EWYcndcNdiaCu2oU4DbnuiodYgK",    // wallet you want to check
//     version: "v6",      // farm version (v3/v5/v6)
// });

// console.log(data);



// import pkg from '@raydium-io/raydium-sdk-v2';
// import { C } from '@raydium-io/raydium-sdk-v2/lib/raydium-37f7d3b6';
// import { Connection } from '@solana/web3.js';

// const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
// const allFarms = await C.
// const matchingFarm = allFarms.find(farm => farm.lpMint.toBase58() === '8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu');

// console.log("matchingFarm => ", matchingFarm);

// import { Connection, Keypair, PublicKey } from "@solana/web3.js";
// import { getOrCreateAssociatedTokenAccount, getAccount } from "@solana/spl-token";
// import fs from "fs";

// // Load wallet from local secret key file
// const secretKeyString = fs.readFileSync('/home/rahulbhati/.config/solana/id.json', 'utf8');
// const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
// const keypair = Keypair.fromSecretKey(secretKey);

// const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// // ✅ REPLACE this with the actual mint address you're checking
// const mint = new PublicKey("8HoQnePLqPj4M7PUDzfw8e3Ymdwgc7NLGnaTUapubyvu");

// export async function getStakedTokenBalance(userAddress) {
//     try {
//         const userPubKey = new PublicKey(userAddress);

//         // Get (or create) associated token account for user
//         const stakedTokenAccount = await getOrCreateAssociatedTokenAccount(
//             connection,
//             keypair,
//             mint,
//             userPubKey
//         );

//         // Fetch token account balance
//         const userTokenAccount = await getAccount(connection, stakedTokenAccount.address);
//         const stakedTokens = Number(userTokenAccount.amount) / Math.pow(10, 6); // adjust decimals if needed

//         console.log(`User has ${stakedTokens} tokens staked.`);
//         return stakedTokens;
//     } catch (error) {
//         console.error("Error fetching staked token balance:", error);
//         return 0;
//     }
// }

// getStakedTokenBalance("9CpT5vomrjMKzQN89qrDNpyPPR5GhnP5wACsSU3rPxyN");



// import { Connection, PublicKey } from '@solana/web3.js';
// import { LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk';
// import * as borsh from '@project-serum/borsh';

// const OWNER = new PublicKey('9CpT5vomrjMKzQN89qrDNpyPPR5GhnP5wACsSU3rPxyN'); // e.g., E645TckHQnDcavVv92Etc6xSWQaq8zzPtPRGBheviRAk
// const MINT = new PublicKey('mUVPGfAcfQH3RA8EucVvrisxxyRu6WomPbPZdZUnrd9');    // e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
// const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
// const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

// const [address] = PublicKey.findProgramAddressSync(
//     [OWNER.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), MINT.toBuffer()],
//     ASSOCIATED_TOKEN_PROGRAM_ID
// );

// console.log('Using Solana-Web3.js: ', address.toBase58()); // get ata of lp mint

// Replace with your Solana RPC endpoint
// const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

// Replace with the actual pool ID (address) of the Raydium liquidity pool 
// const raydiumPoolId = 'Bzc9NZfMqkXR6fz1DBph7BDf9BroyEf6pnzESP7v5iiw'; // Example: SOL/USDC Pool ID // FRhB8L7Y9Qq41qZXYLtC2nw8An1RJfLLxRF2x9RwLLMo
// // p mint - > 6JDPHdZEgQ5YtercMxNiSvVtVTkvWADvxA2x6xR3XHC8
// async function getLpMintAddress(poolId) {
//     try {
//         const poolPublicKey = new PublicKey(poolId);

//         // Fetch the account information for the liquidity pool
//         const accountInfo = await connection.getAccountInfo(poolPublicKey);

//         if (!accountInfo) {
//             console.error(`Account with address ${poolId} not found.`);
//             return null;
//         }

//         // Decode the account data using the Raydium V4 liquidity pool layout
//         // Make sure you are using the correct layout for the specific pool version
//         const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(accountInfo.data);

//         // The lp_mint address is available in the decoded state
//         const lpMintAddress = poolState.lpMint.toBase58();

//         console.log(`LP Mint Address for pool ${poolId}: ${lpMintAddress}`);
//         return lpMintAddress;

//     } catch (error) {
//         console.error(`Error fetching or decoding pool data: ${error}`);
//         return null;
//     }
// }

// // Call the function
// getLpMintAddress(raydiumPoolId);

// -------------------------------------------------------------------------------------------------------------------------------------------------

// import pkg from '@raydium-io/raydium-sdk-v2';
// import { Connection, PublicKey } from '@solana/web3.js';
// const { getPoolInfo } = pkg;

// const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
// const poolId = new PublicKey('3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv');
// const poolInfo = await getPoolInfo(connection, poolId);

// console.log(poolInfo.lpMint); // This is the LP token mint


// import { Connection, PublicKey } from "@solana/web3.js";
// import { LIQUIDITY_STATE_LAYOUT_V4 } from "@raydium-io/raydium-sdk";

// async function getLpMintByPoolId(poolId) {
//     const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
//     try {
//         const poolAccountInfo = await connection.getAccountInfo(new PublicKey(poolId));
//         if (!poolAccountInfo) {
//             console.log("Pool not found.");
//             return null;
//         }
//         const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(poolAccountInfo.data);
//         // console.log("poolState => ", poolState)
//         const lpMint = poolState.lpMint.toBase58();
//         console.log(`LP Mint for Pool ${poolId}: ${lpMint}`);
//         return lpMint;
//     } catch (error) {
//         console.error("Error fetching LP mint:", error);
//         return null;
//     }
// }

// // Example: Fetch LP mint for a pool ID on devnet
// const poolId = "3ucNos4NbumPLZNWztqGHNFFgkHeRMBQAVemeeomsUxv"; // Replace with your devnet pool ID
// getLpMintByPoolId(poolId);


// import { Connection, PublicKey, Keypair } from '@solana/web3.js';
// import { Raydium } from '@raydium-io/raydium-sdk-v2';
// // import wallet from '/home/rahulbhati/.config/solana/id.json';

// import { readFile } from 'fs/promises';
// const data = await readFile('/home/rahulbhati/.config/solana/id.json', 'utf-8');
// const wallet = JSON.parse(data);


// async function createPool() {
//     // Initialize connection to devnet
//     const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

//     // Your tokens
//     const tokenAMint = new PublicKey('GA23V4F38R2M9cTuXw3YgLkX2eUP6zvvT3JQ4h3Wg4gf');
//     const tokenBMint = new PublicKey('AXfFXVLTB1Xg9ojhk7g4cVryvcj875vRi7LAfdgiQ7xs');

//     // Create pool parameters
//     const poolParams = {
//         // Use the Raydium devnet Standard AMM program ID
//         programId: new PublicKey('  '),
//         basePoolInfo: {
//             tokenA: {
//                 mint: tokenAMint,
//                 decimals: 9
//             },
//             tokenB: {
//                 mint: tokenBMint,
//                 decimals: 9
//             }
//         },
//         startTime: Math.floor(Date.now() / 1000),
//         feePayer: wallet.publicKey
//     };

//     // Initialize Raydium
//     const raydium = await Raydium.load({
//         connection,
//         cluster: 'devnet',
//         owner: wallet // Your wallet keypair
//     });

//     // Create the pool
//     const { txids, address } = await raydium.liquidity.createPoolV4(poolParams);

//     console.log('Pool created:', {
//         poolAddress: address.id.toString(),
//         lpToken: address.lpMint.toString(),
//         transactions: txids
//     });

//     return address;
// }

// // Function to get farms using LP token
// async function getFarms(lpToken) {
//     const raydium = await Raydium.load({
//         connection,
//         cluster: 'devnet'
//     });

//     // Use devnet Farm Staking program ID
//     // const farmProgramId = new PublicKey('EcLzTrNg9V7qhcdyXDe2qjtPkiGzDM2UbdRaeaadU5r2');

//     const farms = await raydium.farm.getFarmsByLpMint(lpToken);
//     return farms;
// }

// // Example usage
// async function main() {
//     try {
//         // Create pool and get LP token
//         const poolAddress = await createPool();
//         console.log('Pool LP Token:', poolAddress.lpMint.toString());

//         // Get farms for the LP token
//         const farms = await getFarms(poolAddress.lpMint);
//         console.log('Available farms:', farms);

//     } catch (error) {
//         console.error('Error:', error);
//     }
// }

// main();



// import pkg from '@raydium-io/raydium-sdk-v2';
// const { Raydium, TxVersion, BN } = pkg; 
// import { Connection, clusterApiUrl, Keypair, PublicKey } from '@solana/web3.js';
// import fs from "fs";

// const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
// // pub key => HU39fzB8fAQoafeyP5E5Snp4vaJNqVLuPEEGVg7Zx5JA

// // const signer = Keypair.generate(); // Replace with your devnet wallet

// // Read the keypair file
// const secretKeyString = fs.readFileSync('/home/rahulbhati/.config/solana/id.json', 'utf8');
// const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

// // Create Keypair object from secret key
// const signer = Keypair.fromSecretKey(secretKey);

// console.log('Wallet public key:', signer.publicKey.toBase58());

// const raydium = await Raydium.load({
//     owner: signer,
//     connection,
//     cluster: 'devnet',
// });

// const mintA = await raydium.token.getTokenInfo('8c1bmnXxPVWTzVZEy54xRFNVZYnC9cDPjRiVRhpooi24'); // mint acc-> GA23V4F38R2M9cTuXw3YgLkX2eUP6zvvT3JQ4h3Wg4gf
// const mintB = await raydium.token.getTokenInfo('By4JpmCzeC19u2WoR6UfZun6t9b2EHtE22m7PcDPkBFQ'); // mint acc-> AXfFXVLTB1Xg9ojhk7g4cVryvcj875vRi7LAfdgiQ7xs
// const { execute } = await raydium.cpmm.createPool({
//     programId: 'CPMDWBwJDtYax9qW7AyRuVC19Cc4L4Vcy4n2BHAbHkCW', // Use Raydium devnet program ID
//     mintA,
//     mintB,
//     mintAAmount: new BN(1_000_000 * 10 ** mintA.decimals),
//     mintBAmount: new BN(1_000_000 * 10 ** mintB.decimals),
// });

// const txId = await execute();
// console.log('Pool Created:', txId);