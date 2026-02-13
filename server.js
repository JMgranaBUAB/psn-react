import app from './api/index.js';
import os from 'os';

const PORT = 3001;

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0';
};

app.listen(PORT, '0.0.0.0', () => {
    const localIP = getLocalIP();
    console.log(`--- PROXY SERVER READY ---`);
    console.log(`Desktop: http://localhost:${PORT}`);
    console.log(`Mobile:  http://${localIP}:${PORT}`);
    console.log(`--------------------------`);
    console.log(`Using shared logic from ./api/index.js`);
});
