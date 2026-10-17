import { mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Document, NodeIO } from '@gltf-transform/core'
import { BufferGeometry, Color, Float32BufferAttribute } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import inputs from './model-inputs.json'
import { structures } from '../src/anatomy'

// Source z (mm, BodyParts3D Z-up frame) above which esophagus triangles are
// dropped, keeping only its lowest ~8 cm where it meets the stomach.
const ESOPHAGUS_TOP_MM = 1250
const CREDIT =
  'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution-Share Alike 2.1 Japan'

const sha = (data: Uint8Array) => createHash('sha256').update(data).digest('hex')
await mkdir('.asset-cache', { recursive: true })
await mkdir('public/models', { recursive: true })
const cached = new Map<string, Uint8Array>()
for (const input of inputs) {
  const file = Bun.file(`.asset-cache/${input.file}`)
  if (!(await file.exists())) {
    console.log(`Downloading ${input.file}…`)
    const response = await fetch(input.url)
    if (!response.ok) throw new Error(`${input.file}: HTTP ${response.status}`)
    await Bun.write(file, response)
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  if (sha(bytes) !== input.sha256) {
    throw new Error(
      `Checksum mismatch: ${input.file}. Refusing changed upstream data; review it before updating the pin.`,
    )
  }
  cached.set(input.file, bytes)
}

const names = new Map(
  new TextDecoder()
    .decode(cached.get('parts_list_e.txt'))
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split('\t') as [string, string]),
)

/** Binary STL to a flat triangle soup in source millimetres. */
function readStl(bytes: Uint8Array, id: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const count = view.getUint32(80, true)
  if (bytes.byteLength !== 84 + count * 50) throw new Error(`Not a binary STL: ${id}`)
  const positions = new Float32Array(count * 9)
  for (let t = 0; t < count; t++) {
    for (let k = 0; k < 9; k++) {
      const value = view.getFloat32(84 + t * 50 + 12 + k * 4, true)
      if (!Number.isFinite(value)) throw new Error(`Invalid vertex: ${id}`)
      positions[t * 9 + k] = value
    }
  }
  return positions
}

const doc = new Document()
doc.getRoot().getAsset().copyright = CREDIT
const scene = doc.createScene('OrganUI Stomach — BodyParts3D 3.0')
const buffer = doc.createBuffer()
const min = [Infinity, Infinity, Infinity],
  max = [-Infinity, -Infinity, -Infinity]
const prepared = structures.map((structure) => {
  if (names.get(structure.fma) !== structure.sourceName)
    throw new Error(`Source name mismatch for ${structure.fma}: ${names.get(structure.fma)}`)
  const stem = structure.file ?? structure.fma
  const bytes = cached.get(`${stem}.stl`)
  if (!bytes) throw new Error(`Missing STL: ${stem}`)
  let soup = readStl(bytes, stem)
  const sourceTriangles = soup.length / 9
  if (structure.id === 'esophagus') {
    const kept: number[] = []
    for (let t = 0; t < soup.length; t += 9) {
      if (
        soup[t + 2] <= ESOPHAGUS_TOP_MM &&
        soup[t + 5] <= ESOPHAGUS_TOP_MM &&
        soup[t + 8] <= ESOPHAGUS_TOP_MM
      )
        kept.push(...soup.subarray(t, t + 9))
    }
    soup = new Float32Array(kept)
  }
  for (let i = 0; i < soup.length; i += 3)
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], soup[i + a])
      max[a] = Math.max(max[a], soup[i + a])
    }
  return {
    structure,
    soup,
    source: {
      file: `${stem}.stl`,
      sha256: sha(bytes),
      bytes: bytes.length,
      triangles: sourceTriangles,
      keptTriangles: soup.length / 9,
    },
  }
})
const center = min.map((v, i) => (v + max[i]) / 2)
const scale = 0.02 // millimeters to display units; uniform scale, no anatomical reshaping
for (const { structure, soup } of prepared) {
  const transformed = new Float32Array(soup.length)
  for (let i = 0; i < soup.length; i += 3) {
    transformed[i] = (soup[i] - center[0]) * scale
    transformed[i + 1] = (soup[i + 2] - center[2]) * scale
    transformed[i + 2] = -(soup[i + 1] - center[1]) * scale
  }
  // STL stores every triangle's corners separately; weld exact duplicates so
  // normals can be smoothed across the original surface.
  const geometry = mergeVertices(
    new BufferGeometry().setAttribute('position', new Float32BufferAttribute(transformed, 3)),
  )
  geometry.computeVertexNormals()
  const color = new Color(structure.color)
  const material = doc
    .createMaterial(structure.id)
    .setBaseColorFactor([color.r, color.g, color.b, 1])
    .setRoughnessFactor(0.65)
    .setMetallicFactor(0)
    .setDoubleSided(true)
  const primitive = doc
    .createPrimitive()
    .setAttribute(
      'POSITION',
      doc
        .createAccessor()
        .setType('VEC3')
        .setArray(new Float32Array(geometry.getAttribute('position').array))
        .setBuffer(buffer),
    )
    .setAttribute(
      'NORMAL',
      doc
        .createAccessor()
        .setType('VEC3')
        .setArray(new Float32Array(geometry.getAttribute('normal').array))
        .setBuffer(buffer),
    )
    .setIndices(
      doc
        .createAccessor()
        .setType('SCALAR')
        .setArray(new Uint32Array(geometry.getIndex()!.array))
        .setBuffer(buffer),
    )
    .setMaterial(material)
  const mesh = doc.createMesh(structure.id).addPrimitive(primitive)
  scene.addChild(
    doc
      .createNode(structure.id)
      .setMesh(mesh)
      .setExtras({ structureId: structure.id, fma: structure.fma }),
  )
  geometry.dispose()
}
const runtime = await new NodeIO().writeBinary(doc)
await Bun.write('public/models/stomach.glb', runtime)
const manifest = {
  dataset: 'BodyParts3D',
  version: '3.0 (20110915)',
  variant:
    'BodyParts3D_3.0_obj_95 converted to binary STL by the Kevin-Mattheus-Moerman/BodyParts3D repository',
  mirrorCommit: 'f0eeb6e843380cfe6b83797cf8c3e1af74de5e61',
  retrieved: '2026-10-16',
  license: 'CC-BY-SA-2.1-JP',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en',
  credit: CREDIT,
  inputs,
  transform: {
    sourceBoundsMm: { min, max },
    centerMm: center,
    scale,
    axes: '[x, z, -y]',
    esophagusTrimmedAboveZmm: ESOPHAGUS_TOP_MM,
  },
  runtime: { file: 'stomach.glb', bytes: runtime.byteLength, sha256: sha(runtime) },
  structures: prepared.map(({ structure, source }) => ({
    id: structure.id,
    fma: structure.fma,
    sourceName: structure.sourceName,
    source,
  })),
}
await Bun.write('public/models/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
console.log(
  `Prepared ${structures.length} structures, ${runtime.byteLength} bytes. SHA-256 ${sha(runtime)}`,
)
