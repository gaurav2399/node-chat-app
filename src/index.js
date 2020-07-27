const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const app = express()
const server = http.createServer(app)
const io = socketio(server)
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

let message = "Welcome!"
io.on('connection', (socket) => {
    console.log('New connection to server!')

    socket.on('join',({ username, room },callback) => {

        const { error, user } = addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }

        socket.join(user.room)
        socket.emit("message",generateMessage('Admin',message))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined.`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUserInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(message1,callback) => {

        const user = getUser(socket.id)
        io.to(user.room).emit('message',generateMessage(user.username, message1))
        const filter = new Filter()
        if(filter.isProfane(message1)){
            return callback('profanity is not allowed!')
        }
        callback()
    })

    socket.on('location',(location,callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })

    socket.on('disconnect',() => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left.`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUserInRoom(user.room)
            })
        }
    })
})

server.listen(port,() => {
    console.log('server is running on ' + port + ' port')
})