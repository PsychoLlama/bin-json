import { readFileSync } from 'fs';

import { pack, unpack } from '../packager';
import { small, large } from '../strings';
import { NativeArrayBuffer } from '../test-utils';

const createBuffer = (arrayBuffer) => Buffer.from(arrayBuffer);

describe('Package', () => {
  it('contains the length of a single buffer', () => {
    const data = Buffer.from('something');
    const buffer = pack([data]);

    expect(buffer).toBeInstanceOf(NativeArrayBuffer);

    const expected = Buffer.from(`${data.byteLength}\0something`);
    expect(Buffer.from(buffer)).toEqual(expected);
  });

  it('contains the length of each buffer in the headers', () => {
    const buff1 = Buffer.from('cool beans');
    const buff2 = Buffer.from('cool potatoes');

    const buffer = pack([buff1, buff2]);

    const expected = Buffer.from('10,13\0cool beanscool potatoes');
    expect(Buffer.from(buffer)).toEqual(expected);
  });

  it('works with empty buffers', () => {
    const buff1 = Buffer.from('');
    const buff2 = Buffer.from('');

    const buffer = pack([buff1, buff2]);

    const expected = Buffer.from('0,0\0');
    expect(Buffer.from(buffer)).toEqual(expected);
  });

  it('works with arbitrary binary data', () => {
    const buff1 = readFileSync(__filename);

    const buffer = pack([buff1]);

    const expected = Buffer.from(`${buff1.length}\0${buff1}`);
    expect(Buffer.from(buffer)).toEqual(expected);
  });

  it('can parse out the buffers again', () => {
    const buff1 = Buffer.from('some data');
    const buff2 = Buffer.from('more data');

    const buffer = pack([buff1, buff2]);
    const buffers = unpack(buffer);

    expect(buffers).toEqual(expect.any(Array));
    buffers.map((buffer) => expect(buffer).toBeInstanceOf(NativeArrayBuffer));
    expect(buffers.map(createBuffer)).toEqual([buff1, buff2]);
  });

  it('can unpack a single buffer', () => {
    const data = Buffer.from('things');

    const buffer = pack([data]);
    const buffers = unpack(buffer);

    expect(buffers.length).toBe(1);
    expect(createBuffer(buffers[0])).toEqual(Buffer.from('things'));
  });

  it('can unpack a buffer with a bunch of characters', () => {
    const data = readFileSync(__filename);

    const buffer = pack([data]);
    const buffers = unpack(buffer);

    expect(createBuffer(buffers[0])).toEqual(data);
  });

  it('respects byte length when combining different dataview sizes', () => {
    const buff1 = small.encode('small text');
    const buff2 = large.encode('large text');

    const buffer = pack([buff1, buff2]);
    const buffers = unpack(buffer);

    expect(new Uint8Array(buffers[0])).toEqual(buff1);
    expect(new Uint16Array(buffers[1])).toEqual(buff2);
  });
});
