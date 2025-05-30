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

## 環境設定ファイル
`.env`ファイルを作って以下を設定
```
OPENAI_API_KEY=sk-...
VITE_API_KEY=sk-...
```

## アセット類の追加
以下のアセットを追加
```
client/assets/02_eye.gif
client/assets/03_talk.gif
client/assets/04_hand.gif
client/assets/05_handTalk.gif
```
## プロンプトの追加
プロンプトは以下のテキストファイルを追加
```
client/components/prompt.txt
client/components/summary_prompt.txt
```

## License

MIT
