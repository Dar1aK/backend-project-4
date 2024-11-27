import axios from 'axios';
import fsp from 'fs/promises';
import debug from 'debug';
import path from 'path';
import { load } from 'cheerio';

import { getAndSaveSources, getSources } from './sourcesUtils.js';
import { getFilesDir, getFilePath } from './utils.js';

const log = debug('page-loader');

const pageLoader = async (pagePath, dir = process.cwd()) => {
  const htmlFileName = `${getFilePath(pagePath)}.html`;
  let outputPage;

  return fsp
    .access(dir)
    .then(() => fsp.mkdir(path.join(dir, getFilesDir(pagePath)), {
      recursive: true,
    }))
    .then(() => axios.get(pagePath))
    .then((result) => {
      const html = result.data;

      log('start', html);

      outputPage = load(html);
      return getSources(outputPage, dir, pagePath);
    })
    .then((sourcesToSave) => getAndSaveSources(sourcesToSave, outputPage, dir, pagePath))
    .then((html) => {
      log('write html', html);
      const outputPath = path.join(dir, htmlFileName);
      const promise = fsp.writeFile(outputPath, html);
      return promise.then(() => outputPath);
    })
    .catch((error) => {
      log('load page error', error);
      throw error;
    });
};

export default pageLoader;
