import fs from 'fs';
import os from 'os';
import path from 'path';
import cheerio from 'cheerio';
import pageLoader from '../src/page-loader';

describe('pageLoader', () => {
  let folder;
  beforeEach(async () => {
    await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'), (err, tempFolder) => {
      if (err)
        console.log(err);
      else {
        console.log("The temporary folder path is:", tempFolder);
        folder = tempFolder;
      }
    });
  })

  test('run pageLoader with folder', async () => {
    const result = await pageLoader('https://ru.hexlet.io/courses', folder);
    expect(result).not.toEqual(undefined);
  });

  test('run pageLoader with default folder', async () => {
    const result = await pageLoader('https://ru.hexlet.io/courses');
    expect(result).not.toEqual(undefined);
  });

  test('local run pageLoader', async () => {
    const result = await pageLoader('./__fixtures__/courses/index.html');
    expect(result).not.toEqual(undefined);
  });

  test('check pageLoader with img', async () => {
    const result = await pageLoader('./__fixtures__/courses/index.html');

    const $ = cheerio.load(result);
    const images = $('img').map((_, {attribs}) => attribs.src)
    const imagesInLocalFolder = $('img').map((_, {attribs}) => attribs.src).filter((_, imgSrc) => imgSrc.startsWith(process.cwd()))
    expect(images.length).toEqual(imagesInLocalFolder.length);
  });
});
