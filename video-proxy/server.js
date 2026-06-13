import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { createServer } from 'http';
import { createHash } from 'crypto';
import Busboy from 'busboy';

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

const BUCKET  = process.env.AWS_BUCKET_NAME;
const PORT    = parseInt(process.env.PORT || '3000', 10);
const PW_HASH = '3c660967170fe682bfa0b5d48dca753f01a15d4b38922d96fca977ee2e7517d8';
const WORKBOOK_KEY = 'NdiJob_Global_Financial_Workbook.xlsx';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Range, Content-Type',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
};

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }

  if (req.method === 'POST' && req.url === '/upload-workbook') {
    return handleUpload(req, res);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...CORS, Allow: 'GET, HEAD, POST, OPTIONS' });
    return res.end();
  }

  const key = decodeURIComponent(req.url.slice(1));
  if (!key) {
    res.writeHead(404, CORS);
    return res.end('Not found');
  }

  try {
    const params = { Bucket: BUCKET, Key: key };
    if (req.headers.range) params.Range = req.headers.range;

    const data = await s3.send(new GetObjectCommand(params));
    const status = req.headers.range ? 206 : 200;

    const headers = {
      ...CORS,
      'Content-Type': data.ContentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=2592000',
      'Accept-Ranges': 'bytes',
    };
    if (data.ContentLength != null) headers['Content-Length'] = String(data.ContentLength);
    if (data.ContentRange) headers['Content-Range'] = data.ContentRange;

    res.writeHead(status, headers);
    if (req.method === 'HEAD') return res.end();
    data.Body.pipe(res);
  } catch (err) {
    const is404 = err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404;
    if (!is404) console.error(err);
    res.writeHead(is404 ? 404 : 500, CORS);
    res.end(is404 ? 'Not found' : 'Server error');
  }
}).listen(PORT, () => console.log(`Proxy listening on :${PORT}`));

async function handleUpload(req, res) {
  const bb = Busboy({ headers: req.headers, limits: { fileSize: 20 * 1024 * 1024 } });
  let password = '';
  let fileBuffer = null;

  bb.on('field', (name, val) => {
    if (name === 'password') password = val;
  });

  bb.on('file', (_name, stream) => {
    const chunks = [];
    stream.on('data', c => chunks.push(c));
    stream.on('end', () => { fileBuffer = Buffer.concat(chunks); });
  });

  bb.on('close', async () => {
    const hash = createHash('sha256').update(password).digest('hex');
    if (hash !== PW_HASH) {
      res.writeHead(401, { ...CORS, 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Incorrect password' }));
    }
    if (!fileBuffer || fileBuffer.length === 0) {
      res.writeHead(400, { ...CORS, 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'No file received' }));
    }
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: WORKBOOK_KEY,
        Body: fileBuffer,
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }));
      res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, size: fileBuffer.length }));
    } catch (err) {
      console.error('Upload error:', err);
      res.writeHead(500, { ...CORS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Upload failed' }));
    }
  });

  bb.on('error', () => {
    res.writeHead(400, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Parse error' }));
  });

  req.pipe(bb);
}
