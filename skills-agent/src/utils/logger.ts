/**
 * Simple logger utility
 * In MCP mode, logs to file instead of stdout/stderr
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;
  private logFilePath: string | null = null;
  private isMCPMode: boolean = false;

  constructor() {
    this.level = process.env.DEBUG === 'true' ? LogLevel.DEBUG : LogLevel.INFO;
    
    // Detect MCP mode (when running as stdio server)
    this.isMCPMode = process.env.SKILLS_AGENT_MODE === 'mcp' || 
                     process.argv.includes('--mcp') ||
                     !process.stdout.isTTY;
    
    if (this.isMCPMode) {
      // Use log file in MCP mode
      const logDir = path.join(os.homedir(), '.skills-agent');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.logFilePath = path.join(logDir, 'mcp.log');
    }
  }

  setLevel(level: LogLevel) {
    this.level = level;
  }

  private writeLog(level: string, message: string, args: any[]) {
    const timestamp = new Date().toISOString();
    
    // Serialize args better (handle errors, circular refs, etc.)
    let argsStr = '';
    if (args.length > 0) {
      try {
        argsStr = ' ' + args.map(arg => {
          if (arg instanceof Error) {
            return `${arg.message}\n${arg.stack}`;
          }
          return JSON.stringify(arg, null, 2);
        }).join(' ');
      } catch (e) {
        argsStr = ' [circular or non-serializable]';
      }
    }
    
    const logMessage = `[${timestamp}] [${level}] ${message}${argsStr}\n`;
    
    if (this.isMCPMode && this.logFilePath) {
      // Write to file in MCP mode (non-blocking)
      fs.appendFileSync(this.logFilePath, logMessage);
    } else {
      // Write to console in normal mode
      if (level === 'ERROR') {
        console.error(logMessage.trim());
      } else {
        console.log(logMessage.trim());
      }
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.level <= LogLevel.DEBUG) {
      this.writeLog('DEBUG', message, args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.level <= LogLevel.INFO) {
      this.writeLog('INFO', message, args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.level <= LogLevel.WARN) {
      this.writeLog('WARN', message, args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.level <= LogLevel.ERROR) {
      this.writeLog('ERROR', message, args);
    }
  }
}

export const logger = new Logger();
