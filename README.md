# esbuild-reloader

Plugin that reloads the page on every build.


## Installing

```sh
npm install --save-dev esbuild-reloader

# or

yarn add -D esbuild-reloader
```

## Configuration

This assumes `watch` mode and does nothing for regular builds:

```js
const reloader = require('esbuild-reloader');

esbuild.build({
  // ...
  watch: true,
  // ...
  plugins: [
    // ...
    reloader(),
  ],
});

```

### Options

```js
{
  host: String,               // default 'localhost'
  port: Number,               // default 8001
  reconnectTimeout: Number,   // default 5000
  retries: Number | 'always', // default 10
}
```
