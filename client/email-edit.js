import React from 'react'

class EmailEdit extends React.Component {
  render () {
    const { output } = this.props
    const outputConfiguration = output ? output.outputConfiguration : {
      apiKey: '', templateId: '', emailAddress: ''
    }

    return (
      <div className='govuk-body'>
        <div className='govuk-form-group'>
          <label className='govuk-label' htmlFor='template-id'>Template ID</label>
          <input className='govuk-input' name='template-id'
            type='text' required defaultValue={outputConfiguration.templateId}
            onBlur={this.onBlur} step='any' />
        </div>
        <div className='govuk-form-group'>
          <label className='govuk-label' htmlFor='api-key'>API Key</label>
          <input className='govuk-input' name='api-key'
            type='text' required defaultValue={outputConfiguration.apiKey}
            onBlur={this.onBlur} step='any' />
        </div>
        <div className='govuk-form-group'>
          <label className='govuk-label' htmlFor='email-address'>Email Address</label>
          <input className='govuk-input' name='email-address'
            type='text' required defaultValue={outputConfiguration.emailAddress} />
        </div>

      </div>
    )
  }
}

export default EmailEdit
