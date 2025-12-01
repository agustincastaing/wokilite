import { AppBar, Toolbar, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ flex: 1 }}>
            <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Box sx={{ fontWeight: 'bold', fontSize: 20 }}>🍽️ WokiLite</Box>
            </RouterLink>
          </Box>
          <Button color="inherit" component={RouterLink} to="/">
            Nueva Reserva
          </Button>
          <Button color="inherit" component={RouterLink} to="/reservations">
            Reservas
          </Button>
          <Button color="inherit" component={RouterLink} to="/floor-plan">
            Plano
          </Button>
          <Button color="inherit" component={RouterLink} to="/timeline">
            Vista Diaria
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main">{children}</Box>
    </>
  );
}