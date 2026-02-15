import { io } from "socket.io-client";
import jwt from "jsonwebtoken";

const SERVER_URL = "http://localhost:4000";
const JWT_SECRET = process.env.JWT_SECRET || "MY_SECRET_KEY"; // Default from env.ts

const createClient = (id: string, name: string) => {
    const token = jwt.sign({ id }, JWT_SECRET, { expiresIn: "1h" });
    const socket = io(SERVER_URL, {
        auth: { token },
        transports: ["websocket"],
    });

    socket.on("connect", () => {
        console.log(`Client ${name} connected: ${socket.id}`);
        socket.emit("join-room", "test-room-1");
    });

    socket.on("connect_error", (err) => {
        console.error(`Client ${name} connection error:`, err.message);
    });

    socket.on("user-joined", (payload) => {
        console.log(`Client ${name} received user-joined:`, payload);
    });

    socket.on("location:update", (payload) => {
        console.log(`Client ${name} received location:update from ${payload.userId}:`, payload);
    });

    return socket;
};

const runTest = () => {
    console.log("Starting socket test with multiple clients...");

    const clientA = createClient("user1", "Alice");
    const clientB = createClient("user2", "Bob");
    const clientC = createClient("user3", "Charlie");

    // Allow some time for connections
    setTimeout(() => {
        console.log("Broadcasting location updates...");

        clientA.emit("location:update", {
            roomId: "test-room-1",
            lat: 37.7749,
            lng: -122.4194
        });

        clientB.emit("location:update", {
            roomId: "test-room-1",
            lat: 37.7849,
            lng: -122.4094
        });

    }, 2000);

    // Close connections after test
    setTimeout(() => {
        console.log("Closing connections...");
        clientA.disconnect();
        clientB.disconnect();
        clientC.disconnect();
        process.exit(0);
    }, 5000);
};

runTest();
