import express from 'express';
import cors from 'cors';
import usersRoute from './routes/users.js';
import tasksRoute from './routes/tasks.js';
import authenticate from './middlewares/auth.js';
import rateLimit from './middlewares/rateLimit.js';
import { createServer } from 'http'; //websocket
import { initWebSocketServer } from './utils/webSocketServer.js';//websocket

const app = express();

app.use(express.json());
app.use(cors());
app.use(authenticate);
app.use(rateLimit);

app.use('/users', usersRoute);
app.use('/tasks', tasksRoute);

const server = createServer(app);//websocket
initWebSocketServer(server);//websocket

server.listen(3000, () => {//change the server to app
  console.log('Server running on port 3000');
});
