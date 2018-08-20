import babel from 'rollup-plugin-babel'

// import commonjs from 'rollup-plugin-commonjs'
// import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  input: 'client/index.js',
  output: {
    file: 'dist/designer.js',
    format: 'iife',
    sourcemap: 'inline'
  },
  plugins: [
    // nodeResolve(),
    babel({
      exclude: 'node_modules/**' // only transpile our source code
    }) // ,
    // commonjs(),
  ]
}
