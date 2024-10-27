import NavigationBar from './NavigationBar';
import VideoPlayer from './VideoPlayer';
import useGlobalState from '../hooks/useGlobalState';
import PlotSettings from './PlotSettings';
import Plotter from './Plotter';
import ViewMenu from './menu-components/ViewMenu';
import { Box } from '@mui/material';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useEffect, useState } from 'react';

const ResponsiveGridLayout = WidthProvider(Responsive);
type LayoutType = 'side-by-side-plot-left' | 'side-by-side-video-left' | 'stacked-video-top' | 'stacked-plot-top';

function App() {
  const { isMultiwindow, loadCsvSettings } = useGlobalState({
    csvFile: false,
    loadCsvSettings: true,
    videoFile: false,
    isMultiwindow: true,
  });

  const [currentLayout, setCurrentLayout] = useState<LayoutType>('side-by-side-plot-left');

  // Calculate row height based on viewport height
  // Subtracting navbar height (48px) and padding (40px)
  const calculateRowHeight = () => {
      return (window.innerHeight - 88) / 12;
  };

  const [rowHeight, setRowHeight] = useState(calculateRowHeight());

  useEffect(() => {
      const handleResize = () => {
          setRowHeight(calculateRowHeight());
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Define layouts for each configuration
  const getLayoutConfig = (layout: LayoutType) => {
      switch (layout) {
          case 'side-by-side-plot-left':
              return {
                  lg: [
                      { i: 'plot', x: 0, y: 0, w: 6, h: 9, minW: 3, maxW: 9 },
                      { i: 'video', x: 6, y: 0, w: 6, h: 9, minW: 3, maxW: 9 }
                  ]
              };
          case 'side-by-side-video-left':
              return {
                  lg: [
                      { i: 'video', x: 0, y: 0, w: 6, h: 9, minW: 3, maxW: 9 },
                      { i: 'plot', x: 6, y: 0, w: 6, h: 9, minW: 3, maxW: 9 }
                  ]
              };
          case 'stacked-video-top':
              return {
                  lg: [
                      { i: 'video', x: 0, y: 0, w: 12, h: 6, minW: 6, maxW: 12 },
                      { i: 'plot', x: 0, y: 6, w: 12, h: 6, minW: 6, maxW: 12 }
                  ]
              };
          case 'stacked-plot-top':
              return {
                  lg: [
                      { i: 'plot', x: 0, y: 0, w: 12, h: 6, minW: 6, maxW: 12 },
                      { i: 'video', x: 0, y: 6, w: 12, h: 6, minW: 6, maxW: 12 }
                  ]
              };
      }
  };

  return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <NavigationBar>
              <ViewMenu 
                  currentLayout={currentLayout} 
                  onLayoutChange={setCurrentLayout}
              />
          </NavigationBar>
          
          <div style={{ 
              flex: 1,
              overflow: 'auto',
              padding: '20px',
          }}>
              <ResponsiveGridLayout
                  className="layout"
                  layouts={getLayoutConfig(currentLayout)}
                  breakpoints={{ lg: 1200 }}
                  cols={{ lg: 12 }}
                  rowHeight={rowHeight}
                  width={window.innerWidth - 40} // Subtract padding
                  margin={[20, 20]}
                  isDraggable={true}
                  isResizable={true}
                  useCSSTransforms={true}
                  onResize={() => window.dispatchEvent(new Event('resize'))}
                  draggableHandle='.drag-handle'
              >
                  <Box
                      key="video"
                      sx={{
                          border: '1px solid #ccc',
                          borderRadius: 2,
                          height: '100%',
                          overflow: 'auto',
                          display: 'flex',
                          flexDirection: 'column'
                      }}
                  >
                        <Box 
                            className="drag-handle"
                            sx={{
                                height: '24px',
                                backgroundColor: '#f5f5f5',
                                borderBottom: '1px solid #ccc',
                                cursor: 'move',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 8px'
                            }}
                        ></Box>
                      <VideoPlayer />
                  </Box>
                  
                  <Box
                      key="plot"
                      sx={{
                          border: '1px solid #ccc',
                          borderRadius: 2,
                          height: '90%',
                          overflow: 'auto',
                          display: 'flex',
                          flexDirection: 'column'
                      }}
                  >
                        <Box 
                            className="drag-handle"
                            sx={{
                                height: '24px',
                                backgroundColor: '#f5f5f5',
                                borderBottom: '1px solid #ccc',
                                cursor: 'move',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 8px'
                            }}
                        ></Box>
                      {!isMultiwindow && (loadCsvSettings ? <Plotter /> : <PlotSettings />)}
                  </Box>
              </ResponsiveGridLayout>
          </div>
      </div>
  );
}

export default App;
