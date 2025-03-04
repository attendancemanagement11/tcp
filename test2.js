const express = require('express');
const app = express();

app.use(express.json()); // Parse incoming JSON data

app.post('/', (req, res) => {
    console.log('📡 GPS Data Received:', req.body);
    res.status(200).send('GPS data received');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 GPS API running on port ${PORT}`));
