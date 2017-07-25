import { pack, unpack } from './packager';
import { large } from './strings';

let BufferType = null;

/**
 * Sets a global buffer encoder. Useful in Node environments
 * or anywhere the `buffer` package is used.
 * @param  {Buffer|null} Buffer - A Node.js `Buffer` style interface.
 * @return {Object} - The json encoder/decoder.
 */
exports.use = Buffer => {
  BufferType = Buffer;
};

exports.SECRET_KEY = 'BIN_JSON_PNTR';

const BUFFER = 'Buffer';

/**
 * Detects if the value was a JSON-coerced Node-style buffer.
 * @param  {Any} value - Potential node buffer.
 * @return {Boolean} - Whether the value is a node buffer.
 */
const isNodeBuffer = value =>
  Boolean(value.type === BUFFER && value.data && value.data.slice);

/**
 * Determines if a value is an ArrayBuffer view.
 * @param  {Any} data - Anthing.
 * @return {Boolean} - True for typed arrays, false for anything else.
 */
const isBuffer = data => {
  if (!data) {
    return false;
  }

  // Typed arrays.
  if (data.buffer instanceof ArrayBuffer) {
    return true;
  }

  // Workaround for Node-style Buffers.
  if (isNodeBuffer(data)) {
    return true;
  }

  return false;
};

// TypedArray constants.
const bufferTypes = {
  i8: 1,
  ui16: 2,
  i16: 3,
  ui32: 4,
  i32: 5,
  f32: 6,
  f64: 7,
};

// Map constants to TypedArray constructors.
const arrayTypes = {
  [bufferTypes.i8]: Int8Array,
  [bufferTypes.ui16]: Uint16Array,
  [bufferTypes.i16]: Int16Array,
  [bufferTypes.ui32]: Uint32Array,
  [bufferTypes.i32]: Int32Array,
  [bufferTypes.f32]: Float32Array,
  [bufferTypes.f64]: Float64Array,
};

/**
 * Turn a TypedArray instance into a constant representing its type.
 * @param  {TypedArray} buffer - Any typed array.
 * @return {Number|null} - A numerical constant, or null for the default.
 */
const getBufferType = buffer => {
  switch (buffer.constructor) {
    case Int8Array:
      return bufferTypes.i8;
    case Uint16Array:
      return bufferTypes.ui16;
    case Int16Array:
      return bufferTypes.i16;
    case Uint32Array:
      return bufferTypes.ui32;
    case Int32Array:
      return bufferTypes.i32;
    case Float32Array:
      return bufferTypes.f32;
    case Float64Array:
      return bufferTypes.f64;
    default:
      return null;
  }
};

/**
 * Reconstructs a buffer view using the original encoding.
 * If `json.Buffer` is set, it constructs it using that.
 * @param  {String} [type] - A constant representing the array type.
 * @param  {ArrayBuffer} buffer - Any binary data.
 * @return {TypedArray|json.Buffer} - A typed array or json.Buffer instance.
 */
const createBufferView = (type, buffer) => {
  const TypedArray = arrayTypes[type] || Uint8Array;
  const view = new TypedArray(buffer);
  return BufferType ? BufferType.from(view) : view;
};

/**
 * Stringifies JSON data and leaves a pointer where binary values were.
 * @param  {Mixed} data - Any JSON compatible data (or binary).
 * @return {Object} data.json - The stringified json data.
 * @return {Object} data.buffers - A list of extracted buffers.
 */
const serialize = data => {
  const buffers = [];

  const json = JSON.stringify(data, (key, value) => {
    if (!isBuffer(value)) {
      return value;
    }

    // `JSON.stringify` calls `.toJSON` on buffers before
    // this function sees them, which turns the ArrayBuffer
    // into a JS array. I'm not sure if there's a cleaner way to handle this.
    if (isNodeBuffer(value)) {
      value = new Uint8Array(value.data);
    }

    const index = buffers.push(value) - 1;

    // Remember the TypedArray kind.
    const bufferType = getBufferType(value);
    const pointer = bufferType ? [index, bufferType] : [index];

    return { [exports.SECRET_KEY]: pointer };
  });

  return { buffers, json };
};

/**
 * Turns JSON data (possibly intermixed with binary) into a buffer.
 * If the data is `undefined`, you'll get `undefined` back.
 * @param  {Mixed} data - Supports JSON datatypes & binary.
 * @return {ArrayBuffer|void} - An array buffer representing the given data.
 */
exports.encode = data => {
  if (data === undefined) {
    return data;
  }

  const { json, buffers } = serialize(data);
  const everything = buffers.concat(large.encode(json));
  const buffer = pack(everything);

  // Some Node APIs don't recognize ArrayBuffers (e.g., zlib).
  // If `json.Buffer` is set, it gives better Node interop.
  return BufferType ? BufferType.from(buffer) : buffer;
};

/**
 * Creates a function which reassembles the json and buffer data.
 * @param  {ArrayBuffer[]} buffers - Every unpacked buffer except the JSON.
 * @param  {String} [key] - Name of the value property (given by JSON.parse()).
 * @param  {Mixed} value - A json datatype.
 * @return {Mixed} - Either the same json value or a new buffer.
 */
const deserialize = buffers => (key, value) => {
  if (!value) {
    return value;
  }

  if (!value[exports.SECRET_KEY]) {
    return value;
  }

  const [index, TYPE] = value[exports.SECRET_KEY];

  if (index in buffers) {
    // Reconstruct the data in the original buffer view.
    return createBufferView(TYPE, buffers[index]);
  }

  return value;
};

/**
 * Turns the ArrayBuffer created by `json.encode` back into json.
 * @param  {ArrayBuffer} buffer - Must be a buffer created by `json.encode`.
 * @return {Mixed} - The JSON data, binary values included :tada:
 */
exports.decode = buffer => {
  const typeName = typeof buffer;
  const isObject = typeName === 'object' && !!buffer;

  // Do some validation.
  if (buffer === '[object ArrayBuffer]') {
    throw new TypeError(
      'Hmmm, bin-json.decode(...) was given "[object ArrayBuffer]".\n' +
        'Double check that your encoded data is being handled correctly.',
    );
  }

  if (!isObject) {
    const type = typeName === 'object' ? String(buffer) : typeName;
    throw new TypeError(
      `bin-json.decode() expects a buffer, but was given "${type}".`,
    );
  }

  const parsed = unpack(buffer);
  const buffers = parsed.slice(0, -1);
  const deserializer = deserialize(buffers);

  const json = parsed[parsed.length - 1];
  const string = large.decode(json);

  return JSON.parse(string, deserializer);
};
