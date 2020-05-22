import { small, large } from '../strings';
import json from '../index';
import { NativeArrayBuffer } from '../test-utils';

const originalSecretKey = json.SECRET_KEY;

describe('bin-json', () => {
  afterEach(() => {
    json.SECRET_KEY = originalSecretKey;
    json.use(null);
  });

  it('throws if you decode a non-buffer', () => {
    expect(() => json.decode('value')).toThrow(/string/);
    expect(() => json.decode(5)).toThrow(/number/);
    expect(() => json.decode(null)).toThrow(/null/);
    expect(() => json.decode(undefined)).toThrow(/undefined/);

    expect(() => json.decode(json.encode(10))).not.toThrow();
  });

  it('throws a helpful message if given a stringified ArrayBuffer', () => {
    const fail = () => json.decode('[object ArrayBuffer]');

    expect(fail).toThrow(/arraybuffer/i);
  });

  it('encodes to an ArrayBuffer', () => {
    const buffer = json.encode('data');

    expect(buffer).toBeInstanceOf(NativeArrayBuffer);
  });

  it('works with boolean values', () => {
    const truthy = json.decode(json.encode(true));
    const falsy = json.decode(json.encode(false));

    expect(truthy).toBe(true);
    expect(falsy).toBe(false);
  });

  it('works with object values', () => {
    const data = {
      nested: { data: { probably: true } },
      value: 'some string',
    };

    const result = json.decode(json.encode(data));
    expect(result).toEqual(data);
  });

  it('works with numerical values', () => {
    const whole = -19239321242;
    const decimal = 3002384939103.234522798;

    const encodedInt = json.decode(json.encode(whole));
    const encodedFloat = json.decode(json.encode(decimal));

    expect(encodedInt).toBe(whole);
    expect(encodedFloat).toBe(decimal);
  });

  it('works with "null"', () => {
    const value = json.decode(json.encode(null));

    expect(value).toBe(null);
  });

  it('does not work with "undefined"', () => {
    const value = json.encode(undefined);

    expect(value).toBe(undefined);
  });

  it('allows nested typed arrays', () => {
    const binary = small.encode('binary data!');
    const data = {
      enthusiasm: 11,
      nested: { binary },
    };

    const result = json.decode(json.encode(data));

    expect(result).toEqual(data);
  });

  it('allows several nested typed arrays', () => {
    const first = small.encode('binary 1');
    const second = small.encode('binary 2');
    const data = { first, second };

    const result = json.decode(json.encode(data));

    expect(result).toEqual(data);
  });

  it('does not replace broken pointers', () => {
    const data = { [json.SECRET_KEY]: [0, 0] };

    const result = json.decode(json.encode(data));

    expect(result).toEqual(data);
  });

  it('allows you to configure the secret key', () => {
    json.SECRET_KEY = 'lol';
    const binary = small.encode('bacon');

    const data = {
      binary,
      something: {
        [json.SECRET_KEY]: [0, 8],
      },
    };

    const result = json.decode(json.encode(data));

    expect(result).toEqual({
      something: binary,
      binary,
    });
  });

  it('works with buffer arrays', () => {
    const buff1 = Buffer.from('something');
    const buff2 = Buffer.from('else');

    const data = json.encode([buff1, buff2]);
    const result = json.decode(data);

    expect(result.length).toBe(2);
    expect(Buffer.from(result[0])).toEqual(buff1);
    expect(Buffer.from(result[1])).toEqual(buff2);
  });

  it('works with deeply nested arrays', () => {
    const buffer = json.encode({
      buffer: Buffer.from('oh looky a string'),
    });

    const value = json.decode(buffer);

    // Means `.toJSON` is being called on `Buffer`.
    expect(value.buffer.type).toBeFalsy();
    expect(value.buffer.data).toBeFalsy();
    expect(value.buffer).toEqual(expect.any(Uint8Array));
  });

  it('preserves the array type', () => {
    const buffer = json.encode({
      f32: new Float32Array(1),
      f64: new Float64Array(1),
      ui32: new Uint32Array(1),
      i32: new Int32Array(1),
      ui16: new Uint16Array(1),
      i16: new Int16Array(1),
      ui8: new Uint8Array(1),
      i8: new Int8Array(1),
    });

    const data = json.decode(buffer);

    expect(data.f32).toEqual(expect.any(Float32Array));
    expect(data.f64).toEqual(expect.any(Float64Array));
    expect(data.ui32).toEqual(expect.any(Uint32Array));
    expect(data.i32).toEqual(expect.any(Int32Array));
    expect(data.ui16).toEqual(expect.any(Uint16Array));
    expect(data.i16).toEqual(expect.any(Int16Array));
    expect(data.ui8).toEqual(expect.any(Uint8Array));
    expect(data.i8).toEqual(expect.any(Int8Array));
  });

  it('preserves data in custom array types', () => {
    const buffer = json.encode({
      f32: new Float32Array(1).fill(32.5),
      f64: new Float64Array(1).fill(64.5),
      ui32: new Uint32Array(1).fill(32),
      i32: new Int32Array(1).fill(32),
      ui16: new Uint16Array(1).fill(16),
      i16: new Int16Array(1).fill(16),
      ui8: new Uint8Array(1).fill(8),
      i8: new Int8Array(1).fill(8),
    });

    const data = json.decode(buffer);

    expect([...data.f32]).toEqual([32.5]);
    expect([...data.f64]).toEqual([64.5]);
    expect([...data.ui32]).toEqual([32]);
    expect([...data.i32]).toEqual([32]);
    expect([...data.ui16]).toEqual([16]);
    expect([...data.i16]).toEqual([16]);
    expect([...data.ui8]).toEqual([8]);
    expect([...data.i8]).toEqual([8]);
  });

  it('uses `Buffer` if set', () => {
    json.use(Buffer);

    const data = Buffer.from('things');
    const buffer = json.encode(data);
    const result = json.decode(buffer);

    expect(result).toEqual(expect.any(Buffer));
    expect(result).toEqual(data);
  });

  it('indicates the buffer member byte length to `Buffer`', () => {
    json.use(Buffer);

    const data = 'ˆœ˚∆˙˜øçº™🔥∫˙∆–¬…';
    const buffer = json.encode(large.encode(data));
    const result = json.decode(buffer);

    // `Buffer.from` detects the byte sizing based on the input type.
    // If it's given an ArrayBuffer without byte context,
    // some characters will be malformed.
    expect(result).toEqual(Buffer.from(large.encode(data)));
  });

  it('encodes to a `Buffer` if set', () => {
    json.use(Buffer);

    const buffer = json.encode(null);

    expect(buffer).toEqual(expect.any(Buffer));
  });
});
