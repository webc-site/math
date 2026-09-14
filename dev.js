#!/usr/bin/env bun
import { createServer } from "vite";

const dev = async () => {
  const server = await createServer();
  await server.listen();
  server.printUrls();
};

await dev();
