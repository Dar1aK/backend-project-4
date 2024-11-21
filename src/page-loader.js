import axios from "axios";
import fsp from "fs/promises";
import debug from "debug";
import path from "path";


import { getAndSaveSources } from './sources'

const log = debug("page-loader");


const pageLoader = async (pagePath, dir = process.cwd()) => {
  const filePath = pagePath.replace(/(https|http):\/\//g, '').replace(/\W+/g, "-");
  const filesDir = `${filePath}_files`;
  const htmlFileName = `${filePath}.html`

  return fsp
    .access(dir)
    .then(() => fsp.mkdir(path.join(dir, filesDir), { recursive: true }))
    .then(() => axios.get(pagePath))
    .then((result) => {
      const html = result.data;

      log("start", html);

      return getAndSaveSources(html, pagePath, dir, filesDir);
    })
    .then((html) => {
      log("write html", html);
      return fsp.writeFile(path.join(dir, htmlFileName), html)
    })
    .then(() => `${dir}/${htmlFileName}`)
    .catch((error) => {
      log("load page error", error);
      throw Error(error);
    });
};

export default pageLoader;
