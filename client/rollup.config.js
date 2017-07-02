import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import svelte from 'rollup-plugin-svelte'

const path = require('path')
const fs = require('fs')

export default {
  entry: 'src/index.js',
  format: 'iife',
  plugins: [
    commonjs(),
    resolve({ browser: true }),
    svelte({
      // By default, all .html and .svelte files are compiled
      extensions: ['.my-custom-extension', '.html', '.svelte'],

      // You can restrict which files are compiled
      // using `include` and `exclude`
      // include: 'src/components/**/*.html',

      // By default, the client-side compiler is used. You
      // can also use the server-side rendering compiler
      // generate: 'ssr',

      // Extract CSS into a separate file (recommended).
      // See note below
      css: function (css) {
        fs.writeFileSync('./dist/svelte.css', css)
      }
    })
  ],
  dest: path.join(__dirname, './dist/index_dist.js') // equivalent to --output
}
