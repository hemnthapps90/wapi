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

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// WhatsApp Client Initialization
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
        ]
    }
});

let isClientReady = false;

// Socket.io for Real-time Frontend Updates
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
// Example: http://localhost:3000/api/send?number=919876543210&message=Hi
// ==========================================
app.get('/api/send', async (req, res) => {
    try {
        const { number, message } = req.query;

        if (!isClientReady) return res.status(503).json({ success: false, error: 'WhatsApp is not ready. Scan QR first.' });
        if (!number || !message) return res.status(400).json({ success: false, error: 'Provide both ?number= and &message=' });

        // STRICT VALIDATION: Keep only numbers (removes spaces, +, letters, symbols)
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

        // STRICT VALIDATION: Keep only numbers (removes spaces, +, letters, symbols)
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

// Start Server
server.listen(PORT, () => {
    console.log(`Server is live at http://localhost:${PORT}`);
});
