import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exchangeNpssoForCode, exchangeCodeForAccessToken, getUserTitles, getProfileFromAccountId, getUserTrophyProfileSummary, getUserTrophiesEarnedForTitle, getTitleTrophies, getTitleTrophyGroups } from 'psn-api';
import translate from 'translate-google-api';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// In-memory caches for stateless environment
const tokenCache = new Map();
const translationCache = new Map();

const authenticate = async (npsso) => {
    if (!npsso || npsso.length !== 64) return null;

    // Check cache (PSN tokens typically last 1 hour)
    if (tokenCache.has(npsso)) {
        const cached = tokenCache.get(npsso);
        if (Date.now() < cached.expiresAt) {
            console.log("Using cached token for NPSSO:", npsso.substring(0, 5));
            return cached.token;
        }
    }

    try {
        console.log("Authenticating with PSN (Fresh)...");
        const accessCode = await exchangeNpssoForCode(npsso);
        const authorization = await exchangeCodeForAccessToken(accessCode);

        // Cache for 50 minutes to be safe
        tokenCache.set(npsso, {
            token: authorization.accessToken,
            expiresAt: Date.now() + (50 * 60 * 1000)
        });

        return authorization.accessToken;
    } catch (error) {
        console.error('PSN Auth Error:', error.message);
        return null;
    }
};

// Middleware to extract NPSSO
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        req.npsso = authHeader.split(' ')[1];
    } else {
        req.npsso = process.env.NPSSO || null;
    }
    next();
});

app.get('/api/auth/status', async (req, res) => {
    const token = await authenticate(req.npsso);
    res.json({ authenticated: !!token, hasNpsso: !!req.npsso });
});

app.post('/api/auth/login', async (req, res) => {
    const { npsso } = req.body;
    if (!npsso || npsso.length !== 64) {
        return res.status(400).json({ error: 'El código NPSSO debe tener exactamente 64 caracteres.' });
    }
    const token = await authenticate(npsso);
    if (token) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'No se pudo conectar con PlayStation. Verifica que el código sea correcto y reciente.' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    if (req.npsso) tokenCache.delete(req.npsso);
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
    const accessToken = await authenticate(req.npsso);
    if (!accessToken) return res.status(401).json({ error: 'Sesión expirada o inválida. Por favor, inicia sesión de nuevo.' });

    const accountId = getAccountIdFromToken(accessToken);
    if (!accountId) return res.status(500).json({ error: 'No se pudo obtener el ID de cuenta.' });

    try {
        const [profile, trophySummary] = await Promise.all([
            getProfileFromAccountId({ accessToken }, accountId),
            getUserTrophyProfileSummary({ accessToken }, accountId)
        ]);
        res.json({ ...profile, trophySummary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/trophies/me', async (req, res) => {
    const accessToken = await authenticate(req.npsso);
    if (!accessToken) return res.status(401).json({ error: 'Sesión expirada.' });

    const accountId = getAccountIdFromToken(accessToken);
    if (!accountId) return res.status(500).json({ error: 'No account ID' });

    try {
        const titles = await getUserTitles({ accessToken }, accountId, { limit: 24 });
        res.json(titles);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/titles/:npCommunicationId/trophies', async (req, res) => {
    const accessToken = await authenticate(req.npsso);
    if (!accessToken) return res.status(401).json({ error: 'Sesión expirada.' });

    const accountId = getAccountIdFromToken(accessToken);
    if (!accountId) return res.status(500).json({ error: 'No account ID' });

    try {
        const { npCommunicationId } = req.params;
        const titlesResponse = await getUserTitles({ accessToken }, accountId);
        const titleInfo = titlesResponse.trophyTitles.find(t => t.npCommunicationId === npCommunicationId);
        const titleName = titleInfo ? titleInfo.trophyTitleName : 'Game Trophies';

        let trophyGroups = {};
        try {
            const serviceName = titleInfo?.npServiceName || (titleInfo?.trophyTitlePlatform?.includes('PS5') ? 'trophy2' : 'trophy');
            const groupsResponse = await getTitleTrophyGroups({ accessToken }, npCommunicationId, { npServiceName: serviceName });
            groupsResponse.trophyGroups.forEach(g => trophyGroups[g.trophyGroupId] = g.trophyGroupName);
        } catch (err) { }

        const serviceName = titleInfo?.npServiceName || (titleInfo?.trophyTitlePlatform?.includes('PS5') ? 'trophy2' : 'trophy');
        const [staticTrophies, userTrophies] = await Promise.all([
            getTitleTrophies({ accessToken }, npCommunicationId, 'all', { npServiceName: serviceName }),
            getUserTrophiesEarnedForTitle({ accessToken }, accountId, npCommunicationId, 'all', { limit: 300, npServiceName: serviceName })
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
