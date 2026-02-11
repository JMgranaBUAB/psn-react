import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exchangeNpssoForCode, exchangeCodeForAccessToken, getUserTitles, makeUniversalSearch, getProfileFromAccountId, getUserTrophyProfileSummary } from 'psn-api';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// PSN Auth Token storage (in-memory for demo, simple file or DB for production)
let access_token = null;

const authenticate = async () => {
    const npsso = process.env.NPSSO;
    console.log("Attempting authentication with NPSSO length:", npsso ? npsso.length : 'None');
    if (!npsso) {
        console.error('NPSSO token not found in environment variables.');
        return null;
    }

    try {
        const accessCode = await exchangeNpssoForCode(npsso);
        console.log("Access Code obtained.");
        const authorization = await exchangeCodeForAccessToken(accessCode);
        access_token = authorization.accessToken;
        console.log('PSN Authenticated successfully. Token:', access_token.substring(0, 10) + '...');
        return access_token;
    } catch (error) {
        console.error('Error authenticating with PSN:', error);
        return null;
    }
};

// Helper: Extract Account ID from JWT Token
const getAccountIdFromToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).account_id;
    } catch (e) {
        console.error("Error decoding token:", e);
        return null;
    }
};

app.get('/api/profile/me', async (req, res) => {
    console.log("Requesting MY profile...");
    if (!access_token) await authenticate();
    if (!access_token) return res.status(500).json({ error: 'Failed to authenticate with PSN' });

    const accountId = getAccountIdFromToken(access_token);
    if (!accountId) return res.status(500).json({ error: 'Could not extract Account ID from token' });

    console.log("Account ID extracted:", accountId);

    try {
        console.log("Fetching profile for Account ID:", accountId);
        // 1. Get basic profile
        const profile = await getProfileFromAccountId({ accessToken: access_token }, accountId);

        // 2. Get trophy summary (Platinum, Gold, etc.)
        console.log("Fetching trophy summary...");
        const trophySummary = await getUserTrophyProfileSummary({ accessToken: access_token }, accountId);

        // Merge them. 
        // Note: The frontend expects 'trophySummary' property inside the profile object based on UserProfile.jsx
        // UserProfile.jsx accesses: profile.trophySummary.earnedTrophies.platinum

        const fullProfile = {
            ...profile,
            trophySummary: trophySummary
        };

        res.json(fullProfile);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/trophies/me', async (req, res) => {
    console.log("Requesting MY trophies...");
    if (!access_token) await authenticate();
    if (!access_token) return res.status(500).json({ error: 'Failed to authenticate' });

    const accountId = getAccountIdFromToken(access_token);
    if (!accountId) return res.status(500).json({ error: 'No Account ID' });

    try {
        const titles = await getUserTitles(
            { accessToken: access_token },
            accountId,
            { limit: 12 }
        );

        res.json(titles);
    } catch (error) {
        console.error("Error fetching trophies:", error);
        res.status(500).json({ error: error.message });
    }
});

/* 
// Generic endpoint disabled to force use of /me
app.get('/api/profile/:username', async (req, res) => {
    // ... (logic removed to prevent conflicts)
    res.status(404).json({ error: "Use /api/profile/me" });
});
*/

app.get('/api/trophies/:accountId', async (req, res) => {
    if (!access_token) await authenticate();
    if (!access_token) return res.status(500).json({ error: 'Failed to authenticate with PSN' });

    try {
        const { accountId } = req.params;
        // This is a placeholder call - we need to see specific trophy calls.
        // psn-api documentations says: getUserTitles, getUserTrophiesEarnedForTitle, etc.
        // We probably want recent titles first.

        const titles = await getUserTitles(
            { accessToken: access_token },
            accountId,
            { limit: 10 }
        );

        res.json(titles);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
