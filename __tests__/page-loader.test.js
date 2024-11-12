import fsp from 'fs/promises'
import os from 'os';
import path from 'path';
import { load } from 'cheerio';
import nock from 'nock'

import pageLoader from '../src/page-loader';


describe('pageLoader', () => {
  let folder;
  beforeEach(async () => {
    await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'), (err, tempFolder) => {
      if (err)
        console.log(err);
      else {
        console.log("The temporary folder path is:", tempFolder);
        folder = tempFolder;
      }
    });

    nock('https://ru.hexlet.io')
    .persist()
    .get('/courses')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/index.html'), { encoding: 'utf8' }))
    .get('/courses/assets/nodejs.png')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/assets/nodejs.png'), { encoding: 'binary' }))
    .get('/photos/react.png')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/photos/react.png'), { encoding: 'binary' }))
    .get('/11111')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/11111')))

  })

  test('run pageLoader', async () => {
      const result = await pageLoader('https://ru.hexlet.io/courses')

    expect(result).not.toEqual(undefined);
  });

  test('check pageLoader with img', async () => {
    const result = await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/index.html'), { encoding: 'utf8' });

    const HTML = await pageLoader('https://ru.hexlet.io/courses')

    const $ = load(result);
    const $HTML = load(HTML);

    const images = $('img').map((_, {attribs}) => attribs.src)
    const imagesInLocalFolder = $HTML('img').map((_, {attribs}) => attribs.src)

    expect(images.length).toEqual(imagesInLocalFolder.length);
  });

  test('check pageLoader with img and check files exist', async () => {
    const url = 'https://ru.hexlet.io/courses'
    const result = await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/index.html'), { encoding: 'utf8' });

    const origin = (new URL(url)).origin
    const currFolder = process.cwd()

    const $ = load(result);
    const images = $('img').map((_, {attribs}) => attribs.src)

    const imgResult = images.map(async (_, srcPath) => {
      try {
        const src = `${currFolder}/${url.replace(/\W+/g, '-')}_files/${(srcPath.startsWith('/') ? `${origin}${srcPath}` : srcPath).replace(/\W+/g, '-')}`
        const extension = srcPath.split('.')
        return await fsp.access(`${src}.${extension[extension.length - 1]}`)
      } catch {
        return process.exit()
      }
    });
  });

  test('check pageLoader with img with relative path', async () => {
    const result = await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/index.html'), { encoding: 'utf8' });

    const HTML = await pageLoader('https://ru.hexlet.io/courses')

    const $ = load(result);
    const $HTML = load(HTML);

    const images = $('img').map((_, {attribs}) => attribs.src)
    const imagesInLocalFolder = $HTML('img').map((_, {attribs}) => attribs.src)

    expect(images.length).toEqual(imagesInLocalFolder.length);
  });


  test('check pageLoader with css link', async () => {
    const currFolder = process.cwd()

    const HTML = await pageLoader('https://ru.hexlet.io/courses')

    const $HTML = load(HTML);

    const styles = $HTML('link').map((_, {attribs}) => attribs.href).filter((_, href) => href.startsWith('https://ru.hexlet.io'))
    expect(styles.length).toEqual(0);

    const stylesLocal = $HTML('link').map((_, {attribs}) => attribs.href).filter((_, href) => href.startsWith(currFolder))
    expect(stylesLocal.length).toEqual(1);
  });

  test('check pageLoader with error link', async () => {
    expect(async () => await pageLoader('https://ru.hexlet.io/11111')).rejects.toThrow()
  });

  test('run pageLoader with not existing directory', async () => {
    expect(async () => await pageLoader('https://ru.hexlet.io/courses', '/not-exist')).rejects.toThrow()
  });
});
