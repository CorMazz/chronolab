import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import { Table, tableFromIPC } from "apache-arrow";
import useGlobalState from '../hooks/useGlobalState';
import { Data } from 'plotly.js';
import { toDate } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

function Plotter() {
  const { loadCsvSettings, videoStartTime } = useGlobalState({ loadCsvSettings: true, videoStartTime: true });
  const [csvTable, setCsvTable] = useState<Table | null>(null);
  const [plotData, setPlotData] = useState<Data[] | null>(null);
  const [layout, setLayout] = useState({
    width: 640,
    height: 480,
    title: 'Data Plot',
    xaxis: {
      autorange: true,
    },
  });

  useEffect(() => {
    // Get the Apache Arrow IPC serialized formatted CSV data from the Rust backend
    async function fetchData() {
      try {
        if (loadCsvSettings) {
          const parsedData = tableFromIPC(await invoke('get_csv_data'));
          console.log("Parsed Data");
          setCsvTable(parsedData);

          // Extracting the first column as x (timestamps) and subsequent columns as y (data series)
          // The toZonedTime BS is to get the time to display as correct and not shift it to our time zone.
          const x = Array.from(parsedData.getChild(loadCsvSettings?.datetime_index_col)?.toArray() ?? [], ts => toZonedTime(toDate(Number(ts)), "UTC"));
          
          // Create an array of traces for each subsequent column in the csvTable
          const newPlotData = parsedData.schema.fields.slice(1).map(field => {
            const y = parsedData.getChild(field.name)?.toArray() ?? [];
            return {
              x: x,
              y: y,
              type: 'scatter',
              mode: 'lines+markers',
              name: field.name, // Use field name as the trace name
            } as Data;
          });

          setPlotData(newPlotData); // Set the plot data after extraction
        }
      } catch (error) {
        console.error('Error fetching CSV data:', error);
      }
    }

    fetchData();
  }, [loadCsvSettings]); // Fetch data only when loadCsvSettings changes

  useEffect(() => {
    async function setAxesRange(start: Date, end: Date) {
      console.log("Called setAxesRange");
      console.log(`Start: ${start} \n End: ${end}`);
      setLayout((prevLayout) => ({
        ...prevLayout,
        xaxis: {
          ...prevLayout.xaxis,
          autorange: false,
          range: [toZonedTime(start, "UTC"), toZonedTime(end, "UTC")],
        },
        transition: {
          duration: 1000,
          easing: 'cubic-in-out',
        },
      }));
    }

    // Set up the event listener for video time changes
    async function setupListener() {
      const unlisten = await listen<number>('video-time-change', (event) => {
        if (!videoStartTime) {
          console.log("video-start-time listener event ignored") 
          return;
        }

        console.log("Video Time Change Listener Internal Calls:")
        console.log(`    Video time is now ${event.payload} seconds from the beginning.`);
        // console.log("    videoStartTime:", videoStartTime);
        // console.log("    typeof videoStartTime:", typeof(videoStartTime));
        // console.log("    Event payload -10:", -10 + event.payload);
        // console.log("    Event payload +10:", 10 + event.payload);
        // console.log("    addSeconds -10", addSeconds(videoStartTime, -10 + event.payload))
        // console.log("    addSeconds +10", addSeconds(videoStartTime, 10 + event.payload))

        setAxesRange(
          addSeconds(videoStartTime, -10 + event.payload),
          addSeconds(videoStartTime, 10 + event.payload)
        );
      });

      // Clean up the event listener when the component is unmounted
      return () => {
        console.log("video-time-change listener torn down")
        unlisten(); // Properly clean up listener
      };
    }

    if (videoStartTime) {
      console.log("Video Time Change Listener Setup")
      setupListener();
    }

  }, [videoStartTime]); // Set up listener only when videoStartTime changes

  const handleRelayout = (eventData: any) => {
    console.log("Relayout noted:", eventData);
  };

  // Adds seconds to a JS date object.
  function addSeconds(date: Date, seconds: number) {
    console.log("Called add seconds");
    console.log("    addSeconds Date:", date);
    const newDate = new Date(date.getTime() + seconds * 1000);
    console.log("    New Date:", newDate)
    return newDate
  }

  if (!csvTable) return <div>Loading...</div>;

  return (
    <div className="container">
      {plotData && <Plot
        data={plotData}
        layout={layout}
        onRelayout={handleRelayout}
      />}
    </div>
  );
}

export default Plotter;
