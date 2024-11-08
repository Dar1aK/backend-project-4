import fsp from 'fs/promises'
import os from 'os';
import path from 'path';
import cheerio from 'cheerio';
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
  })

  test('run pageLoader', async () => {
    nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/index.html'), { encoding: 'utf8' }))

      const result = await pageLoader('https://ru.hexlet.io/courses')

    expect(result).not.toEqual(undefined);
  });

  test('check pageLoader with img', async () => {
    const result = await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/index.html'), { encoding: 'utf8' });
    const currFolder = process.cwd()

    nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/index.html'), { encoding: 'utf8' }))

    nock('http://localhost')
    .get('/__fixtures__/courses/assets/nodejs.png')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/assets/nodejs.png'), { encoding: 'binary' }))

    const HTML = await pageLoader('https://ru.hexlet.io/courses')

    const $ = cheerio.load(result);
    const $HTML = cheerio.load(HTML);

    const images = $('img').map((_, {attribs}) => attribs.src)
    const imagesInLocalFolder = $HTML('img').map((_, {attribs}) => attribs.src).filter((_, imgSrc) => imgSrc.startsWith(currFolder))

    expect(images.length).toEqual(imagesInLocalFolder.length);
  });


  test('check pageLoader with css link', async () => {
    const currFolder = process.cwd()

    nock('https://ru.hexlet.io')
    .get('/courses')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/index.html'), { encoding: 'utf8' }))

    nock('http://localhost')
    .get('/__fixtures__/courses/assets/nodejs.png')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/assets/nodejs.png'), { encoding: 'binary' }))

    const HTML = await pageLoader('https://ru.hexlet.io/courses')

    const $HTML = cheerio.load(HTML);

    const styles = $HTML('link').map((_, {attribs}) => attribs.href).filter((_, href) => href.startsWith('https://ru.hexlet.io'))
    expect(styles.length).toEqual(0);

    const stylesLocal = $HTML('link').map((_, {attribs}) => attribs.href).filter((_, href) => href.startsWith(currFolder))
    expect(stylesLocal.length).toEqual(1);
  });

  // test('check pageLoader with scripts', async () => {
  //   const result = await fsp.readFile('./__fixtures__/courses/index.html', { encoding: 'utf8' });
  //   const pagePath = './__fixtures__/courses/index.html'
  //   const file = pagePath.replace(/\W+/g, '-')
  //   const currFolder = process.cwd()
  //   const HTML = await fetchForScripts(result, `${file}_files`, currFolder, pagePath, 'https://ru.hexlet.io')

  //   const $ = cheerio.load(result);
  //   const $HTML = cheerio.load(HTML);
  //   const scripts = $HTML('script').map((_, {attribs}) => attribs.src).filter((_, src) => src.startsWith('https://ru.hexlet.io'))
  //   expect(scripts.length).toEqual(0);
  // });

  test('check pageLoader with error link', async () => {
    const currFolder = process.cwd()

    nock('https://ru.hexlet.io')
    .get('/11111')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses11111/index.html'), { encoding: 'utf8' }))

    nock('http://localhost')
    .get('/__fixtures__/courses/assets/nodejs.png')
    .reply(200, async () => await fsp.readFile(path.resolve(__dirname, '../__fixtures__/courses/assets/nodejs.png'), { encoding: 'binary' }))

    const HTML = await pageLoader('https://ru.hexlet.io/11111')

    expect(HTML).toEqual(undefined)
  });
});
