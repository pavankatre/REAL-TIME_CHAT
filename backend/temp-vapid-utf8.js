const webpush = require('web-push');
const fs = require('fs');
const vapidKeys = webpush.generateVAPIDKeys();
const output = `PUBLIC_KEY=${vapidKeys.publicKey}\nPRIVATE_KEY=${vapidKeys.privateKey}`;
fs.writeFileSync('vapid-utf8.txt', output, 'utf8');
