import { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { invoke } from "@tauri-apps/api/core";
import {Table, tableFromIPC} from "apache-arrow";

function Plotter() {
  const [plotData, setPlotData] = useState<Table | null>(null);

  useEffect(() => {
    // Fetch the JSON data from the backend
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
  }, []);

  if (!plotData) return <div>Loading...</div>;

  // https://stackoverflow.com/questions/77598389/how-to-access-arrow-data-in-js
  const x = plotData.getChild('timestamp')?.toArray() ?? []; 
  const y = plotData.getChild('power')?.toArray() ?? [];

  console.log("\n\n\nHere are x and y.")
  console.log(x.length)
  for (let i = 0; i < 5; i++) {
    console.log(`(${new Date(Number(x[i]))}, ${y[i]})`);
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
          layout={{ width: 640, height: 480, title: 'Data Plot', }}
        />
      </div>
    );
  }
  
  export default Plotter;
  