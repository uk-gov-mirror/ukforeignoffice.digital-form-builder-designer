import React from 'react'
import { clone, getFormData } from './helpers'
import ComponentTypeEdit from './component-type-edit'
import conditionalComponentTypes from 'digital-form-builder-engine/conditional-component-types'
//
// conditional-component-types is a cut down version of /component-types containing only one component i.e. TextField
//
// import componentTypes from 'digital-form-builder-engine/component-types'

class ComponentConditionCreate extends React.Component {
  state = {}

  onSubmit = e => {
    e.preventDefault()
    const form = e.target
    const { page, data } = this.props
    const formData = getFormData(form)
    const copy = clone(data)
    const copyPage = copy.pages.find(p => p.path === page.path)

    // Apply
    copyPage.components.push(formData)

    data.save(copy)
      .then(data => {
        console.log(data)
        this.props.onCreate({ data })
      })
      .catch(err => {
        console.error(err)
      })
  }

  render () {
    const { page, data } = this.props

    return (
      <div>
        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='type'>Type</label>
          <select className='govuk-select' id='type' name='cond-type'
            onChange={e => this.setState({ component: { type: e.target.value } })}>
            <option />
            {conditionalComponentTypes.map(type => {
              return <option key={type.name} value={type.name}>{type.title}</option>
            })}
          </select>
        </div>

        {this.state.component && this.state.component.type && (
          <div>
            <ComponentTypeEdit
              page={page}
              component={this.state.component}
              data={data} />
          </div>
        )}
      </div>
    )
  }
}

export default ComponentConditionCreate
