import fsp from 'fs/promises';
import path from 'path';
import nock from 'nock';
import { tmpdir } from 'node:os';

import pageLoader from '../src/page-loader';

const readFileFixture = async (fixturePath) => await fsp.readFile(
  path.resolve(
    __dirname,
    fixturePath,
  ),
  { encoding: 'utf8' },
);

describe('pageLoader', () => {
  const dir = tmpdir();

  beforeEach(async () => {
    nock('https://site.com')
      .persist()
      .get('/blog/about')
      .reply(200, () => readFileFixture('../__fixtures__/blog/about/site-com-blog-about.html'))
      .get('/photos/me.jpg')
      .reply(200,  () => readFileFixture('../__fixtures__/photos/me.jpg'))
      .get('/blog/about/assets/styles.css')
      .reply(200,  () => readFileFixture('../__fixtures__/blog/about/assets/styles.css'))
      .get('/assets/scripts.js')
      .reply(200, () =>  readFileFixture('../__fixtures__/assets/scripts.js'))
      .get('/11111')
      .reply(200,  () => readFileFixture('../__fixtures__/11111'))
      .get('/courses/assets/not-exist.css')
      .reply(404);
  });

  test('run pageLoader', async () => {
    const htmlPath = await pageLoader('https://site.com/blog/about');

    const fileResult = await fsp.readFile(path.resolve(htmlPath), {
      encoding: 'utf8',
    });
    const fixture = await fsp.readFile(
      path.resolve(
        __dirname,
        '../__fixtures__/result/site-com-blog-about.html',
      ),
      { encoding: 'utf8' },
    );

    expect(fileResult.trim()).toBe(fixture.trim());
  });

  test('check pageLoader with sources', async () => {
    const htmlPath = await pageLoader('https://site.com/blog/about');

    const fileResult = await fsp.readFile(path.resolve(htmlPath), {
      encoding: 'utf8',
    });

    const img = path.join(dir, '/site-com-blog-about_files/site-com-photos-me.jpg');
    const css = path.join(dir, '/site-com-blog-about_files/site-com-blog-about-assets-styles.css');
    const js = path.join(dir, '/site-com-blog-about_files/site-com-assets-scripts.js');

    expect(fileResult.indexOf(img)).toBeGreaterThanOrEqual(0);
    expect(fileResult.indexOf(css)).toBeGreaterThanOrEqual(0);
    expect(fileResult.indexOf(js)).toBeGreaterThanOrEqual(0);
  });

  test('check pageLoader with error link', async () => {
    await expect(() => pageLoader('https://site.com/11111')).rejects.toThrow();
  });

  test('run pageLoader with not existing directory', async () => {
    await expect(() => pageLoader('https://site.com/blog/about', '/not-exist')).rejects.toThrow();
  });
});
