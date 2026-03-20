import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const dev = process.env.ROLLUP_WATCH;

export default {
  input: 'src/roborock-queue-card.ts',
  output: {
    file: 'dist/roborock-queue-card.js',
    format: 'es',
    sourcemap: dev ? true : false,
  },
  plugins: [
    resolve(),
    typescript(),
    !dev && terser({ module: true, compress: { drop_console: true } }),
  ].filter(Boolean),
};
