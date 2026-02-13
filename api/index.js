import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exchangeNpssoForCode, exchangeCodeForAccessToken, getUserTitles, getProfileFromAccountId, getUserTrophyProfileSummary, getUserTrophiesEarnedForTitle, getTitleTrophies, getTitleTrophyGroups } from 'psn-api';
import translate from 'translate-google-api';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// PSN Auth Token storage
let access_token = null;
let current_npsso = process.env.NPSSO || null;

// Simple in-memory cache for translations
const translationCache = new Map();

const authenticate = async () => {
    const npsso = current_npsso;
    if (!npsso || npsso.length !== 64) return null;

    try {
        const accessCode = await exchangeNpssoForCode(npsso);
        const authorization = await exchangeCodeForAccessToken(accessCode);
        access_token = authorization.accessToken;
        return access_token;
    } catch (error) {
        console.error('PSN Auth Error:', error.message);
        access_token = null;
        return null;
    }
};

app.get('/api/auth/status', (req, res) => {
    res.json({ authenticated: !!access_token, hasNpsso: !!current_npsso });
});

app.post('/api/auth/login', async (req, res) => {
    const { npsso } = req.body;
    if (!npsso || npsso.length !== 64) {
        return res.status(400).json({ error: 'El código NPSSO debe tener exactamente 64 caracteres.' });
    }
    current_npsso = npsso;
    const token = await authenticate();
    if (token) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'No se pudo conectar con PlayStation.' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    access_token = null;
    current_npsso = process.env.NPSSO || null;
    res.json({ success: true });
});

const getAccountIdFromToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = Buffer.from(base64, 'base64').toString('binary');
        const jsonPayload = decodeURIComponent(decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        return JSON.parse(jsonPayload).account_id;
    } catch (e) {
        return null;
    }
};

app.get('/api/profile/me', async (req, res) => {
    if (!access_token) await authenticate();
    if (!access_token) return res.status(500).json({ error: 'Auth failed' });
    const accountId = getAccountIdFromToken(access_token);
    if (!accountId) return res.status(500).json({ error: 'No account ID' });

    try {
        const [profile, trophySummary] = await Promise.all([
            getProfileFromAccountId({ accessToken: access_token }, accountId),
            getUserTrophyProfileSummary({ accessToken: access_token }, accountId)
        ]);
        res.json({ ...profile, trophySummary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/trophies/me', async (req, res) => {
    if (!access_token) await authenticate();
    if (!access_token) return res.status(500).json({ error: 'Auth failed' });
    const accountId = getAccountIdFromToken(access_token);
    if (!accountId) return res.status(500).json({ error: 'No account ID' });

    try {
        const titles = await getUserTitles({ accessToken: access_token }, accountId, { limit: 24 });
        res.json(titles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/titles/:npCommunicationId/trophies', async (req, res) => {
    if (!access_token) await authenticate();
    if (!access_token) return res.status(500).json({ error: 'Auth failed' });
    const accountId = getAccountIdFromToken(access_token);
    if (!accountId) return res.status(500).json({ error: 'No account ID' });

    try {
        const { npCommunicationId } = req.params;
        const titlesResponse = await getUserTitles({ accessToken: access_token }, accountId);
        const titleInfo = titlesResponse.trophyTitles.find(t => t.npCommunicationId === npCommunicationId);
        const titleName = titleInfo ? titleInfo.trophyTitleName : 'Game Trophies';

        let trophyGroups = {};
        try {
            const serviceName = titleInfo?.npServiceName || (titleInfo?.trophyTitlePlatform?.includes('PS5') ? 'trophy2' : 'trophy');
            const groupsResponse = await getTitleTrophyGroups({ accessToken: access_token }, npCommunicationId, { npServiceName: serviceName });
            groupsResponse.trophyGroups.forEach(g => trophyGroups[g.trophyGroupId] = g.trophyGroupName);
        } catch (err) { }

        const serviceName = titleInfo?.npServiceName || (titleInfo?.trophyTitlePlatform?.includes('PS5') ? 'trophy2' : 'trophy');
        const [staticTrophies, userTrophies] = await Promise.all([
            getTitleTrophies({ accessToken: access_token }, npCommunicationId, 'all', { npServiceName: serviceName }),
            getUserTrophiesEarnedForTitle({ accessToken: access_token }, accountId, npCommunicationId, 'all', { limit: 300, npServiceName: serviceName })
        ]);

        const mergedTrophies = staticTrophies.trophies.map(t => {
            const earned = userTrophies.trophies.find(u => u.trophyId === t.trophyId);
            return {
                ...t,
                earned: earned ? earned.earned : false,
                earnedDateTime: earned ? earned.earnedDateTime : null,
                trophyEarnedRate: earned ? earned.trophyEarnedRate : null
            };
        });

        const trophiesToTranslate = mergedTrophies.filter(t => !translationCache.has(t.trophyId) && t.trophyDetail);
        if (trophiesToTranslate.length > 0) {
            try {
                const translations = await translate(trophiesToTranslate.map(t => t.trophyDetail), { from: 'en', to: 'es' });
                trophiesToTranslate.forEach((t, i) => translations[i] && translationCache.set(t.trophyId, translations[i]));
            } catch (err) { }
        }

        const finalTrophies = mergedTrophies.map(t => ({ ...t, trophyDetailEs: translationCache.get(t.trophyId) || null }));

        res.json({
            trophies: finalTrophies,
            titleName,
            platform: titleInfo?.trophyTitlePlatform || '',
            trophyGroups
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default app;
