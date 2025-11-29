export interface Restaurant {
    id: string;
    name: string;
    sectors: Sector[];
    timezone: any; 
  }

 export interface Sector {
    id: string;
    name: string;
  }