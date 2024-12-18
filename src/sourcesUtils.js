import axios from 'axios';
import fsp from 'fs/promises';
import path from 'path';
import Listr from 'listr';
import debug from 'debug';

import { getFileName, pathTransformation } from './utils.js';

const log = debug('page-loader');

const sources = [
  { tag: 'img', attr: 'src' },
  { tag: 'link', attr: 'href' },
  { tag: 'script', attr: 'src' },
];

export const getSources = ($, filesDir, origin) => sources.reduce((acc, { tag, attr }) => {
  const value = $(tag)
    .toArray()
    .map((item) => ({ element: $(item), attribs: item.attribs }))
    .filter(({ attribs }) => attribs[attr] && (attribs[attr].startsWith('/') || attribs[attr].startsWith(origin)))
    .map(({ element, attribs }) => {
      const { srcPath, newPath } = pathTransformation(origin, attribs[attr]);
      const outputPath = path.join(
        filesDir,
        getFileName(srcPath, origin),
      );
      element.attr(attr, outputPath);
      return newPath;
    });
  return [...acc, ...value];
}, []);

const writeSource = (src, outputPath) => axios
  .get(src, { responseType: 'arraybuffer' })
  .then((source) => fsp.writeFile(outputPath, source.data, 'binary'))
  .catch((error) => {
    log('loadSources error', error);
  });

export const downloadAndSaveSources = (sourcesToSave, filesDir, origin) => {
  const tasks = (listrTasks) => new Listr(listrTasks);
  const listrTasks = sourcesToSave.map((src) => {
    const srcPath = !path.parse(src).ext ? `${src}.html` : src;
    const outputPath = path.join(
      filesDir,
      getFileName(srcPath, origin),
    );

    return {
      title: src,
      task: () => writeSource(src, outputPath),
    };
  });

  return tasks(listrTasks).run();
};
