const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        status: "online",
        service: "Voryn Call Server"
    });
});

// =========================
// WebRTC Signaling
// =========================

io.on("connection", (socket) => {

    console.log("جهاز متصل:", socket.id);

    // دخول مستخدم لغرفة مكالمة
    socket.on("join-call", (roomId) => {

        socket.join(roomId);

        const users = io.sockets.adapter.rooms.get(roomId);

        const count = users ? users.size : 0;

        console.log(
            `المستخدم ${socket.id} دخل الغرفة ${roomId}`
        );

        socket.to(roomId).emit("user-joined", {
            userId: socket.id
        });

        socket.emit("room-info", {
            users: count
        });
    });

    // إرسال إشارات WebRTC
    socket.on("webrtc-signal", (data) => {

        if (!data || !data.roomId || !data.signal) {
            return;
        }

        socket.to(data.roomId).emit("webrtc-signal", {
            userId: socket.id,
            signal: data.signal
        });
    });

    // إنهاء المكالمة
    socket.on("leave-call", (roomId) => {

        socket.leave(roomId);

        socket.to(roomId).emit("user-left", {
            userId: socket.id
        });
    });

    // فصل الاتصال
    socket.on("disconnect", () => {

        console.log("جهاز فصل الاتصال:", socket.id);

        socket.broadcast.emit("user-disconnected", {
            userId: socket.id
        });
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(
        `Voryn Call Server يعمل على المنفذ ${PORT}`
    );

});
