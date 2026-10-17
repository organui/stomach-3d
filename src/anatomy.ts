export type Structure = {
  id: string
  fma: string
  name: string
  sourceName: string
  group: 'Digestive tract' | 'Arteries' | 'Neighbouring organs'
  /** BodyParts3D 3.0 STL file stem, when it differs from the FMA ID. */
  file?: string
  color: string
  description: string
  note: string
}

export const anatomySource =
  'https://www.niddk.nih.gov/health-information/digestive-diseases/digestive-system-how-it-works'
export const structures: Structure[] = [
  {
    id: 'stomach',
    fma: 'FMA7148',
    name: 'Stomach',
    sourceName: 'stomach',
    group: 'Digestive tract',
    color: '#d39a86',
    description:
      'A muscular J-shaped sac in the upper left abdomen that stores food, mixes it with digestive juices, and passes it on in small amounts.',
    note: 'The source provides the whole stomach as a single surface. Its regions (cardia, fundus, body, pyloric part) and wall layers are not separately selectable.',
  },
  {
    id: 'esophagus',
    fma: 'FMA7131',
    name: 'Esophagus (lower part)',
    sourceName: 'esophagus',
    group: 'Digestive tract',
    color: '#c58b7d',
    description:
      'The muscular tube that carries swallowed food down through the chest. It passes through the diaphragm and opens into the stomach at the cardia.',
    note: 'Trimmed: only the lowest part, up to about 8 cm above the stomach, is kept. The cut end is open.',
  },
  {
    id: 'duodenum',
    fma: 'FMA7206',
    name: 'Duodenum',
    sourceName: 'duodenum',
    group: 'Digestive tract',
    color: '#d9b27f',
    description:
      'The first part of the small intestine. It receives food from the stomach through the pylorus and curves around the head of the pancreas.',
    note: 'Its connection to the jejunum is truncated. Bile and pancreatic duct openings are not represented.',
  },
  {
    id: 'celiac-trunk',
    fma: 'FMA50737',
    name: 'Celiac trunk',
    sourceName: 'celiac artery',
    group: 'Arteries',
    color: '#b8574f',
    description:
      'A short artery branching from the abdominal aorta. It divides into the left gastric, splenic, and common hepatic arteries, which supply the stomach and its neighbours.',
    note: 'The abdominal aorta it arises from is not included. Best seen from the posterior view or with the stomach hidden.',
  },
  {
    id: 'left-gastric-artery',
    fma: 'FMA14768',
    name: 'Left gastric artery',
    sourceName: 'left gastric artery',
    group: 'Arteries',
    color: '#cc6f62',
    description:
      'The smallest celiac branch. It runs up toward the esophagus and along the lesser curvature of the stomach.',
    note: 'Only its first segment is represented; branches along the stomach wall are omitted.',
  },
  {
    id: 'splenic-artery',
    fma: 'FMA14773',
    name: 'Splenic artery',
    sourceName: 'splenic artery',
    group: 'Arteries',
    color: '#a9514c',
    description:
      'A winding branch running left behind the stomach along the pancreas to the spleen. Its branches also supply parts of the stomach.',
    note: 'Short gastric and gastro-omental branches are not separately represented.',
  },
  {
    id: 'common-hepatic-artery',
    fma: 'FMA14771',
    name: 'Common hepatic artery',
    sourceName: 'common hepatic artery',
    group: 'Arteries',
    color: '#d9826a',
    description:
      'The celiac branch running right toward the liver. Its branches help supply the stomach, duodenum, and pancreas.',
    note: 'Its continuation to the liver and its gastric branches are truncated or omitted.',
  },
  {
    id: 'spleen',
    fma: 'FMA7196',
    name: 'Spleen',
    sourceName: 'spleen',
    group: 'Neighbouring organs',
    color: '#8d6a86',
    description:
      'An organ of the immune and blood systems that sits behind and to the left of the stomach, under the ribs.',
    note: 'Included as a landmark. Best seen from the left lateral view.',
  },
  {
    id: 'pancreas',
    fma: 'FMA7198',
    name: 'Pancreas',
    sourceName: 'pancreas',
    file: 'FMA7198nsn',
    group: 'Neighbouring organs',
    color: '#e2c48f',
    description:
      'A gland lying behind the stomach. It releases digestive juices into the duodenum and hormones such as insulin into the blood.',
    note: 'Included as a landmark. The pancreatic duct is not shown. Hide the stomach to see it clearly.',
  },
]
export const groups = ['Digestive tract', 'Arteries', 'Neighbouring organs'] as const
export const byId = Object.fromEntries(structures.map((s) => [s.id, s]))
export type View = 'Anterior' | 'Posterior' | 'Left lateral'
export const tour: { id: string; title: string; text: string; view: View; isolate?: boolean }[] = [
  {
    id: 'stomach',
    title: 'A J-shaped reservoir',
    text: 'Begin with the stomach in the upper left abdomen. Its long left border is the greater curvature; the short inner border is the lesser curvature.',
    view: 'Anterior',
  },
  {
    id: 'esophagus',
    title: 'Where food arrives',
    text: 'Follow the esophagus down to the stomach. It joins at the cardia, just below the diaphragm (not shown).',
    view: 'Anterior',
  },
  {
    id: 'duodenum',
    title: 'Where food leaves',
    text: 'At the pylorus the stomach empties into the duodenum, which curves around the head of the pancreas.',
    view: 'Anterior',
  },
  {
    id: 'splenic-artery',
    title: 'The stomach’s supply',
    text: 'From behind, follow the splenic artery from the short celiac trunk along the pancreas toward the spleen. The left gastric and common hepatic arteries branch from the same trunk.',
    view: 'Posterior',
  },
  {
    id: 'spleen',
    title: 'Neighbours on the left',
    text: 'Turn to the left side to find the spleen tucked behind the stomach. The pancreas lies behind both.',
    view: 'Left lateral',
  },
]

export type Emphasis = 'normal' | 'selected' | 'ghosted'
// With nothing selected every structure keeps its own color. A selection
// keeps its structure solid and ghosts the rest so it stays visible even
// when it sits behind other geometry (pancreas, celiac branches).
export function emphasis(id: string, selected: string | null): Emphasis {
  if (!selected) return 'normal'
  return id === selected ? 'selected' : 'ghosted'
}
