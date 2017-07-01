const getCharCode = (char) => char.charCodeAt(0);

/**
 * Only handles small character codes (0-255). Used to encode
 * the buffer header, where each sub-buffer's length is stored.
 */
export const small = {

  /**
   * Turn a string into a typed array.
   * @param  {String} chars - Restricted to common characters.
   * @return {Uint8Array} - Character codes mapped into a typed array.
   */
  encode: (chars) => {
    const codes = chars.split('').map(getCharCode);
    const view = new Uint8Array(codes.length);
    view.set(codes, 0);

    return view;
  },

  /**
   * Turns a buffer of single-byte character codes into a string.
   * @param  {ArrayBuffer} buffer - String data.
   * @return {String} - The interpreted buffer.
   */
  decode: (buffer) => {
    const view = new Uint8Array(buffer);
    const codes = Array.prototype.slice.call(view);

    return String.fromCharCode(...codes);
  },
};
