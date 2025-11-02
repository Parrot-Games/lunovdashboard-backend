const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Your routes and middleware here
app.get('/', (req, res) => {
  res.send('Lunor Dashboard is running!');
});

// This is crucial - must listen on the correct port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
