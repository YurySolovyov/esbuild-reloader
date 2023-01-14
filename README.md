# esbuild-reloader

Plugin that reloads the page on every build.


## Installing

```sh
npm install --save-dev esbuild-reloader

# or

yarn add -D esbuild-reloader
```

## Configuration

To use reloader, use watch mode via context API:

```js
const reloader = require('esbuild-reloader');

const watch = async () => {
  const context = await esbuild.context({
    // ...
    plugins: [
      // ...
      reloader({ enabled: () => true }),
    ],
  });

  await context.watch();
};

watch();
```

`enabled` field controls reloader activation in case you want to run it conditionally, e.g:

```js
{
  enabled: () => process.env.NODE_ENV === 'development'
}
```

### Options

```js
{
  enabled: () => Boolean      // default () => false
  host: String,               // default 'localhost'
  port: Number,               // default 8001
  reconnectTimeout: Number,   // default 5000
  retries: Number | 'always', // default 10
}
```
