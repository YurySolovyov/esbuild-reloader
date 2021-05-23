const path = require('path');
const crypto = require('crypto');

const ws = require('ws');

const state = {
  uuid: null,
};

const enabled = (build) => {
  if (build.initialOptions.watch === undefined) {
    console.log('No watch mode detected. Did you forgot to specify `watch: true` ?')
    return false;
  }

  return true;
};

const useServer = (build, { host, port, reconnectTimeout }) => {
  const wss = new ws.Server({ host, port });
  const send = (socket, message) => socket.send(JSON.stringify(message));

  wss.on('connection', (ws) => send(ws, { type: 'init', build: state.uuid }));

  build.onEnd(result => {
    state.uuid = crypto.randomUUID();

    wss.clients.forEach(socket => send(socket, { type: 'build' }))
  });

  return {
    reconnectTimeout,
    url: `ws://${host}:${port}/`,
  };
};

const useOptions = (overrides) => ({
  ...overrides,
  host:             'localhost',
  port:             8001,
  reconnectTimeout: 5000,
});

const inject = (build, server) => {
  const { initialOptions } = build;
  const client = path.resolve(__dirname, './client.js');

  initialOptions.inject = initialOptions.inject === undefined
    ? [client]
    : initialOptions.inject.concat(client);

  initialOptions.define = {
    ...initialOptions.define,
    __esbuild_reloader: `\'${JSON.stringify(server)}\'`,
  };
};

module.exports = (overrides = {}) => ({
  name: 'reloader',
  setup(build) {
    if (enabled(build)) {
      const options = useOptions(overrides);
      const server = useServer(build, options);
      inject(build, server);
    }
  }
});
