const express = require('express');
const fetch = require('node-fetch'); // Make sure you're using node-fetch v2.x
const cors = require('cors');
const app = express();
const port = 3000;
 
app.use(cors()); // Enable CORS for all routes
 
app.get('/proxy', async (req, res) => {
    const url = req.query.url;
    if (!url) {
        return res.status(400).send('URL is required');
    }
 
    try {
        const response = await fetch(url);
        const data = await response.text();
        res.send(data);
    } catch (error) {
        res.status(500).send('Error fetching the URL');
    }
});
 
app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
});