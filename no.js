const net = require('net');
const crc = require('crc');

// Create a TCP server
const server = net.createServer((socket) => {
    console.log('Device connected:', socket.remoteAddress, socket.remotePort);

    // Handle incoming data
    socket.on('data', (data) => {
        console.log('Received data:', data.toString('hex'));

        // Parse the incoming packet
        const parsedData = parseConcoxPacket(data);
        console.log('Parsed Data:', parsedData);

        // Respond to the device (e.g., acknowledge login)
        if (parsedData.protocolNumber === 0x01) { // Login packet
            const response = createLoginResponse(parsedData.serialNumber);
            socket.write(response);
            console.log('Sent login response:', response.toString('hex'));
        }
    });

    // Handle device disconnection
    socket.on('close', () => {
        console.log('Device disconnected');
    });
});

// Start the server
const PORT = 5000; // Port to listen on
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});