import { Text } from "@radix-ui/themes";
import useApp from "@/hooks/useApp";

const App = () => {
  const { isLoading, videoRef } = useApp();

  return (
    <div className="flex flex-col sm:flex-row h-screen bg-black p-8">
      {/* Camera layout */}
      <div className="lg:w-2/3 lg:h-full md:w-2/3  md:h-full sm:w-full h-4/6 sm:mr-2 mb-2 sm:mb-0">
        <div
          className={`justify-center overflow-hidden flex items-center rounded-[30px] h-full ${
            isLoading ? "border-anim p-[3px]" : "border-[3.5px]"
          }`}
        >
          <video
            ref={videoRef}
            className="w-full h-full video-container"
            autoPlay
            playsInline
            muted
            style={{ borderRadius: isLoading ? 30 : 0 }}
          />
        </div>
      </div>

      {/* Gemini response layout */}
      <div className="lg:w-1/3 lg:h-full md:w-1/3 md:h-full sm:w-full h-2/6">
        <div className="bg-black p-4 h-full w-full justify-center flex items-center">
          <Text className="text-white">Ai Layout</Text>
          {/* FOOTER */}
          <div className="absolute bottom-0 py-4 text-center">
            <img
              className="w-32 ml-2.5"
              src={
                "https://ppc.land/content/images/size/w1200/2023/12/Google-Gemini-AI-2.webp"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
