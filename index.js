var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('node-uuid');
var crypto = require("crypto-js");
var users = {};
var rooms = {};
var cRoom;


app.use(express.static(__dirname + '/'));
app.use(express.static(__dirname + '/assets'));
app.use(express.static(__dirname + '/node_modules'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

	socket.on('im', function(msg){
	    // we tell the client to execute 'im' with 2 parameters
	    // sending to all clients in 'game' room(channel) except sender
 		socket.broadcast.to(socket.room).emit('im', socket.username, msg);
		//io.sockets.in(socket.room).emit('im', socket.username, msg);
	  });

	//Logic for creating a room
  socket.on('hostroom', function() {
  	var temp = uuid.v4();
  	if(rooms[temp] == null) {
  		socket.room = temp;
  		cRoom = temp;
  		socket.join(temp);
  		rooms[temp] = temp;
  		//io.emit('roommade', temp);
  		io.sockets.in(socket.room).emit('roommade', temp);
  		io.sockets.in(socket.room).emit('im', 'SERVER', socket.username + ' has connected to ' + temp);
  	} else {
  		io.emit('roommade', '');
  	}
  });

  //Logic behind joining a preexisting room.
	socket.on('joinroom', function(room, user) {
		if(rooms[room] != null) {
			socket.room = room;
			socket.join(room);
			io.sockets.in(socket.room).emit('roommade', room);
			io.sockets.in(socket.room).emit('im', 'SERVER', socket.username + ' has connected to ' + room);
		} else {
			io.emit('roommade', '');
		}
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		users[username] = socket.id;
	});



	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		var clients = io.sockets.adapter.rooms[cRoom]; // all users from room
		if(clients == undefined || clients == null) {
			delete rooms[socket.room];
		}
		// remove the username from global usernames list
		delete users[socket.username];
		// echo globally that this client has left
		io.sockets.in(socket.room).emit('im', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});


});


http.listen(3000, function(){
  console.log('listening on *:3000');
});

/*
// echo to client they've connected
	socket.emit('updatechat', 'SERVER', 'you have connected to room1');
	// echo to room 1 that a person has connected to their room
	socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
*/
