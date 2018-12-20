import React from 'react'
import { clone } from './helpers'
import ListItems from './list-items'

class ListEdit extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      type: props.list.type
    }
  }

  onSubmit = e => {
    e.preventDefault()
    const form = e.target
    const formData = new window.FormData(form)
    const newName = formData.get('name').trim()
    const newTitle = formData.get('title').trim()
    const newType = formData.get('type')
    const { data, list } = this.props

    const copy = clone(data)
    const nameChanged = newName !== list.name
    const copyList = copy.lists[data.lists.indexOf(list)]

    if (nameChanged) {
      copyList.name = newName

      // Update any references to the list
      copy.pages.forEach(p => {
        p.components.forEach(c => {
          if (c.type === 'SelectField' || c.type === 'RadiosField') {
            if (c.options && c.options.list === list.name) {
              c.options.list = newName
            }
          }
        })
      })
    }

    copyList.title = newTitle
    copyList.type = newType

    // Items
    const texts = formData.getAll('text').map(t => t.trim())
    const values = formData.getAll('value').map(t => t.trim())
    const descriptions = formData.getAll('description').map(t => t.trim())

    const conditionals = [
      {
        components: [
          {
            type: formData.get('cond-type') || '',
            name: formData.get('name') || '',
            title: formData.get('title') || '',
            hint: formData.get('hint') || '',
            options: {
              classes: 'govuk-!-width-one-third'
            },
            schema: {}
          }
        ]
      }
    ]

    copyList.items = texts.map((t, i) => ({
      text: t,
      value: values[i],
      description: descriptions[i],
      conditional: conditionals[i]
    }))

    data.save(copy)
      .then(data => {
        console.log(data)
        this.props.onEdit({ data })
      })
      .catch(err => {
        console.error(err)
      })
  }

  onClickDelete = e => {
    e.preventDefault()

    if (!window.confirm('Confirm delete')) {
      return
    }

    const { data, list } = this.props
    const copy = clone(data)

    // Remove the list
    copy.lists.splice(data.lists.indexOf(list), 1)

    // Update any references to the list
    copy.pages.forEach(p => {
      if (p.list === list.name) {
        delete p.list
      }
    })

    data.save(copy)
      .then(data => {
        console.log(data)
        this.props.onEdit({ data })
      })
      .catch(err => {
        console.error(err)
      })
  }

  onBlurName = e => {
    const input = e.target
    const { data, list } = this.props
    const newName = input.value.trim()

    // Validate it is unique
    if (data.lists.find(l => l !== list && l.name === newName)) {
      input.setCustomValidity(`List '${newName}' already exists`)
    } else {
      input.setCustomValidity('')
    }
  }

  render () {
    const state = this.state
    const { list } = this.props

    return (
      <form onSubmit={e => this.onSubmit(e)} autoComplete='off'>
        <a className='govuk-back-link' href='#'
          onClick={e => this.props.onCancel(e)}>Back</a>
        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='list-name'>Name</label>
          <input className='govuk-input govuk-input--width-20' id='list-name' name='name'
            type='text' defaultValue={list.name} required pattern='^\S+'
            onBlur={this.onBlurName} />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='list-title'>Title</label>
          <input className='govuk-input govuk-!-width-two-thirds' id='list-title' name='title'
            type='text' defaultValue={list.title} required />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='list-type'>Value type</label>
          <select className='govuk-select govuk-input--width-10' id='list-type' name='type'
            value={state.type}
            onChange={e => this.setState({ type: e.target.value })}>
            <option value='string'>String</option>
            <option value='number'>Number</option>
          </select>
        </div>

        <ListItems items={list.items} type={state.type} />

        <button className='govuk-button' type='submit'>Save</button>{' '}
        <button className='govuk-button' type='button' onClick={this.onClickDelete}>Delete</button>
      </form>
    )
  }
}

export default ListEdit
