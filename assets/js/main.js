
$(document).ready(function() {
	$('#chat_view').hide();
	$('#start').click(function() {
		page.pickChatRoom();
	});
	client.setup();
});


jQuery.fn.scrollTo = function(elem, speed) {
    $(this).animate({
        scrollTop:  $(this).scrollTop() - $(this).offset().top + $(elem).offset().top
    }, speed == undefined ? 1000 : speed);
    return this;
};

var page = (function() {
	var self = {};

	self.pickChatRoom = function() {
		pickChatRoom();
	}

	var pickChatRoom = function() {
		client.promptUserName(function() {
			bootbox.dialog({
				closeButton: false,
				onEscape: true,
        title: "Host or Join?",
        message: '<div class="row">' +
        '	<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
        '		<button type="button" class="btn btn-primary full-width" onClick="page.hostRoom()">Host</button>' +
        '	</div>' +
        '</div>' +
        '<hr>' +
        '<div class="row">' +
        '	<div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">' +
        '		<div id="joinform" class="form-inline" role="join">' +
        '			<div class="input-group full-width">' +
        '				<input type="text" class="form-control" placeholder="Room" id="room">' +
        '				<span class="addon-btn input-group-btn">' +
   		 	'					<button id="join" class="btn btn-primary" type="button" onClick="page.joinRoom()">Join</button>' +
        '				</span>' +
        '			</div>' +
        '		</div>' +
        '	</div>' +
        '</div>' +
        '<script>$("#room").keyup(function(event){if(event.keyCode == 13){$("#join").click();}});</script>'
	    });
		});
	}

	self.hostRoom = function() {
		hostRoom();
	}

	var hostRoom = function() {
		client.hostRoom();
		bootbox.hideAll();
	}

	self.joinRoom = function() {
		joinRoom($('#room').val());
	}

	var joinRoom = function(room) {
		if (room != '') {
			client.joinRoom(room);
		} else{
			$('#joinform').addClass('has-error');
			$('#room').click(function(){
				$('#joinform').removeClass('has-error');
			});
		};
	}

	self.room = function(roomName) {
		room(roomName);
	}

	var room = function(roomName) {
		console.log('room: ' + roomName);
		$('#room-name').html(roomName);
		bootbox.hideAll();
		goToChat();
	}

	var goToChat = function() {
		$('#welcome').fadeOut(250, function () {
			$('#chat_view').fadeIn(250, function () {
				$("#m").focus();
	    	});
    	});
	}

	self.incomingMessage = function(user, msg) {
		incomingMessage(user, msg);
	}

	var incomingMessage = function(user, msg) {
		var decrypted;
		if(user != 'SERVER') {
			decrypted = CryptoJS.Rabbit.decrypt(msg, user);
		} else {
			decrypted = msg;
		}
		//Find a way to include a way to ensure that the user is the secret key.
		var colored;
		if(user == 'SERVER') {
			colored = '<font color="#005CE6">';
		} else {
			colored = '<font color="black">';
		}
		$('#chatBox').append('<div class="bubble me">' +
	    user + ': ' + decrypted.toString(CryptoJS.enc.Utf8) +
	    '</div>');
	}

	self.sendMesssage = function(msg) {
		sendMesssage(msg);
	}

	var sendMesssage = function(msg) {
		$('#chatBox').append('<div class="bubble you">' +
		msg +
	    '</div>');
		$('#chat').scrollTop($('#chat')[0].scrollHeight);
	}

	self.alert = function(data) {
		alert(data, null);
	}
	self.alert = function(data, callback) {
		alert(data);
	}

	var alert = function(data,callback) {
		bootbox.alert(data, callback);
	}

	return self;
}());

var client = (function() {
	var inRoom = false;
	var self = {};

	var user = '';
	var id = '';
	var socket = io();

	self.setup = function() {
		setup();
	}

	var setup = function(){
		$('#chatBox').html('');
	  socket.on('im', function(user, msg){
			page.incomingMessage(user, msg);
		});
		socket.on('roommade', function(data){
			if(data != '') {
					page.room(data);
			} else {
				if(inRoom) {
					page.alert('Room does not exist. Please try another ID.');
				}

			}
		});
		$('#exit').click(function() {
			$('#chat_view').fadeOut(250, function () {
				$('#welcome').fadeIn(250, function () {
		    	});
	    	});
		});
		$('#send').click(client.sendMesssage);
		$("#m").keyup(function(event){
    	if(event.keyCode == 13){
    	window.scrollTo(0,document.getElementById("chatBox").scrollHeight);
        $("#send").click();
   	    }
		});
		$("#start").focus();
	}

	self.promptUserName = function(callback) {
		promptUserName(callback);
	}

	var promptUserName = function(callback) {
		bootbox.prompt("Pick a Username",
			function(result){
				if (result == null) {
					page.exit();
				} else if (result == '') {

				} else {
					if (setUserName(result)) {
						callback();
					} else{
						promptUserName();
					};
				};
			}
		);
	}

	self.sendMesssage = function() {
		sendMesssage();
	}

	//Message sent here. We can use user, and send that in as part of the cryptographic function.
	//Server side will take care of socket.id, it will know who is sending it by providing the user.
	//And because user is already saved here, it will use the one who sent it, thus verifying it.
	var sendMesssage = function(){
		if($('#m').val() != '' && user != '') {
			var s = $('#m').val();
			var encrypt = CryptoJS.Rabbit.encrypt(s.toString(CryptoJS.enc.Base64), user);
			socket.emit('im', encrypt);
			page.sendMesssage($('#m').val());
			$('#m').val('');
		}

	}



	//Need to make a function that on socket.on, it will create a new room with a new url
	//for whoever is hosting it when they click on host.

	var setUserName = function(userName) {
		user = userName.trim();
		socket.emit('adduser', user);
		return true;
	}
	self.userName = function() {
		return userName();
	}
	var userName = function() {
		return user;
	}

	self.hostRoom = function() {
		hostRoom();
	}

	var hostRoom = function(){
		socket.emit('hostroom');
	}

	self.joinRoom = function(room) {
		joinRoom(room);
	}

	var joinRoom = function(room){
		socket.emit('joinroom', room);
		$('#joinname').val('');
		inRoom = true;
	}

	return self;
}());
