import fs from 'fs';
import fsp from 'fs/promises'
import os from 'os';
import path from 'path';
import cheerio from 'cheerio';
import { fetchForImages, fetchForScripts } from '../src/page-loader';

import nock from 'nock'

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

  test('run pageLoader', async () => {
    const scope = nock('https://ru.hexlet.io')
      .get('/courses')
      .reply(200, async () => {
        const file = await fsp.readFile('./__fixtures__/courses/index.html', { encoding: 'utf8' })
        console.log('result', file)
        return file
      })

      console.log('scope', await scope)

    const result = await fsp.readFile('./__fixtures__/courses/index.html', { encoding: 'utf8' });
    expect(result).not.toEqual(undefined);
  });

  test('check pageLoader with img', async () => {
    const result = await fsp.readFile('./__fixtures__/courses/index.html', { encoding: 'utf8' });
    const pagePath = './__fixtures__/courses/index.html'
    const file = pagePath.replace(/\W+/g, '-')
    const currFolder = process.cwd()
    const HTML = await fetchForImages(fsp.readFile(pagePath, { encoding: 'utf8' }), `${file}_files`, currFolder, file, 'https://ru.hexlet.io', false)

    const $ = cheerio.load(result);
    const $HTML = cheerio.load(HTML);

    const images = $('img').map((_, {attribs}) => attribs.src)
    const imagesInLocalFolder = $HTML('img').map((_, {attribs}) => attribs.src).filter((_, imgSrc) => imgSrc.startsWith(currFolder))
    expect(images.length).toEqual(imagesInLocalFolder.length);
  });


  test('check pageLoader with css link', async () => {
    const result = await fsp.readFile('./__fixtures__/courses/index.html', { encoding: 'utf8' });
    const pagePath = './__fixtures__/courses/index.html'
    const file = pagePath.replace(/\W+/g, '-')
    const currFolder = process.cwd()
    const HTML = await fetchForScripts(result, `${file}_files`, currFolder, pagePath, 'https://ru.hexlet.io')

    const $ = cheerio.load(result);
    const $HTML = cheerio.load(HTML);

    const styles = $HTML('link').map((_, {attribs}) => attribs.href).filter((_, href) => href.startsWith('https://ru.hexlet.io'))
    expect(styles.length).toEqual(0);

    const stylesLocal = $HTML('link').map((_, {attribs}) => attribs.href).filter((_, href) => href.startsWith(currFolder))
    expect(stylesLocal.length).toEqual(1);
  });

  test('check pageLoader with scripts', async () => {
    const result = await fsp.readFile('./__fixtures__/courses/index.html', { encoding: 'utf8' });
    const pagePath = './__fixtures__/courses/index.html'
    const file = pagePath.replace(/\W+/g, '-')
    const currFolder = process.cwd()
    const HTML = await fetchForScripts(result, `${file}_files`, currFolder, pagePath, 'https://ru.hexlet.io')

    const $ = cheerio.load(result);
    const $HTML = cheerio.load(HTML);
    const scripts = $HTML('script').map((_, {attribs}) => attribs.src).filter((_, src) => src.startsWith('https://ru.hexlet.io'))
    expect(scripts.length).toEqual(0);
  });
});
