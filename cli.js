#!/usr/bin/env node

import { mkdirSync, cpSync, renameSync, existsSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import promptSync from "prompt-sync"
import { sync as commandExistsSync } from "command-exists"
import { exit } from 'process';
import { spawnSync } from "node:child_process"

const prompt = promptSync({ sigint: true });

let args = process.argv.slice(2);

function promptPipeline(content, defaultValue, parser = s => s, predicate = () => { }) {
    try {
        let input;
        if (args.length !== 0) {
            input = args.shift();
            console.log(`${content}(${defaultValue}) ${input}`)
        } else
            input = parser(prompt(`${content}(${defaultValue}) `)).trim();

        if (input.length === 0)
            input = defaultValue

        let validate = predicate(input);
        if (typeof validate !== "string")
            return input;
        else
            return promptPipeline(`${validate} Please try again: (${defaultValue})`, defaultValue, parser, predicate)
    } catch (e) {
        console.error(e);
        return promptPipeline(`Could not understand your input. Please try again: (${defaultValue})`, defaultValue, parser, predicate)
    }
}

let manifest = {
    system: {
        packageManager: "npm"
    },
    format: {
        buildInfo: false
    },
    cmd: {
        build: {
            clean: false
        }
    }
};

console.log("This utility will walk you through creating a webpan project.")
console.log()
console.log("Press ^C at any time to quit.")

// project name
let counter = 1
let projectPath = "my-webpan-project";
while (existsSync(projectPath))
    projectPath = `my-webpan-project-${++counter}`

const projectName = promptPipeline(`project name: `, projectPath);
const target = path.join(projectName);

// package manager
let allPackageManagers = [/*"pnpm",*/ "npm"];
let packageManagers = allPackageManagers.filter(commandExistsSync);
if (packageManagers.length === 0) {
    console.log(`Could not find ${allPackageManagers.join(", ")} on system.`)
    console.log("Please set up at least one NodeJS package manager.")
    exit(1);
}

let packageManager = "npm";
/*
let packageManager = promptPipeline(
    `package manager [options: ${packageManagers.join(", ")}]: `,
    packageManagers[0],
    s => s,
    s => packageManagers.includes(s) ? true : "This package manager is not installed on system."
);
*/

manifest.system.packageManager = packageManagers[0];

// start setup
if (existsSync(target)) {
    console.log(`Aborted: there is already a folder at ${target}.`);
    exit(0);
}

mkdirSync(target, { recursive: true });

// locate the template directory inside your package
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const templateDir = path.join(__dirname, 'template');

cpSync(templateDir, target, { recursive: true });
renameSync(path.join(target, "gitignore"), path.join(target, ".gitignore"));
writeFileSync(path.join(target, "wproject.json"), JSON.stringify(manifest, null, 4));

let buildCommand;
let cleanBuildCommand;

switch (packageManager) {
    case "npm":
        console.log()
        console.log("Fetching dependencies with npm...")
        spawnSync("npm", ["update"], { cwd: target, stdio: 'inherit' });

        console.log()
        console.log("Building project with npm...")
        spawnSync("npm", ["update"], { cwd: target, stdio: 'inherit' });
        spawnSync("npm", ["run", "build", "--", "--clean"], { cwd: target, stdio: 'inherit' });

        buildCommand = "npm run build"
        cleanBuildCommand = "npm run build -- --clean"
        break;
        /*
    case "pnpm":
        console.log()
        console.log("Fetching dependencies with pnpm...")
        spawnSync("pnpm", ["update"], { cwd: target, stdio: 'inherit' });

        console.log()
        console.log("Building project with pnpm...")
        spawnSync("pnpm", ["run", "build", "--clean"], { cwd: target, stdio: 'inherit' });

        buildCommand = "pnpm run build"
        cleanBuildCommand = "pnpm run build --clean"
        break;
        */
}

let targetString = /^[a-z0-9_-]+$/i.test(target) ? target : `'${target}'`

console.log()
console.log(`Your webpan project in ${target} is ready to go!`)
console.log()
console.log("Next steps:")
console.log(`  1. go to your project with "cd ${targetString}"`)
console.log(`  2. build your project with "${buildCommand}" (or "${cleanBuildCommand}" for a full rebuild)`)
console.log(`  3. find the generated files at ./build/dist/`)
console.log()
console.log(`Visit https://webpan.siri.ws for documentation.`)
console.log()
