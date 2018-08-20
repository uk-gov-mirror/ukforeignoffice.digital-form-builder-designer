
function componentToString (component) {
  return `${component.type}`
}

function DataModel (props) {
  const { data } = props
  const { sections, pages } = data

  const model = {}

  pages.forEach(page => {
    page.components.forEach(component => {
      if (component.name) {
        if (page.section) {
          const section = sections.find(section => section.name === page.section)
          if (!model[section.name]) {
            model[section.name] = {}
          }

          model[section.name][component.name] = componentToString(component)
        } else {
          model[component.name] = componentToString(component)
        }
      }
    })
  })

  return (
    <div className=''>
      <pre>{JSON.stringify(model, null, 2)}</pre>
    </div>
  )
}

export default DataModel
