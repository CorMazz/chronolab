import { createContext, useContext, useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { invoke } from "@tauri-apps/api/core";
import { listen } from '@tauri-apps/api/event';
import {Table, tableFromIPC} from "apache-arrow";
import useGlobalState, { LoadCsvSettings } from '../hooks/useGlobalState';
import { Data } from 'plotly.js';

function Plotter() {
  const { loadCsvSettings, videoStartTime } = useGlobalState({loadCsvSettings: true, videoStartTime: true})
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
          const x = Array.from(parsedData.getChild(loadCsvSettings?.datetime_index_col)?.toArray() ?? [], ts => new Date(Number(ts)));
              
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


    // Set up the event listener for video time changes, ensuring it only runs once
    const unlisten = listen<number>('video-time-change', (event) => {
      if (!videoStartTime) return;
      console.log(
        `Video time is now ${event.payload} seconds from the beginning.`
      );
      console.log(event);

      setAxesRange(add_seconds(videoStartTime, -10 + event.payload), add_seconds(videoStartTime, 10 + event.payload))

    });

    // Clean up the event listener when the component is unmounted
    return () => {
      unlisten.then((dispose) => dispose());
    };
  }, [loadCsvSettings]); 

  // https://stackoverflow.com/questions/77598389/how-to-access-arrow-data-in-js
  // const x = plotData.getChild('timestamp')?.toArray() ?? []; 
  // const y = plotData.getChild('power')?.toArray() ?? [];

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
  