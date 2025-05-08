// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    telegramId: String,
    walletAddress: String,
    positions: [{
        pairAddress: String,
        minRange: Number,
        maxRange: Number,
        currentPosition: Number,
        lastChecked: Date,
        alertsEnabled: { type: Boolean, default: false }
    }],
    alertCount: { type: Number, default: 0 },
    lastAlertTimestamp: { type: Date, default: null },
    lastResetTimestamp: { type: Date, default: null } // NEW: Tracks daily resets
});

const User = mongoose.model('User', userSchema);
export default User;