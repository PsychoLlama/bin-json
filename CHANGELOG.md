# Change Log

> This changelog adopts the [keep-a-changelog style](http://keepachangelog.com/en/0.3.0/) and adheres to [semver](http://semver.org/).

## Unreleased
### Removed
- Dropped support for unmaintained node versions (node < 8).

## 0.3.1
### Changed
- Minor change: now `json.decode(...)` throws a helpful message if you give it an invalid value.

## 0.3.0
### Added
- `json.use(Buffer)` option which automatically converts typed arrays into buffer instances of your choosing.

## 0.2.0
### Added
- Memory of array types (encode as an `Int32Array` and it'll decode as an `Int32Array`).

## 0.1.1
### Fixed
- Handling of Node `Buffer` instances (they were being stringified).

## 0.1.0
Initial release.
