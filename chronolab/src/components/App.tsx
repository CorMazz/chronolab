import Menu from './Menu';
import VideoPlayer from './VideoPlayer';
import useGlobalState from '../hooks/useGlobalState';
import PlotSettings from './PlotSettings';
import Plotter from './Plotter';
// import Plotter from './Plotter';

function App() {

  const {isMultiwindow, loadCsvSettings} = useGlobalState({
    csvFile: false,
    loadCsvSettings: true,
    videoFile: false,
    isMultiwindow: true,
});

  return (
    <div>
      <Menu/>
      <VideoPlayer/>
      {!isMultiwindow && (loadCsvSettings ? <Plotter/> : <PlotSettings/>)}
    </div>
  );
}

export default App;
