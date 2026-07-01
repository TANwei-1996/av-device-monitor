"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSettingsIPC = registerSettingsIPC;
const electron_1 = require("electron");
const logger_1 = require("../logger");
const pathManager_1 = require("../config/pathManager");
const constants_1 = require("../../shared/constants");
// Simple in-memory settings store (persisted via electron-store in production)
let currentSettings = {
    language: 'zh-CN',
    theme: 'dark',
    paths: { logs: '', recordings: '', config: '', temp: '' },
};
function registerSettingsIPC() {
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.GET_SETTINGS, async () => {
        currentSettings.paths = pathManager_1.pathManager.getAll();
        return { ...currentSettings };
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SET_SETTINGS, async (_event, settings) => {
        currentSettings = { ...currentSettings, ...settings };
        logger_1.logger.info('Settings', 'Settings updated', settings);
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.GET_PATHS, async () => {
        return pathManager_1.pathManager.getAll();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.SET_PATH, async (_event, key, value) => {
        pathManager_1.pathManager.set(key, value);
        logger_1.logger.info('Settings', `Path updated: ${key}`, { value });
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.RESET_PATHS, async () => {
        pathManager_1.pathManager.reset();
        logger_1.logger.info('Settings', 'Paths reset to defaults');
    });
    logger_1.logger.info('IPC', 'Settings IPC handlers registered');
}
