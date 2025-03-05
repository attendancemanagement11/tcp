const dgram = require('dgram');
const crc = require('crc');

// Constants
const START_BIT = [0x78, 0x78]; // Start bit for the packet
const STOP_BIT = [0x0D, 0x0A];  // Stop bit for the packet

// Helper function to calculate CRC-ITU
function calculateCRC(data) {
    return crc.crc16ccitt(data);
}

// Helper function to create a packet
function createPacket(protocolNumber, informationContent) {
    const packetLength = 1 + informationContent.length + 2; // Protocol Number + Information Content + CRC
    const serialNumber = [0x00, 0x01]; // Example serial number (incremented for each packet)

    // Build the packet
    const packet = [
        ...START_BIT,                // Start bit
        packetLength,                // Packet length
        protocolNumber,              // Protocol number
        ...informationContent,       // Information content
        ...serialNumber,             // Serial number
    ];

    // Calculate CRC for the packet (from Packet Length to Serial Number)
    const crcValue = calculateCRC(Buffer.from(packet.slice(2))); // Exclude start bit
    packet.push((crcValue >> 8) & 0xFF, crcValue & 0xFF); // Add CRC (2 bytes)

    // Add stop bit
    packet.push(...STOP_BIT);

    return Buffer.from(packet);
}

// Login Packet (Protocol Number: 0x01)
function createLoginPacket(imei) {
    const imeiBytes = Buffer.from(imei, 'ascii'); // Convert IMEI to bytes
    const modelIdentificationCode = [0x01, 0x23]; // Example model identification code
    const timeZoneLanguage = [0x00, 0x01];       // Example time zone and language (GMT+8, Chinese)

    const informationContent = [
        ...imeiBytes,                // IMEI
        ...modelIdentificationCode,  // Model identification code
        ...timeZoneLanguage,         // Time zone and language
    ];

    return createPacket(0x01, informationContent);
}

// Heartbeat Packet (Protocol Number: 0x13)
function createHeartbeatPacket(batteryLevel, gsmSignalStrength) {
    const terminalInformation = 0x40; // Example terminal information (GPS on, ACC high)
    const languageExtendedPortStatus = [0x00, 0x01]; // Example language and extended port status

    const informationContent = [
        terminalInformation,         // Terminal information
        batteryLevel,                // Battery level (0x00 to 0x06)
        gsmSignalStrength,           // GSM signal strength (0x00 to 0x04)
        ...languageExtendedPortStatus, // Language and extended port status
    ];

    return createPacket(0x13, informationContent);
}

// GPS Location Packet (Protocol Number: 0x22)
function createGPSLocationPacket(dateTime, latitude, longitude, speed, courseStatus) {
    const gpsSatellites = 0x08; // Example number of GPS satellites
    const mcc = [0x01, 0xCC];   // Example Mobile Country Code (MCC)
    const mnc = 0x00;           // Example Mobile Network Code (MNC)
    const lac = [0x28, 0x7D];   // Example Location Area Code (LAC)
    const cellId = [0x00, 0x1F, 0x71]; // Example Cell ID
    const accStatus = 0x01;     // Example ACC status (high)

    const informationContent = [
        ...dateTime,            // Date and time (6 bytes)
        gpsSatellites,          // Number of GPS satellites
        ...latitude,            // Latitude (4 bytes)
        ...longitude,           // Longitude (4 bytes)
        speed,                  // Speed (1 byte)
        ...courseStatus,        // Course and status (2 bytes)
        ...mcc,                 // MCC (2 bytes)
        mnc,                    // MNC (1 byte)
        ...lac,                 // LAC (2 bytes)
        ...cellId,              // Cell ID (3 bytes)
        accStatus,              // ACC status (1 byte)
    ];

    return createPacket(0x22, informationContent);
}

// Example usage
const imei = "867440069849404"; // Example IMEI
const loginPacket = createLoginPacket(imei);
console.log("Login Packet:", loginPacket);

const heartbeatPacket = createHeartbeatPacket(0x04, 0x03); // Battery level: Medium (0x04), GSM signal: Good (0x03)
console.log("Heartbeat Packet:", heartbeatPacket);

const dateTime = [0x23, 0x0C, 0x1D, 0x12, 0x34, 0x56]; // Example date and time (2023-12-29 18:52:38)
const latitude = [0x02, 0x6C, 0x10, 0x54]; // Example latitude (22.5726° N)
const longitude = [0x0C, 0x38, 0xC9, 0x70]; // Example longitude (114.0573° E)
const speed = 0x32; // Example speed (50 km/h)
const courseStatus = [0x15, 0x4C]; // Example course and status (332°)
const gpsLocationPacket = createGPSLocationPacket(dateTime, latitude, longitude, speed, courseStatus);
console.log("GPS Location Packet:", gpsLocationPacket);

// Send packets to the server using UDP
const client = dgram.createSocket('udp4');
const SERVER_IP = '13.60.33.15'; // Replace with your server IP
const SERVER_PORT = 8000;      // Replace with your server port

client.send(loginPacket, SERVER_PORT, SERVER_IP, (err) => {
    if (err) console.error("Error sending login packet:", err);
    else console.log("Login packet sent successfully");
});

client.send(heartbeatPacket, SERVER_PORT, SERVER_IP, (err) => {
    if (err) console.error("Error sending heartbeat packet:", err);
    else console.log("Heartbeat packet sent successfully");
});

client.send(gpsLocationPacket, SERVER_PORT, SERVER_IP, (err) => {
    if (err) console.error("Error sending GPS location packet:", err);
    else console.log("GPS location packet sent successfully");
});

client.close();