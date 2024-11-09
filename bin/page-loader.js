#!/usr/bin/env node

import { Command } from 'commander';

import pageLoader from '../src/page-loader.js';

const program = new Command();

program
  .name('page-loader')
  .description('Page loader utility')
  .version('1.0.0')
  .option('-o, --output [dir]', 'output dir (default: "/home/user/current-dir"')
  .arguments('<path>')
  .action((path, options) => pageLoader(path, options.output));

program.parse(process.argv);
