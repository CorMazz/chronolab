import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import { Table, tableFromIPC } from "apache-arrow";
import useGlobalState from '../hooks/useGlobalState';
import { Data } from 'plotly.js';
import { toDate } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { Box, FormControlLabel, Stack, Switch, TextField, useTheme } from '@mui/material';

function Plotter() {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  const { loadCsvSettings, videoStartTime } = useGlobalState({ loadCsvSettings: true, videoStartTime: true });
  const [csvTable, setCsvTable] = useState<Table | null>(null);
  const [plotData, setPlotData] = useState<Data[] | null>(null);
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
  
  const [layout, setLayout] = useState({
    autosize: true,
    plot_bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
    paper_bgcolor: isDarkMode ? '#121212' : '#fff',
    font: {
      color: isDarkMode ? '#fff' : '#000',
    },
    xaxis: {
      autorange: true,
      gridcolor: isDarkMode ? '#333' : '#eee',
      zerolinecolor: isDarkMode ? '#444' : '#ddd',
      linecolor: isDarkMode ? '#444' : '#ddd',
    },
    yaxis: {
      gridcolor: isDarkMode ? '#333' : '#eee',
      zerolinecolor: isDarkMode ? '#444' : '#ddd',
      linecolor: isDarkMode ? '#444' : '#ddd',
    },
    margin: {
      l: 50,
      r: 50,
      b: 50,
      t: 50,
      pad: 4
    },
  });

  async function setAxesRange(start: Date, end: Date) {
    setLayout((prevLayout) => ({
      ...prevLayout,
      xaxis: {
        ...prevLayout.xaxis,
        autorange: false,
        range: [toZonedTime(start, "UTC"), toZonedTime(end, "UTC")],
      },
      transition: {
        duration: 10,
        easing: 'cubic-in-out',
        ordering: "traces first"
      },
    }));
  }

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setupListener() {
      try {
        const unlisten = await listen<number>('video-time-change', (event) => {
          if (!videoStartTime || !followVideo) {
            return;
          }
          setAxesRange(
            addSeconds(videoStartTime, -timeBeforeVideo + event.payload),
            addSeconds(videoStartTime, timeAfterVideo + event.payload)
          );
        });
        
        cleanup = () => {
          unlisten();
        };
      } catch (error) {
        console.error("Error setting up listener:", error);
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

  // Update layout when theme changes
  useEffect(() => {
    setLayout(prevLayout => ({
      ...prevLayout,
      plot_bgcolor: isDarkMode ? '#1e1e1e' : '#fff',
      paper_bgcolor: isDarkMode ? '#121212' : '#fff',
      font: {
        color: isDarkMode ? '#fff' : '#000',
      },
      xaxis: {
        ...prevLayout.xaxis,
        gridcolor: isDarkMode ? '#333' : '#eee',
        zerolinecolor: isDarkMode ? '#444' : '#ddd',
        linecolor: isDarkMode ? '#444' : '#ddd',
      },
      yaxis: {
        ...prevLayout.yaxis,
        gridcolor: isDarkMode ? '#333' : '#eee',
        zerolinecolor: isDarkMode ? '#444' : '#ddd',
        linecolor: isDarkMode ? '#444' : '#ddd',
      },
    }));
  }, [isDarkMode]);

  useEffect(() => {
    async function fetchData() {
      try {
        if (loadCsvSettings) {
          const parsedData = tableFromIPC(await invoke('get_csv_data'));
          setCsvTable(parsedData);

          const x = Array.from(parsedData.getChild(loadCsvSettings?.datetime_index_col)?.toArray() ?? [], ts => toZonedTime(toDate(Number(ts)), "UTC"));
          
          // Create traces with colors that work well in both light and dark modes
          const colors = [
            '#2196f3', // blue
            '#4caf50', // green
            '#f44336', // red
            '#ff9800', // orange
            '#9c27b0', // purple
            '#00bcd4', // cyan
            '#ffeb3b', // yellow
            '#795548', // brown
          ];

          const newPlotData = parsedData.schema.fields.slice(1).map((field, index) => {
            const y = parsedData.getChild(field.name)?.toArray() ?? [];
            return {
              x: x,
              y: y,
              type: 'scattergl',
              mode: 'lines+markers',
              name: field.name,
              line: {
                color: colors[index % colors.length],
                width: 2,
              },
              marker: {
                size: 4,
                color: colors[index % colors.length],
              },
            } as Data;
          });

          setPlotData(newPlotData);
        }
      } catch (error) {
        console.error('Error fetching CSV data:', error);
      }
    }

    fetchData();
  }, [loadCsvSettings]);

  // Your existing video time handling useEffect...

  const handleRelayout = (eventData: any) => {
    if (eventData['xaxis.range[0]'] || eventData['xaxis.range[1]'] || eventData['xaxis.autorange']) {
      setFollowVideo(false);
    }
  };

  function addSeconds(date: Date, seconds: number) {
    const newDate = new Date(date.getTime() + seconds * 1000);
    return newDate;
  }

  if (!csvTable) return <div>Loading...</div>;

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
        sx={{ 
          position: 'relative',
          flex: 1,
          '& .js-plotly-plot': {
            width: '100% !important',
            height: '100% !important'
          }
        }}
      >
        {plotData && 
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <Plot
              data={plotData}
              layout={layout}
              onRelayout={handleRelayout}
              useResizeHandler
              style={{ width: '100%', height: '100%' }}
              config={{
                responsive: true,
                displayModeBar: true,
                displaylogo: false,
                modeBarButtonsToRemove: ['autoScale2d'],
                plotlyServerURL: "",  // Prevents Plotly from trying to connect to their server
                toImageButtonOptions: {
                  format: 'svg',
                  filename: 'plot',
                  height: 1080,
                  width: 1920,
                  scale: 1
                }
              }}
            />
          </Box>
        }
      </Box>
    </Box>
  );
}

export default Plotter;
