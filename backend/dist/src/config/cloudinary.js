"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const env_1 = require("./env");
cloudinary_1.v2.config({
    cloud_name: env_1.env.cloudinaryCloudName,
    api_key: env_1.env.cloudinaryApiKey,
    api_secret: env_1.env.cloudinaryApiSecret,
});
//# sourceMappingURL=cloudinary.js.map