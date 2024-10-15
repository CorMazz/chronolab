import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import {Table, tableFromIPC} from "apache-arrow";

function Plotter() {
  const [videoStartTime, setVideoStartTime] = useState<Date | null>(null);
  const [plotData, setPlotData] = useState<Table | null>(null);
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
        const parsedData = tableFromIPC(await invoke('get_csv_data'));
        console.log("Parsed Data");
        setPlotData(parsedData);
      } catch (error) {
        console.error('Error fetching CSV data:', error);
      }
    }

    fetchData();

    const temp = plotData?.getChild('timestamp')?.toArray() ?? []
    setVideoStartTime(new Date(Number(temp[0])));

    // Set up the event listener for video time changes, ensuring it only runs once
    const unlisten = listen<number>('video-time-change', (event) => {
      console.log(
        `Video time is now ${event.payload} seconds from the beginning.`
      );
      console.log(event);

      setAxesRange(add_seconds(new Date(Number(temp[0])), -10 + event.payload), add_seconds(new Date(Number(temp[0])), 10 + event.payload))

    });

    // Clean up the event listener when the component is unmounted
    return () => {
      unlisten.then((dispose) => dispose());
    };
  }, []); 
  if (!plotData) return <div>Loading...</div>;

  // https://stackoverflow.com/questions/77598389/how-to-access-arrow-data-in-js
  const x = plotData.getChild('timestamp')?.toArray() ?? []; 
  const y = plotData.getChild('power')?.toArray() ?? [];

  async function setAxesRange(start: Date, end: Date) {
    console.log("Called setAxesRange");
    console.log(`Start: ${start} \n End: ${end}`);
    setLayout((prevLayout) => ({
      ...prevLayout,
      xaxis: {
        ...prevLayout.xaxis,
        autorange: false,
        range: [start, end],
      },
      transition: { // Stop the plot from jumping from one state to the next
        duration: 1000,
        easing: 'cubic-in-out', // Easing function for smoothness
      },
    }))
  }

  const handleRelayout = (eventData: any) => {
    console.log(eventData);
  };

  // Adds seconds to a JS date object. 
  // https://stackoverflow.com/questions/7687884/add-10-seconds-to-a-date
  // https://stackoverflow.com/questions/1197928/how-to-add-30-minutes-to-a-javascript-date-object
  // Decided to not use a standalone library because this is all I need
  function add_seconds(date: Date, seconds: number) {
    return new Date(date.getTime() + seconds * 1000)
  }

    return (
      <div className="container">
      <Plot
        data={[
          {
            x: Array.from(x, ts => new Date(Number(ts))),
            y: y,
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: 'red' },
          },
        ]}
        layout={layout}
        onRelayout={handleRelayout}
      />
    </div>
    );
  }
  
  export default Plotter;
  