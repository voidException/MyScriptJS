import { modelLogger as logger } from '../configuration/LoggerConfig';
import * as StrokeComponent from './StrokeComponent';
import MyScriptJSConstants from '../configuration/MyScriptJSConstants';
import { getSymbolsBounds } from './Symbol';

export function createModel() {
  return {
    // Current state of the model. Mainly here for debugging purpose.
    state: MyScriptJSConstants.ModelState.INITIALIZING,
    // Stroke in building process.
    currentStroke: undefined,
    // Current recognition id for the model
    currentRecognitionId: undefined,
    // Next recognition id to use.
    nextRecognitionRequestId: 0,
    // Last recognition id used.
    lastRecognitionRequestId: -1,
    // List of pending strokes. Attributes of this object are corresponding to the stroke id (1,2,3 ...)
    pendingStrokes: {},
    // Default symbols, relative to the recognition
    defaultSymbols: [],
    // Contains the symbol to render. It could be : a stroke, a shape(& analyzer) primitives, string, characters...
    recognizedSymbols: [],
    // All the raw strokes already recognized
    rawRecognizedStrokes: [],
    // The recognition output as return by the recognition service.
    rawResult: undefined,
    // Date of creation
    creationTime: new Date().getTime()
  };
}

/**
 * Return a unique identifier of the model. Used for dev purpose.
 * @param model
 * @returns {string}
 */
export function compactToString(model) {
  const pendingStrokeLength = Object.keys(model.pendingStrokes).reduce((a, b) => a + 1, 0);
  return `${model.creationTime} [${model.rawRecognizedStrokes.length}|${pendingStrokeLength}]`;
}

/**
 * Mutate the model given in parameter by adding the new strokeToAdd.
 * @param model
 * @param strokeToAdd
 * @returns {*}
 */
export function updatePendingStrokes(model, strokeToAdd) {
  // We use a reference to the model. The purpose here is to update the pending strokeToAdd only.
  const modelReference = model;
  if (!modelReference.pendingStrokes[modelReference.nextRecognitionRequestId]) {
    modelReference.pendingStrokes[modelReference.nextRecognitionRequestId] = [];
  }
  modelReference.pendingStrokes[modelReference.nextRecognitionRequestId].push(strokeToAdd);
  return modelReference;
}

export function getLastPendingStroke(model) {
  return model.pendingStrokes[model.currentRecognitionId];
}

export function getLastPendingStrokeAsJsonArray(model) {
  const strokes = [];
  getLastPendingStroke(model).forEach((stroke) => {
    strokes.push(StrokeComponent.toJSON(stroke));
  });

  return strokes;
}

function extractPendingStrokesAndDeleteIfNeeded(readingModel, removeAfterExtraction, removingModel) {
  let nonRecognizedStrokes = [];
  for (let recognitionRequestId = (readingModel.lastRecognitionRequestId + 1); recognitionRequestId <= readingModel.currentRecognitionId; recognitionRequestId++) {
    nonRecognizedStrokes = nonRecognizedStrokes.concat(readingModel.pendingStrokes[recognitionRequestId]);
    if (removeAfterExtraction === true) {
      // We are dealing with ref explicitly
      /* eslint-disable no-param-reassign */
      if (removingModel) {
        delete removingModel.pendingStrokes[recognitionRequestId];
      } else {
        delete readingModel.pendingStrokes[recognitionRequestId];
      }
      /* eslint-enable no-param-reassign */
    }
  }
  return nonRecognizedStrokes;
}

export function extractPendingStrokes(readingModel) {
  return (extractPendingStrokesAndDeleteIfNeeded(readingModel, false));
}
export function extractPendingStrokesAndDeleteInRefModel(readingModel, removingModel) {
  return (extractPendingStrokesAndDeleteIfNeeded(readingModel, true, removingModel));
}

/**
 * Mutate the model by adding the new point on a initPendingStroke.
 * @param model
 * @param point
 * @returns {*}
 */
export function endPendingStroke(model, point) {
  const modelReference = model;
  logger.debug('endPendingStroke', point);
  const currentStroke = StrokeComponent.addPoint(modelReference.currentStroke, point);
  // Mutating pending strokes
  updatePendingStrokes(modelReference, currentStroke);
  // Resetting the current stroke to an undefined one
  delete modelReference.currentStroke;
  return modelReference;
}

/**
 * Mutate the model by adding a point and close the current stroke.
 * @param model
 * @param point
 * @param style
 * @returns {*}
 */
export function initPendingStroke(model, point, style) {
  const modelReference = model;
  logger.debug('initPendingStroke', point);
  // Setting the current stroke to an empty one
  modelReference.currentStroke = StrokeComponent.createStrokeComponent(style);
  modelReference.currentStroke = StrokeComponent.addPoint(modelReference.currentStroke, point);
  return modelReference;
}

/**
 * Mutate the model by adding a point to the current pending stroke.
 * @param model
 * @param point
 * @returns {*}
 */
export function appendToPendingStroke(model, point) {
  const modelReference = model;
  logger.debug('appendToPendingStroke', point);
  modelReference.currentStroke = StrokeComponent.addPoint(modelReference.currentStroke, point);
  return modelReference;
}

/**
 * Get the bounds of the current model.
 * @param model
 * @returns {{minX: Number, maxX: Number, minY: Number, maxY: Number}}
 */
export function getBorderCoordinates(model) {
  let modelBounds = { minX: Number.MAX_VALUE, maxX: Number.MIN_VALUE, minY: Number.MAX_VALUE, maxY: Number.MIN_VALUE };

  // Default symbols
  if (model.defaultSymbols && model.defaultSymbols.length > 0) {
    modelBounds = getSymbolsBounds(model.defaultSymbols, modelBounds);
  }
  // Pending strokes
  modelBounds = getSymbolsBounds(extractPendingStrokes(model), modelBounds);
  // Recognized symbols
  if (model.recognizedSymbols && model.recognizedSymbols.length > 0) {
    modelBounds = getSymbolsBounds(model.recognizedSymbols, modelBounds);
  } else {
    modelBounds = getSymbolsBounds(model.rawRecognizedStrokes, modelBounds);
  }
  return modelBounds;
}

export function cloneModel(modelToClone) {
  const clonedModel = Object.assign({}, modelToClone);
  // We clone the properties that need to be. Take care of arrays.
  clonedModel.defaultSymbols = [...modelToClone.defaultSymbols];
  clonedModel.recognizedSymbols = [...modelToClone.recognizedSymbols];
  clonedModel.currentStroke = Object.assign({}, modelToClone.currentStroke);
  clonedModel.pendingStrokes = Object.assign({}, modelToClone.pendingStrokes);
  clonedModel.rawRecognizedStrokes = [...modelToClone.rawRecognizedStrokes];
  clonedModel.rawResult = Object.assign({}, modelToClone.rawResult);
  clonedModel.creationTime = new Date().getTime();
  return clonedModel;
}
