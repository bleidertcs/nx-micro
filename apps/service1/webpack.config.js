const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('node:path');

const prismaGeneratedSourceMapWarning = /Failed to parse source map.*prisma-client[\\/].*library\.js\.map/;

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/service1'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  ignoreWarnings: [{ message: prismaGeneratedSourceMapWarning }],
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    }),
  ],
};
