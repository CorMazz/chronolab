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
import { Container, Button, Box, Typography, TextField } from '@mui/material';
import useGlobalState from "../hooks/useGlobalState";
import { Controller, useForm } from "react-hook-form";
import { dateToUtcString, parseUtcString } from "../utils/datetimeHandlers";
import { useFileOperations } from "../hooks/useFileOperations";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const videoStartTimeSchema = z.object({
    video_start_time: z.string().min(1, "Video start time is required"),
});

type VideoStartTimeFormInputs = z.infer<typeof videoStartTimeSchema>;

export function VideoStartTimeForm() {
  const { videoStartTime, setVideoStartTime } = useGlobalState({ videoStartTime: true, setOnly: false });

  const { control, handleSubmit, reset } = useForm<VideoStartTimeFormInputs>({
    defaultValues: {
        video_start_time: undefined
    },
    resolver: zodResolver(videoStartTimeSchema)
});
  // Set initial value when videoStartTime changes
  useEffect(() => {
      if (videoStartTime instanceof Date) {
          reset({
              video_start_time: dateToUtcString(videoStartTime) ?? undefined
          });
      }
  }, [videoStartTime, reset]);

  const onSubmit = (data: VideoStartTimeFormInputs) => {
      // Convert the string to a Date object before saving to global state
      const dateValue = data.video_start_time ? parseUtcString(data.video_start_time) : null;
      
      if (setVideoStartTime) {
          setVideoStartTime(dateValue);
      }
  };

  return (
      <form onSubmit={handleSubmit(onSubmit)}>
          <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                  Input the Video Start Time
              </Typography>
              
              <Controller
                  name="video_start_time"
                  control={control}
                  render={({ field, fieldState: { error } }) => (
                      <TextField
                          {...field}
                          fullWidth
                          type="datetime-local"
                          label="Video Start Time"
                          value={field.value ?? ''}
                          slotProps={{
                            htmlInput: { step: "1" },
                            inputLabel: { shrink: true },
                          }}
                          error={!!error}
                          helperText={error?.message}
                      />
                  )}
              />

          </Box>

          <Box textAlign="center" mt={2}>
              <Button 
                  variant="contained" 
                  color="primary" 
                  type="submit"
              >
                  Set Video Start Time
              </Button>
          </Box>
      </form>
  );
}



function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const { selectVideoFile } = useFileOperations();
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

          // Send current time to backend
          invoke('emit_video_time_change', { videoTime: currentTime });
        }
      }
    }, 10); // Poll every 500 milliseconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [lastTime]);
  


  return  (
    <Container>
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mt: 4, 
                p: 2, 
                border: '1px solid #ccc', 
                borderRadius: 2 
            }}
        >
            {videoFilePath ? (
                <Box    
                  sx={{
                    width: '100%',
                    height: "fit-content",
                    borderRadius: 2, // 8px rounded corners
                    overflow: 'hidden', // Clips the video content to match the border radius
                    border: '2px solid', // Optional border
                    borderColor: 'primary.main', // Border color using theme's primary color
                    boxShadow: 3, // Box shadow for elevation effect
                }}>
                    <MediaController>
                        <video
                            ref={videoRef}
                            slot="media"
                            src={convertFileSrc(videoFilePath)}
                            preload="auto"
                            muted
                            crossOrigin=""
                            style={{ width: '100%', borderRadius: 8 }}
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
                </Box>
            ) : (
                <Box textAlign="center">
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        No video file selected
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => selectVideoFile(setVideoFilePath)}
                    >
                        Select Video File
                    </Button>
                </Box>
            )}

            {!videoStartTime && (
                <Box mt={4} width="100%">
                    <VideoStartTimeForm />
                </Box>
            )}
        </Box>
    </Container>
  );
}

export default VideoPlayer;
