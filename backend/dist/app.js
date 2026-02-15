"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const roomRoutes_1 = __importDefault(require("./routes/roomRoutes"));
const tripRoutes_1 = __importDefault(require("./routes/tripRoutes"));
const mediaRoutes_1 = __importDefault(require("./routes/mediaRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const createApp = () => {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: env_1.env.clientOrigin,
        credentials: true,
    }));
    app.use((0, helmet_1.default)());
    app.use((0, morgan_1.default)("dev"));
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use((0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 100,
    }));
    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });
    app.use("/auth", authRoutes_1.default);
    app.use("/rooms", roomRoutes_1.default);
    app.use("/trips", tripRoutes_1.default);
    app.use("/media", mediaRoutes_1.default);
    app.use("/reports", reportRoutes_1.default);
    app.use("/expenses", expenseRoutes_1.default);
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.createApp = createApp;
//# sourceMappingURL=app.js.map