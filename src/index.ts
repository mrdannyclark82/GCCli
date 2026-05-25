#!/usr/bin/env node
import 'dotenv/config';
import { MultiModelRouter } from './router/MultiModelRouter.js';
import { CliLoop } from './tui/CliLoop.js';

console.log("🌿 GCCli - Custom Grok CLI");

const router = new MultiModelRouter();
const cli = new CliLoop();

cli.start();
