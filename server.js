const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Gövdesi JSON olan istekleri okuyabilmek için
app.use(express.json());

// public klasörünü statik olarak servis et
app.use(express.static(path.join(__dirname, 'public')));

// Test için basit bir endpoint (zorunlu değil ama dursun)
app.get('/hello', (req, res) => {
  res.send('Princess Rescue backend çalışıyor!');
});

app.listen(PORT, () => {
  console.log(`Princess Rescue server: http://localhost:${PORT}`);
});
