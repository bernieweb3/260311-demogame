import { useEffect, useMemo, useRef, useState } from 'react';
import { getMatchSocket, getResolvedMatchServerUrl } from '../network/matchSocket';
import type { GameMode } from '../types/gameMode';

type TeamId = 'A' | 'B';

export interface MatchedPlayer {
    id: string;
    name: string;
    team: TeamId;
}

export interface MatchFoundPayload {
    roomId: string;
    mode: Exclude<GameMode, 'vs-ai'>;
    playerId: string;
    team: TeamId;
    players: MatchedPlayer[];
}

interface MatchmakingScreenProps {
    mode: Exclude<GameMode, 'vs-ai'>;
    nickname: string;
    onBack: () => void;
    onMatched: (payload: MatchFoundPayload) => void;
}

interface RoomMember {
    id: string;
    name: string;
}

interface RoomStatePayload {
    roomCode: string;
    mode: Exclude<GameMode, 'vs-ai'>;
    hostId: string;
    members: RoomMember[];
    requiredPlayers: number;
}

type MatchView = 'select' | 'queue' | 'room';

const MODE_LABEL: Record<Exclude<GameMode, 'vs-ai'>, string> = {
    'pvp-1v1': 'PVP 1v1',
    'pvp-2v2': 'PVP 2v2',
    'pvp-3v3': 'PVP 3v3',
};

export function MatchmakingScreen({ mode, nickname, onBack, onMatched }: MatchmakingScreenProps) {
    const [view, setView] = useState<MatchView>('select');
    const viewRef = useRef<MatchView>(view);
    const [queueCount, setQueueCount] = useState(0);
    const [status, setStatus] = useState('Chon che do de bat dau.');
    const [connectionStatus, setConnectionStatus] = useState('Dang ket noi server...');
    const [roomCodeInput, setRoomCodeInput] = useState('');
    const [roomState, setRoomState] = useState<RoomStatePayload | null>(null);
    const [selfId, setSelfId] = useState('');
    const [serverUrl] = useState(getResolvedMatchServerUrl());
    const isLocalServer = useMemo(() => /localhost|127\.0\.0\.1/.test(serverUrl), [serverUrl]);

    const modeLabel = useMemo(() => MODE_LABEL[mode], [mode]);

    // Keep viewRef in sync so cleanup closures always read the latest value
    useEffect(() => { viewRef.current = view; }, [view]);

    useEffect(() => {
        const socket = getMatchSocket();

        const handleConnect = () => {
            setSelfId(socket.id ?? '');
            setConnectionStatus('Da ket noi matchmaking server');
            if (viewRef.current === 'queue') {
                setStatus('Dang tim tran...');
                socket.emit('join_queue', { mode, nickname });
            }
        };

        const handleDisconnect = () => {
            setConnectionStatus('Mat ket noi, dang thu lai...');
        };

        const handleConnectError = (err: Error) => {
            setConnectionStatus(`Khong ket noi duoc server: ${err.message}`);
        };

        const handleQueueUpdate = (payload: { mode: string; count: number }) => {
            if (payload.mode !== mode) return;
            setQueueCount(payload.count);
        };

        const handleMatchFound = (payload: MatchFoundPayload) => {
            setStatus('Da tim thay tran, dang vao phong...');
            onMatched(payload);
        };

        const handleRoomCreated = (payload: RoomStatePayload) => {
            setView('room');
            setRoomState(payload);
            setStatus('Da tao phong. Cho ban vao...');
        };

        const handleRoomUpdate = (payload: RoomStatePayload) => {
            setRoomState(payload);
        };

        const handleRoomError = (payload: { message: string }) => {
            setStatus(payload.message || 'Loi phong. Vui long thu lai.');
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('queue_update', handleQueueUpdate);
        socket.on('match_found', handleMatchFound);
        socket.on('room_created', handleRoomCreated);
        socket.on('room_update', handleRoomUpdate);
        socket.on('room_error', handleRoomError);

        if (socket.connected) {
            handleConnect();
        }

        return () => {
            if (viewRef.current === 'queue') {
                socket.emit('leave_queue', { mode });
            } else if (viewRef.current === 'room') {
                socket.emit('leave_custom_room', {});
            }
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('queue_update', handleQueueUpdate);
            socket.off('match_found', handleMatchFound);
            socket.off('room_created', handleRoomCreated);
            socket.off('room_update', handleRoomUpdate);
            socket.off('room_error', handleRoomError);
        };
    }, [mode, nickname, onMatched]);

    useEffect(() => {
        const socket = getMatchSocket();
        if (!socket.connected) return;

        if (view === 'queue') {
            setStatus('Dang tim tran...');
            socket.emit('leave_custom_room', {});
            socket.emit('join_queue', { mode, nickname });
            return;
        }

        if (view === 'room') {
            socket.emit('leave_queue', { mode });
            setQueueCount(0);
            return;
        }

        socket.emit('leave_queue', { mode });
        socket.emit('leave_custom_room', {});
        setRoomState(null);
        setQueueCount(0);
        setStatus('Chon che do de bat dau.');
    }, [view, mode, nickname]);

    const handleCreateRoom = () => {
        const socket = getMatchSocket();
        setStatus('Dang tao phong...');
        socket.emit('create_custom_room', { mode, nickname });
    };

    const handleJoinRoom = () => {
        const code = roomCodeInput.trim().toUpperCase();
        if (!code) {
            setStatus('Nhap ma phong truoc khi tham gia.');
            return;
        }
        const socket = getMatchSocket();
        setStatus('Dang vao phong...');
        socket.emit('join_custom_room', { roomCode: code, mode, nickname });
    };

    const handleLeaveRoom = () => {
        const socket = getMatchSocket();
        socket.emit('leave_custom_room', {});
        setRoomState(null);
        setStatus('Da roi phong.');
    };

    const handleStartRoomMatch = () => {
        if (!roomState) return;
        const socket = getMatchSocket();
        socket.emit('start_custom_room', { roomCode: roomState.roomCode });
    };

    const handleChooseQueue = () => {
        setView('queue');
    };

    const handleChooseRoom = () => {
        setView('room');
        setStatus('Tao phong moi hoac nhap ma de vao phong.');
    };

    const handleBackToSelect = () => {
        setView('select');
    };

    const isHost = roomState?.hostId === selfId;
    const canStartRoom = Boolean(roomState && roomState.members.length >= roomState.requiredPlayers && isHost);

    return (
        <div className="matchmaking-root">
            <div className="matchmaking-card">
                <h2>{modeLabel}</h2>
                <p>{status}</p>
                <p className="meta">{connectionStatus}</p>
                <p className="meta">Match server: {serverUrl}</p>
                {connectionStatus.includes('Khong ket noi duoc server') && (
                    <p className="meta">
                        Goi y: chay `npm --prefix "./bitchemical" run match:server`, sau do mo 2 tab tren cung may de choi chung.
                    </p>
                )}
                {isLocalServer && (
                    <p className="meta">
                        Ban dang dung localhost. Ban co the mo 2 tab tren cung may de choi cung nhau ngay.
                    </p>
                )}

                <div className="match-choice-grid">
                    <button className={`match-choice-window ${view === 'queue' ? 'active' : ''}`} onClick={handleChooseQueue}>
                        <span className="choice-icon">⚡</span>
                        <span className="choice-title">Ghep Tran</span>
                        <span className="choice-desc">Vao hang doi va tim tran nhanh theo mode da chon.</span>
                    </button>
                    <button className={`match-choice-window ${view === 'room' ? 'active' : ''}`} onClick={handleChooseRoom}>
                        <span className="choice-icon">🏠</span>
                        <span className="choice-title">Tao Phong</span>
                        <span className="choice-desc">Tao phong rieng, chia se ma hoac vao phong ban be.</span>
                    </button>
                </div>

                {view === 'queue' && (
                    <div className="room-panel queue-panel">
                        <p className="meta">Nguoi choi trong hang doi: {queueCount}</p>
                        <p className="hint">Dang ghep tran cho {modeLabel}...</p>
                    </div>
                )}

                {view === 'room' && (
                    <div className="room-panel">
                        {!roomState && (
                            <>
                                <button className="action-btn" onClick={handleCreateRoom}>Tao phong</button>
                                <div className="join-row">
                                    <input
                                        className="room-input"
                                        value={roomCodeInput}
                                        onChange={(e) => setRoomCodeInput(e.target.value)}
                                        placeholder="Nhap ma phong (VD: A1B2C3)"
                                        maxLength={10}
                                    />
                                    <button className="action-btn secondary" onClick={handleJoinRoom}>Vao phong</button>
                                </div>
                            </>
                        )}

                        {roomState && (
                            <>
                                <p className="meta">Ma phong: <strong>{roomState.roomCode}</strong></p>
                                <p className="meta">Nguoi choi: {roomState.members.length}/{roomState.requiredPlayers}</p>
                                <ul className="member-list">
                                    {roomState.members.map((m) => (
                                        <li key={m.id}>{m.name}{m.id === roomState.hostId ? ' (chu phong)' : ''}</li>
                                    ))}
                                </ul>
                                <div className="room-actions">
                                    <button className="action-btn danger" onClick={handleLeaveRoom}>Roi phong</button>
                                    <button className="action-btn" disabled={!canStartRoom} onClick={handleStartRoomMatch}>Bat dau</button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <p className="hint">Nickname: {nickname}</p>
                {view !== 'select' && (
                    <button className="back-btn secondary" onClick={handleBackToSelect}>Quay lai lua chon</button>
                )}
                <button className="back-btn" onClick={onBack}>Quay lai</button>
            </div>
        </div>
    );
}
