import { clone } from './helpers'
import React from 'react'
import Editor from './editor'

class DeclarationEdit extends React.Component {
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

    copy.declaration = formData.get('declaration')

    data.save(copy)
      .then(data => {
        toggleShowState('showEditDeclaration')
        console.log(data)
      })
      .catch(err => {
        console.error(err)
      })
  }

  render () {
    const { data } = this.props
    const { declaration } = data

    return (
      <div className='govuk-body'>
        <form onSubmit={e => this.onSubmit(e)} autoComplete='off'>
          <a className='govuk-back-link' href='#'
            onClick={e => this.props.onCancel(e)}>Back</a>

          <div className='govuk-form-group'>
            <label className='govuk-label' htmlFor='declaration'>Declaration</label>
            <span className='govuk-hint'>The declaration can include HTML and the `govuk-prose-scope` css class is available. Use this on a wrapping element to apply default govuk styles.</span>
            <Editor name='declaration' value={declaration} />
          </div>

          <button className='govuk-button' type='submit'>Save</button>
        </form>
      </div>
    )
  }
}

export default DeclarationEdit
