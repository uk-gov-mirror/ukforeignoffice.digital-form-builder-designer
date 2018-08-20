/* global React */
import { clone } from './helpers'

class PageEdit extends React.Component {
  state = {}

  onSubmit = e => {
    e.preventDefault()
    const form = e.target
    const formData = new window.FormData(form)
    const newPath = formData.get('path').trim()
    const title = formData.get('title').trim()
    const section = formData.get('section').trim()
    const { data, page } = this.props

    const copy = clone(data)
    const pathChanged = newPath !== page.path
    const copyPage = copy.pages[data.pages.indexOf(page)]

    if (pathChanged) {
      // `path` has changed - validate it is unique
      if (data.pages.find(p => p.path === newPath)) {
        form.elements.path.setCustomValidity(`Path '${newPath}' already exists`)
        form.reportValidity()
        return
      }

      copyPage.path = newPath

      // Update any references to the page
      copy.pages.forEach(p => {
        if (Array.isArray(p.next)) {
          p.next.forEach(n => {
            if (n.path === page.path) {
              n.path = newPath
            }
          })
        }
      })
    }

    if (title) {
      copyPage.title = title
    } else {
      delete copyPage.title
    }

    if (section) {
      copyPage.section = section
    } else {
      delete copyPage.section
    }

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

    const { data, page } = this.props
    const copy = clone(data)

    const copyPageIdx = copy.pages.findIndex(p => p.path === page.path)

    // Remove all links to the page
    copy.pages.forEach((p, index) => {
      if (index !== copyPageIdx && Array.isArray(p.next)) {
        for (var i = p.next.length - 1; i >= 0; i--) {
          const next = p.next[i]
          if (next.path === page.path) {
            p.next.splice(i, 1)
          }
        }
      }
    })

    // Remove the page itself
    copy.pages.splice(copyPageIdx, 1)

    data.save(copy)
      .then(data => {
        console.log(data)
        // this.props.onEdit({ data })
      })
      .catch(err => {
        console.error(err)
      })
  }

  render () {
    const { data, page } = this.props
    const { sections } = data

    return (
      <form onSubmit={this.onSubmit} autoComplete='off'>
        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='page-path'>Path</label>
          <input className='govuk-input' id='page-path' name='path'
            type='text' defaultValue={page.path}
            onChange={e => e.target.setCustomValidity('')} />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='page-title'>Title (optional)</label>
          <span id='page-title-hint' className='govuk-hint'>
            If not supplied, the title of the first question will be used.
          </span>
          <input className='govuk-input' id='page-title' name='title'
            type='text' defaultValue={page.title} aria-describedby='page-title-hint' />
        </div>

        <div className='govuk-form-group'>
          <label className='govuk-label govuk-label--s' htmlFor='page-section'>Section (optional)</label>
          <select className='govuk-select' id='page-section' name='section' defaultValue={page.section}>
            <option />
            {sections.map(section => (<option key={section.name} value={section.name}>{section.title}</option>))}
          </select>
        </div>
        <button className='govuk-button' type='submit'>Save</button>{' '}
        <button className='govuk-button' type='button' onClick={this.onClickDelete}>Delete</button>
      </form>
    )
  }
}

export default PageEdit
