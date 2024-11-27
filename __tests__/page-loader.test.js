import fsp from 'fs/promises';
import path from 'path';
import nock from 'nock';

import pageLoader from '../src/page-loader';

describe('pageLoader', () => {
  beforeEach(async () => {
    nock('https://site.com')
      .persist()
      .get('/blog/about')
      .reply(200, () => {return fsp.readFile(
          path.resolve(
            __dirname,
            '../__fixtures__/blog/about/site-com-blog-about.html',
          ),
          { encoding: 'utf8' },
        );},
      )
      .get('/photos/me.jpg')
      .reply(200, () => {return fsp.readFile(path.resolve(__dirname, '../__fixtures__/photos/me.jpg'), {
          encoding: 'binary',
        });},
      )
      .get('/blog/about/assets/styles.css')
      .reply(200, () => {return fsp.readFile(
          path.resolve(
            __dirname,
            '../__fixtures__/blog/about/assets/styles.css',
          ),
          { encoding: 'binary' },
        );},
      )
      .get('/assets/scripts.js')
      .reply(200, () => {return fsp.readFile(
          path.resolve(__dirname, '../__fixtures__/assets/scripts.js'),
          { encoding: 'binary' },
        );},
      )
      .get('/11111')
      .reply(200, () => {return fsp.readFile(path.resolve(__dirname, '../__fixtures__/11111'));},
      )
      .get('/courses/assets/not-exist.css')
      .reply(404);

    nock('http://localhost')
      .persist()
      .get('/blog/about')
      .reply(200, () => {return fsp.readFile(
          path.resolve(
            __dirname,
            '../__fixtures__/blog/about/localhost-blog-about.html',
          ),
          { encoding: 'utf8' },
        );},
      )
      .get('/photos/me.jpg')
      .reply(200, () => {return fsp.readFile(path.resolve(__dirname, '../__fixtures__/photos/me.jpg'), {
          encoding: 'binary',
        });},
      )
      .get('/blog/about/assets/styles.css')
      .reply(200, () => {return fsp.readFile(
          path.resolve(
            __dirname,
            '../__fixtures__/blog/about/assets/styles.css',
          ),
          { encoding: 'binary' },
        );},
      )
      .get('/assets/scripts.js')
      .reply(200, () => {return fsp.readFile(
          path.resolve(__dirname, '../__fixtures__/assets/scripts.js'),
          { encoding: 'binary' },
        );},
      );
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

    expect(JSON.stringify(fileResult).replace(/\s+/g, '')).toBe(
      JSON.stringify(fixture).replace(/\s+/g, ''),
    );
  });

  test('run pageLoader on localhost', async () => {
    const htmlPath = await pageLoader('http://localhost/blog/about');

    const fileResult = await fsp.readFile(path.resolve(htmlPath), {
      encoding: 'utf8',
    });
    const fixture = await fsp.readFile(
      path.resolve(
        __dirname,
        '../__fixtures__/result/localhost-blog-about.html',
      ),
      { encoding: 'utf8' },
    );

    expect(JSON.stringify(fileResult).replace(/\s+/g, '')).toBe(
      JSON.stringify(fixture).replace(/\s+/g, ''),
    );
  });

  test('check pageLoader with sources', async () => {
    const htmlPath = await pageLoader('https://site.com/blog/about');

    const fileResult = await fsp.readFile(path.resolve(htmlPath), {
      encoding: 'utf8',
    });

    const img
      = 'home/runner/work/backend-project-4/backend-project-4/site-com-blog-about_files/site-com-photos-me.jpg';
    const css
      = 'home/runner/work/backend-project-4/backend-project-4/site-com-blog-about_files/site-com-blog-about-assets-styles.css';
    const js
      = 'home/runner/work/backend-project-4/backend-project-4/site-com-blog-about_files/site-com-assets-scripts.js';

    expect(fileResult.indexOf(img)).toBeGreaterThanOrEqual(0);
    expect(fileResult.indexOf(css)).toBeGreaterThanOrEqual(0);
    expect(fileResult.indexOf(js)).toBeGreaterThanOrEqual(0);
  });

  test('check pageLoader with error link', async () => {
    expect(
      async () => {return await pageLoader('https://site.com/11111');},
    ).rejects.toThrow();
  });

  test('run pageLoader with not existing directory', async () => {
    expect(
      async () => {return await pageLoader('https://site.com/blog/about', '/not-exist');},
    ).rejects.toThrow();
  });
});
