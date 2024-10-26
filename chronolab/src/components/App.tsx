import NavigationBar from './NavigationBar';
import VideoPlayer from './VideoPlayer';
import useGlobalState from '../hooks/useGlobalState';
import PlotSettings from './PlotSettings';
import Plotter from './Plotter';
import { Box, Container } from '@mui/material';

function App() {

  const {isMultiwindow, loadCsvSettings} = useGlobalState({
    csvFile: false,
    loadCsvSettings: true,
    videoFile: false,
    isMultiwindow: true,
});               

  return (
    <div>
      <NavigationBar/>
      <VideoPlayer/>
      <Container sx={{ mt: 4}}>
        <Box sx={{ border: '1px solid #ccc', borderRadius: 2 }}> 
          {!isMultiwindow && (loadCsvSettings ? (
              <Plotter/> 
            ) : ( 
              <PlotSettings/>
            )
          )}
        </Box>
      </Container>
    </div>
  );
}

export default App;
