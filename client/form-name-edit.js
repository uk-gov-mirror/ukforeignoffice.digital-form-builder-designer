import { clone } from './helpers'
import React from 'react'
import Editor from './editor'

class FormNameEdit extends React.Component {
  constructor (props) {
    super(props)
    this.onSubmit = this.onSubmit.bind(this)
  }

  onSubmit = e => {
    e.preventDefault()
    const form = e.target
    const formData = new window.FormData(form)
    const { data, toggleShowState } = this.props
    const copy = clone(data)

    copy.name = formData.get('name')

    data.save(copy)
      .then(data => {
        toggleShowState('showEditFormName')
        console.log(data)
      })
      .catch(err => {
        console.error(err)
      })
  }

  render () {
    const { data } = this.props
    const { name } = data

    return (
      <div className='govuk-body'>
        <form onSubmit={e => this.onSubmit(e)} autoComplete='off'>
          <a className='govuk-back-link' href='#'
            onClick={e => this.props.onCancel(e)}>Back</a>

          <div className='govuk-form-group'>
            <label className='govuk-label' htmlFor='name'>Form name</label>
            <span className='govuk-hint'>The form name will be displayed in the header </span>
            <Editor name='name' value={name} />
          </div>

          <button className='govuk-button' type='submit'>Save</button>
        </form>
      </div>
    )
  }
}

export default FormNameEdit
