"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
// very small logger wrapper for now; can be replaced with Winston/Pino later
exports.logger = {
    info: (msg, ...meta) => {
        // eslint-disable-next-line no-console
        console.log(msg, ...meta);
    },
    error: (msg, ...meta) => {
        // eslint-disable-next-line no-console
        console.error(msg, ...meta);
    },
};
//# sourceMappingURL=logger.js.map