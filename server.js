require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup for File Uploads (in memory)
const upload = multer({ storage: multer.memoryStorage() });

// WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }
});

let isClientReady = false;

io.on('connection', (socket) => {
    if (isClientReady) socket.emit('ready', 'WhatsApp is connected!');
});

client.on('qr', (qr) => {
    qrcode.toDataURL(qr, (err, url) => {
        if (!err) io.emit('qr', url);
    });
});

client.on('authenticated', () => io.emit('authenticated', 'Authenticated!'));
client.on('ready', () => {
    isClientReady = true;
    io.emit('ready', 'WhatsApp is Ready!');
});
client.on('disconnected', () => {
    isClientReady = false;
    io.emit('disconnected', 'Disconnected. Please scan again.');
});

client.initialize();

// Safe Human Delay (2 to 4 seconds) to avoid WhatsApp ban
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getRandomDelay = () => Math.floor(Math.random() * 2000) + 2000;

// 1. Single Message API
app.post('/api/send-message', async (req, res) => {
    try {
        const { number, message } = req.body;
        if (!isClientReady) return res.status(503).json({ success: false, error: 'API not ready.' });
        if (!number || !message) return res.status(400).json({ success: false, error: 'Missing data.' });

        const formattedNumber = number.toString().replace(/[-+()\s]/g, '');
        const chatId = `${formattedNumber}@c.us`;

        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) return res.status(404).json({ success: false, error: 'Not registered on WA.' });

        await client.sendMessage(chatId, message);
        res.status(200).json({ success: true, message: 'Message sent!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Bulk Message API (Text/Manual Entry)
app.post('/api/send-bulk', async (req, res) => {
    try {
        const { numbers, message } = req.body;
        if (!isClientReady) return res.status(503).json({ success: false, error: 'API not ready.' });
        
        const numberArray = numbers.split(/[,\n]+/).map(n => n.trim()).filter(n => n !== '');
        if (numberArray.length === 0) return res.status(400).json({ success: false, error: 'No valid numbers.' });

        res.status(200).json({ success: true, total: numberArray.length, message: 'Processing started!' });
        processBulkMessages(numberArray.map(n => ({ phone_number: n })), message);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. NEW: File Upload API (CSV/JSON)
app.post('/api/upload-bulk', upload.single('file'), async (req, res) => {
    try {
        if (!isClientReady) return res.status(503).json({ success: false, error: 'API not ready.' });
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded.' });
        
        const messageTemplate = req.body.message;
        if (!messageTemplate) return res.status(400).json({ success: false, error: 'Message is required.' });

        const fileExt = path.extname(req.file.originalname).toLowerCase();
        let contacts = [];

        if (fileExt === '.json') {
            const data = JSON.parse(req.file.buffer.toString());
            contacts = Array.isArray(data) ? data : [];
        } else if (fileExt === '.csv') {
            const stream = Readable.from(req.file.buffer.toString());
            await new Promise((resolve, reject) => {
                stream.pipe(csv())
                    .on('data', (row) => contacts.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });
        } else {
            return res.status(400).json({ success: false, error: 'Only CSV or JSON files allowed.' });
        }

        // Filter valid contacts (Require phone_number column)
        const validContacts = contacts.filter(c => c.phone_number || c.phone || c.number);
        
        if (validContacts.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid phone numbers found in file. Ensure column is named phone_number.' });
        }

        res.status(200).json({ success: true, total: validContacts.length, message: 'File processing started!' });
        processBulkMessages(validContacts, messageTemplate);

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error processing file.' });
    }
});

// Background Processor with Safety Delays
async function processBulkMessages(contacts, messageTemplate) {
    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        // Accommodate standard names or exact CSV headers
        const rawNumber = contact.phone_number || contact.phone || contact.number || '';
        const name = contact.saved_name || contact.name || 'User'; 
        
        if (!rawNumber) continue;

        let num = rawNumber.toString().replace(/[-+()\s]/g, '');
        let chatId = `${num}@c.us`;
        
        // Dynamic variable replacement
        let finalMessage = messageTemplate.replace(/{name}/gi, name);

        try {
            const isRegistered = await client.isRegisteredUser(chatId);
            if (isRegistered) {
                await client.sendMessage(chatId, finalMessage);
                io.emit('bulk-progress', { success: true, number: num, name, current: i + 1, total: contacts.length });
            } else {
                io.emit('bulk-progress', { success: false, number: num, error: 'Not on WA', current: i + 1, total: contacts.length });
            }
        } catch (err) {
            io.emit('bulk-progress', { success: false, number: num, error: err.message, current: i + 1, total: contacts.length });
        }

        // Apply delay unless it's the last message
        if (i < contacts.length - 1) {
            await delay(getRandomDelay()); 
        }
    }
    io.emit('bulk-complete', { message: 'All file messages processed successfully!' });
}

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));