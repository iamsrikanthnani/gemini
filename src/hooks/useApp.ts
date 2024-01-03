/**
 * Custom React Hook: useApp
 *
 * Description:
 * This hook provides functionality for handling camera initialization, capturing video frames,
 * and managing speech recognition for voice commands.
 *
 * Returns:
 * An object containing references and state for camera handling and speech recognition.
 *
 * @returns {Object} - An object with the following properties:
 * @property {Object} videoRef - Reference to the video element for camera streaming.
 * @property {boolean} isLoading - Flag indicating whether the camera is currently loading.
 * @property {boolean} listening - Flag indicating whether speech recognition is actively listening.
 * @property {string} response - The response received from the Gemini API.
 * @property {Array} base64Frames - Array containing base64-encoded video frames.
 *
 * Usage:
 * const {
 *   videoRef,
 *   isLoading,
 *   listening,
 *   response,
 *   base64Frames,
 * } = useApp();
 */
import { useEffect, useRef, useState } from "react";
import annyang, { Commands } from "annyang";
import "regenerator-runtime/runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { makeGeminiRequest } from "./useGemini";
import { useSpeech } from "./useSpeech";

const useApp = () => {
  // Ref for the video element
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { speak, isSpeaking } = useSpeech();

  const [isFrontCamera, setIsFrontCamera] = useState(false);

  // State variables for loading state, recording state, and storing base64 frames
  const [isLoading, setIsLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const [response, setResponse] = useState("");
  const [base64Frames, setBase64Frames] = useState<
    { mimeType: string; data: string }[]
  >([]);

  // Speech recognition hook for managing transcript and listening state
  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  // Variable to store the interval for capturing frames
  let frameInterval: NodeJS.Timeout;

  // Function to start speech recognition
  const handleListing = () => {
    SpeechRecognition.startListening({
      continuous: false,
    });
  };

  // Function to stop speech recognition
  const stopHandle = () => {
    SpeechRecognition.stopListening();
  };

  // Function to reset speech recognition transcript
  const handleReset = () => {
    stopHandle();
    resetTranscript();
  };

  // Function to run the application, capturing frames and starting speech recognition
  const runApp = () => {
    annyang.abort();
    handleReset();
    setIsLoading(true);
    setResponse("");
    setBase64Frames([]);
    handleListing();
    frameInterval = setInterval(() => {
      if (videoRef.current) {
        // Create a canvas to capture frames from the video
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const context = canvas.getContext("2d");
        if (context) {
          // Draw the current video frame on the canvas
          context.drawImage(
            videoRef.current,
            0,
            0,
            canvas.width,
            canvas.height
          );
          // Convert the frame to base64 format and add it to the frames array
          const base64Frame = canvas.toDataURL("image/jpeg");
          let [mimeType, data] = base64Frame.split(";base64,");
          mimeType = mimeType.split(":")[1];
          setBase64Frames((prevFrames) => [...prevFrames, { mimeType, data }]);
        }
      }
    }, 1000);
  };

  // Effect to handle changes in the listening state
  useEffect(() => {
    if (!listening) {
      // Start annyang for additional voice commands
      annyang.start();
      stopHandle();
      clearInterval(frameInterval);
      makeGeminiRequest(
        transcript,
        base64Frames,
        setResponse,
        speak,
        setIsLoading
      );
      SpeechRecognition.stopListening();
    }
  }, [listening]);

  useEffect(() => {
    if (!isSpeaking && autoMode) {
      runApp();
    }
  }, [isSpeaking]);

  // Effect to initialize the camera and set up speech recognition commands
  useEffect(() => {
    // Function to initialize the camera
    const initializeCamera = async () => {
      try {
        // Access the user's camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });

        if (videoRef.current) {
          // Set the camera stream as the source for the video element
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    // Initialize the camera
    initializeCamera();

    // Speech recognition commands
    const commands: Commands = {
      "Hey Gemini": () => {
        runApp();
      },
      Hey: () => {
        runApp();
      },
      Hello: () => {
        runApp();
      },
    };

    if (autoMode) {
      runApp();
    } else {
      // Add commands to annyang and start it
      annyang.addCommands(commands);
      annyang.start();
    }

    // Cleanup function when the component unmounts
    return () => {
      // Abort annyang, stop recording, and clear intervals
      annyang.abort();
      stopHandle();
      clearInterval(frameInterval);
    };
  }, [autoMode]);

  // Return the state variables and video reference for external use
  return {
    videoRef,
    isLoading,
    listening,
    response,
    base64Frames,
    autoMode,
    setAutoMode,
    setIsFrontCamera,
    isFrontCamera,
  };
};

// Export the custom hook for use in other components
export default useApp;
