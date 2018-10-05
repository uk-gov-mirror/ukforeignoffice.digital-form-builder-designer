import React from 'react'
import { clone } from './helpers'
import ListItems from './list-items'

class ListCreate extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      type: props.type
    }
  }

  onSubmit = e => {
    e.preventDefault()
    const form = e.target
    const formData = new window.FormData(form)
    const name = formData.get('name').trim()
    const title = formData.get('title').trim()
    const type = formData.get('type')
    const { data } = this.props

    const copy = clone(data)

    // Items
    const texts = formData.getAll('text').map(t => t.trim())
    const values = formData.getAll('value').map(t => t.trim())
    const descriptions = formData.getAll('description').map(t => t.trim())

    const items = texts.map((t, i) => ({
      text: t,
      value: values[i],
      description: descriptions[i]
    }))

    copy.lists.push({ name, title, type, items })

    data.save(copy)
      .then(data => {
        console.log(data)
        this.props.onCreate({ data })
      })
      .catch(err => {
        console.error(err)
      })
  }

  onBlurName = e => {
    const input = e.target
    const { data } = this.props
    const newName = input.value.trim()

    // Validate it is unique
    if (data.lists.find(l => l.name === newName)) {
      input.setCustomValidity(`List '${newName}' already exists`)
    } else {
      input.setCustomValidity('')
    }
  }

  render () {
    const state = this.state

    return (
      <form onSubmit={e => this.onSubmit(e)} autoComplete='off'>
        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='list-name'>Name</label>
          <input className='govuk-input' id='list-name' name='name'
            type='text' required pattern='^\S+'
            onBlur={this.onBlurName} />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='list-title'>Title</label>
          <input className='govuk-input' id='list-title' name='title'
            type='text' required />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='list-type'>Value type</label>
          <select className='govuk-select' id='list-type' name='type'
            value={state.type}
            onChange={e => this.setState({ type: e.target.value })}>
            <option value='string'>String</option>
            <option value='number'>Number</option>
          </select>
        </div>

        <ListItems type={state.type} />

        <a className='pull-right' href='#' onClick={e => this.props.onCancel(e)}>Cancel</a>
        <button className='govuk-button' type='submit'>Save</button>
      </form>
    )
  }
}

export default ListCreate
