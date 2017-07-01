const getCharCode = (char) => char.charCodeAt(0);

/**
 * Turn a string into a typed array.
 * @param  {TypedArray} ArrayType - Bytes allocated per character.
 * @param  {String} chars - Restricted to common characters.
 * @return {Uint8Array} - Character codes mapped into a typed array.
 */
const encoder = (ArrayType) => (chars) => {
  const codes = chars.split('').map(getCharCode);
  const view = new ArrayType(codes.length);
  view.set(codes, 0);

  return view;
};

/**
 * Turns a buffer of single-byte character codes into a string.
 * @param  {TypedArray} ArrayType - Bytes allocated per character.
 * @param  {ArrayBuffer} buffer - String data.
 * @return {String} - The interpreted buffer.
 */
const decoder = (ArrayType) => (buffer) => {
  const view = new ArrayType(buffer);

  // Older browsers don't support iterable TypedArrays.
  const codes = Array.prototype.slice.call(view);

  return String.fromCharCode(...codes);
};

/**
 * Only handles small character codes (0-255). Used to encode
 * the buffer header, where each sub-buffer's length is stored.
 */
export const small = {
  encode: encoder(Uint8Array),
  decode: decoder(Uint8Array),
};

/**
 * Handles text which can't fit in a single byte, like emojis or
 * chinese characters. Used to encode stringified JSON.
 */
export const large = {
  encode: encoder(Uint16Array),
  decode: decoder(Uint16Array),
};
