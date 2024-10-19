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

// This is used to validate the form inputs
const videoStartTimeFormInputs = z.object({
    video_start_time: z.preprocess(
      (val) => val === "" ? null : val,
      z.coerce.date().nullable()
  ),
})

type VideoStartTimeFormInputs = z.infer<typeof videoStartTimeFormInputs>;

// ##############################################################################################################
// Child Component
// ##############################################################################################################

function VideoStartTimeForm() {
    const { handleSubmit, register, formState: { errors } } = useForm<VideoStartTimeFormInputs>({resolver: zodResolver(videoStartTimeFormInputs)});
    const { setVideoStartTime } = useGlobalState({videoStartTime: true, setOnly: true});

    const onFormSubmit = (data: VideoStartTimeFormInputs) => {
      console.log("Video Start Time Type:", typeof(data.video_start_time));
      if (setVideoStartTime) {
        setVideoStartTime(data.video_start_time)
      } else {
        console.error("Unable to set the video start time due to an undefined global state setter.")
      }
      };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)}>
            {/* End Time */}
            <div>
                <label htmlFor="video_start_time">Input the Video Start Time</label>
                <input
                    id="video_start_time"
                    type="datetime-local"
                    {...register("video_start_time")}
                />
                {errors.video_start_time && <p>{errors.video_start_time.message}</p>}
            </div>

            <button type="submit">Submit</button>
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
    <div className="container">

      {videoFilePath ? (
        <MediaController>
          <video
            ref={videoRef}
            slot="media"
            src={convertFileSrc(videoFilePath)}
            preload="auto"
            muted
            crossOrigin=""
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
        ) : (
          <button onClick={() => selectVideoFile(setVideoFilePath)}>Select Video File (Video Player Button)</button>
        )
      }
      {!videoStartTime && <VideoStartTimeForm/>}

    </div>
  );
}

export default VideoPlayer;
