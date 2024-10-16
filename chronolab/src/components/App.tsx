import Menu from './Menu';
import VideoPlayer from './VideoPlayer';
import Plotter from './Plotter';
import useGlobalState from '../hooks/useGlobalState';

function App() {

  const {isMultiwindow} = useGlobalState({
    csvFile: false,
    videoFile: false,
    isMultiwindow: true,
});

  return (
    <div>
      <Menu/>
      <VideoPlayer/>
      {!isMultiwindow && <Plotter/>}
    </div>
  );
}

export default App;
