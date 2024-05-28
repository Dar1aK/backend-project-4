import fs from 'fs';
import os from 'os';
import path from 'path';
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

  test('run pageLoader', async () => {
    const result = await pageLoader('https://ru.hexlet.io/courses', folder);
    expect(result).not.toEqual(undefined);
  });
});
