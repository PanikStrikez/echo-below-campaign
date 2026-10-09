// Usage: NODE_PATH=<directory containing tesseract.js> node ocr-book-pages.js input.pdf output.jsonl model-directory firstPage lastPage
// Model directory must contain eng.traineddata. Output is temporary OCR data, not shipped with the app.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createWorker } = require('tesseract.js');

const [pdf, output, modelDirectory, firstRaw, lastRaw] = process.argv.slice(2);
if (!pdf || !output || !modelDirectory || !firstRaw || !lastRaw) {
  process.stderr.write('Usage: node ocr-book-pages.js input.pdf output.jsonl model-directory firstPage lastPage\n');
  process.exit(1);
}

(async () => {
  const worker = await createWorker('eng', 1, { langPath: modelDirectory, gzip: false, cacheMethod: 'none' });
  const first = Number(firstRaw);
  const last = Number(lastRaw);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'echo-ocr-'));
  const result = fs.openSync(output, 'a');
  try {
    for (let page = first; page <= last; page++) {
      const prefix = path.join(temp, 'page');
      execFileSync('pdftoppm', ['-f', String(page), '-l', String(page), '-singlefile', '-scale-to', '1800', '-png', pdf, prefix]);
      const image = `${prefix}.png`;
      const response = await worker.recognize(image);
      fs.writeSync(result, `${JSON.stringify({ page, text: response.data.text })}\n`);
      fs.unlinkSync(image);
      if (page % 10 === 0 || page === last) process.stderr.write(`OCR page ${page}/${last}\n`);
    }
  } finally {
    fs.closeSync(result);
    fs.rmSync(temp, { recursive: true, force: true });
    await worker.terminate();
  }
})().catch(error => { process.stderr.write(`${error.stack || error}\n`); process.exitCode = 1; });
