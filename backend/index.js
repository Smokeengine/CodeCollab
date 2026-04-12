const {io} = require('socket.io-client');
const socket = io('https://codecollab-xoj8.onrender.com');

socket.on('connect', () => {
    console.log('connected to the server, my id is: ' ,socket.id)
})

socket.on('disconnect', ()=> {
    console.log('user disconnected', socket.id)
})
