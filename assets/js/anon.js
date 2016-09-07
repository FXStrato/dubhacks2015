var client = (function() {
	var self = {};

	var user = "";
	var socket = io();

	self.sendMesssage = function() {
		sendMesssage();
	}

	var sendMesssage = function(){
	  socket.emit('im', $('#m').val());
	  $('#m').val('');
	});

	socket.on('im', function(user, msg){
		page.incommingMessage(user, msg)
	  $('#messages').append($('<li>').text(user + ": " + msg));

	});

	//Need to make a function that on socket.on, it will create a new room with a new url
	//for whoever is hosting it when they click on host.

	var setUserName = function(user) {
		socket.emit('adduser', user);
		console.log('Username ' + user + ' successfully saved.');
	}

	self.hostRoom = function() {
		hostRoom();
	}

	var hostRoom = function(){
		socket.emit('hostroom', $('#roomname').val());
		$('#roomname').val('');
	});

	self.joinRoom = function(room) {
		joinRoom(room);
	}

	var joinRoom = function(room){
		socket.emit('joinroom', room);
		$('#joinname').val('');
	});

	socket.on('roommade', function(data){
		if(data != '') {
			$('#rmname').text(data);
			$('#imsender').css("display", "block");
		} else {
			alert('Unable to create room. Room name is probably taken.');
		}
	});

	return self;
}());




//1:53 AM So far, got stuff added into anon.js, index.js, and index.html. Changed something in main.css too. that first gets the name of the user, then it will display a host input; put in the input,
// and click on host. It should then console pop up with the message that it changed to a new namespace. 
//It will only throw an error if the room name already exists. 