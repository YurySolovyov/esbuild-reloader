((opt) => {
  const { url, reconnectTimeout, retries } = JSON.parse(opt);

  const state = {
    build: null,
    retry: 0,
    statusPosted: false,
  };

  const shouldRetry = () => (retries === 'always' || state.retry + 1 >= retries);

  const nextRetry = () => {
    if (retries !== 'always') {
      state.retry = Math.min(state.retry + 1, retries);
    }
  };

  const wait = () => new Promise((resolve) => setTimeout(resolve, reconnectTimeout));

  const connect = () => {
    return new Promise((resolve) => {
      const socket = new WebSocket(url);

      socket.addEventListener('open', () => {
        if (!state.statusPosted) {
          console.info('[Reloader connected]');
          state.statusPosted = true;
        }
      });

      socket.addEventListener('error', () => {
        socket.close();
        resolve(true);
      });

      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'init') {
          if (state.build === null) {
            state.build = message.build;
          } else if (build.build !== message.build) {
            location.reload();
          }
        }

        if (message.type === 'build') {
          resolve(false);
          location.reload();
        }
      });

      socket.addEventListener('close', () => resolve(true));
    });
  };

  const loop = async () => {
    let looping = true;

    while(looping) {
      try {
        looping = await connect();
      } finally {
        if (shouldRetry()) {
          await wait();
        } else {
          break;
        }
      }
    }
  };

  loop();
})(__esbuild_reloader);
