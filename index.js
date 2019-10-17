const joi = require('joi')
const fs = require('fs')
const util = require('util')
const schema = require('digital-form-builder-engine/schema')
const writeFile = util.promisify(fs.writeFile)
const pkg = require('./package.json')

module.exports = {
  plugin: {
    name: pkg.name,
    version: pkg.version,
    dependencies: 'vision',
    multiple: true,
    register: (server, options) => {
      const { path, playgroundMode } = options
      let { basePath } = options
      let data = require(path)

      basePath = `/${basePath}` || ''

      // DESIGNER
      server.route({
        method: 'get',
        path: `${basePath}/designer`,
        handler: (request, h) => {
          return h.view('designer', { playgroundMode: playgroundMode || false })
        }
      })

      // DESIGNER SPLIT SCREEN
      server.route({
        method: 'get',
        path: `${basePath}/split`,
        handler: (request, h) => {
          return h.view('split')
        }
      })

      // GET DATA
      server.route({
        method: 'GET',
        path: `${basePath}/api/data`,
        options: {
          handler: (request, h) => {
            if (request.query.format) {
              const json = JSON.stringify(data, null, 2)
              return h.response(json).type('application/json')
            }

            return data
          },
          validate: {
            query: {
              format: joi.boolean()
            }
          }
        }
      })

      // SAVE DATA
      server.route({
        method: 'PUT',
        path: `${basePath}/api/data`,
        options: {
          handler: async (request, h) => {
            try {
              const result = joi.validate(request.payload, schema, { abortEarly: false })

              if (result.error) {
                throw new Error('Schema validation failed')
              }

              await writeFile(path, JSON.stringify(result.value, null, 2))

              data = result.value

              return data
            } catch (err) {
              return h.response({ ok: false, err: 'Write file failed' }).code(401)
            }
          },
          validate: {
            payload: joi.object().required()
          }
        }
      })
    }
  }
}
