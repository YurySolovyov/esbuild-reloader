((opt) => {
  const { url, reconnectTimeout } = JSON.parse(opt);

  const build = {
    current: null,
  };

  const wait = () => new Promise((resolve) => setTimeout(resolve, reconnectTimeout));

  const connect = () => {
    return new Promise((resolve) => {
      const socket = new WebSocket(url);

      socket.addEventListener('open', () => console.info('[Reloader connected]'));

      socket.addEventListener('error', () => {
        socket.close();
        resolve(true);
      });

      socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'init') {
          if (build.current === null) {
            build.current = message.build;
          } else if (build.current !== message.build) {
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
        await wait();
      }
    }
  };

  loop();
})(__esbuild_reloader);
