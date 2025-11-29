// src/pages/Home.tsx
import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { api } from '../api/client';
import { DateTime } from 'luxon';

interface Restaurant {
  id: string;
  name: string;
  timezone: string;
  shifts?: Array<{ start: string; end: string }>;
  sectors: Sector[];
}

interface Sector {
  id: string;
  name: string;
  maxCapacity?: number;
}

interface AvailabilitySlot {
  start: string;
  available: boolean;
  tables?: string[];
  reason?: string;
}

export default function Home() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [date, setDate] = useState(DateTime.now().toISODate());
  const [partySize, setPartySize] = useState<number>(2);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState(0)


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
      const selectedSectorObj = restaurant.sectors.find(s => s.name === selectedSector);
      setMaxCapacity(selectedSectorObj?.maxCapacity || 6);
    }
  }, [selectedRestaurant, restaurants]);

  const handleSectorChange = (sector: string) => {
    setSelectedSector(sector);
    const restaurant = restaurants.find(r => r.id === selectedRestaurant);
    const selectedSectorObj = restaurant?.sectors?.find(s => s.id === sector);
    setMaxCapacity(selectedSectorObj?.maxCapacity || 6);
  }

  // Fetch availability
  const handleCheckAvailability = async () => {
    if (!selectedRestaurant || !selectedSector || !date || !partySize) {
      setError('Completar todos los campos');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.getAvailability(
        selectedRestaurant,
        selectedSector,
        date,
        partySize
      );
      setSlots(response.data.slots);
      setSelectedSlot('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  // Create reservation
  const handleReserve = async () => {
    if (!selectedSlot || !customerName || !customerPhone || !customerEmail) {
      setError('Completar todos los campos');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.createReservation({
        restaurantId: selectedRestaurant,
        sectorId: selectedSector,
        partySize,
        startDateTimeISO: selectedSlot,
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
        },
      });
      setSuccess(true);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setSelectedSlot('');
      handleCheckAvailability()
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const currentRestaurant = restaurants.find(r => r.id === selectedRestaurant);
  const availableSlots = slots.filter(s => s.available);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        🍽️ Reservar
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Reserva creada exitosamente!</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        {/* Selection Panel */}
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detalles de reserva
              </Typography>

              {/* Restaurant */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  RESTAURANTE
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

              {/* Sector */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  SECTOR
                </Typography>
                <Select
                  fullWidth
                  value={selectedSector}
                  onChange={(e) => handleSectorChange(e.target.value)}
                >
                  {currentRestaurant?.sectors?.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Date */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  ¿QUE DIA?
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              {/* Party Size */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                  ¿CUÁNTAS PERSONAS? {maxCapacity > 0? `(Max ${maxCapacity})`: ''}
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  defaultValue={maxCapacity}
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value) || 0)}
                  slotProps={{
                    input: {
                      inputProps: {
                        min: 1,
                        max: maxCapacity,
                      },
                    },
                  }}
                />
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={handleCheckAvailability}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Ver turnos'}
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Availability & Customer Info */}
        <Box>
          {slots.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ¿QUE HORARIO? ({availableSlots.length})
                </Typography>
                <Box
                  sx={{
                    maxHeight: 310,
                    overflowY: 'auto',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 1.5,
                    mx: { xs: 0, sm: 0 },
                  }}
                >
                  {availableSlots.map(slot => (
                    <Button
                      key={slot.start}
                      variant={selectedSlot === slot.start ? 'contained' : 'outlined'}
                      onClick={() => setSelectedSlot(slot.start)}
                      sx={{
                        minWidth: 110,
                        flex: { xs: '0 0 calc(50% - 12px)', sm: '0 0 calc(33.333% - 16px)' },
                      }}
                    >
                      {DateTime.fromISO(slot.start).toFormat('HH:mm')}hs
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Customer Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Detalles del comensal
              </Typography>

              <TextField
                fullWidth
                label="Nombre"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Telefono"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={handleReserve}
                disabled={!selectedSlot || submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Reservar'}
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}