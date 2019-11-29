import {clone} from "./helpers"
import NotifyItems from "./notify-items"
import flatten from "flat"

class NotifyEdit extends React.Component {
  constructor (props) {
    super(props)
    let { data } = this.props
    this.usableKeys = [].concat.apply([], data.pages.map(page => page.components.filter(component => component.name).map(component => `${page.section ? page.section + '.':''}${component.name}`)))
  }

  onSubmit = e => {
    e.preventDefault()
    const form = e.target
    const formData = new window.FormData(form)
    const { data } = this.props
    const copy = clone(data)

    // Items
    const descriptions = formData.getAll('description').map(t => t.trim())
    const amount = formData.getAll('amount').map(t => t.trim())
    const conditions = formData.getAll('condition').map(t => t.trim())
    copy.fees = descriptions.map((description, i) => ({
      description,
      amount: amount[i],
      condition: conditions[i]
    }))

    console.log(copy.fees)

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

    const { data, fee } = this.props
    const copy = clone(data)

    copy.fees.splice(data.fees.indexOf(fee), 1)


    data.save(copy)
      .then(data => {
        console.log(data)
        this.props.onEdit({ data })
      })
      .catch(err => {
        console.error(err)
      })
  }

  render () {
    const { data } = this.props
    const { notify, conditions } = data
    const { templateId, personalisation } = notify

    return (
      <div className='govuk-body'>
        <form onSubmit={e => this.onSubmit(e)} autoComplete='off'>
          <a className="govuk-back-link" href='#'
             onClick={e => this.props.onCancel(e)}>Back</a>
            <div className="govuk-form-group">
              <label className='govuk-label' htmlFor='template-id'>Template ID</label>
              <input className='govuk-input' name='template-id'
                     type='text' required defaultValue={templateId}
                     onBlur={this.onBlur} step='any'/>
            </div>

          <NotifyItems items={personalisation} values={[...conditions.map(condition => condition.name), ...this.usableKeys]}  />

          <button className='govuk-button' type='submit'>Save</button>
        </form>
      </div>
    )
  }
}

export default NotifyEdit
