const minimist = require('minimist');
const { createApp } = require('./app');

const args = minimist(process.argv.slice(2), { default: { port: process.env.PORT || 3000 } });

createApp().listen(args.port, () => {
  console.log(`Team status board running at http://localhost:${args.port}`);
});
