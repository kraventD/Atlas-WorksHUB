const {config} = require('dotenv');
config();
const {createClient} = require('@sanity/client');
const c = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false
});
c.fetch('*[_type=="game"]{title,cover_url,image_url}').then(r => {
  let ok = 0, no = 0;
  r.forEach(g => {
    if (g.cover_url) { ok++; console.log('CON PORTADA: ' + g.title); }
    else { no++; console.log('SIN PORTADA: ' + g.title); }
  });
  console.log('---');
  console.log(ok + ' con portada, ' + no + ' sin portada');
});
