import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import type { PathConfig } from '../../shared/types';

class PathManager {
  private config: PathConfig | null = null;
  private configPath = '';

  initialize() {
    this.configPath = path.join(app.getPath('userData'), 'path-config.json');
    this.config = this.loadConfig();
    this.ensureDirectories();
  }

  private loadConfig(): PathConfig {
    const defaults = this.getDefaults();
    
    if (fs.existsSync(this.configPath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        return { ...defaults, ...saved };
      } catch {
        return defaults;
      }
    }
    
    return defaults;
  }

  private getDefaults(): PathConfig {
    const userData = app.getPath('userData');
    const userHome = app.getPath('home');
    
    return {
      logs: path.join(userData, 'logs'),
      recordings: path.join(userHome, 'Recordings'),
      config: path.join(userData, 'config.json'),
      temp: path.join(app.getPath('temp'), 'AVMonitor'),
    };
  }

  private ensureDirectories() {
    if (!this.config) return;
    
    const dirs = [
      this.config.logs,
      this.config.recordings,
      this.config.temp,
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  get(key: keyof PathConfig): string {
    if (!this.config) throw new Error('PathManager not initialized');
    return this.config[key];
  }

  set(key: keyof PathConfig, value: string) {
    if (!this.config) throw new Error('PathManager not initialized');
    this.config[key] = value;
    this.save();
    this.ensureDirectories();
  }

  reset() {
    this.config = this.getDefaults();
    this.save();
    this.ensureDirectories();
  }

  getAll(): PathConfig {
    if (!this.config) throw new Error('PathManager not initialized');
    return { ...this.config };
  }

  private save() {
    if (!this.config) return;
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }
}

export const pathManager = new PathManager();
