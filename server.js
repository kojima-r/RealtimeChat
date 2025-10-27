import Fastify from "fastify";
import FastifyVite from "@fastify/vite";
import fastifyEnv from "@fastify/env";

import multipart from '@fastify/multipart';
import fs from 'fs-extra';
import path from 'path';

import formbody from '@fastify/formbody';

// Fastify + React + Vite configuration
const server = Fastify({
  logger: {
    transport: {
      target: "@fastify/one-line-logger",
    },
  },
});

const schema = {
  type: "object",
  required: ["OPENAI_API_KEY"],
  properties: {
    OPENAI_API_KEY: {
      type: "string",
    },
  },
};

await server.register(fastifyEnv, { dotenv: true, schema });

await server.register(FastifyVite, {
  root: import.meta.url,
  renderer: "@fastify/react",
});

// file upload
//await server.register(multipart);
await server.register(formbody);

await server.vite.ready();

// Server-side API route to return an ephemeral realtime session token
server.get("/token", async () => {
  const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice: "echo",//"nova",
    }),
  });
  console.log(r)

  return new Response(r.body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
});

// POST /saveText にテキストを保存
server.post('/saveText', async (req, reply) => {
  const { filename, content, token } = req.body;

  if (!filename || !content) {
    return reply.code(400).send({ status: 'error', message: 'filename and content required' });
  }

  const safeFilename = path.basename(filename); // パストラバーサル防止
  const filePath = path.join('texts', safeFilename + '.txt');
  await fs.ensureDir('texts');
  await fs.writeFile(filePath, content, 'utf8');


  const logFilename = path.basename(filename); // パストラバーサル防止
  const logPath = path.join('texts', logFilename +"."+token+ '.txt');
  await fs.ensureDir('texts');
  await fs.writeFile(logPath, content, 'utf8');

  reply.send({ status: 'ok', saved: filePath ,log: logPath });
});

server.get('/readText', async (req, reply) => {
  try {
    const filePath = path.resolve('./texts/message_log.txt');
    const text = await fs.readFile(filePath, 'utf8');
    // 行に分割（LF/CRLF対応）して最後の10行を取得
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    const last = lines.slice(-10);
    
    reply
      .code(200)
      .header('Content-Type', 'text/plain; charset=utf-8')
      .send(last.join('\n'));
  } catch (err) {
    server.log.error(err);
    reply.code(500).send('ファイルの読み込みに失敗しました');
  }
});


console.log("***")
//await server.listen({ host: '0.0.0.0',  port: process.env.PORT || 3000 });
await server.listen({port: process.env.PORT || 3000 });
