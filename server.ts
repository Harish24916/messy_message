import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Type } from '@google/genai';
import { SAMPLE_CALLS } from './src/data/sampleCalls';
import { SalesCallAnalysis, RoomState, SharedRoomMessage, RoomParticipant } from './src/types';

// Lazy initialize GoogleGenAI client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const app = express();
const PORT = 3000;

// High payload limit for audio files (base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory Room State for real-time peer sharing
export interface ParticipantSession {
  ws?: WebSocket | null;
  participant: RoomParticipant;
  lastSeen?: number;
}

interface ActiveRoom {
  code: string;
  createdAt: number;
  participants: Map<string, ParticipantSession>;
  messages: SharedRoomMessage[];
  maxMembers?: number;
  activeAnalysis: SalesCallAnalysis | null;
}

const rooms = new Map<string, ActiveRoom>();

function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Avoid confusing chars 0, 1, I, O
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Ensure uniqueness
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

function broadcastToRoom(roomCode: string, payload: any) {
  const room = rooms.get(roomCode);
  if (!room) return;
  const messageStr = JSON.stringify(payload);
  room.participants.forEach(({ ws }) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(messageStr);
      } catch (e) {
        console.warn('WS broadcast send failed:', e);
      }
    }
  });
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    activeRooms: rooms.size,
  });
});

// Get default sample calls
app.get('/api/sample-calls', (req, res) => {
  res.json({ calls: SAMPLE_CALLS });
});

// Transcribe audio endpoint using gemini-3.5-transcribe
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 in request body' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback transcription if no API key is set
      return res.json({
        text: "Hi there, thank you for joining the product demo today. I'd love to understand your current challenges with software latency and evaluate if our automated platform can help your team.",
        note: 'Fallback transcript generated (configure GEMINI_API_KEY in Secrets for live transcription)',
      });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType.split(';')[0], // Clean mime type
        data: audioBase64,
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [
          audioPart,
          {
            text: 'Transcribe this sales audio completely and accurately. Identify speaker turns between the Sales Rep and the Prospect.',
          },
        ],
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error?.message || String(error),
    });
  }
});

// Main AI analysis endpoint for sales call audio & coaching intelligence
app.post('/api/analyze-call', async (req, res) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/mp3',
      fileName = 'Sales_Call.mp3',
      transcriptText,
      callTitle = 'Recorded Sales Discussion',
    } = req.body;

    const ai = getGeminiClient();

    // If no API key, return an enriched intelligent analysis based on sample template
    if (!ai) {
      const fallbackCall: SalesCallAnalysis = {
        ...SAMPLE_CALLS[0],
        id: `call-${Date.now()}`,
        title: callTitle || fileName.replace(/\.[^/.]+$/, ''),
        callDate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      return res.json({
        analysis: fallbackCall,
        simulated: true,
        notice: 'Using standard sales intelligence profile. Set GEMINI_API_KEY in Settings > Secrets for customized dynamic analysis.',
      });
    }

    const promptText = `
You are an elite Sales Performance and Coaching Intelligence AI.
Analyze the provided sales call audio or transcript.

Output a structured JSON response matching the following requirements strictly:
1. Diarized Transcript: Break the conversation into chronological turns between "Speaker A" (Salesperson/Account Exec) and "Speaker B" (Prospect/Customer). For each turn include:
   - timestamp (e.g. "00:15")
   - timeInSeconds
   - speaker: "Speaker A" or "Speaker B"
   - speakerLabel (e.g. "Jordan (Sales Rep)" or "Client (Prospect)")
   - role: "rep" or "prospect"
   - text
   - sentiment: "positive" | "neutral" | "negative"
   - engagementScore: 0 to 100
   - intentTag: "Rapport" | "Discovery" | "Pain Point" | "Objection" | "Value Prop" | "Pricing" | "Closing" | "Question"

2. Sentiment & Engagement Graph Data:
   - Array of timeline points (timeLabel, timeInSeconds, repEngagement (0-100), prospectEngagement (0-100), overallSentiment (-100 to 100), speaker, event, transcriptSnippet)
   - Must capture the emotional trajectory of the call (e.g., introductions, pain point revelation, objections, value delivery, commitment).

3. AI-Generated Coaching Card:
   - overallScore: number (0-100)
   - talkListenRatio: repPercent, prospectPercent, status ("Optimal" | "Rep Talking Too Much" | "Prospect Silent")
   - pacingWpm: repWpm, prospectWpm
   - objectionHandlingScore: number (0-100)
   - discoveryQualityScore: number (0-100)
   - summary: concise executive summary of the rep's performance
   - thingsDoneWell: EXACTLY 3 items representing the 3 things the salesperson did well. Each item MUST have:
     - id, title, category, quote (exact words from call), timestamp, timeInSeconds, analysis
   - missedOpportunities: EXACTLY 3 items representing 3 missed opportunities. Each item MUST have:
     - id, title, category, quote (evidence from call), timestamp, timeInSeconds, analysis, actionableTip (specific advice or better phrasing)
   - recommendedActionItems: array of 3 concrete next steps for the rep before following up.

Make the insights highly specific, grounded in realistic sales psychology (discovery depth, economic pain qualification, objection handling, closing momentum).
`;

    let contentsPayload: any;

    if (audioBase64) {
      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: mimeType.split(';')[0],
              data: audioBase64,
            },
          },
          { text: promptText },
        ],
      };
    } else if (transcriptText) {
      contentsPayload = `${promptText}\n\nCall Transcript / Notes:\n${transcriptText}`;
    } else {
      return res.status(400).json({ error: 'Provide audioBase64 or transcriptText' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contentsPayload,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    const fullAnalysis: SalesCallAnalysis = {
      id: `call-${Date.now()}`,
      title: callTitle || fileName.replace(/\.[^/.]+$/, ''),
      prospectCompany: parsedData.prospectCompany || 'Target Prospect Account',
      dealSize: parsedData.dealSize || 'Qualified Enterprise Lead',
      callDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      durationSeconds: parsedData.durationSeconds || (parsedData.transcript?.length ? parsedData.transcript[parsedData.transcript.length - 1].timeInSeconds + 15 : 300),
      transcript: parsedData.transcript || [],
      sentimentTimeline: parsedData.sentimentTimeline || [],
      coachingCard: parsedData.coachingCard || {
        overallScore: 85,
        talkListenRatio: { repPercent: 48, prospectPercent: 52, status: 'Optimal' },
        pacingWpm: { repWpm: 140, prospectWpm: 135 },
        objectionHandlingScore: 88,
        discoveryQualityScore: 90,
        summary: 'Solid sales execution with good discovery engagement and active listening.',
        thingsDoneWell: [],
        missedOpportunities: [],
        recommendedActionItems: [],
      },
    };

    res.json({ analysis: fullAnalysis });
  } catch (error: any) {
    console.error('Call analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze call',
      message: error?.message || String(error),
      fallback: SAMPLE_CALLS[0],
    });
  }
});

// Room Creation API
app.post('/api/room/create', (req, res) => {
  const { creatorName = 'Host', maxMembers: requestedMax } = req.body;
  const parsedMax = parseInt(requestedMax, 10);
  const maxMembers =
    !isNaN(parsedMax) && parsedMax >= 2 && parsedMax <= 100 ? parsedMax : DEFAULT_MAX_ROOM_MEMBERS;
  const roomCode = generateRoomCode();
  const newRoom: ActiveRoom = {
    code: roomCode,
    createdAt: Date.now(),
    participants: new Map(),
    maxMembers,
    messages: [
      {
        id: `sys-${Date.now()}`,
        senderName: 'System',
        senderId: 'system',
        deviceType: 'desktop',
        type: 'text',
        content: `Room ${roomCode} created by ${creatorName} (Capacity: ${maxMembers} members). Share this code or URL with others to join!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
    activeAnalysis: SAMPLE_CALLS[0],
  };

  rooms.set(roomCode, newRoom);
  res.json({ roomCode, room: getPublicRoomState(newRoom) });
});

// Room Info API
app.get('/api/room/:code', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found or expired' });
  }
  res.json({ room: getPublicRoomState(room) });
});

// In-memory file storage
interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
  uploadedAt: number;
}
const storedFiles = new Map<string, StoredFile>();

// High-speed binary file upload endpoint (prevents FileReader memory/ProgressEvent errors)
app.post('/api/room/:code/upload-raw', express.raw({ type: '*/*', limit: '100mb' }), (req, res) => {
  try {
    const roomCode = req.params.code.toUpperCase();
    let room = rooms.get(roomCode);
    if (!room) {
      room = {
        code: roomCode,
        createdAt: Date.now(),
        participants: new Map(),
        messages: [],
        activeAnalysis: SAMPLE_CALLS[0],
      };
      rooms.set(roomCode, room);
    }

    const rawFileName = req.headers['x-file-name'] as string;
    const fileName = rawFileName ? decodeURIComponent(rawFileName) : 'document';
    const rawSender = req.headers['x-sender-name'] as string;
    const senderName = rawSender ? decodeURIComponent(rawSender) : 'Member';
    const deviceType = (req.headers['x-device-type'] as any) || 'desktop';
    const fileType = (req.headers['content-type'] as string) || 'application/octet-stream';
    const fileBuffer = req.body as Buffer;

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Empty file uploaded' });
    }

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    storedFiles.set(fileId, {
      id: fileId,
      name: fileName,
      type: fileType,
      size: fileBuffer.length,
      buffer: fileBuffer,
      uploadedAt: Date.now(),
    });

    const downloadUrl = `/api/file/${fileId}`;

    // If small (< 1MB), also generate dataUrl for instant client rendering
    let fileData: string = downloadUrl;
    if (fileBuffer.length <= 1024 * 1024) {
      fileData = `data:${fileType};base64,${fileBuffer.toString('base64')}`;
    }

    const rawShareType = req.headers['x-share-type'] as string;
    let shareType: any = rawShareType || 'document';
    if (!rawShareType) {
      if (fileType.startsWith('image/')) shareType = 'image';
      else if (fileType.startsWith('video/')) shareType = 'video';
    }

    const newMsg: SharedRoomMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      senderName,
      senderId: 'user',
      deviceType,
      type: shareType,
      content: `${shareType.charAt(0).toUpperCase() + shareType.slice(1)}: ${fileName}`,
      fileName,
      fileSize: fileBuffer.length,
      fileData,
      fileType,
      url: downloadUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    room.messages.push(newMsg);
    if (room.messages.length > 100) {
      room.messages.shift();
    }

    broadcastToRoom(roomCode, {
      type: 'message_received',
      message: newMsg,
    });

    res.json({ success: true, message: newMsg, downloadUrl });
  } catch (err: any) {
    console.error('File upload error on server:', err);
    res.status(500).json({ error: 'Failed to process file upload', details: err?.message });
  }
});

// File Download API
app.get('/api/file/:fileId', (req, res) => {
  const file = storedFiles.get(req.params.fileId);
  if (!file) {
    return res.status(404).send('File not found or expired');
  }

  res.setHeader('Content-Type', file.type || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(file.name)}"; filename*=UTF-8''${encodeURIComponent(file.name)}`
  );
  res.setHeader('Content-Length', file.size);
  res.send(file.buffer);
});

const DEFAULT_MAX_ROOM_MEMBERS = 7;
const AVATAR_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
];

function getPublicRoomState(room: ActiveRoom): RoomState {
  const participantsList: RoomParticipant[] = Array.from(room.participants.values()).map(
    (p) => p.participant
  );
  return {
    roomCode: room.code,
    participants: participantsList,
    messages: room.messages,
    maxMembers: room.maxMembers || DEFAULT_MAX_ROOM_MEMBERS,
    activeAnalysis: room.activeAnalysis,
  };
}

// -------------------------------------------------------------
// REST ROOM ENDPOINTS (Guarantees reliability even when WS is blocked/reconnecting)
// -------------------------------------------------------------

// Join room via REST
app.post('/api/room/:code/join', (req, res) => {
  try {
    const cleanCode = req.params.code.toUpperCase().trim();
    const { userName = 'Member', deviceType = 'desktop' } = req.body;
    let room = rooms.get(cleanCode);

    const roomCapacity = room ? (room.maxMembers || DEFAULT_MAX_ROOM_MEMBERS) : DEFAULT_MAX_ROOM_MEMBERS;
    if (room && room.participants.size >= roomCapacity) {
      return res.status(403).json({
        error: `This group is full! Maximum ${roomCapacity} members allowed.`,
        code: 'ROOM_FULL',
        maxMembers: roomCapacity,
      });
    }

    if (!room) {
      room = {
        code: cleanCode,
        createdAt: Date.now(),
        participants: new Map(),
        maxMembers: DEFAULT_MAX_ROOM_MEMBERS,
        messages: [],
        activeAnalysis: SAMPLE_CALLS[0],
      };
      rooms.set(cleanCode, room);
    }

    const participantId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const colorIndex = room.participants.size % AVATAR_COLORS.length;
    const avatarColor = AVATAR_COLORS[colorIndex];
    const isFirstMember = room.participants.size === 0;

    const newParticipant: RoomParticipant = {
      id: participantId,
      name: (userName || 'Member').trim(),
      deviceType,
      isAdmin: isFirstMember,
      avatarColor,
      joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    room.participants.set(participantId, {
      ws: null,
      participant: newParticipant,
      lastSeen: Date.now(),
    });

    broadcastToRoom(cleanCode, {
      type: 'user_joined',
      participant: newParticipant,
      room: getPublicRoomState(room),
    });

    res.json({
      success: true,
      participantId,
      participant: newParticipant,
      room: getPublicRoomState(room),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to join room' });
  }
});

// Sync room state via REST
app.get('/api/room/:code/sync', (req, res) => {
  const cleanCode = req.params.code.toUpperCase().trim();
  const room = rooms.get(cleanCode);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  const participantId = req.query.participantId as string;
  if (participantId && room.participants.has(participantId)) {
    const p = room.participants.get(participantId);
    if (p) p.lastSeen = Date.now();
  }
  res.json({ room: getPublicRoomState(room) });
});

// Post message or data via REST
app.post('/api/room/:code/message', (req, res) => {
  try {
    const cleanCode = req.params.code.toUpperCase().trim();
    let room = rooms.get(cleanCode);
    if (!room) {
      room = {
        code: cleanCode,
        createdAt: Date.now(),
        participants: new Map(),
        messages: [],
        activeAnalysis: SAMPLE_CALLS[0],
      };
      rooms.set(cleanCode, room);
    }

    const {
      senderName = 'Member',
      senderId = 'user',
      deviceType = 'desktop',
      shareType = 'text',
      content,
      url,
      fileName,
      fileSize,
      fileData,
      fileType,
      dataType,
      contactInfo,
      analysisPayload,
    } = req.body;

    const newMsg: SharedRoomMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      senderName,
      senderId,
      deviceType,
      type: shareType,
      content,
      url,
      fileName,
      fileSize,
      fileData,
      fileType,
      dataType,
      contactInfo,
      analysisPayload,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    if (shareType === 'call_analysis' && analysisPayload) {
      room.activeAnalysis = analysisPayload;
    }

    room.messages.push(newMsg);
    if (room.messages.length > 100) {
      room.messages.shift();
    }

    broadcastToRoom(cleanCode, {
      type: 'message_received',
      message: newMsg,
      activeAnalysis: room.activeAnalysis,
    });

    res.json({ success: true, message: newMsg, activeAnalysis: room.activeAnalysis });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to post message' });
  }
});

// Update username via REST
app.post('/api/room/:code/update-user', (req, res) => {
  const cleanCode = req.params.code.toUpperCase().trim();
  const room = rooms.get(cleanCode);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { participantId, newName } = req.body;
  if (!participantId || !newName) return res.status(400).json({ error: 'Missing parameters' });

  const pRecord = room.participants.get(participantId);
  if (pRecord) {
    const oldName = pRecord.participant.name;
    const updatedName = newName.trim();
    pRecord.participant.name = updatedName;

    const sysMsg: SharedRoomMessage = {
      id: `sys-${Date.now()}`,
      senderName: 'System',
      senderId: 'system',
      deviceType: 'desktop',
      type: 'text',
      content: `✏️ ${oldName} updated their name to "${updatedName}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    room.messages.push(sysMsg);

    broadcastToRoom(cleanCode, {
      type: 'user_updated',
      participant: pRecord.participant,
      room: getPublicRoomState(room),
      message: sysMsg,
    });
  }

  res.json({ success: true, room: getPublicRoomState(room) });
});

// Update room capacity (Host / Creator only)
app.post('/api/room/:code/update-capacity', (req, res) => {
  try {
    const cleanCode = req.params.code.toUpperCase().trim();
    const room = rooms.get(cleanCode);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { participantId, maxMembers } = req.body;
    if (!participantId) return res.status(400).json({ error: 'Missing participantId' });

    const pRecord = room.participants.get(participantId);
    if (!pRecord || !pRecord.participant.isAdmin) {
      return res.status(403).json({ error: 'Only the room creator/host can change the room capacity.' });
    }

    const newCapacity = parseInt(maxMembers, 10);
    if (isNaN(newCapacity) || newCapacity < 2 || newCapacity > 100) {
      return res.status(400).json({ error: 'Capacity must be between 2 and 100 members.' });
    }

    if (newCapacity < room.participants.size) {
      return res.status(400).json({
        error: `Cannot reduce capacity to ${newCapacity}. Group currently has ${room.participants.size} active members.`,
      });
    }

    const oldMax = room.maxMembers || DEFAULT_MAX_ROOM_MEMBERS;
    room.maxMembers = newCapacity;

    const sysMsg: SharedRoomMessage = {
      id: `sys-${Date.now()}`,
      senderName: 'System',
      senderId: 'system',
      deviceType: 'desktop',
      type: 'text',
      content: `👑 ${pRecord.participant.name} (Host) updated group capacity from ${oldMax} to ${newCapacity} members.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    room.messages.push(sysMsg);

    broadcastToRoom(cleanCode, {
      type: 'room_capacity_updated',
      maxMembers: newCapacity,
      room: getPublicRoomState(room),
      message: sysMsg,
    });

    res.json({ success: true, maxMembers: newCapacity, room: getPublicRoomState(room) });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update capacity' });
  }
});

// Leave room via REST
app.post('/api/room/:code/leave', (req, res) => {
  const cleanCode = req.params.code.toUpperCase().trim();
  const room = rooms.get(cleanCode);
  if (!room) return res.json({ success: true });

  const { participantId } = req.body;
  if (participantId && room.participants.has(participantId)) {
    room.participants.delete(participantId);
    broadcastToRoom(cleanCode, {
      type: 'user_left',
      participantId,
      room: getPublicRoomState(room),
    });
  }
  res.json({ success: true });
});

// -------------------------------------------------------------
// HTTP SERVER & WEBSOCKET SETUP
// -------------------------------------------------------------
async function startServer() {
  const server = http.createServer(app);

  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: 100 * 1024 * 1024, // 100MB payload limit
  });

  // Explicit HTTP upgrade handling prevents path mismatch or proxy issues
  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
      if (url.pathname.startsWith('/ws/room')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      }
    } catch (err) {
      console.warn('Upgrade handling error:', err);
    }
  });

  // Heartbeat interval (every 25 seconds) keeps WebSocket connections alive in Cloud Run
  const pingInterval = setInterval(() => {
    wss.clients.forEach((client: any) => {
      if (client.isAlive === false) {
        return client.terminate();
      }
      client.isAlive = false;
      try {
        client.ping();
      } catch {
        client.terminate();
      }
    });
  }, 25000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  wss.on('connection', (ws: any, req) => {
    let currentRoomCode: string | null = null;
    let participantId: string | null = null;

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (rawData: any) => {
      try {
        const data = JSON.parse(rawData.toString());

        // Heartbeat ping from client
        if (data.type === 'ping') {
          ws.isAlive = true;
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // Join room
        if (data.type === 'join_room') {
          const { roomCode, userName, deviceType = 'desktop', participantId: clientPartId } = data;
          const cleanCode = (roomCode || '').toUpperCase().trim();
          let room = rooms.get(cleanCode);

          // If participant already joined via REST earlier
          if (room && clientPartId && room.participants.has(clientPartId)) {
            currentRoomCode = cleanCode;
            participantId = clientPartId;
            const existing = room.participants.get(clientPartId)!;
            existing.ws = ws;
            existing.lastSeen = Date.now();
            ws.send(
              JSON.stringify({
                type: 'room_synced',
                room: getPublicRoomState(room),
                participantId,
              })
            );
            return;
          }

          // Check if room already has max members
          const effectiveMax = room ? (room.maxMembers || DEFAULT_MAX_ROOM_MEMBERS) : DEFAULT_MAX_ROOM_MEMBERS;
          if (room && room.participants.size >= effectiveMax) {
            ws.send(
              JSON.stringify({
                type: 'room_error',
                error: `This group is full! Maximum ${effectiveMax} members allowed.`,
                code: 'ROOM_FULL',
                maxMembers: effectiveMax,
              })
            );
            return;
          }

          // If room doesn't exist yet, auto-create it
          if (!room) {
            room = {
              code: cleanCode,
              createdAt: Date.now(),
              participants: new Map(),
              maxMembers: DEFAULT_MAX_ROOM_MEMBERS,
              messages: [],
              activeAnalysis: SAMPLE_CALLS[0],
            };
            rooms.set(cleanCode, room);
          }

          currentRoomCode = cleanCode;
          const assignedId: string = clientPartId || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          participantId = assignedId;

          // Assign distinct avatar color
          const colorIndex = room.participants.size % AVATAR_COLORS.length;
          const avatarColor = AVATAR_COLORS[colorIndex];
          const isFirstMember = room.participants.size === 0;

          const newParticipant: RoomParticipant = {
            id: assignedId,
            name: (userName || 'Member').trim(),
            deviceType,
            isAdmin: isFirstMember,
            avatarColor,
            joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          room.participants.set(assignedId, { ws, participant: newParticipant, lastSeen: Date.now() });

          // Send current state to newly connected client
          ws.send(
            JSON.stringify({
              type: 'room_synced',
              room: getPublicRoomState(room),
              participantId,
            })
          );

          // Broadcast user joined to everyone in the room
          broadcastToRoom(cleanCode, {
            type: 'user_joined',
            participant: newParticipant,
            room: getPublicRoomState(room),
          });
        }

        // Update username in room
        if (data.type === 'update_username') {
          if (!currentRoomCode || !participantId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const pRecord = room.participants.get(participantId);
          if (pRecord && data.newName) {
            const oldName = pRecord.participant.name;
            const updatedName = data.newName.trim();
            pRecord.participant.name = updatedName;

            const sysMsg: SharedRoomMessage = {
              id: `sys-${Date.now()}`,
              senderName: 'System',
              senderId: 'system',
              deviceType: 'desktop',
              type: 'text',
              content: `✏️ ${oldName} updated their name to "${updatedName}"`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            room.messages.push(sysMsg);

            broadcastToRoom(currentRoomCode, {
              type: 'user_updated',
              participant: pRecord.participant,
              room: getPublicRoomState(room),
              message: sysMsg,
            });
          }
        }

        // Update capacity in room (Host/Creator only)
        if (data.type === 'update_capacity') {
          if (!currentRoomCode || !participantId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const pRecord = room.participants.get(participantId);
          if (!pRecord || !pRecord.participant.isAdmin) {
            ws.send(
              JSON.stringify({
                type: 'room_error',
                error: 'Only the room creator/host can change room capacity.',
              })
            );
            return;
          }

          const newCapacity = parseInt(data.maxMembers, 10);
          if (isNaN(newCapacity) || newCapacity < 2 || newCapacity > 100) {
            ws.send(
              JSON.stringify({
                type: 'room_error',
                error: 'Capacity must be between 2 and 100 members.',
              })
            );
            return;
          }

          if (newCapacity < room.participants.size) {
            ws.send(
              JSON.stringify({
                type: 'room_error',
                error: `Cannot reduce capacity to ${newCapacity}. Group currently has ${room.participants.size} active members.`,
              })
            );
            return;
          }

          const oldMax = room.maxMembers || DEFAULT_MAX_ROOM_MEMBERS;
          room.maxMembers = newCapacity;

          const sysMsg: SharedRoomMessage = {
            id: `sys-${Date.now()}`,
            senderName: 'System',
            senderId: 'system',
            deviceType: 'desktop',
            type: 'text',
            content: `👑 ${pRecord.participant.name} (Host) updated group capacity from ${oldMax} to ${newCapacity} members.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          room.messages.push(sysMsg);

          broadcastToRoom(currentRoomCode, {
            type: 'room_capacity_updated',
            maxMembers: newCapacity,
            room: getPublicRoomState(room),
            message: sysMsg,
          });
        }

        // Send shared item (text, link, document, data, or contact_info)
        if (data.type === 'send_share') {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          const newMsg: SharedRoomMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            senderName: data.senderName || 'Anonymous',
            senderId: participantId || 'user',
            deviceType: data.deviceType || 'desktop',
            type: data.shareType || 'text',
            content: data.content,
            url: data.url,
            fileName: data.fileName,
            fileSize: data.fileSize,
            fileData: data.fileData,
            fileType: data.fileType,
            dataType: data.dataType,
            contactInfo: data.contactInfo,
            analysisPayload: data.analysisPayload,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          // If sharing a call analysis, update activeAnalysis for the room
          if (data.shareType === 'call_analysis' && data.analysisPayload) {
            room.activeAnalysis = data.analysisPayload;
          }

          room.messages.push(newMsg);
          // Keep maximum 100 messages in memory
          if (room.messages.length > 100) {
            room.messages.shift();
          }

          broadcastToRoom(currentRoomCode, {
            type: 'message_received',
            message: newMsg,
            activeAnalysis: room.activeAnalysis,
          });
        }

        // Sync active call analysis
        if (data.type === 'sync_analysis') {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;

          room.activeAnalysis = data.analysis;
          broadcastToRoom(currentRoomCode, {
            type: 'analysis_updated',
            activeAnalysis: room.activeAnalysis,
            updatedBy: data.senderName,
          });
        }
      } catch (err) {
        console.error('WS message handling error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomCode && participantId) {
        const room = rooms.get(currentRoomCode);
        if (room && room.participants.has(participantId)) {
          const pRecord = room.participants.get(participantId)!;
          pRecord.ws = null;
          pRecord.lastSeen = Date.now();

          // Grace period: allow 25s for HTTP fallback or automatic WS reconnection
          setTimeout(() => {
            const currentRoom = rooms.get(currentRoomCode!);
            if (currentRoom && currentRoom.participants.has(participantId!)) {
              const currentP = currentRoom.participants.get(participantId!)!;
              if (!currentP.ws && Date.now() - (currentP.lastSeen || 0) > 24000) {
                currentRoom.participants.delete(participantId!);
                broadcastToRoom(currentRoomCode!, {
                  type: 'user_left',
                  participantId,
                  room: getPublicRoomState(currentRoom),
                });
              }
            }
          }, 25000);
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sales Coaching Intelligence Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
