import * as Cdkv3RestTextRecognizer from '../recognizer/cdkv3/rest/Cdkv3RestTextRecognizer';
import * as MyScriptJSParameter from '../configuration/MyScriptJSParameter';

/**
 * @typedef {Object} Stats
 * @property {Number} strokesCount
 * @property {Number} pointsCount
 * @property {Number} byteSize
 * @property {Number} humanSize
 * @property {String} humanUnit
 */

/**
 * @param {Model} model Current model
 * @return {Stats} Statistics about recognition
 */
export function computeStats(model) {
  const stats = { strokesCount: 0, pointsCount: 0, byteSize: 0, humanSize: 0, humanUnit: 'BYTE' };
  if (model.pendingStrokes) {
    stats.strokesCount = model.pendingStrokes.length;

    const restMessage = Cdkv3RestTextRecognizer.buildInput(MyScriptJSParameter.overrideDefaultOptions({}), model);
    stats.pointsCount = model.pendingStrokes.map(stroke => stroke.x.length).reduce((a, b) => a + b, 0);
    // We start with 270 as it is the size in bytes. Make a real computation implies to recode a doRecognition
    const byteSize = restMessage.textInput.length;
    stats.byteSize = byteSize;
    if (byteSize < 270) {
      stats.humanUnit = 'BYTE';
      stats.byteSize = 0;
      stats.humanSize = 0;
    } else if (byteSize < 2048) {
      stats.humanUnit = 'BYTES';
      stats.humanSize = byteSize;
    } else if (byteSize < 1024 * 1024) {
      stats.humanUnit = 'KiB';
      stats.humanSize = (byteSize / 1024).toFixed(2);
    } else {
      stats.humanUnit = 'MiB';
      stats.humanSize = (byteSize / 1024 / 1024).toFixed(2);
    }
  }
  return stats;
}
