# bin-json
*Serialize JSON intermixed with binary data*

## What for?
What about [BSON](https://docs.mongodb.com/manual/reference/bson-types/), [Smile](https://en.wikipedia.org/wiki/Smile_(data_interchange_format)), and [universal binary JSON](https://github.com/ubjson/universal-binary-json)? Do we really need another standard?

Those tools are great, and this library isn't meant to replace any of them. While the tools mentioned above define an entirely new JSON mapping made from binary data, (and in the case of BSON adding a few new types in the process), all this library does is add one thing to JSON: binary.

The main goal is to wrap binary assets in JSON structures, letting you express things usually left to the transport layer (like mime types and multipart chunking metadata).

Works in IE 10+.

## How?
Here's some code:

```js
import json from 'bin-json'

const buffer = json.toBinary({
  buffer: readFileSync('some-image.jpg'),
  type: 'image/jpg',
})

const data = json.toObject(buffer)
// { buffer: Buffer<...>, type: 'image/jpg' }
```

It takes your json and turns it into an `ArrayBuffer`, storing your json in the same buffer as the binary data it held.

> **Note:** I'm practicing readme-driven development - only part of this works right now.
