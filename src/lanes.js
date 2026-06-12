import { WIDTH } from "./constants.js?v=20260510-attract-credits";

const WRAP = 256;

export function riverat(y, t) {
  switch (y) {
    case 120:
      return -t;
    case 104:
      return t;
    case 88:
      return 5 * t / 4;
    case 72:
      return -t / 2;
    case 56:
      return t / 2;
    default:
      return 0;
  }
}

export function roadObjects(t, level = 1) {
  return [
    ...wrappedGroup(-t / 2, 152, 32, [{ id: 5, ox: 0 }, { id: 6, ox: 16 }], roadOffsets("truck", level), "truck"),
    ...wrappedGroup(2 * t, 168, 16, [{ id: 8, ox: 0 }], roadOffsets("race-car", level), "race-car"),
    ...wrappedGroup(-t, 184, 16, [{ id: 7, ox: 0 }], roadOffsets("purple-car", level), "purple-car"),
    ...wrappedGroup(t, 200, 16, [{ id: 4, ox: 0 }], roadOffsets("dozer", level), "dozer"),
    ...wrappedGroup(-t, 216, 16, [{ id: 3, ox: 0 }], roadOffsets("yellow-car", level), "yellow-car")
  ];
}

export function riverObjects(t, level = 1) {
  return [
    ...repeatRiverMixed(56, t, 70, 210, (index) => {
      if (usesCrocodileLog(index, level)) return crocodilePieces(t);
      return logPieces(level >= 4 ? 1 : 2);
    }, (pieces) => pieces[0].kind ?? "log"),
    ...repeatRiver(72, t, 50, 250, (index) => turtlePieces(2, t, index % turtleSinkEvery(level) === turtleSinkOffset(level)), "turtle"),
    ...repeatRiver(88, t, 128, 256, logPieces(level >= 5 ? 4 : 5), "log"),
    ...repeatRiver(104, t, 80, 240, logPieces(1), "log"),
    ...repeatRiver(120, t, 64, 256, (index) => turtlePieces(3, t, index % bottomTurtleSinkEvery(level) === bottomTurtleSinkOffset(level)), "turtle")
  ];
}

function roadOffsets(kind, level) {
  const offsets = {
    "truck": level >= 4 ? [0, 80, 160] : [0, 116],
    "race-car": level >= 3 ? [0, 128] : [0],
    "purple-car": level >= 5 ? [0, 60, 120, 180] : [0, 75, 150],
    "dozer": level >= 4 ? [0, 50, 100, 150, 200] : [0, 50, 150],
    "yellow-car": level >= 2 ? [0, 96, 192] : [0, 128]
  };
  return offsets[kind];
}

function crocodileEvery(level) {
  if (level >= 5) return 1;
  if (level >= 3) return 2;
  return 3;
}

function usesCrocodileLog(index, level) {
  if (level < 3) return false;
  const every = crocodileEvery(level);
  return every === 1 || index % every === 1;
}

function turtleSinkEvery(level) {
  return level >= 4 ? 1 : 2;
}

function turtleSinkOffset(level) {
  return level >= 4 ? 0 : 1;
}

function bottomTurtleSinkEvery(level) {
  return level >= 5 ? 2 : 3;
}

function bottomTurtleSinkOffset(level) {
  return level >= 5 ? 1 : 2;
}

function repeatRiver(y, t, every, limit, pieces, kind) {
  return repeatRiverMixed(y, t, every, limit, pieces, () => kind);
}

function repeatRiverMixed(y, t, every, limit, pieces, kindForPieces) {
  const offsets = [];
  for (let i = 0; i < limit; i += every) offsets.push(i);
  return offsets.flatMap((offset, index) => {
    const objectPieces = typeof pieces === "function" ? pieces(index) : pieces;
    const width = objectPieces.reduce((max, piece) => {
      const pieceWidth = piece.width ?? 16;
      return Math.max(max, piece.ox + pieceWidth);
    }, 0);
    return wrappedGroup(riverat(y, t), y, width, objectPieces, [offset], kindForPieces(objectPieces, index));
  });
}

function logPieces(length) {
  const pieces = [{ id: 86, ox: 0 }];
  for (let i = 0; i < length; i += 1) pieces.push({ id: 87, ox: (i + 1) * 16 });
  pieces.push({ id: 88, ox: (length + 1) * 16 });
  return pieces;
}

function turtlePieces(length, t, sinks = false) {
  const sequence = sinks
    ? [
        { id: 50, visible: true, support: true },
        { id: 51, visible: true, support: true },
        { id: 52, visible: true, support: true },
        { id: 53, visible: true, support: false },
        { id: 54, visible: true, support: false },
        { id: 54, visible: false, support: false },
        { id: 54, visible: true, support: false },
        { id: 53, visible: true, support: false },
        { id: 52, visible: true, support: true },
        { id: 51, visible: true, support: true }
      ]
    : [
        { id: 50, visible: true, support: true },
        { id: 51, visible: true, support: true },
        { id: 52, visible: true, support: true }
      ];
  const phaseTicks = sinks ? 16 : 32;
  const frame = sequence[Math.floor(t / phaseTicks) % sequence.length];
  return Array.from({ length }, (_, index) => ({
    id: frame.id,
    ox: index * 16,
    support: frame.support,
    visible: frame.visible
  }));
}

function crocodilePieces(t) {
  const id = Math.floor(t / 28) % 2 ? 78 : 77;
  return [{ id, ox: 0, width: 48, support: true, kind: "river-crocodile" }];
}

function wrappedGroup(baseX, y, width, pieces, offsets, kind) {
  const objects = [];
  offsets.forEach((offset) => {
    const x = normalizeX(baseX + offset, width);
    [-WRAP, 0, WRAP].forEach((shift) => {
      const shiftedX = x + shift;
      if (shiftedX > -width && shiftedX < WIDTH + 16) {
        objects.push({
          x: shiftedX,
          y,
          width,
          height: 16,
          pieces,
          kind,
          support: pieces.some((piece) => piece.support !== false),
          visible: pieces.some((piece) => piece.visible !== false)
        });
      }
    });
  });
  return objects;
}

function normalizeX(x, width) {
  let nx = x;
  while (nx < -width) nx += WRAP;
  while (nx >= WRAP) nx -= WRAP;
  return nx;
}
