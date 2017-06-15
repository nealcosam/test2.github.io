
define(function (require) {

    var _       			= require('underscore');
    var Q 					= require('q');
    var $					= require('jquery');

    var defaultRTCParams 	= require("scripts/defaultRTCParams");
    var BJN 				= require("scripts/bjn-global");
	var oldVol;
    var timer;
    var config = {
        muteParams: {
            localAudio: false,
            localVideo: false
        }
	};

    var mediaConstraints=  {
        audio:{
            optional:[],
            mandatory:[]
        },
        video:{
            optional:[{ minWidth: 1280 }, { minHeight: 720 }],
            mandatory:[]
        }
    };

	var localVideoEl = null;
	var remoteVideoEl = null;
	
	// client callbacks
	var cbVideoMute = null;
    var cbRemoteConnectionStateChange = null;
    var cbLocalConnectionStateChange = null;
	var cbOnError = null;
	
	/*
	   options : {
		   localVideoEl  : <dom element for local video>,
		   remoteVideoEl : <dom element for remote video>,
		   bandWidth     : <100..4096Kbps netwk b/w>,
		   devices       : { A/V devices },
		   evtVideoUnmute  : callback(),
		   evtRemoteConnectionStateChange : callback(),
		   evtLocalConnectionStateChange : callback(),
		   evtOnError : callback()
	*/
    var initialize = function(options) {
		console.log("bjnrtcsdk initializing");
        localVideoEl = options.localVideoEl;
        remoteVideoEl = options.remoteVideoEl;

		cbVideoMute = options.evtVideoUnmute;
		cbRemoteConnectionStateChange = options.evtRemoteConnectionStateChange;
		cbLocalConnectionStateChange = options.evtLocalConnectionStateChange;
		cbOnError = options.evtOnError;

        RTCManager = BJN.RTCManager;
        BJN.RTCManager.setBandwidth(options.bandWidth);
		startLocalStream();
		
		// get hooks to RTCManager callbacks
		RTCManager.localVideoStreamChange		= updateSelfView;
		RTCManager.localAudioStreamChange		= updateAudioPath;
        RTCManager.remoteEndPointStateChange    = onRemoteConnectionStateChange;
        RTCManager.localEndPointStateChange     = onLocalConnectionStateChange;
        RTCManager.remoteStreamChange           = onRemoteStreamUpdated;
        RTCManager.error                        = onRTCError;

		};

	//Get the local A/V stream, this stream will be used to for the webrtc connection
	// stream is an array of stream
	// stream[0] - local audio stream
	// stream[1] - local video stream
    var startLocalStream = function() {
        RTCManager.getLocalMedia(mediaConstraints, 'local_stream').then(function(stream) {
            BJN.localAudioStream = stream[0];
            BJN.localVideoStream = stream[1];
			if(cbVideoMute) 
				cbVideoMute();
        }, function(err){
			console.log("getLocalMedia error:\n" + JSON.stringify(err,null,2));
		});
    };

	//Callback for local video stream change, it can be used to render self view when the stream is available
    var updateSelfView = function (localStream) {
        if(localStream) {
			RTCManager.renderSelfView({
                 stream: localStream,
                 el: localVideoEl
             });
			if(cbVideoMute) 
				cbVideoMute(false);
        } else
			console.log("updateSelfView no stream!!!");
    };
	
	// Callback when audio stream changes.  update GUI if stream is defined	
	var updateAudioPath = function (localStream) {
		if(localStream) {
			console.log("Audio Path Change");
		}
	};


	var changeAudioInput = function(who) {
		var dev = BJN.localDevices.audioIn[ who ].id;
		console.log("Audio Input is changed: " + dev ); 
		mediaConstraints.audio.optional.push( { sourceId: dev } );
		BJN.RTCManager.stopLocalStreams();
		startLocalStream();
	};

	var changeVideoInput = function(who) {
		var dev = BJN.localDevices.audioIn[ who ].id;
		console.log("Video Input is changed: " + dev );
		mediaConstraints.video.optional.push( { sourceId: dev } );
		BJN.RTCManager.stopLocalStreams();
		startLocalStream();
	};

	var changeAudioOutput = function(who) {
		var dev = BJN.localDevices.audioOut[ who ].id;
		console.log("Audio Output is changed: " + dev );
		mediaConstraints.audio.optional.push( { sourceId: dev } );
		//5/30/2017 - bugfix pass mediaElements value as an array rather than discrete object
		BJN.RTCManager.setSpeaker({ speakerId : dev, mediaElements : [remoteVideoEl] });
	};

	var setVideoBandwidth = function(bw){
		console.log("Video BW is changed: " + bw);
		BJN.RTCManager.setBandwidth(bw);
	};
	

        /* ========================= */
        /*      Mute Controls   	 */
        /* ========================= */

	var toggleAudioMute = function(event) {
		var audioMuted = config.muteParams.localAudio ? true : false;
		config.muteParams.localAudio = !audioMuted;
		RTCManager.muteStreams(config.muteParams);		
		return !audioMuted;
	};

	var toggleVideoMute = function(event) {
		var videoMuted = config.muteParams.localVideo ? true : false;
		config.muteParams.localVideo = !videoMuted;
		RTCManager.muteStreams(config.muteParams);
		return !videoMuted;
	};

	var setVolume = function(){
	}
	
	

    var joinMeeting = function(meetingParams) {
		if( (meetingParams.numericMeetingId != "") && (meetingParams.displayName != "")) {
			console.log("*** Joining meeting id: " + meetingParams.numericMeetingId);
			RTCManager.startMeeting(meetingParams);
		}
    };

    // End the meeting
    var leaveMeeting = function(event) {
        RTCManager.endMeeting();
		startLocalStream();
    };


    var onRemoteConnectionStateChange = function(state) {
        console.log('Remote Connection state :: ' + state);
		if(cbRemoteConnectionStateChange) cbRemoteConnectionStateChange(state);
    };

    var onLocalConnectionStateChange = function(state) {
       console.log('Local Connection state :: ' +  state);
	   if(cbLocalConnectionStateChange) cbLocalConnectionStateChange(state);
    };

    var onRemoteStreamUpdated = function(stream) {
        BJN.remoteStream = stream;
        if (stream) {
			console.log('Remote stream updated');
            RTCManager.renderStream({
                stream: BJN.remoteStream,
                el: remoteVideoEl
            });
        }
    };
	

    //Add code to handle error from BJN SDK
    var onRTCError = function(error) {
        console.log("Error has occured :: " + error);
        leaveMeeting();
		if(cbOnError) cbOnError(error);
		
    };
	
	return {
	initialize : initialize,
	toggleVideoMute : toggleVideoMute,
	toggleAudioMute : toggleAudioMute,
	changeAudioInput: changeAudioInput,
	changeAudioOutput: changeAudioOutput,
	changeVideoInput : changeVideoInput,
	setVideoBandwidth: setVideoBandwidth,
	joinMeeting : joinMeeting,
	leaveMeeting : leaveMeeting
	};

});


