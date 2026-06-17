import WebSocket from 'ws';
import fs from 'fs';

const tools = JSON.parse(fs.readFileSync('src/lib/gemini-voice-tools.json', 'utf8'));
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('Set GEMINI_API_KEY before running this script.');
}
const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;

const ws = new WebSocket(url);

ws.on('open', () => {
    console.log('Connected');
    const msg = {
        setup: {
            model: 'models/gemini-3.1-flash-live-preview',
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {
                        voiceName: "Kore"
                    }
                }
            },
            tools: [{
                functionDeclarations: tools
            }]
        }
    };
    ws.send(JSON.stringify(msg));

    // empty audio chunk
    ws.send(JSON.stringify({
        realtimeInput: { audio: { mimeType: "audio/pcm;rate=16000", data: "" } }
    }));
});

ws.on('message', (data) => {
    console.log('Message:', data.toString());
    process.exit(0);
});

ws.on('error', (err) => {
    console.log('Error:', err);
    process.exit(1);
});

ws.on('close', (code, reason) => {
    console.log('Closed:', code, reason.toString());
    process.exit(1);
});
