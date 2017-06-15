requirejs.config({
    baseUrl: '',

    paths: {
       "webrtc-sdk" : "./external/webrtcsdk.min",
       jquery: './external/jquery',
       underscore: './external/lodash'
    }
});

require(["webrtc-sdk"], function () {
    console.log("(require): webrtc sdk loaded");
    require(['example'], function() {
        console.log("(require): example webrtc client app loaded");
    });
});
