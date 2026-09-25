// Invented clocks for demonstrating the comparison contract, not prayer times.
export const syntheticExample = {
  plan:[{id:'invented',timeZone:'UTC',dates:['2026-01-01'],fields:[
    {reference:'dawn',predicted:'fajr'},{reference:'evening',predicted:'isha'},
  ]}],
  references:[{id:'invented',status:'parsed',days:[{date:'2026-01-01',events:{dawn:'06:00',evening:null}}]}],
  predictions:[{id:'invented',days:[{date:'2026-01-01',events:{fajr:{utc:'2026-01-01T06:01:00Z'},isha:{utc:null,reason:'synthetic-no-crossing'}}}]}],
  mode:'printed-date',zeroClockPolicy:'unresolved',
};
