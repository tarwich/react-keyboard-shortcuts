const commander = require('commander');
const Bundler = require('parcel-bundler');

const { env } = process;

const OPTIONS = commander
.description('Run the test app')
.option('--port <number>', 'Set the port for the test app to listen on', Number, env.PORT)
.option('--build', 'Build, but do not serve')
.option('--production', 'Set the production flag')
.parse(process.argv);

if (OPTIONS.production) env.NODE_ENV = 'production';

async function runBundle() {
  const bundler = new Bundler('./example/index.html', {
    outDir: './.tmp/build',
    cacheDir: './.tmp/.cache',
    target: 'browser',
    watch: true,
  });

  if (OPTIONS.build)
    return bundler.bundle(OPTIONS.port);

  return bundler.serve(OPTIONS.port);
}

runBundle().catch(console.error);
