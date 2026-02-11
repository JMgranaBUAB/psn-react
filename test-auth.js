import dotenv from 'dotenv';
import { exchangeNpssoForCode, exchangeCodeForAccessToken, getProfileFromAccountId } from 'psn-api';

dotenv.config();

const getAccountIdFromToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload).account_id;
    } catch (e) {
        return null;
    }
};

const testAuth = async () => {
    const npsso = process.env.NPSSO;
    console.log('--- PST Auth & Identity Test ---');

    if (!npsso) {
        console.error('❌ Error: NPSSO not found in .env file');
        return;
    }

    try {
        console.log('1. Authenticating...');
        const accessCode = await exchangeNpssoForCode(npsso);
        const authorization = await exchangeCodeForAccessToken(accessCode);
        const token = authorization.accessToken;
        console.log('✅ Authenticated!');

        const accountId = getAccountIdFromToken(token);
        console.log(`2. Token Account ID: ${accountId}`);

        console.log('3. Fetching Profile for this Account ID...');
        const profile = await getProfileFromAccountId({ accessToken: token }, accountId);
        console.log('Full Profile Data:', JSON.stringify(profile, null, 2));

        console.log('\n=============================================');
        console.log(`USER FOUND: ${profile.onlineId}`);
        console.log('=============================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

testAuth();
