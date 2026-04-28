const KNOWN_LOCATIONS = new Set([
  "north_america",
  "latin_america",
  "europe",
  "east_asia",
  "south_asia",
  "southeast_asia",
]);

const LOCATION_ALIASES = {
  asia: "east_asia",
  domestic: "north_america",
};

const TRUCK_FRIENDLY_PAIR_KEYS = new Set([
  "north_america|latin_america",
  "latin_america|north_america",
]);

export function normalizeLocationKey(location) {
  const raw = String(location ?? "").trim().toLowerCase();
  if (!raw) return null;

  const normalized = LOCATION_ALIASES[raw] ?? raw;
  return KNOWN_LOCATIONS.has(normalized) ? normalized : null;
}

export function isIntercontinentalLane(fromNode, toNode) {
  const fromLocation = normalizeLocationKey(fromNode?.location);
  const toLocation = normalizeLocationKey(toNode?.location);

  if (!fromLocation || !toLocation) return false;
  if (fromLocation === toLocation) return false;
  if (TRUCK_FRIENDLY_PAIR_KEYS.has(`${fromLocation}|${toLocation}`)) return false;

  return true;
}

export function getDefaultTransportTypeForNodes(fromNode, toNode) {
  return isIntercontinentalLane(fromNode, toNode) ? "ship" : "truck";
}

export function getAllowedTransportTypesForNodes(fromNode, toNode) {
  if (isIntercontinentalLane(fromNode, toNode)) {
    return ["air", "ship"];
  }

  return ["truck", "air", "ship"];
}

export function isTransportTypeAllowedForNodes(transportType, fromNode, toNode) {
  return getAllowedTransportTypesForNodes(fromNode, toNode).includes(
    String(transportType ?? "truck").toLowerCase()
  );
}

export function getTransportRestrictionNote(fromNode, toNode) {
  if (!isIntercontinentalLane(fromNode, toNode)) return null;

  return "Truck is restricted on this lane because these locations are treated as an intercontinental move. Use ship for standard flow or air for speed.";
}
