import { small } from '../strings';
import json from '../index';

const originalSecretKey = json.SECRET_KEY;

describe('bin-json', () => {
  afterEach(() => {
    json.SECRET_KEY = originalSecretKey;
  });

  it('encodes to an ArrayBuffer', () => {
    const buffer = json.encode('data');

    expect(buffer).toEqual(expect.any(ArrayBuffer));
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
    const data = { [json.SECRET_KEY]: ['b', 0] };

    const result = json.decode(json.encode(data));

    expect(result).toEqual(data);
  });

  it('allows you to configure the secret key', () => {
    json.SECRET_KEY = 'lol';
    const binary = small.encode('bacon');

    const data = {
      binary,
      something: {
        [json.SECRET_KEY]: [8, 0],
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
});
