const net = require("net");
const mongoose = require("mongoose");

// ✅ Connect to MongoDB (Optional)
mongoose.connect("mongodb://localhost:27017/gpsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// ✅ GPS Data Schema
const gpsSchema = new mongoose.Schema({
    imei: String,
    timestamp: Date,
    latitude: Number,
    longitude: Number,
    speed: Number,
    direction: Number,
});

const GPSData = mongoose.model("GPSData", gpsSchema);

const PORT = process.env.PORT || 8000;
const HOST = "0.0.0.0"; // Listen on all interfaces

const server = net.createServer((socket) => {
    console.log(`📡 GPS device connected: ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on("data", async (data) => {
        const rawData = data.toString("hex").toUpperCase();
        console.log(`📥 Received Raw Data: ${rawData}`);

        if (rawData.startsWith("7878")) {
            const protocolNumber = rawData.substring(6, 8);
            
            // ✅ 1️⃣ Handle Login Packet
            if (protocolNumber === "01") {
                const imei = rawData.substring(10, 24);
                console.log(`🔑 IMEI Login: ${imei}`);

                // Send Login Response
                const response = Buffer.from("787805010001D9DC0D0A", "hex");
                socket.write(response);

            // ✅ 2️⃣ Handle GPS Data Packet
            } else if (protocolNumber === "12") {
                const dateHex = rawData.substring(8, 20);
                const latitudeHex = rawData.substring(20, 28);
                const longitudeHex = rawData.substring(28, 36);
                const speedHex = rawData.substring(36, 38);
                const directionHex = rawData.substring(38, 42);

                const latitude = parseInt(latitudeHex, 16) / 1800000;
                const longitude = parseInt(longitudeHex, 16) / 1800000;
                const speed = parseInt(speedHex, 16);
                const direction = parseInt(directionHex, 16);

                console.log(`📍 GPS Data: Lat: ${latitude}, Lon: ${longitude}, Speed: ${speed} km/h, Dir: ${direction}`);

                // ✅ Save Data in MongoDB
                const gpsData = new GPSData({
                    imei: "Unknown",
                    timestamp: new Date(),
                    latitude,
                    longitude,
                    speed,
                    direction,
                });

                // await gpsData.save();
                console.log("✅ GPS Data Saved to Database");

                // Send Acknowledgment
                const response = Buffer.from("787805120001D9DC0D0A", "hex");
                socket.write(response);
            }
        } else {
            console.log("⚠️ Unknown Data Received");
        }
    });

    socket.on("end", () => console.log("🔌 GPS device disconnected"));
    socket.on("error", (err) => console.error(`⚠️ Connection Error: ${err.message}`));
});

server.listen(PORT, HOST, () => {
    console.log(`🚀 GPS Tracker Server running on ${HOST}:${PORT}`);
});
