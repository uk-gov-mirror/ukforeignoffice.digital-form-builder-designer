(function () {
  'use strict';

  function Flyout(props) {
    if (!props.show) {
      return null;
    }

    return React.createElement(
      'div',
      { className: 'flyout-menu show' },
      React.createElement(
        'div',
        { className: 'flyout-menu-container' },
        React.createElement(
          'a',
          { title: 'Close', className: 'close govuk-body govuk-!-font-size-16', onClick: function onClick(e) {
              return props.onHide(e);
            } },
          'Close'
        ),
        React.createElement(
          'div',
          { className: 'panel' },
          React.createElement(
            'div',
            { className: 'panel-header govuk-!-padding-top-4 govuk-!-padding-left-4' },
            props.title && React.createElement(
              'h4',
              { className: 'govuk-heading-m' },
              props.title
            )
          ),
          React.createElement(
            'div',
            { className: 'panel-body' },
            React.createElement(
              'div',
              { className: 'govuk-!-padding-left-4 govuk-!-padding-right-4 govuk-!-padding-bottom-4' },
              props.children
            )
          )
        )
      )
    );
  }

  function getFormData(form) {
    var formData = new window.FormData(form);
    var data = {
      options: {},
      schema: {}
    };

    function cast(name, val) {
      var el = form.elements[name];
      var cast = el && el.dataset.cast;

      if (!val) {
        return undefined;
      }

      if (cast === 'number') {
        return Number(val);
      } else if (cast === 'boolean') {
        return val === 'on';
      }

      return val;
    }

    formData.forEach(function (value, key) {
      var optionsPrefix = 'options.';
      var schemaPrefix = 'schema.';

      value = value.trim();

      if (value) {
        if (key.startsWith(optionsPrefix)) {
          if (key === optionsPrefix + 'required' && value === 'on') {
            data.options.required = false;
          } else {
            data.options[key.substr(optionsPrefix.length)] = cast(key, value);
          }
        } else if (key.startsWith(schemaPrefix)) {
          data.schema[key.substr(schemaPrefix.length)] = cast(key, value);
        } else if (value) {
          data[key] = value;
        }
      }
    });

    // Cleanup
    if (!Object.keys(data.schema).length) delete data.schema;
    if (!Object.keys(data.options).length) delete data.options;

    return data;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var PageEdit = function (_React$Component) {
    _inherits(PageEdit, _React$Component);

    function PageEdit() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck(this, PageEdit);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = PageEdit.__proto__ || Object.getPrototypeOf(PageEdit)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.onSubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        var formData = new window.FormData(form);
        var newPath = formData.get('path').trim();
        var title = formData.get('title').trim();
        var section = formData.get('section').trim();
        var _this$props = _this.props,
            data = _this$props.data,
            page = _this$props.page;


        var copy = clone(data);
        var pathChanged = newPath !== page.path;
        var copyPage = copy.pages[data.pages.indexOf(page)];

        if (pathChanged) {
          // `path` has changed - validate it is unique
          if (data.pages.find(function (p) {
            return p.path === newPath;
          })) {
            form.elements.path.setCustomValidity('Path \'' + newPath + '\' already exists');
            form.reportValidity();
            return;
          }

          copyPage.path = newPath;

          // Update any references to the page
          copy.pages.forEach(function (p) {
            if (Array.isArray(p.next)) {
              p.next.forEach(function (n) {
                if (n.path === page.path) {
                  n.path = newPath;
                }
              });
            }
          });
        }

        if (title) {
          copyPage.title = title;
        } else {
          delete copyPage.title;
        }

        if (section) {
          copyPage.section = section;
        } else {
          delete copyPage.section;
        }

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onEdit({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      }, _this.onClickDelete = function (e) {
        e.preventDefault();

        if (!window.confirm('Confirm delete')) {
          return;
        }

        var _this$props2 = _this.props,
            data = _this$props2.data,
            page = _this$props2.page;

        var copy = clone(data);

        var copyPageIdx = copy.pages.findIndex(function (p) {
          return p.path === page.path;
        });

        // Remove all links to the page
        copy.pages.forEach(function (p, index) {
          if (index !== copyPageIdx && Array.isArray(p.next)) {
            for (var i = p.next.length - 1; i >= 0; i--) {
              var next = p.next[i];
              if (next.path === page.path) {
                p.next.splice(i, 1);
              }
            }
          }
        });

        // Remove the page itself
        copy.pages.splice(copyPageIdx, 1);

        data.save(copy).then(function (data) {
          console.log(data);
          // this.props.onEdit({ data })
        }).catch(function (err) {
          console.error(err);
        });
      }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(PageEdit, [{
      key: 'render',
      value: function render() {
        var _props = this.props,
            data = _props.data,
            page = _props.page;
        var sections = data.sections;


        return React.createElement(
          'form',
          { onSubmit: this.onSubmit, autoComplete: 'off' },
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'page-path' },
              'Path'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'page-path', name: 'path',
              type: 'text', defaultValue: page.path,
              onChange: function onChange(e) {
                return e.target.setCustomValidity('');
              } })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'page-title' },
              'Title (optional)'
            ),
            React.createElement(
              'span',
              { id: 'page-title-hint', className: 'govuk-hint' },
              'If not supplied, the title of the first question will be used.'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'page-title', name: 'title',
              type: 'text', defaultValue: page.title, 'aria-describedby': 'page-title-hint' })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'page-section' },
              'Section (optional)'
            ),
            React.createElement(
              'select',
              { className: 'govuk-select', id: 'page-section', name: 'section', defaultValue: page.section },
              React.createElement('option', null),
              sections.map(function (section) {
                return React.createElement(
                  'option',
                  { key: section.name, value: section.name },
                  section.title
                );
              })
            )
          ),
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'submit' },
            'Save'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'button', onClick: this.onClickDelete },
            'Delete'
          )
        );
      }
    }]);

    return PageEdit;
  }(React.Component);

  var componentTypes = [{
    name: 'TextField',
    title: 'Text field',
    subType: 'field'
  }, {
    name: 'MultilineTextField',
    title: 'Multiline text field',
    subType: 'field'
  }, {
    name: 'YesNoField',
    title: 'Yes/No field',
    subType: 'field'
  }, {
    name: 'DateField',
    title: 'Date field',
    subType: 'field'
  }, {
    name: 'TimeField',
    title: 'Time field',
    subType: 'field'
  }, {
    name: 'DateTimeField',
    title: 'Date time field',
    subType: 'field'
  }, {
    name: 'DatePartsField',
    title: 'Date parts field',
    subType: 'field'
  }, {
    name: 'DateTimePartsField',
    title: 'Date time parts field',
    subType: 'field'
  }, {
    name: 'SelectField',
    title: 'Select field',
    subType: 'field'
  }, {
    name: 'RadiosField',
    title: 'Radios field',
    subType: 'field'
  }, {
    name: 'CheckboxesField',
    title: 'Checkboxes field',
    subType: 'field'
  }, {
    name: 'NumberField',
    title: 'Number field',
    subType: 'field'
  }, {
    name: 'UkAddressField',
    title: 'Uk address field',
    subType: 'field'
  }, {
    name: 'TelephoneNumberField',
    title: 'Telephone number field',
    subType: 'field'
  }, {
    name: 'EmailAddressField',
    title: 'Email address field',
    subType: 'field'
  }, {
    name: 'Para',
    title: 'Paragraph',
    subType: 'content'
  }, {
    name: 'Html',
    title: 'Html',
    subType: 'content'
  }, {
    name: 'InsetText',
    title: 'Inset text',
    subType: 'content'
  }, {
    name: 'Details',
    title: 'Details',
    subType: 'content'
  }];

  var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$1(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function Classes(props) {
    var component = props.component;

    var options = component.options || {};

    return React.createElement(
      'div',
      { className: 'govuk-form-group' },
      React.createElement(
        'label',
        { className: 'govuk-label govuk-label--s', htmlFor: 'field-options.classes' },
        'Classes'
      ),
      React.createElement(
        'span',
        { className: 'govuk-hint' },
        'Additional CSS classes to add to the field',
        React.createElement('br', null),
        'E.g. govuk-input--width-2, govuk-input--width-4, govuk-input--width-10, govuk-!-width-one-half, govuk-!-width-two-thirds, govuk-!-width-three-quarters'
      ),
      React.createElement('input', { className: 'govuk-input', id: 'field-options.classes', name: 'options.classes', type: 'text',
        defaultValue: options.classes })
    );
  }

  function FieldEdit(props) {
    var component = props.component;

    var options = component.options || {};

    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { className: 'govuk-form-group' },
        React.createElement(
          'label',
          { className: 'govuk-label govuk-label--s', htmlFor: 'field-name' },
          'Name'
        ),
        React.createElement('input', { className: 'govuk-input govuk-input--width-20', id: 'field-name',
          name: 'name', type: 'text', defaultValue: component.name, required: true, pattern: '^\\S+' })
      ),
      React.createElement(
        'div',
        { className: 'govuk-form-group' },
        React.createElement(
          'label',
          { className: 'govuk-label govuk-label--s', htmlFor: 'field-title' },
          'Title'
        ),
        React.createElement('input', { className: 'govuk-input', id: 'field-title', name: 'title', type: 'text',
          defaultValue: component.title, required: true })
      ),
      React.createElement(
        'div',
        { className: 'govuk-form-group' },
        React.createElement(
          'label',
          { className: 'govuk-label govuk-label--s', htmlFor: 'field-hint' },
          'Hint (optional)'
        ),
        React.createElement('input', { className: 'govuk-input', id: 'field-hint', name: 'hint', type: 'text',
          defaultValue: component.hint })
      ),
      React.createElement(
        'div',
        { className: 'govuk-checkboxes govuk-form-group' },
        React.createElement(
          'div',
          { className: 'govuk-checkboxes__item' },
          React.createElement('input', { className: 'govuk-checkboxes__input', id: 'field-options.required',
            name: 'options.required', type: 'checkbox', defaultChecked: options.required === false }),
          React.createElement(
            'label',
            { className: 'govuk-label govuk-checkboxes__label',
              htmlFor: 'field-options.required' },
            'Optional'
          )
        )
      ),
      props.children
    );
  }

  function TextFieldEdit(props) {
    var component = props.component;

    var schema = component.schema || {};

    return React.createElement(
      FieldEdit,
      { component: component },
      React.createElement(
        'details',
        { className: 'govuk-details' },
        React.createElement(
          'summary',
          { className: 'govuk-details__summary' },
          React.createElement(
            'span',
            { className: 'govuk-details__summary-text' },
            'more'
          )
        ),
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-schema.max' },
            'Max length'
          ),
          React.createElement(
            'span',
            { className: 'govuk-hint' },
            'Specifies the maximum number of characters'
          ),
          React.createElement('input', { className: 'govuk-input govuk-input--width-3', 'data-cast': 'number',
            id: 'field-schema.max', name: 'schema.max',
            defaultValue: schema.max, type: 'number' })
        ),
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-schema.min' },
            'Min length'
          ),
          React.createElement(
            'span',
            { className: 'govuk-hint' },
            'Specifies the minimum number of characters'
          ),
          React.createElement('input', { className: 'govuk-input govuk-input--width-3', 'data-cast': 'number',
            id: 'field-schema.min', name: 'schema.min',
            defaultValue: schema.min, type: 'number' })
        ),
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-schema.length' },
            'Length'
          ),
          React.createElement(
            'span',
            { className: 'govuk-hint' },
            'Specifies the exact text length'
          ),
          React.createElement('input', { className: 'govuk-input govuk-input--width-3', 'data-cast': 'number',
            id: 'field-schema.length', name: 'schema.length',
            defaultValue: schema.length, type: 'number' })
        ),
        React.createElement(Classes, { component: component })
      )
    );
  }

  function MultilineTextFieldEdit(props) {
    var component = props.component;

    var schema = component.schema || {};
    var options = component.options || {};

    return React.createElement(
      FieldEdit,
      { component: component },
      React.createElement(
        'details',
        { className: 'govuk-details' },
        React.createElement(
          'summary',
          { className: 'govuk-details__summary' },
          React.createElement(
            'span',
            { className: 'govuk-details__summary-text' },
            'more'
          )
        ),
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-schema.max' },
            'Max length'
          ),
          React.createElement(
            'span',
            { className: 'govuk-hint' },
            'Specifies the maximum number of characters'
          ),
          React.createElement('input', { className: 'govuk-input govuk-input--width-3', 'data-cast': 'number',
            id: 'field-schema.max', name: 'schema.max',
            defaultValue: schema.max, type: 'number' })
        ),
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-schema.min' },
            'Min length'
          ),
          React.createElement(
            'span',
            { className: 'govuk-hint' },
            'Specifies the minimum number of characters'
          ),
          React.createElement('input', { className: 'govuk-input govuk-input--width-3', 'data-cast': 'number',
            id: 'field-schema.min', name: 'schema.min',
            defaultValue: schema.min, type: 'number' })
        ),
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-options.rows' },
            'Rows'
          ),
          React.createElement('input', { className: 'govuk-input govuk-input--width-3', id: 'field-options.rows', name: 'options.rows', type: 'text',
            'data-cast': 'number', defaultValue: options.rows })
        ),
        React.createElement(Classes, { component: component })
      )
    );
  }

  function NumberFieldEdit(props) {
    var component = props.component;

    var schema = component.schema || {};

    return React.createElement(
      FieldEdit,
      { component: component },
      React.createElement(
        'details',
        { className: 'govuk-details' },
        React.createElement(
          'summary',
          { className: 'govuk-details__summary' },
          React.createElement(
            'span',
            { className: 'govuk-details__summary-text' },
            'more'
          )
        ),
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-schema.min' },
            'Min'
          ),
          React.createElement(
            'span',
            { className: 'govuk-hint' },
            'Specifies the minimum value'
          ),
          React.createElement('input', { className: 'govuk-input govuk-input--width-3', 'data-cast': 'number',
            id: 'field-schema.min', name: 'schema.min',
            defaultValue: schema.min, type: 'number' })
        ),
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-schema.max' },
            'Max'
          ),
          React.createElement(
            'span',
            { className: 'govuk-hint' },
            'Specifies the maximum value'
          ),
          React.createElement('input', { className: 'govuk-input govuk-input--width-3', 'data-cast': 'number',
            id: 'field-schema.max', name: 'schema.max',
            defaultValue: schema.max, type: 'number' })
        ),
        React.createElement(
          'div',
          { className: 'govuk-checkboxes govuk-form-group' },
          React.createElement(
            'div',
            { className: 'govuk-checkboxes__item' },
            React.createElement('input', { className: 'govuk-checkboxes__input', id: 'field-schema.integer', 'data-cast': 'boolean',
              name: 'schema.integer', type: 'checkbox', defaultChecked: schema.integer === true }),
            React.createElement(
              'label',
              { className: 'govuk-label govuk-checkboxes__label',
                htmlFor: 'field-schema.integer' },
              'Integer'
            )
          )
        ),
        React.createElement(Classes, { component: component })
      )
    );
  }

  function SelectFieldEdit(props) {
    var component = props.component,
        data = props.data;

    var options = component.options || {};
    var lists = data.lists;

    return React.createElement(
      FieldEdit,
      { component: component },
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-options.list' },
            'List'
          ),
          React.createElement(
            'select',
            { className: 'govuk-select govuk-input--width-10', id: 'field-options.list', name: 'options.list',
              defaultValue: options.list, required: true },
            React.createElement('option', null),
            lists.map(function (list) {
              return React.createElement(
                'option',
                { key: list.name, value: list.name },
                list.title
              );
            })
          )
        ),
        React.createElement(Classes, { component: component })
      )
    );
  }

  function RadiosFieldEdit(props) {
    var component = props.component,
        data = props.data;

    var options = component.options || {};
    var lists = data.lists;

    return React.createElement(
      FieldEdit,
      { component: component },
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-options.list' },
            'List'
          ),
          React.createElement(
            'select',
            { className: 'govuk-select govuk-input--width-10', id: 'field-options.list', name: 'options.list',
              defaultValue: options.list, required: true },
            React.createElement('option', null),
            lists.map(function (list) {
              return React.createElement(
                'option',
                { key: list.name, value: list.name },
                list.title
              );
            })
          )
        )
      )
    );
  }

  function CheckboxesFieldEdit(props) {
    var component = props.component,
        data = props.data;

    var options = component.options || {};
    var lists = data.lists;

    return React.createElement(
      FieldEdit,
      { component: component },
      React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { className: 'govuk-form-group' },
          React.createElement(
            'label',
            { className: 'govuk-label govuk-label--s', htmlFor: 'field-options.list' },
            'List'
          ),
          React.createElement(
            'select',
            { className: 'govuk-select govuk-input--width-10', id: 'field-options.list', name: 'options.list',
              defaultValue: options.list, required: true },
            React.createElement('option', null),
            lists.map(function (list) {
              return React.createElement(
                'option',
                { key: list.name, value: list.name },
                list.title
              );
            })
          )
        )
      )
    );
  }

  function ParaEdit(props) {
    var component = props.component;


    return React.createElement(
      'div',
      { className: 'govuk-form-group' },
      React.createElement(
        'label',
        { className: 'govuk-label', htmlFor: 'para-content' },
        'Content'
      ),
      React.createElement('textarea', { className: 'govuk-textarea', id: 'para-content', name: 'content',
        defaultValue: component.content, rows: '10', required: true })
    );
  }

  var InsetTextEdit = ParaEdit;
  var HtmlEdit = ParaEdit;

  function DetailsEdit(props) {
    var component = props.component;


    return React.createElement(
      'div',
      null,
      React.createElement(
        'div',
        { className: 'govuk-form-group' },
        React.createElement(
          'label',
          { className: 'govuk-label', htmlFor: 'details-title' },
          'Title'
        ),
        React.createElement('input', { className: 'govuk-input', id: 'details-title', name: 'title',
          defaultValue: component.title, required: true })
      ),
      React.createElement(
        'div',
        { className: 'govuk-form-group' },
        React.createElement(
          'label',
          { className: 'govuk-label', htmlFor: 'details-content' },
          'Content'
        ),
        React.createElement('textarea', { className: 'govuk-textarea', id: 'details-content', name: 'content',
          defaultValue: component.content, rows: '10', required: true })
      )
    );
  }

  var componentTypeEditors = {
    'TextFieldEdit': TextFieldEdit,
    'EmailAddressFieldEdit': TextFieldEdit,
    'TelephoneNumberFieldEdit': TextFieldEdit,
    'NumberFieldEdit': NumberFieldEdit,
    'MultilineTextFieldEdit': MultilineTextFieldEdit,
    'SelectFieldEdit': SelectFieldEdit,
    'RadiosFieldEdit': RadiosFieldEdit,
    'CheckboxesFieldEdit': CheckboxesFieldEdit,
    'ParaEdit': ParaEdit,
    'HtmlEdit': HtmlEdit,
    'InsetTextEdit': InsetTextEdit,
    'DetailsEdit': DetailsEdit
  };

  var ComponentTypeEdit = function (_React$Component) {
    _inherits$1(ComponentTypeEdit, _React$Component);

    function ComponentTypeEdit() {
      _classCallCheck$1(this, ComponentTypeEdit);

      return _possibleConstructorReturn$1(this, (ComponentTypeEdit.__proto__ || Object.getPrototypeOf(ComponentTypeEdit)).apply(this, arguments));
    }

    _createClass$1(ComponentTypeEdit, [{
      key: 'render',
      value: function render() {
        var _props = this.props,
            component = _props.component,
            data = _props.data;


        var type = componentTypes.find(function (t) {
          return t.name === component.type;
        });
        if (!type) {
          return '';
        } else {
          var TagName = componentTypeEditors[component.type + 'Edit'] || FieldEdit;
          return React.createElement(TagName, { component: component, data: data });
        }
      }
    }]);

    return ComponentTypeEdit;
  }(React.Component);

  var _createClass$2 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$2(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$2(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var ComponentEdit = function (_React$Component) {
    _inherits$2(ComponentEdit, _React$Component);

    function ComponentEdit() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$2(this, ComponentEdit);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$2(this, (_ref = ComponentEdit.__proto__ || Object.getPrototypeOf(ComponentEdit)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.onSubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        var _this$props = _this.props,
            data = _this$props.data,
            page = _this$props.page,
            component = _this$props.component;

        var formData = getFormData(form);
        var copy = clone(data);
        var copyPage = copy.pages.find(function (p) {
          return p.path === page.path;
        });

        // Apply
        var componentIndex = page.components.indexOf(component);
        copyPage.components[componentIndex] = formData;

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onEdit({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      }, _this.onClickDelete = function (e) {
        e.preventDefault();

        if (!window.confirm('Confirm delete')) {
          return;
        }

        var _this$props2 = _this.props,
            data = _this$props2.data,
            page = _this$props2.page,
            component = _this$props2.component;

        var componentIdx = page.components.findIndex(function (c) {
          return c === component;
        });
        var copy = clone(data);

        var copyPage = copy.pages.find(function (p) {
          return p.path === page.path;
        });
        var isLast = componentIdx === page.components.length - 1;

        // Remove the component
        copyPage.components.splice(componentIdx, 1);

        data.save(copy).then(function (data) {
          console.log(data);
          if (!isLast) {
            // We dont have an id we can use for `key`-ing react <Component />'s
            // We therefore need to conditionally report `onEdit` changes.
            _this.props.onEdit({ data: data });
          }
        }).catch(function (err) {
          console.error(err);
        });
      }, _temp), _possibleConstructorReturn$2(_this, _ret);
    }

    _createClass$2(ComponentEdit, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var _props = this.props,
            page = _props.page,
            component = _props.component,
            data = _props.data;


        var copyComp = JSON.parse(JSON.stringify(component));

        return React.createElement(
          'div',
          null,
          React.createElement(
            'form',
            { autoComplete: 'off', onSubmit: function onSubmit(e) {
                return _this2.onSubmit(e);
              } },
            React.createElement(
              'div',
              { className: 'govuk-form-group' },
              React.createElement(
                'span',
                { className: 'govuk-label govuk-label--s', htmlFor: 'type' },
                'Type'
              ),
              React.createElement(
                'span',
                { className: 'govuk-body' },
                component.type
              ),
              React.createElement('input', { id: 'type', type: 'hidden', name: 'type', defaultValue: component.type })
            ),
            React.createElement(ComponentTypeEdit, {
              page: page,
              component: copyComp,
              data: data }),
            React.createElement(
              'button',
              { className: 'govuk-button', type: 'submit' },
              'Save'
            ),
            ' ',
            React.createElement(
              'button',
              { className: 'govuk-button', type: 'button', onClick: this.onClickDelete },
              'Delete'
            )
          )
        );
      }
    }]);

    return ComponentEdit;
  }(React.Component);

  var _createClass$3 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$3(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$3(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
  var SortableHandle = SortableHOC.SortableHandle;
  var DragHandle = SortableHandle(function () {
    return React.createElement(
      'span',
      { className: 'drag-handle' },
      '\u2630'
    );
  });

  var componentTypes$1 = {
    'TextField': TextField,
    'TelephoneNumberField': TelephoneNumberField,
    'NumberField': NumberField,
    'EmailAddressField': EmailAddressField,
    'TimeField': TimeField,
    'DateField': DateField,
    'DateTimeField': DateTimeField,
    'DatePartsField': DatePartsField,
    'DateTimePartsField': DateTimePartsField,
    'MultilineTextField': MultilineTextField,
    'RadiosField': RadiosField,
    'CheckboxesField': CheckboxesField,
    'SelectField': SelectField,
    'YesNoField': YesNoField,
    'UkAddressField': UkAddressField,
    'Para': Para,
    'Html': Html,
    'InsetText': InsetText,
    'Details': Details
  };

  function Base(props) {
    return React.createElement(
      'div',
      null,
      props.children
    );
  }

  function ComponentField(props) {
    return React.createElement(
      Base,
      null,
      props.children
    );
  }

  function TextField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement('div', { className: 'box' })
    );
  }

  function TelephoneNumberField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement('div', { className: 'box tel' })
    );
  }

  function EmailAddressField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement('div', { className: 'box email' })
    );
  }

  function UkAddressField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement('span', { className: 'box' }),
      React.createElement('span', { className: 'button square' })
    );
  }

  function MultilineTextField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement('span', { className: 'box tall' })
    );
  }

  function NumberField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement('div', { className: 'box number' })
    );
  }

  function DateField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement(
        'div',
        { className: 'box dropdown' },
        React.createElement(
          'span',
          { className: 'govuk-body govuk-!-font-size-14' },
          'dd/mm/yyyy'
        )
      )
    );
  }

  function DateTimeField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement(
        'div',
        { className: 'box large dropdown' },
        React.createElement(
          'span',
          { className: 'govuk-body govuk-!-font-size-14' },
          'dd/mm/yyyy hh:mm'
        )
      )
    );
  }

  function TimeField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement(
        'div',
        { className: 'box' },
        React.createElement(
          'span',
          { className: 'govuk-body govuk-!-font-size-14' },
          'hh:mm'
        )
      )
    );
  }

  function DateTimePartsField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement('span', { className: 'box small' }),
      React.createElement('span', { className: 'box small govuk-!-margin-left-1 govuk-!-margin-right-1' }),
      React.createElement('span', { className: 'box medium govuk-!-margin-right-1' }),
      React.createElement('span', { className: 'box small govuk-!-margin-right-1' }),
      React.createElement('span', { className: 'box small' })
    );
  }

  function DatePartsField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement('span', { className: 'box small' }),
      React.createElement('span', { className: 'box small govuk-!-margin-left-1 govuk-!-margin-right-1' }),
      React.createElement('span', { className: 'box medium' })
    );
  }

  function RadiosField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement(
        'div',
        { className: 'govuk-!-margin-bottom-1' },
        React.createElement('span', { className: 'circle' }),
        React.createElement('span', { className: 'line short' })
      ),
      React.createElement(
        'div',
        { className: 'govuk-!-margin-bottom-1' },
        React.createElement('span', { className: 'circle' }),
        React.createElement('span', { className: 'line short' })
      ),
      React.createElement('span', { className: 'circle' }),
      React.createElement('span', { className: 'line short' })
    );
  }

  function CheckboxesField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement(
        'div',
        { className: 'govuk-!-margin-bottom-1' },
        React.createElement('span', { className: 'check' }),
        React.createElement('span', { className: 'line short' })
      ),
      React.createElement(
        'div',
        { className: 'govuk-!-margin-bottom-1' },
        React.createElement('span', { className: 'check' }),
        React.createElement('span', { className: 'line short' })
      ),
      React.createElement('span', { className: 'check' }),
      React.createElement('span', { className: 'line short' })
    );
  }

  function SelectField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement('div', { className: 'box dropdown' })
    );
  }

  function YesNoField() {
    return React.createElement(
      ComponentField,
      null,
      React.createElement(
        'div',
        { className: 'govuk-!-margin-bottom-1' },
        React.createElement('span', { className: 'circle' }),
        React.createElement('span', { className: 'line short' })
      ),
      React.createElement('span', { className: 'circle' }),
      React.createElement('span', { className: 'line short' })
    );
  }

  function Details() {
    return React.createElement(
      Base,
      null,
      '\u25B6 ',
      React.createElement('span', { className: 'line details' })
    );
  }

  function InsetText() {
    return React.createElement(
      Base,
      null,
      React.createElement(
        'div',
        { className: 'inset govuk-!-padding-left-2' },
        React.createElement('div', { className: 'line' }),
        React.createElement('div', { className: 'line short govuk-!-margin-bottom-2 govuk-!-margin-top-2' }),
        React.createElement('div', { className: 'line' })
      )
    );
  }

  function Para() {
    return React.createElement(
      Base,
      null,
      React.createElement('div', { className: 'line' }),
      React.createElement('div', { className: 'line short govuk-!-margin-bottom-2 govuk-!-margin-top-2' }),
      React.createElement('div', { className: 'line' })
    );
  }

  function Html() {
    return React.createElement(
      Base,
      null,
      React.createElement(
        'div',
        { className: 'html' },
        React.createElement('span', { className: 'line xshort govuk-!-margin-bottom-1 govuk-!-margin-top-1' })
      )
    );
  }

  var Component = function (_React$Component) {
    _inherits$3(Component, _React$Component);

    function Component() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$3(this, Component);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$3(this, (_ref = Component.__proto__ || Object.getPrototypeOf(Component)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.showEditor = function (e, value) {
        e.stopPropagation();
        _this.setState({ showEditor: value });
      }, _temp), _possibleConstructorReturn$3(_this, _ret);
    }

    _createClass$3(Component, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var _props = this.props,
            data = _props.data,
            page = _props.page,
            component = _props.component;

        var TagName = componentTypes$1['' + component.type];

        return React.createElement(
          'div',
          null,
          React.createElement(
            'div',
            { className: 'component govuk-!-padding-2',
              onClick: function onClick(e) {
                return _this2.showEditor(e, true);
              } },
            React.createElement(DragHandle, null),
            React.createElement(TagName, null)
          ),
          React.createElement(
            Flyout,
            { title: 'Edit Component', show: this.state.showEditor,
              onHide: function onHide(e) {
                return _this2.showEditor(e, false);
              } },
            React.createElement(ComponentEdit, { component: component, page: page, data: data,
              onEdit: function onEdit(e) {
                return _this2.setState({ showEditor: false });
              } })
          )
        );
      }
    }]);

    return Component;
  }(React.Component);

  var _createClass$4 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$4(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$4(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$4(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var ComponentCreate = function (_React$Component) {
    _inherits$4(ComponentCreate, _React$Component);

    function ComponentCreate() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$4(this, ComponentCreate);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$4(this, (_ref = ComponentCreate.__proto__ || Object.getPrototypeOf(ComponentCreate)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.onSubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        var _this$props = _this.props,
            page = _this$props.page,
            data = _this$props.data;

        var formData = getFormData(form);
        var copy = clone(data);
        var copyPage = copy.pages.find(function (p) {
          return p.path === page.path;
        });

        // Apply
        copyPage.components.push(formData);

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onCreate({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      }, _temp), _possibleConstructorReturn$4(_this, _ret);
    }

    _createClass$4(ComponentCreate, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var _props = this.props,
            page = _props.page,
            data = _props.data;


        return React.createElement(
          'div',
          null,
          React.createElement(
            'form',
            { onSubmit: function onSubmit(e) {
                return _this2.onSubmit(e);
              }, autoComplete: 'off' },
            React.createElement(
              'div',
              { className: 'govuk-form-group' },
              React.createElement(
                'label',
                { className: 'govuk-label govuk-label--s', htmlFor: 'type' },
                'Type'
              ),
              React.createElement(
                'select',
                { className: 'govuk-select', id: 'type', name: 'type', required: true,
                  onChange: function onChange(e) {
                    return _this2.setState({ component: { type: e.target.value } });
                  } },
                React.createElement('option', null),
                componentTypes.map(function (type) {
                  return React.createElement(
                    'option',
                    { key: type.name, value: type.name },
                    type.title
                  );
                })
              )
            ),
            this.state.component && this.state.component.type && React.createElement(
              'div',
              null,
              React.createElement(ComponentTypeEdit, {
                page: page,
                component: this.state.component,
                data: data }),
              React.createElement(
                'button',
                { type: 'submit', className: 'govuk-button' },
                'Save'
              )
            )
          )
        );
      }
    }]);

    return ComponentCreate;
  }(React.Component);

  var _createClass$5 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$5(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$5(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$5(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var SortableElement = SortableHOC.SortableElement;
  var SortableContainer = SortableHOC.SortableContainer;
  var arrayMove = SortableHOC.arrayMove;

  var SortableItem = SortableElement(function (_ref) {
    var index = _ref.index,
        page = _ref.page,
        component = _ref.component,
        data = _ref.data;
    return React.createElement(
      'div',
      { className: 'component-item' },
      React.createElement(Component, { key: index, page: page, component: component, data: data })
    );
  });

  var SortableList = SortableContainer(function (_ref2) {
    var page = _ref2.page,
        data = _ref2.data;

    return React.createElement(
      'div',
      { className: 'component-list' },
      page.components.map(function (component, index) {
        return React.createElement(SortableItem, { key: index, index: index, page: page, component: component, data: data });
      })
    );
  });

  var Page = function (_React$Component) {
    _inherits$5(Page, _React$Component);

    function Page() {
      var _ref3;

      var _temp, _this, _ret;

      _classCallCheck$5(this, Page);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$5(this, (_ref3 = Page.__proto__ || Object.getPrototypeOf(Page)).call.apply(_ref3, [this].concat(args))), _this), _this.state = {}, _this.showEditor = function (e, value) {
        e.stopPropagation();
        _this.setState({ showEditor: value });
      }, _this.onSortEnd = function (_ref4) {
        var oldIndex = _ref4.oldIndex,
            newIndex = _ref4.newIndex;
        var _this$props = _this.props,
            page = _this$props.page,
            data = _this$props.data;

        var copy = clone(data);
        var copyPage = copy.pages.find(function (p) {
          return p.path === page.path;
        });
        copyPage.components = arrayMove(copyPage.components, oldIndex, newIndex);

        data.save(copy);

        // OPTIMISTIC SAVE TO STOP JUMP

        // const { page, data } = this.props
        // page.components = arrayMove(page.components, oldIndex, newIndex)

        // data.save(data)
      }, _temp), _possibleConstructorReturn$5(_this, _ret);
    }

    _createClass$5(Page, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var _props = this.props,
            page = _props.page,
            data = _props.data;
        var sections = data.sections;

        var formComponents = page.components.filter(function (comp) {
          return componentTypes.find(function (type) {
            return type.name === comp.type;
          }).subType === 'field';
        });
        var pageTitle = page.title || (formComponents.length === 1 && page.components[0] === formComponents[0] ? formComponents[0].title : page.title);
        var section = page.section && sections.find(function (section) {
          return section.name === page.section;
        });

        return React.createElement(
          'div',
          { id: page.path, className: 'page xtooltip', title: page.path, style: this.props.layout },
          React.createElement('div', { className: 'handle', onClick: function onClick(e) {
              return _this2.showEditor(e, true);
            } }),
          React.createElement(
            'div',
            { className: 'govuk-!-padding-top-2 govuk-!-padding-left-2 govuk-!-padding-right-2' },
            React.createElement(
              'h3',
              { className: 'govuk-heading-s' },
              section && React.createElement(
                'span',
                { className: 'govuk-caption-m govuk-!-font-size-14' },
                section.title
              ),
              pageTitle
            )
          ),
          React.createElement(SortableList, { page: page, data: data, pressDelay: 200,
            onSortEnd: this.onSortEnd, lockAxis: 'y', helperClass: 'dragging',
            lockToContainerEdges: true, useDragHandle: true }),
          React.createElement(
            'div',
            { className: 'govuk-!-padding-2' },
            React.createElement(
              'a',
              { className: 'preview pull-right govuk-body govuk-!-font-size-14',
                href: page.path, target: 'preview' },
              'Open'
            ),
            React.createElement('div', { className: 'button active',
              onClick: function onClick(e) {
                return _this2.setState({ showAddComponent: true });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Edit Page', show: this.state.showEditor,
              onHide: function onHide(e) {
                return _this2.showEditor(e, false);
              } },
            React.createElement(PageEdit, { page: page, data: data,
              onEdit: function onEdit(e) {
                return _this2.setState({ showEditor: false });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Add Component', show: this.state.showAddComponent,
              onHide: function onHide() {
                return _this2.setState({ showAddComponent: false });
              } },
            React.createElement(ComponentCreate, { page: page, data: data,
              onCreate: function onCreate(e) {
                return _this2.setState({ showAddComponent: false });
              } })
          )
        );
      }
    }]);

    return Page;
  }(React.Component);

  var listTypes = ['SelectField', 'RadiosField', 'CheckboxesField'];

  function componentToString(component) {
    if (~listTypes.indexOf(component.type)) {
      return component.type + '<' + component.options.list + '>';
    }
    return '' + component.type;
  }

  function DataModel(props) {
    var data = props.data;
    var sections = data.sections,
        pages = data.pages;


    var model = {};

    pages.forEach(function (page) {
      page.components.forEach(function (component) {
        if (component.name) {
          if (page.section) {
            var section = sections.find(function (section) {
              return section.name === page.section;
            });
            if (!model[section.name]) {
              model[section.name] = {};
            }

            model[section.name][component.name] = componentToString(component);
          } else {
            model[component.name] = componentToString(component);
          }
        }
      });
    });

    return React.createElement(
      'div',
      null,
      React.createElement(
        'pre',
        null,
        JSON.stringify(model, null, 2)
      )
    );
  }

  var _createClass$6 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$6(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$6(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$6(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var PageCreate = function (_React$Component) {
    _inherits$6(PageCreate, _React$Component);

    function PageCreate() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$6(this, PageCreate);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$6(this, (_ref = PageCreate.__proto__ || Object.getPrototypeOf(PageCreate)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.onSubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        var formData = new window.FormData(form);
        var path = formData.get('path').trim();
        var data = _this.props.data;

        // Validate

        if (data.pages.find(function (page) {
          return page.path === path;
        })) {
          form.elements.path.setCustomValidity('Path \'' + path + '\' already exists');
          form.reportValidity();
          return;
        }

        var value = {
          path: path
        };

        var title = formData.get('title').trim();
        var section = formData.get('section').trim();

        if (title) {
          value.title = title;
        }
        if (section) {
          value.section = section;
        }

        // Apply
        Object.assign(value, {
          components: [],
          next: []
        });

        var copy = clone(data);

        copy.pages.push(value);

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onCreate({ value: value });
        }).catch(function (err) {
          console.error(err);
        });
      }, _temp), _possibleConstructorReturn$6(_this, _ret);
    }

    _createClass$6(PageCreate, [{
      key: 'render',


      // onBlurName = e => {
      //   const input = e.target
      //   const { data } = this.props
      //   const newName = input.value.trim()

      //   // Validate it is unique
      //   if (data.lists.find(l => l.name === newName)) {
      //     input.setCustomValidity(`List '${newName}' already exists`)
      //   } else {
      //     input.setCustomValidity('')
      //   }
      // }

      value: function render() {
        var _this2 = this;

        var data = this.props.data;
        var sections = data.sections;


        return React.createElement(
          'form',
          { onSubmit: function onSubmit(e) {
              return _this2.onSubmit(e);
            }, autoComplete: 'off' },
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'page-path' },
              'Path'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'page-path', name: 'path',
              type: 'text', required: true,
              onChange: function onChange(e) {
                return e.target.setCustomValidity('');
              } })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'page-title' },
              'Title (optional)'
            ),
            React.createElement(
              'span',
              { id: 'page-title-hint', className: 'govuk-hint' },
              'If not supplied, the title of the first question will be used.'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'page-title', name: 'title',
              type: 'text', 'aria-describedby': 'page-title-hint' })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'page-section' },
              'Section (optional)'
            ),
            React.createElement(
              'select',
              { className: 'govuk-select', id: 'page-section', name: 'section' },
              React.createElement('option', null),
              sections.map(function (section) {
                return React.createElement(
                  'option',
                  { key: section.name, value: section.name },
                  section.title
                );
              })
            )
          ),
          React.createElement(
            'button',
            { type: 'submit', className: 'govuk-button' },
            'Save'
          )
        );
      }
    }]);

    return PageCreate;
  }(React.Component);

  var _createClass$7 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$7(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$7(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$7(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var LinkEdit = function (_React$Component) {
    _inherits$7(LinkEdit, _React$Component);

    function LinkEdit(props) {
      _classCallCheck$7(this, LinkEdit);

      var _this = _possibleConstructorReturn$7(this, (LinkEdit.__proto__ || Object.getPrototypeOf(LinkEdit)).call(this, props));

      _initialiseProps.call(_this);

      var _this$props = _this.props,
          data = _this$props.data,
          edge = _this$props.edge;

      var page = data.pages.find(function (page) {
        return page.path === edge.source;
      });
      var link = page.next.find(function (n) {
        return n.path === edge.target;
      });

      _this.state = {
        page: page,
        link: link
      };
      return _this;
    }

    _createClass$7(LinkEdit, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var link = this.state.link;
        var _props = this.props,
            data = _props.data,
            edge = _props.edge;
        var pages = data.pages;


        return React.createElement(
          'form',
          { onSubmit: function onSubmit(e) {
              return _this2.onSubmit(e);
            }, autoComplete: 'off' },
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'link-source' },
              'From'
            ),
            React.createElement(
              'select',
              { defaultValue: edge.source, className: 'govuk-select', id: 'link-source', disabled: true },
              React.createElement('option', null),
              pages.map(function (page) {
                return React.createElement(
                  'option',
                  { key: page.path, value: page.path },
                  page.path
                );
              })
            )
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'link-target' },
              'To'
            ),
            React.createElement(
              'select',
              { defaultValue: edge.target, className: 'govuk-select', id: 'link-target', disabled: true },
              React.createElement('option', null),
              pages.map(function (page) {
                return React.createElement(
                  'option',
                  { key: page.path, value: page.path },
                  page.path
                );
              })
            )
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'link-condition' },
              'Condition (optional)'
            ),
            React.createElement(
              'span',
              { id: 'link-condition-hint', className: 'govuk-hint' },
              'The link will only be used if the expression evaluates to truthy.'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'link-condition', name: 'if',
              type: 'text', defaultValue: link.if, 'aria-describedby': 'link-condition-hint' })
          ),
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'submit' },
            'Save'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'button', onClick: this.onClickDelete },
            'Delete'
          )
        );
      }
    }]);

    return LinkEdit;
  }(React.Component);

  var _initialiseProps = function _initialiseProps() {
    var _this3 = this;

    this.onSubmit = function (e) {
      e.preventDefault();
      var form = e.target;
      var formData = new window.FormData(form);
      var condition = formData.get('if').trim();
      var data = _this3.props.data;
      var _state = _this3.state,
          link = _state.link,
          page = _state.page;


      var copy = clone(data);
      var copyPage = copy.pages.find(function (p) {
        return p.path === page.path;
      });
      var copyLink = copyPage.next.find(function (n) {
        return n.path === link.path;
      });

      if (condition) {
        copyLink.if = condition;
      } else {
        delete copyLink.if;
      }

      data.save(copy).then(function (data) {
        console.log(data);
        _this3.props.onEdit({ data: data });
      }).catch(function (err) {
        console.error(err);
      });
    };

    this.onClickDelete = function (e) {
      e.preventDefault();

      if (!window.confirm('Confirm delete')) {
        return;
      }

      var data = _this3.props.data;
      var _state2 = _this3.state,
          link = _state2.link,
          page = _state2.page;


      var copy = clone(data);
      var copyPage = copy.pages.find(function (p) {
        return p.path === page.path;
      });
      var copyLinkIdx = copyPage.next.findIndex(function (n) {
        return n.path === link.path;
      });
      copyPage.next.splice(copyLinkIdx, 1);

      data.save(copy).then(function (data) {
        console.log(data);
        _this3.props.onEdit({ data: data });
      }).catch(function (err) {
        console.error(err);
      });
    };
  };

  var _createClass$8 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$8(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$8(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$8(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var LinkCreate = function (_React$Component) {
    _inherits$8(LinkCreate, _React$Component);

    function LinkCreate() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$8(this, LinkCreate);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$8(this, (_ref = LinkCreate.__proto__ || Object.getPrototypeOf(LinkCreate)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.onSubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        var formData = new window.FormData(form);
        var from = formData.get('path');
        var to = formData.get('page');
        var condition = formData.get('if');

        // Apply
        var data = _this.props.data;

        var copy = clone(data);
        var page = copy.pages.find(function (p) {
          return p.path === from;
        });

        var next = { path: to };

        if (condition) {
          next.if = condition;
        }

        if (!page.next) {
          page.next = [];
        }

        page.next.push(next);

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onCreate({ next: next });
        }).catch(function (err) {
          console.error(err);
        });
      }, _temp), _possibleConstructorReturn$8(_this, _ret);
    }

    _createClass$8(LinkCreate, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var data = this.props.data;
        var pages = data.pages;


        return React.createElement(
          'form',
          { onSubmit: function onSubmit(e) {
              return _this2.onSubmit(e);
            }, autoComplete: 'off' },
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'link-source' },
              'From'
            ),
            React.createElement(
              'select',
              { className: 'govuk-select', id: 'link-source', name: 'path', required: true },
              React.createElement('option', null),
              pages.map(function (page) {
                return React.createElement(
                  'option',
                  { key: page.path, value: page.path },
                  page.path
                );
              })
            )
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'link-target' },
              'To'
            ),
            React.createElement(
              'select',
              { className: 'govuk-select', id: 'link-target', name: 'page', required: true },
              React.createElement('option', null),
              pages.map(function (page) {
                return React.createElement(
                  'option',
                  { key: page.path, value: page.path },
                  page.path
                );
              })
            )
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'link-condition' },
              'Condition (optional)'
            ),
            React.createElement(
              'span',
              { id: 'link-condition-hint', className: 'govuk-hint' },
              'The link will only be used if the expression evaluates to truthy.'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'link-condition', name: 'if',
              type: 'text', 'aria-describedby': 'link-condition-hint' })
          ),
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'submit' },
            'Save'
          )
        );
      }
    }]);

    return LinkCreate;
  }(React.Component);

  var _createClass$9 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$9(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$9(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$9(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function headDuplicate(arr) {
    for (var i = 0; i < arr.length; i++) {
      for (var j = i + 1; j < arr.length; j++) {
        if (arr[j] === arr[i]) {
          return j;
        }
      }
    }
  }

  var ListItems = function (_React$Component) {
    _inherits$9(ListItems, _React$Component);

    function ListItems(props) {
      _classCallCheck$9(this, ListItems);

      var _this = _possibleConstructorReturn$9(this, (ListItems.__proto__ || Object.getPrototypeOf(ListItems)).call(this, props));

      _this.onClickAddItem = function (e) {
        _this.setState({
          items: _this.state.items.concat({ text: '', value: '' })
        });
      };

      _this.removeItem = function (idx) {
        _this.setState({
          items: _this.state.items.filter(function (s, i) {
            return i !== idx;
          })
        });
      };

      _this.onClickDelete = function (e) {
        e.preventDefault();

        if (!window.confirm('Confirm delete')) {
          return;
        }

        var _this$props = _this.props,
            data = _this$props.data,
            list = _this$props.list;

        var copy = clone(data);

        // Remove the list
        copy.lists.splice(data.lists.indexOf(list), 1);

        // Update any references to the list
        copy.pages.forEach(function (p) {
          if (p.list === list.name) {
            delete p.list;
          }
        });

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onEdit({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      };

      _this.onBlur = function (e) {
        var form = e.target.form;
        var formData = new window.FormData(form);
        var texts = formData.getAll('text').map(function (t) {
          return t.trim();
        });
        var values = formData.getAll('value').map(function (t) {
          return t.trim();
        });

        // Only validate dupes if there is more than one item
        if (texts.length < 2) {
          return;
        }

        form.elements.text.forEach(function (el) {
          return el.setCustomValidity('');
        });
        form.elements.value.forEach(function (el) {
          return el.setCustomValidity('');
        });

        // Validate uniqueness
        var dupeText = headDuplicate(texts);
        if (dupeText) {
          form.elements.text[dupeText].setCustomValidity('Duplicate texts found in the list items');
          return;
        }

        var dupeValue = headDuplicate(values);
        if (dupeValue) {
          form.elements.value[dupeValue].setCustomValidity('Duplicate values found in the list items');
        }
      };

      _this.state = {
        items: props.items ? clone(props.items) : []
      };
      return _this;
    }

    _createClass$9(ListItems, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var items = this.state.items;
        var type = this.props.type;


        return React.createElement(
          'table',
          { className: 'govuk-table' },
          React.createElement(
            'caption',
            { className: 'govuk-table__caption' },
            'Items'
          ),
          React.createElement(
            'thead',
            { className: 'govuk-table__head' },
            React.createElement(
              'tr',
              { className: 'govuk-table__row' },
              React.createElement(
                'th',
                { className: 'govuk-table__header', scope: 'col' },
                'Text'
              ),
              React.createElement(
                'th',
                { className: 'govuk-table__header', scope: 'col' },
                'Value'
              ),
              React.createElement(
                'th',
                { className: 'govuk-table__header', scope: 'col' },
                React.createElement(
                  'a',
                  { className: 'pull-right', href: '#', onClick: this.onClickAddItem },
                  'Add'
                )
              )
            )
          ),
          React.createElement(
            'tbody',
            { className: 'govuk-table__body' },
            items.map(function (item, index) {
              return React.createElement(
                'tr',
                { key: item.value + index, className: 'govuk-table__row', scope: 'row' },
                React.createElement(
                  'td',
                  { className: 'govuk-table__cell' },
                  React.createElement('input', { className: 'govuk-input', name: 'text',
                    type: 'text', defaultValue: item.text, required: true,
                    onBlur: _this2.onBlur })
                ),
                React.createElement(
                  'td',
                  { className: 'govuk-table__cell' },
                  type === 'number' ? React.createElement('input', { className: 'govuk-input', name: 'value',
                    type: 'number', defaultValue: item.value, required: true,
                    onBlur: _this2.onBlur, step: 'any' }) : React.createElement('input', { className: 'govuk-input', name: 'value',
                    type: 'text', defaultValue: item.value, required: true,
                    onBlur: _this2.onBlur })
                ),
                React.createElement(
                  'td',
                  { className: 'govuk-table__cell', width: '20px' },
                  React.createElement(
                    'a',
                    { className: 'list-item-delete', onClick: function onClick() {
                        return _this2.removeItem(index);
                      } },
                    '\uD83D\uDDD1'
                  )
                )
              );
            })
          )
        );
      }
    }]);

    return ListItems;
  }(React.Component);

  var _createClass$a = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$a(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$a(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$a(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var ListEdit = function (_React$Component) {
    _inherits$a(ListEdit, _React$Component);

    function ListEdit(props) {
      _classCallCheck$a(this, ListEdit);

      var _this = _possibleConstructorReturn$a(this, (ListEdit.__proto__ || Object.getPrototypeOf(ListEdit)).call(this, props));

      _this.onSubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        var formData = new window.FormData(form);
        var newName = formData.get('name').trim();
        var newTitle = formData.get('title').trim();
        var newType = formData.get('type');
        var _this$props = _this.props,
            data = _this$props.data,
            list = _this$props.list;


        var copy = clone(data);
        var nameChanged = newName !== list.name;
        var copyList = copy.lists[data.lists.indexOf(list)];

        if (nameChanged) {
          copyList.name = newName;

          // Update any references to the list
          copy.pages.forEach(function (p) {
            p.components.forEach(function (c) {
              if (c.type === 'SelectField' || c.type === 'RadiosField') {
                if (c.options && c.options.list === list.name) {
                  c.options.list = newName;
                }
              }
            });
          });
        }

        copyList.title = newTitle;
        copyList.type = newType;

        // Items
        var texts = formData.getAll('text').map(function (t) {
          return t.trim();
        });
        var values = formData.getAll('value').map(function (t) {
          return t.trim();
        });
        copyList.items = texts.map(function (t, i) {
          return { text: t, value: values[i] };
        });

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onEdit({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      };

      _this.onClickDelete = function (e) {
        e.preventDefault();

        if (!window.confirm('Confirm delete')) {
          return;
        }

        var _this$props2 = _this.props,
            data = _this$props2.data,
            list = _this$props2.list;

        var copy = clone(data);

        // Remove the list
        copy.lists.splice(data.lists.indexOf(list), 1);

        // Update any references to the list
        copy.pages.forEach(function (p) {
          if (p.list === list.name) {
            delete p.list;
          }
        });

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onEdit({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      };

      _this.onBlurName = function (e) {
        var input = e.target;
        var _this$props3 = _this.props,
            data = _this$props3.data,
            list = _this$props3.list;

        var newName = input.value.trim();

        // Validate it is unique
        if (data.lists.find(function (l) {
          return l !== list && l.name === newName;
        })) {
          input.setCustomValidity('List \'' + newName + '\' already exists');
        } else {
          input.setCustomValidity('');
        }
      };

      _this.state = {
        type: props.list.type
      };
      return _this;
    }

    _createClass$a(ListEdit, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var state = this.state;
        var list = this.props.list;


        return React.createElement(
          'form',
          { onSubmit: function onSubmit(e) {
              return _this2.onSubmit(e);
            }, autoComplete: 'off' },
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'list-name' },
              'Name'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'list-name', name: 'name',
              type: 'text', defaultValue: list.name, required: true, pattern: '^\\S+',
              onBlur: this.onBlurName })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'list-title' },
              'Title'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'list-title', name: 'title',
              type: 'text', defaultValue: list.title, required: true })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'list-type' },
              'Value type'
            ),
            React.createElement(
              'select',
              { className: 'govuk-select', id: 'list-type', name: 'type',
                value: state.type,
                onChange: function onChange(e) {
                  return _this2.setState({ type: e.target.value });
                } },
              React.createElement(
                'option',
                { value: 'string' },
                'String'
              ),
              React.createElement(
                'option',
                { value: 'number' },
                'Number'
              )
            )
          ),
          React.createElement(ListItems, { items: list.items, type: state.type }),
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'submit' },
            'Save'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'button', onClick: this.onClickDelete },
            'Delete'
          ),
          React.createElement(
            'a',
            { className: 'pull-right', href: '#', onClick: function onClick(e) {
                return _this2.props.onCancel(e);
              } },
            'Cancel'
          )
        );
      }
    }]);

    return ListEdit;
  }(React.Component);

  var _createClass$b = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$b(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$b(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$b(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var ListCreate = function (_React$Component) {
    _inherits$b(ListCreate, _React$Component);

    function ListCreate(props) {
      _classCallCheck$b(this, ListCreate);

      var _this = _possibleConstructorReturn$b(this, (ListCreate.__proto__ || Object.getPrototypeOf(ListCreate)).call(this, props));

      _this.onSubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        var formData = new window.FormData(form);
        var name = formData.get('name').trim();
        var title = formData.get('title').trim();
        var type = formData.get('type');
        var data = _this.props.data;


        var copy = clone(data);

        // Items
        var texts = formData.getAll('text').map(function (t) {
          return t.trim();
        });
        var values = formData.getAll('value').map(function (t) {
          return t.trim();
        });
        var items = texts.map(function (t, i) {
          return { text: t, value: values[i] };
        });

        copy.lists.push({ name: name, title: title, type: type, items: items });

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onCreate({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      };

      _this.onBlurName = function (e) {
        var input = e.target;
        var data = _this.props.data;

        var newName = input.value.trim();

        // Validate it is unique
        if (data.lists.find(function (l) {
          return l.name === newName;
        })) {
          input.setCustomValidity('List \'' + newName + '\' already exists');
        } else {
          input.setCustomValidity('');
        }
      };

      _this.state = {
        type: props.type
      };
      return _this;
    }

    _createClass$b(ListCreate, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var state = this.state;

        return React.createElement(
          'form',
          { onSubmit: function onSubmit(e) {
              return _this2.onSubmit(e);
            }, autoComplete: 'off' },
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'list-name' },
              'Name'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'list-name', name: 'name',
              type: 'text', required: true, pattern: '^\\S+',
              onBlur: this.onBlurName })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'list-title' },
              'Title'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'list-title', name: 'title',
              type: 'text', required: true })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'list-type' },
              'Value type'
            ),
            React.createElement(
              'select',
              { className: 'govuk-select', id: 'list-type', name: 'type',
                value: state.type,
                onChange: function onChange(e) {
                  return _this2.setState({ type: e.target.value });
                } },
              React.createElement(
                'option',
                { value: 'string' },
                'String'
              ),
              React.createElement(
                'option',
                { value: 'number' },
                'Number'
              )
            )
          ),
          React.createElement(ListItems, { type: state.type }),
          React.createElement(
            'a',
            { className: 'pull-right', href: '#', onClick: function onClick(e) {
                return _this2.props.onCancel(e);
              } },
            'Cancel'
          ),
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'submit' },
            'Save'
          )
        );
      }
    }]);

    return ListCreate;
  }(React.Component);

  var _createClass$c = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$c(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$c(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$c(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var ListsEdit = function (_React$Component) {
    _inherits$c(ListsEdit, _React$Component);

    function ListsEdit() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$c(this, ListsEdit);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$c(this, (_ref = ListsEdit.__proto__ || Object.getPrototypeOf(ListsEdit)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.onClickList = function (e, list) {
        e.preventDefault();

        _this.setState({
          list: list
        });
      }, _this.onClickAddList = function (e, list) {
        e.preventDefault();

        _this.setState({
          showAddList: true
        });
      }, _temp), _possibleConstructorReturn$c(_this, _ret);
    }

    _createClass$c(ListsEdit, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var data = this.props.data;
        var lists = data.lists;

        var list = this.state.list;

        return React.createElement(
          'div',
          { className: 'govuk-body' },
          !list ? React.createElement(
            'div',
            null,
            this.state.showAddList ? React.createElement(ListCreate, { data: data,
              onCreate: function onCreate(e) {
                return _this2.setState({ showAddList: false });
              },
              onCancel: function onCancel(e) {
                return _this2.setState({ showAddList: false });
              } }) : React.createElement(
              'ul',
              { className: 'govuk-list' },
              lists.map(function (list, index) {
                return React.createElement(
                  'li',
                  { key: list.name },
                  React.createElement(
                    'a',
                    { href: '#', onClick: function onClick(e) {
                        return _this2.onClickList(e, list);
                      } },
                    list.title
                  )
                );
              }),
              React.createElement(
                'li',
                null,
                React.createElement('hr', null),
                React.createElement(
                  'a',
                  { href: '#', onClick: function onClick(e) {
                      return _this2.onClickAddList(e);
                    } },
                  'Add list'
                )
              )
            )
          ) : React.createElement(ListEdit, { list: list, data: data,
            onEdit: function onEdit(e) {
              return _this2.setState({ list: null });
            },
            onCancel: function onCancel(e) {
              return _this2.setState({ list: null });
            } })
        );
      }
    }]);

    return ListsEdit;
  }(React.Component);

  var _createClass$d = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$d(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$d(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$d(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var SectionEdit = function (_React$Component) {
    _inherits$d(SectionEdit, _React$Component);

    function SectionEdit() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$d(this, SectionEdit);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$d(this, (_ref = SectionEdit.__proto__ || Object.getPrototypeOf(SectionEdit)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.onSubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        var formData = new window.FormData(form);
        var newName = formData.get('name').trim();
        var newTitle = formData.get('title').trim();
        var _this$props = _this.props,
            data = _this$props.data,
            section = _this$props.section;


        var copy = clone(data);
        var nameChanged = newName !== section.name;
        var copySection = copy.sections[data.sections.indexOf(section)];

        if (nameChanged) {
          copySection.name = newName;

          // Update any references to the section
          copy.pages.forEach(function (p) {
            if (p.section === section.name) {
              p.section = newName;
            }
          });
        }

        copySection.title = newTitle;

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onEdit({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      }, _this.onClickDelete = function (e) {
        e.preventDefault();

        if (!window.confirm('Confirm delete')) {
          return;
        }

        var _this$props2 = _this.props,
            data = _this$props2.data,
            section = _this$props2.section;

        var copy = clone(data);

        // Remove the section
        copy.sections.splice(data.sections.indexOf(section), 1);

        // Update any references to the section
        copy.pages.forEach(function (p) {
          if (p.section === section.name) {
            delete p.section;
          }
        });

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onEdit({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      }, _this.onBlurName = function (e) {
        var input = e.target;
        var _this$props3 = _this.props,
            data = _this$props3.data,
            section = _this$props3.section;

        var newName = input.value.trim();

        // Validate it is unique
        if (data.sections.find(function (s) {
          return s !== section && s.name === newName;
        })) {
          input.setCustomValidity('Name \'' + newName + '\' already exists');
        } else {
          input.setCustomValidity('');
        }
      }, _temp), _possibleConstructorReturn$d(_this, _ret);
    }

    _createClass$d(SectionEdit, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var section = this.props.section;


        return React.createElement(
          'form',
          { onSubmit: function onSubmit(e) {
              return _this2.onSubmit(e);
            }, autoComplete: 'off' },
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'section-name' },
              'Name'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'section-name', name: 'name',
              type: 'text', defaultValue: section.name, required: true, pattern: '^\\S+',
              onBlur: this.onBlurName })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'section-title' },
              'Title'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'section-title', name: 'title',
              type: 'text', defaultValue: section.title, required: true })
          ),
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'submit' },
            'Save'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'button', onClick: this.onClickDelete },
            'Delete'
          ),
          React.createElement(
            'a',
            { className: 'pull-right', href: '#', onClick: function onClick(e) {
                return _this2.props.onCancel(e);
              } },
            'Cancel'
          )
        );
      }
    }]);

    return SectionEdit;
  }(React.Component);

  var _createClass$e = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$e(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$e(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$e(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var SectionCreate = function (_React$Component) {
    _inherits$e(SectionCreate, _React$Component);

    function SectionCreate() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$e(this, SectionCreate);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$e(this, (_ref = SectionCreate.__proto__ || Object.getPrototypeOf(SectionCreate)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.onSubmit = function (e) {
        e.preventDefault();
        var form = e.target;
        var formData = new window.FormData(form);
        var name = formData.get('name').trim();
        var title = formData.get('title').trim();
        var data = _this.props.data;

        var copy = clone(data);

        var section = { name: name, title: title };
        copy.sections.push(section);

        data.save(copy).then(function (data) {
          console.log(data);
          _this.props.onCreate({ data: data });
        }).catch(function (err) {
          console.error(err);
        });
      }, _this.onBlurName = function (e) {
        var input = e.target;
        var data = _this.props.data;

        var newName = input.value.trim();

        // Validate it is unique
        if (data.sections.find(function (s) {
          return s.name === newName;
        })) {
          input.setCustomValidity('Name \'' + newName + '\' already exists');
        } else {
          input.setCustomValidity('');
        }
      }, _temp), _possibleConstructorReturn$e(_this, _ret);
    }

    _createClass$e(SectionCreate, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        return React.createElement(
          'form',
          { onSubmit: function onSubmit(e) {
              return _this2.onSubmit(e);
            }, autoComplete: 'off' },
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'section-name' },
              'Name'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'section-name', name: 'name',
              type: 'text', required: true, pattern: '^\\S+',
              onBlur: this.onBlurName })
          ),
          React.createElement(
            'div',
            { className: 'govuk-form-group' },
            React.createElement(
              'label',
              { className: 'govuk-label govuk-label--s', htmlFor: 'section-title' },
              'Title'
            ),
            React.createElement('input', { className: 'govuk-input', id: 'section-title', name: 'title',
              type: 'text', required: true })
          ),
          React.createElement(
            'button',
            { className: 'govuk-button', type: 'submit' },
            'Save'
          ),
          React.createElement(
            'a',
            { className: 'pull-right', href: '#', onClick: function onClick(e) {
                return _this2.props.onCancel(e);
              } },
            'Cancel'
          )
        );
      }
    }]);

    return SectionCreate;
  }(React.Component);

  var _createClass$f = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$f(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$f(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$f(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  var SectionsEdit = function (_React$Component) {
    _inherits$f(SectionsEdit, _React$Component);

    function SectionsEdit() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$f(this, SectionsEdit);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$f(this, (_ref = SectionsEdit.__proto__ || Object.getPrototypeOf(SectionsEdit)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.onClickSection = function (e, section) {
        e.preventDefault();

        _this.setState({
          section: section
        });
      }, _this.onClickAddSection = function (e, section) {
        e.preventDefault();

        _this.setState({
          showAddSection: true
        });
      }, _temp), _possibleConstructorReturn$f(_this, _ret);
    }

    _createClass$f(SectionsEdit, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var data = this.props.data;
        var sections = data.sections;

        var section = this.state.section;

        return React.createElement(
          'div',
          { className: 'govuk-body' },
          !section ? React.createElement(
            'div',
            null,
            this.state.showAddSection ? React.createElement(SectionCreate, { data: data,
              onCreate: function onCreate(e) {
                return _this2.setState({ showAddSection: false });
              },
              onCancel: function onCancel(e) {
                return _this2.setState({ showAddSection: false });
              } }) : React.createElement(
              'ul',
              { className: 'govuk-list' },
              sections.map(function (section, index) {
                return React.createElement(
                  'li',
                  { key: section.name },
                  React.createElement(
                    'a',
                    { href: '#', onClick: function onClick(e) {
                        return _this2.onClickSection(e, section);
                      } },
                    section.title
                  )
                );
              }),
              React.createElement(
                'li',
                null,
                React.createElement('hr', null),
                React.createElement(
                  'a',
                  { href: '#', onClick: function onClick(e) {
                      return _this2.onClickAddSection(e);
                    } },
                  'Add section'
                )
              )
            )
          ) : React.createElement(SectionEdit, { section: section, data: data,
            onEdit: function onEdit(e) {
              return _this2.setState({ section: null });
            },
            onCancel: function onCancel(e) {
              return _this2.setState({ section: null });
            } })
        );
      }
    }]);

    return SectionsEdit;
  }(React.Component);

  var _createClass$g = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

  function _classCallCheck$g(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn$g(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits$g(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function getLayout(data, el) {
    // Create a new directed graph
    var g = new dagre.graphlib.Graph();

    // Set an object for the graph label
    g.setGraph({
      rankdir: 'LR',
      marginx: 50,
      marginy: 150,
      ranksep: 160
    });

    // Default to assigning a new object as a label for each new edge.
    g.setDefaultEdgeLabel(function () {
      return {};
    });

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each node
    data.pages.forEach(function (page, index) {
      var pageEl = el.children[index];

      g.setNode(page.path, { label: page.path, width: pageEl.offsetWidth, height: pageEl.offsetHeight });
    });

    // Add edges to the graph.
    data.pages.forEach(function (page) {
      if (Array.isArray(page.next)) {
        page.next.forEach(function (next) {
          g.setEdge(page.path, next.path);
        });
      }
    });

    dagre.layout(g);

    var pos = {
      nodes: [],
      edges: []
    };

    var output = g.graph();
    pos.width = output.width + 'px';
    pos.height = output.height + 'px';
    g.nodes().forEach(function (v, index) {
      var node = g.node(v);
      var pt = { node: node };
      pt.top = node.y - node.height / 2 + 'px';
      pt.left = node.x - node.width / 2 + 'px';
      pos.nodes.push(pt);
    });

    g.edges().forEach(function (e, index) {
      var edge = g.edge(e);
      pos.edges.push({
        source: e.v,
        target: e.w,
        points: edge.points.map(function (p) {
          var pt = {};
          pt.y = p.y;
          pt.x = p.x;
          return pt;
        })
      });
    });

    return { g: g, pos: pos };
  }

  var Lines = function (_React$Component) {
    _inherits$g(Lines, _React$Component);

    function Lines() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck$g(this, Lines);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn$g(this, (_ref = Lines.__proto__ || Object.getPrototypeOf(Lines)).call.apply(_ref, [this].concat(args))), _this), _this.state = {}, _this.editLink = function (edge) {
        console.log('clicked', edge);
        _this.setState({
          showEditor: edge
        });
      }, _temp), _possibleConstructorReturn$g(_this, _ret);
    }

    _createClass$g(Lines, [{
      key: 'render',
      value: function render() {
        var _this2 = this;

        var _props = this.props,
            layout = _props.layout,
            data = _props.data;


        return React.createElement(
          'div',
          null,
          React.createElement(
            'svg',
            { height: layout.height, width: layout.width },
            layout.edges.map(function (edge) {
              var points = edge.points.map(function (points) {
                return points.x + ',' + points.y;
              }).join(' ');
              return React.createElement(
                'g',
                { key: points },
                React.createElement('polyline', {
                  onClick: function onClick() {
                    return _this2.editLink(edge);
                  },
                  points: points })
              );
            })
          ),
          React.createElement(
            Flyout,
            { title: 'Edit Link', show: this.state.showEditor,
              onHide: function onHide(e) {
                return _this2.setState({ showEditor: false });
              } },
            React.createElement(LinkEdit, { edge: this.state.showEditor, data: data,
              onEdit: function onEdit(e) {
                return _this2.setState({ showEditor: false });
              } })
          )
        );
      }
    }]);

    return Lines;
  }(React.Component);

  var Minimap = function (_React$Component2) {
    _inherits$g(Minimap, _React$Component2);

    function Minimap() {
      var _ref2;

      var _temp2, _this3, _ret2;

      _classCallCheck$g(this, Minimap);

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return _ret2 = (_temp2 = (_this3 = _possibleConstructorReturn$g(this, (_ref2 = Minimap.__proto__ || Object.getPrototypeOf(Minimap)).call.apply(_ref2, [this].concat(args))), _this3), _this3.state = {}, _this3.onClickPage = function (e) {}, _temp2), _possibleConstructorReturn$g(_this3, _ret2);
    }

    _createClass$g(Minimap, [{
      key: 'render',
      value: function render() {
        var _this4 = this;

        var _props2 = this.props,
            layout = _props2.layout,
            data = _props2.data,
            _props2$scale = _props2.scale,
            scale = _props2$scale === undefined ? 0.05 : _props2$scale;


        return React.createElement(
          'div',
          { className: 'minimap' },
          React.createElement(
            'svg',
            { height: parseFloat(layout.height) * scale, width: parseFloat(layout.width) * scale },
            layout.edges.map(function (edge) {
              var points = edge.points.map(function (points) {
                return points.x * scale + ',' + points.y * scale;
              }).join(' ');
              return React.createElement(
                'g',
                { key: points },
                React.createElement('polyline', { points: points })
              );
            }),
            layout.nodes.map(function (node, index) {
              return React.createElement(
                'g',
                { key: node + index },
                React.createElement(
                  'a',
                  { xlinkHref: '#' + node.node.label },
                  React.createElement('rect', { x: parseFloat(node.left) * scale,
                    y: parseFloat(node.top) * scale,
                    width: node.node.width * scale,
                    height: node.node.height * scale,
                    title: node.node.label,
                    onClick: _this4.onClickPage })
                )
              );
            })
          )
        );
      }
    }]);

    return Minimap;
  }(React.Component);

  var Visualisation = function (_React$Component3) {
    _inherits$g(Visualisation, _React$Component3);

    function Visualisation() {
      _classCallCheck$g(this, Visualisation);

      var _this5 = _possibleConstructorReturn$g(this, (Visualisation.__proto__ || Object.getPrototypeOf(Visualisation)).call(this));

      _this5.state = {};

      _this5.ref = React.createRef();
      return _this5;
    }

    _createClass$g(Visualisation, [{
      key: 'scheduleLayout',
      value: function scheduleLayout() {
        var _this6 = this;

        setTimeout(function () {
          var layout = getLayout(_this6.props.data, _this6.ref.current);

          _this6.setState({
            layout: layout.pos
          });
        }, 200);
      }
    }, {
      key: 'componentDidMount',
      value: function componentDidMount() {
        this.scheduleLayout();
      }
    }, {
      key: 'componentWillReceiveProps',
      value: function componentWillReceiveProps() {
        this.scheduleLayout();
      }
    }, {
      key: 'render',
      value: function render() {
        var _this7 = this;

        var data = this.props.data;
        var pages = data.pages;


        return React.createElement(
          'div',
          { ref: this.ref, className: 'visualisation', style: this.state.layout && { width: this.state.layout.width, height: this.state.layout.height } },
          pages.map(function (page, index) {
            return React.createElement(Page, {
              key: index, data: data, page: page,
              layout: _this7.state.layout && _this7.state.layout.nodes[index] });
          }),
          this.state.layout && React.createElement(Lines, { layout: this.state.layout, data: data }),
          this.state.layout && React.createElement(Minimap, { layout: this.state.layout, data: data })
        );
      }
    }]);

    return Visualisation;
  }(React.Component);

  var Menu = function (_React$Component4) {
    _inherits$g(Menu, _React$Component4);

    function Menu() {
      var _ref3;

      var _temp3, _this8, _ret3;

      _classCallCheck$g(this, Menu);

      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return _ret3 = (_temp3 = (_this8 = _possibleConstructorReturn$g(this, (_ref3 = Menu.__proto__ || Object.getPrototypeOf(Menu)).call.apply(_ref3, [this].concat(args))), _this8), _this8.state = {}, _this8.onClickUpload = function (e) {
        e.preventDefault();
        document.getElementById('upload').click();
      }, _this8.onFileUpload = function (e) {
        var data = _this8.props.data;

        var file = e.target.files.item(0);
        var reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = function (evt) {
          var content = JSON.parse(evt.target.result);
          data.save(content);
        };
      }, _temp3), _possibleConstructorReturn$g(_this8, _ret3);
    }

    _createClass$g(Menu, [{
      key: 'render',
      value: function render() {
        var _this9 = this;

        var _props3 = this.props,
            data = _props3.data,
            playgroundMode = _props3.playgroundMode;


        return React.createElement(
          'div',
          { className: 'menu' },
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this9.setState({ showAddPage: true });
              } },
            'Add Page'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this9.setState({ showAddLink: true });
              } },
            'Add Link'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this9.setState({ showEditSections: true });
              } },
            'Edit Sections'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this9.setState({ showEditLists: true });
              } },
            'Edit Lists'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this9.setState({ showDataModel: true });
              } },
            'View Data Model'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this9.setState({ showJSONData: true });
              } },
            'View JSON'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this9.setState({ showSummary: true });
              } },
            'Summary'
          ),
          playgroundMode && React.createElement(
            'div',
            { className: 'govuk-!-margin-top-4' },
            React.createElement(
              'a',
              { className: 'govuk-link govuk-link--no-visited-state govuk-!-font-size-16', download: true, href: '/api/data?format=true' },
              'Download JSON'
            ),
            ' ',
            React.createElement(
              'a',
              { className: 'govuk-link govuk-link--no-visited-state govuk-!-font-size-16', href: '#', onClick: this.onClickUpload },
              'Upload JSON'
            ),
            ' ',
            React.createElement('input', { type: 'file', id: 'upload', hidden: true, onChange: this.onFileUpload })
          ),
          React.createElement(
            Flyout,
            { title: 'Add Page', show: this.state.showAddPage,
              onHide: function onHide() {
                return _this9.setState({ showAddPage: false });
              } },
            React.createElement(PageCreate, { data: data, onCreate: function onCreate() {
                return _this9.setState({ showAddPage: false });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Add Link', show: this.state.showAddLink,
              onHide: function onHide() {
                return _this9.setState({ showAddLink: false });
              } },
            React.createElement(LinkCreate, { data: data, onCreate: function onCreate() {
                return _this9.setState({ showAddLink: false });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Edit Sections', show: this.state.showEditSections,
              onHide: function onHide() {
                return _this9.setState({ showEditSections: false });
              } },
            React.createElement(SectionsEdit, { data: data, onCreate: function onCreate() {
                return _this9.setState({ showEditSections: false });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Edit Lists', show: this.state.showEditLists,
              onHide: function onHide() {
                return _this9.setState({ showEditLists: false });
              } },
            React.createElement(ListsEdit, { data: data, onCreate: function onCreate() {
                return _this9.setState({ showEditLists: false });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Data Model', show: this.state.showDataModel,
              onHide: function onHide() {
                return _this9.setState({ showDataModel: false });
              } },
            React.createElement(DataModel, { data: data })
          ),
          React.createElement(
            Flyout,
            { title: 'JSON Data', show: this.state.showJSONData,
              onHide: function onHide() {
                return _this9.setState({ showJSONData: false });
              } },
            React.createElement(
              'pre',
              null,
              JSON.stringify(data, null, 2)
            )
          ),
          React.createElement(
            Flyout,
            { title: 'Summary', show: this.state.showSummary,
              onHide: function onHide() {
                return _this9.setState({ showSummary: false });
              } },
            React.createElement(
              'pre',
              null,
              JSON.stringify(data.pages.map(function (page) {
                return page.path;
              }), null, 2)
            )
          )
        );
      }
    }]);

    return Menu;
  }(React.Component);

  var App = function (_React$Component5) {
    _inherits$g(App, _React$Component5);

    function App() {
      var _ref4;

      var _temp4, _this10, _ret4;

      _classCallCheck$g(this, App);

      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return _ret4 = (_temp4 = (_this10 = _possibleConstructorReturn$g(this, (_ref4 = App.__proto__ || Object.getPrototypeOf(App)).call.apply(_ref4, [this].concat(args))), _this10), _this10.state = {}, _this10.save = function (updatedData) {
        return window.fetch('/api/data', {
          method: 'put',
          body: JSON.stringify(updatedData)
        }).then(function (res) {
          if (!res.ok) {
            throw Error(res.statusText);
          }
          return res;
        }).then(function (res) {
          return res.json();
        }).then(function (data) {
          data.save = _this10.save;
          _this10.setState({ data: data });

          // Reload frame if split screen and in playground mode
          if (window.DFBD.playgroundMode) {
            var parent = window.parent;
            if (parent.location.pathname === '/split') {
              var frames = window.parent.frames;

              if (frames.length === 2) {
                var preview = window.parent.frames[1];
                preview.location.reload();
              }
            }
          }

          return data;
        }).catch(function (err) {
          console.error(err);
          window.alert('Save failed');
        });
      }, _temp4), _possibleConstructorReturn$g(_this10, _ret4);
    }

    _createClass$g(App, [{
      key: 'componentWillMount',
      value: function componentWillMount() {
        var _this11 = this;

        window.fetch('/api/data').then(function (res) {
          return res.json();
        }).then(function (data) {
          data.save = _this11.save;
          _this11.setState({ loaded: true, data: data });
        });
      }
    }, {
      key: 'render',
      value: function render() {
        if (this.state.loaded) {
          return React.createElement(
            'div',
            { id: 'app' },
            React.createElement(Menu, { data: this.state.data, playgroundMode: window.DFBD.playgroundMode }),
            React.createElement(Visualisation, { data: this.state.data })
          );
        } else {
          return React.createElement(
            'div',
            null,
            'Loading...'
          );
        }
      }
    }]);

    return App;
  }(React.Component);

  ReactDOM.render(React.createElement(App, null), document.getElementById('root'));

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzaWduZXIuanMiLCJzb3VyY2VzIjpbIi4uL2NsaWVudC9mbHlvdXQuanMiLCIuLi9jbGllbnQvaGVscGVycy5qcyIsIi4uL2NsaWVudC9wYWdlLWVkaXQuanMiLCIuLi9jb21wb25lbnQtdHlwZXMuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LXR5cGUtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LWNyZWF0ZS5qcyIsIi4uL2NsaWVudC9wYWdlLmpzIiwiLi4vY2xpZW50L2RhdGEtbW9kZWwuanMiLCIuLi9jbGllbnQvcGFnZS1jcmVhdGUuanMiLCIuLi9jbGllbnQvbGluay1lZGl0LmpzIiwiLi4vY2xpZW50L2xpbmstY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3QtaXRlbXMuanMiLCIuLi9jbGllbnQvbGlzdC1lZGl0LmpzIiwiLi4vY2xpZW50L2xpc3QtY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3RzLWVkaXQuanMiLCIuLi9jbGllbnQvc2VjdGlvbi1lZGl0LmpzIiwiLi4vY2xpZW50L3NlY3Rpb24tY3JlYXRlLmpzIiwiLi4vY2xpZW50L3NlY3Rpb25zLWVkaXQuanMiLCIuLi9jbGllbnQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5mdW5jdGlvbiBGbHlvdXQgKHByb3BzKSB7XG4gIGlmICghcHJvcHMuc2hvdykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPSdmbHlvdXQtbWVudSBzaG93Jz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdmbHlvdXQtbWVudS1jb250YWluZXInPlxuICAgICAgICA8YSB0aXRsZT0nQ2xvc2UnIGNsYXNzTmFtZT0nY2xvc2UgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgb25DbGljaz17ZSA9PiBwcm9wcy5vbkhpZGUoZSl9PkNsb3NlPC9hPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFuZWwnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1oZWFkZXIgZ292dWstIS1wYWRkaW5nLXRvcC00IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTQnPlxuICAgICAgICAgICAge3Byb3BzLnRpdGxlICYmIDxoNCBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctbSc+e3Byb3BzLnRpdGxlfTwvaDQ+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1ib2R5Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctbGVmdC00IGdvdnVrLSEtcGFkZGluZy1yaWdodC00IGdvdnVrLSEtcGFkZGluZy1ib3R0b20tNCc+XG4gICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZseW91dFxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1EYXRhIChmb3JtKSB7XG4gIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICBjb25zdCBkYXRhID0ge1xuICAgIG9wdGlvbnM6IHt9LFxuICAgIHNjaGVtYToge31cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhc3QgKG5hbWUsIHZhbCkge1xuICAgIGNvbnN0IGVsID0gZm9ybS5lbGVtZW50c1tuYW1lXVxuICAgIGNvbnN0IGNhc3QgPSBlbCAmJiBlbC5kYXRhc2V0LmNhc3RcblxuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGNhc3QgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gTnVtYmVyKHZhbClcbiAgICB9IGVsc2UgaWYgKGNhc3QgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHZhbCA9PT0gJ29uJ1xuICAgIH1cblxuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICBjb25zdCBvcHRpb25zUHJlZml4ID0gJ29wdGlvbnMuJ1xuICAgIGNvbnN0IHNjaGVtYVByZWZpeCA9ICdzY2hlbWEuJ1xuXG4gICAgdmFsdWUgPSB2YWx1ZS50cmltKClcblxuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG9wdGlvbnNQcmVmaXgpKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGAke29wdGlvbnNQcmVmaXh9cmVxdWlyZWRgICYmIHZhbHVlID09PSAnb24nKSB7XG4gICAgICAgICAgZGF0YS5vcHRpb25zLnJlcXVpcmVkID0gZmFsc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLm9wdGlvbnNba2V5LnN1YnN0cihvcHRpb25zUHJlZml4Lmxlbmd0aCldID0gY2FzdChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleS5zdGFydHNXaXRoKHNjaGVtYVByZWZpeCkpIHtcbiAgICAgICAgZGF0YS5zY2hlbWFba2V5LnN1YnN0cihzY2hlbWFQcmVmaXgubGVuZ3RoKV0gPSBjYXN0KGtleSwgdmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIENsZWFudXBcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLnNjaGVtYSkubGVuZ3RoKSBkZWxldGUgZGF0YS5zY2hlbWFcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLm9wdGlvbnMpLmxlbmd0aCkgZGVsZXRlIGRhdGEub3B0aW9uc1xuXG4gIHJldHVybiBkYXRhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZSAob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld1BhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBwYXRoQ2hhbmdlZCA9IG5ld1BhdGggIT09IHBhZ2UucGF0aFxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlc1tkYXRhLnBhZ2VzLmluZGV4T2YocGFnZSldXG5cbiAgICBpZiAocGF0aENoYW5nZWQpIHtcbiAgICAgIC8vIGBwYXRoYCBoYXMgY2hhbmdlZCAtIHZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgICAgaWYgKGRhdGEucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gbmV3UGF0aCkpIHtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke25ld1BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29weVBhZ2UucGF0aCA9IG5ld1BhdGhcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBwYWdlXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHAubmV4dCkpIHtcbiAgICAgICAgICBwLm5leHQuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgIGlmIChuLnBhdGggPT09IHBhZ2UucGF0aCkge1xuICAgICAgICAgICAgICBuLnBhdGggPSBuZXdQYXRoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIGNvcHlQYWdlLnRpdGxlID0gdGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlQYWdlLnRpdGxlXG4gICAgfVxuXG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIGNvcHlQYWdlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjb3B5UGFnZS5zZWN0aW9uXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2VJZHggPSBjb3B5LnBhZ2VzLmZpbmRJbmRleChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBsaW5rcyB0byB0aGUgcGFnZVxuICAgIGNvcHkucGFnZXMuZm9yRWFjaCgocCwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChpbmRleCAhPT0gY29weVBhZ2VJZHggJiYgQXJyYXkuaXNBcnJheShwLm5leHQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBwLm5leHQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gcC5uZXh0W2ldXG4gICAgICAgICAgaWYgKG5leHQucGF0aCA9PT0gcGFnZS5wYXRoKSB7XG4gICAgICAgICAgICBwLm5leHQuc3BsaWNlKGksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIFJlbW92ZSB0aGUgcGFnZSBpdHNlbGZcbiAgICBjb3B5LnBhZ2VzLnNwbGljZShjb3B5UGFnZUlkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIC8vIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3BhZ2UucGF0aH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGUudGFyZ2V0LnNldEN1c3RvbVZhbGlkaXR5KCcnKX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXRpdGxlJz5UaXRsZSAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0ncGFnZS10aXRsZS1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgSWYgbm90IHN1cHBsaWVkLCB0aGUgdGl0bGUgb2YgdGhlIGZpcnN0IHF1ZXN0aW9uIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17cGFnZS50aXRsZX0gYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJyBkZWZhdWx0VmFsdWU9e3BhZ2Uuc2VjdGlvbn0+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7c2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gKDxvcHRpb24ga2V5PXtzZWN0aW9uLm5hbWV9IHZhbHVlPXtzZWN0aW9uLm5hbWV9PntzZWN0aW9uLnRpdGxlfTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlRWRpdFxuIiwiY29uc3QgY29tcG9uZW50VHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAnVGV4dEZpZWxkJyxcbiAgICB0aXRsZTogJ1RleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdNdWx0aWxpbmVUZXh0RmllbGQnLFxuICAgIHRpdGxlOiAnTXVsdGlsaW5lIHRleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdZZXNOb0ZpZWxkJyxcbiAgICB0aXRsZTogJ1llcy9ObyBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVGaWVsZCcsXG4gICAgdGl0bGU6ICdEYXRlIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ1RpbWUgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgdGltZSBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVQYXJ0c0ZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgcGFydHMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZVBhcnRzRmllbGQnLFxuICAgIHRpdGxlOiAnRGF0ZSB0aW1lIHBhcnRzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnU2VsZWN0RmllbGQnLFxuICAgIHRpdGxlOiAnU2VsZWN0IGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUmFkaW9zRmllbGQnLFxuICAgIHRpdGxlOiAnUmFkaW9zIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQ2hlY2tib3hlc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0NoZWNrYm94ZXMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdOdW1iZXJGaWVsZCcsXG4gICAgdGl0bGU6ICdOdW1iZXIgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdVa0FkZHJlc3NGaWVsZCcsXG4gICAgdGl0bGU6ICdVayBhZGRyZXNzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGVsZXBob25lTnVtYmVyRmllbGQnLFxuICAgIHRpdGxlOiAnVGVsZXBob25lIG51bWJlciBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0VtYWlsQWRkcmVzc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0VtYWlsIGFkZHJlc3MgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdQYXJhJyxcbiAgICB0aXRsZTogJ1BhcmFncmFwaCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnSHRtbCcsXG4gICAgdGl0bGU6ICdIdG1sJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdJbnNldFRleHQnLFxuICAgIHRpdGxlOiAnSW5zZXQgdGV4dCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnRGV0YWlscycsXG4gICAgdGl0bGU6ICdEZXRhaWxzJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfVxuXVxuXG5leHBvcnQgZGVmYXVsdCBjb21wb25lbnRUeXBlc1xuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuXG5mdW5jdGlvbiBDbGFzc2VzIChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5jbGFzc2VzJz5DbGFzc2VzPC9sYWJlbD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+QWRkaXRpb25hbCBDU1MgY2xhc3NlcyB0byBhZGQgdG8gdGhlIGZpZWxkPGJyIC8+XG4gICAgICBFLmcuIGdvdnVrLWlucHV0LS13aWR0aC0yLCBnb3Z1ay1pbnB1dC0td2lkdGgtNCwgZ292dWstaW5wdXQtLXdpZHRoLTEwLCBnb3Z1ay0hLXdpZHRoLW9uZS1oYWxmLCBnb3Z1ay0hLXdpZHRoLXR3by10aGlyZHMsIGdvdnVrLSEtd2lkdGgtdGhyZWUtcXVhcnRlcnM8L3NwYW4+XG4gICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2ZpZWxkLW9wdGlvbnMuY2xhc3NlcycgbmFtZT0nb3B0aW9ucy5jbGFzc2VzJyB0eXBlPSd0ZXh0J1xuICAgICAgICBkZWZhdWx0VmFsdWU9e29wdGlvbnMuY2xhc3Nlc30gLz5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5mdW5jdGlvbiBGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTIwJyBpZD0nZmllbGQtbmFtZSdcbiAgICAgICAgICBuYW1lPSduYW1lJyB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5uYW1lfSByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKycgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2ZpZWxkLXRpdGxlJyBuYW1lPSd0aXRsZScgdHlwZT0ndGV4dCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1oaW50Jz5IaW50IChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2ZpZWxkLWhpbnQnIG5hbWU9J2hpbnQnIHR5cGU9J3RleHQnXG4gICAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQuaGludH0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlcyBnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2l0ZW0nPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2lucHV0JyBpZD0nZmllbGQtb3B0aW9ucy5yZXF1aXJlZCdcbiAgICAgICAgICAgIG5hbWU9J29wdGlvbnMucmVxdWlyZWQnIHR5cGU9J2NoZWNrYm94JyBkZWZhdWx0Q2hlY2tlZD17b3B0aW9ucy5yZXF1aXJlZCA9PT0gZmFsc2V9IC8+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstY2hlY2tib3hlc19fbGFiZWwnXG4gICAgICAgICAgICBodG1sRm9yPSdmaWVsZC1vcHRpb25zLnJlcXVpcmVkJz5PcHRpb25hbDwvbGFiZWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZXh0RmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgc2NoZW1hID0gY29tcG9uZW50LnNjaGVtYSB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGV0YWlscyBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHMnPlxuICAgICAgICA8c3VtbWFyeSBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnknPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeS10ZXh0Jz5tb3JlPC9zcGFuPlxuICAgICAgICA8L3N1bW1hcnk+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWF4Jz5NYXggbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWF4aW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1heCcgbmFtZT0nc2NoZW1hLm1heCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1heH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5taW4nPk1pbiBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtaW5pbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWluJyBuYW1lPSdzY2hlbWEubWluJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWlufSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLmxlbmd0aCc+TGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgZXhhY3QgdGV4dCBsZW5ndGg8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5sZW5ndGgnIG5hbWU9J3NjaGVtYS5sZW5ndGgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5sZW5ndGh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2RldGFpbHM+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gTXVsdGlsaW5lVGV4dEZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IHNjaGVtYSA9IGNvbXBvbmVudC5zY2hlbWEgfHwge31cbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkZXRhaWxzIGNsYXNzTmFtZT0nZ292dWstZGV0YWlscyc+XG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeSc+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5LXRleHQnPm1vcmU8L3NwYW4+XG4gICAgICAgIDwvc3VtbWFyeT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5tYXgnPk1heCBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtYXhpbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWF4JyBuYW1lPSdzY2hlbWEubWF4J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWF4fSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1pbic+TWluIGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1pbmltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5taW4nIG5hbWU9J3NjaGVtYS5taW4nXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5taW59IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1vcHRpb25zLnJvd3MnPlJvd3M8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBpZD0nZmllbGQtb3B0aW9ucy5yb3dzJyBuYW1lPSdvcHRpb25zLnJvd3MnIHR5cGU9J3RleHQnXG4gICAgICAgICAgICBkYXRhLWNhc3Q9J251bWJlcicgZGVmYXVsdFZhbHVlPXtvcHRpb25zLnJvd3N9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kZXRhaWxzPlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIE51bWJlckZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IHNjaGVtYSA9IGNvbXBvbmVudC5zY2hlbWEgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRldGFpbHMgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzJz5cbiAgICAgICAgPHN1bW1hcnkgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5Jz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnktdGV4dCc+bW9yZTwvc3Bhbj5cbiAgICAgICAgPC9zdW1tYXJ5PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1pbic+TWluPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWluaW11bSB2YWx1ZTwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1pbicgbmFtZT0nc2NoZW1hLm1pbidcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1pbn0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5tYXgnPk1heDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1heGltdW0gdmFsdWU8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5tYXgnIG5hbWU9J3NjaGVtYS5tYXgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5tYXh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXMgZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2l0ZW0nPlxuICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faW5wdXQnIGlkPSdmaWVsZC1zY2hlbWEuaW50ZWdlcicgZGF0YS1jYXN0PSdib29sZWFuJ1xuICAgICAgICAgICAgICBuYW1lPSdzY2hlbWEuaW50ZWdlcicgdHlwZT0nY2hlY2tib3gnIGRlZmF1bHRDaGVja2VkPXtzY2hlbWEuaW50ZWdlciA9PT0gdHJ1ZX0gLz5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWNoZWNrYm94ZXNfX2xhYmVsJ1xuICAgICAgICAgICAgICBodG1sRm9yPSdmaWVsZC1zY2hlbWEuaW50ZWdlcic+SW50ZWdlcjwvbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kZXRhaWxzPlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIFNlbGVjdEZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQsIGRhdGEgfSA9IHByb3BzXG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuICBjb25zdCBsaXN0cyA9IGRhdGEubGlzdHNcblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmxpc3QnPkxpc3Q8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QgZ292dWstaW5wdXQtLXdpZHRoLTEwJyBpZD0nZmllbGQtb3B0aW9ucy5saXN0JyBuYW1lPSdvcHRpb25zLmxpc3QnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e29wdGlvbnMubGlzdH0gcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7bGlzdHMubWFwKGxpc3QgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e2xpc3QubmFtZX0gdmFsdWU9e2xpc3QubmFtZX0+e2xpc3QudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBSYWRpb3NGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gQ2hlY2tib3hlc0ZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQsIGRhdGEgfSA9IHByb3BzXG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuICBjb25zdCBsaXN0cyA9IGRhdGEubGlzdHNcblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmxpc3QnPkxpc3Q8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QgZ292dWstaW5wdXQtLXdpZHRoLTEwJyBpZD0nZmllbGQtb3B0aW9ucy5saXN0JyBuYW1lPSdvcHRpb25zLmxpc3QnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e29wdGlvbnMubGlzdH0gcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7bGlzdHMubWFwKGxpc3QgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e2xpc3QubmFtZX0gdmFsdWU9e2xpc3QubmFtZX0+e2xpc3QudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBQYXJhRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCcgaHRtbEZvcj0ncGFyYS1jb250ZW50Jz5Db250ZW50PC9sYWJlbD5cbiAgICAgIDx0ZXh0YXJlYSBjbGFzc05hbWU9J2dvdnVrLXRleHRhcmVhJyBpZD0ncGFyYS1jb250ZW50JyBuYW1lPSdjb250ZW50J1xuICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5jb250ZW50fSByb3dzPScxMCcgcmVxdWlyZWQgLz5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5jb25zdCBJbnNldFRleHRFZGl0ID0gUGFyYUVkaXRcbmNvbnN0IEh0bWxFZGl0ID0gUGFyYUVkaXRcblxuZnVuY3Rpb24gRGV0YWlsc0VkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuXG4gIHJldHVybiAoXG4gICAgPGRpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCcgaHRtbEZvcj0nZGV0YWlscy10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2RldGFpbHMtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LnRpdGxlfSByZXF1aXJlZCAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J2RldGFpbHMtY29udGVudCc+Q29udGVudDwvbGFiZWw+XG4gICAgICAgIDx0ZXh0YXJlYSBjbGFzc05hbWU9J2dvdnVrLXRleHRhcmVhJyBpZD0nZGV0YWlscy1jb250ZW50JyBuYW1lPSdjb250ZW50J1xuICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LmNvbnRlbnR9IHJvd3M9JzEwJyByZXF1aXJlZCAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuY29uc3QgY29tcG9uZW50VHlwZUVkaXRvcnMgPSB7XG4gICdUZXh0RmllbGRFZGl0JzogVGV4dEZpZWxkRWRpdCxcbiAgJ0VtYWlsQWRkcmVzc0ZpZWxkRWRpdCc6IFRleHRGaWVsZEVkaXQsXG4gICdUZWxlcGhvbmVOdW1iZXJGaWVsZEVkaXQnOiBUZXh0RmllbGRFZGl0LFxuICAnTnVtYmVyRmllbGRFZGl0JzogTnVtYmVyRmllbGRFZGl0LFxuICAnTXVsdGlsaW5lVGV4dEZpZWxkRWRpdCc6IE11bHRpbGluZVRleHRGaWVsZEVkaXQsXG4gICdTZWxlY3RGaWVsZEVkaXQnOiBTZWxlY3RGaWVsZEVkaXQsXG4gICdSYWRpb3NGaWVsZEVkaXQnOiBSYWRpb3NGaWVsZEVkaXQsXG4gICdDaGVja2JveGVzRmllbGRFZGl0JzogQ2hlY2tib3hlc0ZpZWxkRWRpdCxcbiAgJ1BhcmFFZGl0JzogUGFyYUVkaXQsXG4gICdIdG1sRWRpdCc6IEh0bWxFZGl0LFxuICAnSW5zZXRUZXh0RWRpdCc6IEluc2V0VGV4dEVkaXQsXG4gICdEZXRhaWxzRWRpdCc6IERldGFpbHNFZGl0XG59XG5cbmNsYXNzIENvbXBvbmVudFR5cGVFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgdHlwZSA9IGNvbXBvbmVudFR5cGVzLmZpbmQodCA9PiB0Lm5hbWUgPT09IGNvbXBvbmVudC50eXBlKVxuICAgIGlmICghdHlwZSkge1xuICAgICAgcmV0dXJuICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IFRhZ05hbWUgPSBjb21wb25lbnRUeXBlRWRpdG9yc1tgJHtjb21wb25lbnQudHlwZX1FZGl0YF0gfHwgRmllbGRFZGl0XG4gICAgICByZXR1cm4gPFRhZ05hbWUgY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudFR5cGVFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lLCBnZXRGb3JtRGF0YSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBDb21wb25lbnRUeXBlRWRpdCBmcm9tICcuL2NvbXBvbmVudC10eXBlLWVkaXQnXG5cbmNsYXNzIENvbXBvbmVudEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGZvcm1EYXRhID0gZ2V0Rm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gQXBwbHlcbiAgICBjb25zdCBjb21wb25lbnRJbmRleCA9IHBhZ2UuY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudClcbiAgICBjb3B5UGFnZS5jb21wb25lbnRzW2NvbXBvbmVudEluZGV4XSA9IGZvcm1EYXRhXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlLCBjb21wb25lbnQgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb21wb25lbnRJZHggPSBwYWdlLmNvbXBvbmVudHMuZmluZEluZGV4KGMgPT4gYyA9PT0gY29tcG9uZW50KVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBpc0xhc3QgPSBjb21wb25lbnRJZHggPT09IHBhZ2UuY29tcG9uZW50cy5sZW5ndGggLSAxXG5cbiAgICAvLyBSZW1vdmUgdGhlIGNvbXBvbmVudFxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMuc3BsaWNlKGNvbXBvbmVudElkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIGlmICghaXNMYXN0KSB7XG4gICAgICAgICAgLy8gV2UgZG9udCBoYXZlIGFuIGlkIHdlIGNhbiB1c2UgZm9yIGBrZXlgLWluZyByZWFjdCA8Q29tcG9uZW50IC8+J3NcbiAgICAgICAgICAvLyBXZSB0aGVyZWZvcmUgbmVlZCB0byBjb25kaXRpb25hbGx5IHJlcG9ydCBgb25FZGl0YCBjaGFuZ2VzLlxuICAgICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBjb21wb25lbnQsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHlDb21wID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb21wb25lbnQpKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxmb3JtIGF1dG9Db21wbGV0ZT0nb2ZmJyBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSd0eXBlJz5UeXBlPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5Jz57Y29tcG9uZW50LnR5cGV9PC9zcGFuPlxuICAgICAgICAgICAgPGlucHV0IGlkPSd0eXBlJyB0eXBlPSdoaWRkZW4nIG5hbWU9J3R5cGUnIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LnR5cGV9IC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8Q29tcG9uZW50VHlwZUVkaXRcbiAgICAgICAgICAgIHBhZ2U9e3BhZ2V9XG4gICAgICAgICAgICBjb21wb25lbnQ9e2NvcHlDb21wfVxuICAgICAgICAgICAgZGF0YT17ZGF0YX0gLz5cblxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50RWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0IFNvcnRhYmxlSE9DICovXG5cbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgQ29tcG9uZW50RWRpdCBmcm9tICcuL2NvbXBvbmVudC1lZGl0J1xuY29uc3QgU29ydGFibGVIYW5kbGUgPSBTb3J0YWJsZUhPQy5Tb3J0YWJsZUhhbmRsZVxuY29uc3QgRHJhZ0hhbmRsZSA9IFNvcnRhYmxlSGFuZGxlKCgpID0+IDxzcGFuIGNsYXNzTmFtZT0nZHJhZy1oYW5kbGUnPiYjOTc3Njs8L3NwYW4+KVxuXG5leHBvcnQgY29uc3QgY29tcG9uZW50VHlwZXMgPSB7XG4gICdUZXh0RmllbGQnOiBUZXh0RmllbGQsXG4gICdUZWxlcGhvbmVOdW1iZXJGaWVsZCc6IFRlbGVwaG9uZU51bWJlckZpZWxkLFxuICAnTnVtYmVyRmllbGQnOiBOdW1iZXJGaWVsZCxcbiAgJ0VtYWlsQWRkcmVzc0ZpZWxkJzogRW1haWxBZGRyZXNzRmllbGQsXG4gICdUaW1lRmllbGQnOiBUaW1lRmllbGQsXG4gICdEYXRlRmllbGQnOiBEYXRlRmllbGQsXG4gICdEYXRlVGltZUZpZWxkJzogRGF0ZVRpbWVGaWVsZCxcbiAgJ0RhdGVQYXJ0c0ZpZWxkJzogRGF0ZVBhcnRzRmllbGQsXG4gICdEYXRlVGltZVBhcnRzRmllbGQnOiBEYXRlVGltZVBhcnRzRmllbGQsXG4gICdNdWx0aWxpbmVUZXh0RmllbGQnOiBNdWx0aWxpbmVUZXh0RmllbGQsXG4gICdSYWRpb3NGaWVsZCc6IFJhZGlvc0ZpZWxkLFxuICAnQ2hlY2tib3hlc0ZpZWxkJzogQ2hlY2tib3hlc0ZpZWxkLFxuICAnU2VsZWN0RmllbGQnOiBTZWxlY3RGaWVsZCxcbiAgJ1llc05vRmllbGQnOiBZZXNOb0ZpZWxkLFxuICAnVWtBZGRyZXNzRmllbGQnOiBVa0FkZHJlc3NGaWVsZCxcbiAgJ1BhcmEnOiBQYXJhLFxuICAnSHRtbCc6IEh0bWwsXG4gICdJbnNldFRleHQnOiBJbnNldFRleHQsXG4gICdEZXRhaWxzJzogRGV0YWlsc1xufVxuXG5mdW5jdGlvbiBCYXNlIChwcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxkaXY+XG4gICAgICB7cHJvcHMuY2hpbGRyZW59XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gQ29tcG9uZW50RmllbGQgKHByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICB7cHJvcHMuY2hpbGRyZW59XG4gICAgPC9CYXNlPlxuICApXG59XG5cbmZ1bmN0aW9uIFRleHRGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFRlbGVwaG9uZU51bWJlckZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94IHRlbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIEVtYWlsQWRkcmVzc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94IGVtYWlsJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gVWtBZGRyZXNzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94JyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdidXR0b24gc3F1YXJlJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gTXVsdGlsaW5lVGV4dEZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCB0YWxsJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gTnVtYmVyRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggbnVtYmVyJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZUZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94IGRyb3Bkb3duJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5IGdvdnVrLSEtZm9udC1zaXplLTE0Jz5kZC9tbS95eXl5PC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEYXRlVGltZUZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94IGxhcmdlIGRyb3Bkb3duJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5IGdvdnVrLSEtZm9udC1zaXplLTE0Jz5kZC9tbS95eXl5IGhoOm1tPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBUaW1lRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3gnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHkgZ292dWstIS1mb250LXNpemUtMTQnPmhoOm1tPC9zcGFuPlxuICAgICAgPC9kaXY+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEYXRlVGltZVBhcnRzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwgZ292dWstIS1tYXJnaW4tbGVmdC0xIGdvdnVrLSEtbWFyZ2luLXJpZ2h0LTEnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBtZWRpdW0gZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsIGdvdnVrLSEtbWFyZ2luLXJpZ2h0LTEnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVQYXJ0c0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCcgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsIGdvdnVrLSEtbWFyZ2luLWxlZnQtMSBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggbWVkaXVtJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gUmFkaW9zRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gQ2hlY2tib3hlc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NoZWNrJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2hlY2snIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaGVjaycgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFNlbGVjdEZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94IGRyb3Bkb3duJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gWWVzTm9GaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEZXRhaWxzICgpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIHtg4pa2IGB9PHNwYW4gY2xhc3NOYW1lPSdsaW5lIGRldGFpbHMnIC8+XG4gICAgPC9CYXNlPlxuICApXG59XG5cbmZ1bmN0aW9uIEluc2V0VGV4dCAoKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0naW5zZXQgZ292dWstIS1wYWRkaW5nLWxlZnQtMic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZSBzaG9ydCBnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMiBnb3Z1ay0hLW1hcmdpbi10b3AtMicgLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUnIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gUGFyYSAoKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lIHNob3J0IGdvdnVrLSEtbWFyZ2luLWJvdHRvbS0yIGdvdnVrLSEtbWFyZ2luLXRvcC0yJyAvPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUnIC8+XG4gICAgPC9CYXNlPlxuICApXG59XG5cbmZ1bmN0aW9uIEh0bWwgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2h0bWwnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgeHNob3J0IGdvdnVrLSEtbWFyZ2luLWJvdHRvbS0xIGdvdnVrLSEtbWFyZ2luLXRvcC0xJyAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9CYXNlPlxuICApXG59XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgc2hvd0VkaXRvciA9IChlLCB2YWx1ZSkgPT4ge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogdmFsdWUgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhLCBwYWdlLCBjb21wb25lbnQgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBUYWdOYW1lID0gY29tcG9uZW50VHlwZXNbYCR7Y29tcG9uZW50LnR5cGV9YF1cblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nY29tcG9uZW50IGdvdnVrLSEtcGFkZGluZy0yJ1xuICAgICAgICAgIG9uQ2xpY2s9eyhlKSA9PiB0aGlzLnNob3dFZGl0b3IoZSwgdHJ1ZSl9PlxuICAgICAgICAgIDxEcmFnSGFuZGxlIC8+XG4gICAgICAgICAgPFRhZ05hbWUgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgQ29tcG9uZW50JyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0b3J9XG4gICAgICAgICAgb25IaWRlPXtlID0+IHRoaXMuc2hvd0VkaXRvcihlLCBmYWxzZSl9PlxuICAgICAgICAgIDxDb21wb25lbnRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fSBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUsIGdldEZvcm1EYXRhIH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IENvbXBvbmVudFR5cGVFZGl0IGZyb20gJy4vY29tcG9uZW50LXR5cGUtZWRpdCdcbi8vIGltcG9ydCB7IGNvbXBvbmVudFR5cGVzIGFzIGNvbXBvbmVudFR5cGVzSWNvbnMgfSBmcm9tICcuL2NvbXBvbmVudCdcbmltcG9ydCBjb21wb25lbnRUeXBlcyBmcm9tICcuLi9jb21wb25lbnQtdHlwZXMuanMnXG5cbmNsYXNzIENvbXBvbmVudENyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgcGFnZSwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGZvcm1EYXRhID0gZ2V0Rm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gQXBwbHlcbiAgICBjb3B5UGFnZS5jb21wb25lbnRzLnB1c2goZm9ybURhdGEpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlKHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgcGFnZSwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0ndHlwZSc+VHlwZTwvbGFiZWw+XG4gICAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ndHlwZScgbmFtZT0ndHlwZScgcmVxdWlyZWRcbiAgICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IGNvbXBvbmVudDogeyB0eXBlOiBlLnRhcmdldC52YWx1ZSB9IH0pfT5cbiAgICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAgICB7Y29tcG9uZW50VHlwZXMubWFwKHR5cGUgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiA8b3B0aW9uIGtleT17dHlwZS5uYW1lfSB2YWx1ZT17dHlwZS5uYW1lfT57dHlwZS50aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgICAgIHsvKiB7T2JqZWN0LmtleXMoY29tcG9uZW50VHlwZXNJY29ucykubWFwKHR5cGUgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBUYWcgPSBjb21wb25lbnRUeXBlc0ljb25zW3R5cGVdXG4gICAgICAgICAgICAgIHJldHVybiA8ZGl2IGNsYXNzTmFtZT0nY29tcG9uZW50IGdvdnVrLSEtcGFkZGluZy0yJz48VGFnIC8+PC9kaXY+XG4gICAgICAgICAgICB9KX0gKi99XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7dGhpcy5zdGF0ZS5jb21wb25lbnQgJiYgdGhpcy5zdGF0ZS5jb21wb25lbnQudHlwZSAmJiAoXG4gICAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAgICA8Q29tcG9uZW50VHlwZUVkaXRcbiAgICAgICAgICAgICAgICBwYWdlPXtwYWdlfVxuICAgICAgICAgICAgICAgIGNvbXBvbmVudD17dGhpcy5zdGF0ZS5jb21wb25lbnR9XG4gICAgICAgICAgICAgICAgZGF0YT17ZGF0YX0gLz5cblxuICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9J3N1Ym1pdCcgY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nPlNhdmU8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICl9XG5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudENyZWF0ZVxuIiwiLyogZ2xvYmFsIFJlYWN0IFNvcnRhYmxlSE9DICovXG5cbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgUGFnZUVkaXQgZnJvbSAnLi9wYWdlLWVkaXQnXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudCdcbmltcG9ydCBDb21wb25lbnRDcmVhdGUgZnJvbSAnLi9jb21wb25lbnQtY3JlYXRlJ1xuaW1wb3J0IGNvbXBvbmVudFR5cGVzIGZyb20gJy4uL2NvbXBvbmVudC10eXBlcy5qcydcbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jb25zdCBTb3J0YWJsZUVsZW1lbnQgPSBTb3J0YWJsZUhPQy5Tb3J0YWJsZUVsZW1lbnRcbmNvbnN0IFNvcnRhYmxlQ29udGFpbmVyID0gU29ydGFibGVIT0MuU29ydGFibGVDb250YWluZXJcbmNvbnN0IGFycmF5TW92ZSA9IFNvcnRhYmxlSE9DLmFycmF5TW92ZVxuXG5jb25zdCBTb3J0YWJsZUl0ZW0gPSBTb3J0YWJsZUVsZW1lbnQoKHsgaW5kZXgsIHBhZ2UsIGNvbXBvbmVudCwgZGF0YSB9KSA9PlxuICA8ZGl2IGNsYXNzTmFtZT0nY29tcG9uZW50LWl0ZW0nPlxuICAgIDxDb21wb25lbnQga2V5PXtpbmRleH0gcGFnZT17cGFnZX0gY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gIDwvZGl2PlxuKVxuXG5jb25zdCBTb3J0YWJsZUxpc3QgPSBTb3J0YWJsZUNvbnRhaW5lcigoeyBwYWdlLCBkYXRhIH0pID0+IHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nY29tcG9uZW50LWxpc3QnPlxuICAgICAge3BhZ2UuY29tcG9uZW50cy5tYXAoKGNvbXBvbmVudCwgaW5kZXgpID0+IChcbiAgICAgICAgPFNvcnRhYmxlSXRlbSBrZXk9e2luZGV4fSBpbmRleD17aW5kZXh9IHBhZ2U9e3BhZ2V9IGNvbXBvbmVudD17Y29tcG9uZW50fSBkYXRhPXtkYXRhfSAvPlxuICAgICAgKSl9XG4gICAgPC9kaXY+XG4gIClcbn0pXG5cbmNsYXNzIFBhZ2UgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgc2hvd0VkaXRvciA9IChlLCB2YWx1ZSkgPT4ge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKClcbiAgICB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogdmFsdWUgfSlcbiAgfVxuXG4gIG9uU29ydEVuZCA9ICh7IG9sZEluZGV4LCBuZXdJbmRleCB9KSA9PiB7XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb3B5UGFnZS5jb21wb25lbnRzID0gYXJyYXlNb3ZlKGNvcHlQYWdlLmNvbXBvbmVudHMsIG9sZEluZGV4LCBuZXdJbmRleClcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuXG4gICAgLy8gT1BUSU1JU1RJQyBTQVZFIFRPIFNUT1AgSlVNUFxuXG4gICAgLy8gY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgLy8gcGFnZS5jb21wb25lbnRzID0gYXJyYXlNb3ZlKHBhZ2UuY29tcG9uZW50cywgb2xkSW5kZXgsIG5ld0luZGV4KVxuXG4gICAgLy8gZGF0YS5zYXZlKGRhdGEpXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgcGFnZSwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcbiAgICBjb25zdCBmb3JtQ29tcG9uZW50cyA9IHBhZ2UuY29tcG9uZW50cy5maWx0ZXIoY29tcCA9PiBjb21wb25lbnRUeXBlcy5maW5kKHR5cGUgPT4gdHlwZS5uYW1lID09PSBjb21wLnR5cGUpLnN1YlR5cGUgPT09ICdmaWVsZCcpXG4gICAgY29uc3QgcGFnZVRpdGxlID0gcGFnZS50aXRsZSB8fCAoZm9ybUNvbXBvbmVudHMubGVuZ3RoID09PSAxICYmIHBhZ2UuY29tcG9uZW50c1swXSA9PT0gZm9ybUNvbXBvbmVudHNbMF0gPyBmb3JtQ29tcG9uZW50c1swXS50aXRsZSA6IHBhZ2UudGl0bGUpXG4gICAgY29uc3Qgc2VjdGlvbiA9IHBhZ2Uuc2VjdGlvbiAmJiBzZWN0aW9ucy5maW5kKHNlY3Rpb24gPT4gc2VjdGlvbi5uYW1lID09PSBwYWdlLnNlY3Rpb24pXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD17cGFnZS5wYXRofSBjbGFzc05hbWU9J3BhZ2UgeHRvb2x0aXAnIHRpdGxlPXtwYWdlLnBhdGh9IHN0eWxlPXt0aGlzLnByb3BzLmxheW91dH0+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdoYW5kbGUnIG9uQ2xpY2s9eyhlKSA9PiB0aGlzLnNob3dFZGl0b3IoZSwgdHJ1ZSl9IC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctdG9wLTIgZ292dWstIS1wYWRkaW5nLWxlZnQtMiBnb3Z1ay0hLXBhZGRpbmctcmlnaHQtMic+XG5cbiAgICAgICAgICA8aDMgY2xhc3NOYW1lPSdnb3Z1ay1oZWFkaW5nLXMnPlxuICAgICAgICAgICAge3NlY3Rpb24gJiYgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1jYXB0aW9uLW0gZ292dWstIS1mb250LXNpemUtMTQnPntzZWN0aW9uLnRpdGxlfTwvc3Bhbj59XG4gICAgICAgICAgICB7cGFnZVRpdGxlfVxuICAgICAgICAgIDwvaDM+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxTb3J0YWJsZUxpc3QgcGFnZT17cGFnZX0gZGF0YT17ZGF0YX0gcHJlc3NEZWxheT17MjAwfVxuICAgICAgICAgIG9uU29ydEVuZD17dGhpcy5vblNvcnRFbmR9IGxvY2tBeGlzPSd5JyBoZWxwZXJDbGFzcz0nZHJhZ2dpbmcnXG4gICAgICAgICAgbG9ja1RvQ29udGFpbmVyRWRnZXMgdXNlRHJhZ0hhbmRsZSAvPlxuICAgICAgICB7Lyoge3BhZ2UuY29tcG9uZW50cy5tYXAoKGNvbXAsIGluZGV4KSA9PiAoXG4gICAgICAgICAgPENvbXBvbmVudCBrZXk9e2luZGV4fSBwYWdlPXtwYWdlfSBjb21wb25lbnQ9e2NvbXB9IGRhdGE9e2RhdGF9IC8+XG4gICAgICAgICkpfSAqL31cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1wYWRkaW5nLTInPlxuICAgICAgICAgIDxhIGNsYXNzTmFtZT0ncHJldmlldyBwdWxsLXJpZ2h0IGdvdnVrLWJvZHkgZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgICBocmVmPXtwYWdlLnBhdGh9IHRhcmdldD0ncHJldmlldyc+T3BlbjwvYT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nYnV0dG9uIGFjdGl2ZSdcbiAgICAgICAgICAgIG9uQ2xpY2s9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRDb21wb25lbnQ6IHRydWUgfSl9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgUGFnZScgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfVxuICAgICAgICAgIG9uSGlkZT17ZSA9PiB0aGlzLnNob3dFZGl0b3IoZSwgZmFsc2UpfT5cbiAgICAgICAgICA8UGFnZUVkaXQgcGFnZT17cGFnZX0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0FkZCBDb21wb25lbnQnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0FkZENvbXBvbmVudH1cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkQ29tcG9uZW50OiBmYWxzZSB9KX0+XG4gICAgICAgICAgPENvbXBvbmVudENyZWF0ZSBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25DcmVhdGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRDb21wb25lbnQ6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlXG4iLCJjb25zdCBsaXN0VHlwZXMgPSBbJ1NlbGVjdEZpZWxkJywgJ1JhZGlvc0ZpZWxkJywgJ0NoZWNrYm94ZXNGaWVsZCddXG5cbmZ1bmN0aW9uIGNvbXBvbmVudFRvU3RyaW5nIChjb21wb25lbnQpIHtcbiAgaWYgKH5saXN0VHlwZXMuaW5kZXhPZihjb21wb25lbnQudHlwZSkpIHtcbiAgICByZXR1cm4gYCR7Y29tcG9uZW50LnR5cGV9PCR7Y29tcG9uZW50Lm9wdGlvbnMubGlzdH0+YFxuICB9XG4gIHJldHVybiBgJHtjb21wb25lbnQudHlwZX1gXG59XG5cbmZ1bmN0aW9uIERhdGFNb2RlbCAocHJvcHMpIHtcbiAgY29uc3QgeyBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCB7IHNlY3Rpb25zLCBwYWdlcyB9ID0gZGF0YVxuXG4gIGNvbnN0IG1vZGVsID0ge31cblxuICBwYWdlcy5mb3JFYWNoKHBhZ2UgPT4ge1xuICAgIHBhZ2UuY29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICBpZiAoY29tcG9uZW50Lm5hbWUpIHtcbiAgICAgICAgaWYgKHBhZ2Uuc2VjdGlvbikge1xuICAgICAgICAgIGNvbnN0IHNlY3Rpb24gPSBzZWN0aW9ucy5maW5kKHNlY3Rpb24gPT4gc2VjdGlvbi5uYW1lID09PSBwYWdlLnNlY3Rpb24pXG4gICAgICAgICAgaWYgKCFtb2RlbFtzZWN0aW9uLm5hbWVdKSB7XG4gICAgICAgICAgICBtb2RlbFtzZWN0aW9uLm5hbWVdID0ge31cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBtb2RlbFtzZWN0aW9uLm5hbWVdW2NvbXBvbmVudC5uYW1lXSA9IGNvbXBvbmVudFRvU3RyaW5nKGNvbXBvbmVudClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtb2RlbFtjb21wb25lbnQubmFtZV0gPSBjb21wb25lbnRUb1N0cmluZyhjb21wb25lbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9KVxuXG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIDxwcmU+e0pTT04uc3RyaW5naWZ5KG1vZGVsLCBudWxsLCAyKX08L3ByZT5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5leHBvcnQgZGVmYXVsdCBEYXRhTW9kZWxcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIFBhZ2VDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBwYXRoID0gZm9ybURhdGEuZ2V0KCdwYXRoJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICAvLyBWYWxpZGF0ZVxuICAgIGlmIChkYXRhLnBhZ2VzLmZpbmQocGFnZSA9PiBwYWdlLnBhdGggPT09IHBhdGgpKSB7XG4gICAgICBmb3JtLmVsZW1lbnRzLnBhdGguc2V0Q3VzdG9tVmFsaWRpdHkoYFBhdGggJyR7cGF0aH0nIGFscmVhZHkgZXhpc3RzYClcbiAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgdmFsdWUgPSB7XG4gICAgICBwYXRoOiBwYXRoXG4gICAgfVxuXG4gICAgY29uc3QgdGl0bGUgPSBmb3JtRGF0YS5nZXQoJ3RpdGxlJykudHJpbSgpXG4gICAgY29uc3Qgc2VjdGlvbiA9IGZvcm1EYXRhLmdldCgnc2VjdGlvbicpLnRyaW0oKVxuXG4gICAgaWYgKHRpdGxlKSB7XG4gICAgICB2YWx1ZS50aXRsZSA9IHRpdGxlXG4gICAgfVxuICAgIGlmIChzZWN0aW9uKSB7XG4gICAgICB2YWx1ZS5zZWN0aW9uID0gc2VjdGlvblxuICAgIH1cblxuICAgIC8vIEFwcGx5XG4gICAgT2JqZWN0LmFzc2lnbih2YWx1ZSwge1xuICAgICAgY29tcG9uZW50czogW10sXG4gICAgICBuZXh0OiBbXVxuICAgIH0pXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIGNvcHkucGFnZXMucHVzaCh2YWx1ZSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyB2YWx1ZSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICAvLyBvbkJsdXJOYW1lID0gZSA9PiB7XG4gIC8vICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldFxuICAvLyAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAvLyAgIGNvbnN0IG5ld05hbWUgPSBpbnB1dC52YWx1ZS50cmltKClcblxuICAvLyAgIC8vIFZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAvLyAgIGlmIChkYXRhLmxpc3RzLmZpbmQobCA9PiBsLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gIC8vICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTGlzdCAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAvLyAgIH0gZWxzZSB7XG4gIC8vICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgLy8gICB9XG4gIC8vIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0ncGFnZS1wYXRoJz5QYXRoPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3BhZ2UtcGF0aCcgbmFtZT0ncGF0aCdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkXG4gICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBlLnRhcmdldC5zZXRDdXN0b21WYWxpZGl0eSgnJyl9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0ncGFnZS10aXRsZSc+VGl0bGUgKG9wdGlvbmFsKTwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gaWQ9J3BhZ2UtdGl0bGUtaGludCcgY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5cbiAgICAgICAgICAgIElmIG5vdCBzdXBwbGllZCwgdGhlIHRpdGxlIG9mIHRoZSBmaXJzdCBxdWVzdGlvbiB3aWxsIGJlIHVzZWQuXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0ncGFnZS10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBhcmlhLWRlc2NyaWJlZGJ5PSdwYWdlLXRpdGxlLWhpbnQnIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0ncGFnZS1zZWN0aW9uJz5TZWN0aW9uIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdwYWdlLXNlY3Rpb24nIG5hbWU9J3NlY3Rpb24nPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3NlY3Rpb25zLm1hcChzZWN0aW9uID0+ICg8b3B0aW9uIGtleT17c2VjdGlvbi5uYW1lfSB2YWx1ZT17c2VjdGlvbi5uYW1lfT57c2VjdGlvbi50aXRsZX08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGJ1dHRvbiB0eXBlPSdzdWJtaXQnIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBhZ2VDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIExpbmtFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IgKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG5cbiAgICBjb25zdCB7IGRhdGEsIGVkZ2UgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBwYWdlID0gZGF0YS5wYWdlcy5maW5kKHBhZ2UgPT4gcGFnZS5wYXRoID09PSBlZGdlLnNvdXJjZSlcbiAgICBjb25zdCBsaW5rID0gcGFnZS5uZXh0LmZpbmQobiA9PiBuLnBhdGggPT09IGVkZ2UudGFyZ2V0KVxuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIHBhZ2U6IHBhZ2UsXG4gICAgICBsaW5rOiBsaW5rXG4gICAgfVxuICB9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBjb25kaXRpb24gPSBmb3JtRGF0YS5nZXQoJ2lmJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBsaW5rLCBwYWdlIH0gPSB0aGlzLnN0YXRlXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuICAgIGNvbnN0IGNvcHlMaW5rID0gY29weVBhZ2UubmV4dC5maW5kKG4gPT4gbi5wYXRoID09PSBsaW5rLnBhdGgpXG5cbiAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICBjb3B5TGluay5pZiA9IGNvbmRpdGlvblxuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgY29weUxpbmsuaWZcbiAgICB9XG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBsaW5rLCBwYWdlIH0gPSB0aGlzLnN0YXRlXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuICAgIGNvbnN0IGNvcHlMaW5rSWR4ID0gY29weVBhZ2UubmV4dC5maW5kSW5kZXgobiA9PiBuLnBhdGggPT09IGxpbmsucGF0aClcbiAgICBjb3B5UGFnZS5uZXh0LnNwbGljZShjb3B5TGlua0lkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgbGluayB9ID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHsgZGF0YSwgZWRnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgcGFnZXMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay1zb3VyY2UnPkZyb208L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgZGVmYXVsdFZhbHVlPXtlZGdlLnNvdXJjZX0gY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaW5rLXNvdXJjZScgZGlzYWJsZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7cGFnZXMubWFwKHBhZ2UgPT4gKDxvcHRpb24ga2V5PXtwYWdlLnBhdGh9IHZhbHVlPXtwYWdlLnBhdGh9PntwYWdlLnBhdGh9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay10YXJnZXQnPlRvPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGRlZmF1bHRWYWx1ZT17ZWRnZS50YXJnZXR9IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGluay10YXJnZXQnIGRpc2FibGVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3BhZ2VzLm1hcChwYWdlID0+ICg8b3B0aW9uIGtleT17cGFnZS5wYXRofSB2YWx1ZT17cGFnZS5wYXRofT57cGFnZS5wYXRofTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstY29uZGl0aW9uJz5Db25kaXRpb24gKG9wdGlvbmFsKTwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gaWQ9J2xpbmstY29uZGl0aW9uLWhpbnQnIGNsYXNzTmFtZT0nZ292dWstaGludCc+XG4gICAgICAgICAgICBUaGUgbGluayB3aWxsIG9ubHkgYmUgdXNlZCBpZiB0aGUgZXhwcmVzc2lvbiBldmFsdWF0ZXMgdG8gdHJ1dGh5LlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpbmstY29uZGl0aW9uJyBuYW1lPSdpZidcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17bGluay5pZn0gYXJpYS1kZXNjcmliZWRieT0nbGluay1jb25kaXRpb24taGludCcgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaW5rRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgTGlua0NyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IGZyb20gPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKVxuICAgIGNvbnN0IHRvID0gZm9ybURhdGEuZ2V0KCdwYWdlJylcbiAgICBjb25zdCBjb25kaXRpb24gPSBmb3JtRGF0YS5nZXQoJ2lmJylcblxuICAgIC8vIEFwcGx5XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgcGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gZnJvbSlcblxuICAgIGNvbnN0IG5leHQgPSB7IHBhdGg6IHRvIH1cblxuICAgIGlmIChjb25kaXRpb24pIHtcbiAgICAgIG5leHQuaWYgPSBjb25kaXRpb25cbiAgICB9XG5cbiAgICBpZiAoIXBhZ2UubmV4dCkge1xuICAgICAgcGFnZS5uZXh0ID0gW11cbiAgICB9XG5cbiAgICBwYWdlLm5leHQucHVzaChuZXh0KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IG5leHQgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHBhZ2VzIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstc291cmNlJz5Gcm9tPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGluay1zb3VyY2UnIG5hbWU9J3BhdGgnIHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3BhZ2VzLm1hcChwYWdlID0+ICg8b3B0aW9uIGtleT17cGFnZS5wYXRofSB2YWx1ZT17cGFnZS5wYXRofT57cGFnZS5wYXRofTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstdGFyZ2V0Jz5UbzwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstdGFyZ2V0JyBuYW1lPSdwYWdlJyByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLWNvbmRpdGlvbic+Q29uZGl0aW9uIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdsaW5rLWNvbmRpdGlvbi1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgVGhlIGxpbmsgd2lsbCBvbmx5IGJlIHVzZWQgaWYgdGhlIGV4cHJlc3Npb24gZXZhbHVhdGVzIHRvIHRydXRoeS5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaW5rLWNvbmRpdGlvbicgbmFtZT0naWYnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBhcmlhLWRlc2NyaWJlZGJ5PSdsaW5rLWNvbmRpdGlvbi1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlua0NyZWF0ZVxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuZnVuY3Rpb24gaGVhZER1cGxpY2F0ZSAoYXJyKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgZm9yIChsZXQgaiA9IGkgKyAxOyBqIDwgYXJyLmxlbmd0aDsgaisrKSB7XG4gICAgICBpZiAoYXJyW2pdID09PSBhcnJbaV0pIHtcbiAgICAgICAgcmV0dXJuIGpcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuY2xhc3MgTGlzdEl0ZW1zIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IgKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIGl0ZW1zOiBwcm9wcy5pdGVtcyA/IGNsb25lKHByb3BzLml0ZW1zKSA6IFtdXG4gICAgfVxuICB9XG5cbiAgb25DbGlja0FkZEl0ZW0gPSBlID0+IHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGl0ZW1zOiB0aGlzLnN0YXRlLml0ZW1zLmNvbmNhdCh7IHRleHQ6ICcnLCB2YWx1ZTogJycgfSlcbiAgICB9KVxuICB9XG5cbiAgcmVtb3ZlSXRlbSA9IGlkeCA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5maWx0ZXIoKHMsIGkpID0+IGkgIT09IGlkeClcbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIGxpc3RcbiAgICBjb3B5Lmxpc3RzLnNwbGljZShkYXRhLmxpc3RzLmluZGV4T2YobGlzdCksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIGxpc3RcbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAubGlzdFxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyID0gZSA9PiB7XG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0LmZvcm1cbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcblxuICAgIC8vIE9ubHkgdmFsaWRhdGUgZHVwZXMgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBpdGVtXG4gICAgaWYgKHRleHRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGZvcm0uZWxlbWVudHMudGV4dC5mb3JFYWNoKGVsID0+IGVsLnNldEN1c3RvbVZhbGlkaXR5KCcnKSlcbiAgICBmb3JtLmVsZW1lbnRzLnZhbHVlLmZvckVhY2goZWwgPT4gZWwuc2V0Q3VzdG9tVmFsaWRpdHkoJycpKVxuXG4gICAgLy8gVmFsaWRhdGUgdW5pcXVlbmVzc1xuICAgIGNvbnN0IGR1cGVUZXh0ID0gaGVhZER1cGxpY2F0ZSh0ZXh0cylcbiAgICBpZiAoZHVwZVRleHQpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMudGV4dFtkdXBlVGV4dF0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB0ZXh0cyBmb3VuZCBpbiB0aGUgbGlzdCBpdGVtcycpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBkdXBlVmFsdWUgPSBoZWFkRHVwbGljYXRlKHZhbHVlcylcbiAgICBpZiAoZHVwZVZhbHVlKSB7XG4gICAgICBmb3JtLmVsZW1lbnRzLnZhbHVlW2R1cGVWYWx1ZV0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB2YWx1ZXMgZm91bmQgaW4gdGhlIGxpc3QgaXRlbXMnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBpdGVtcyB9ID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHsgdHlwZSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDx0YWJsZSBjbGFzc05hbWU9J2dvdnVrLXRhYmxlJz5cbiAgICAgICAgPGNhcHRpb24gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2FwdGlvbic+SXRlbXM8L2NhcHRpb24+XG4gICAgICAgIDx0aGVhZCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkJz5cbiAgICAgICAgICA8dHIgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93Jz5cbiAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkZXInIHNjb3BlPSdjb2wnPlRleHQ8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+VmFsdWU8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17dGhpcy5vbkNsaWNrQWRkSXRlbX0+QWRkPC9hPlxuICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICA8L3RoZWFkPlxuICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fYm9keSc+XG4gICAgICAgICAge2l0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IChcbiAgICAgICAgICAgIDx0ciBrZXk9e2l0ZW0udmFsdWUgKyBpbmRleH0gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93JyBzY29wZT0ncm93Jz5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBuYW1lPSd0ZXh0J1xuICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnRleHR9IHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyfSAvPlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAge3R5cGUgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICA/IChcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J3ZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9J251bWJlcicgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IHN0ZXA9J2FueScgLz5cbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIDogKFxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgbmFtZT0ndmFsdWUnXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IC8+XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCcgd2lkdGg9JzIwcHgnPlxuICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0nbGlzdC1pdGVtLWRlbGV0ZScgb25DbGljaz17KCkgPT4gdGhpcy5yZW1vdmVJdGVtKGluZGV4KX0+JiMxMjg0NjU7PC9hPlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICApKX1cbiAgICAgICAgPC90Ym9keT5cbiAgICAgIDwvdGFibGU+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RJdGVtc1xuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBMaXN0SXRlbXMgZnJvbSAnLi9saXN0LWl0ZW1zJ1xuXG5jbGFzcyBMaXN0RWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIHR5cGU6IHByb3BzLmxpc3QudHlwZVxuICAgIH1cbiAgfVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgbmV3TmFtZSA9IGZvcm1EYXRhLmdldCgnbmFtZScpLnRyaW0oKVxuICAgIGNvbnN0IG5ld1RpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IG5ld1R5cGUgPSBmb3JtRGF0YS5nZXQoJ3R5cGUnKVxuICAgIGNvbnN0IHsgZGF0YSwgbGlzdCB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgbmFtZUNoYW5nZWQgPSBuZXdOYW1lICE9PSBsaXN0Lm5hbWVcbiAgICBjb25zdCBjb3B5TGlzdCA9IGNvcHkubGlzdHNbZGF0YS5saXN0cy5pbmRleE9mKGxpc3QpXVxuXG4gICAgaWYgKG5hbWVDaGFuZ2VkKSB7XG4gICAgICBjb3B5TGlzdC5uYW1lID0gbmV3TmFtZVxuXG4gICAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIGxpc3RcbiAgICAgIGNvcHkucGFnZXMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgcC5jb21wb25lbnRzLmZvckVhY2goYyA9PiB7XG4gICAgICAgICAgaWYgKGMudHlwZSA9PT0gJ1NlbGVjdEZpZWxkJyB8fCBjLnR5cGUgPT09ICdSYWRpb3NGaWVsZCcpIHtcbiAgICAgICAgICAgIGlmIChjLm9wdGlvbnMgJiYgYy5vcHRpb25zLmxpc3QgPT09IGxpc3QubmFtZSkge1xuICAgICAgICAgICAgICBjLm9wdGlvbnMubGlzdCA9IG5ld05hbWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvcHlMaXN0LnRpdGxlID0gbmV3VGl0bGVcbiAgICBjb3B5TGlzdC50eXBlID0gbmV3VHlwZVxuXG4gICAgLy8gSXRlbXNcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb3B5TGlzdC5pdGVtcyA9IHRleHRzLm1hcCgodCwgaSkgPT4gKHsgdGV4dDogdCwgdmFsdWU6IHZhbHVlc1tpXSB9KSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkNsaWNrRGVsZXRlID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoIXdpbmRvdy5jb25maXJtKCdDb25maXJtIGRlbGV0ZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIC8vIFJlbW92ZSB0aGUgbGlzdFxuICAgIGNvcHkubGlzdHMuc3BsaWNlKGRhdGEubGlzdHMuaW5kZXhPZihsaXN0KSwgMSlcblxuICAgIC8vIFVwZGF0ZSBhbnkgcmVmZXJlbmNlcyB0byB0aGUgbGlzdFxuICAgIGNvcHkucGFnZXMuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwLmxpc3QgPT09IGxpc3QubmFtZSkge1xuICAgICAgICBkZWxldGUgcC5saXN0XG4gICAgICB9XG4gICAgfSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkJsdXJOYW1lID0gZSA9PiB7XG4gICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSwgbGlzdCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IG5ld05hbWUgPSBpbnB1dC52YWx1ZS50cmltKClcblxuICAgIC8vIFZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgIGlmIChkYXRhLmxpc3RzLmZpbmQobCA9PiBsICE9PSBsaXN0ICYmIGwubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBMaXN0ICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnN0YXRlXG4gICAgY29uc3QgeyBsaXN0IH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaXN0LW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaXN0LXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17bGlzdC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LXR5cGUnPlZhbHVlIHR5cGU8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaXN0LXR5cGUnIG5hbWU9J3R5cGUnXG4gICAgICAgICAgICB2YWx1ZT17c3RhdGUudHlwZX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyB0eXBlOiBlLnRhcmdldC52YWx1ZSB9KX0+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdzdHJpbmcnPlN0cmluZzwvb3B0aW9uPlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0nbnVtYmVyJz5OdW1iZXI8L29wdGlvbj5cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPExpc3RJdGVtcyBpdGVtcz17bGlzdC5pdGVtc30gdHlwZT17c3RhdGUudHlwZX0gLz5cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj57JyAnfVxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdidXR0b24nIG9uQ2xpY2s9e3RoaXMub25DbGlja0RlbGV0ZX0+RGVsZXRlPC9idXR0b24+XG4gICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLnByb3BzLm9uQ2FuY2VsKGUpfT5DYW5jZWw8L2E+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IExpc3RJdGVtcyBmcm9tICcuL2xpc3QtaXRlbXMnXG5cbmNsYXNzIExpc3RDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICB0eXBlOiBwcm9wcy50eXBlXG4gICAgfVxuICB9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBuYW1lID0gZm9ybURhdGEuZ2V0KCduYW1lJykudHJpbSgpXG4gICAgY29uc3QgdGl0bGUgPSBmb3JtRGF0YS5nZXQoJ3RpdGxlJykudHJpbSgpXG4gICAgY29uc3QgdHlwZSA9IGZvcm1EYXRhLmdldCgndHlwZScpXG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIC8vIEl0ZW1zXG4gICAgY29uc3QgdGV4dHMgPSBmb3JtRGF0YS5nZXRBbGwoJ3RleHQnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCB2YWx1ZXMgPSBmb3JtRGF0YS5nZXRBbGwoJ3ZhbHVlJykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29uc3QgaXRlbXMgPSB0ZXh0cy5tYXAoKHQsIGkpID0+ICh7IHRleHQ6IHQsIHZhbHVlOiB2YWx1ZXNbaV0gfSkpXG5cbiAgICBjb3B5Lmxpc3RzLnB1c2goeyBuYW1lLCB0aXRsZSwgdHlwZSwgaXRlbXMgfSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBMaXN0ICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnN0YXRlXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaXN0LW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKydcbiAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJOYW1lfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpc3QtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWQgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LXR5cGUnPlZhbHVlIHR5cGU8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaXN0LXR5cGUnIG5hbWU9J3R5cGUnXG4gICAgICAgICAgICB2YWx1ZT17c3RhdGUudHlwZX1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyB0eXBlOiBlLnRhcmdldC52YWx1ZSB9KX0+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdzdHJpbmcnPlN0cmluZzwvb3B0aW9uPlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0nbnVtYmVyJz5OdW1iZXI8L29wdGlvbj5cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPExpc3RJdGVtcyB0eXBlPXtzdGF0ZS50eXBlfSAvPlxuXG4gICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLnByb3BzLm9uQ2FuY2VsKGUpfT5DYW5jZWw8L2E+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0Q3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCBMaXN0RWRpdCBmcm9tICcuL2xpc3QtZWRpdCdcbmltcG9ydCBMaXN0Q3JlYXRlIGZyb20gJy4vbGlzdC1jcmVhdGUnXG5cbmNsYXNzIExpc3RzRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrTGlzdCA9IChlLCBsaXN0KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGxpc3Q6IGxpc3RcbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0FkZExpc3QgPSAoZSwgbGlzdCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzaG93QWRkTGlzdDogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGlzdHMgfSA9IGRhdGFcbiAgICBjb25zdCBsaXN0ID0gdGhpcy5zdGF0ZS5saXN0XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWJvZHknPlxuICAgICAgICB7IWxpc3QgPyAoXG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIHt0aGlzLnN0YXRlLnNob3dBZGRMaXN0ID8gKFxuICAgICAgICAgICAgICA8TGlzdENyZWF0ZSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgICAgIG9uQ3JlYXRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGlzdDogZmFsc2UgfSl9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaXN0OiBmYWxzZSB9KX0gLz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9J2dvdnVrLWxpc3QnPlxuICAgICAgICAgICAgICAgIHtsaXN0cy5tYXAoKGxpc3QsIGluZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8bGkga2V5PXtsaXN0Lm5hbWV9PlxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja0xpc3QoZSwgbGlzdCl9PlxuICAgICAgICAgICAgICAgICAgICAgIHtsaXN0LnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgIDxociAvPlxuICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tBZGRMaXN0KGUpfT5BZGQgbGlzdDwvYT5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8TGlzdEVkaXQgbGlzdD17bGlzdH0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgbGlzdDogbnVsbCB9KX1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBsaXN0OiBudWxsIH0pfSAvPlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RzRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgU2VjdGlvbkVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBuZXdOYW1lID0gZm9ybURhdGEuZ2V0KCduYW1lJykudHJpbSgpXG4gICAgY29uc3QgbmV3VGl0bGUgPSBmb3JtRGF0YS5nZXQoJ3RpdGxlJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBuYW1lQ2hhbmdlZCA9IG5ld05hbWUgIT09IHNlY3Rpb24ubmFtZVxuICAgIGNvbnN0IGNvcHlTZWN0aW9uID0gY29weS5zZWN0aW9uc1tkYXRhLnNlY3Rpb25zLmluZGV4T2Yoc2VjdGlvbildXG5cbiAgICBpZiAobmFtZUNoYW5nZWQpIHtcbiAgICAgIGNvcHlTZWN0aW9uLm5hbWUgPSBuZXdOYW1lXG5cbiAgICAgIC8vIFVwZGF0ZSBhbnkgcmVmZXJlbmNlcyB0byB0aGUgc2VjdGlvblxuICAgICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICBpZiAocC5zZWN0aW9uID09PSBzZWN0aW9uLm5hbWUpIHtcbiAgICAgICAgICBwLnNlY3Rpb24gPSBuZXdOYW1lXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29weVNlY3Rpb24udGl0bGUgPSBuZXdUaXRsZVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBzZWN0aW9uXG4gICAgY29weS5zZWN0aW9ucy5zcGxpY2UoZGF0YS5zZWN0aW9ucy5pbmRleE9mKHNlY3Rpb24pLCAxKVxuXG4gICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBzZWN0aW9uXG4gICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAuc2VjdGlvbiA9PT0gc2VjdGlvbi5uYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBwLnNlY3Rpb25cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhLCBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEuc2VjdGlvbnMuZmluZChzID0+IHMgIT09IHNlY3Rpb24gJiYgcy5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYE5hbWUgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nc2VjdGlvbi1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17c2VjdGlvbi5uYW1lfSByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKydcbiAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJOYW1lfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17c2VjdGlvbi50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2VjdGlvbkVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIFNlY3Rpb25DcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBuYW1lID0gZm9ybURhdGEuZ2V0KCduYW1lJykudHJpbSgpXG4gICAgY29uc3QgdGl0bGUgPSBmb3JtRGF0YS5nZXQoJ3RpdGxlJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICBjb25zdCBzZWN0aW9uID0geyBuYW1lLCB0aXRsZSB9XG4gICAgY29weS5zZWN0aW9ucy5wdXNoKHNlY3Rpb24pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlKHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkJsdXJOYW1lID0gZSA9PiB7XG4gICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IG5ld05hbWUgPSBpbnB1dC52YWx1ZS50cmltKClcblxuICAgIC8vIFZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgIGlmIChkYXRhLnNlY3Rpb25zLmZpbmQocyA9PiBzLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTmFtZSAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nc2VjdGlvbi1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWQgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCBTZWN0aW9uRWRpdCBmcm9tICcuL3NlY3Rpb24tZWRpdCdcbmltcG9ydCBTZWN0aW9uQ3JlYXRlIGZyb20gJy4vc2VjdGlvbi1jcmVhdGUnXG5cbmNsYXNzIFNlY3Rpb25zRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrU2VjdGlvbiA9IChlLCBzZWN0aW9uKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlY3Rpb246IHNlY3Rpb25cbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0FkZFNlY3Rpb24gPSAoZSwgc2VjdGlvbikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzaG93QWRkU2VjdGlvbjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5zdGF0ZS5zZWN0aW9uXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWJvZHknPlxuICAgICAgICB7IXNlY3Rpb24gPyAoXG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIHt0aGlzLnN0YXRlLnNob3dBZGRTZWN0aW9uID8gKFxuICAgICAgICAgICAgICA8U2VjdGlvbkNyZWF0ZSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgICAgIG9uQ3JlYXRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkU2VjdGlvbjogZmFsc2UgfSl9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRTZWN0aW9uOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9J2dvdnVrLWxpc3QnPlxuICAgICAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoKHNlY3Rpb24sIGluZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8bGkga2V5PXtzZWN0aW9uLm5hbWV9PlxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja1NlY3Rpb24oZSwgc2VjdGlvbil9PlxuICAgICAgICAgICAgICAgICAgICAgIHtzZWN0aW9uLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgIDxociAvPlxuICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tBZGRTZWN0aW9uKGUpfT5BZGQgc2VjdGlvbjwvYT5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8U2VjdGlvbkVkaXQgc2VjdGlvbj17c2VjdGlvbn0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2VjdGlvbjogbnVsbCB9KX1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzZWN0aW9uOiBudWxsIH0pfSAvPlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlY3Rpb25zRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0IFJlYWN0RE9NIGRhZ3JlICovXG5cbmltcG9ydCBQYWdlIGZyb20gJy4vcGFnZSdcbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgRGF0YU1vZGVsIGZyb20gJy4vZGF0YS1tb2RlbCdcbmltcG9ydCBQYWdlQ3JlYXRlIGZyb20gJy4vcGFnZS1jcmVhdGUnXG5pbXBvcnQgTGlua0VkaXQgZnJvbSAnLi9saW5rLWVkaXQnXG5pbXBvcnQgTGlua0NyZWF0ZSBmcm9tICcuL2xpbmstY3JlYXRlJ1xuaW1wb3J0IExpc3RzRWRpdCBmcm9tICcuL2xpc3RzLWVkaXQnXG5pbXBvcnQgU2VjdGlvbnNFZGl0IGZyb20gJy4vc2VjdGlvbnMtZWRpdCdcblxuZnVuY3Rpb24gZ2V0TGF5b3V0IChkYXRhLCBlbCkge1xuICAvLyBDcmVhdGUgYSBuZXcgZGlyZWN0ZWQgZ3JhcGhcbiAgdmFyIGcgPSBuZXcgZGFncmUuZ3JhcGhsaWIuR3JhcGgoKVxuXG4gIC8vIFNldCBhbiBvYmplY3QgZm9yIHRoZSBncmFwaCBsYWJlbFxuICBnLnNldEdyYXBoKHtcbiAgICByYW5rZGlyOiAnTFInLFxuICAgIG1hcmdpbng6IDUwLFxuICAgIG1hcmdpbnk6IDE1MCxcbiAgICByYW5rc2VwOiAxNjBcbiAgfSlcblxuICAvLyBEZWZhdWx0IHRvIGFzc2lnbmluZyBhIG5ldyBvYmplY3QgYXMgYSBsYWJlbCBmb3IgZWFjaCBuZXcgZWRnZS5cbiAgZy5zZXREZWZhdWx0RWRnZUxhYmVsKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHt9IH0pXG5cbiAgLy8gQWRkIG5vZGVzIHRvIHRoZSBncmFwaC4gVGhlIGZpcnN0IGFyZ3VtZW50IGlzIHRoZSBub2RlIGlkLiBUaGUgc2Vjb25kIGlzXG4gIC8vIG1ldGFkYXRhIGFib3V0IHRoZSBub2RlLiBJbiB0aGlzIGNhc2Ugd2UncmUgZ29pbmcgdG8gYWRkIGxhYmVscyB0byBlYWNoIG5vZGVcbiAgZGF0YS5wYWdlcy5mb3JFYWNoKChwYWdlLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IHBhZ2VFbCA9IGVsLmNoaWxkcmVuW2luZGV4XVxuXG4gICAgZy5zZXROb2RlKHBhZ2UucGF0aCwgeyBsYWJlbDogcGFnZS5wYXRoLCB3aWR0aDogcGFnZUVsLm9mZnNldFdpZHRoLCBoZWlnaHQ6IHBhZ2VFbC5vZmZzZXRIZWlnaHQgfSlcbiAgfSlcblxuICAvLyBBZGQgZWRnZXMgdG8gdGhlIGdyYXBoLlxuICBkYXRhLnBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFnZS5uZXh0KSkge1xuICAgICAgcGFnZS5uZXh0LmZvckVhY2gobmV4dCA9PiB7XG4gICAgICAgIGcuc2V0RWRnZShwYWdlLnBhdGgsIG5leHQucGF0aClcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIGRhZ3JlLmxheW91dChnKVxuXG4gIGNvbnN0IHBvcyA9IHtcbiAgICBub2RlczogW10sXG4gICAgZWRnZXM6IFtdXG4gIH1cblxuICBjb25zdCBvdXRwdXQgPSBnLmdyYXBoKClcbiAgcG9zLndpZHRoID0gb3V0cHV0LndpZHRoICsgJ3B4J1xuICBwb3MuaGVpZ2h0ID0gb3V0cHV0LmhlaWdodCArICdweCdcbiAgZy5ub2RlcygpLmZvckVhY2goKHYsIGluZGV4KSA9PiB7XG4gICAgY29uc3Qgbm9kZSA9IGcubm9kZSh2KVxuICAgIGNvbnN0IHB0ID0geyBub2RlIH1cbiAgICBwdC50b3AgPSAobm9kZS55IC0gbm9kZS5oZWlnaHQgLyAyKSArICdweCdcbiAgICBwdC5sZWZ0ID0gKG5vZGUueCAtIG5vZGUud2lkdGggLyAyKSArICdweCdcbiAgICBwb3Mubm9kZXMucHVzaChwdClcbiAgfSlcblxuICBnLmVkZ2VzKCkuZm9yRWFjaCgoZSwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBlZGdlID0gZy5lZGdlKGUpXG4gICAgcG9zLmVkZ2VzLnB1c2goe1xuICAgICAgc291cmNlOiBlLnYsXG4gICAgICB0YXJnZXQ6IGUudyxcbiAgICAgIHBvaW50czogZWRnZS5wb2ludHMubWFwKHAgPT4ge1xuICAgICAgICBjb25zdCBwdCA9IHt9XG4gICAgICAgIHB0LnkgPSBwLnlcbiAgICAgICAgcHQueCA9IHAueFxuICAgICAgICByZXR1cm4gcHRcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4geyBnLCBwb3MgfVxufVxuXG5jbGFzcyBMaW5lcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBlZGl0TGluayA9IChlZGdlKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ2NsaWNrZWQnLCBlZGdlKVxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2hvd0VkaXRvcjogZWRnZVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgbGF5b3V0LCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPHN2ZyBoZWlnaHQ9e2xheW91dC5oZWlnaHR9IHdpZHRoPXtsYXlvdXQud2lkdGh9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5lZGdlcy5tYXAoZWRnZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHBvaW50cyA9IGVkZ2UucG9pbnRzLm1hcChwb2ludHMgPT4gYCR7cG9pbnRzLnh9LCR7cG9pbnRzLnl9YCkuam9pbignICcpXG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGcga2V5PXtwb2ludHN9PlxuICAgICAgICAgICAgICAgICAgPHBvbHlsaW5lXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuZWRpdExpbmsoZWRnZSl9XG4gICAgICAgICAgICAgICAgICAgIHBvaW50cz17cG9pbnRzfSAvPlxuICAgICAgICAgICAgICAgIDwvZz5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIDwvc3ZnPlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgTGluaycgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfVxuICAgICAgICAgIG9uSGlkZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogZmFsc2UgfSl9PlxuICAgICAgICAgIDxMaW5rRWRpdCBlZGdlPXt0aGlzLnN0YXRlLnNob3dFZGl0b3J9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5jbGFzcyBNaW5pbWFwIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uQ2xpY2tQYWdlID0gKGUpID0+IHtcblxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxheW91dCwgZGF0YSwgc2NhbGUgPSAwLjA1IH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J21pbmltYXAnPlxuICAgICAgICA8c3ZnIGhlaWdodD17cGFyc2VGbG9hdChsYXlvdXQuaGVpZ2h0KSAqIHNjYWxlfSB3aWR0aD17cGFyc2VGbG9hdChsYXlvdXQud2lkdGgpICogc2NhbGV9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5lZGdlcy5tYXAoZWRnZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHBvaW50cyA9IGVkZ2UucG9pbnRzLm1hcChwb2ludHMgPT4gYCR7cG9pbnRzLnggKiBzY2FsZX0sJHtwb2ludHMueSAqIHNjYWxlfWApLmpvaW4oJyAnKVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxnIGtleT17cG9pbnRzfT5cbiAgICAgICAgICAgICAgICAgIDxwb2x5bGluZSBwb2ludHM9e3BvaW50c30gLz5cbiAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5ub2Rlcy5tYXAoKG5vZGUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGcga2V5PXtub2RlICsgaW5kZXh9PlxuICAgICAgICAgICAgICAgICAgPGEgeGxpbmtIcmVmPXtgIyR7bm9kZS5ub2RlLmxhYmVsfWB9PlxuICAgICAgICAgICAgICAgICAgICA8cmVjdCB4PXtwYXJzZUZsb2F0KG5vZGUubGVmdCkgKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICB5PXtwYXJzZUZsb2F0KG5vZGUudG9wKSAqIHNjYWxlfVxuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXtub2RlLm5vZGUud2lkdGggKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9e25vZGUubm9kZS5oZWlnaHQgKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bm9kZS5ub2RlLmxhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja1BhZ2V9IC8+XG4gICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgPC9nPlxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgPC9zdmc+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgVmlzdWFsaXNhdGlvbiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMucmVmID0gUmVhY3QuY3JlYXRlUmVmKClcbiAgfVxuXG4gIHNjaGVkdWxlTGF5b3V0ICgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGdldExheW91dCh0aGlzLnByb3BzLmRhdGEsIHRoaXMucmVmLmN1cnJlbnQpXG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBsYXlvdXQ6IGxheW91dC5wb3NcbiAgICAgIH0pXG4gICAgfSwgMjAwKVxuICB9XG5cbiAgY29tcG9uZW50RGlkTW91bnQgKCkge1xuICAgIHRoaXMuc2NoZWR1bGVMYXlvdXQoKVxuICB9XG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyAoKSB7XG4gICAgdGhpcy5zY2hlZHVsZUxheW91dCgpXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgcGFnZXMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHJlZj17dGhpcy5yZWZ9IGNsYXNzTmFtZT0ndmlzdWFsaXNhdGlvbicgc3R5bGU9e3RoaXMuc3RhdGUubGF5b3V0ICYmIHsgd2lkdGg6IHRoaXMuc3RhdGUubGF5b3V0LndpZHRoLCBoZWlnaHQ6IHRoaXMuc3RhdGUubGF5b3V0LmhlaWdodCB9fT5cbiAgICAgICAge3BhZ2VzLm1hcCgocGFnZSwgaW5kZXgpID0+IDxQYWdlXG4gICAgICAgICAga2V5PXtpbmRleH0gZGF0YT17ZGF0YX0gcGFnZT17cGFnZX1cbiAgICAgICAgICBsYXlvdXQ9e3RoaXMuc3RhdGUubGF5b3V0ICYmIHRoaXMuc3RhdGUubGF5b3V0Lm5vZGVzW2luZGV4XX0gLz5cbiAgICAgICAgKX1cbiAgICAgICAge3RoaXMuc3RhdGUubGF5b3V0ICYmIDxMaW5lcyBsYXlvdXQ9e3RoaXMuc3RhdGUubGF5b3V0fSBkYXRhPXtkYXRhfSAvPn1cbiAgICAgICAge3RoaXMuc3RhdGUubGF5b3V0ICYmIDxNaW5pbWFwIGxheW91dD17dGhpcy5zdGF0ZS5sYXlvdXR9IGRhdGE9e2RhdGF9IC8+fVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIE1lbnUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25DbGlja1VwbG9hZCA9IChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VwbG9hZCcpLmNsaWNrKClcbiAgfVxuXG4gIG9uRmlsZVVwbG9hZCA9IChlKSA9PiB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZmlsZSA9IGUudGFyZ2V0LmZpbGVzLml0ZW0oMClcbiAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc1RleHQoZmlsZSwgJ1VURi04JylcbiAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgY29uc3QgY29udGVudCA9IEpTT04ucGFyc2UoZXZ0LnRhcmdldC5yZXN1bHQpXG4gICAgICBkYXRhLnNhdmUoY29udGVudClcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGxheWdyb3VuZE1vZGUgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbWVudSc+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRQYWdlOiB0cnVlIH0pfT5BZGQgUGFnZTwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpbms6IHRydWUgfSl9PkFkZCBMaW5rPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdFNlY3Rpb25zOiB0cnVlIH0pfT5FZGl0IFNlY3Rpb25zPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdExpc3RzOiB0cnVlIH0pfT5FZGl0IExpc3RzPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RGF0YU1vZGVsOiB0cnVlIH0pfT5WaWV3IERhdGEgTW9kZWw8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dKU09ORGF0YTogdHJ1ZSB9KX0+VmlldyBKU09OPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93U3VtbWFyeTogdHJ1ZSB9KX0+U3VtbWFyeTwvYnV0dG9uPlxuXG4gICAgICAgIHtwbGF5Z3JvdW5kTW9kZSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJnb3Z1ay0hLW1hcmdpbi10b3AtNFwiPlxuICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdnb3Z1ay1saW5rIGdvdnVrLWxpbmstLW5vLXZpc2l0ZWQtc3RhdGUgZ292dWstIS1mb250LXNpemUtMTYnIGRvd25sb2FkIGhyZWY9Jy9hcGkvZGF0YT9mb3JtYXQ9dHJ1ZSc+RG93bmxvYWQgSlNPTjwvYT57JyAnfVxuICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdnb3Z1ay1saW5rIGdvdnVrLWxpbmstLW5vLXZpc2l0ZWQtc3RhdGUgZ292dWstIS1mb250LXNpemUtMTYnIGhyZWY9JyMnIG9uQ2xpY2s9e3RoaXMub25DbGlja1VwbG9hZH0+VXBsb2FkIEpTT048L2E+eycgJ31cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSdmaWxlJyBpZD0ndXBsb2FkJyBoaWRkZW4gb25DaGFuZ2U9e3RoaXMub25GaWxlVXBsb2FkfSAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0FkZCBQYWdlJyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRQYWdlfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRQYWdlOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPFBhZ2VDcmVhdGUgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkUGFnZTogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0FkZCBMaW5rJyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRMaW5rfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaW5rOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPExpbmtDcmVhdGUgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGluazogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgU2VjdGlvbnMnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRTZWN0aW9uc31cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdFNlY3Rpb25zOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPFNlY3Rpb25zRWRpdCBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0U2VjdGlvbnM6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IExpc3RzJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0TGlzdHN9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRMaXN0czogZmFsc2UgfSl9PlxuICAgICAgICAgIDxMaXN0c0VkaXQgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdExpc3RzOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRGF0YSBNb2RlbCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93RGF0YU1vZGVsfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dEYXRhTW9kZWw6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8RGF0YU1vZGVsIGRhdGE9e2RhdGF9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0pTT04gRGF0YScgc2hvdz17dGhpcy5zdGF0ZS5zaG93SlNPTkRhdGF9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0pTT05EYXRhOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMil9PC9wcmU+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J1N1bW1hcnknIHNob3c9e3RoaXMuc3RhdGUuc2hvd1N1bW1hcnl9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd1N1bW1hcnk6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8cHJlPntKU09OLnN0cmluZ2lmeShkYXRhLnBhZ2VzLm1hcChwYWdlID0+IHBhZ2UucGF0aCksIG51bGwsIDIpfTwvcHJlPlxuICAgICAgICA8L0ZseW91dD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5jbGFzcyBBcHAgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgY29tcG9uZW50V2lsbE1vdW50ICgpIHtcbiAgICB3aW5kb3cuZmV0Y2goJy9hcGkvZGF0YScpLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpLnRoZW4oZGF0YSA9PiB7XG4gICAgICBkYXRhLnNhdmUgPSB0aGlzLnNhdmVcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBsb2FkZWQ6IHRydWUsIGRhdGEgfSlcbiAgICB9KVxuICB9XG5cbiAgc2F2ZSA9ICh1cGRhdGVkRGF0YSkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuZmV0Y2goYC9hcGkvZGF0YWAsIHtcbiAgICAgIG1ldGhvZDogJ3B1dCcsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh1cGRhdGVkRGF0YSlcbiAgICB9KS50aGVuKHJlcyA9PiB7XG4gICAgICBpZiAoIXJlcy5vaykge1xuICAgICAgICB0aHJvdyBFcnJvcihyZXMuc3RhdHVzVGV4dClcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNcbiAgICB9KS50aGVuKHJlcyA9PiByZXMuanNvbigpKS50aGVuKGRhdGEgPT4ge1xuICAgICAgZGF0YS5zYXZlID0gdGhpcy5zYXZlXG4gICAgICB0aGlzLnNldFN0YXRlKHsgZGF0YSB9KVxuXG4gICAgICAvLyBSZWxvYWQgZnJhbWUgaWYgc3BsaXQgc2NyZWVuIGFuZCBpbiBwbGF5Z3JvdW5kIG1vZGVcbiAgICAgIGlmICh3aW5kb3cuREZCRC5wbGF5Z3JvdW5kTW9kZSkge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB3aW5kb3cucGFyZW50XG4gICAgICAgIGlmIChwYXJlbnQubG9jYXRpb24ucGF0aG5hbWUgPT09ICcvc3BsaXQnKSB7XG4gICAgICAgICAgY29uc3QgZnJhbWVzID0gd2luZG93LnBhcmVudC5mcmFtZXNcbiAgXG4gICAgICAgICAgaWYgKGZyYW1lcy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpZXcgPSB3aW5kb3cucGFyZW50LmZyYW1lc1sxXVxuICAgICAgICAgICAgcHJldmlldy5sb2NhdGlvbi5yZWxvYWQoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZGF0YVxuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIHdpbmRvdy5hbGVydCgnU2F2ZSBmYWlsZWQnKVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmxvYWRlZCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBpZD0nYXBwJz5cbiAgICAgICAgICA8TWVudSBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IHBsYXlncm91bmRNb2RlPXt3aW5kb3cuREZCRC5wbGF5Z3JvdW5kTW9kZX0gLz5cbiAgICAgICAgICA8VmlzdWFsaXNhdGlvbiBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gPGRpdj5Mb2FkaW5nLi4uPC9kaXY+XG4gICAgfVxuICB9XG59XG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPEFwcCAvPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKVxuKVxuIl0sIm5hbWVzIjpbIkZseW91dCIsInByb3BzIiwic2hvdyIsIm9uSGlkZSIsImUiLCJ0aXRsZSIsImNoaWxkcmVuIiwiZ2V0Rm9ybURhdGEiLCJmb3JtIiwiZm9ybURhdGEiLCJ3aW5kb3ciLCJGb3JtRGF0YSIsImRhdGEiLCJvcHRpb25zIiwic2NoZW1hIiwiY2FzdCIsIm5hbWUiLCJ2YWwiLCJlbCIsImVsZW1lbnRzIiwiZGF0YXNldCIsInVuZGVmaW5lZCIsIk51bWJlciIsImZvckVhY2giLCJ2YWx1ZSIsImtleSIsIm9wdGlvbnNQcmVmaXgiLCJzY2hlbWFQcmVmaXgiLCJ0cmltIiwic3RhcnRzV2l0aCIsInJlcXVpcmVkIiwic3Vic3RyIiwibGVuZ3RoIiwiT2JqZWN0Iiwia2V5cyIsImNsb25lIiwib2JqIiwiSlNPTiIsInBhcnNlIiwic3RyaW5naWZ5IiwiUGFnZUVkaXQiLCJzdGF0ZSIsIm9uU3VibWl0IiwicHJldmVudERlZmF1bHQiLCJ0YXJnZXQiLCJuZXdQYXRoIiwiZ2V0Iiwic2VjdGlvbiIsInBhZ2UiLCJjb3B5IiwicGF0aENoYW5nZWQiLCJwYXRoIiwiY29weVBhZ2UiLCJwYWdlcyIsImluZGV4T2YiLCJmaW5kIiwicCIsInNldEN1c3RvbVZhbGlkaXR5IiwicmVwb3J0VmFsaWRpdHkiLCJBcnJheSIsImlzQXJyYXkiLCJuZXh0IiwibiIsInNhdmUiLCJ0aGVuIiwiY29uc29sZSIsImxvZyIsIm9uRWRpdCIsImNhdGNoIiwiZXJyb3IiLCJlcnIiLCJvbkNsaWNrRGVsZXRlIiwiY29uZmlybSIsImNvcHlQYWdlSWR4IiwiZmluZEluZGV4IiwiaW5kZXgiLCJpIiwic3BsaWNlIiwic2VjdGlvbnMiLCJtYXAiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbXBvbmVudFR5cGVzIiwic3ViVHlwZSIsIkNsYXNzZXMiLCJjb21wb25lbnQiLCJjbGFzc2VzIiwiRmllbGRFZGl0IiwiaGludCIsIlRleHRGaWVsZEVkaXQiLCJtYXgiLCJtaW4iLCJNdWx0aWxpbmVUZXh0RmllbGRFZGl0Iiwicm93cyIsIk51bWJlckZpZWxkRWRpdCIsImludGVnZXIiLCJTZWxlY3RGaWVsZEVkaXQiLCJsaXN0cyIsImxpc3QiLCJSYWRpb3NGaWVsZEVkaXQiLCJDaGVja2JveGVzRmllbGRFZGl0IiwiUGFyYUVkaXQiLCJjb250ZW50IiwiSW5zZXRUZXh0RWRpdCIsIkh0bWxFZGl0IiwiRGV0YWlsc0VkaXQiLCJjb21wb25lbnRUeXBlRWRpdG9ycyIsIkNvbXBvbmVudFR5cGVFZGl0IiwidHlwZSIsInQiLCJUYWdOYW1lIiwiQ29tcG9uZW50RWRpdCIsImNvbXBvbmVudEluZGV4IiwiY29tcG9uZW50cyIsImNvbXBvbmVudElkeCIsImMiLCJpc0xhc3QiLCJjb3B5Q29tcCIsIlNvcnRhYmxlSGFuZGxlIiwiU29ydGFibGVIT0MiLCJEcmFnSGFuZGxlIiwiVGV4dEZpZWxkIiwiVGVsZXBob25lTnVtYmVyRmllbGQiLCJOdW1iZXJGaWVsZCIsIkVtYWlsQWRkcmVzc0ZpZWxkIiwiVGltZUZpZWxkIiwiRGF0ZUZpZWxkIiwiRGF0ZVRpbWVGaWVsZCIsIkRhdGVQYXJ0c0ZpZWxkIiwiRGF0ZVRpbWVQYXJ0c0ZpZWxkIiwiTXVsdGlsaW5lVGV4dEZpZWxkIiwiUmFkaW9zRmllbGQiLCJDaGVja2JveGVzRmllbGQiLCJTZWxlY3RGaWVsZCIsIlllc05vRmllbGQiLCJVa0FkZHJlc3NGaWVsZCIsIlBhcmEiLCJIdG1sIiwiSW5zZXRUZXh0IiwiRGV0YWlscyIsIkJhc2UiLCJDb21wb25lbnRGaWVsZCIsInNob3dFZGl0b3IiLCJzdG9wUHJvcGFnYXRpb24iLCJzZXRTdGF0ZSIsIkNvbXBvbmVudENyZWF0ZSIsInB1c2giLCJvbkNyZWF0ZSIsIlNvcnRhYmxlRWxlbWVudCIsIlNvcnRhYmxlQ29udGFpbmVyIiwiYXJyYXlNb3ZlIiwiU29ydGFibGVJdGVtIiwiU29ydGFibGVMaXN0IiwiUGFnZSIsIm9uU29ydEVuZCIsIm9sZEluZGV4IiwibmV3SW5kZXgiLCJmb3JtQ29tcG9uZW50cyIsImZpbHRlciIsImNvbXAiLCJwYWdlVGl0bGUiLCJsYXlvdXQiLCJzaG93QWRkQ29tcG9uZW50IiwibGlzdFR5cGVzIiwiY29tcG9uZW50VG9TdHJpbmciLCJEYXRhTW9kZWwiLCJtb2RlbCIsIlBhZ2VDcmVhdGUiLCJhc3NpZ24iLCJMaW5rRWRpdCIsImVkZ2UiLCJzb3VyY2UiLCJsaW5rIiwiaWYiLCJjb25kaXRpb24iLCJjb3B5TGluayIsImNvcHlMaW5rSWR4IiwiTGlua0NyZWF0ZSIsImZyb20iLCJ0byIsImhlYWREdXBsaWNhdGUiLCJhcnIiLCJqIiwiTGlzdEl0ZW1zIiwib25DbGlja0FkZEl0ZW0iLCJpdGVtcyIsImNvbmNhdCIsInRleHQiLCJyZW1vdmVJdGVtIiwicyIsImlkeCIsIm9uQmx1ciIsInRleHRzIiwiZ2V0QWxsIiwidmFsdWVzIiwiZHVwZVRleHQiLCJkdXBlVmFsdWUiLCJpdGVtIiwiTGlzdEVkaXQiLCJuZXdOYW1lIiwibmV3VGl0bGUiLCJuZXdUeXBlIiwibmFtZUNoYW5nZWQiLCJjb3B5TGlzdCIsIm9uQmx1ck5hbWUiLCJpbnB1dCIsImwiLCJvbkNhbmNlbCIsIkxpc3RDcmVhdGUiLCJMaXN0c0VkaXQiLCJvbkNsaWNrTGlzdCIsIm9uQ2xpY2tBZGRMaXN0Iiwic2hvd0FkZExpc3QiLCJTZWN0aW9uRWRpdCIsImNvcHlTZWN0aW9uIiwiU2VjdGlvbkNyZWF0ZSIsIlNlY3Rpb25zRWRpdCIsIm9uQ2xpY2tTZWN0aW9uIiwib25DbGlja0FkZFNlY3Rpb24iLCJzaG93QWRkU2VjdGlvbiIsImdldExheW91dCIsImciLCJkYWdyZSIsImdyYXBobGliIiwiR3JhcGgiLCJzZXRHcmFwaCIsInJhbmtkaXIiLCJtYXJnaW54IiwibWFyZ2lueSIsInJhbmtzZXAiLCJzZXREZWZhdWx0RWRnZUxhYmVsIiwicGFnZUVsIiwic2V0Tm9kZSIsImxhYmVsIiwid2lkdGgiLCJvZmZzZXRXaWR0aCIsImhlaWdodCIsIm9mZnNldEhlaWdodCIsInNldEVkZ2UiLCJwb3MiLCJub2RlcyIsImVkZ2VzIiwib3V0cHV0IiwiZ3JhcGgiLCJ2Iiwibm9kZSIsInB0IiwidG9wIiwieSIsImxlZnQiLCJ4IiwidyIsInBvaW50cyIsIkxpbmVzIiwiZWRpdExpbmsiLCJqb2luIiwiTWluaW1hcCIsIm9uQ2xpY2tQYWdlIiwic2NhbGUiLCJwYXJzZUZsb2F0IiwiVmlzdWFsaXNhdGlvbiIsInJlZiIsImNyZWF0ZVJlZiIsInNldFRpbWVvdXQiLCJjdXJyZW50Iiwic2NoZWR1bGVMYXlvdXQiLCJNZW51Iiwib25DbGlja1VwbG9hZCIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJjbGljayIsIm9uRmlsZVVwbG9hZCIsImZpbGUiLCJmaWxlcyIsInJlYWRlciIsIkZpbGVSZWFkZXIiLCJyZWFkQXNUZXh0Iiwib25sb2FkIiwiZXZ0IiwicmVzdWx0IiwicGxheWdyb3VuZE1vZGUiLCJzaG93QWRkUGFnZSIsInNob3dBZGRMaW5rIiwic2hvd0VkaXRTZWN0aW9ucyIsInNob3dFZGl0TGlzdHMiLCJzaG93RGF0YU1vZGVsIiwic2hvd0pTT05EYXRhIiwic2hvd1N1bW1hcnkiLCJBcHAiLCJ1cGRhdGVkRGF0YSIsImZldGNoIiwibWV0aG9kIiwiYm9keSIsInJlcyIsIm9rIiwiRXJyb3IiLCJzdGF0dXNUZXh0IiwianNvbiIsIkRGQkQiLCJwYXJlbnQiLCJsb2NhdGlvbiIsInBhdGhuYW1lIiwiZnJhbWVzIiwicHJldmlldyIsInJlbG9hZCIsImFsZXJ0IiwibG9hZGVkIiwiUmVhY3RET00iLCJyZW5kZXIiXSwibWFwcGluZ3MiOiI7OztFQUNBLFNBQVNBLE1BQVQsQ0FBaUJDLEtBQWpCLEVBQXdCO0VBQ3RCLE1BQUksQ0FBQ0EsTUFBTUMsSUFBWCxFQUFpQjtFQUNmLFdBQU8sSUFBUDtFQUNEOztFQUVELFNBQ0U7RUFBQTtFQUFBLE1BQUssV0FBVSxr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
