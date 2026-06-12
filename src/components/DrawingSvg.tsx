// Genererad 2D-ritning från artikelns parametriska modell: A4-liggande ark
// (297×210 mm viewBox) med ram, vyer, måttsättning och ritningshuvud.
// Skalan väljs automatiskt bland standardskalor så vyerna ryms på arket.

import type { ReactNode } from 'react';
import type { Article } from '../types';
import type { PartModel } from '../lib/partModel';

const SHEET_W = 297;
const SHEET_H = 210;
const MARGIN = 10;
const TITLE_H = 24;
const LINE = '#1c2733';
const DIM = '#1f5fa8';
const THIN = 0.25;
const THICK = 0.5;

const STANDARD_SCALES = [5, 2, 1, 0.5, 0.2, 0.1];

function scaleLabel(s: number): string {
  return s >= 1 ? `${s}:1` : `1:${Math.round(1 / s)}`;
}

interface DimProps {
  x1: number; y1: number; x2: number; y2: number;
  label: string;
  offset: number; // avstånd från mätpunkterna (negativt = andra sidan)
  s: number; // ritningsskala, för textstorlek i partkoordinater
}

/** Horisontellt mått: mätlinje med pilar + måttext ovanför. */
function DimH({ x1, x2, y1, label, offset, s }: Omit<DimProps, 'y2'>) {
  const y = y1 + offset;
  const f = 3.2 / s;
  const a = 1.4 / s;
  return (
    <g stroke={DIM} strokeWidth={THIN / s} fill={DIM}>
      <line x1={x1} y1={y1} x2={x1} y2={y + (offset > 0 ? a : -a)} />
      <line x1={x2} y1={y1} x2={x2} y2={y + (offset > 0 ? a : -a)} />
      <line x1={x1} y1={y} x2={x2} y2={y} />
      <path d={`M ${x1} ${y} l ${a * 2} ${-a * 0.6} v ${a * 1.2} z`} stroke="none" />
      <path d={`M ${x2} ${y} l ${-a * 2} ${-a * 0.6} v ${a * 1.2} z`} stroke="none" />
      <text
        x={(x1 + x2) / 2} y={y - 1 / s} textAnchor="middle" fontSize={f}
        stroke="none" fontFamily="inherit"
      >
        {label}
      </text>
    </g>
  );
}

/** Vertikalt mått. */
function DimV({ x1, y1, y2, label, offset, s }: Omit<DimProps, 'x2'>) {
  const x = x1 + offset;
  const f = 3.2 / s;
  const a = 1.4 / s;
  return (
    <g stroke={DIM} strokeWidth={THIN / s} fill={DIM}>
      <line x1={x1} y1={y1} x2={x + (offset > 0 ? a : -a)} y2={y1} />
      <line x1={x1} y1={y2} x2={x + (offset > 0 ? a : -a)} y2={y2} />
      <line x1={x} y1={y1} x2={x} y2={y2} />
      <path d={`M ${x} ${y1} l ${-a * 0.6} ${a * 2} h ${a * 1.2} z`} stroke="none" />
      <path d={`M ${x} ${y2} l ${-a * 0.6} ${-a * 2} h ${a * 1.2} z`} stroke="none" />
      <text
        x={x - 1 / s} y={(y1 + y2) / 2} textAnchor="middle" fontSize={f}
        transform={`rotate(-90 ${x - 1 / s} ${(y1 + y2) / 2})`}
        stroke="none" fontFamily="inherit"
      >
        {label}
      </text>
    </g>
  );
}

/** Centrumkryss för hål/cirklar. */
function CrossHair({ x, y, r, s }: { x: number; y: number; r: number; s: number }) {
  const ext = r + 2 / s;
  return (
    <g stroke={LINE} strokeWidth={THIN / s} strokeDasharray={`${3 / s} ${1 / s} ${0.8 / s} ${1 / s}`}>
      <line x1={x - ext} y1={y} x2={x + ext} y2={y} />
      <line x1={x} y1={y - ext} x2={x} y2={y + ext} />
    </g>
  );
}

interface ViewBuild {
  content: ReactNode;
  bboxW: number; // vyernas totala utbredning i partkoordinater (inkl måttutrymme)
  bboxH: number;
  originX: number; // var partkoordinat (0,0) ligger i bboxen
  originY: number;
}

function buildViews(model: PartModel, s: number): ViewBuild {
  const gap = 18 / s;

  if (model.kind === 'shaft') {
    const total = model.segments.reduce((acc, seg) => acc + seg.length, 0);
    const maxD = Math.max(...model.segments.map((seg) => seg.diameter), 1);
    let x = 0;
    const segs = model.segments.map((seg) => {
      const r = { x, w: seg.length, d: seg.diameter };
      x += seg.length;
      return r;
    });
    const endX = total + gap + maxD / 2;
    const dimSpace = 14 / s;
    return {
      content: (
        <>
          {segs.map((seg, i) => (
            <g key={i}>
              <rect
                x={seg.x} y={-seg.d / 2} width={seg.w} height={seg.d}
                fill="none" stroke={LINE} strokeWidth={THICK / s}
              />
              <text
                x={seg.x + seg.w / 2} y={-seg.d / 2 - 2 / s} textAnchor="middle"
                fontSize={3.2 / s} fill={LINE} fontFamily="inherit"
              >
                {`Ø${seg.d}`}
              </text>
            </g>
          ))}
          {/* centrumlinje */}
          <line
            x1={-3 / s} y1={0} x2={total + 3 / s} y2={0}
            stroke={LINE} strokeWidth={THIN / s}
            strokeDasharray={`${4 / s} ${1.2 / s} ${1 / s} ${1.2 / s}`}
          />
          {model.keyway && (() => {
            const kw = model.keyway;
            const segStart = segs[kw.segmentIndex]?.x ?? 0;
            return (
              <g>
                <rect
                  x={segStart + kw.offset} y={-kw.width / 2} width={kw.length} height={kw.width}
                  fill="none" stroke={LINE} strokeWidth={THIN / s}
                />
                <text
                  x={segStart + kw.offset + kw.length / 2} y={kw.width / 2 + 4 / s}
                  textAnchor="middle" fontSize={2.8 / s} fill={LINE} fontFamily="inherit"
                >
                  {`Kilspår ${kw.width}×${kw.length}`}
                </text>
              </g>
            );
          })()}
          <DimH x1={0} x2={total} y1={maxD / 2} label={`${total}`} offset={9 / s} s={s} />
          {/* gavelvy */}
          <circle cx={endX} cy={0} r={maxD / 2} fill="none" stroke={LINE} strokeWidth={THICK / s} />
          <CrossHair x={endX} y={0} r={maxD / 2} s={s} />
        </>
      ),
      bboxW: endX + maxD / 2 + 3 / s,
      bboxH: maxD + dimSpace * 2,
      originX: 0,
      originY: maxD / 2 + 6 / s,
    };
  }

  if (model.kind === 'plate') {
    const { width: w, depth: d, thickness: t, holes } = model;
    const sideX = w / 2 + gap;
    const byDia = new Map<number, number>();
    for (const h of holes) byDia.set(h.diameter, (byDia.get(h.diameter) ?? 0) + 1);
    const holeLabel = [...byDia.entries()].map(([dia, n]) => `${n}×Ø${dia}`).join(', ');
    return {
      content: (
        <>
          <rect x={-w / 2} y={-d / 2} width={w} height={d} fill="none" stroke={LINE} strokeWidth={THICK / s} />
          {holes.map((h, i) => (
            <g key={i}>
              <circle cx={h.x} cy={-h.y} r={h.diameter / 2} fill="none" stroke={LINE} strokeWidth={THICK / s} />
              <CrossHair x={h.x} y={-h.y} r={h.diameter / 2} s={s} />
            </g>
          ))}
          {holeLabel && (
            <text x={-w / 2} y={-d / 2 - 3 / s} fontSize={3.2 / s} fill={LINE} fontFamily="inherit">
              {holeLabel}
            </text>
          )}
          <DimH x1={-w / 2} x2={w / 2} y1={d / 2} label={`${w}`} offset={9 / s} s={s} />
          <DimV x1={-w / 2} y1={-d / 2} y2={d / 2} label={`${d}`} offset={-9 / s} s={s} />
          {/* sidovy */}
          <rect x={sideX} y={-d / 2} width={t} height={d} fill="none" stroke={LINE} strokeWidth={THICK / s} />
          <DimH x1={sideX} x2={sideX + t} y1={d / 2} label={`${t}`} offset={9 / s} s={s} />
        </>
      ),
      bboxW: w / 2 + sideX + t + 14 / s,
      bboxH: d + 28 / s,
      originX: w / 2 + 12 / s,
      originY: d / 2 + 8 / s,
    };
  }

  const { outerDiameter: od, innerDiameter: id, length: l } = model;
  const sideX = od / 2 + gap;
  return {
    content: (
      <>
        <circle cx={0} cy={0} r={od / 2} fill="none" stroke={LINE} strokeWidth={THICK / s} />
        <circle cx={0} cy={0} r={id / 2} fill="none" stroke={LINE} strokeWidth={THICK / s} />
        <CrossHair x={0} y={0} r={od / 2} s={s} />
        <text x={0} y={-od / 2 - 3 / s} textAnchor="middle" fontSize={3.2 / s} fill={LINE} fontFamily="inherit">
          {`Ø${od} / Ø${id}`}
        </text>
        {/* sidovy med dolda linjer för hålet */}
        <rect x={sideX} y={-od / 2} width={l} height={od} fill="none" stroke={LINE} strokeWidth={THICK / s} />
        <line x1={sideX} y1={-id / 2} x2={sideX + l} y2={-id / 2} stroke={LINE} strokeWidth={THIN / s} strokeDasharray={`${2.5 / s} ${1.5 / s}`} />
        <line x1={sideX} y1={id / 2} x2={sideX + l} y2={id / 2} stroke={LINE} strokeWidth={THIN / s} strokeDasharray={`${2.5 / s} ${1.5 / s}`} />
        <DimH x1={sideX} x2={sideX + l} y1={od / 2} label={`${l}`} offset={9 / s} s={s} />
      </>
    ),
    bboxW: od / 2 + sideX + l + 3 / s,
    bboxH: od + 26 / s,
    originX: od / 2 + 2 / s,
    originY: od / 2 + 10 / s,
  };
}

interface Props {
  article: Article;
  materialName?: string;
}

export default function DrawingSvg({ article, materialName }: Props) {
  const model = article.model;
  if (!model) {
    return <div className="empty-state">Ingen parametrisk modell — ritning kan inte genereras.</div>;
  }

  const usableW = SHEET_W - MARGIN * 2 - 10;
  const usableH = SHEET_H - MARGIN * 2 - TITLE_H - 10;

  // Hitta största standardskala där vyerna ryms (testa med skala 1 för bbox-mått)
  let scale = STANDARD_SCALES[STANDARD_SCALES.length - 1];
  for (const s of STANDARD_SCALES) {
    const v = buildViews(model, s);
    if (v.bboxW * s <= usableW && v.bboxH * s <= usableH) {
      scale = s;
      break;
    }
  }
  const views = buildViews(model, scale);
  const tx = MARGIN + (usableW - views.bboxW * scale) / 2 + views.originX * scale;
  const ty = MARGIN + (usableH - views.bboxH * scale) / 2 + views.originY * scale;

  const today = new Intl.DateTimeFormat('sv-SE').format(new Date());
  const titleX = SHEET_W - MARGIN - 120;
  const titleY = SHEET_H - MARGIN - TITLE_H;

  return (
    <svg
      viewBox={`0 0 ${SHEET_W} ${SHEET_H}`}
      className="drawing-sheet"
      role="img"
      aria-label={`Ritning ${article.number}`}
    >
      <rect x={0} y={0} width={SHEET_W} height={SHEET_H} fill="#fff" />
      <rect
        x={MARGIN} y={MARGIN} width={SHEET_W - MARGIN * 2} height={SHEET_H - MARGIN * 2}
        fill="none" stroke={LINE} strokeWidth={0.5}
      />

      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>{views.content}</g>

      {/* Ritningshuvud */}
      <g fontFamily="inherit">
        <rect x={titleX} y={titleY} width={120} height={TITLE_H} fill="none" stroke={LINE} strokeWidth={0.5} />
        <line x1={titleX} y1={titleY + 8} x2={titleX + 120} y2={titleY + 8} stroke={LINE} strokeWidth={0.25} />
        <line x1={titleX} y1={titleY + 16} x2={titleX + 120} y2={titleY + 16} stroke={LINE} strokeWidth={0.25} />
        <line x1={titleX + 60} y1={titleY + 8} x2={titleX + 60} y2={titleY + 24} stroke={LINE} strokeWidth={0.25} />
        <text x={titleX + 2} y={titleY + 5.5} fontSize={4} fontWeight={700} fill={LINE}>
          {article.number} — {article.name}
        </text>
        <text x={titleX + 2} y={titleY + 13.5} fontSize={3} fill={LINE}>
          Material: {materialName ?? '–'}
        </text>
        <text x={titleX + 62} y={titleY + 13.5} fontSize={3} fill={LINE}>
          Skala {scaleLabel(scale)} · mm
        </text>
        <text x={titleX + 2} y={titleY + 21.5} fontSize={3} fill={LINE}>
          VerkstadsPilot POC
        </text>
        <text x={titleX + 62} y={titleY + 21.5} fontSize={3} fill={LINE}>
          {today}
        </text>
      </g>
    </svg>
  );
}
