// This is not the same as `global.ArrayBuffer`. See:
// https://github.com/facebook/jest/issues/7780
export const NativeArrayBuffer = new Uint8Array().buffer.constructor;
