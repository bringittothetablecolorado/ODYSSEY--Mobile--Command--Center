import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const current = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const original = execFileSync(
  "unzip",
  ["-p", fileURLToPath(new URL("../Odyssey -iphone2.zip", import.meta.url)), "app.js"],
  { encoding: "utf8" }
);

function renderFunctions(source) {
  return [...source.matchAll(/^  function (render[A-Za-z0-9_]+)\(/gm)].map((match) => match[1]);
}

const routes = [
  "home",
  "missions",
  "mission-detail:",
  "warroom",
  "timeline",
  "evidence",
  "commanderbrief",
  "executiveboard",
  "strategicforecast",
  "commander",
  "intake",
  "legacy",
  "intelligence",
  "story",
  "profile",
  "settings",
  "more",
];
const originalFunctions = renderFunctions(original);
const currentFunctions = renderFunctions(current);
const missingFunctions = originalFunctions.filter((name) => !currentFunctions.includes(name));
const result = {
  originalRenderFunctions: originalFunctions.length,
  missingRenderFunctions: missingFunctions,
  embeddedPrivateSnapshotRemoved:
    current.includes("var ODYSSEY_READONLY_SNAPSHOT = null;") &&
    current.includes("var odyssey = null;") &&
    !current.includes("13CR0793 Records"),
  originalRoutesPresent: routes.every(
    (route) => current.includes('"' + route + '"') || current.includes(":" + route)
  ),
  mission001PriorityOneRedGuard:
    current.includes('String(recoveredMission.priority) !== "1"') &&
    current.includes('recoveredMission.status !== "RED"') &&
    current.includes('recoveredMission.title.indexOf("MISSION-001") !== 0'),
  supabaseConnectionPresent: current.includes("window.OdysseyConnection.start"),
};

console.log(JSON.stringify(result, null, 2));
if (
  result.missingRenderFunctions.length ||
  !result.embeddedPrivateSnapshotRemoved ||
  !result.originalRoutesPresent ||
  !result.mission001PriorityOneRedGuard ||
  !result.supabaseConnectionPresent
) {
  process.exit(1);
}
