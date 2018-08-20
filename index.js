const joi = require('joi')
const fs = require('fs')
const util = require('util')
const schema = require('digital-form-builder-engine/components/schema')
const writeFile = util.promisify(fs.writeFile)
const pkg = require('./package.json')

module.exports = {
  plugin: {
    name: pkg.name,
    version: pkg.version,
    dependencies: 'vision',
    register: (server, options) => {
      const { path } = options
      let data = require(path)

      // DESIGNER
      server.route({
        method: 'get',
        path: '/designer',
        handler: async (request, h) => {
          return h.view('designer', data)
        }
      })

      // DESIGNER SPLIT SCREEN
      server.route({
        method: 'get',
        path: '/split',
        handler: async (request, h) => {
          return h.view('split')
        }
      })

      // GET DATA
      server.route({
        method: 'GET',
        path: '/api/data',
        options: {
          handler: (request, h) => {
            return data
          }
        }
      })

      // SAVE DATA
      server.route({
        method: 'PUT',
        path: '/api/data',
        options: {
          handler: async (request, h) => {
            try {
              const result = joi.validate(request.payload, schema, { abortEarly: false })

              if (result.error) {
                throw new Error('Schema validation failed')
              }

              await writeFile(path, JSON.stringify(result.value, null, 2))

              data = result.value

              return result.value
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
