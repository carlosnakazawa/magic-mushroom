import * as THREE from 'three';

/** Rampa de 4 tons para o visual "toon" macio. */
const gradientMap = (() => {
  const data = new Uint8Array([90, 160, 215, 255]);
  const tex = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();

const toonCache = new Map<string, THREE.MeshToonMaterial>();

/** Material toon compartilhado (cacheado por cor/emissivo). */
export function toon(color: number, emissive = 0x000000, emissiveIntensity = 1): THREE.MeshToonMaterial {
  const key = `${color}-${emissive}-${emissiveIntensity}`;
  let m = toonCache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap, emissive, emissiveIntensity });
    toonCache.set(key, m);
  }
  return m;
}

/** Material que brilha (entra no bloom). Não compartilhado — pode ser animado. */
export function glow(color: number, intensity = 2.2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.5,
  });
}

/** Material translúcido para asas. */
export function wingMaterial(color: number, opacity = 0.55, glowAmount = 0.6): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: glowAmount,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    roughness: 0.2,
    metalness: 0.1,
  });
}

/** Cria uma malha que projeta e recebe sombra. */
export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, shadow = true): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}
