/*
  6/16/2017, glenn
   Modified example for Samsung Android Native Bluejeans via WebRTC
*/
define([
	"jquery",
	"underscore",

    "WebRTC_SDK/RTCManager",

    // Sample App src files
    "scripts/defaultRTCParams",
    "scripts/bjn-global",
    "scripts/webrtcclientsdk"

], function($, _, RTCManager, defaultRTCParams, BJN, RTCClient ) {

    console.log("(androidExample.js): BJN WebRTC Example");
	
	$("#joinMeeting, #leaveMeeting").click(function(){
		$(this).addClass("hidden");
		$(this).siblings().removeClass("hidden");
	});
	$("#toggleVideoMute, #toggleAudioMute").click(function(){
		$(this).toggleClass("muted");
	});

    // Initiate BJN SDK, refer defaultRTCParams.js 
    // Add timeout values
    BJN.RTCManager = new RTCManager({
                webrtcParams: defaultRTCParams,
                bjnCloudTimeout : 5000,
                bjnSIPTimeout : 3000,
                bjnWebRTCReconnectTimeout : 90000});
				
	
	// Get list of A/V on this PC
	BJN.RTCManager.getLocalDevices().then(function(devices) {
		BJN.localDevices = devices.available;
		var avail = devices.available
		console.log("Got local devices, available:" + JSON.stringify(avail).substr(0,35)+"...");
		
        // Add audio in devices to the selection list
        avail.audioIn.forEach( function(device) {
			console.log("audioIn device: " + device.label);
            $('#audioIn').append('<option>' + device.label +'</option>');
        });
        avail.audioOut.forEach(function(device) {
            $('#audioOut').append('<option>' + device.label +'</option>');
        });
        avail.videoIn.forEach(function(device) {
            $('#videoIn').append('<option>' + device.label +'</option>');
        });
		
		/*
		   options : {
			   localVideoEl  : <DOM element for local video>,
			   remoteVideoEl : <DOM element for remote video>
			   bandWidth     : <100..4096Kbps netwk b/w>
			   devices       : { object - full list of Audio/Video devices
			   evtVideoUnmute  : <function handler>
			   evtRemoteConnectionStateChange : <function handler>
			   evtLocalConnectionStateChange : <function handler>
			   evtOnError : <function handler>
			   
			}
		*/
		RTCClient.initialize({
			localVideoEl: $("#localVideo")[0],
			remoteVideoEl : $("#remoteVideo")[0],
			bandWidth : $("#videoBw").prop('value'),
			devices   : BJN.localDevices,
			evtVideoUnmute : unmuteVideo,
			evtRemoteConnectionStateChange : null,
			evtLocalConnectionStateChange : null,
			evtOnError : null
		});
		
		// Save for external access
		BJN.RTCClient = RTCClient;
	}, function(error) {
		console.log("Local device error " + error);
		reject(error);
	});
	
	
	//------------------------------------------------------------------
	// JQuery event handler intercepts
	//   The intercepts handle the DOM events from GUI controls, then
	// invoke the corresponding explosed javascript handler.
	//
	
	// Device and Connection UI Handlers
	$("#audioIn").change( function() {
		var who = $("#audioIn").prop('selectedIndex');
		changeAudioIn(who);
	});
	$("#audioOut").change( function() {
		var who = $("#audioOut").prop('selectedIndex');
		changeAudioOut(who);
	});
	$("#videoIn").change( function() {
		var who = $("#videoIn").prop('selectedIndex');
		changeVideoIn(who);
	});
	$("#videoBw").change( function() {
		var bw = $("#videoBw").prop('value');
		setVideoBandwidth(bw);
	});
	
	// Mute UI handlers
	$("#toggleAudioMute").click( function() {
		var updatedText = toggleAudioMute() ? "Unmute Audio" : "Mute Audio";
		$("#toggleAudioMute").html(updatedText);		
	});
    $("#toggleVideoMute").click( function() {
		var muted = toggleVideoMute();
		if(muted){
			setMuteButton(muted);
		}
	});
	
	function setMuteButton(muted){
		var updatedText = muted ? "Show Video" : "Mute Video";
		$("#toggleVideoMute").html(updatedText);	
	};

	function unmuteVideo() {
		setMuteButton(false);
	};


	// Meeting UI handlers
    $("#joinMeeting").click( function() {
		var meetingParams = {
            numericMeetingId   : $('#id').val(),
            attendeePasscode    : $('#passCode').val(),
            displayName : $('#yourName').val()
        };
		joinMeeting(meetingParams);
    });
    $("#leaveMeeting").click( leaveMeeting );
	
	//
	//------------------------------------------------------------------
});


//------------------------------------------------------------------
// discrete Javascript handlers providing exposure to
//		- map UI actions to BlueJeans commands
//		- access GUI/RTC related variables
//	

/* listLocalDevices() 
	returns the JSON object containing the system information for the requested devices.
		name is one of "audioIn", "audioOut", or "videoIn"
*/
listLocalDevices = function(name){
	var retVal = {};
	console.log("Listing local devices: " + name);
	switch(name){
		case "audioIn" :
		   retVal = jQuery.extend(true, {}, BJN.localDevices.audioIn);
		break;
		case "audioOut" :
		   retVal = jQuery.extend(true, {}, BJN.localDevices.audioOut);
		break;
		case "videoIn" :
		   retVal = jQuery.extend(true, {}, BJN.localDevices.videoIn);
		break;
		default:
		   retVal = {};
		break;
	};
	return retVal;
};

/* changeAudioIn(index), changeAudioOut(index), changeVideoIn(index)
	these changeXXXXIn/Out() functions take an integer index value
	that corresponds to the device systems' localDevices collection.

	The exhaustive list of XXXXXIn/Out devices can be retrieved from
	the listLocalDevices() function call.   
*/
changeAudioIn = function(index){
	console.log("audio input change: " + index);
	BJN.RTCClient.changeAudioInput(index);
};

changeAudioOut = function(index) {
	console.log("audio output change: " + index );
	BJN.RTCClient.changeAudioOutput(index);
};

changeVideoIn = function(index) {
	console.log("video input change: " + index );
	BJN.RTCClient.changeVideoInput(index);
};

/* setVideoBandwidth()
 the bw parameter is an integer specifying the network bitrate for the
 video stream.  It should be in the range of 100..4096Kbps
*/	
setVideoBandwidth = function(bw) {
	console.log("Video BW is changed to: " + bw + "Kbits/sec");
	BJN.RTCClient.setVideoBandwidth(bw);
};


toggleAudioMute = function() {
	var muted = BJN.RTCClient.toggleAudioMute();
	console.log(muted ? "Audio is Muted now" : "Audio is Unmuted now");	
	return muted;
};


toggleVideoMute = function() {
	var muted = BJN.RTCClient.toggleVideoMute();
	console.log( muted ? "Video mute called" : "Video unmute called");
	return muted;
};



/* joinMeeting(mp)
	Join a BJN meeting as specified by the the JSON mp parameter with fields:
	  mp = {
			numericMeetingId   : <string> the BlueJeans meeting Identifier,
			attendeePasscode   : <string> <opt> the passcode for meeeting -or- moderator's code,
			displayName        : <string> the name you want shown on roster 
		   }
*/	
joinMeeting = function( mp ) {
	console.log( "Requesting to join meeting: " + mp.numericMeetingId );
	BJN.RTCClient.joinMeeting(mp);
};

leaveMeeting = function() {
	console.log( "Leaving current meeting");
	BJN.RTCClient.leaveMeeting();
};

