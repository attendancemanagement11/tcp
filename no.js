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
        if (!parsedData) {
            console.error('Invalid packet or CRC mismatch!');
            return;
        }

        console.log('Parsed Data:', parsedData);

        // Handle different protocol numbers
        switch (parsedData.protocolNumber) {
            case 0x01: // Login packet
                const loginResponse = createLoginResponse(parsedData.serialNumber);
                socket.write(loginResponse);
                console.log('Sent login response:', loginResponse.toString('hex'));
                break;

            case 0x12: // Location packet
                const locationData = parseLocationPacket(parsedData.informationContent);
                console.log('Location Data:', locationData);
                break;

            case 0x13: // Heartbeat packet
                const heartbeatResponse = createHeartbeatResponse(parsedData.serialNumber);
                socket.write(heartbeatResponse);
                console.log('Sent heartbeat response:', heartbeatResponse.toString('hex'));
                break;

            default:
                console.log('Unhandled protocol number:', parsedData.protocolNumber);
                break;
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

// Function to parse Concox packets
function parseConcoxPacket(data) {
    if (data.length < 12) {
        console.error('Packet too short');
        return null;
    }

    const startBit = data.slice(0, 2).toString('hex'); // Start bit (0x78 0x78)
    const packetLength = data.readUInt8(2); // Packet length
    const protocolNumber = data.readUInt8(3); // Protocol number
    const informationContent = data.slice(4, 4 + packetLength - 5); // Information content
    const serialNumber = data.readUInt16BE(4 + packetLength - 5); // Serial number
    const errorCheck = data.readUInt16BE(4 + packetLength - 3); // CRC-ITU
    const stopBit = data.slice(4 + packetLength - 1).toString('hex'); // Stop bit (0x0D 0x0A)

    // Verify CRC
    const calculatedCRC = crc.crc16itu(data.slice(2, 4 + packetLength - 3));
    if (calculatedCRC !== errorCheck) {
        console.error('CRC mismatch!');
        return null;
    }

    return {
        startBit,
        packetLength,
        protocolNumber,
        informationContent,
        serialNumber,
        errorCheck,
        stopBit,
    };
}

// Function to create a login response
function createLoginResponse(serialNumber) {
    const packet = Buffer.alloc(10);
    packet.writeUInt16BE(0x7878, 0); // Start bit
    packet.writeUInt8(0x05, 2); // Packet length
    packet.writeUInt8(0x01, 3); // Protocol number (login response)
    packet.writeUInt16BE(serialNumber, 4); // Serial number
    const crcValue = crc.crc16itu(packet.slice(2, 8)); // Calculate CRC
    packet.writeUInt16BE(crcValue, 8); // Error check
    packet.writeUInt16BE(0x0D0A, 10); // Stop bit
    return packet;
}

// Function to parse location packet
function parseLocationPacket(informationContent) {
    const dateTime = informationContent.slice(0, 6); // Date and time
    const gpsInfoLength = informationContent.readUInt8(6); // GPS info length
    const latitude = informationContent.readUInt32BE(7); // Latitude
    const longitude = informationContent.readUInt32BE(11); // Longitude
    const speed = informationContent.readUInt8(15); // Speed
    const courseStatus = informationContent.readUInt16BE(16); // Course and status
    const mcc = informationContent.readUInt16BE(18); // Mobile Country Code
    const mnc = informationContent.readUInt8(20); // Mobile Network Code
    const lac = informationContent.readUInt16BE(21); // Location Area Code
    const cellId = informationContent.readUInt16BE(23); // Cell ID

    return {
        dateTime: dateTime.toString('hex'),
        gpsInfoLength,
        latitude: latitude / 30000 / 60, // Convert to degrees
        longitude: longitude / 30000 / 60, // Convert to degrees
        speed,
        courseStatus,
        mcc,
        mnc,
        lac,
        cellId,
    };
}

// Function to create a heartbeat response
function createHeartbeatResponse(serialNumber) {
    const packet = Buffer.alloc(10);
    packet.writeUInt16BE(0x7878, 0); // Start bit
    packet.writeUInt8(0x05, 2); // Packet length
    packet.writeUInt8(0x13, 3); // Protocol number (heartbeat response)
    packet.writeUInt16BE(serialNumber, 4); // Serial number
    const crcValue = crc.crc16itu(packet.slice(2, 8)); // Calculate CRC
    packet.writeUInt16BE(crcValue, 8); // Error check
    packet.writeUInt16BE(0x0D0A, 10); // Stop bit
    return packet;
}