const express = require('express');
const {createServer} = require('node:http');
const {Server} = require('socket.io');
require('dotenv').config();


const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 4000;
const cors = require('cors')

const authRoutes = require('./Routes/auth');
const auth_middleware = require('./middileware/auth_middleware');
const document = require('./Routes/documents');
const shareRoutes = require('./Routes/share');
const uploadRoutes = require('./Routes/upload')

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))

const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });


app.use(express.json())

app.use(authRoutes);
app.use(document);
app.use(shareRoutes);

app.use(uploadRoutes)



app.get('/health', (req,res) => {
    res.json({
        message: 'api is running'
    })
})

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id)
  
    socket.on('join-doc', ({ docId }) => {
      socket.join(docId)
      console.log(`socket ${socket.id} joined doc ${docId}`)
    })
  
    socket.on('doc-update', ({ docId, update }) => {
      console.log(`update received for doc ${docId}`)
      socket.to(docId).emit('doc-update', { update })
    })

    socket.on('chat-message', ({ docId, message }) => {
        console.log(`chat message received for doc ${docId}:`, message)
        io.to(docId).emit('chat-message', message)
      })
  
    socket.on('disconnect', () => {
      console.log('user disconnected:', socket.id)
    })
  })

server.listen(PORT, () => {
    console.log(`the app is running on port: ${PORT}`);
})

module.exports =  app;