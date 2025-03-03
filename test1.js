const net = require('net');

const server = net.createServer((socket) => {
    console.log('📡 New GPS device connected:', socket.remoteAddress, socket.remotePort);

    socket.on('data', (data) => {
        console.log('📥 Received Data:', data.toString());
        // Process GPS data here
    });

    socket.on('end', () => {
        console.log('🔌 GPS device disconnected');
    });
});

const PORT = process.env.PORT || 3000; // Use Render-assigned port
server.listen(PORT, () => {
    console.log(`🚀 GPS Server running on port ${PORT}`);
});
