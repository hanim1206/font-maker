// ShapeEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import { path as d3Path } from 'd3-path';
import { useGesture } from '@use-gesture/react';

type ID = string;
type Pt = { x: number; y: number };

/** 단일 획: 라인으로 시작, 필요시 c1/c2 넣으면 큐빅 */
type Stroke = {
  id: ID;
  type: 'stroke';
  p0: Pt;
  p1: Pt;
  c1?: Pt;
  c2?: Pt;
  stroke?: string;
  strokeWidth?: number;
};

/** 병합된 경로: 노드/핸들 기반 (노드 간에 L 또는 C) */
type Node = { p: Pt; h1?: Pt; h2?: Pt }; // h1: 이전 세그먼트의 도착 제어점, h2: 다음 세그먼트의 출발 제어점
type PathShape = {
  id: ID;
  type: 'path';
  nodes: Node[];
  stroke?: string;
  strokeWidth?: number;
};

type Shape = Stroke | PathShape;

// ────────────────────────────────────────────────────────────────────────────────
// Config & Utils
// ────────────────────────────────────────────────────────────────────────────────
const W = 500, H = 500;
const GRID = 20;
const CTRL_MARGIN = 300; // 컨트롤 핸들은 이 범위까지 바깥 허용
const EPS = 12;          // 병합 시 "붙었다고" 판단할 거리(px)
const CORNER_HANDLE_RATIO = 0.4; // 코너 핸들 길이(각 세그먼트 길이의 비율)

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const snap  = (v: number) => Math.round(v / GRID) * GRID;
const snapPt = (pt: Pt) => ({ x: snap(pt.x), y: snap(pt.y) });

/** p0/p1은 0..W/H, c1/c2는 -M..W/H+M */
const clampByKey = (key: 'p0'|'p1'|'c1'|'c2', pt: Pt) => {
  const minX = (key === 'c1' || key === 'c2') ? -CTRL_MARGIN : 0;
  const maxX = (key === 'c1' || key === 'c2') ? W + CTRL_MARGIN : W;
  const minY = (key === 'c1' || key === 'c2') ? -CTRL_MARGIN : 0;
  const maxY = (key === 'c1' || key === 'c2') ? H + CTRL_MARGIN : H;
  return { x: clamp(pt.x, minX, maxX), y: clamp(pt.y, minY, maxY) };
};
const snapClampByKey = (key: 'p0'|'p1'|'c1'|'c2', pt: Pt) => clampByKey(key, snapPt(pt));

const isCubic = (s: Stroke) => Boolean(s.c1 && s.c2);
const isPath  = (s: Shape): s is PathShape => s.type === 'path';

const add = (a:Pt,b:Pt):Pt=>({x:a.x+b.x,y:a.y+b.y});
const sub = (a:Pt,b:Pt):Pt=>({x:a.x-b.x,y:a.y-b.y});
const mul = (a:Pt,k:number):Pt=>({x:a.x*k,y:a.y*k});
const len = (a:Pt)=> Math.hypot(a.x,a.y);
const norm = (a:Pt)=>{ const L=len(a)||1; return {x:a.x/L,y:a.y/L}; };
const dist = (a:Pt,b:Pt)=> Math.hypot(a.x-b.x,a.y-b.y);

function reverseStroke(s: Stroke): Stroke {
  return {
    ...s,
    p0: s.p1,
    p1: s.p0,
    c1: s.c2,
    c2: s.c1,
  };
}

function toPathD(shape: Shape): string {
  const p = d3Path();
  if (isPath(shape)) {
    const nodes = shape.nodes;
    if (nodes.length === 0) return '';
    p.moveTo(nodes[0].p.x, nodes[0].p.y);
    for (let i=0;i<nodes.length-1;i++){
      const a = nodes[i], b = nodes[i+1];
      if (a.h2 && b.h1) {
        p.bezierCurveTo(a.h2.x, a.h2.y, b.h1.x, b.h1.y, b.p.x, b.p.y);
      } else {
        p.lineTo(b.p.x, b.p.y);
      }
    }
    return p.toString();
  } else {
    p.moveTo(shape.p0.x, shape.p0.y);
    if (isCubic(shape)) {
      p.bezierCurveTo(shape.c1!.x, shape.c1!.y, shape.c2!.x, shape.c2!.y, shape.p1.x, shape.p1.y);
    } else {
      p.lineTo(shape.p1.x, shape.p1.y);
    }
    return p.toString();
  }
}

// ────────────────────────────────────────────────────────────────────────────────
function Handle({
  p, onDrag, onDragEnd, label
}:{
  p: Pt;
  label?: string;
  onDrag:    (dx: number, dy: number, meta:{shiftKey:boolean}) => void;
  onDragEnd: (_mx: number, _my: number, meta:{shiftKey:boolean}) => void;
}) {
  const bind = useGesture(
    {
      onDragStart: ({ event }) => { event?.stopPropagation(); },
      onDrag: ({ delta: [dx, dy], shiftKey, event }) => {
        event?.stopPropagation();
        onDrag(dx, dy, { shiftKey });
      },
      onDragEnd: ({ movement: [mx, my], shiftKey, event }) => {
        event?.stopPropagation();
        onDragEnd(mx, my, { shiftKey });
      },
    },
    { eventOptions: { passive: false } }
  );

  return (
    <g {...bind()} style={{ cursor: 'grab', touchAction: 'none' }} data-handle>
      <circle cx={p.x} cy={p.y} r={6} fill="#fff" stroke="#111" />
      {label && <text x={p.x + 8} y={p.y - 8} fontSize={11} fill="#111">{label}</text>}
    </g>
  );
}

// ────────────────────────────────────────────────────────────────────────────────
export default function ShapeEditor() {
  const [shapes, setShapes] = useState<Shape[]>([
    { type:'stroke', id:crypto.randomUUID(), p0:{x:120,y:240}, p1:{x:260,y:240}, stroke:'#111', strokeWidth:18 },
    { type:'stroke', id:crypto.randomUUID(), p0:{x:260,y:240}, p1:{x:260,y:360}, c1:{x:260,y:260}, c2:{x:260,y:340}, stroke:'#111', strokeWidth:18 }, // ㄱ의 세로획(곡선 예시)
  ]);
  const [selected, setSelected] = useState<ID | null>(null);

  // ── Toolbar
  const addStroke = () =>
    setShapes(prev => [...prev,
      { type: 'stroke', id: crypto.randomUUID(),
        p0: { x: 80, y: 260 }, p1: { x: 320, y: 260 },
        stroke: '#111', strokeWidth: 18 },
    ]);

  const toggleCubic = () => {
    if (!selected) return;
    setShapes(prev => prev.map(s => {
      if (isPath(s) || s.id !== selected) return s;
      if (isCubic(s)) {
        const { c1, c2, ...rest } = s;
        return rest; // 라인으로
      } else {
        return { ...s, c1: { ...s.p0 }, c2: { ...s.p1 } }; // 직선과 동일한 큐빅
      }
    }));
  };

  const deselect = () => setSelected(null);

  const removeSelected = () => setShapes(prev => prev.filter(s => s.id !== selected));

  const saveJSON = () => {
    const json = JSON.stringify(shapes, null, 2);
    console.log(json);
  };

  /** 선택된 stroke를 가장 잘 붙는 다른 stroke와 병합 → PathShape 생성 */
  const mergeSelected = () => {
    if (!selected) return;
    // 대상은 Stroke여야 함
    const A = shapes.find(s => !isPath(s) && s.id === selected) as Stroke | undefined;
    if (!A) return;

    // A의 네 가지 끝점과 모든 Stroke의 끝점 사이 거리 중 최소 찾기
    let best: { B: Stroke; Aend: 'p0'|'p1'; Bend: 'p0'|'p1'; d:number } | null = null;
    for (const s of shapes) {
      if (isPath(s)) continue;
      if (!A || s.id === A.id) continue;
      const pairs: Array<['p0'|'p1','p0'|'p1']> = [['p0','p0'],['p0','p1'],['p1','p0'],['p1','p1']];
      for (const [ae, be] of pairs) {
        const da = (A as any)[ae] as Pt;
        const db = (s as any)[be] as Pt;
        const d = dist(da, db);
        if (best === null || d < best.d) best = { B: s, Aend: ae, Bend: be, d };
      }
    }
    if (!best || best.d > EPS) {
      // 붙을 만큼 가깝지 않음
      return;
    }

    // A, B를 "A end -> B start" 방향으로 재정렬/뒤집기
    let a: Stroke = A;
    let b: Stroke = best.B;
    if (best.Aend === 'p0') a = reverseStroke(a);
    if (best.Bend === 'p1') b = reverseStroke(b);

    const P = a.p1; // 접점

    // 접선(방향) 계산: 끝쪽/시작쪽
    const tanIn  = isCubic(a) ? sub(a.p1, a.c2!) : sub(a.p1, a.p0);
    const tanOut = isCubic(b) ? sub(b.c1!, b.p0) : sub(b.p1, b.p0);
    const dirIn  = norm(tanIn);
    const dirOut = norm(tanOut);

    // 코너 핸들 길이: 양쪽 세그먼트 길이의 비율 사용
    const lenIn  = isCubic(a) ? Math.hypot(a.p1.x - a.c2!.x, a.p1.y - a.c2!.y) : dist(a.p1, a.p0);
    const lenOut = isCubic(b) ? Math.hypot(b.c1!.x - b.p0.x, b.c1!.y - b.p0.y) : dist(b.p1, b.p0);
    const L = CORNER_HANDLE_RATIO * Math.min(lenIn, lenOut);

    const cornerH1 = add(P, mul(dirIn, -L)); // 들어오는 쪽(이전 세그먼트 도착)
    const cornerH2 = add(P, mul(dirOut,  L)); // 나가는 쪽(다음 세그먼트 출발)

    // Path 노드 구성: [A 시작]—[코너]—[B 끝]
    const nodes: Node[] = [
      {
        p: a.p0,
        h2: isCubic(a) ? a.c1 : undefined, // A의 시작 핸들 유지
      },
      {
        p: P,
        h1: cornerH1,
        h2: cornerH2, // 코너에서 매끈하게 이어지도록 양쪽 핸들 세팅
      },
      {
        p: b.p1,
        h1: isCubic(b) ? b.c2 : undefined, // B의 끝 핸들 유지
      },
    ];

    const newPath: PathShape = {
      id: crypto.randomUUID(),
      type: 'path',
      nodes,
      stroke: a.stroke ?? b.stroke ?? '#111',
      strokeWidth: a.strokeWidth ?? b.strokeWidth ?? 18,
    };

    // 두 stroke 제거하고 path 추가
    setShapes(prev => {
      const filtered = prev.filter(s => s.id !== a.id && s.id !== b.id);
      return [...filtered, newPath];
    });
    setSelected(newPath.id);
  };

  // ── 포인트 이동(핸들) — Stroke만 지원 (Path 편집은 다음 스텝)
  const movePoint = (
    shapeId: ID, key: 'p0'|'p1'|'c1'|'c2', dx: number, dy: number, meta:{shiftKey:boolean}
  ) => {
    setShapes(prev => prev.map(s => {
      if (isPath(s) || s.id !== shapeId) return s;
      if ((key === 'c1' || key === 'c2') && !isCubic(s)) return s;
      const cur = (s as any)[key] as Pt | undefined;
      if (!cur) return s;
      const raw = { x: cur.x + dx, y: cur.y + dy };
      const next = meta.shiftKey ? snapClampByKey(key, raw) : clampByKey(key, raw);
      return { ...(s as any), [key]: next } as Stroke;
    }));
  };

  const commitPoint = (
    shapeId: ID, key: 'p0'|'p1'|'c1'|'c2', meta:{shiftKey:boolean}
  ) => {
    setShapes(prev => prev.map(s => {
      if (isPath(s) || s.id !== shapeId) return s;
      if ((key === 'c1' || key === 'c2') && !isCubic(s)) return s;
      const cur = (s as any)[key] as Pt | undefined;
      if (!cur) return s;
      const finalPt = meta.shiftKey ? snapClampByKey(key, cur) : clampByKey(key, cur);
      return { ...(s as any), [key]: finalPt } as Stroke;
    }));
  };

  // ── 도형 전체 이동 (ID/스냅샷 잠금) — Path도 이동 지원
  const dragRef = useRef<{ start: Shape | null; shapeId: ID | null }>({ start: null, shapeId: null });

  const bindCanvas = useGesture({
    onDragStart: ({ event }) => {
      const target = event?.target as HTMLElement | null;
      if (target?.closest('[data-handle]')) return; // 핸들 드래그는 무시
      if (!selected) return;
      const s = shapes.find(x => x.id === selected);
      dragRef.current.start = s ? JSON.parse(JSON.stringify(s)) : null;
      dragRef.current.shapeId = selected;
    },

    onDrag: ({ movement: [mx, my], buttons, shiftKey, event }) => {
      const lockedId = dragRef.current.shapeId;
      const start    = dragRef.current.start;
      if (!lockedId || !start || buttons !== 1) return;

      const target = event?.target as HTMLElement | null;
      if (target?.closest('[data-handle]')) return;

      let sdx = mx, sdy = my;
      if (shiftKey) {
        // 앵커는 첫 노드 또는 p0 기준
        const anchor = isPath(start) ? start.nodes[0].p : start.p0;
        sdx = snap(anchor.x + mx) - anchor.x;
        sdy = snap(anchor.y + my) - anchor.y;
      }

      // 경계는 앵커 포인트들(p0/p1 또는 path의 모든 노드 p)을 기준으로
      const anchors: Pt[] = isPath(start)
        ? start.nodes.map(n => n.p)
        : [start.p0, start.p1];

      const minX = Math.min(...anchors.map(p => p.x));
      const maxX = Math.max(...anchors.map(p => p.x));
      const minY = Math.min(...anchors.map(p => p.y));
      const maxY = Math.max(...anchors.map(p => p.y));
      sdx = clamp(sdx, -minX, W - maxX);
      sdy = clamp(sdy, -minY, H - maxY);

      setShapes(prev => prev.map(s => {
        if (s.id !== lockedId) return s;

        if (isPath(start) && isPath(s)) {
          const nodes = s.nodes.map((n,i) => {
            // 핸들은 캔버스 바깥 허용
            return {
              p:  { x: start.nodes[i].p.x  + sdx, y: start.nodes[i].p.y  + sdy },
              h1: start.nodes[i].h1 ? { x: start.nodes[i].h1!.x + sdx, y: start.nodes[i].h1!.y + sdy } : undefined,
              h2: start.nodes[i].h2 ? { x: start.nodes[i].h2!.x + sdx, y: start.nodes[i].h2!.y + sdy } : undefined,
            } as Node;
          });
          return { ...s, nodes };
        } else if (!isPath(start) && !isPath(s)) {
          const p0 = { x: start.p0.x + sdx, y: start.p0.y + sdy };
          const p1 = { x: start.p1.x + sdx, y: start.p1.y + sdy };
          const next: Stroke = {
            ...s,
            p0: shiftKey ? snapClampByKey('p0', p0) : clampByKey('p0', p0),
            p1: shiftKey ? snapClampByKey('p1', p1) : clampByKey('p1', p1),
          };
          if (isCubic(start)) {
            const c1 = { x: start.c1!.x + sdx, y: start.c1!.y + sdy };
            const c2 = { x: start.c2!.x + sdx, y: start.c2!.y + sdy };
            next.c1 = shiftKey ? snapClampByKey('c1', c1) : clampByKey('c1', c1);
            next.c2 = shiftKey ? snapClampByKey('c2', c2) : clampByKey('c2', c2);
          }
          return next;
        }
        return s;
      }));
    },

    onDragEnd: ({ movement: [mx, my], shiftKey }) => {
      const lockedId = dragRef.current.shapeId;
      const start    = dragRef.current.start;
      if (!lockedId || !start) {
        dragRef.current.start = null;
        dragRef.current.shapeId = null;
        return;
      }
      if (!shiftKey) {
        dragRef.current.start = null;
        dragRef.current.shapeId = null;
        return;
      }

      let sdx: number, sdy: number;
      const anchor = isPath(start) ? start.nodes[0].p : start.p0;
      sdx = snap(anchor.x + mx) - anchor.x;
      sdy = snap(anchor.y + my) - anchor.y;

      const anchors: Pt[] = isPath(start)
        ? start.nodes.map(n => n.p)
        : [start.p0, start.p1];

      const minX = Math.min(...anchors.map(p => p.x));
      const maxX = Math.max(...anchors.map(p => p.x));
      const minY = Math.min(...anchors.map(p => p.y));
      const maxY = Math.max(...anchors.map(p => p.y));
      sdx = clamp(sdx, -minX, W - maxX);
      sdy = clamp(sdy, -minY, H - maxY);

      setShapes(prev => prev.map(s => {
        if (s.id !== lockedId) return s;

        if (isPath(start) && isPath(s)) {
          const nodes = s.nodes.map((n,i) => ({
            p:  { x: start.nodes[i].p.x  + sdx, y: start.nodes[i].p.y  + sdy },
            h1: start.nodes[i].h1 ? { x: start.nodes[i].h1!.x + sdx, y: start.nodes[i].h1!.y + sdy } : undefined,
            h2: start.nodes[i].h2 ? { x: start.nodes[i].h2!.x + sdx, y: start.nodes[i].h2!.y + sdy } : undefined,
          }));
          return { ...s, nodes };
        } else if (!isPath(start) && !isPath(s)) {
          const next: Stroke = {
            ...s,
            p0: snapClampByKey('p0', { x: start.p0.x + sdx, y: start.p0.y + sdy }),
            p1: snapClampByKey('p1', { x: start.p1.x + sdx, y: start.p1.y + sdy }),
          };
          if (isCubic(start)) {
            next.c1 = snapClampByKey('c1', { x: start.c1!.x + sdx, y: start.c1!.y + sdy });
            next.c2 = snapClampByKey('c2', { x: start.c2!.x + sdx, y: start.c2!.y + sdy });
          }
          return next;
        }
        return s;
      }));

      dragRef.current.start = null;
      dragRef.current.shapeId = null;
    },
  });

  // 선택 변경 시 진행 중 드래그 스냅샷 폐기(안전)
  useEffect(() => {
    dragRef.current.start = null;
    dragRef.current.shapeId = null;
  }, [selected]);

  // 키보드: Backspace/Delete 삭제, C 토글, Esc 해제
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      if (isTyping) return;

      if ((e.key === 'Backspace' || e.key === 'Delete') && selected) {
        e.preventDefault();
        removeSelected();
        setSelected(null);
      } else if (e.key.toLowerCase() === 'c') {
        toggleCubic();
      } else if (e.key.toLowerCase() === 'm') {
        mergeSelected();
      } else if (e.key.toLowerCase() === 'escape') {
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, shapes]);

  return (
    <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems:'center' }}>
        <button onClick={addStroke}>+ Stroke(라인 시작)</button>
        <button onClick={toggleCubic} disabled={!selected}>Curve Toggle (C)</button>
        <button onClick={mergeSelected} disabled={!selected}>Merge to Path (M)</button>
        <button onClick={deselect} disabled={!selected}>Deselect</button>
        <button onClick={removeSelected} disabled={!selected}>Delete (⌫)</button>
        <button onClick={saveJSON}>Save JSON (console)</button>
        <span style={{ marginLeft: 8, color: '#555' }}>
          기본: 자유 이동 · <b>Shift</b>: 드래그 중/끝 스냅 · C: 큐빅 토글 · M: 병합
        </span>
      </div>

      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 12 }}
        {...bindCanvas()}
      >
        {/* stroke는 캔버스 안에서만 보이게 clip, 핸들은 clip 미적용 */}
        <defs>
          <clipPath id="canvasClip">
            <rect x="0" y="0" width={W} height={H} />
          </clipPath>
          <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#eee" strokeWidth="1" />
          </pattern>
        </defs>

        {/* 배경(클릭 시 선택 해제) */}
        <rect x="0" y="0" width={W} height={H} fill="url(#grid)" onMouseDown={() => setSelected(null)} />

        {/* 도형(클립 적용) */}
        <g clipPath="url(#canvasClip)">
          {shapes.map(s => (
            <path
              key={`path-${s.id}`}
              d={toPathD(s)}
              fill="none"
              stroke={(s as any).stroke ?? '#111'}
              strokeWidth={(s as any).strokeWidth ?? 4}
              opacity={selected === s.id ? 1 : 0.9}
              onMouseDown={(e) => { e.stopPropagation(); setSelected(s.id); }}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* 보조선 + 핸들 (Stroke만 표시; Path 편집은 추후 추가) */}
        {shapes.map(s => {
          if (isPath(s)) return null;
          return (
            <g key={`handles-${s.id}`} onMouseDown={(e) => { e.stopPropagation(); setSelected(s.id); }}>
              {isCubic(s) && (
                <>
                  <path d={`M ${s.p0.x} ${s.p0.y} L ${s.c1!.x} ${s.c1!.y}`} stroke="#cbd5e1" fill="none" />
                  <path d={`M ${s.p1.x} ${s.p1.y} L ${s.c2!.x} ${s.c2!.y}`} stroke="#cbd5e1" fill="none" />
                </>
              )}
              {selected === s.id && (
                <>
                  <Handle
                    p={s.p0}
                    onDrag={(dx, dy, meta) => movePoint(s.id, 'p0', dx, dy, meta)}
                    onDragEnd={(_, __, meta) => commitPoint(s.id, 'p0', meta)}
                    label="p0"
                  />
                  {isCubic(s) && (
                    <Handle
                      p={s.c1!}
                      onDrag={(dx, dy, meta) => movePoint(s.id, 'c1', dx, dy, meta)}
                      onDragEnd={(_, __, meta) => commitPoint(s.id, 'c1', meta)}
                      label="c1"
                    />
                  )}
                  {isCubic(s) && (
                    <Handle
                      p={s.c2!}
                      onDrag={(dx, dy, meta) => movePoint(s.id, 'c2', dx, dy, meta)}
                      onDragEnd={(_, __, meta) => commitPoint(s.id, 'c2', meta)}
                      label="c2"
                    />
                  )}
                  <Handle
                    p={s.p1}
                    onDrag={(dx, dy, meta) => movePoint(s.id, 'p1', dx, dy, meta)}
                    onDragEnd={(_, __, meta) => commitPoint(s.id, 'p1', meta)}
                    label="p1"
                  />
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
