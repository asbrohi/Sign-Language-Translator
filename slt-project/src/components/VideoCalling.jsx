import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import "./VideoCalling.css";

// Import MediaPipe Hands and related utilities
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const SOCKET_SERVER_URL = "http://localhost:5001";
const MODEL_SERVER_URL = "http://localhost:5002/predict";

const VideoCalling = () => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef();
  const peerConnectionRef = useRef();

  const [createRoomName, setCreateRoomName] = useState("");
  const [joinRoomName, setJoinRoomName] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const [isInitiator, setIsInitiator] = useState(false);
  const [otherUserSocketId, setOtherUserSocketId] = useState(null);
  const [signPrediction, setSignPrediction] = useState("");

  const sequenceRef = useRef([]);
  const sequenceLength = 15; // Should match your model's expected sequence length
  const numLandmarks = 21 * 3 * 2; // For both hands
  const isPredictingRef = useRef(false);

  // Reference to the speech synthesis API
  const speechSynthesisRef = useRef(window.speechSynthesis);

  // Reference to keep track of the last spoken sign
  const lastSpokenSignRef = useRef("");

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:turn.anyfirewall.com:443?transport=tcp",
        username: "webrtc",
        credential: "webrtc",
      },
    ],
  };

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    socketRef.current.on("other-users", (users) => {
      if (users.length > 0) {
        setOtherUserSocketId(users[0]);
        initiatePeerConnection(users[0], true);
      }
    });

    socketRef.current.on("user-joined", (id) => {
      setOtherUserSocketId(id);
      initiatePeerConnection(id, isInitiator);
    });

    socketRef.current.on("offer", handleReceiveOffer);
    socketRef.current.on("answer", handleReceiveAnswer);
    socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
    socketRef.current.on("user-disconnected", handleUserDisconnected);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      // Wait for the video element to be available
      while (!localVideoRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      localVideoRef.current.srcObject = stream;

      // Start the hand recognition
      startSignRecognition();
      return stream;
    } catch (error) {
      alert("Could not access your camera. Please check permissions.");
      console.error("Error accessing camera:", error);
      throw error;
    }
  };

  const startSignRecognition = () => {
    // Initialize MediaPipe Hands
    const handsInstance = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    handsInstance.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    handsInstance.onResults(onResults);

    const videoElement = localVideoRef.current;

    // Use the Camera class to handle video frames
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await handsInstance.send({ image: videoElement });
      },
      width: 640,
      height: 480,
    });
    camera.start();
  };

  const onResults = (results) => {
    let combinedLandmarks = [];
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      // Prepare dictionaries to hold landmarks for left and right hands
      let handLandmarksDict = { Left: null, Right: null };

      // Loop through detected hands
      for (let idx = 0; idx < results.multiHandedness.length; idx++) {
        const classification = results.multiHandedness[idx];
        const handLabel = classification.label;
        const handLandmarks = results.multiHandLandmarks[idx];

        // Extract landmarks
        let landmarks = [];
        for (let i = 0; i < handLandmarks.length; i++) {
          const lm = handLandmarks[i];
          landmarks.push(lm.x, lm.y, lm.z);
        }
        handLandmarksDict[handLabel] = landmarks;
      }

      // Prepare combined landmarks for both hands
      const numLandmarksPerHand = 21 * 3;
      const leftHandLandmarks =
        handLandmarksDict["Left"] || Array(numLandmarksPerHand).fill(0.0);
      const rightHandLandmarks =
        handLandmarksDict["Right"] || Array(numLandmarksPerHand).fill(0.0);
      combinedLandmarks = leftHandLandmarks.concat(rightHandLandmarks);
    } else {
      // No hands detected, fill with zeros
      combinedLandmarks = Array(numLandmarks).fill(0.0);
    }

    // Update the sequenceRef
    sequenceRef.current.push(combinedLandmarks);
    if (sequenceRef.current.length > sequenceLength) {
      sequenceRef.current.shift();
    }

    // If we have enough frames, send the sequence to the model
    if (sequenceRef.current.length === sequenceLength) {
      sendSequenceToModel(sequenceRef.current.slice());
    }
  };

  const sendSequenceToModel = async (sequence) => {
    if (isPredictingRef.current) return;
    isPredictingRef.current = true;

    try {
      const response = await fetch(MODEL_SERVER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: sequence }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Server Error: ${response.status} ${response.statusText}`,
          errorText
        );
        return;
      }

      const data = await response.json();
      const newSignPrediction = data.gesture;
      setSignPrediction(data.gesture);

      // Speak the recognized sign if it's different from the last spoken one
      if (newSignPrediction !== lastSpokenSignRef.current) {
        lastSpokenSignRef.current = newSignPrediction;
        speakRecognizedSign(newSignPrediction);
      }
    } catch (error) {
      console.error("Error sending sequence to model:", error);
    } finally {
      isPredictingRef.current = false;
    }
  };

  const speakRecognizedSign = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      // Optional: Set voice, language, pitch, rate, and volume
      utterance.lang = "en-US";
      utterance.rate = 1;
      utterance.pitch = 1;
      speechSynthesisRef.current.speak(utterance);
    } else {
      console.warn("Text-to-speech is not supported in this browser.");
    }
  };

  const initiatePeerConnection = async (targetId, initiator) => {
    setIsCallActive(true); // Set call active before getting local stream
    const stream = await getLocalStream();
    peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);
    stream
      .getTracks()
      .forEach((track) => peerConnectionRef.current.addTrack(track, stream));

    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && targetId) {
        socketRef.current.emit("ice-candidate", {
          target: targetId,
          candidate: event.candidate,
        });
      }
    };

    if (initiator) {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      socketRef.current.emit("offer", {
        target: targetId,
        sdp: peerConnectionRef.current.localDescription,
      });
    }
  };

  const handleReceiveOffer = async (data) => {
    setIsCallActive(true); // Set call active before getting local stream
    setOtherUserSocketId(data.caller);
    const stream = await getLocalStream();
    peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);
    stream
      .getTracks()
      .forEach((track) => peerConnectionRef.current.addTrack(track, stream));

    peerConnectionRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate && data.caller) {
        socketRef.current.emit("ice-candidate", {
          target: data.caller,
          candidate: event.candidate,
        });
      }
    };

    await peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(data.sdp)
    );
    const answer = await peerConnectionRef.current.createAnswer();
    await peerConnectionRef.current.setLocalDescription(answer);
    socketRef.current.emit("answer", {
      target: data.caller,
      sdp: peerConnectionRef.current.localDescription,
    });
  };

  const handleReceiveAnswer = async (data) => {
    await peerConnectionRef.current.setRemoteDescription(
      new RTCSessionDescription(data.sdp)
    );
  };

  const handleNewICECandidateMsg = async (data) => {
    try {
      await peerConnectionRef.current.addIceCandidate(
        new RTCIceCandidate(data.candidate)
      );
    } catch (error) {
      console.error("Error adding received ice candidate", error);
    }
  };

  const handleUserDisconnected = () => {
    endCall();
  };

  const createRoom = () => {
    if (!createRoomName) alert("Enter a room name");
    else {
      setIsInitiator(true);
      socketRef.current.emit("join", createRoomName);
    }
  };

  const joinRoom = () => {
    if (!joinRoomName) alert("Enter a room name");
    else {
      setIsInitiator(false);
      socketRef.current.emit("join", joinRoomName);
    }
  };

  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsCallActive(false);
    setOtherUserSocketId(null);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      remoteVideoRef.current.srcObject
        .getTracks()
        .forEach((track) => track.stop());
      remoteVideoRef.current.srcObject = null;
    }

    lastSpokenSignRef.current = '';
  };

  return (
    <div className="video-calling-wrapper">
      <div className="video-calling-heading">Video Calling</div>
      {/* Always render the video elements */}
      <div className="video-calling-container">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className={`local-video ${isCallActive ? "" : "hidden"}`}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          className={`remote-video ${isCallActive ? "" : "hidden"}`}
        />
        {isCallActive && <div>Recognized Sign: {signPrediction}</div>}
      </div>
      {!isCallActive ? (
        <div className="room-selection">
          <input
            type="text"
            placeholder="Enter Room Name"
            value={createRoomName}
            onChange={(e) => setCreateRoomName(e.target.value)}
          />
          <button onClick={createRoom}>Create Room</button>
          <input
            type="text"
            placeholder="Enter Room Name"
            value={joinRoomName}
            onChange={(e) => setJoinRoomName(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <button onClick={endCall}>End Call</button>
      )}
    </div>
  );
};

export default VideoCalling;
