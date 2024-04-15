"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.flatConfig = void 0;
const eslintrc_1 = require("@eslint/eslintrc");
const js_1 = __importDefault(require("@eslint/js"));
const config_1 = require("./config.js");
// import path from 'path'
// import { fileURLToPath } from 'url'
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
const compat = new eslintrc_1.FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js_1.default.configs.recommended,
});
/**
 * This is a custom ESLint configuration. It extends the recommended ESLint configuration and adds some custom rules.
 *
 * @author Leandro Matos
 * @see {@link https://github.com/leandromatos/eslint-config GitHub} for more information.
 */
exports.flatConfig = [...compat.config(config_1.config)];
