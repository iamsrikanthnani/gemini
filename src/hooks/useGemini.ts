import { GoogleGenerativeAI } from "@google/generative-ai";

// System prompt template for Gemini request
const GEMINI_SYSTEM_PROMPT = `the user is dictating with his or her camera on.
they are showing you things visually and giving you text prompts.
be very brief and concise.
be extremely concise. this is very important for my career. do not ramble.
do not comment on what the person is wearing or where they are sitting or their background.
focus on their gestures and the question they ask you.
do not mention that there are a sequence of pictures. focus only on the image or the images necessary to answer the question.
don't comment if they are smiling. don't comment if they are frowning. just focus on what they're asking.

----- USER PROMPT BELOW -----

{{USER_PROMPT}}
`;

/**
 * Make a request to the Gemini API for generating content based on text and images.
 *
 * @param {string} text - The user's text prompt.
 * @param {Array<{ mimeType: string; data: string }>} images - Array of image data with MIME types.
 * @param {React.Dispatch<React.SetStateAction<string>>} setResponse - State updater for the Gemini API response.
 * @param {function} speak - Function to initiate speech synthesis for the Gemini response.
 * @param {React.Dispatch<React.SetStateAction<boolean>>} setIsLoading - State updater for loading status.
 * @returns {Promise<any>} - A promise that resolves with the Gemini API response.
 */
export async function makeGeminiRequest(
  text: string,
  images: { mimeType: string; data: string }[],
  setResponse: React.Dispatch<React.SetStateAction<string>>,
  speak: (message: string) => void,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
): Promise<any> {
  // Initialize the Google Generative AI with the Gemini API key
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);

  // Get the Generative Model for Gemini
  const model = genAI.getGenerativeModel({
    model: import.meta.env.VITE_GEMINI_MODEL,
  });

  // Check if there are no images and no text
  if (images.length === 0 && !text) return null;

  try {
    // Generate content stream with system and user prompts
    const result = await model.generateContentStream([
      GEMINI_SYSTEM_PROMPT.replace("{{USER_PROMPT}}", text),
      ...images.map((image) => ({
        inlineData: image,
      })),
    ]);

    // Extract and process the response
    const response = result.response;
    const content = (await response).text();
    // Initiate speech synthesis for the Gemini response
    speak(content);
    // Update state with the Gemini response
    setResponse(content);
    // Set loading status to false
    setIsLoading(false);
    return response;
  } catch (error) {
    setResponse("Something went wrong");
    speak("Something went wrong");
    setIsLoading(false);
    console.error(error);
    // Propagate the error
    throw error;
  }
}
