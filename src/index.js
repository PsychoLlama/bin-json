import { pack, unpack } from './packager';
import { large } from './strings';

const BIN_JSON_SECRET_KEY = 'BIN_JSON_SECRET_KEY';
exports.SECRET_KEY = BIN_JSON_SECRET_KEY;

/**
 * Determines if a value is an ArrayBuffer view.
 * @param  {Any} data - Anthing.
 * @return {Boolean} - True for typed arrays, false for anything else.
 */
const isBuffer = (data) => {
  if (!data) {
    return false;
  }

  if (data.buffer instanceof ArrayBuffer) {
    return true;
  }

  return false;
};

/**
 * Stringifies JSON data and leaves a pointer where binary values were.
 * @param  {Mixed} data - Any JSON compatible data (or binary).
 * @return {Object} data.json - The stringified json data.
 * @return {Object} data.buffers - A list of extracted buffers.
 */
const serialize = (data) => {
  const buffers = [];

  const json = JSON.stringify(data, (key, value) => {
    if (!isBuffer(value)) {
      return value;
    }

    const index = buffers.length;
    buffers.push(value);

    return {
      [exports.SECRET_KEY]: ['b', index],
    };
  });

  return { buffers, json };
};

/**
 * Turns JSON data (possibly intermixed with binary) into a buffer.
 * If the data is `undefined`, you'll get `undefined` back.
 * @param  {Mixed} data - Supports JSON datatypes & binary.
 * @return {ArrayBuffer|void} - An array buffer representing the given data.
 */
exports.encode = (data) => {
  if (data === undefined) {
    return data;
  }

  const { json, buffers } = serialize(data);
  const everything = buffers.concat(large.encode(json));
  const buffer = pack(everything);

  return buffer;
};

/**
 * Creates a function which reassembles the json and buffer data.
 * @param  {ArrayBuffer[]} buffers - Every unpacked buffer except the JSON.
 * @param  {String} [key] - Name of the value property (given by JSON.parse()).
 * @param  {Mixed} value - A json datatype.
 * @return {Mixed} - Either the same json value or a new buffer.
 */
const deserialize = (buffers) => (key, value) => {
  if (!value) {
    return value;
  }

  if (!value[exports.SECRET_KEY]) {
    return value;
  }

  const [, index] = value[exports.SECRET_KEY];
  if (index in buffers) {
    return new Uint8Array(buffers[index]);
  }

  return value;
};

/**
 * Turns the ArrayBuffer created by `json.encode` back into json.
 * @param  {ArrayBuffer} buffer - Must be a buffer created by `json.encode`.
 * @return {Mixed} - The JSON data, binary values included :tada:
 */
exports.decode = (buffer) => {
  const parsed = unpack(buffer);
  const buffers = parsed.slice(0, -1);
  const deserializer = deserialize(buffers);

  const json = parsed[parsed.length - 1];
  const string = large.decode(json);

  return JSON.parse(string, deserializer);
};
