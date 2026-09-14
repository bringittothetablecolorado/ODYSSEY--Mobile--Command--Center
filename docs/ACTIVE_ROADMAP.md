# ODYSSEY Command Center — Recovery Handoff

Updated: September 14, 2026

## Standing order

- Preserve the original Command Center screens and navigation from
  `Odyssey -iphone2.zip`.
- Keep MISSION-001, Colorado Court of Appeals, at Priority 1 / RED.
- Treat investigations, records, newsroom work, case intelligence, and
  executive memory as the center of the system.
- Keep phone intelligence limited to authenticated intake and synchronization.
- Do not use commit `9e156b7` as a recovery baseline.

## Recovered connections

- Original PWA interface and all original render functions
- Recovered Supabase workspace snapshot
- Authoritative `executive_memory.json`
- Private connected-record index
- Private source monitor and story-update queue
- Authenticated mobile intake review queue

## Known source gap

The standalone `odyssey_data.json` and desktop HTA were not present in the
repository or available saved files. The preserved ZIP's exported Odyssey
snapshot is therefore the recovered Odyssey-data baseline. Do not fabricate or
overwrite the missing standalone source.
