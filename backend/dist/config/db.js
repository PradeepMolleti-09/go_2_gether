"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
const connectDb = async () => {
    try {
        await mongoose_1.default.connect(env_1.env.mongoUri);
        // eslint-disable-next-line no-console
        console.log("MongoDB connected");
    }
    catch (err) {
        // eslint-disable-next-line no-console
        console.error("MongoDB connection error", err);
        process.exit(1);
    }
};
exports.connectDb = connectDb;
//# sourceMappingURL=db.js.map