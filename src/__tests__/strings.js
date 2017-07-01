import { small } from '../strings';

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
