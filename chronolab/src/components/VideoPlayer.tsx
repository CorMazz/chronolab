import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
} from 'media-chrome/react';
import useGlobalState from "../hooks/useGlobalState";
import { selectVideoFile } from "../utils/fileSelectors";
import {z} from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { parseJSON } from "date-fns";

// This is used to validate the form inputs
const videoStartTimeFormInputs = z.object({
    video_start_time: z.preprocess(
      // Doing this bullshit with the length because the html datetime-local element truncates seconds if they're 0 and we need those to parse properly.
      (val) => (val == null || val === "" )  ? null : (parseJSON((val as string).length === 16 ? (val as string) + ":00" : (val as string))),
      z.date().nullable()
  ),
})

type VideoStartTimeFormInputs = z.infer<typeof videoStartTimeFormInputs>;

// ##############################################################################################################
// Child Component
// ##############################################################################################################

export function VideoStartTimeForm() {
    const { videoStartTime, setVideoStartTime } = useGlobalState({videoStartTime: true, setOnly: false});

    const { handleSubmit, register, formState: { errors } } = useForm<VideoStartTimeFormInputs>(
      {
        resolver: zodResolver(videoStartTimeFormInputs),
        defaultValues: { video_start_time: videoStartTime }
      }
    );

    const onFormSubmit = (data: VideoStartTimeFormInputs) => {
      console.log("Video Start Time Form Submission Data:")
      console.log("   Video Start Time:", data.video_start_time);
      console.log("   Video Start Time Type:", typeof(data.video_start_time));
      if (setVideoStartTime) {
        setVideoStartTime(data.video_start_time)
      } else {
        console.error("Unable to set the video start time due to an undefined global state setter.")
      }
      };

    return (
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        {/* End Time */}
        <div className="space-y-2">
          <label htmlFor="video_start_time" className="block text-gray-700 font-semibold">
            Input the Video Start Time
          </label>
          <input
            id="video_start_time"
            type="datetime-local"
            step="1"
            {...register("video_start_time")}
            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.video_start_time && (
            <p className="text-red-600 text-sm">{errors.video_start_time.message}</p>
          )}
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:ring focus:ring-blue-200 transition"
        >
          Submit
        </button>
      </form>
    );
}




function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const {videoFilePath, setVideoFilePath, videoStartTime} = useGlobalState({videoFile: true, videoStartTime: true});


  /**
   * Setup a polling function to continuously broadcast the video time to the whole application.
   * Invokes a backend Rust function which uses a global emitter whose payload is the current video time,
   * in seconds from the start of the video (0 sec is the start). This is not kept track of as part of global 
   * state.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime; // Get the current time

        // Check if current time has changed
        if (lastTime !== currentTime) {
          setLastTime(currentTime); // Update last time
          console.log(`Current Time: ${currentTime}`); // Log for debugging

          // Send current time to backend
          invoke('emit_video_time_change', { videoTime: currentTime });
        }
      }
    }, 500); // Poll every 500 milliseconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [lastTime]);
  


  return (
    <div className="container mx-auto p-4 bg-gray-100 shadow-md rounded-lg max-w-3xl">
      {videoFilePath ? (
        <div className="video-player-container space-y-4">
          <MediaController>
            <video
              ref={videoRef}
              slot="media"
              src={convertFileSrc(videoFilePath)}
              preload="auto"
              muted
              crossOrigin=""
              className="w-full rounded-md shadow-md"
            />
            <MediaControlBar>
              <MediaPlayButton></MediaPlayButton>
              <MediaSeekBackwardButton></MediaSeekBackwardButton>
              <MediaSeekForwardButton></MediaSeekForwardButton>
              <MediaTimeRange></MediaTimeRange>
              <MediaTimeDisplay showDuration></MediaTimeDisplay>
              <MediaMuteButton></MediaMuteButton>
              <MediaVolumeRange></MediaVolumeRange>
            </MediaControlBar>
          </MediaController>
        </div>
      ) : (
        <div className="text-center">
          <button 
            onClick={() => selectVideoFile(setVideoFilePath)} 
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:ring focus:ring-blue-200 transition"
          >
            Select Video File (Video Player Button)
          </button>
        </div>
      )}
      
      {!videoStartTime && <VideoStartTimeForm />}
    </div>

  );
}

export default VideoPlayer;
