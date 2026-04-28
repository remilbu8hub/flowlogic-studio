// src/model/kTable.js

const SERVICE_LEVEL_TO_K = [
  { serviceLevel: 0.80, k: 0.842 },
  { serviceLevel: 0.85, k: 1.036 },
  { serviceLevel: 0.90, k: 1.282 },
  { serviceLevel: 0.95, k: 1.645 },
  { serviceLevel: 0.98, k: 2.054 },
  { serviceLevel: 0.99, k: 2.326 },
];

function safeNum(x) {
  return typeof x === "number" && Number.isFinite(x) ? x : NaN;
}

export function supportedServiceLevels() {
  return SERVICE_LEVEL_TO_K.map((row) => row.serviceLevel);
}

export function kForServiceLevel(serviceLevel) {
  const sl = safeNum(serviceLevel);

  if (!Number.isFinite(sl)) {
    throw new Error(`Invalid service level: ${serviceLevel}`);
  }

  const exact = SERVICE_LEVEL_TO_K.find((row) => Math.abs(row.serviceLevel - sl) < 1e-9);
  if (exact) {
    return exact.k;
  }

  const min = SERVICE_LEVEL_TO_K[0].serviceLevel;
  const max = SERVICE_LEVEL_TO_K[SERVICE_LEVEL_TO_K.length - 1].serviceLevel;

  if (sl < min || sl > max) {
    throw new Error(
      `Unsupported service level: ${serviceLevel}. Supported range is ${min} to ${max}.`
    );
  }

  for (let i = 0; i < SERVICE_LEVEL_TO_K.length - 1; i += 1) {
    const left = SERVICE_LEVEL_TO_K[i];
    const right = SERVICE_LEVEL_TO_K[i + 1];

    if (sl > left.serviceLevel && sl < right.serviceLevel) {
      const t =
        (sl - left.serviceLevel) / (right.serviceLevel - left.serviceLevel);

      return left.k + t * (right.k - left.k);
    }
  }

  throw new Error(`Unsupported service level: ${serviceLevel}`);
}