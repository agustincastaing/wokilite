export interface Restaurant {
    id: string;
    name: string;
    sectors: Sector[];
    timezone: string; 
  }

 export interface Sector {
    id: string;
    name: string;
  }