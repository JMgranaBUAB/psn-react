import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exchangeNpssoForCode, exchangeCodeForAccessToken, getUserTitles, makeUniversalSearch, getProfileFromAccountId, getUserTrophyProfileSummary, getUserTrophiesEarnedForTitle, getTitleTrophies, getTitleTrophyGroups } from 'psn-api';
import translate from 'translate-google-api';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// PSN Auth Token storage
let access_token = null;
let current_npsso = process.env.NPSSO || null;

// Simple in-memory cache for translations to avoid redundant API calls
const translationCache = new Map();

const authenticate = async () => {
    const npsso = current_npsso;
    console.log("--- PSN AUTHENTICATION START ---");
    console.log("Using NPSSO (first 5 chars):", npsso ? npsso.substring(0, 5) + '...' : 'NONE');

    if (!npsso || npsso.length !== 64) {
        console.error('NPSSO token invalid or missing.');
        return null;
    }

    try {
        console.log("Exchanging NPSSO for Access Code...");
        const accessCode = await exchangeNpssoForCode(npsso);
        console.log("Access Code obtained successfully.");

        console.log("Exchanging Code for Access Token...");
        const authorization = await exchangeCodeForAccessToken(accessCode);
        access_token = authorization.accessToken;

        console.log('PSN Authenticated successfully. Token expires in:', authorization.expiresIn);
        return access_token;
    } catch (error) {
        console.error('PSN AUTHENTICATION FAILED:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data));
        } else {
            console.error('Error Message:', error.message);
        }
        access_token = null;
        return null;
    }
};

app.get('/api/auth/status', (req, res) => {
    res.json({
        authenticated: !!access_token,
        hasNpsso: !!current_npsso
    });
});

app.post('/api/auth/login', async (req, res) => {
    const { npsso } = req.body;
    console.log("Login request received with NPSSO length:", npsso?.length);

    if (!npsso || npsso.length !== 64) {
        return res.status(400).json({ error: 'El código NPSSO debe tener exactamente 64 caracteres.' });
    }

    current_npsso = npsso;
    const token = await authenticate();

    if (token) {
        console.log("Login successful.");
        res.json({ success: true, message: 'Authenticated successfully' });
    } else {
        console.log("Login failed, resetting to default NPSSO.");
        current_npsso = process.env.NPSSO || null; // Reset if failed
        res.status(401).json({ error: 'No se pudo conectar con PlayStation. Verifica que el código NPSSO sea reciente y no haya expirado.' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    access_token = null;
    current_npsso = process.env.NPSSO || null;
    res.json({ success: true });
});

// Helper: Extract Account ID from JWT Token
const getAccountIdFromToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        // Use Buffer for Node.js compatibility if atob is not available
        const decoded = typeof atob === 'function'
            ? atob(base64)
            : Buffer.from(base64, 'base64').toString('binary');

        const jsonPayload = decodeURIComponent(decoded.split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        console.log("Token payload account_id:", payload.account_id);
        return payload.account_id;
    } catch (e) {
        console.error("Error decoding token payload:", e.message);
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
            { limit: 24 }
        );

        res.json(titles);
    } catch (error) {
        console.error("Error fetching trophies:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/titles/:npCommunicationId/trophies', async (req, res) => {
    console.log(`Requesting trophies for title: ${req.params.npCommunicationId}`);
    if (!access_token) await authenticate();
    if (!access_token) return res.status(500).json({ error: 'Failed to authenticate' });

    const accountId = getAccountIdFromToken(access_token);
    if (!accountId) return res.status(500).json({ error: 'No Account ID' });

    try {
        const { npCommunicationId } = req.params;

        // Fetch title name separately because getTitleTrophies doesn't return it
        const titlesResponse = await getUserTitles({ accessToken: access_token }, accountId);
        const titleInfo = titlesResponse.trophyTitles.find(t => t.npCommunicationId === npCommunicationId);
        const titleName = titleInfo ? titleInfo.trophyTitleName : 'Game Trophies';

        // Fetch trophy groups to get DLC names
        let trophyGroups = {};
        try {
            const serviceName = titleInfo?.npServiceName || (titleInfo?.trophyTitlePlatform?.includes('PS5') ? 'trophy2' : 'trophy');
            const groupsResponse = await getTitleTrophyGroups(
                { accessToken: access_token },
                npCommunicationId,
                { npServiceName: serviceName }
            );

            // Map groupId to groupName
            groupsResponse.trophyGroups.forEach(group => {
                trophyGroups[group.trophyGroupId] = group.trophyGroupName;
            });
        } catch (err) {
            console.error('Failed to fetch trophy groups:', err.message);
            // Continue without group names
        }

        // Helper to fetch both and merge
        const fetchAndMerge = async (serviceName) => {
            console.log(`Trying service: ${serviceName}`);
            const [staticTrophies, userTrophies] = await Promise.all([
                getTitleTrophies(
                    { accessToken: access_token },
                    npCommunicationId,
                    'all',
                    { npServiceName: serviceName }
                ),
                getUserTrophiesEarnedForTitle(
                    { accessToken: access_token },
                    accountId,
                    npCommunicationId,
                    'all',
                    { limit: 300, npServiceName: serviceName }
                )
            ]);

            // Merge static data with earned status
            const mergedTrophies = staticTrophies.trophies.map(t => {
                const earned = userTrophies.trophies.find(u => u.trophyId === t.trophyId);
                return {
                    ...t,
                    earned: earned ? earned.earned : false,
                    earnedDateTime: earned ? earned.earnedDateTime : null,
                    trophyEarnedRate: earned ? earned.trophyEarnedRate : null
                };
            });

            // Translate descriptions to Spanish
            console.log("Translating trophies to Spanish...");
            const trophiesToTranslate = mergedTrophies.filter(t => !translationCache.has(t.trophyId) && t.trophyDetail);

            if (trophiesToTranslate.length > 0) {
                try {
                    const descriptions = trophiesToTranslate.map(t => t.trophyDetail);
                    // Translate as a batch
                    const translations = await translate(descriptions, {
                        from: 'en',
                        to: 'es'
                    });

                    trophiesToTranslate.forEach((t, i) => {
                        if (translations[i]) {
                            translationCache.set(t.trophyId, translations[i]);
                        }
                    });
                } catch (err) {
                    console.error("Translation error:", err.message);
                }
            }

            // Add cached translations to result
            const finalTrophies = mergedTrophies.map(t => ({
                ...t,
                trophyDetailEs: translationCache.get(t.trophyId) || null
            }));

            return {
                trophies: finalTrophies,
                titleName: titleName
            };
        };

        let results;
        try {
            // PS5 games usually use 'trophy2'
            results = await fetchAndMerge('trophy2');
        } catch (e) {
            console.log("Failed with 'trophy2', trying 'trophy' (PS4)...");
            try {
                results = await fetchAndMerge('trophy');
            } catch (e2) {
                console.error("Failed with both trophy and trophy2.");
                throw e2;
            }
        }

        res.json({
            trophies: results.trophies,
            titleName: results.titleName,
            platform: titleInfo?.trophyTitlePlatform || '',
            trophyGroups: trophyGroups
        });
    } catch (error) {
        console.error("Error fetching game trophies:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
});
