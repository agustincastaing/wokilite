// src/pages/Reservations.tsx
import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import { api } from '../api/client';
import { DateTime } from 'luxon';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Restaurant } from '../entities/restaurant.entity';

interface Reservation {
  id: string;
  sectorId: string;
  tableIds: string[];
  partySize: number;
  start: string;
  end: string;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED';
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function Reservations() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [date, setDate] = useState(DateTime.now().toISODate());
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch restaurants on mount
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.getRestaurants();
        setRestaurants(response.data.restaurants);
        if (response.data.restaurants.length > 0) {
          setSelectedRestaurant(response.data.restaurants[0].id);
        }
      } catch (err) {
        setError('Failed to load restaurants');
      }
    };
    fetchRestaurants();
  }, []);

  // Set first sector when restaurant changes
  useEffect(() => {
    const restaurant = restaurants.find(r => r.id === selectedRestaurant);
    if (restaurant?.sectors && restaurant.sectors.length > 0) {
      setSelectedSector(restaurant.sectors[0].id);
    }
  }, [selectedRestaurant, restaurants]);

  // Fetch reservations for the day
  const handleLoadReservations = async () => {
    if (!selectedRestaurant || !date) {
      setError('Please select a restaurant and date');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.getReservationsForDay(
        selectedRestaurant,
        date,
        selectedSector || undefined
      );
      setReservations(response.data.items || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load on mount and when filters change
  useEffect(() => {
    if (selectedRestaurant && date) {
      handleLoadReservations();
    }
  }, [selectedRestaurant, date, selectedSector]);

  // Delete reservation
  const handleDeleteClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReservation) return;

    setDeleting(true);
    try {
      await api.cancelReservation(selectedReservation.id);
      setReservations(r => r.filter(res => res.id !== selectedReservation.id));
      setDeleteDialogOpen(false);
      setSelectedReservation(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel reservation');
    } finally {
      setDeleting(false);
    }
  };

  const currentRestaurant = restaurants.find(r => r.id === selectedRestaurant);
  const confirmedReservations = reservations.filter(r => r.status === 'CONFIRMED');

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        📋 Daily Reservations
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
            Restaurante
          </Typography>
          <Select
            fullWidth
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
          >
            {restaurants.map(r => (
              <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
            Sector (Opcional)
          </Typography>
          <Select
            fullWidth
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
          >
            <MenuItem value="">All Sections</MenuItem>
            {currentRestaurant?.sectors?.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </Select>
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="body2" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
            Fecha
          </Typography>
          <TextField
            fullWidth
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Box>
        
      </Box>

      {/* Reservations Count */}
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {confirmedReservations.length} reservations on {DateTime.fromISO(date).toFormat('MMM dd, yyyy')}
      </Typography>

      {/* Reservations Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell align="center"><strong>Hora</strong></TableCell>
                <TableCell align="center"><strong>Sector</strong></TableCell>
                <TableCell align="center"><strong>Mesa</strong></TableCell>
                <TableCell align="center"><strong>Cantidad</strong></TableCell>
                <TableCell align="center"><strong>Nombre</strong></TableCell>
                <TableCell align="center"><strong>Telefono</strong></TableCell>
                <TableCell align="center"><strong>Email</strong></TableCell>
                <TableCell align="center"><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Detalles</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {confirmedReservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      No reservations for this date
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                confirmedReservations.map(res => (
                  <TableRow key={res.id} hover>
                    <TableCell>
                      {DateTime.fromISO(res.start).toFormat('HH:mm')}
                    </TableCell>
                    <TableCell>
                      {currentRestaurant?.sectors?.find(s => s.id === res.sectorId)?.name}
                    </TableCell>
                    <TableCell>{res.tableIds.join(', ')}</TableCell>
                    <TableCell>{res.partySize}</TableCell>
                    <TableCell>{res.customer.name}</TableCell>
                    <TableCell>{res.customer.phone}</TableCell>
                    <TableCell>{res.customer.email}</TableCell>
                    <TableCell>
                      <Chip label={res.status} color="primary" size="small" />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDeleteClick(res)}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Cancel Reservation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the reservation for{' '}
            <strong>{selectedReservation?.customer.name}</strong> on{' '}
            <strong>{selectedReservation && DateTime.fromISO(selectedReservation.start).toFormat('HH:mm')}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>No, Keep It</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Yes, Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}