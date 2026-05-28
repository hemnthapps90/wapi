require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Railway dynamically assigns a PORT, we must listen to it
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 🚨 RAILWAY CRITICAL UPDATE: Puppeteer Configuration
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        // Railway (Docker) needs these exact args to run Chrome successfully
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--single-process' // Crucial for memory management on cloud
        ]
    }
});

let isClientReady = false;

io.on('connection', (socket) => {
    console.log('Frontend connected');
    if (isClientReady) {
        socket.emit('ready', 'WhatsApp is connected!');
    }
});

client.on('qr', (qr) => {
    console.log('QR Code generated. Scan from browser.');
    qrcode.toDataURL(qr, (err, url) => {
        if (!err) io.emit('qr', url);
    });
});

client.on('authenticated', () => {
    console.log('Authenticated successfully!');
    io.emit('authenticated', 'Authenticated!');
});

client.on('ready', () => {
    console.log('WhatsApp Client is Ready!');
    isClientReady = true;
    io.emit('ready', 'WhatsApp is Ready!');
});

client.on('disconnected', (reason) => {
    console.log('Client Disconnected:', reason);
    isClientReady = false;
    io.emit('disconnected', 'Disconnected. Please refresh and scan again.');
});

client.initialize();

// ==========================================
// 🚀 API ROUTE 1: DIRECT URL METHOD (GET)
// ==========================================
app.get('/api/send', async (req, res) => {
    try {
        const { number, message } = req.query;

        if (!isClientReady) return res.status(503).json({ success: false, error: 'WhatsApp is not ready. Scan QR first.' });
        if (!number || !message) return res.status(400).json({ success: false, error: 'Provide both ?number= and &message=' });

        // STRICT VALIDATION
        const formattedNumber = number.toString().replace(/\D/g, '');
        if (!formattedNumber || formattedNumber.length < 10) {
            return res.status(400).json({ success: false, error: 'Invalid phone number format.' });
        }

        const chatId = `${formattedNumber}@c.us`;

        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) return res.status(404).json({ success: false, error: `Number ${formattedNumber} is not on WhatsApp.` });

        await client.sendMessage(chatId, message);
        res.status(200).json({ success: true, message: `Message sent successfully to ${formattedNumber}!`, sent_text: message });

    } catch (error) {
        console.error('URL API Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 🚀 API ROUTE 2: HTML FORM METHOD (POST)
// ==========================================
app.post('/api/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;

        if (!isClientReady) return res.status(503).json({ success: false, error: 'WhatsApp is not ready.' });
        if (!number || !message) return res.status(400).json({ success: false, error: 'Number and message are required.' });

        // STRICT VALIDATION
        const formattedNumber = number.toString().replace(/\D/g, '');
        if (!formattedNumber || formattedNumber.length < 10) {
            return res.status(400).json({ success: false, error: 'Invalid phone number format.' });
        }

        const chatId = `${formattedNumber}@c.us`;

        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) return res.status(404).json({ success: false, error: `Number ${formattedNumber} is not on WhatsApp.` });

        await client.sendMessage(chatId, message);
        res.status(200).json({ success: true, message: 'Message sent!' });

    } catch (error) {
        console.error('Form API Error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Important: Railway requires binding to 0.0.0.0
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is live at port ${PORT}`);
});
