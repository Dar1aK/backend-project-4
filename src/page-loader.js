import axios from 'axios';
import fsp from 'fs/promises';
import { tmpdir } from 'node:os';
import debug from 'debug';
import path from 'path';
import { load } from 'cheerio';

import { downloadAndSaveSources, getSources } from './sourcesUtils.js';
import { getFilesDir, getFilePath } from './utils.js';

const log = debug('page-loader');

const pageLoader = async (pagePath, dir = tmpdir()) => {
  let outputPage;
  const filesDir = getFilesDir(pagePath);
  const { origin } = new URL(pagePath);

  return fsp
    .access(dir)
    .then(() => fsp.mkdtemp(path.join(dir, getFilesDir(pagePath)), {
      recursive: true,
    }))
    .then(() => axios.get(pagePath))
    .then((result) => {
      const html = result.data;

      log('start', html);

      outputPage = load(html);
      return getSources(outputPage, dir, origin, filesDir);
    })
    .then((sourcesToSave) => {
      const fullDirPath = path.join(
        dir,
        filesDir,
      );
      const promise = downloadAndSaveSources(sourcesToSave, fullDirPath, origin);
      return promise.then(() => outputPage.html());
    })
    .then((html) => {
      log('write html', html);
      const outputPath = path.join(dir, `${getFilePath(pagePath)}.html`);
      const promise = fsp.writeFile(outputPath, html);
      return promise.then(() => outputPath);
    })
    .catch((error) => {
      log('load page error', error);
      throw error;
    });
};

export default pageLoader;
