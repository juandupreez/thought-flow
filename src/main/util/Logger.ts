export enum LogLevel {
    ALL = 'ALL',
    TRACE = 'TRACE',
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    FATAL = 'FATAL',
    OFF = 'OFF',
  }
  
  export abstract class FilteredLogger {
    protected logLevel: LogLevel
  
    abstract traceFn (message?: any, ...optionalParams: any[]): void
    abstract debugFn (message?: any, ...optionalParams: any[]): void
    abstract infoFn (message?: any, ...optionalParams: any[]): void
    abstract warnFn (message?: any, ...optionalParams: any[]): void
    abstract errorFn (message?: any, ...optionalParams: any[]): void
  
    constructor (logLevel: LogLevel = LogLevel.INFO) {
      this.logLevel = logLevel
    }
  
    getLogLevel (): LogLevel {
      return this.logLevel
    }
  
    setLogLevel (logLevel: LogLevel): void {
      this.logLevel = logLevel
    }
  
    trace (message?: any, ...optionalParams: any[]): void {
      if ([
        LogLevel.ALL,
        LogLevel.TRACE
      ].includes(this.logLevel)) {
        this.traceFn(message, ...optionalParams)
      }
    }
  
    debug (message?: any, ...optionalParams: any[]): void {
      if ([
        LogLevel.ALL,
        LogLevel.TRACE,
        LogLevel.DEBUG
      ].includes(this.logLevel)) {
        this.debugFn(message, ...optionalParams)
      }
    }
  
    info (message?: any, ...optionalParams: any[]): void {
      if ([
        LogLevel.ALL,
        LogLevel.TRACE,
        LogLevel.DEBUG,
        LogLevel.INFO
      ].includes(this.logLevel)) {
        this.infoFn(message, ...optionalParams)
      }
    }
  
    warn (message?: any, ...optionalParams: any[]): void {
      if ([
        LogLevel.ALL,
        LogLevel.TRACE,
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN
      ].includes(this.logLevel)) {
        this.warnFn(message, ...optionalParams)
      }
    }
  
    error (message?: any, ...optionalParams: any[]): void {
      if ([
        LogLevel.ALL,
        LogLevel.TRACE,
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR
      ].includes(this.logLevel)) {
        this.errorFn(message, ...optionalParams)
      }
    }
  
    fatal (message?: any, ...optionalParams: any[]): void {
      if ([
        LogLevel.ALL,
        LogLevel.TRACE,
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.FATAL
      ].includes(this.logLevel)) {
        this.errorFn(message, ...optionalParams)
      }
    }
  }
  
  export class ConsoleFilteredLogger extends FilteredLogger {
    traceFn (message?: any, ...optionalParams: any[]): void {
      console.log(message, ...optionalParams)
    }
  
    debugFn (message?: any, ...optionalParams: any[]): void {
      console.log(message, ...optionalParams)
    }
  
    infoFn (message?: any, ...optionalParams: any[]): void {
      console.log(message, ...optionalParams)
    }
  
    warnFn (message?: any, ...optionalParams: any[]): void {
      console.log(message, ...optionalParams)
    }
  
    errorFn (message?: any, ...optionalParams: any[]): void {
      console.log(message, ...optionalParams)
    }
  }
  
  export class GlobalLogger extends ConsoleFilteredLogger { // eslint-disable-line @typescript-eslint/no-extraneous-class
    private static instance: GlobalLogger | null = null
  
    private constructor () {
      super(LogLevel.INFO)
    }
  
    static getInstance (): GlobalLogger {
      if (this.instance === null) {
        this.instance = new GlobalLogger()
      }
      return this.instance
    }
  }

  export function glog(): FilteredLogger {
    return GlobalLogger.getInstance()
  }