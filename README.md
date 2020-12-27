# bin-json
*Serialize JSON intermixed with binary data*

[![GitHub Workflow](https://img.shields.io/github/workflow/status/PsychoLlama/bin-json/Continuous%20Integration/master?style=flat-square)](https://github.com/PsychoLlama/filament/actions?query=workflow%3A%22Continuous+Integration%22)
[![npm](https://img.shields.io/npm/dt/bin-json.svg?style=flat-square)](https://www.npmjs.com/package/bin-json)
[![npm](https://img.shields.io/npm/v/bin-json.svg?style=flat-square)](https://www.npmjs.com/package/bin-json)

## --- UNMAINTAINED ---
When I wrote this I was a noob who didn't know about [MessagePack](https://msgpack.org/). I'm still a noob, but at least I know about MessagePack.

You should use that instead.

---

## What for?
First off, let's get this out of the way: `bin-json` is not a [BSON](https://docs.mongodb.com/manual/reference/bson-types/) alternative. It aims to solve a different problem. The sole purpose of `bin-json` is efficiently adding binary types to json.

I built this tool because I needed to attach mime types to binary payloads. Prefixing the payload with a mime header would work, but quickly becomes clunky as you add more information, like streaming metadata or timestamps. My target was the expressiveness of JSON, and the space efficiency of binary.

Here's what it looks like:

```js
import json from 'bin-json'

const buffer = json.encode({
  mime: 'image/png',
  images: catPictures.map((path) => readFileSync(path)),
})

const data = json.decode(buffer)
// {
//   mime: 'image/png',
//   images: [Uint8Array(52415), Uint8Array(43170)]
// }
```

## How's it work?

Under the hood it's extracting all the binary values from the json tree, replacing them with pointers, encoding the JSON as an `ArrayBuffer`, and concatenating it alongside the other binary assets. Decoding simply reverses the process.

Things You're Probably Wondering About :tm:

- Yes, emojis work :clap: (and, you know, chinese characters)
- It's space efficient, metadata only adds a few more bytes
- `bin-json` is a json superset and regular json works just fine
- It works in both Node and the browser

## Usage
This package is hosted on npm. You probably know how to install it, but here's a copy/paste friendly snippet:

```sh
# Yarn
yarn add bin-json

# npm
npm install --save bin-json
```

`bin-json` exports an object with two functions: `encode` and `decode`. `.encode()` takes the sort of data `JSON.stringify` would usually take, but returns an `ArrayBuffer` instead. `decode()` parses the data back out.

```js
import json from 'bin-json'

// returns "ArrayBuffer {}"
const buffer = json.encode({
  greeting: Buffer.from('hey binary world'),
  other: {
    nested: { data: true },
    values: 'strings',
    numbers: 10,
    floats: 6.837,
  },
})

json.decode(buffer)
// {
//   greeting: Uint8Array [104, 101, 121, 32, 98, 105, 110, 97...],
//   other: {
//     nested: { data: true },
//     values: 'strings',
//     numbers: 10,
//     floats: 6.837,
//   }
// }
```

## Notes on conversion
Moving your binary data to a format different than `Uint8Array` is pretty easy. Assuming you've got a reference to a `Buffer` constructor (it's a global in node and there's [something similar](https://www.npmjs.com/package/buffer) for the browser), here's how you convert it:

```js
const buffer = json.encode({ message: Buffer.from('hi') })
const { message } = json.decode(buffer)
// Uint8Array(2) [68, 69]

const result = Buffer.from(message.buffer)
console.log(result.toString()) // prints "hi"
```

Alternatively, you can construct new typed array views by passing the `.buffer` property. For example, transforming a `Uint8Array` to an `Int16Array` looks like this:

```js
const int8Array = new Uint8Array(30).fill(5)
const int16Array = new Int16Array(int8Array.buffer)
```

More details about typed arrays can be [found here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray).

## Make everything a `Buffer`
Working in an environment with a [`Buffer`](https://nodejs.org/api/buffer.html) implementation? `bin-json` has an option to automatically convert typed arrays into their `Buffer` equivalents.

```js
import json from 'bin-json'

json.use(Buffer)

const buffer = json.encode({ data: Buffer.from('buffers!') })
// <Buffer 38 2c 36 30 00 62 75 66 66 65 72 73 21 7b ... >

json.decode(buffer)
// { data: <Buffer 62 75 66 66 65 72 73 21> }
```

Calling `json.use()` tells `bin-json` to use `Buffer` everywhere it would normally use a typed array or `ArrayBuffer`.

> **Note:** Data is still encoded and decoded with typed arrays under the hood. `json.use(Buffer)` is only API sugar.

## Roadmap
- Deduplicate nested buffers (`encode({ buff1: buffer, buff2: buffer })` will contain `buffer` twice).

## Browser support
Binary data manipulation is still somewhat new to JavaScript. In standard browser support units, that's IE >= 10 (or Node >= v4). `bin-json` operates through `ArrayBuffer` instances, so make sure your target environments support it.

- [ES6 Compatibility Table](https://kangax.github.io/compat-table/es6/#test-typed_arrays)
- [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#Browser_compatibility)
- [caniuse](http://caniuse.com/#search=typed%20arrays)

Although it _could_ work in Node 4, `bin-json` only targets maintained node versions.

## Human support
:boom: Find a bug? Submit an issue.

:bulb: Have an idea? Also submit an issue.

:thumbsup: Think I'm cool or this project is cool? Give it a star :sparkles:
