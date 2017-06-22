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

    console.log("(example.js): BJN WebRTC Example 101");
	
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
	}, function(error) {
		console.log("Local device error " + error);
		reject(error);
	});
	
	
	//------------------------------------------------------------------
	// JQuery event handler intercepts
	//
	
	// Device and Connection UI Handlers
	$("#audioIn").change( changeAudioIn );
	$("#audioOut").change(changeAudioOut );
	$("#videoIn").change( changeVideoIn );
	$("#videoBw").change( setVideoBandwidth );
	
	// Mute UI handlers
	$("#toggleAudioMute").click( toggleAudioMute );
    $("#toggleVideoMute").click( toggleVideoMute );
	// Meeting UI handlers
    $("#joinMeeting").click( function() {
		var meetingParams = {
            numericMeetingId   : $('#id').val(),
            attendeePasscode    : $('#passCode').val(),
            displayName : $('#yourName').val()
        };
		joinMeeting(mp);
    });
    $("#leaveMeeting").click( leaveMeeting );
	
	//
	//------------------------------------------------------------------


	//------------------------------------------------------------------
	// discrete Javascript handlers mapping UI actions to BlueJeans commands
	//	
	
	changeAudioIn = function(){
		var who = $("#audioIn").prop('selectedIndex');
		console.log("UI: audio input changed: " + who);
		RTCClient.changeAudioInput(who);
	};

	changeAudioOut = function() {
		var who = $("#audioOut").prop('selectedIndex');
		console.log("UI: audio output changed: " + who );
		RTCClient.changeAudioOutput(who);
	};
	
	changeVideoIn = function() {
		var who = $("#videoIn").prop('selectedIndex');
		console.log("UI: video input changed: " + who );
		RTCClient.changeVideoInput(who);
	};
	
	setVideoBandwidth = function() {
		var bw = $("#videoBw").prop('value');
		console.log("UI: Video BW is changed " + bw);
		RTCClient.setVideoBandwidth(bw);
	};
	
	
	toggleAudioMute = function() {
        var muted = RTCClient.toggleAudioMute();
		var updatedText = muted ? "Unmute Audio" : "Mute Audio";
		$("#toggleAudioMute").html(updatedText);
		console.log(muted ? "Audio is Muted now" : "Audio is Unmuted now");	
    };

	
	toggleVideoMute = function() {
        var muted = RTCClient.toggleVideoMute();
		if(muted)
			setMuteButton(muted);
	};
	
	function unmuteVideo() {
		setMuteButton(false);
	};
	
	function setMuteButton(muted){
		var updatedText = muted ? "Show Video" : "Mute Video";
		$("#toggleVideoMute").html(updatedText);	
    };
	
	////////////////// neal test //////////////////
	function nealTestFunction() {
		console.log("nealTestFunction() called");
	};
	
	
	window.nealTestFunction2 = function() {
		console.log("nealTestFunction 2222() called");
	};
	////////////////// neal test //////////////////
	
	
/*
   the mp parameter is a JSON object with these fields:
	{
			numericMeetingId   : <string> the BlueJeans meeting Identifier,
            attendeePasscode   : <string> <opt> the passcode for meeeting -or- moderator's code,
            displayName        : <string> the name you want shown on roster 
	}
*/	
	joinMeeting = function( mp ) {
        RTCClient.joinMeeting(mp);
	};
	
	leaveMeeting = function() {
        RTCClient.leaveMeeting();
	};

});
