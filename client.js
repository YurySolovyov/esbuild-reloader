((opt) => {
  const { url, reconnectTimeout, retries } = JSON.parse(opt);

  const state = {
    build: null,
    retry: 0,
    statusPosted: false,
  };

  const renderErrorBody = (errors) => {
    const zIndexMax = 2147483647;

    const errorsContent = errors.map(({ location, text }) => {
      const positionInfo = `${location.file}:${location.line}:${location.column}`;
      const sourceDecoration = `${location.line} | `;
      const errorPointer = "^".repeat(location.length)
      const errorPadding = " ".repeat(sourceDecoration.length + location.column);

      const pathLine = `> ${positionInfo}: <span class="red">error: </span> ${text}`;
      const sourceLine = `${sourceDecoration}${location.lineText}`;
      const pointerLine = `${errorPadding}${errorPointer}`;

      return `<pre>${pathLine}\n${sourceLine}\n<span class="red">${pointerLine}</span></pre>`;
    });

    const template = `
      <div>
        <style>
        #esbuild-reloader-error-overlay {
          z-index: ${zIndexMax};
          position: absolute;
          background: #fff;
          width: 100vw;
          height: 100vh;
          top: 0;
        }

        .red { color: #f00; }
        pre { padding: 0 16px; font-size: 1.25em;}
        h1 { margin: 0; padding: 16px; }
        </style>


        <h1>Errors occured during the build:</h1>
        ${errorsContent}
      </div>
    `;

    const existing = document.querySelector('#esbuild-reloader-error-overlay');

    if (existing !== null) {
      existing.innerHTML = template;
    } else {
      const overlay = document.createElement('div');
      document.body.append(overlay);
      overlay.outerHTML = `
        <div id="esbuild-reloader-error-overlay">
          ${template}
        </div>
      `
    }
  };

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

      socket.addEventListener('message', event => {
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

        if (message.type === 'error') {
          renderErrorBody(message.errors);
        }
      });

      socket.addEventListener('close', () => resolve(true));
    });
  };

  const shouldRetry = () => (retries === 'always' || state.retry + 1 >= retries);

  const wait = () => new Promise((resolve) => setTimeout(resolve, reconnectTimeout));

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
