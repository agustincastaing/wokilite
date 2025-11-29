"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const pino_1 = require("pino");
const data_1 = require("./data");
const availability_1 = __importDefault(require("./routes/availability"));
const reservations_1 = __importDefault(require("./routes/reservations"));
const restaurants_1 = __importDefault(require("./routes/restaurants"));
const cors_1 = __importDefault(require("cors"));
const logger = (0, pino_1.pino)({ level: 'info' });
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
(0, data_1.seedData)();
app.use((0, cors_1.default)({ origin: 'http://localhost:5173' }));
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use('/restaurants', restaurants_1.default);
app.use('/availability', availability_1.default);
app.use('/reservations', reservations_1.default);
const PORT = 3000;
app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    logger.info('Routes registered: /health, /availability, /reservations, /restaurants');
});
