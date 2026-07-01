"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLogIPC = registerLogIPC;
const electron_1 = require("electron");
const logger_1 = require("../logger");
const constants_1 = require("../../shared/constants");
function registerLogIPC() {
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.GET_LOG_ENTRIES, async () => {
        return logger_1.logger.getEntries();
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.EXPORT_LOGS, async (_event, format) => {
        return logger_1.logger.exportLogs(format);
    });
    electron_1.ipcMain.handle(constants_1.IPC_CHANNELS.CLEAR_LOGS, async () => {
        logger_1.logger.clear();
        return true;
    });
    logger_1.logger.info('IPC', 'Log IPC handlers registered');
}
