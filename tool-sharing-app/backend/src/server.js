/**
 * server.js — HTTP server entry point
 *
 * Run with:  node src/server.js
 * Dev mode:  npx nodemon src/server.js
 */

require('dotenv').config();
const app  = require('./app');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n  Gardening Tool Share — backend`);
  console.log(`  http://localhost:${PORT}\n`);
});
