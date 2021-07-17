const path = require('path');
const crypto = require('crypto');

const ws = require('ws');

const state = {
  uuid: null,
};

const enabled = (build) => build.initialOptions.watch === true;

const useServer = (build, { host, port, reconnectTimeout, retries }) => {
  const wss = new ws.Server({ host, port });
  const send = (socket, message) => socket.send(JSON.stringify(message));

  wss.on('connection', (ws) => send(ws, { type: 'init', build: state.uuid }));

  build.onEnd(result => {
    state.uuid = crypto.randomUUID();

    wss.clients.forEach(socket => {
      if (result.errors.length === 0) {
        send(socket, { type: 'build' });
      } else {
        send(socket, { type: 'error', errors: result.errors });
      }
    });
  });

  const url = `ws://${host}:${port}/`;

  console.info('[Reloader] Listening on', url);

  return {
    reconnectTimeout,
    retries,
    url,
  };
};

const useOptions = (overrides) => ({
  ...overrides,
  host:             'localhost',
  port:             8001,
  reconnectTimeout: 5000,
  retries:          10,
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
