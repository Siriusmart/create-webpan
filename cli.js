#!/usr/bin/env node

import { mkdirSync, cpSync, renameSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const cwd = process.cwd();
const projectName = process.argv[2] || 'my-webpan-project';
const target = path.join(cwd, projectName);

mkdirSync(target, { recursive: true });

// locate the template directory inside your package
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const templateDir = path.join(__dirname, 'template');

cpSync(templateDir, target, { recursive: true });
renameSync(path.join(target, "gitignore"), path.join(target, ".gitignore"));

console.log(`Created ${projectName}`);
