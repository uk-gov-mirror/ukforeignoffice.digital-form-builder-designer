const joi = require('joi')
const fs = require('fs')
const util = require('util')
const schema = require('digital-form-builder-engine/schema')
const writeFile = util.promisify(fs.writeFile)
const pkg = require('./package.json')
const hapi = require('@hapi/hapi')
const shortid = require('shortid')

const nunjucks = require('nunjucks')

const viewPlugin = {
  plugin: require('vision'),
  options: {
    engines: {
      html: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            if (context.nonce) {
              delete Object.assign(context, { 'script_nonce': context['script-nonce'] })['script-nonce']
              delete Object.assign(context, { 'style_nonce': context['style_nonce'] })['style_nonce']
            }

            const html = template.render(context /* , function (err, value) {
              console.error(err)
            } */)
            return html
          }
        },
        prepare: (options, next) => {
          options.compileOptions.environment = nunjucks.configure(options.path, {
            autoescape: true,
            watch: false
          })

          return next()
        }
      }
    },
    path: [
      'views',
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
      'node_modules/digital-form-builder-engine/views',
    ],
    context: {
      appVersion: pkg.version,
      assetPath: '/assets',
    }
  }
}



const designerPlugin = {
  plugin: {
    name: pkg.name,
    version: pkg.version,
    multiple: true,
    dependencies: 'vision',
    register: (server, options) => {
      const { path, playgroundMode } = options
      let { basePath } = options
      // let data = require(path)

      server.route({
        method: 'get',
        path: `/`,
        options: {
          handler: (request, h) => {
            return h.redirect(`/${shortid.generate()}`)
          }
        }
      })

      // DESIGNER
      server.route({
        method: 'get',
        path: `/{id}`,
        options: {
          handler: (request, h) => {
            return h.view('designer')
          }
        }
      })

      // GET DATA
      server.route({
        method: 'GET',
        path: `/{id}/api/data`,
        options: {
          handler: (request, h) => {
            if (request.query.format) {
              const json = JSON.stringify(data, null, 2)
              return h.response(json).type('application/json')
            }
            return require('./new-form')
          },
          validate: {
            query: {
              format: joi.boolean()
            }
          },
          plugins: {
            blankie: false,
            crumb: {
              enforce: false
            }
          }
        }
      })

      basePath = `/${basePath}` || ''

      // DESIGNER
      server.route({
        method: 'get',
        path: `${basePath}/designer`,
        options: {
          handler: (request, h) => {
            return h.view('designer', { playgroundMode: playgroundMode || false })
          },
          plugins: {
            blankie: false,
            crumb: {
              enforce: false
            }
          }
        }
      })

      // DESIGNER SPLIT SCREEN
      server.route({
        method: 'get',
        path: `${basePath}/split`,
        options: {
          handler: (request, h) => {
            return h.view('split')
          },
          plugins: {
            blankie: false,
            crumb: {
              enforce: false
            }
          }
        }
      })

      // // GET DATA
      // server.route({
      //   method: 'GET',
      //   path: `${basePath}/api/data`,
      //   options: {
      //     handler: (request, h) => {
      //       if (request.query.format) {
      //         const json = JSON.stringify(data, null, 2)
      //         return h.response(json).type('application/json')
      //       }
      //       return data
      //     },
      //     validate: {
      //       query: {
      //         format: joi.boolean()
      //       }
      //     },
      //     plugins: {
      //       blankie: false,
      //       crumb: {
      //         enforce: false
      //       }
      //     }
      //   }
      // })

      // SAVE DATA
      server.route({
        method: 'PUT',
        path: `${basePath}/api/data`,
        options: {
          handler: async (request, h) => {
            try {
              const result = joi.validate(request.payload, schema, { abortEarly: false })

              if (result.error) {
                console.log(result.error)
                throw new Error('Schema validation failed')
              }
              //post to builder/deploy instEad
              await writeFile(path, JSON.stringify(result.value, null, 2))

              data = result.value

              return data
            } catch (err) {
              return h.response({ ok: false, err: 'Write file failed' }).code(401)
            }
          },
          validate: {
            payload: joi.object().required()
          },
          plugins: {
            blankie: false,
            crumb: {
              enforce: false
            }
          }
        }
      })
    }
  }
}

async function createServer () {
  const server = hapi.server({ port: 3000 })
  await server.register(require('inert'))
  await server.register(viewPlugin)
  await server.register(require('./plugins/router'))
  await server.register(designerPlugin)
  return server
}

createServer()
  .then(server => server.start())
  .then(() => process.send && process.send('online'))
  .catch(err => {
    console.log(err)
    process.exit(1)
  })
