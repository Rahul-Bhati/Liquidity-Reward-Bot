class PositionMonitor {
    constructor() {
        this.checkInterval = 5 * 60 * 1000; // 5 minutes
    }

    async startMonitoring() {
        setInterval(async () => {
            const users = await User.find();
            for (const user of users) {
                for (const position of user.positions) {
                    await this.checkPosition(user.telegramId, position);
                }
            }
        }, this.checkInterval);
    }

    async checkPosition(telegramId, position) {
        const currentPrice = await this.getCurrentPrice(position.pairAddress);
        if (currentPrice <= position.minRange || currentPrice >= position.maxRange) {
            await this.sendAlert(telegramId, position);
        }
    }

    async getCurrentPrice(pairAddress) {
        try {
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    'X-API-Key': process.env.MORALIS_API
                },
            };

            const response = await axios.get(`https://solana-gateway.moralis.io/token/mainnet/pairs/${pairAddress}/stats`, options)
            
            const poolData = response.data;
            const price = poolData.token0Price; // or token1Price based on your needs

            return parseFloat(price);
        } catch (error) {
            console.error('Error fetching price data:', error);
            throw new Error('Failed to fetch price data');
        }
    }

    async sendAlert(telegramId, position) {
        const message = `🚨 Alert: Your position for ${position.pairAddress} is out of range!`;
        await bot.sendMessage(telegramId, message);
    }
}

const positionMonitor = new PositionMonitor();
positionMonitor.startMonitoring();
