import dotenv from 'dotenv';
import {
    exchangeNpssoForCode,
    exchangeCodeForAccessToken,
    getUserTitles,
    getUserTrophiesEarnedForTitle,
    getProfileFromAccountId,
    getTitleTrophies
} from 'psn-api';

dotenv.config();

const debugTrophies = async () => {
    const npsso = process.env.NPSSO;
    if (!npsso) {
        console.error('NPSSO not found');
        return;
    }

    try {
        console.log('1. Authenticating...');
        const accessCode = await exchangeNpssoForCode(npsso);
        const authorization = await exchangeCodeForAccessToken(accessCode);
        const accessToken = authorization.accessToken;
        console.log('✅ Authenticated');

        // Extract Account ID
        const base64Url = accessToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        const accountId = payload.account_id;
        console.log(`Account ID: ${accountId}`);

        console.log('2. Fetching recent titles to get an npCommunicationId...');
        const titles = await getUserTitles({ accessToken }, accountId, { limit: 1 });

        if (!titles.trophyTitles || titles.trophyTitles.length === 0) {
            console.error('No titles found.');
            return;
        }

        const game = titles.trophyTitles[0];
        console.log('Game Object:', JSON.stringify(game, null, 2));

        // Determine service name
        const serviceName = game.trophyTitlePlatform?.includes('PS5') ? 'trophy2' : 'trophy';
        console.log(`Using npServiceName: ${serviceName}`);

        console.log('3. Fetching User Trophies (Earned status)...');
        const userTrophies = await getUserTrophiesEarnedForTitle(
            { accessToken },
            accountId,
            game.npCommunicationId,
            'all',
            { limit: 100, npServiceName: serviceName }
        );

        console.log('4. Fetching Title Trophies (Static details)...');
        const titleTrophies = await getTitleTrophies(
            { accessToken },
            game.npCommunicationId,
            'all',
            { npServiceName: serviceName }
        );

        console.log('Title Trophies Keys:', Object.keys(titleTrophies));
        if (titleTrophies.trophyTitleName) console.log('Found Name:', titleTrophies.trophyTitleName);
        else console.log('Name NOT found in staticTrophies');

        // Merge logic test
        const merged = titleTrophies.trophies.map(t => {
            const earned = userTrophies.trophies.find(u => u.trophyId === t.trophyId);
            return {
                ...t,
                earned: earned ? earned.earned : false,
                earnedDateTime: earned ? earned.earnedDateTime : null,
                trophyEarnedRate: earned ? earned.trophyEarnedRate : null
            };
        });

        console.log('Merged First Trophy:', JSON.stringify(merged[0], null, 2));

    } catch (error) {
        console.error('❌ Critical Error:', error);
        if (error?.response?.data) {
            console.error('API Response:', JSON.stringify(error.response.data, null, 2));
        }
    }
};

debugTrophies();
