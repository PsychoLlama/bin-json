import { small, large } from '../strings';

describe('Small text encoder', () => {
  it('encodes to a Uint8Array', () => {
    const array = small.encode('hello, world!');

    expect([...array]).toEqual([
      104, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33,
    ]);
  });

  it('does not encode larger values', () => {
    const array = small.encode('😎');

    // Expected to fail miserably.
    expect([...array]).toEqual([61, 14]);
  });

  it('decodes text', () => {
    const { buffer } = small.encode('some other text');
    const text = small.decode(buffer);

    expect(text).toBe('some other text');
  });

  it('works with null bytes', () => {
    const { buffer } = small.encode('hey null byte \0');
    const text = small.decode(buffer);

    expect(text).toEqual('hey null byte \0');
  });
});

describe('Large text encoder', () => {
  it('passes sanity checks', () => {
    expect(large.encode).toEqual(expect.any(Function));
    expect(large.decode).toEqual(expect.any(Function));
  });

  it('encodes normal text', () => {
    const { buffer } = large.encode('some string');
    const text = large.decode(buffer);

    expect(text).toBe('some string');
  });

  it('works with multi-byte sequences', () => {
    const data = 'hey, 😎 sunglasses are cool 土豆';
    const { buffer } = large.encode(data);
    const text = large.decode(buffer);

    expect(text).toBe(data);
  });

  it('works with data containing null bytes', () => {
    const data = '\0\0\0lolz\0\0\0';
    const { buffer } = large.encode(data);
    const text = large.decode(buffer);

    expect(text).toBe(data);
  });

  it('works with JSON data', () => {
    const data = JSON.stringify({ bool: true, num: 5.6, str: 'hey' });
    const { buffer } = large.encode(data);
    const text = large.decode(buffer);

    expect(text).toBe(data);
  });
});
