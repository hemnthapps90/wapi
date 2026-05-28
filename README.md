# WAPI - WhatsApp Web API

A simple WhatsApp API built with Node.js and WhatsApp Web.

## Requirements

* Node.js 18+ Recommended
* NPM
* Google Chrome / Chromium
* Internet Connection

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/hemnthapps90/wapi.git
cd wapi
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Open `.env` file and update values if required.

Example:

```env
PORT=3000
```

### 4. Start Server

```bash
node server.js
```

or

```bash
npm start
```

## Access Application

Open browser:

```text
http://localhost:3000
```

## Login WhatsApp

1. Start server.
2. Open application in browser.
3. QR Code will appear.
4. Scan QR using WhatsApp Mobile App.
5. Wait until connection is successful.

## Send Message API

Example:

```http
POST /send-message
```

Request Body:

```json
{
  "number": "919999999999",
  "message": "Hello World"
}
```

## Features

* QR Code Login
* WhatsApp Session Management
* Send Text Messages
* REST API Support
* Browser Dashboard

## Running on VPS

```bash
git clone https://github.com/hemnthapps90/wapi.git
cd wapi
npm install
node server.js
```

For production:

```bash
npm install -g pm2
pm2 start server.js --name wapi
pm2 save
pm2 startup
```

## Troubleshooting

### Module Not Found

```bash
npm install
```

### Port Already In Use

Change PORT value inside `.env`.

### QR Not Appearing

Delete session folder and restart server.

## Author

Hemanth Software
https://github.com/hemnthapps90
