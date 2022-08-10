  // THIS IS WHERE VIDEOCHAT IS ENABLED //
  
  
const firebaseConfig = {
apiKey: "AIzaSyBamdVslZv5sAZzbQG3mnOD0dNk1PJ9w7s",
authDomain: "chess123-bda8c.firebaseapp.com",
projectId: "chess123-bda8c",
storageBucket: "chess123-bda8c.appspot.com",
messagingSenderId: "50590553095",
appId: "1:50590553095:web:91daa37d9cf055336186a2",
measurementId: "G-82GSRHPT51"
};
// THIS IS WHERE VIDEOCHAT IS ENABLED //


const firebaseConfig = {
    apiKey: "AIzaSyBamdVslZv5sAZzbQG3mnOD0dNk1PJ9w7s",
    authDomain: "chess123-bda8c.firebaseapp.com",
    projectId: "chess123-bda8c",
    storageBucket: "chess123-bda8c.appspot.com",
    messagingSenderId: "50590553095",
    appId: "1:50590553095:web:91daa37d9cf055336186a2",
    measurementId: "G-82GSRHPT51"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

const servers = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 10,
}

//Web cams
let pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;

let callConnection = null;


// change these ids to correspond to accepting a game with someone
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('localVideo');
const callButton = document.getElementById('callButton');

// const callInput = document.getElementById('callInput');

const GameRoomId = document.getElementById('GameRoomId')

const callVideo = document.getElementById('callVideo');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');


// Setup Source
webcamButton.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    remoteStream = new MediaStream();

    localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.addTrack(track);
        });
    };

    webcamVideo.srcObject = localStream;
    remoteVideo.srcObject = remoteStream;

    callButton.disabled = false;
    answerButton.disabled = false;
    webcamButton.disabled = true;
};

// Create the offer
callButton.onclick = async () => {
    const callDoc = firestore.collection('calls').doc(GameRoomId.textContent);

    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    // const game_ids = callDoc.collection('game_ids');

    //##########################

    //callConnection = callDoc.id; // write callDoc.id to database as a value, and use gameid as a key
    
    //##########################

    // Gets ICE candidates for caller, then saves to DB
    pc.onicecandidate = event => {
        event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
    };

    callButton.disabled = true;
    await callDoc.set({ offer });

    answerButton.disabled = true;

    callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
        }
    });

    answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });

    hangupButton.disabled = false;
};


// Answer call with unique ID
answerButton.onclick = async () => {

    //######################
    callDoc = firestore.collection('calls').doc(GameRoomId.innerHTML);//callId); //retrive callId using a set variable
    //#####################
    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates');
    

    pc.onicecandidate = event => {
        event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    callButton.disabled = true;
    answerButton.disabled = true;

    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                let data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
            }
        });
        
    });
    //MODDED
    hangupButton.disabled = false;
};

hangupButton.onclick = () => {
    // localStream.getTracks().forEach(function (track) {
    //     track.stop();
    // });

    remoteStream.getTracks().forEach(function (track) {
        track.stop();
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.stop();
        });
    };

    pc.close()

    pc = new RTCPeerConnection(servers);
    localStream = null;
    remoteStream = null;

    callButton.disabled = true;
    answerButton.disabled = true;
    webcamButton.disabled = false;
    hangupButton.disabled = true;
}

const backButton = document.getElementById('game-back');
const resignButton = document.getElementById('game-resign');

backButton.onclick = () => {

    localStream.getTracks().forEach(function (track) {
        track.stop();
    });

    remoteStream.getTracks().forEach(function (track) {
        track.stop();
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.stop();
        });
    };

    pc.close()
    pc = new RTCPeerConnection(servers);
    localStream = null;
    remoteStream = null;

    callButton.disabled = true;
    answerButton.disabled = true;
    webcamButton.disabled = false;
};

resignButton.onclick = () => {

    localStream.getTracks().forEach(function (track) {
        track.stop();
    });

    remoteStream.getTracks().forEach(function (track) {
        track.stop();
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track => {
            remoteStream.stop();
        });
    };

    pc.close()

    pc = new RTCPeerConnection(servers);
    localStream = null;
    remoteStream = null;

    callButton.disabled = true;
    answerButton.disabled = true;
    webcamButton.disabled = false;
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const firestore = firebase.firestore();

const servers = {
    iceServers: [
        {
            urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 10,
}

//Web cams
let pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;


// change these ids to correspond to accepting a game with someone
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('localVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const callVideo = document.getElementById('callVideo');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');

// Setup Source
webcamButton.onclick = async () => {
    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
    remoteStream = new MediaStream();

    localStream.getTracks().forEach((track) =>{
        pc.addTrack(track, localStream);
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track =>{
            remoteStream.addTrack(track);
        });
    };

    webcamVideo.srcObject = localStream;
    remoteVideo.srcObject = remoteStream;

    callButton.disabled = false;
    answerButton.disabled = false;
    webcamButton.disabled = true;
};

// Create the offer
callButton.onclick = async () => {
    const callDoc = firestore.collection('calls').doc();
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    callInput.value = callDoc.id;

    // Gets ICE candidates for caller, then saves to DB
    pc.onicecandidate = event => {
        event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
        sdp: offerDescription.sdp,
        type: offerDescription.type,
    };

    await callDoc.set({ offer }); // ERROR?

    callDoc.onSnapshot((snapshot) => {
        const data = snapshot.data();
        if (!pc.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(answerDescription);
        }
    });

    answerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
                const candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        });
    });

    hangupButton.disabled = false;
};


// Answer call with unique ID
answerButton.onclick = async () => {
    const callId = callInput.value;
    const callDoc = firestore.collection('calls').doc(callId); 
    const answerCandidates = callDoc.collection('answerCandidates');
    const offerCandidates = callDoc.collection('offerCandidates');
    
    pc.onicecandidate = event => {
        event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data(); //SHOULD HAVE SET OFFER
    
    
    const offerDescription = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
        type: answerDescription.type,
        sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if(change.type === 'added') {
                let data = change.doc.data();
                pc.addIceCandidate(new RTCIceCandidate(data));
            }
        });
    });
    //MODDED
    hangupButton.disabled = false;
};



const backButton = document.getElementById('game-back');

backButton.onclick = () =>{


    localStream.getTracks().forEach(function(track) {
        track.stop();
    });

    pc.ontrack = event => {
        event.streams[0].getTracks().forEach(track =>{
            remoteStream.stop();
        });
    };

    callButton.disabled = true;
    answerButton.disabled = true;
    webcamButton.disabled = false;
};
// hangupButton.onclick = async () => {
//     remoteStream = null;
//     hangupButton.disabled = true;
// }
