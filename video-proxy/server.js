import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createServer } from 'http';

const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

const BUCKET = process.env.AWS_BUCKET_NAME;
const PORT = parseInt(process.env.PORT || '3000', 10);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Range',
  'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
};

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...CORS_HEADERS, Allow: 'GET, HEAD, OPTIONS' });
    return res.end();
  }

  const key = decodeURIComponent(req.url.slice(1));
  if (!key) {
    res.writeHead(404, CORS_HEADERS);
    return res.end('Not found');
  }

  try {
    const params = { Bucket: BUCKET, Key: key };
    if (req.headers.range) params.Range = req.headers.range;

    const data = await s3.send(new GetObjectCommand(params));
    const status = req.headers.range ? 206 : 200;

    const headers = {
      ...CORS_HEADERS,
      'Content-Type': data.ContentType || 'video/mp4',
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
    res.writeHead(is404 ? 404 : 500, CORS_HEADERS);
    res.end(is404 ? 'Not found' : 'Server error');
  }
}).listen(PORT, () => console.log(`Video proxy listening on :${PORT}`));
