# RealtimeChat based on OpenAI Realtime Console

This is a prototype real-time chat system using [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) and [WebRTC](https://platform.openai.com/docs/guides/realtime-webrtc).

## Installation

Before you begin, you'll need an OpenAI API key - [create one in the dashboard here](https://platform.openai.com/settings/api-keys). Create a `.env` file to set your OpenAI API key in there:

```bash
echo "OPENAI_API_KEY=<....>" > .env
```

Running this application locally requires [Node.js](https://nodejs.org/) to be installed. Install dependencies for the application with:

```bash
npm install
```

Start the application server with:

```bash
npm run dev
```

This should start the console application on [http://localhost:3000](http://localhost:3000).

_Note:_ The `server.js` file uses [@fastify/vite](https://fastify-vite.dev/) to build and serve the React frontend contained in the [`/client`](./client) folder. You can find the configuration in the [`vite.config.js`](./vite.config.js) file.

_Note:_ https access is required to turn on the microphone in a non-local environment.

## License

MIT
