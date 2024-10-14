import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import {Table, tableFromIPC} from "apache-arrow";

function Plotter() {
  const [plotData, setPlotData] = useState<Table | null>(null);

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

    // Set up the event listener for video time changes, ensuring it only runs once
    const unlisten = listen<number>('video-time-change', (event) => {
      console.log(
        `Video time is now ${event.payload} seconds from the beginning.`
      );
      console.log(event);
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

  const handleRelayout = (eventData: any) => {
    console.log(eventData);
  };

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
        layout={{
          width: 640,
          height: 480,
          title: 'Data Plot',
        }}
        onRelayout={handleRelayout}
      />
    </div>
    );
  }
  
  export default Plotter;
  