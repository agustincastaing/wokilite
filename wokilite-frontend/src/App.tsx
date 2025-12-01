import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { theme } from './theme';
import Layout from './components/layout';
import Home from './pages/home';
import Reservations from './pages/reservations';
import FloorPlanPage from './components/floorplan';
import TimelinePage from './components/timeline';
  
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/floor-plan" element={<FloorPlanPage
              onTableClick={(table) => console.log(table)}
              />} />
              <Route path="/timeline" element={<TimelinePage />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;