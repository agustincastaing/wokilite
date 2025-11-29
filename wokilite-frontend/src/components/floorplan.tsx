// src/components/FloorPlan.tsx
import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Tooltip,
    Paper,
    CircularProgress,
    Alert,
    Container,
    Switch,
    FormControlLabel,
    MenuItem,
    TextField,
    Select,
} from '@mui/material';
import { api } from '../api/client';
import type { Restaurant } from '../entities/restaurant.entity';
import { DateTime } from 'luxon';

interface Table {
    id: string;
    name: string;
    minSize: number;
    maxSize: number;
    isOccupied: boolean;
    currentReservation?: {
        customerName: string;
        time: string;
        partySize: number;
    };
}

interface FloorPlanProps {
    onTableClick?: (table: Table) => void;
}

export default function FloorPlan({
    onTableClick,
}: FloorPlanProps) {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
    const [selectedSector, setSelectedSector] = useState<string>('');
    const [date, setDate] = useState(DateTime.now().toISODate());
    const [slots, setSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState<string>('');

    const GRID_SIZE = 10;
    const CELL_SIZE = 60;

    const getTableDimensions = (size: number) => {
        if (size <= 2) {
            return 50;
        } else if (size <= 4) {
            return 65;
        } else if (size <= 6) {
            return 85;
        } else {
            return 50;
        }
    };

    const getTablePosition = (index: number) => {
        const COLS = 3;
        const col = index % COLS;
        const row = Math.floor(index / COLS);
        const x = col * 3 + 1;
        const y = row * 3 + 1;
        return { x, y };
    };

    // Fetch restaurants on mount
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const response = await api.getRestaurants();
                setRestaurants(response.data.restaurants);
                if (response.data.restaurants.length > 0) {
                    setSelectedRestaurant(response.data.restaurants[0].id);
                    setSelectedSector(response.data.restaurants[0].sectors[0].id)
                }
            } catch (err) {
                setError('Failed to load restaurants');
            }
        };
        fetchRestaurants();
    }, []);


    const fetchFloorPlan = async () => {
        try {
            const response: any = await api.getFloorPlan(
                selectedRestaurant,
                selectedSector,
                date,
                selectedTime !== '' ? selectedTime : undefined
            );
            if (response.data) {
                setTables(response.data.tables);
                setLastUpdated(new Date().toLocaleTimeString());
                setSlots(response.data.slots)
                setError(null);
            } else {
                setError(response.error || 'Failed to load floor plan');
            }
        } catch (err) {
            console.error('Floor plan fetch error:', err);
            setError('Unable to connect to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFloorPlan();

        const startPolling = () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

            // Poll every 30 seconds
            pollIntervalRef.current = setInterval(() => {
                if (autoRefresh) {
                    fetchFloorPlan();
                }
            }, 15000);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
            } else {
                startPolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        startPolling();

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [selectedRestaurant, selectedSector, autoRefresh, date, selectedTime ]);

    const getTableColor = (table: Table) => {
        return table.isOccupied ? '#E74C3C' : '#27AE60';
    };

    const getTableStatus = (table: Table) => {
        if (table.isOccupied) {
            return `${table.currentReservation?.customerName} (${table.currentReservation?.time})`;
        }
        return `Available • ${table.minSize}-${table.maxSize} pax`;
    };

    const currentRestaurant = restaurants.find(r => r.id === selectedRestaurant);

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Card>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
                                Sector
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
                        <Box sx={{ minWidth: 200 }}>
                            <Typography variant="body2" sx={{ display: 'block', mb: 1, fontWeight: 500 }}>
                                Hora
                            </Typography>
                            <Select
                                fullWidth
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                displayEmpty
                                renderValue={(selected) => {
                                    if (!selected) return 'Seleccionar hora';
                                    return `${DateTime.fromISO(selected as string).toFormat('HH:mm')}hs`;
                                }}
                            >
                                {slots.length === 0 ? (
                                    <MenuItem disabled>
                                        <em>No hay horarios disponibles</em>
                                    </MenuItem>
                                ) : (
                                    slots.map((iso) => (
                                        <MenuItem key={iso} value={iso}>
                                            {DateTime.fromISO(iso).toFormat('HH:mm')}hs
                                        </MenuItem>
                                    ))
                                )}
                            </Select>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                            {lastUpdated ? `Updated: ${lastUpdated}` : 'Loading...'}
                        </Typography>
                        <FormControlLabel
                            control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
                            label="Auto-refresh"
                        />
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {/* Floor Plan Canvas */}
                <Paper
                    variant="outlined"
                    sx={{
                        position: 'relative',
                        width: GRID_SIZE * CELL_SIZE,
                        height: GRID_SIZE * CELL_SIZE,
                        backgroundColor: '#F8F9FA',
                        border: '2px solid #ECF0F1',
                        borderRadius: 2,
                        overflow: 'hidden',
                        mx: 'auto',
                    }}
                >
                    {/* Grid background */}
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: `
                linear-gradient(0deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent),
                linear-gradient(90deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent)
              `,
                            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
                            opacity: 0.3,
                        }}
                    />

                    {/* Tables */}
                    {tables.map((table, index) => {
                        const tableDimension = getTableDimensions(table.maxSize);
                        const { x, y } = getTablePosition(index);

                        return (
                            <Tooltip
                                key={table.id}
                                title={
                                    <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {table.name}
                                        </Typography>
                                        <Typography variant="caption">{getTableStatus(table)}</Typography>
                                    </Box>
                                }
                                arrow
                                placement="top"
                            >
                                <Box
                                    onClick={() => onTableClick?.(table)}
                                    sx={{
                                        position: 'absolute',
                                        left: `${x * CELL_SIZE + (CELL_SIZE - tableDimension) / 2}px`,
                                        top: `${y * CELL_SIZE + (CELL_SIZE - tableDimension) / 2}px`,
                                        width: tableDimension,
                                        height: tableDimension,
                                        borderRadius: '20%',
                                        backgroundColor: getTableColor(table),
                                        border: '3px solid white',
                                        boxShadow: table.isOccupied
                                            ? '0 4px 12px rgba(231, 76, 60, 0.3)'
                                            : '0 2px 8px rgba(39, 174, 96, 0.2)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: onTableClick ? 'pointer' : 'default',
                                        transition: 'all 0.2s ease',
                                        '&:hover': onTableClick
                                            ? {
                                                transform: 'scale(1.1)',
                                                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                                            }
                                            : {},
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 700,
                                            color: 'white',
                                            textAlign: 'center',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {table.name}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        );
                    })}
                </Paper>

                {/* Legend */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: '#27AE60',
                            }}
                        />
                        <Typography variant="body2">Available</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                            sx={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: '#E74C3C',
                            }}
                        />
                        <Typography variant="body2">Occupied</Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}