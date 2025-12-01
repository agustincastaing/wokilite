import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Tooltip,
} from '@mui/material';
import { api } from '../api/client';
import { DateTime } from 'luxon';

interface Table {
  id: string;
  name: string;
  minSize: number;
  maxSize: number;
}

interface Restaurant {
  id: string;
  name: string;
  sectors: { id: string; name: string }[];
}

export default function TableTimelineView() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [date, setDate] = useState(DateTime.now().toISODate());
  const [tables, setTables] = useState<Table[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [availabilityMatrix, setAvailabilityMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant && selectedSector && date) {
      loadTableAvailability();
    }
  }, [selectedRestaurant, selectedSector, date]);

  const loadRestaurants = async () => {
    try {
      const response = await api.getRestaurants();
      setRestaurants(response.data.restaurants);
      if (response.data.restaurants.length > 0) {
        setSelectedRestaurant(response.data.restaurants[0].id);
        setSelectedSector(response.data.restaurants[0].sectors[0].id);
      }
    } catch (err) {
      setError('Failed to load restaurants');
    }
  };

  const loadTableAvailability = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch availability to get tables list
      const response = await api.getAvailability(
        selectedRestaurant,
        selectedSector,
        date!,
        2 // at the moment table T4 will not be shown because it's min size is 4 and the party size is 2
        // can be fixed but not as per the requirements
      );

      // Extract unique time slots
      const slots = response.data.slots.map((s: any) => 
        DateTime.fromISO(s.start).toFormat('HH:mm')
      );
      setTimeSlots(slots);

      // Get unique table IDs from all slots
      const tableSet = new Set<string>();
      response.data.slots.forEach((slot: any) => {
        if (slot.tables) {
          slot.tables.forEach((tableId: string) => tableSet.add(tableId));
        }
      });

      const allTables = Array.from(tableSet).map(id => ({
        id,
        name: id,
        minSize: 2,
        maxSize: 6, //hardcoded at the moment, cant get this data from the API without changing the endpoint response specifications
      }));
      setTables(allTables);

      // Build availability matrix: matrix[tableId][timeSlot] = boolean
      const matrix: Record<string, Record<string, boolean>> = {};
      
      allTables.forEach(table => {
        matrix[table.id] = {};
      });

      response.data.slots.forEach((slot: any) => {
        const time = DateTime.fromISO(slot.start).toFormat('HH:mm');
        
        allTables.forEach(table => {
          // Table is available if it's in the slot's available tables list
          matrix[table.id][time] = slot.tables?.includes(table.id) || false;
        });
      });

      setAvailabilityMatrix(matrix);
    } catch (err) {
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const currentRestaurant = restaurants.find(r => r.id === selectedRestaurant);

  if (loading && tables.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          📊 Vista de Disponibilidad por Mesa
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ minWidth: 200 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              RESTAURANTE
            </Typography>
            <Select
              fullWidth
              value={selectedRestaurant}
              onChange={(e) => {
                setSelectedRestaurant(e.target.value);
                const newRestaurant = restaurants.find(r => r.id === e.target.value);
                if (newRestaurant?.sectors?.length && newRestaurant.sectors.length > 0) {
                  setSelectedSector(newRestaurant.sectors[0].id);
                }
              }}
            >
              {restaurants.map(r => (
                <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ minWidth: 200 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              SECTOR
            </Typography>
            <Select
              fullWidth
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              {currentRestaurant?.sectors?.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ minWidth: 200 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              FECHA
            </Typography>
            <TextField
              fullWidth
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Chip 
            label="Disponible" 
            sx={{ bgcolor: '#27AE60', color: 'white' }} 
          />
          <Chip 
            label="Ocupado" 
            sx={{ bgcolor: '#E74C3C', color: 'white' }} 
          />
        </Box>

        {/* Timeline Grid */}
        <Paper 
          elevation={0} 
          sx={{ 
            overflowX: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 2,
          }}
        >
          <Box sx={{ minWidth: 800 }}>
            {/* Header Row */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: `120px repeat(${timeSlots.length}, 50px)`,
              borderBottom: '2px solid #e0e0e0',
              bgcolor: '#f5f5f5',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}>
              <Box sx={{ 
                p: 1.5, 
                fontWeight: 'bold',
                borderRight: '1px solid #e0e0e0',
              }}>
                Mesa / Hora
              </Box>
              {timeSlots.map(slot => (
                <Box 
                  key={slot}
                  sx={{ 
                    p: 1, 
                    fontSize: '0.7rem',
                    textAlign: 'center',
                    borderRight: '1px solid #e0e0e0',
                    writingMode: slot.endsWith(':00') ? 'horizontal-tb' : 'vertical-rl',
                    transform: slot.endsWith(':00') ? 'none' : 'rotate(180deg)',
                    fontWeight: slot.endsWith(':00') ? 'bold' : 'normal',
                  }}
                >
                  {slot}
                </Box>
              ))}
            </Box>

            {/* Table Rows */}
            {tables.map((table) => (
              <Box 
                key={table.id}
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: `120px repeat(${timeSlots.length}, 50px)`,
                  borderBottom: '1px solid #e0e0e0',
                  '&:hover': { bgcolor: '#f9f9f9' },
                }}
              >
                {/* Table Name */}
                <Box sx={{ 
                  p: 1.5, 
                  fontWeight: 600,
                  borderRight: '2px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {table.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {table.minSize}-{table.maxSize} pax
                    </Typography>
                  </Box>
                </Box>

                {/* Time Slot Cells */}
                {timeSlots.map(slot => {
                  const isAvailable = availabilityMatrix[table.id]?.[slot];
                  return (
                    <Tooltip 
                      key={slot}
                      title={`${table.name} - ${slot} - ${isAvailable ? 'Disponible' : 'Ocupado'}`}
                      arrow
                    >
                      <Box
                        sx={{
                          bgcolor: isAvailable ? '#27AE60' : '#E74C3C',
                          borderRight: '1px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            opacity: 0.8,
                            transform: 'scale(1.1)',
                            zIndex: 10,
                          },
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Paper>

        {tables.length === 0 && !loading && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No hay mesas disponibles para los filtros seleccionados
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          💡 Pasa el mouse sobre las celdas para ver detalles. Verde = disponible, Rojo = ocupado.
        </Typography>
      </CardContent>
    </Card>
  );
}