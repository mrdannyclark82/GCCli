#!/usr/bin/env node
import 'dotenv/config';
import { MultiModelRouter } from './router/MultiModelRouter.js';

console.log("🌿 GCCli - Custom Grok CLI");
console.log("Status: Initial structure loaded.");

const router = new MultiModelRouter();
