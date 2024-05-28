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
  .action((path, options) => {
    const result = pageLoader(path, options.output);
    console.log(result);
    return result;
  });

program.parse(process.argv);
