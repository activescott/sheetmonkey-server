import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
const path = require('path');

export default {
  entry: 'src/test.js',
  format: 'iife',
  plugins: [
    commonjs(),
    resolve({browser: true})
  ],
  dest: path.join(__dirname, '../server/data/public/test.js') // equivalent to --output
};