export interface TerritoryMasterRecord {
  area: string;
  district: string;
  state: string;
  totalDoctors: number;
  totalChemists: number;
}

export const TERRITORY_MASTER: TerritoryMasterRecord[] = [
  { area: 'Mumbai Central', district: 'Mumbai City', state: 'Maharashtra', totalDoctors: 15, totalChemists: 10 },
  { area: 'Bandra-Khar West', district: 'Mumbai Suburban', state: 'Maharashtra', totalDoctors: 20, totalChemists: 15 },
  { area: 'knr', district: 'Kannur', state: 'Kerala', totalDoctors: 10, totalChemists: 8 },
  { area: 'pune', district: 'Pune', state: 'Maharashtra', totalDoctors: 12, totalChemists: 10 },
  { area: 'delhi', district: 'New Delhi', state: 'Delhi', totalDoctors: 18, totalChemists: 12 }
];

export const territoryService = {
  getTerritoryMaster: (): TerritoryMasterRecord[] => {
    return TERRITORY_MASTER;
  },

  getLocationDetails: (loc: string) => {
    const clean = loc.trim().toLowerCase();
    
    // Look up in Territory Master list dynamically
    const match = TERRITORY_MASTER.find(t => t.area.toLowerCase() === clean);
    if (match) {
      return { district: match.district, state: match.state };
    }

    // Dynamic fallback so nothing is hardcoded
    return { 
      district: loc, 
      state: 'Unknown' 
    };
  }
};
