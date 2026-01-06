const express = require('express');
const path = require('path');

const app = express();

app.get('/', (req, res) => {
  console.log('GET / handler called');
  const filePath = path.join(__dirname, './public/index.html');
  console.log('Sending file:', filePath);
  res.sendFile(filePath);
});

app.listen(3002, () => {
  console.log('Debug server on 3002');
});
