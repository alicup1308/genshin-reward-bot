const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Central Centralized Database State Engine
const mockDatabase = {
    "1234567890": { username: "StudentGamer", chatCredits: 2000, fcPoints: 150 }
};

const redeemHistoryLog = [];
const activeVerificationKeys = {}; 

// THE CENTRAL ECONOMY SHOP REGISTER (PRICES MULTIPLIED BY 1.5)
const genshinPromoVault = {
    "primos_50": { item: "50x Primogems Voucher", codeString: "GENSHINGIFT", cost: 150 },
    "mora_10k": { item: "10,000x In-Game Mora Cash", codeString: "WTX8U3378619", cost: 225 },
    "resource_pack": { item: "Special Teyvat Resource Pack", codeString: "UTLO9S667S86", cost: 75 },
    "primos_60_ltd1": { item: "60x Primogems (Limited #1)", codeString: "PFY1S40I88T9", cost: 300 },
    "primos_60_ltd2": { item: "60x Primogems (Limited #2)", codeString: "PSCA8NL4ZSPD", cost: 300 },
    "primos_20_ltd3": { item: "20x Primogems + Ores Bundle", codeString: "NMI20MAJGIBP", cost: 150 },
    "primos_20_ltd4": { item: "20x Primogems Custom Pack", codeString: "A0NBWRZZI3XJ", cost: 150 }
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
    ]
});

// Helper Function: Generates a completely unique temporary verification code
function generateSecureKey() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
    let key = "KEY-";
    for (let i = 0; i < 4; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    key += "-";
    for (let i = 0; i < 4; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
}

const CREDITS_PER_MESSAGE = 3; 

// ============================================================================
// DISCORD PIPELINE: MESSAGE LISTENER (UNLINKED FROM CMD TRAFFIC LOGS)
// ============================================================================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const userId = message.author.id;
    const username = message.author.username;

    // A. PUBLIC SERVER GUILD TEXT CHANNELS PROCESSOR
    if (message.guild) {
        if (!mockDatabase[userId]) {
            mockDatabase[userId] = { username: username, chatCredits: 100, fcPoints: 0 };
        } else {
            mockDatabase[userId].username = username; 
        }

        // --- COMMAND 1: !balance ---
        if (message.content === '!balance') {
            const playerBal = mockDatabase[userId].chatCredits;
            return message.reply(`🪙 **${username}**, your current ledger balance is **${playerBal}** Chat Credits!\n👉 *To use these credits, enter your ID on our website or view options using \`!shop\`.*`);
        }

        // --- COMMAND 2: !shop ---
        if (message.content === '!shop') {
            let shopMenuMessage = `🛒 **EXCHANGE REWARDS STORE - AVAILABLE ITEMS** 🛒\n*Earn credits for chatting and get real promo vouchers!*\n\n`;
            shopMenuMessage += `✨ **STANDARD REWARDS:**\n`;
            shopMenuMessage += `• \`50x Primogems Voucher\` — **150 Credits**\n`;
            shopMenuMessage += `• \`10,000x Mora Cash Code\` — **225 Credits**\n`;
            shopMenuMessage += `• \`Special Teyvat Resource Pack\` — **75 Credits**\n\n`;
            shopMenuMessage += `🔥 **LIMITED-TIME PROMOS:**\n`;
            shopMenuMessage += `• \`60x Primogems (Limited #1)\` — **300 Credits**\n`;
            shopMenuMessage += `• \`60x Primogems (Limited #2)\` — **300 Credits**\n`;
            shopMenuMessage += `• \`20x Primogems + Ores\` — **150 Credits**\n`;
            shopMenuMessage += `• \`20x Primogems Custom\` — **150 Credits**\n\n`;
            shopMenuMessage += `🌐 *Ready to claim? Enter your User ID (\`${userId}\`) on our web portal at http://localhost:3000 to instantly exchange!*`;
            
            return message.reply(shopMenuMessage);
        }

        // --- FIXED: CONSOLE.LOG STATEMENT REMOVED FROM CHAT ROUTE ---
        if (!message.content.startsWith('!')) {
            mockDatabase[userId].chatCredits += CREDITS_PER_MESSAGE;
        }
        return;
    }

    // B. PRIVATE DM FLOW: CHALLENGE MATCH VERIFICATIONS
    if (message.channel.type === ChannelType.DM) {
        const inboundMessageText = message.content.trim().toUpperCase();

        if (activeVerificationKeys[inboundMessageText]) {
            const transactionDetails = activeVerificationKeys[inboundMessageText];

            if (transactionDetails.discordId !== userId) {
                return message.reply("❌ **Security Mismatch:** This transaction key belongs to another profile session!");
            }

            await message.reply(`🎉 **SECURITY VERIFICATION COMPLETE!** \n🎁 **Your Reward:** ${transactionDetails.item} \n🎟️ *Genshin Impact Redeem Code:* \`${transactionDetails.codeString}\` \n\n*Type this code directly into your Genshin game settings to claim your free items!*`);
            delete activeVerificationKeys[inboundMessageText];
        } else {
            message.reply("⚠️ **Invalid Transaction Key!** Please copy the exact key code shown in the green bar on the website browser screen and reply with it here to unlock your promo code reward.");
        }
    }
});

// PASTE YOUR FRESH DISCORD BOT TOKEN HERE
const DISCORD_BOT_TOKEN = "MTUxMDMwOTYyMzc1ODg1MjEzNg.GLbZ_0.1hQrYg-ExUKvSEK1dqZVii-GX35g8cE338rXIM"; 

client.once('clientReady', () => {
    console.log(`🤖 SUCCESS: Connected directly to Discord API. Bot is online as: ${client.user.tag}`);
});
client.login(DISCORD_BOT_TOKEN).catch(err => console.log("❌ Discord Bot Login Failed. Check your token!"));

// ==========================================
// BACKEND API CONTROL HIGHWAY HOOKS
// ==========================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/api/get-history', (req, res) => res.json(redeemHistoryLog));

app.post('/api/admin-update-credits', (req, res) => {
    const { discordId, newCredits, customUsername } = req.body;
    if (mockDatabase[discordId]) {
        mockDatabase[discordId].chatCredits = parseInt(newCredits);
        if (customUsername) mockDatabase[discordId].username = customUsername;
    } else {
        mockDatabase[discordId] = { username: customUsername || `User_${discordId.substring(0,4)}`, chatCredits: parseInt(newCredits), fcPoints: 0 };
    }
    res.json({ success: true });
});

app.post('/api/get-profile', async (req, res) => {
    const { discordId } = req.body;
    try {
        const discordUser = await client.users.fetch(discordId);
        if (!mockDatabase[discordId]) {
            mockDatabase[discordId] = { username: discordUser.username, chatCredits: 100, fcPoints: 0 };
        } else {
            mockDatabase[discordId].username = discordUser.username;
        }
        res.json({ success: true, username: mockDatabase[discordId].username, chatCredits: mockDatabase[discordId].chatCredits, fcPoints: mockDatabase[discordId].fcPoints });
    } catch (err) {
        if (mockDatabase[discordId]) {
            return res.json({ success: true, username: mockDatabase[discordId].username, chatCredits: mockDatabase[discordId].chatCredits, fcPoints: mockDatabase[discordId].fcPoints });
        }
        res.status(404).json({ success: false, message: "User profile unregistered. Chat inside your Discord server first so the bot can see you!" });
    }
});

app.post('/api/exchange', async (req, res) => {
    const { discordId, exchangeAmount } = req.body;

    if (!mockDatabase[discordId]) return res.status(400).json({ success: false, message: "Profile session missing." });
    
    const selectedPackage = genshinPromoVault[exchangeAmount];
    if (!selectedPackage) return res.status(400).json({ success: false, message: "Product missing selection parameters." });

    const userProfile = mockDatabase[discordId];

    if (userProfile.chatCredits < selectedPackage.cost) {
        return res.status(400).json({ success: false, message: `Insufficient credits. Need ${selectedPackage.cost} credits.` });
    }

    userProfile.chatCredits -= selectedPackage.cost;

    const uniqueOrderKey = generateSecureKey();
    
    activeVerificationKeys[uniqueOrderKey] = {
        discordId: discordId,
        item: selectedPackage.item,
        codeString: selectedPackage.codeString
    };

    redeemHistoryLog.unshift({ username: userProfile.username, item: selectedPackage.item, time: new Date().toLocaleTimeString() });

    try {
        const discordUser = await client.users.fetch(discordId);
        await discordUser.send(`⚠️ **REWARD ORDER LOGGED!** \nYour credit exchange request has been verified. To unlock your real game promo code, please reply directly to this message by typing your secure transaction **KEY** code! \n\n👉 *Your key code is displayed in a green bar on your web browser store page right now.*`);
        
        res.json({
            success: true,
            message: `🔑 TRANSACTION INITIATED! YOUR DISPATCH KEY IS: ${uniqueOrderKey}. Check your Discord DMs—reply to the bot with this exact key to claim your code!`,
            newCredits: userProfile.chatCredits
        });
    } catch (err) {
        res.json({
            success: true,
            message: `✅ EXCHANGE SUCCESSFUL! Copy your Verification Key: ${uniqueOrderKey} and message it manually to the bot profile Trim.`,
            newCredits: userProfile.chatCredits
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Node Admin Hub online! Click here to open your site: http://localhost:3000`);
        console.log(`🛠️ Open your Admin Panel here: http://localhost:3000/admin`);
});