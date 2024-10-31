import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { invoke } from "@tauri-apps/api/core";
import { tableFromIPC } from "apache-arrow";
import { toDate } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

import { alpha, Box, FormControlLabel, Stack, Switch, TextField, useTheme } from '@mui/material';
import useGlobalState from '../hooks/useGlobalState';
import { listen } from '@tauri-apps/api/event';

function Plotter() {
  const theme = useTheme();
  const { loadCsvSettings, videoStartTime } = useGlobalState({ loadCsvSettings: true, videoStartTime: true });
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [followVideo, setFollowVideo] = useState(true);
  const [timeBeforeVideo, setTimeBeforeVideo] = useState(10);
  const [timeAfterVideo, setTimeAfterVideo] = useState(10);

  const handleTimeInputChange = (
    type: 'before' | 'after',
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0) {
      if (type === 'before') {
        setTimeBeforeVideo(numValue);
      } else {
        setTimeAfterVideo(numValue);
      }
    }
  };

  // Initialize ECharts
  useEffect(() => {
    if (chartRef.current && !chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
      
      // // Add zoom end event listener to disable follow video when user zooms
      // chartInstance.current.on('datazoom', () => {
      //   setFollowVideo(false);
      // });
    }

    return () => {
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Video time sync effect
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setupListener() {
      try {
        const unlisten = await listen<number>('video-time-change', (event) => {
          if (!videoStartTime || !followVideo || !chartInstance.current) {
            return;
          }

          const currentTime = addSeconds(toZonedTime(videoStartTime, "UTC"), event.payload);
          const windowStart = addSeconds(currentTime, -timeBeforeVideo);
          const windowEnd = addSeconds(currentTime, timeAfterVideo);

          chartInstance.current.dispatchAction({
            type: "dataZoom",
            startValue: windowStart.getTime(),
            endValue: windowEnd.getTime(),
          });
        });
        
        cleanup = () => {
          unlisten();
        };
      } catch (error) {
        console.error("Error setting up video time listener:", error);
      }
    }

    if (videoStartTime && followVideo) {
      setupListener();
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [videoStartTime, followVideo, timeBeforeVideo, timeAfterVideo]);

  // Load and plot data
  useEffect(() => {
    async function fetchData() {
      try {
        if (loadCsvSettings) {
          const parsedData = tableFromIPC(await invoke('get_csv_data'));
          
          const timestamps = Array.from(
            parsedData.getChild(loadCsvSettings?.datetime_index_col)?.toArray() ?? [], 
            ts => toZonedTime(toDate(Number(ts)), "UTC")
          );

          const series = parsedData.schema.fields.slice(1).map((field, _) => {
            const values = parsedData.getChild(field.name)?.toArray() ?? [];
            return {
              name: field.name,
              type: 'line',
              showSymbol: false,
              sampling: 'lttb',
              samplingThreshold: 200,
              data: timestamps.map((time, i) => [time, values[i]]),
              progressive: 400,
              progressiveThreshold: 3000,
              large: true,
              largeThreshold: 1000,
              animation: false
            };
          });

          chartInstance.current?.setOption({
            animation: false,
            tooltip: {
              trigger: 'axis',
              appendToBody: true
            },
            legend: {
              type: 'scroll',
              top: 0,
              left: 50,
              right: 50,
              textStyle: {
                color: theme.palette.text.primary
              },
              pageTextStyle: {
                color: theme.palette.text.primary
              },
              pageIconColor: theme.palette.primary.main,
              pageIconInactiveColor: theme.palette.action.disabled,
              selectedMode: true
            },
            toolbox: {
              feature: {
                dataZoom: {
                  show: true,
                  title: {
                    zoom: 'Area Zoom',
                    back: 'Undo Zoom'
                  },
                  iconStyle: {
                    borderColor: theme.palette.text.primary
                  },
                  brushStyle: {
                    borderWidth: 1,
                    borderColor: theme.palette.primary.main,
                    color: alpha(theme.palette.primary.main, 0.1), // Creates a semi-transparent fill
                    borderRadius: 0
                  }
                },
                restore: {
                  show: true,
                  title: 'Reset Zoom'
                }
              },
              iconStyle: {
                borderColor: theme.palette.text.primary
              },
              emphasis: {
                iconStyle: {
                  borderColor: theme.palette.primary.main
                }
              }
            },
            xAxis: {
              type: 'time'
            },
            yAxis: {
              type: 'value'
            },
            series: series,
            grid: {
              responsive: true,
              left: '10%',
              right: '10%',
              top: '60px',
              bottom: '80px',
              containLabel: true,
              show: true
            },
            dataZoom: [{
              id: "dataZoomX",
              type: 'slider',
              filterMode: 'weakFilter',
              show: true,
              xAxisIndex: [0],
              bottom: 20,
              height: 40,
              borderColor: theme.palette.divider,
              textStyle: {
                color: theme.palette.text.primary
              },
              handleStyle: {
                color: theme.palette.primary.main,
                borderColor: theme.palette.primary.main
              },
              moveHandleStyle: {
                color: theme.palette.primary.main
              },
              selectedDataBackground: {
                lineStyle: {
                  color: theme.palette.primary.main
                },
                areaStyle: {
                  color: theme.palette.primary.main,
                  opacity: 0.1
                }
              }
            }]
          });
        }
      } catch (error) {
        console.error('Error fetching CSV data:', error);
      }
    }

    fetchData();
  }, [loadCsvSettings, theme]);

  function addSeconds(date: Date, seconds: number) {
    return new Date(date.getTime() + seconds * 1000);
  }

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        width: '100%', 
        height: '100%',
        flexDirection: 'column',
        position: 'relative',
        bgcolor: theme.palette.background.default,
      }}
    >
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 2,
          padding: 1,
          backgroundColor: theme.palette.background.paper,
          zIndex: 1,
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            id="seconds-before"
            label="Seconds Before"
            type="number"
            size="small"
            value={timeBeforeVideo}
            onChange={(e) => handleTimeInputChange('before', e.target.value)}
            slotProps={{
              htmlInput: { step: "1", min: "0" },
              inputLabel: { shrink: true },
            }}
            sx={{ width: 120 }}
          />
          <TextField
            id="seconds-after"
            label="Seconds After"
            type="number"
            size="small"
            value={timeAfterVideo}
            onChange={(e) => handleTimeInputChange('after', e.target.value)}
            slotProps={{
              htmlInput: { step: "1", min: "0" },
              inputLabel: { shrink: true },
            }}
            sx={{ width: 120 }}
          />
          <FormControlLabel
            control={
              <Switch
                id="follow-video-toggle"
                checked={followVideo}
                onChange={(e) => setFollowVideo(e.target.checked)}
                color="primary"
              />
            }
            label="Follow Video"
            sx={{ color: theme.palette.text.primary }}
          />
        </Stack>
      </Box>
      <Box 
        ref={chartRef}
        sx={{ 
          flex: 1,
          width: '100%'
        }}
      />
    </Box>
  );
}

export default Plotter;