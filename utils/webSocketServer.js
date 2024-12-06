import { WebSocketServer } from 'ws';

const clients = new Map(); 

let wss; 

const initWebSocketServer = (server) => {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      try {
        const { username } = JSON.parse(message); 
        if (username) {
          clients.set(username, ws); 
          console.log(`User connected: ${username}`);
        }
      } catch (err) {
        console.error('Invalid WebSocket message format', err.message);
      }
    });

    ws.on('close', () => {
      [...clients.entries()].forEach(([key, value]) => {
        if (value === ws) clients.delete(key);
      });
      console.log('A client disconnected.');
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
    });
  });

  console.log('WebSocket server initialized.');
};

const notifyUser = (username, message) => {
  const ws = clients.get(username);
  if (ws) {
    ws.send(JSON.stringify(message));
  } else {
    console.log(`WebSocket connection not found for user: ${username}`);
  }
};

export { initWebSocketServer, notifyUser, clients };
