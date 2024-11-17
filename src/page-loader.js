import axios from "axios";
import fsp from "fs/promises";
import path from "path";
import { load } from "cheerio";
import debug from "debug";
import Listr from "listr";

const log = debug("page-loader");

const loadPage = (pagePath, dir) => {
  const tasks = (listrTasks) => new Listr(listrTasks);

  const getSouces = (html) => {
    const $ = load(html);
    const images = $("img").map((_, { attribs }) => attribs.src);
    const links = $("link")
      .map((_, { attribs }) => {
        return attribs.href.endsWith(".css") ? attribs.href : null;
      })
      .filter((item) => item);
    const scripts = $("script").map((_, { attribs }) => attribs.src);
    return [...images, ...links, ...scripts];
  };

  const writeSource = (src, srcName, extension, filesDir) => {
    const promise =  new Promise((resolve) => {
      return resolve(src)
    });

    return promise
    .then(() => axios.get(src, { responseType: "binary" }))
    .then((source) =>
      fsp.writeFile(
        path.join(
          dir,
          filesDir,
          `${srcName}.${extension[extension.length - 1]}`,
        ),
        source.data,
        "binary",
      )
    )
    .catch((error) => log("loadSources error", error));
  };

  const getAndSaveSources = (html) => {
    const file = pagePath.replace(/\W+/g, "-");
    const filesDir = `${file}_files`;
    const origin = new URL(pagePath).origin;
    let newHtml = html;

    return fsp
      .mkdir(path.join(dir, filesDir), { recursive: true })
      .then(() => {
        const listrTasks = getSouces(html).map((srcPath) => {
          const src = srcPath.startsWith("/")
            ? `${origin}${srcPath}`
            : srcPath;

          const srcName = src.replace(/\W+/g, "-");
          const extension = src.split(".");
          newHtml = newHtml.replace(
            srcPath,
            path.join(
              dir,
              filesDir,
              `${srcName}.${extension[extension.length - 1]}`,
            ),
          );

          return {
            title: src,
            task: () => writeSource(src, srcName, extension, filesDir)
          };
        })


        return tasks(listrTasks).run()
      })
      .then(() => {
        return fsp.writeFile(path.join(dir, `${file}.html`), newHtml)
      })
      .then(() => `${dir}/${file}.html`);
  };

  return fsp
    .access(dir)
    .then(() => axios.get(pagePath))
    .then((result) => {
      const html = result.data;

      log("start", html);

      return getAndSaveSources(html);
    })
    .catch((error) => {
      log("load page error", error);
      // console.log('err', error)
      throw Error("load page error");
    });
};

const pageLoader = async (pagePath, dir = process.cwd()) => {
  return loadPage(pagePath, dir);
};

export default pageLoader;
