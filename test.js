const net = require('net');

const PORT = process.env.PORT || 8000;
const HOST = '0.0.0.0'; // Listen on all available IPs

const server = net.createServer((socket) => {
    console.log(`📡 New GPS device connected: ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on('data', (data) => {
        const rawData = data.toString().trim();
        console.log(`📥 Received Data: ${rawData}`);

        // ✅ OPTIONAL: Parse GPS Data
        const parts = rawData.split(',');
        if (parts.length >= 6) {
            const deviceId = parts[0]; 
            const date = parts[1];
            const time = parts[2];
            const latitude = parseFloat(parts[3]);
            const longitude = parseFloat(parts[4]);
            const speed = parseFloat(parts[5]);

            console.log(`📍 Device: ${deviceId} | Date: ${date} | Time: ${time} | Lat: ${latitude}, Lon: ${longitude} | Speed: ${speed} km/h`);
        }

        // ✅ Send acknowledgment (if required by GPS device)
        socket.write('OK\n');
    });

    socket.on('end', () => console.log('🔌 GPS device disconnected'));

    socket.on('error', (err) => console.error(`⚠️ Error: ${err.message}`));
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 GPS Tracker Server running on ${HOST}:${PORT}`);
});
