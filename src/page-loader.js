import axios from "axios";
import fsp from "fs/promises";
import debug from "debug";
import path from "path";

import { getAndSaveSources } from './sources'
import { getFilesDir, getFilePath } from './names'

const log = debug("page-loader");


const pageLoader = async (pagePath, dir = process.cwd()) => {
  const htmlFileName = `${getFilePath(pagePath)}.html`

  return fsp
    .access(dir)
    .then(() => fsp.mkdir(path.join(dir, getFilesDir(pagePath)), { recursive: true }))
    .then(() => axios.get(pagePath))
    .then((result) => {
      const html = result.data;

      log("start", html);

      return getAndSaveSources(html, pagePath, dir);
    })
    .then((html) => {
      log("write html", html);
      const promise = fsp.writeFile(path.join(dir, htmlFileName), html);
      return promise.then(() => `${dir}/${htmlFileName}`)
    })
    .catch((error) => {
      log("load page error", error);
      throw error;
    });
};

export default pageLoader;
