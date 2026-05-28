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





## Expose Localhost to Internet Using Ngrok

If your application is running on localhost and you want to access it from anywhere, use Ngrok.

### Install Ngrok

Download and install Ngrok from:

https://ngrok.com/download

### Login to Ngrok

Get your auth token from:

https://dashboard.ngrok.com/get-started/your-authtoken

Run:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Start Your Application

```bash
node server.js
```

Example:

```text
http://localhost:3000
```

### Create Public URL

Open a new terminal and run:

```bash
ngrok http 3000
```

Output:

```text
Forwarding https://abc123.ngrok-free.app -> http://localhost:3000
```

Now your local application is accessible worldwide using:

```text
https://abc123.ngrok-free.app
```

### Example API URL

Local:

```text
http://localhost:3000/send-message
```

Public:

```text
https://abc123.ngrok-free.app/send-message
```

### Notes

* Keep Node.js server running.
* Keep Ngrok running.
* Free Ngrok URLs change after restart.
* For permanent URLs use a paid Ngrok plan or deploy on a VPS.

### Check Status

```bash
curl https://abc123.ngrok-free.app
```

### Stop Ngrok

Press:

```text
CTRL + C
```

in the Ngrok terminal.
