import { createServer } from 'node:http';
import { Server } from 'socket.io';

const PORT = Number(process.env.PORT || 3001);

const MODE_SIZE = {
    'pvp-1v1': 2,
    'pvp-2v2': 4,
    'pvp-3v3': 6,
};

const ARENA = {
    width: 1600,
    height: 900,
};

const PLAYER_SPEED = 280;
const PLAYER_RADIUS = 18;
const SHOT_SPEED = 720;
const SHOT_RADIUS = 6;
const SHOT_DAMAGE = 20;
const SHOT_COOLDOWN_MS = 280;
const MATCH_DURATION_MS = 3 * 60 * 1000;

const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    },
});

const queues = {
    'pvp-1v1': [],
    'pvp-2v2': [],
    'pvp-3v3': [],
};

const rooms = new Map();
const customRooms = new Map();

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

function getPlayerNameBySocketId(socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) return `Player-${socketId.slice(0, 4)}`;
    return socket.data.nickname || `Player-${socketId.slice(0, 4)}`;
}

function getCustomRoomPayload(room) {
    return {
        roomCode: room.roomCode,
        mode: room.mode,
        hostId: room.hostId,
        requiredPlayers: MODE_SIZE[room.mode],
        members: room.members.map((socketId) => ({
            id: socketId,
            name: getPlayerNameBySocketId(socketId),
        })),
    };
}

function emitCustomRoomUpdate(roomCode) {
    const room = customRooms.get(roomCode);
    if (!room) return;
    const payload = getCustomRoomPayload(room);
    for (const memberId of room.members) {
        io.to(memberId).emit('room_update', payload);
    }
}

function leaveCustomRoomBySocketId(socketId) {
    const socket = io.sockets.sockets.get(socketId);
    const roomCode = socket?.data.customRoomCode;
    if (!roomCode) return;

    const room = customRooms.get(roomCode);
    if (!room) {
        if (socket) delete socket.data.customRoomCode;
        return;
    }

    room.members = room.members.filter((id) => id !== socketId);
    if (socket) delete socket.data.customRoomCode;

    if (room.members.length === 0) {
        customRooms.delete(roomCode);
        return;
    }

    if (room.hostId === socketId) {
        room.hostId = room.members[0];
    }

    emitCustomRoomUpdate(roomCode);
}

function teamForIndex(idx, mode) {
    const half = MODE_SIZE[mode] / 2;
    return idx < half ? 'A' : 'B';
}

function spawnPoint(team, slot, mode) {
    const half = MODE_SIZE[mode] / 2;
    const perTeamIndex = slot % half;
    const spacing = 140;
    const y = 220 + perTeamIndex * spacing;
    return {
        x: team === 'A' ? 160 : ARENA.width - 160,
        y,
    };
}

function createRoom(mode, sockets) {
    const roomId = `room_${mode}_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const room = {
        roomId,
        mode,
        startAt: Date.now(),
        over: false,
        players: new Map(),
        projectiles: [],
    };

    sockets.forEach((socketId, idx) => {
        const socket = io.sockets.sockets.get(socketId);
        if (!socket) return;

        const team = teamForIndex(idx, mode);
        const pos = spawnPoint(team, idx, mode);
        const name = socket.data.nickname || `Player-${socketId.slice(0, 4)}`;

        room.players.set(socketId, {
            id: socketId,
            name,
            team,
            x: pos.x,
            y: pos.y,
            hp: 100,
            alive: true,
            input: {
                left: false,
                right: false,
                up: false,
                down: false,
                shoot: false,
                aimX: pos.x,
                aimY: pos.y,
            },
            lastShotAt: 0,
        });

        socket.join(roomId);
        socket.data.roomId = roomId;
    });

    rooms.set(roomId, room);

    const players = Array.from(room.players.values()).map((p) => ({
        id: p.id,
        name: p.name,
        team: p.team,
    }));

    for (const player of room.players.values()) {
        io.to(player.id).emit('match_found', {
            roomId,
            mode,
            playerId: player.id,
            team: player.team,
            players,
        });
    }
}

function updateRoom(room, dtMs) {
    if (room.over) return;

    const now = Date.now();

    for (const p of room.players.values()) {
        if (!p.alive) continue;

        const dx = (p.input.right ? 1 : 0) - (p.input.left ? 1 : 0);
        const dy = (p.input.down ? 1 : 0) - (p.input.up ? 1 : 0);
        const len = Math.hypot(dx, dy) || 1;

        p.x += ((dx / len) * PLAYER_SPEED * dtMs) / 1000;
        p.y += ((dy / len) * PLAYER_SPEED * dtMs) / 1000;

        p.x = Math.max(PLAYER_RADIUS, Math.min(ARENA.width - PLAYER_RADIUS, p.x));
        p.y = Math.max(PLAYER_RADIUS, Math.min(ARENA.height - PLAYER_RADIUS, p.y));

        if (p.input.shoot && now - p.lastShotAt >= SHOT_COOLDOWN_MS) {
            const ax = p.input.aimX - p.x;
            const ay = p.input.aimY - p.y;
            const ad = Math.hypot(ax, ay) || 1;

            room.projectiles.push({
                id: `${p.id}_${now}_${Math.floor(Math.random() * 999)}`,
                ownerId: p.id,
                team: p.team,
                x: p.x,
                y: p.y,
                vx: (ax / ad) * SHOT_SPEED,
                vy: (ay / ad) * SHOT_SPEED,
            });

            p.lastShotAt = now;
        }

        p.input.shoot = false;
    }

    const nextProjectiles = [];
    for (const b of room.projectiles) {
        b.x += (b.vx * dtMs) / 1000;
        b.y += (b.vy * dtMs) / 1000;

        if (b.x < -20 || b.x > ARENA.width + 20 || b.y < -20 || b.y > ARENA.height + 20) {
            continue;
        }

        let consumed = false;
        for (const p of room.players.values()) {
            if (!p.alive || p.team === b.team) continue;
            const dist = Math.hypot(p.x - b.x, p.y - b.y);
            if (dist <= PLAYER_RADIUS + SHOT_RADIUS) {
                p.hp = Math.max(0, p.hp - SHOT_DAMAGE);
                if (p.hp <= 0) p.alive = false;
                consumed = true;
                break;
            }
        }

        if (!consumed) {
            nextProjectiles.push(b);
        }
    }
    room.projectiles = nextProjectiles;

    const teamAAlive = Array.from(room.players.values()).some((p) => p.team === 'A' && p.alive);
    const teamBAlive = Array.from(room.players.values()).some((p) => p.team === 'B' && p.alive);

    const elapsed = now - room.startAt;
    const remainingMs = Math.max(0, MATCH_DURATION_MS - elapsed);

    if (!teamAAlive || !teamBAlive || remainingMs <= 0) {
        room.over = true;

        let winnerTeam = 'draw';
        if (teamAAlive && !teamBAlive) winnerTeam = 'A';
        if (!teamAAlive && teamBAlive) winnerTeam = 'B';

        if (winnerTeam === 'draw') {
            const teamAHp = Array.from(room.players.values()).filter((p) => p.team === 'A').reduce((sum, p) => sum + p.hp, 0);
            const teamBHp = Array.from(room.players.values()).filter((p) => p.team === 'B').reduce((sum, p) => sum + p.hp, 0);
            if (teamAHp > teamBHp) winnerTeam = 'A';
            else if (teamBHp > teamAHp) winnerTeam = 'B';
        }

        io.to(room.roomId).emit('game_over', {
            roomId: room.roomId,
            winnerTeam,
        });

        // Schedule room cleanup after a short delay so clients receive game_over
        setTimeout(() => {
            rooms.delete(room.roomId);
        }, 5000);

        return; // Stop broadcasting state_update once game is over
    }

    io.to(room.roomId).emit('state_update', {
        roomId: room.roomId,
        state: {
            players: Array.from(room.players.values()).map((p) => ({
                id: p.id,
                name: p.name,
                x: p.x,
                y: p.y,
                hp: p.hp,
                team: p.team,
                alive: p.alive,
            })),
            projectiles: room.projectiles.map((b) => ({ id: b.id, x: b.x, y: b.y, team: b.team })),
            remainingMs,
        },
    });
}

function trimQueue(mode) {
    queues[mode] = queues[mode].filter((socketId) => io.sockets.sockets.has(socketId));
}

function tryMatch(mode) {
    trimQueue(mode);
    const required = MODE_SIZE[mode];
    while (queues[mode].length >= required) {
        const sockets = queues[mode].splice(0, required);
        createRoom(mode, sockets);
    }

    io.emit('queue_update', { mode, count: queues[mode].length });
}

function removeSocketFromQueues(socketId) {
    for (const m of Object.keys(queues)) {
        queues[m] = queues[m].filter((id) => id !== socketId);
        io.emit('queue_update', { mode: m, count: queues[m].length });
    }
}

function startCustomRoomMatch(roomCode, starterId) {
    const room = customRooms.get(roomCode);
    if (!room) {
        io.to(starterId).emit('room_error', { message: 'Phong khong ton tai.' });
        return;
    }

    if (room.hostId !== starterId) {
        io.to(starterId).emit('room_error', { message: 'Chi chu phong moi duoc bat dau.' });
        return;
    }

    const required = MODE_SIZE[room.mode];
    if (room.members.length < required) {
        io.to(starterId).emit('room_error', { message: `Can it nhat ${required} nguoi de bat dau.` });
        return;
    }

    customRooms.delete(roomCode);

    // Clean up customRoomCode data from all members before starting the match
    for (const memberId of room.members) {
        const memberSocket = io.sockets.sockets.get(memberId);
        if (memberSocket) delete memberSocket.data.customRoomCode;
    }

    createRoom(room.mode, room.members.slice(0, required));
}

io.on('connection', (socket) => {
    socket.on('join_queue', ({ mode, nickname }) => {
        if (!MODE_SIZE[mode]) return;
        socket.data.nickname = String(nickname || '').slice(0, 24) || `Player-${socket.id.slice(0, 4)}`;

        leaveCustomRoomBySocketId(socket.id);
        removeSocketFromQueues(socket.id);

        if (!queues[mode].includes(socket.id)) {
            queues[mode].push(socket.id);
        }

        tryMatch(mode);
    });

    socket.on('leave_queue', ({ mode }) => {
        if (!mode || !queues[mode]) return;
        queues[mode] = queues[mode].filter((id) => id !== socket.id);
        io.emit('queue_update', { mode, count: queues[mode].length });
    });

    socket.on('create_custom_room', ({ mode, nickname }) => {
        if (!MODE_SIZE[mode]) return;
        socket.data.nickname = String(nickname || '').slice(0, 24) || `Player-${socket.id.slice(0, 4)}`;

        leaveCustomRoomBySocketId(socket.id);
        removeSocketFromQueues(socket.id);

        let roomCode = generateRoomCode();
        while (customRooms.has(roomCode)) {
            roomCode = generateRoomCode();
        }

        const room = {
            roomCode,
            mode,
            hostId: socket.id,
            members: [socket.id],
        };

        customRooms.set(roomCode, room);
        socket.data.customRoomCode = roomCode;
        io.to(socket.id).emit('room_created', getCustomRoomPayload(room));
    });

    socket.on('join_custom_room', ({ roomCode, mode, nickname }) => {
        socket.data.nickname = String(nickname || '').slice(0, 24) || `Player-${socket.id.slice(0, 4)}`;
        const normalizedCode = String(roomCode || '').trim().toUpperCase();
        const room = customRooms.get(normalizedCode);

        if (!room) {
            io.to(socket.id).emit('room_error', { message: 'Khong tim thay phong.' });
            return;
        }

        if (mode && room.mode !== mode) {
            io.to(socket.id).emit('room_error', { message: 'Phong dang o che do khac.' });
            return;
        }

        leaveCustomRoomBySocketId(socket.id);
        removeSocketFromQueues(socket.id);

        const required = MODE_SIZE[room.mode];
        if (room.members.length >= required) {
            io.to(socket.id).emit('room_error', { message: 'Phong da day.' });
            return;
        }

        if (!room.members.includes(socket.id)) {
            room.members.push(socket.id);
        }
        socket.data.customRoomCode = normalizedCode;
        emitCustomRoomUpdate(normalizedCode);
    });

    socket.on('leave_custom_room', () => {
        leaveCustomRoomBySocketId(socket.id);
    });

    socket.on('start_custom_room', ({ roomCode }) => {
        const normalizedCode = String(roomCode || '').trim().toUpperCase();
        startCustomRoomMatch(normalizedCode, socket.id);
    });

    socket.on('join_room_runtime', ({ roomId }) => {
        if (!roomId || !rooms.has(roomId)) return;
        socket.join(roomId);
    });

    socket.on('player_input', ({ roomId, playerId, input }) => {
        const room = rooms.get(roomId);
        if (!room || room.over) return;
        const player = room.players.get(playerId);
        if (!player) return;

        player.input = {
            left: Boolean(input.left),
            right: Boolean(input.right),
            up: Boolean(input.up),
            down: Boolean(input.down),
            shoot: Boolean(input.shoot),
            aimX: Number(input.aimX || 0),
            aimY: Number(input.aimY || 0),
        };
    });

    socket.on('disconnect', () => {
        leaveCustomRoomBySocketId(socket.id);
        removeSocketFromQueues(socket.id);

        for (const room of rooms.values()) {
            if (room.players.has(socket.id)) {
                const p = room.players.get(socket.id);
                p.alive = false;
                p.hp = 0;
            }
        }
    });
});

let lastTick = Date.now();
setInterval(() => {
    const now = Date.now();
    const dtMs = now - lastTick;
    lastTick = now;

    for (const room of rooms.values()) {
        updateRoom(room, dtMs);
    }
}, 33);

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[match-server] listening on 0.0.0.0:${PORT}`);
});
