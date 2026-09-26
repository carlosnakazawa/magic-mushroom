import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Junta as malhas estáticas de um grupo em poucas malhas (uma por material).
 * Árvores, cercas e paredes são dezenas de peças; juntas viram poucas "draw calls".
 * Só use em coisas que nunca se movem nem mudam de material.
 */
export function mergeStatic(group: THREE.Group): THREE.Group {
  group.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; cast: boolean; receive: boolean }>();
  const keep: THREE.Object3D[] = [];
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    if (Array.isArray(m.material) || m.material.transparent) {
      keep.push(m);
      return;
    }
    const geo = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()) as THREE.BufferGeometry;
    for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geo.deleteAttribute(name);
    if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array((geo.attributes.position!.count) * 2), 2));
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse, m.matrixWorld));
    let b = buckets.get(m.material);
    if (!b) {
      b = { geos: [], cast: false, receive: false };
      buckets.set(m.material, b);
    }
    b.geos.push(geo);
    b.cast ||= m.castShadow;
    b.receive ||= m.receiveShadow;
  });
  const out = new THREE.Group();
  out.position.copy(group.position);
  out.rotation.copy(group.rotation);
  out.scale.copy(group.scale);
  for (const [mat, b] of buckets) {
    const merged = mergeGeometries(b.geos, false);
    b.geos.forEach((g) => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.receive;
    out.add(mesh);
  }
  for (const k of keep) {
    const clone = k.clone();
    k.getWorldPosition(clone.position);
    clone.position.applyMatrix4(inverse);
    k.getWorldQuaternion(clone.quaternion);
    k.getWorldScale(clone.scale);
    out.add(clone);
  }
  return out;
}
