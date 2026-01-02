export interface TelemetryData {
  speed: number;        // km/h
  battery: number;      // percentage
  range: number;        // km
  temp: number;         // celsius
  energy: number;       // kWh/100km
  rpm: number;          // motor rpm
  isCharging: boolean;
}

export enum DriveMode {
  ECO = 'ECO',
  SPORT = 'SPORT',
  HYPER = 'HYPER'
}
