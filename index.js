const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('AGV Bot Aktif!'));
app.listen(3000, () => console.log('Server 3000 portunda'));

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('QR KOD GELDI, TARA:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Baglanti kapandi, yeniden baglaniyor...', shouldReconnect);
            if (shouldReconnect) start();
        } else if (connection === 'open') {
            console.log('BAGLANTI ACILDI! Bot aktif!');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;
        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        console.log('Gelen:', text);

        if (text === '!menu' || text === '.menu' || text === 'menu') {
            await sock.sendMessage(from, { text: '🤖 *AGV BOT MENU*\n\n!menu - Menuyu goster\n!ping - Bot calisiyor mu?\n!agv - AGV Bilgi' });
        }
        if (text === '!ping' || text === '.ping') {
            await sock.sendMessage(from, { text: 'Pong! ✅ Bot aktif' });
        }
        if (text === '!agv' || text === '.agv') {
            await sock.sendMessage(from, { text: 'AGV Bot v1 - Muhammed tarafindan yapildi 🚀' });
        }
    });
}

start();
