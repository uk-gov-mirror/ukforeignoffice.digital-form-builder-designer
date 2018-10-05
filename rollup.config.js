import resolve from 'rollup-plugin-node-resolve'
import globals from 'rollup-plugin-node-globals'
import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'client/index.js',
  output: {
    file: 'dist/designer.js',
    format: 'iife',
    globals: {
      'react': 'React',
      'react-dom': 'ReactDOM'
    }
  },
  plugins: [
    resolve(),
    commonjs({
      include: 'node_modules/**'
    }),
    globals(),
    babel({
      exclude: 'node_modules/**'
    })
  ],
  external: ['react', 'react-dom']
}
