# ODYSSEY Command Center

Recovered from the preserved `Odyssey -iphone2.zip` baseline.

The original Command Center interface, mission hierarchy, navigation, War Room,
Timeline, Evidence, Commander, Intelligence, Story, Legacy, and mobile intake
screens remain the product. MISSION-001 remains Priority 1 / RED.

Supabase supplies the private recovered workspace, executive memory, connected
record index, source monitoring, story updates, and supporting mobile intake.
The public GitHub Pages source contains no private document bytes or service
credentials.

## Verify the recovery

```bash
node scripts/verify-recovery.mjs
node --check app.js
node --check odyssey-connection.js
git diff --check
```

## Local preview

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

The incomplete recovery draft from commit `9e156b7` is not a baseline for
this branch.
