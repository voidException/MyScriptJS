import { getStrokeBounds } from './StrokeComponent';
import { MusicClefs } from '../renderer/canvas/symbols/MusicSymbolCanvasRenderer';
import MyScriptJSConstants from '../configuration/MyScriptJSConstants';

/**
 * Bounds
 * @typedef {{minX: number, maxX: number, minY: number, maxY: number}} Bounds
 */

function mergeBounds(boundsA, boundsB) {
  return {
    minX: Math.min(boundsA.minX, boundsB.minX),
    maxX: Math.max(boundsA.maxX, boundsB.maxX),
    minY: Math.min(boundsA.minY, boundsB.minY),
    maxY: Math.max(boundsA.maxY, boundsB.maxY)
  };
}

function getLineBounds(line) {
  return {
    minX: Math.min(line.firstPoint.x, line.lastPoint.x),
    maxX: Math.max(line.firstPoint.x, line.lastPoint.x),
    minY: Math.min(line.firstPoint.y, line.lastPoint.y),
    maxY: Math.max(line.firstPoint.y, line.lastPoint.y)
  };
}

function getEllipseBounds(ellipse) {
  const angleStep = 0.02; // angle delta between interpolated points on the arc, in radian

  let z1 = Math.cos(ellipse.orientation);
  let z3 = Math.sin(ellipse.orientation);
  let z2 = z1;
  let z4 = z3;
  z1 *= ellipse.maxRadius;
  z2 *= ellipse.minRadius;
  z3 *= ellipse.maxRadius;
  z4 *= ellipse.minRadius;

  const n = Math.abs(ellipse.sweepAngle) / angleStep;

  const x = [];
  const y = [];

  for (let i = 0; i <= n; i++) {
    const angle = ellipse.startAngle + ((i / n) * ellipse.sweepAngle);
    const alpha = Math.atan2(Math.sin(angle) / ellipse.minRadius, Math.cos(angle) / ellipse.maxRadius);

    const cosAlpha = Math.cos(alpha);
    const sinAlpha = Math.sin(alpha);

    x.push(ellipse.center.x + ((z1 * cosAlpha) - (z4 * sinAlpha)));
    y.push(ellipse.center.y + ((z2 * sinAlpha) + (z3 * cosAlpha)));
  }

  return {
    minX: Math.min(...x),
    maxX: Math.max(...x),
    minY: Math.min(...y),
    maxY: Math.max(...y)
  };
}

function getTextLineBounds(textLine) {
  return {
    minX: textLine.data.topLeftPoint.x,
    maxX: textLine.data.topLeftPoint.x + textLine.data.width,
    minY: textLine.data.topLeftPoint.y,
    maxY: textLine.data.topLeftPoint.y + textLine.data.height
  };
}

function getClefBounds(clef) {
  return {
    minX: clef.boundingBox.x,
    maxX: clef.boundingBox.x + clef.boundingBox.width,
    minY: clef.boundingBox.y,
    maxY: clef.boundingBox.y + clef.boundingBox.height
  };
}

/**
 * Get the box enclosing the given symbols
 * @param {Array} symbols
 * @param {Bounds} [bounds]
 * @return {Bounds}
 */
export function getSymbolsBounds(symbols, bounds = { minX: Number.MAX_VALUE, maxX: Number.MIN_VALUE, minY: Number.MAX_VALUE, maxY: Number.MIN_VALUE }) {
  let boundsRef = bounds;
  boundsRef = symbols
      .filter(symbol => symbol.type === 'stroke')
      .map(getStrokeBounds)
      .reduce(mergeBounds, boundsRef);
  boundsRef = symbols
      .filter(symbol => symbol.type === 'clef')
      .map(getClefBounds)
      .reduce(mergeBounds, boundsRef);
  boundsRef = symbols
      .filter(symbol => symbol.type === 'line')
      .map(getLineBounds)
      .reduce(mergeBounds, boundsRef);
  boundsRef = symbols
      .filter(symbol => symbol.type === 'ellipse')
      .map(getEllipseBounds)
      .reduce(mergeBounds, boundsRef);
  boundsRef = symbols
      .filter(symbol => symbol.type === 'textLine')
      .map(getTextLineBounds)
      .reduce(mergeBounds, boundsRef);
  return boundsRef;
}

function getDefaultMusicSymbols(paperOptions) {
  const defaultStaff = Object.assign({}, { type: 'staff' }, paperOptions.recognitionParams.musicParameter.staff);
  const defaultClef = {
    type: 'clef',
    value: Object.assign({}, paperOptions.recognitionParams.musicParameter.clef)
  };
  defaultClef.value.yAnchor = defaultStaff.top + (defaultStaff.gap * (defaultStaff.count - defaultClef.value.line));
  delete defaultClef.value.line;
  defaultClef.boundingBox = MusicClefs[defaultClef.value.symbol].getBoundingBox(defaultStaff.gap, 0, defaultClef.value.yAnchor);
  return [defaultStaff, defaultClef];
}

/**
 * Get the default symbols for the current recognition type
 * @param {Parameters} paperOptions
 * @return {Array}
 */
export function getDefaultSymbols(paperOptions) {
  switch (paperOptions.recognitionParams.type) {
    case MyScriptJSConstants.RecognitionType.MUSIC:
      return getDefaultMusicSymbols(paperOptions);
    default:
      return [];
  }
}
