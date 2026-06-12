// Parametrisk 3D-modell per artikel. Tre grundformer täcker de flesta
// svarvade/frästa detaljer i POC:en: axel (stegad), platta med hålbild
// och bussning (rör). Samma data driver både 3D-visaren och den
// genererade 2D-ritningen, alla mått i mm.

export interface ShaftSegment {
  diameter: number;
  length: number;
}

export interface PlateHole {
  x: number; // från plattans centrum
  y: number;
  diameter: number;
}

export type PartModel =
  | {
      kind: 'shaft';
      segments: ShaftSegment[];
      keyway?: { segmentIndex: number; width: number; length: number; offset: number };
    }
  | {
      kind: 'plate';
      width: number;
      depth: number;
      thickness: number;
      holes: PlateHole[];
    }
  | {
      kind: 'tube';
      outerDiameter: number;
      innerDiameter: number;
      length: number;
    };

export const PART_KIND_LABELS: Record<PartModel['kind'], string> = {
  shaft: 'Axel (stegad)',
  plate: 'Platta med hålbild',
  tube: 'Bussning / rör',
};

export function defaultModel(kind: PartModel['kind']): PartModel {
  switch (kind) {
    case 'shaft':
      return { kind: 'shaft', segments: [{ diameter: 40, length: 200 }] };
    case 'plate':
      return { kind: 'plate', width: 100, depth: 80, thickness: 10, holes: [] };
    case 'tube':
      return { kind: 'tube', outerDiameter: 25, innerDiameter: 16, length: 40 };
  }
}

/** Begränsningslåda (bredd, höjd, djup) i mm — för kamerapassning och ritningsskala. */
export function modelBounds(model: PartModel): { w: number; h: number; d: number } {
  switch (model.kind) {
    case 'shaft': {
      const length = model.segments.reduce((s, seg) => s + seg.length, 0);
      const maxD = Math.max(...model.segments.map((s) => s.diameter), 1);
      return { w: length, h: maxD, d: maxD };
    }
    case 'plate':
      return { w: model.width, h: model.thickness, d: model.depth };
    case 'tube':
      return { w: model.length, h: model.outerDiameter, d: model.outerDiameter };
  }
}

/** Materialfärg i 3D-vyn utifrån materialnamn (mässing, aluminium, stål …). */
export function materialColor(materialName: string | undefined): number {
  const n = (materialName ?? '').toLowerCase();
  if (n.includes('mässing')) return 0xc9a227;
  if (n.includes('aluminium')) return 0xb8c4cc;
  if (n.includes('rostfri')) return 0xd0d4d8;
  return 0x8e9aa6; // stål
}
