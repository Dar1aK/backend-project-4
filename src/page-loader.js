import axios from "axios";
import fsp from "fs/promises";
import path from "path";
import { load } from "cheerio";
import debug from "debug";
import Listr from "listr";

const log = debug("page-loader");

const pageLoader = async (pagePath, dir = process.cwd()) => {
  const tasks = (listrTasks) => new Listr(listrTasks);

  const fileName = (src) => {
    const srcName = src.replace(/\W+/g, "-");
    return `${srcName}${path.parse(src).ext}`
  }

  const getSources = (html) => {
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

  const writeSource = (src, filesDir) => {
    return axios.get(src, { responseType: "binary" })
    .then((source) =>
      fsp.writeFile(
        path.join(
          dir,
          filesDir,
          fileName(src),
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
        const listrTasks = getSources(html).map((srcPath) => {
          const src = srcPath.startsWith("/")
            ? `${origin}${srcPath}`
            : srcPath;

          newHtml = newHtml.replace(
            srcPath,
            path.join(
              dir,
              filesDir,
              fileName(src),
            ),
          );

          return {
            title: src,
            task: () => writeSource(src, filesDir)
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
      throw Error("load page error");
    });
};

export default pageLoader;
