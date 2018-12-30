const commander = require('commander');
const Bundler = require('parcel-bundler');
const npm = require('npm');
const { promisify } = require('util');

const { env } = process;

const OPTIONS = commander
.description('Run the test app')
.option('--port <number>', 'Set the port for the test app to listen on', Number, env.PORT)
.option('--build', 'Build, but do not serve')
.option('--production', 'Set the production flag')
.parse(process.argv);

if (OPTIONS.production) env.NODE_ENV = 'production';

async function runBundle() {
  if (OPTIONS.build) {
    const bundler = new Bundler('./src/index.ts', {
      outDir: './dist',
      cache: false,
      target: 'browser',
      watch: false,
    });

    await promisify(npm.load)();
    await promisify(npm.commands['run-script'])(['generate-definitions']);
    await bundler.bundle();
  }

  else {
    const bundler = new Bundler('./example/index.html', {
      outDir: './.tmp/build',
      cacheDir: './.tmp/.cache',
      target: 'browser',
      watch: true,
    });

    return bundler.serve(OPTIONS.port);
  }
}

runBundle().catch(console.error);
