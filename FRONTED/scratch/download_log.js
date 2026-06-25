const https = require('https');
const fs = require('fs');
const zlib = require('zlib');

const url = "https://storage.googleapis.com/eas-workflows-production/logs/af487fef-7ff5-4345-9629-002a4bfc3c1f/64c7884c-2b96-41df-95e7-726d3ca52976/2026-06-25T09%3A24%3A00Z-19e1f23b-a97b-491d-b617-ddf95897ad3f.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260625%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260625T094233Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=b0cdcdf9a556e4809931d9a2b8774011a93e993b617a93315d651691f36f1a08c02640e421355dcb97faadc70d6e6493c4edb9458aef27fe91c9269e1a17794aa38919a49c57b9e41cd8df53ff663e2f8be856ed0ed70a89c2935295ec5e762d18fa9d6edd5f9cd0dfdc9f704c01d8f123ac1b6a553c7613ce017e6eb7ad2c89b105f26381b1cbf0159f784fab8542a68d202edf6833f23b85733ebf24c2326cb9f6ede8010bfbb0d9757b47dd6e2dcb9a739304f3c4c9f7d1a6fc8ef3edc214c63647a6ee909ebbc540318ae9650b5a86d552218a863e6938e5e7e171eac8469b2092b98eb017a66d8e844006cd4b72eaac47b670eee0b8b477fc0702829771";

https.get(url, (res) => {
  const chunks = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    const encoding = res.headers['content-encoding'];
    console.log('Content-Encoding:', encoding);
    
    let decompressed;
    if (encoding === 'br') {
      decompressed = zlib.brotliDecompressSync(buffer);
    } else if (encoding === 'gzip') {
      decompressed = zlib.gunzipSync(buffer);
    } else {
      decompressed = buffer;
    }
    
    const text = decompressed.toString('utf8');
    fs.writeFileSync('/Users/nishantnikhil/.gemini/antigravity/brain/a7a42584-8d14-4dbf-a2f6-4cfe2912d705/scratch/downloaded_build.log', text);
    console.log('Success! Saved log. Length:', text.length);
  });
}).on('error', (err) => {
  console.error('Error:', err);
});
