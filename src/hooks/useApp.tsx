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
 * @property {boolean} isRecording - Flag indicating whether speech recognition is active.
 * @property {Array} base64Frames - Array containing base64-encoded video frames.
 *
 * Usage:
 * const {
 *   videoRef,
 *   isLoading,
 *   isRecording,
 *   base64Frames,
 * } = useApp();
 */
import { useEffect, useRef, useState } from "react";
import annyang, { Commands } from "annyang";
import "regenerator-runtime/runtime";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

const useApp = () => {
  // Ref for the video element
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // State variables for loading state, recording state, and storing base64 frames
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [base64Frames, setBase64Frames] = useState<string[]>([]);

  // Speech recognition hook for managing transcript and listening state
  const { transcript, resetTranscript, listening } = useSpeechRecognition();

  // Logging listening state and transcript for debugging
  console.log(listening, "listening");
  console.log(transcript, "transcript");

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
    // annyang.start(); // (Commented out, possibly for future use)
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
    console.log("got hey gemini!");
    setIsLoading(true);
    setIsRecording(true);
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
          setBase64Frames((prevFrames) => [...prevFrames, base64Frame]);
        }
      }
    }, 1000);
  };

  // Effect to handle changes in the listening state
  useEffect(() => {
    if (!listening) {
      // Start annyang for additional voice commands
      annyang.start();
      setIsRecording(false);
      setIsLoading(false);
      stopHandle();
      clearInterval(frameInterval);
      SpeechRecognition.stopListening();
    }
  }, [listening]);

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

        setIsLoading(false);
      } catch (error) {
        console.error("Error accessing camera:", error);
        setIsLoading(false);
      }
    };

    // Initialize the camera
    initializeCamera();

    // Speech recognition commands
    const commands: Commands = {
      Gemini: () => {
        runApp();
      },
    };

    // Add commands to annyang and start it
    annyang.addCommands(commands);
    annyang.start();

    // Cleanup function when the component unmounts
    return () => {
      // Abort annyang, stop recording, and clear intervals
      annyang.abort();
      setIsRecording(false);
      stopHandle();
      clearInterval(frameInterval);
    };
  }, []);

  // Return the state variables and video reference for external use
  return {
    videoRef,
    isLoading: isLoading || listening,
    isRecording,
    base64Frames,
  };
};

// Export the custom hook for use in other components
export default useApp;
