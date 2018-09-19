(function () {
  'use strict';

  function Flyout(props) {
    if (!props.show) {
      return null;
    }

    var width = props.width || '';

    return React.createElement(
      'div',
      { className: 'flyout-menu show' },
      React.createElement(
        'div',
        { className: 'flyout-menu-container ' + width },
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
        'E.g. govuk-input--width-2 (or 3, 4, 5, 10, 20) or govuk-!-width-one-half (two-thirds, three-quarters etc.)'
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
        React.createElement(
          'span',
          { className: 'govuk-hint' },
          'This is used as the key in the JSON output. Use `camelCasing` e.g. dateOfBirth or fullName.'
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
        React.createElement(
          'span',
          { className: 'govuk-hint' },
          'This is the title text displayed on the page'
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
        React.createElement(
          'span',
          { className: 'govuk-hint' },
          'The hint can include HTML'
        ),
        React.createElement('textarea', { className: 'govuk-textarea', id: 'field-hint', name: 'hint',
          defaultValue: component.hint, rows: '2' })
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
      ),
      React.createElement(
        'div',
        { className: 'govuk-checkboxes govuk-form-group' },
        React.createElement(
          'div',
          { className: 'govuk-checkboxes__item' },
          React.createElement('input', { className: 'govuk-checkboxes__input', id: 'field-options.bold', 'data-cast': 'boolean',
            name: 'options.bold', type: 'checkbox', defaultChecked: options.bold === true }),
          React.createElement(
            'label',
            { className: 'govuk-label govuk-checkboxes__label',
              htmlFor: 'field-options.bold' },
            'Bold labels'
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
      ),
      React.createElement(
        'div',
        { className: 'govuk-checkboxes govuk-form-group' },
        React.createElement(
          'div',
          { className: 'govuk-checkboxes__item' },
          React.createElement('input', { className: 'govuk-checkboxes__input', id: 'field-options.bold', 'data-cast': 'boolean',
            name: 'options.bold', type: 'checkbox', defaultChecked: options.bold === true }),
          React.createElement(
            'label',
            { className: 'govuk-label govuk-checkboxes__label',
              htmlFor: 'field-options.bold' },
            'Bold labels'
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
      React.createElement(
        'span',
        { className: 'govuk-hint' },
        'The content can include HTML and the `govuk-prose-scope` css class is available. Use this on a wrapping element to apply default govuk styles.'
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
        React.createElement(
          'span',
          { className: 'govuk-hint' },
          'The content can include HTML and the `govuk-prose-scope` css class is available. Use this on a wrapping element to apply default govuk styles.'
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
            data = _props.data,
            filtered = _props.filtered;
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
          { id: page.path, className: 'page' + (filtered ? ' filtered' : ''), title: page.path, style: this.props.layout },
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
            React.createElement(
              'span',
              { className: 'govuk-hint' },
              'E.g. /your-occupation or /personal-details/date-of-birth'
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
          items: _this.state.items.concat({ text: '', value: '', description: '' })
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
                'Description'
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
                  { className: 'govuk-table__cell' },
                  React.createElement('input', { className: 'govuk-input', name: 'description',
                    type: 'text', defaultValue: item.description,
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
        var descriptions = formData.getAll('description').map(function (t) {
          return t.trim();
        });
        copyList.items = texts.map(function (t, i) {
          return {
            text: t,
            value: values[i],
            description: descriptions[i]
          };
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
            React.createElement('input', { className: 'govuk-input govuk-input--width-20', id: 'list-name', name: 'name',
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
            React.createElement('input', { className: 'govuk-input govuk-!-width-two-thirds', id: 'list-title', name: 'title',
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
              { className: 'govuk-select govuk-input--width-10', id: 'list-type', name: 'type',
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
        var descriptions = formData.getAll('description').map(function (t) {
          return t.trim();
        });

        var items = texts.map(function (t, i) {
          return {
            text: t,
            value: values[i],
            description: descriptions[i]
          };
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
            React.createElement(
              'span',
              { className: 'govuk-hint' },
              'This is used as a namespace in the JSON output for all pages in this section. Use `camelCasing` e.g. checkBeforeStart or personalDetails.'
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
            React.createElement(
              'span',
              { className: 'govuk-hint' },
              'This text displayed on the page above the main title.'
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

  function getLayout(pages, el) {
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
    pages.forEach(function (page, index) {
      var pageEl = el.children[index];

      g.setNode(page.path, { label: page.path, width: pageEl.offsetWidth, height: pageEl.offsetHeight });
    });

    // Add edges to the graph.
    pages.forEach(function (page) {
      if (Array.isArray(page.next)) {
        page.next.forEach(function (next) {
          // The linked node (next page) may not exist if it's filtered
          var exists = pages.find(function (page) {
            return page.path === next.path;
          });
          if (exists) {
            g.setEdge(page.path, next.path);
          }
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

      return _ret2 = (_temp2 = (_this3 = _possibleConstructorReturn$g(this, (_ref2 = Minimap.__proto__ || Object.getPrototypeOf(Minimap)).call.apply(_ref2, [this].concat(args))), _this3), _this3.state = {}, _this3.onClickPage = function (e, path) {
        return _this3.props.toggleFilterPath(path);
      }, _temp2), _possibleConstructorReturn$g(_this3, _ret2);
    }

    _createClass$g(Minimap, [{
      key: 'render',
      value: function render() {
        var _props2 = this.props,
            layout = _props2.layout,
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
                    title: node.node.label })
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

      var _this4 = _possibleConstructorReturn$g(this, (Visualisation.__proto__ || Object.getPrototypeOf(Visualisation)).call(this));

      _this4.state = {
        filterPaths: []
      };

      _this4.toggleFilterPath = function (path) {
        var filterPaths = _this4.state.filterPaths;

        var idx = filterPaths.indexOf(path);

        if (idx > -1) {
          _this4.setState({
            filterPaths: filterPaths.filter(function (item, index) {
              return index === idx;
            })
          });
        } else {
          _this4.setState({
            filterPaths: filterPaths.concat(path)
          });
        }

        _this4.scheduleLayout();
      };

      _this4.ref = React.createRef();
      return _this4;
    }

    _createClass$g(Visualisation, [{
      key: 'scheduleLayout',
      value: function scheduleLayout() {
        var _this5 = this;

        setTimeout(function () {
          var pages = _this5.getFilteredPages();
          var layout = getLayout(pages, _this5.ref.current);

          _this5.setState({
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
      key: 'getFilteredPages',
      value: function getFilteredPages() {
        var data = this.props.data;
        var filterPaths = this.state.filterPaths;
        var pages = data.pages;


        if (!filterPaths.length) {
          return pages;
        }

        var filteredPages = filterPaths.map(function (path) {
          return pages.find(function (page) {
            return page.path === path;
          });
        });

        // Upstream paths
        var upstreamPaths = {};

        {
          filteredPages.forEach(function (page) {
            if (Array.isArray(page.next)) {
              page.next.forEach(function (next) {
                upstreamPaths[next.path] = true;
              });
            }
          });
        }

        // Downstream paths
        var downstreamPaths = {};

        {
          pages.forEach(function (page) {
            if (Array.isArray(page.next)) {
              page.next.forEach(function (next) {
                if (filterPaths.includes(next.path)) {
                  downstreamPaths[page.path] = true;
                }
              });
            }
          });
        }

        var filter = function filter(page) {
          return filterPaths.includes(page.path) || upstreamPaths[page.path] || downstreamPaths[page.path];
        };

        return data.pages.filter(filter);
      }
    }, {
      key: 'componentWillReceiveProps',
      value: function componentWillReceiveProps() {
        this.scheduleLayout();
      }
    }, {
      key: 'render',
      value: function render() {
        var _this6 = this;

        var data = this.props.data;
        var filterPaths = this.state.filterPaths;

        var pages = this.getFilteredPages();

        return React.createElement(
          'div',
          { ref: this.ref, className: 'visualisation', style: this.state.layout && { width: this.state.layout.width, height: this.state.layout.height } },
          pages.map(function (page, index) {
            return React.createElement(Page, {
              key: index, data: data, page: page, filtered: !filterPaths.includes(page.path),
              layout: _this6.state.layout && _this6.state.layout.nodes[index] });
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

      var _temp3, _this7, _ret3;

      _classCallCheck$g(this, Menu);

      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return _ret3 = (_temp3 = (_this7 = _possibleConstructorReturn$g(this, (_ref3 = Menu.__proto__ || Object.getPrototypeOf(Menu)).call.apply(_ref3, [this].concat(args))), _this7), _this7.state = {
        tab: 'model'
      }, _this7.onClickUpload = function (e) {
        e.preventDefault();
        document.getElementById('upload').click();
      }, _this7.onFileUpload = function (e) {
        var data = _this7.props.data;

        var file = e.target.files.item(0);
        var reader = new window.FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = function (evt) {
          var content = JSON.parse(evt.target.result);
          data.save(content);
        };
      }, _temp3), _possibleConstructorReturn$g(_this7, _ret3);
    }

    _createClass$g(Menu, [{
      key: 'setTab',
      value: function setTab(e, name) {
        e.preventDefault();
        this.setState({ tab: name });
      }
    }, {
      key: 'render',
      value: function render() {
        var _this8 = this;

        var _props3 = this.props,
            data = _props3.data,
            playgroundMode = _props3.playgroundMode;


        return React.createElement(
          'div',
          { className: 'menu' },
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14' + (this.state.showMenu ? ' govuk-!-margin-right-2' : ''),
              onClick: function onClick() {
                return _this8.setState({ showMenu: !_this8.state.showMenu });
              } },
            '\u2630'
          ),
          this.state.showMenu && React.createElement(
            'span',
            { className: 'menu-inner' },
            React.createElement(
              'button',
              { className: 'govuk-button govuk-!-font-size-14',
                onClick: function onClick() {
                  return _this8.setState({ showAddPage: true });
                } },
              'Add Page'
            ),
            ' ',
            React.createElement(
              'button',
              { className: 'govuk-button govuk-!-font-size-14',
                onClick: function onClick() {
                  return _this8.setState({ showAddLink: true });
                } },
              'Add Link'
            ),
            ' ',
            React.createElement(
              'button',
              { className: 'govuk-button govuk-!-font-size-14',
                onClick: function onClick() {
                  return _this8.setState({ showEditSections: true });
                } },
              'Edit Sections'
            ),
            ' ',
            React.createElement(
              'button',
              { className: 'govuk-button govuk-!-font-size-14',
                onClick: function onClick() {
                  return _this8.setState({ showEditLists: true });
                } },
              'Edit Lists'
            ),
            ' ',
            React.createElement(
              'button',
              { className: 'govuk-button govuk-!-font-size-14',
                onClick: function onClick() {
                  return _this8.setState({ showSummary: true });
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
                  return _this8.setState({ showAddPage: false });
                } },
              React.createElement(PageCreate, { data: data, onCreate: function onCreate() {
                  return _this8.setState({ showAddPage: false });
                } })
            ),
            React.createElement(
              Flyout,
              { title: 'Add Link', show: this.state.showAddLink,
                onHide: function onHide() {
                  return _this8.setState({ showAddLink: false });
                } },
              React.createElement(LinkCreate, { data: data, onCreate: function onCreate() {
                  return _this8.setState({ showAddLink: false });
                } })
            ),
            React.createElement(
              Flyout,
              { title: 'Edit Sections', show: this.state.showEditSections,
                onHide: function onHide() {
                  return _this8.setState({ showEditSections: false });
                } },
              React.createElement(SectionsEdit, { data: data, onCreate: function onCreate() {
                  return _this8.setState({ showEditSections: false });
                } })
            ),
            React.createElement(
              Flyout,
              { title: 'Edit Lists', show: this.state.showEditLists,
                onHide: function onHide() {
                  return _this8.setState({ showEditLists: false });
                }, width: 'xlarge' },
              React.createElement(ListsEdit, { data: data, onCreate: function onCreate() {
                  return _this8.setState({ showEditLists: false });
                } })
            ),
            React.createElement(
              Flyout,
              { title: 'Summary', show: this.state.showSummary, width: 'large',
                onHide: function onHide() {
                  return _this8.setState({ showSummary: false });
                } },
              React.createElement(
                'div',
                { className: 'js-enabled', style: { paddingTop: '3px' } },
                React.createElement(
                  'div',
                  { className: 'govuk-tabs', 'data-module': 'tabs' },
                  React.createElement(
                    'h2',
                    { className: 'govuk-tabs__title' },
                    'Summary'
                  ),
                  React.createElement(
                    'ul',
                    { className: 'govuk-tabs__list' },
                    React.createElement(
                      'li',
                      { className: 'govuk-tabs__list-item' },
                      React.createElement(
                        'a',
                        { className: 'govuk-tabs__tab', href: '#',
                          'aria-selected': this.state.tab === 'model' ? 'true' : 'false',
                          onClick: function onClick(e) {
                            return _this8.setTab(e, 'model');
                          } },
                        'Data Model'
                      )
                    ),
                    React.createElement(
                      'li',
                      { className: 'govuk-tabs__list-item' },
                      React.createElement(
                        'a',
                        { className: 'govuk-tabs__tab', href: '#',
                          'aria-selected': this.state.tab === 'json' ? 'true' : 'false',
                          onClick: function onClick(e) {
                            return _this8.setTab(e, 'json');
                          } },
                        'JSON'
                      )
                    ),
                    React.createElement(
                      'li',
                      { className: 'govuk-tabs__list-item' },
                      React.createElement(
                        'a',
                        { className: 'govuk-tabs__tab', href: '#',
                          'aria-selected': this.state.tab === 'summary' ? 'true' : 'false',
                          onClick: function onClick(e) {
                            return _this8.setTab(e, 'summary');
                          } },
                        'Summary'
                      )
                    )
                  ),
                  this.state.tab === 'model' && React.createElement(
                    'section',
                    { className: 'govuk-tabs__panel' },
                    React.createElement(DataModel, { data: data })
                  ),
                  this.state.tab === 'json' && React.createElement(
                    'section',
                    { className: 'govuk-tabs__panel' },
                    React.createElement(
                      'pre',
                      null,
                      JSON.stringify(data, null, 2)
                    )
                  ),
                  this.state.tab === 'summary' && React.createElement(
                    'section',
                    { className: 'govuk-tabs__panel' },
                    React.createElement(
                      'pre',
                      null,
                      JSON.stringify(data.pages.map(function (page) {
                        return page.path;
                      }), null, 2)
                    )
                  )
                )
              )
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

      var _temp4, _this9, _ret4;

      _classCallCheck$g(this, App);

      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
        args[_key4] = arguments[_key4];
      }

      return _ret4 = (_temp4 = (_this9 = _possibleConstructorReturn$g(this, (_ref4 = App.__proto__ || Object.getPrototypeOf(App)).call.apply(_ref4, [this].concat(args))), _this9), _this9.state = {}, _this9.save = function (updatedData) {
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
          data.save = _this9.save;
          _this9.setState({ data: data });

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
      }, _temp4), _possibleConstructorReturn$g(_this9, _ret4);
    }

    _createClass$g(App, [{
      key: 'componentWillMount',
      value: function componentWillMount() {
        var _this10 = this;

        window.fetch('/api/data').then(function (res) {
          return res.json();
        }).then(function (data) {
          data.save = _this10.save;
          _this10.setState({ loaded: true, data: data });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzaWduZXIuanMiLCJzb3VyY2VzIjpbIi4uL2NsaWVudC9mbHlvdXQuanMiLCIuLi9jbGllbnQvaGVscGVycy5qcyIsIi4uL2NsaWVudC9wYWdlLWVkaXQuanMiLCIuLi9jb21wb25lbnQtdHlwZXMuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LXR5cGUtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LWNyZWF0ZS5qcyIsIi4uL2NsaWVudC9wYWdlLmpzIiwiLi4vY2xpZW50L2RhdGEtbW9kZWwuanMiLCIuLi9jbGllbnQvcGFnZS1jcmVhdGUuanMiLCIuLi9jbGllbnQvbGluay1lZGl0LmpzIiwiLi4vY2xpZW50L2xpbmstY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3QtaXRlbXMuanMiLCIuLi9jbGllbnQvbGlzdC1lZGl0LmpzIiwiLi4vY2xpZW50L2xpc3QtY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3RzLWVkaXQuanMiLCIuLi9jbGllbnQvc2VjdGlvbi1lZGl0LmpzIiwiLi4vY2xpZW50L3NlY3Rpb24tY3JlYXRlLmpzIiwiLi4vY2xpZW50L3NlY3Rpb25zLWVkaXQuanMiLCIuLi9jbGllbnQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5mdW5jdGlvbiBGbHlvdXQgKHByb3BzKSB7XG4gIGlmICghcHJvcHMuc2hvdykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCB3aWR0aCA9IHByb3BzLndpZHRoIHx8ICcnXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZmx5b3V0LW1lbnUgc2hvdyc+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YGZseW91dC1tZW51LWNvbnRhaW5lciAke3dpZHRofWB9PlxuICAgICAgICA8YSB0aXRsZT0nQ2xvc2UnIGNsYXNzTmFtZT0nY2xvc2UgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgb25DbGljaz17ZSA9PiBwcm9wcy5vbkhpZGUoZSl9PkNsb3NlPC9hPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFuZWwnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1oZWFkZXIgZ292dWstIS1wYWRkaW5nLXRvcC00IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTQnPlxuICAgICAgICAgICAge3Byb3BzLnRpdGxlICYmIDxoNCBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctbSc+e3Byb3BzLnRpdGxlfTwvaDQ+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1ib2R5Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctbGVmdC00IGdvdnVrLSEtcGFkZGluZy1yaWdodC00IGdvdnVrLSEtcGFkZGluZy1ib3R0b20tNCc+XG4gICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZseW91dFxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1EYXRhIChmb3JtKSB7XG4gIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICBjb25zdCBkYXRhID0ge1xuICAgIG9wdGlvbnM6IHt9LFxuICAgIHNjaGVtYToge31cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhc3QgKG5hbWUsIHZhbCkge1xuICAgIGNvbnN0IGVsID0gZm9ybS5lbGVtZW50c1tuYW1lXVxuICAgIGNvbnN0IGNhc3QgPSBlbCAmJiBlbC5kYXRhc2V0LmNhc3RcblxuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGNhc3QgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gTnVtYmVyKHZhbClcbiAgICB9IGVsc2UgaWYgKGNhc3QgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHZhbCA9PT0gJ29uJ1xuICAgIH1cblxuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICBjb25zdCBvcHRpb25zUHJlZml4ID0gJ29wdGlvbnMuJ1xuICAgIGNvbnN0IHNjaGVtYVByZWZpeCA9ICdzY2hlbWEuJ1xuXG4gICAgdmFsdWUgPSB2YWx1ZS50cmltKClcblxuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG9wdGlvbnNQcmVmaXgpKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGAke29wdGlvbnNQcmVmaXh9cmVxdWlyZWRgICYmIHZhbHVlID09PSAnb24nKSB7XG4gICAgICAgICAgZGF0YS5vcHRpb25zLnJlcXVpcmVkID0gZmFsc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLm9wdGlvbnNba2V5LnN1YnN0cihvcHRpb25zUHJlZml4Lmxlbmd0aCldID0gY2FzdChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleS5zdGFydHNXaXRoKHNjaGVtYVByZWZpeCkpIHtcbiAgICAgICAgZGF0YS5zY2hlbWFba2V5LnN1YnN0cihzY2hlbWFQcmVmaXgubGVuZ3RoKV0gPSBjYXN0KGtleSwgdmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIENsZWFudXBcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLnNjaGVtYSkubGVuZ3RoKSBkZWxldGUgZGF0YS5zY2hlbWFcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLm9wdGlvbnMpLmxlbmd0aCkgZGVsZXRlIGRhdGEub3B0aW9uc1xuXG4gIHJldHVybiBkYXRhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZSAob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld1BhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBwYXRoQ2hhbmdlZCA9IG5ld1BhdGggIT09IHBhZ2UucGF0aFxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlc1tkYXRhLnBhZ2VzLmluZGV4T2YocGFnZSldXG5cbiAgICBpZiAocGF0aENoYW5nZWQpIHtcbiAgICAgIC8vIGBwYXRoYCBoYXMgY2hhbmdlZCAtIHZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgICAgaWYgKGRhdGEucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gbmV3UGF0aCkpIHtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke25ld1BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29weVBhZ2UucGF0aCA9IG5ld1BhdGhcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBwYWdlXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHAubmV4dCkpIHtcbiAgICAgICAgICBwLm5leHQuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgIGlmIChuLnBhdGggPT09IHBhZ2UucGF0aCkge1xuICAgICAgICAgICAgICBuLnBhdGggPSBuZXdQYXRoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIGNvcHlQYWdlLnRpdGxlID0gdGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlQYWdlLnRpdGxlXG4gICAgfVxuXG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIGNvcHlQYWdlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjb3B5UGFnZS5zZWN0aW9uXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2VJZHggPSBjb3B5LnBhZ2VzLmZpbmRJbmRleChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBsaW5rcyB0byB0aGUgcGFnZVxuICAgIGNvcHkucGFnZXMuZm9yRWFjaCgocCwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChpbmRleCAhPT0gY29weVBhZ2VJZHggJiYgQXJyYXkuaXNBcnJheShwLm5leHQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBwLm5leHQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gcC5uZXh0W2ldXG4gICAgICAgICAgaWYgKG5leHQucGF0aCA9PT0gcGFnZS5wYXRoKSB7XG4gICAgICAgICAgICBwLm5leHQuc3BsaWNlKGksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIFJlbW92ZSB0aGUgcGFnZSBpdHNlbGZcbiAgICBjb3B5LnBhZ2VzLnNwbGljZShjb3B5UGFnZUlkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIC8vIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3BhZ2UucGF0aH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGUudGFyZ2V0LnNldEN1c3RvbVZhbGlkaXR5KCcnKX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXRpdGxlJz5UaXRsZSAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0ncGFnZS10aXRsZS1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgSWYgbm90IHN1cHBsaWVkLCB0aGUgdGl0bGUgb2YgdGhlIGZpcnN0IHF1ZXN0aW9uIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17cGFnZS50aXRsZX0gYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJyBkZWZhdWx0VmFsdWU9e3BhZ2Uuc2VjdGlvbn0+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7c2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gKDxvcHRpb24ga2V5PXtzZWN0aW9uLm5hbWV9IHZhbHVlPXtzZWN0aW9uLm5hbWV9PntzZWN0aW9uLnRpdGxlfTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlRWRpdFxuIiwiY29uc3QgY29tcG9uZW50VHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAnVGV4dEZpZWxkJyxcbiAgICB0aXRsZTogJ1RleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdNdWx0aWxpbmVUZXh0RmllbGQnLFxuICAgIHRpdGxlOiAnTXVsdGlsaW5lIHRleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdZZXNOb0ZpZWxkJyxcbiAgICB0aXRsZTogJ1llcy9ObyBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVGaWVsZCcsXG4gICAgdGl0bGU6ICdEYXRlIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ1RpbWUgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgdGltZSBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVQYXJ0c0ZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgcGFydHMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZVBhcnRzRmllbGQnLFxuICAgIHRpdGxlOiAnRGF0ZSB0aW1lIHBhcnRzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnU2VsZWN0RmllbGQnLFxuICAgIHRpdGxlOiAnU2VsZWN0IGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUmFkaW9zRmllbGQnLFxuICAgIHRpdGxlOiAnUmFkaW9zIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQ2hlY2tib3hlc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0NoZWNrYm94ZXMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdOdW1iZXJGaWVsZCcsXG4gICAgdGl0bGU6ICdOdW1iZXIgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdVa0FkZHJlc3NGaWVsZCcsXG4gICAgdGl0bGU6ICdVayBhZGRyZXNzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGVsZXBob25lTnVtYmVyRmllbGQnLFxuICAgIHRpdGxlOiAnVGVsZXBob25lIG51bWJlciBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0VtYWlsQWRkcmVzc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0VtYWlsIGFkZHJlc3MgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdQYXJhJyxcbiAgICB0aXRsZTogJ1BhcmFncmFwaCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnSHRtbCcsXG4gICAgdGl0bGU6ICdIdG1sJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdJbnNldFRleHQnLFxuICAgIHRpdGxlOiAnSW5zZXQgdGV4dCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnRGV0YWlscycsXG4gICAgdGl0bGU6ICdEZXRhaWxzJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfVxuXVxuXG5leHBvcnQgZGVmYXVsdCBjb21wb25lbnRUeXBlc1xuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuXG5mdW5jdGlvbiBDbGFzc2VzIChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5jbGFzc2VzJz5DbGFzc2VzPC9sYWJlbD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+QWRkaXRpb25hbCBDU1MgY2xhc3NlcyB0byBhZGQgdG8gdGhlIGZpZWxkPGJyIC8+XG4gICAgICBFLmcuIGdvdnVrLWlucHV0LS13aWR0aC0yIChvciAzLCA0LCA1LCAxMCwgMjApIG9yIGdvdnVrLSEtd2lkdGgtb25lLWhhbGYgKHR3by10aGlyZHMsIHRocmVlLXF1YXJ0ZXJzIGV0Yy4pPC9zcGFuPlxuICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmNsYXNzZXMnIG5hbWU9J29wdGlvbnMuY2xhc3NlcycgdHlwZT0ndGV4dCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmNsYXNzZXN9IC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhpcyBpcyB1c2VkIGFzIHRoZSBrZXkgaW4gdGhlIEpTT04gb3V0cHV0LiBVc2UgYGNhbWVsQ2FzaW5nYCBlLmcuIGRhdGVPZkJpcnRoIG9yIGZ1bGxOYW1lLjwvc3Bhbj5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTIwJyBpZD0nZmllbGQtbmFtZSdcbiAgICAgICAgICBuYW1lPSduYW1lJyB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5uYW1lfSByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKycgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlRoaXMgaXMgdGhlIHRpdGxlIHRleHQgZGlzcGxheWVkIG9uIHRoZSBwYWdlPC9zcGFuPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2ZpZWxkLXRpdGxlJyBuYW1lPSd0aXRsZScgdHlwZT0ndGV4dCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1oaW50Jz5IaW50IChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlRoZSBoaW50IGNhbiBpbmNsdWRlIEhUTUw8L3NwYW4+XG4gICAgICAgIDx0ZXh0YXJlYSBjbGFzc05hbWU9J2dvdnVrLXRleHRhcmVhJyBpZD0nZmllbGQtaGludCcgbmFtZT0naGludCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5oaW50fSByb3dzPScyJyAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLnJlcXVpcmVkJ1xuICAgICAgICAgICAgbmFtZT0nb3B0aW9ucy5yZXF1aXJlZCcgdHlwZT0nY2hlY2tib3gnIGRlZmF1bHRDaGVja2VkPXtvcHRpb25zLnJlcXVpcmVkID09PSBmYWxzZX0gLz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1jaGVja2JveGVzX19sYWJlbCdcbiAgICAgICAgICAgIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMucmVxdWlyZWQnPk9wdGlvbmFsPC9sYWJlbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvZGl2PlxuICApXG59XG5cbmZ1bmN0aW9uIFRleHRGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBzY2hlbWEgPSBjb21wb25lbnQuc2NoZW1hIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkZXRhaWxzIGNsYXNzTmFtZT0nZ292dWstZGV0YWlscyc+XG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeSc+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5LXRleHQnPm1vcmU8L3NwYW4+XG4gICAgICAgIDwvc3VtbWFyeT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5tYXgnPk1heCBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtYXhpbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWF4JyBuYW1lPSdzY2hlbWEubWF4J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWF4fSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1pbic+TWluIGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1pbmltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5taW4nIG5hbWU9J3NjaGVtYS5taW4nXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5taW59IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubGVuZ3RoJz5MZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBleGFjdCB0ZXh0IGxlbmd0aDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLmxlbmd0aCcgbmFtZT0nc2NoZW1hLmxlbmd0aCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLmxlbmd0aH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBNdWx0aWxpbmVUZXh0RmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgc2NoZW1hID0gY29tcG9uZW50LnNjaGVtYSB8fCB7fVxuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRldGFpbHMgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzJz5cbiAgICAgICAgPHN1bW1hcnkgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5Jz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnktdGV4dCc+bW9yZTwvc3Bhbj5cbiAgICAgICAgPC9zdW1tYXJ5PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1heCc+TWF4IGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5tYXgnIG5hbWU9J3NjaGVtYS5tYXgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5tYXh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWluJz5NaW4gbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWluaW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1pbicgbmFtZT0nc2NoZW1hLm1pbidcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1pbn0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMucm93cyc+Um93czwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGlkPSdmaWVsZC1vcHRpb25zLnJvd3MnIG5hbWU9J29wdGlvbnMucm93cycgdHlwZT0ndGV4dCdcbiAgICAgICAgICAgIGRhdGEtY2FzdD0nbnVtYmVyJyBkZWZhdWx0VmFsdWU9e29wdGlvbnMucm93c30gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2RldGFpbHM+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gTnVtYmVyRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgc2NoZW1hID0gY29tcG9uZW50LnNjaGVtYSB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGV0YWlscyBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHMnPlxuICAgICAgICA8c3VtbWFyeSBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnknPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeS10ZXh0Jz5tb3JlPC9zcGFuPlxuICAgICAgICA8L3N1bW1hcnk+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWluJz5NaW48L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtaW5pbXVtIHZhbHVlPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWluJyBuYW1lPSdzY2hlbWEubWluJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWlufSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1heCc+TWF4PC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWF4aW11bSB2YWx1ZTwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1heCcgbmFtZT0nc2NoZW1hLm1heCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1heH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlcyBnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pbnB1dCcgaWQ9J2ZpZWxkLXNjaGVtYS5pbnRlZ2VyJyBkYXRhLWNhc3Q9J2Jvb2xlYW4nXG4gICAgICAgICAgICAgIG5hbWU9J3NjaGVtYS5pbnRlZ2VyJyB0eXBlPSdjaGVja2JveCcgZGVmYXVsdENoZWNrZWQ9e3NjaGVtYS5pbnRlZ2VyID09PSB0cnVlfSAvPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstY2hlY2tib3hlc19fbGFiZWwnXG4gICAgICAgICAgICAgIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5pbnRlZ2VyJz5JbnRlZ2VyPC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2RldGFpbHM+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gU2VsZWN0RmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG4gIGNvbnN0IGxpc3RzID0gZGF0YS5saXN0c1xuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMubGlzdCc+TGlzdDwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCBnb3Z1ay1pbnB1dC0td2lkdGgtMTAnIGlkPSdmaWVsZC1vcHRpb25zLmxpc3QnIG5hbWU9J29wdGlvbnMubGlzdCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5saXN0fSByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtsaXN0cy5tYXAobGlzdCA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiA8b3B0aW9uIGtleT17bGlzdC5uYW1lfSB2YWx1ZT17bGlzdC5uYW1lfT57bGlzdC50aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIFJhZGlvc0ZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQsIGRhdGEgfSA9IHByb3BzXG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuICBjb25zdCBsaXN0cyA9IGRhdGEubGlzdHNcblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmxpc3QnPkxpc3Q8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QgZ292dWstaW5wdXQtLXdpZHRoLTEwJyBpZD0nZmllbGQtb3B0aW9ucy5saXN0JyBuYW1lPSdvcHRpb25zLmxpc3QnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e29wdGlvbnMubGlzdH0gcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7bGlzdHMubWFwKGxpc3QgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e2xpc3QubmFtZX0gdmFsdWU9e2xpc3QubmFtZX0+e2xpc3QudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXMgZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pdGVtJz5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pbnB1dCcgaWQ9J2ZpZWxkLW9wdGlvbnMuYm9sZCcgZGF0YS1jYXN0PSdib29sZWFuJ1xuICAgICAgICAgICAgbmFtZT0nb3B0aW9ucy5ib2xkJyB0eXBlPSdjaGVja2JveCcgZGVmYXVsdENoZWNrZWQ9e29wdGlvbnMuYm9sZCA9PT0gdHJ1ZX0gLz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1jaGVja2JveGVzX19sYWJlbCdcbiAgICAgICAgICAgIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMuYm9sZCc+Qm9sZCBsYWJlbHM8L2xhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmJvbGQnIGRhdGEtY2FzdD0nYm9vbGVhbidcbiAgICAgICAgICAgIG5hbWU9J29wdGlvbnMuYm9sZCcgdHlwZT0nY2hlY2tib3gnIGRlZmF1bHRDaGVja2VkPXtvcHRpb25zLmJvbGQgPT09IHRydWV9IC8+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstY2hlY2tib3hlc19fbGFiZWwnXG4gICAgICAgICAgICBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmJvbGQnPkJvbGQgbGFiZWxzPC9sYWJlbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBQYXJhRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCcgaHRtbEZvcj0ncGFyYS1jb250ZW50Jz5Db250ZW50PC9sYWJlbD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhlIGNvbnRlbnQgY2FuIGluY2x1ZGUgSFRNTCBhbmQgdGhlIGBnb3Z1ay1wcm9zZS1zY29wZWAgY3NzIGNsYXNzIGlzIGF2YWlsYWJsZS4gVXNlIHRoaXMgb24gYSB3cmFwcGluZyBlbGVtZW50IHRvIGFwcGx5IGRlZmF1bHQgZ292dWsgc3R5bGVzLjwvc3Bhbj5cbiAgICAgIDx0ZXh0YXJlYSBjbGFzc05hbWU9J2dvdnVrLXRleHRhcmVhJyBpZD0ncGFyYS1jb250ZW50JyBuYW1lPSdjb250ZW50J1xuICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5jb250ZW50fSByb3dzPScxMCcgcmVxdWlyZWQgLz5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5jb25zdCBJbnNldFRleHRFZGl0ID0gUGFyYUVkaXRcbmNvbnN0IEh0bWxFZGl0ID0gUGFyYUVkaXRcblxuZnVuY3Rpb24gRGV0YWlsc0VkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuXG4gIHJldHVybiAoXG4gICAgPGRpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCcgaHRtbEZvcj0nZGV0YWlscy10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2RldGFpbHMtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LnRpdGxlfSByZXF1aXJlZCAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J2RldGFpbHMtY29udGVudCc+Q29udGVudDwvbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhlIGNvbnRlbnQgY2FuIGluY2x1ZGUgSFRNTCBhbmQgdGhlIGBnb3Z1ay1wcm9zZS1zY29wZWAgY3NzIGNsYXNzIGlzIGF2YWlsYWJsZS4gVXNlIHRoaXMgb24gYSB3cmFwcGluZyBlbGVtZW50IHRvIGFwcGx5IGRlZmF1bHQgZ292dWsgc3R5bGVzLjwvc3Bhbj5cbiAgICAgICAgPHRleHRhcmVhIGNsYXNzTmFtZT0nZ292dWstdGV4dGFyZWEnIGlkPSdkZXRhaWxzLWNvbnRlbnQnIG5hbWU9J2NvbnRlbnQnXG4gICAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQuY29udGVudH0gcm93cz0nMTAnIHJlcXVpcmVkIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5jb25zdCBjb21wb25lbnRUeXBlRWRpdG9ycyA9IHtcbiAgJ1RleHRGaWVsZEVkaXQnOiBUZXh0RmllbGRFZGl0LFxuICAnRW1haWxBZGRyZXNzRmllbGRFZGl0JzogVGV4dEZpZWxkRWRpdCxcbiAgJ1RlbGVwaG9uZU51bWJlckZpZWxkRWRpdCc6IFRleHRGaWVsZEVkaXQsXG4gICdOdW1iZXJGaWVsZEVkaXQnOiBOdW1iZXJGaWVsZEVkaXQsXG4gICdNdWx0aWxpbmVUZXh0RmllbGRFZGl0JzogTXVsdGlsaW5lVGV4dEZpZWxkRWRpdCxcbiAgJ1NlbGVjdEZpZWxkRWRpdCc6IFNlbGVjdEZpZWxkRWRpdCxcbiAgJ1JhZGlvc0ZpZWxkRWRpdCc6IFJhZGlvc0ZpZWxkRWRpdCxcbiAgJ0NoZWNrYm94ZXNGaWVsZEVkaXQnOiBDaGVja2JveGVzRmllbGRFZGl0LFxuICAnUGFyYUVkaXQnOiBQYXJhRWRpdCxcbiAgJ0h0bWxFZGl0JzogSHRtbEVkaXQsXG4gICdJbnNldFRleHRFZGl0JzogSW5zZXRUZXh0RWRpdCxcbiAgJ0RldGFpbHNFZGl0JzogRGV0YWlsc0VkaXRcbn1cblxuY2xhc3MgQ29tcG9uZW50VHlwZUVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCB0eXBlID0gY29tcG9uZW50VHlwZXMuZmluZCh0ID0+IHQubmFtZSA9PT0gY29tcG9uZW50LnR5cGUpXG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgVGFnTmFtZSA9IGNvbXBvbmVudFR5cGVFZGl0b3JzW2Ake2NvbXBvbmVudC50eXBlfUVkaXRgXSB8fCBGaWVsZEVkaXRcbiAgICAgIHJldHVybiA8VGFnTmFtZSBjb21wb25lbnQ9e2NvbXBvbmVudH0gZGF0YT17ZGF0YX0gLz5cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50VHlwZUVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUsIGdldEZvcm1EYXRhIH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IENvbXBvbmVudFR5cGVFZGl0IGZyb20gJy4vY29tcG9uZW50LXR5cGUtZWRpdCdcblxuY2xhc3MgQ29tcG9uZW50RWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSwgY29tcG9uZW50IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZm9ybURhdGEgPSBnZXRGb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gcGFnZS5jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHNbY29tcG9uZW50SW5kZXhdID0gZm9ybURhdGFcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkNsaWNrRGVsZXRlID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoIXdpbmRvdy5jb25maXJtKCdDb25maXJtIGRlbGV0ZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvbXBvbmVudElkeCA9IHBhZ2UuY29tcG9uZW50cy5maW5kSW5kZXgoYyA9PiBjID09PSBjb21wb25lbnQpXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuICAgIGNvbnN0IGlzTGFzdCA9IGNvbXBvbmVudElkeCA9PT0gcGFnZS5jb21wb25lbnRzLmxlbmd0aCAtIDFcblxuICAgIC8vIFJlbW92ZSB0aGUgY29tcG9uZW50XG4gICAgY29weVBhZ2UuY29tcG9uZW50cy5zcGxpY2UoY29tcG9uZW50SWR4LCAxKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgaWYgKCFpc0xhc3QpIHtcbiAgICAgICAgICAvLyBXZSBkb250IGhhdmUgYW4gaWQgd2UgY2FuIHVzZSBmb3IgYGtleWAtaW5nIHJlYWN0IDxDb21wb25lbnQgLz4nc1xuICAgICAgICAgIC8vIFdlIHRoZXJlZm9yZSBuZWVkIHRvIGNvbmRpdGlvbmFsbHkgcmVwb3J0IGBvbkVkaXRgIGNoYW5nZXMuXG4gICAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGNvbXBvbmVudCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgY29weUNvbXAgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNvbXBvbmVudCkpXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGZvcm0gYXV0b0NvbXBsZXRlPSdvZmYnIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3R5cGUnPlR5cGU8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHknPntjb21wb25lbnQudHlwZX08L3NwYW4+XG4gICAgICAgICAgICA8aW5wdXQgaWQ9J3R5cGUnIHR5cGU9J2hpZGRlbicgbmFtZT0ndHlwZScgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQudHlwZX0gLz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxDb21wb25lbnRUeXBlRWRpdFxuICAgICAgICAgICAgcGFnZT17cGFnZX1cbiAgICAgICAgICAgIGNvbXBvbmVudD17Y29weUNvbXB9XG4gICAgICAgICAgICBkYXRhPXtkYXRhfSAvPlxuXG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdidXR0b24nIG9uQ2xpY2s9e3RoaXMub25DbGlja0RlbGV0ZX0+RGVsZXRlPC9idXR0b24+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnRFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgU29ydGFibGVIT0MgKi9cblxuaW1wb3J0IEZseW91dCBmcm9tICcuL2ZseW91dCdcbmltcG9ydCBDb21wb25lbnRFZGl0IGZyb20gJy4vY29tcG9uZW50LWVkaXQnXG5jb25zdCBTb3J0YWJsZUhhbmRsZSA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlSGFuZGxlXG5jb25zdCBEcmFnSGFuZGxlID0gU29ydGFibGVIYW5kbGUoKCkgPT4gPHNwYW4gY2xhc3NOYW1lPSdkcmFnLWhhbmRsZSc+JiM5Nzc2Ozwvc3Bhbj4pXG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRUeXBlcyA9IHtcbiAgJ1RleHRGaWVsZCc6IFRleHRGaWVsZCxcbiAgJ1RlbGVwaG9uZU51bWJlckZpZWxkJzogVGVsZXBob25lTnVtYmVyRmllbGQsXG4gICdOdW1iZXJGaWVsZCc6IE51bWJlckZpZWxkLFxuICAnRW1haWxBZGRyZXNzRmllbGQnOiBFbWFpbEFkZHJlc3NGaWVsZCxcbiAgJ1RpbWVGaWVsZCc6IFRpbWVGaWVsZCxcbiAgJ0RhdGVGaWVsZCc6IERhdGVGaWVsZCxcbiAgJ0RhdGVUaW1lRmllbGQnOiBEYXRlVGltZUZpZWxkLFxuICAnRGF0ZVBhcnRzRmllbGQnOiBEYXRlUGFydHNGaWVsZCxcbiAgJ0RhdGVUaW1lUGFydHNGaWVsZCc6IERhdGVUaW1lUGFydHNGaWVsZCxcbiAgJ011bHRpbGluZVRleHRGaWVsZCc6IE11bHRpbGluZVRleHRGaWVsZCxcbiAgJ1JhZGlvc0ZpZWxkJzogUmFkaW9zRmllbGQsXG4gICdDaGVja2JveGVzRmllbGQnOiBDaGVja2JveGVzRmllbGQsXG4gICdTZWxlY3RGaWVsZCc6IFNlbGVjdEZpZWxkLFxuICAnWWVzTm9GaWVsZCc6IFllc05vRmllbGQsXG4gICdVa0FkZHJlc3NGaWVsZCc6IFVrQWRkcmVzc0ZpZWxkLFxuICAnUGFyYSc6IFBhcmEsXG4gICdIdG1sJzogSHRtbCxcbiAgJ0luc2V0VGV4dCc6IEluc2V0VGV4dCxcbiAgJ0RldGFpbHMnOiBEZXRhaWxzXG59XG5cbmZ1bmN0aW9uIEJhc2UgKHByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5mdW5jdGlvbiBDb21wb25lbnRGaWVsZCAocHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gVGV4dEZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gVGVsZXBob25lTnVtYmVyRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggdGVsJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRW1haWxBZGRyZXNzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggZW1haWwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBVa0FkZHJlc3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3gnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2J1dHRvbiBzcXVhcmUnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBNdWx0aWxpbmVUZXh0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHRhbGwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBOdW1iZXJGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBudW1iZXInIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEYXRlRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggZHJvcGRvd24nPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHkgZ292dWstIS1mb250LXNpemUtMTQnPmRkL21tL3l5eXk8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVUaW1lRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggbGFyZ2UgZHJvcGRvd24nPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHkgZ292dWstIS1mb250LXNpemUtMTQnPmRkL21tL3l5eXkgaGg6bW08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFRpbWVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+aGg6bW08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVUaW1lUGFydHNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1sZWZ0LTEgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IG1lZGl1bSBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVBhcnRzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwgZ292dWstIS1tYXJnaW4tbGVmdC0xIGdvdnVrLSEtbWFyZ2luLXJpZ2h0LTEnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBtZWRpdW0nIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBSYWRpb3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBDaGVja2JveGVzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2hlY2snIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaGVjaycgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NoZWNrJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gU2VsZWN0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggZHJvcGRvd24nIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBZZXNOb0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERldGFpbHMgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAge2DilrYgYH08c3BhbiBjbGFzc05hbWU9J2xpbmUgZGV0YWlscycgLz5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gSW5zZXRUZXh0ICgpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdpbnNldCBnb3Z1ay0hLXBhZGRpbmctbGVmdC0yJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUnIC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lIHNob3J0IGdvdnVrLSEtbWFyZ2luLWJvdHRvbS0yIGdvdnVrLSEtbWFyZ2luLXRvcC0yJyAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBQYXJhICgpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUgc2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTIgZ292dWstIS1tYXJnaW4tdG9wLTInIC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gSHRtbCAoKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0naHRtbCc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSB4c2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTEgZ292dWstIS1tYXJnaW4tdG9wLTEnIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBzaG93RWRpdG9yID0gKGUsIHZhbHVlKSA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiB2YWx1ZSB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IFRhZ05hbWUgPSBjb21wb25lbnRUeXBlc1tgJHtjb21wb25lbnQudHlwZX1gXVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQgZ292dWstIS1wYWRkaW5nLTInXG4gICAgICAgICAgb25DbGljaz17KGUpID0+IHRoaXMuc2hvd0VkaXRvcihlLCB0cnVlKX0+XG4gICAgICAgICAgPERyYWdIYW5kbGUgLz5cbiAgICAgICAgICA8VGFnTmFtZSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBDb21wb25lbnQnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zaG93RWRpdG9yKGUsIGZhbHNlKX0+XG4gICAgICAgICAgPENvbXBvbmVudEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9IHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSwgZ2V0Rm9ybURhdGEgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgQ29tcG9uZW50VHlwZUVkaXQgZnJvbSAnLi9jb21wb25lbnQtdHlwZS1lZGl0J1xuLy8gaW1wb3J0IHsgY29tcG9uZW50VHlwZXMgYXMgY29tcG9uZW50VHlwZXNJY29ucyB9IGZyb20gJy4vY29tcG9uZW50J1xuaW1wb3J0IGNvbXBvbmVudFR5cGVzIGZyb20gJy4uL2NvbXBvbmVudC10eXBlcy5qcydcblxuY2xhc3MgQ29tcG9uZW50Q3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZm9ybURhdGEgPSBnZXRGb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMucHVzaChmb3JtRGF0YSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSd0eXBlJz5UeXBlPC9sYWJlbD5cbiAgICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSd0eXBlJyBuYW1lPSd0eXBlJyByZXF1aXJlZFxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgY29tcG9uZW50OiB7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0gfSl9PlxuICAgICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICAgIHtjb21wb25lbnRUeXBlcy5tYXAodHlwZSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXt0eXBlLm5hbWV9IHZhbHVlPXt0eXBlLm5hbWV9Pnt0eXBlLnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgey8qIHtPYmplY3Qua2V5cyhjb21wb25lbnRUeXBlc0ljb25zKS5tYXAodHlwZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IFRhZyA9IGNvbXBvbmVudFR5cGVzSWNvbnNbdHlwZV1cbiAgICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQgZ292dWstIS1wYWRkaW5nLTInPjxUYWcgLz48L2Rpdj5cbiAgICAgICAgICAgIH0pfSAqL31cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHt0aGlzLnN0YXRlLmNvbXBvbmVudCAmJiB0aGlzLnN0YXRlLmNvbXBvbmVudC50eXBlICYmIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxDb21wb25lbnRUeXBlRWRpdFxuICAgICAgICAgICAgICAgIHBhZ2U9e3BhZ2V9XG4gICAgICAgICAgICAgICAgY29tcG9uZW50PXt0aGlzLnN0YXRlLmNvbXBvbmVudH1cbiAgICAgICAgICAgICAgICBkYXRhPXtkYXRhfSAvPlxuXG4gICAgICAgICAgICAgIDxidXR0b24gdHlwZT0nc3VibWl0JyBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbic+U2F2ZTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cblxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50Q3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgU29ydGFibGVIT0MgKi9cblxuaW1wb3J0IEZseW91dCBmcm9tICcuL2ZseW91dCdcbmltcG9ydCBQYWdlRWRpdCBmcm9tICcuL3BhZ2UtZWRpdCdcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50J1xuaW1wb3J0IENvbXBvbmVudENyZWF0ZSBmcm9tICcuL2NvbXBvbmVudC1jcmVhdGUnXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNvbnN0IFNvcnRhYmxlRWxlbWVudCA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlRWxlbWVudFxuY29uc3QgU29ydGFibGVDb250YWluZXIgPSBTb3J0YWJsZUhPQy5Tb3J0YWJsZUNvbnRhaW5lclxuY29uc3QgYXJyYXlNb3ZlID0gU29ydGFibGVIT0MuYXJyYXlNb3ZlXG5cbmNvbnN0IFNvcnRhYmxlSXRlbSA9IFNvcnRhYmxlRWxlbWVudCgoeyBpbmRleCwgcGFnZSwgY29tcG9uZW50LCBkYXRhIH0pID0+XG4gIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQtaXRlbSc+XG4gICAgPENvbXBvbmVudCBrZXk9e2luZGV4fSBwYWdlPXtwYWdlfSBjb21wb25lbnQ9e2NvbXBvbmVudH0gZGF0YT17ZGF0YX0gLz5cbiAgPC9kaXY+XG4pXG5cbmNvbnN0IFNvcnRhYmxlTGlzdCA9IFNvcnRhYmxlQ29udGFpbmVyKCh7IHBhZ2UsIGRhdGEgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQtbGlzdCc+XG4gICAgICB7cGFnZS5jb21wb25lbnRzLm1hcCgoY29tcG9uZW50LCBpbmRleCkgPT4gKFxuICAgICAgICA8U29ydGFibGVJdGVtIGtleT17aW5kZXh9IGluZGV4PXtpbmRleH0gcGFnZT17cGFnZX0gY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gICAgICApKX1cbiAgICA8L2Rpdj5cbiAgKVxufSlcblxuY2xhc3MgUGFnZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBzaG93RWRpdG9yID0gKGUsIHZhbHVlKSA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiB2YWx1ZSB9KVxuICB9XG5cbiAgb25Tb3J0RW5kID0gKHsgb2xkSW5kZXgsIG5ld0luZGV4IH0pID0+IHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMgPSBhcnJheU1vdmUoY29weVBhZ2UuY29tcG9uZW50cywgb2xkSW5kZXgsIG5ld0luZGV4KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG5cbiAgICAvLyBPUFRJTUlTVElDIFNBVkUgVE8gU1RPUCBKVU1QXG5cbiAgICAvLyBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICAvLyBwYWdlLmNvbXBvbmVudHMgPSBhcnJheU1vdmUocGFnZS5jb21wb25lbnRzLCBvbGRJbmRleCwgbmV3SW5kZXgpXG5cbiAgICAvLyBkYXRhLnNhdmUoZGF0YSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhLCBmaWx0ZXJlZCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcbiAgICBjb25zdCBmb3JtQ29tcG9uZW50cyA9IHBhZ2UuY29tcG9uZW50cy5maWx0ZXIoY29tcCA9PiBjb21wb25lbnRUeXBlcy5maW5kKHR5cGUgPT4gdHlwZS5uYW1lID09PSBjb21wLnR5cGUpLnN1YlR5cGUgPT09ICdmaWVsZCcpXG4gICAgY29uc3QgcGFnZVRpdGxlID0gcGFnZS50aXRsZSB8fCAoZm9ybUNvbXBvbmVudHMubGVuZ3RoID09PSAxICYmIHBhZ2UuY29tcG9uZW50c1swXSA9PT0gZm9ybUNvbXBvbmVudHNbMF0gPyBmb3JtQ29tcG9uZW50c1swXS50aXRsZSA6IHBhZ2UudGl0bGUpXG4gICAgY29uc3Qgc2VjdGlvbiA9IHBhZ2Uuc2VjdGlvbiAmJiBzZWN0aW9ucy5maW5kKHNlY3Rpb24gPT4gc2VjdGlvbi5uYW1lID09PSBwYWdlLnNlY3Rpb24pXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD17cGFnZS5wYXRofSBjbGFzc05hbWU9e2BwYWdlJHtmaWx0ZXJlZCA/ICcgZmlsdGVyZWQnIDogJyd9YH0gdGl0bGU9e3BhZ2UucGF0aH0gc3R5bGU9e3RoaXMucHJvcHMubGF5b3V0fT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2hhbmRsZScgb25DbGljaz17KGUpID0+IHRoaXMuc2hvd0VkaXRvcihlLCB0cnVlKX0gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtcGFkZGluZy10b3AtMiBnb3Z1ay0hLXBhZGRpbmctbGVmdC0yIGdvdnVrLSEtcGFkZGluZy1yaWdodC0yJz5cblxuICAgICAgICAgIDxoMyBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctcyc+XG4gICAgICAgICAgICB7c2VjdGlvbiAmJiA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWNhcHRpb24tbSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+e3NlY3Rpb24udGl0bGV9PC9zcGFuPn1cbiAgICAgICAgICAgIHtwYWdlVGl0bGV9XG4gICAgICAgICAgPC9oMz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPFNvcnRhYmxlTGlzdCBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfSBwcmVzc0RlbGF5PXsyMDB9XG4gICAgICAgICAgb25Tb3J0RW5kPXt0aGlzLm9uU29ydEVuZH0gbG9ja0F4aXM9J3knIGhlbHBlckNsYXNzPSdkcmFnZ2luZydcbiAgICAgICAgICBsb2NrVG9Db250YWluZXJFZGdlcyB1c2VEcmFnSGFuZGxlIC8+XG4gICAgICAgIHsvKiB7cGFnZS5jb21wb25lbnRzLm1hcCgoY29tcCwgaW5kZXgpID0+IChcbiAgICAgICAgICA8Q29tcG9uZW50IGtleT17aW5kZXh9IHBhZ2U9e3BhZ2V9IGNvbXBvbmVudD17Y29tcH0gZGF0YT17ZGF0YX0gLz5cbiAgICAgICAgKSl9ICovfVxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctMic+XG4gICAgICAgICAgPGEgY2xhc3NOYW1lPSdwcmV2aWV3IHB1bGwtcmlnaHQgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICAgIGhyZWY9e3BhZ2UucGF0aH0gdGFyZ2V0PSdwcmV2aWV3Jz5PcGVuPC9hPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdidXR0b24gYWN0aXZlJ1xuICAgICAgICAgICAgb25DbGljaz17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogdHJ1ZSB9KX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBQYWdlJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0b3J9XG4gICAgICAgICAgb25IaWRlPXtlID0+IHRoaXMuc2hvd0VkaXRvcihlLCBmYWxzZSl9PlxuICAgICAgICAgIDxQYWdlRWRpdCBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIENvbXBvbmVudCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93QWRkQ29tcG9uZW50fVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRDb21wb25lbnQ6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8Q29tcG9uZW50Q3JlYXRlIHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkNyZWF0ZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBhZ2VcbiIsImNvbnN0IGxpc3RUeXBlcyA9IFsnU2VsZWN0RmllbGQnLCAnUmFkaW9zRmllbGQnLCAnQ2hlY2tib3hlc0ZpZWxkJ11cblxuZnVuY3Rpb24gY29tcG9uZW50VG9TdHJpbmcgKGNvbXBvbmVudCkge1xuICBpZiAofmxpc3RUeXBlcy5pbmRleE9mKGNvbXBvbmVudC50eXBlKSkge1xuICAgIHJldHVybiBgJHtjb21wb25lbnQudHlwZX08JHtjb21wb25lbnQub3B0aW9ucy5saXN0fT5gXG4gIH1cbiAgcmV0dXJuIGAke2NvbXBvbmVudC50eXBlfWBcbn1cblxuZnVuY3Rpb24gRGF0YU1vZGVsIChwcm9wcykge1xuICBjb25zdCB7IGRhdGEgfSA9IHByb3BzXG4gIGNvbnN0IHsgc2VjdGlvbnMsIHBhZ2VzIH0gPSBkYXRhXG5cbiAgY29uc3QgbW9kZWwgPSB7fVxuXG4gIHBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgcGFnZS5jb21wb25lbnRzLmZvckVhY2goY29tcG9uZW50ID0+IHtcbiAgICAgIGlmIChjb21wb25lbnQubmFtZSkge1xuICAgICAgICBpZiAocGFnZS5zZWN0aW9uKSB7XG4gICAgICAgICAgY29uc3Qgc2VjdGlvbiA9IHNlY3Rpb25zLmZpbmQoc2VjdGlvbiA9PiBzZWN0aW9uLm5hbWUgPT09IHBhZ2Uuc2VjdGlvbilcbiAgICAgICAgICBpZiAoIW1vZGVsW3NlY3Rpb24ubmFtZV0pIHtcbiAgICAgICAgICAgIG1vZGVsW3NlY3Rpb24ubmFtZV0gPSB7fVxuICAgICAgICAgIH1cblxuICAgICAgICAgIG1vZGVsW3NlY3Rpb24ubmFtZV1bY29tcG9uZW50Lm5hbWVdID0gY29tcG9uZW50VG9TdHJpbmcoY29tcG9uZW50KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1vZGVsW2NvbXBvbmVudC5uYW1lXSA9IGNvbXBvbmVudFRvU3RyaW5nKGNvbXBvbmVudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkobW9kZWwsIG51bGwsIDIpfTwvcHJlPlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IERhdGFNb2RlbFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgUGFnZUNyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IHBhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIC8vIFZhbGlkYXRlXG4gICAgaWYgKGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gcGF0aCkpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMucGF0aC5zZXRDdXN0b21WYWxpZGl0eShgUGF0aCAnJHtwYXRofScgYWxyZWFkeSBleGlzdHNgKVxuICAgICAgZm9ybS5yZXBvcnRWYWxpZGl0eSgpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9IHtcbiAgICAgIHBhdGg6IHBhdGhcbiAgICB9XG5cbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIHZhbHVlLnRpdGxlID0gdGl0bGVcbiAgICB9XG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIHZhbHVlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfVxuXG4gICAgLy8gQXBwbHlcbiAgICBPYmplY3QuYXNzaWduKHZhbHVlLCB7XG4gICAgICBjb21wb25lbnRzOiBbXSxcbiAgICAgIG5leHQ6IFtdXG4gICAgfSlcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29weS5wYWdlcy5wdXNoKHZhbHVlKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IHZhbHVlIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIC8vIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgLy8gICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gIC8vICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gIC8vICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gIC8vICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gIC8vICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgLy8gICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBMaXN0ICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBzZWN0aW9ucyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXBhdGgnPlBhdGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+RS5nLiAveW91ci1vY2N1cGF0aW9uIG9yIC9wZXJzb25hbC1kZXRhaWxzL2RhdGUtb2YtYmlydGg8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZFxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gZS50YXJnZXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtdGl0bGUnPlRpdGxlIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdwYWdlLXRpdGxlLWhpbnQnIGNsYXNzTmFtZT0nZ292dWstaGludCc+XG4gICAgICAgICAgICBJZiBub3Qgc3VwcGxpZWQsIHRoZSB0aXRsZSBvZiB0aGUgZmlyc3QgcXVlc3Rpb24gd2lsbCBiZSB1c2VkLlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3BhZ2UtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJz5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoc2VjdGlvbiA9PiAoPG9wdGlvbiBrZXk9e3NlY3Rpb24ubmFtZX0gdmFsdWU9e3NlY3Rpb24ubmFtZX0+e3NlY3Rpb24udGl0bGV9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gdHlwZT0nc3VibWl0JyBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbic+U2F2ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBMaW5rRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgY29uc3QgeyBkYXRhLCBlZGdlIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgcGFnZSA9IGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gZWRnZS5zb3VyY2UpXG4gICAgY29uc3QgbGluayA9IHBhZ2UubmV4dC5maW5kKG4gPT4gbi5wYXRoID09PSBlZGdlLnRhcmdldClcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBwYWdlOiBwYWdlLFxuICAgICAgbGluazogbGlua1xuICAgIH1cbiAgfVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGluayA9IGNvcHlQYWdlLm5leHQuZmluZChuID0+IG4ucGF0aCA9PT0gbGluay5wYXRoKVxuXG4gICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgY29weUxpbmsuaWYgPSBjb25kaXRpb25cbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlMaW5rLmlmXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGlua0lkeCA9IGNvcHlQYWdlLm5leHQuZmluZEluZGV4KG4gPT4gbi5wYXRoID09PSBsaW5rLnBhdGgpXG4gICAgY29weVBhZ2UubmV4dC5zcGxpY2UoY29weUxpbmtJZHgsIDEpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxpbmsgfSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGRhdGEsIGVkZ2UgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHBhZ2VzIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstc291cmNlJz5Gcm9tPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGRlZmF1bHRWYWx1ZT17ZWRnZS5zb3VyY2V9IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGluay1zb3VyY2UnIGRpc2FibGVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3BhZ2VzLm1hcChwYWdlID0+ICg8b3B0aW9uIGtleT17cGFnZS5wYXRofSB2YWx1ZT17cGFnZS5wYXRofT57cGFnZS5wYXRofTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstdGFyZ2V0Jz5UbzwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBkZWZhdWx0VmFsdWU9e2VkZ2UudGFyZ2V0fSBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstdGFyZ2V0JyBkaXNhYmxlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLWNvbmRpdGlvbic+Q29uZGl0aW9uIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdsaW5rLWNvbmRpdGlvbi1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgVGhlIGxpbmsgd2lsbCBvbmx5IGJlIHVzZWQgaWYgdGhlIGV4cHJlc3Npb24gZXZhbHVhdGVzIHRvIHRydXRoeS5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaW5rLWNvbmRpdGlvbicgbmFtZT0naWYnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpbmsuaWZ9IGFyaWEtZGVzY3JpYmVkYnk9J2xpbmstY29uZGl0aW9uLWhpbnQnIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlua0VkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIExpbmtDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBmcm9tID0gZm9ybURhdGEuZ2V0KCdwYXRoJylcbiAgICBjb25zdCB0byA9IGZvcm1EYXRhLmdldCgncGFnZScpXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IHBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IGZyb20pXG5cbiAgICBjb25zdCBuZXh0ID0geyBwYXRoOiB0byB9XG5cbiAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICBuZXh0LmlmID0gY29uZGl0aW9uXG4gICAgfVxuXG4gICAgaWYgKCFwYWdlLm5leHQpIHtcbiAgICAgIHBhZ2UubmV4dCA9IFtdXG4gICAgfVxuXG4gICAgcGFnZS5uZXh0LnB1c2gobmV4dClcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBuZXh0IH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXNvdXJjZSc+RnJvbTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstc291cmNlJyBuYW1lPSdwYXRoJyByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXRhcmdldCc+VG88L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaW5rLXRhcmdldCcgbmFtZT0ncGFnZScgcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7cGFnZXMubWFwKHBhZ2UgPT4gKDxvcHRpb24ga2V5PXtwYWdlLnBhdGh9IHZhbHVlPXtwYWdlLnBhdGh9PntwYWdlLnBhdGh9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay1jb25kaXRpb24nPkNvbmRpdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0nbGluay1jb25kaXRpb24taGludCcgY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5cbiAgICAgICAgICAgIFRoZSBsaW5rIHdpbGwgb25seSBiZSB1c2VkIGlmIHRoZSBleHByZXNzaW9uIGV2YWx1YXRlcyB0byB0cnV0aHkuXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGluay1jb25kaXRpb24nIG5hbWU9J2lmJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0nbGluay1jb25kaXRpb24taGludCcgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpbmtDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmZ1bmN0aW9uIGhlYWREdXBsaWNhdGUgKGFycikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGFyci5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGFycltqXSA9PT0gYXJyW2ldKSB7XG4gICAgICAgIHJldHVybiBqXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIExpc3RJdGVtcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpdGVtczogcHJvcHMuaXRlbXMgPyBjbG9uZShwcm9wcy5pdGVtcykgOiBbXVxuICAgIH1cbiAgfVxuXG4gIG9uQ2xpY2tBZGRJdGVtID0gZSA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5jb25jYXQoeyB0ZXh0OiAnJywgdmFsdWU6ICcnLCBkZXNjcmlwdGlvbjogJycgfSlcbiAgICB9KVxuICB9XG5cbiAgcmVtb3ZlSXRlbSA9IGlkeCA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5maWx0ZXIoKHMsIGkpID0+IGkgIT09IGlkeClcbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIGxpc3RcbiAgICBjb3B5Lmxpc3RzLnNwbGljZShkYXRhLmxpc3RzLmluZGV4T2YobGlzdCksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIGxpc3RcbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAubGlzdFxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyID0gZSA9PiB7XG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0LmZvcm1cbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcblxuICAgIC8vIE9ubHkgdmFsaWRhdGUgZHVwZXMgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBpdGVtXG4gICAgaWYgKHRleHRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGZvcm0uZWxlbWVudHMudGV4dC5mb3JFYWNoKGVsID0+IGVsLnNldEN1c3RvbVZhbGlkaXR5KCcnKSlcbiAgICBmb3JtLmVsZW1lbnRzLnZhbHVlLmZvckVhY2goZWwgPT4gZWwuc2V0Q3VzdG9tVmFsaWRpdHkoJycpKVxuXG4gICAgLy8gVmFsaWRhdGUgdW5pcXVlbmVzc1xuICAgIGNvbnN0IGR1cGVUZXh0ID0gaGVhZER1cGxpY2F0ZSh0ZXh0cylcbiAgICBpZiAoZHVwZVRleHQpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMudGV4dFtkdXBlVGV4dF0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB0ZXh0cyBmb3VuZCBpbiB0aGUgbGlzdCBpdGVtcycpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBkdXBlVmFsdWUgPSBoZWFkRHVwbGljYXRlKHZhbHVlcylcbiAgICBpZiAoZHVwZVZhbHVlKSB7XG4gICAgICBmb3JtLmVsZW1lbnRzLnZhbHVlW2R1cGVWYWx1ZV0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB2YWx1ZXMgZm91bmQgaW4gdGhlIGxpc3QgaXRlbXMnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBpdGVtcyB9ID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHsgdHlwZSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDx0YWJsZSBjbGFzc05hbWU9J2dvdnVrLXRhYmxlJz5cbiAgICAgICAgPGNhcHRpb24gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2FwdGlvbic+SXRlbXM8L2NhcHRpb24+XG4gICAgICAgIDx0aGVhZCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkJz5cbiAgICAgICAgICA8dHIgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93Jz5cbiAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkZXInIHNjb3BlPSdjb2wnPlRleHQ8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+VmFsdWU8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+RGVzY3JpcHRpb248L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17dGhpcy5vbkNsaWNrQWRkSXRlbX0+QWRkPC9hPlxuICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICA8L3RoZWFkPlxuICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fYm9keSc+XG4gICAgICAgICAge2l0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IChcbiAgICAgICAgICAgIDx0ciBrZXk9e2l0ZW0udmFsdWUgKyBpbmRleH0gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93JyBzY29wZT0ncm93Jz5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBuYW1lPSd0ZXh0J1xuICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnRleHR9IHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyfSAvPlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAge3R5cGUgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICA/IChcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J3ZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9J251bWJlcicgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IHN0ZXA9J2FueScgLz5cbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIDogKFxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgbmFtZT0ndmFsdWUnXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IC8+XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J2Rlc2NyaXB0aW9uJ1xuICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLmRlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1cn0gLz5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnIHdpZHRoPScyMHB4Jz5cbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J2xpc3QtaXRlbS1kZWxldGUnIG9uQ2xpY2s9eygpID0+IHRoaXMucmVtb3ZlSXRlbShpbmRleCl9PiYjMTI4NDY1OzwvYT5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0SXRlbXNcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICB0eXBlOiBwcm9wcy5saXN0LnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBuZXdUeXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gbGlzdC5uYW1lXG4gICAgY29uc3QgY29weUxpc3QgPSBjb3B5Lmxpc3RzW2RhdGEubGlzdHMuaW5kZXhPZihsaXN0KV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weUxpc3QubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIHAuY29tcG9uZW50cy5mb3JFYWNoKGMgPT4ge1xuICAgICAgICAgIGlmIChjLnR5cGUgPT09ICdTZWxlY3RGaWVsZCcgfHwgYy50eXBlID09PSAnUmFkaW9zRmllbGQnKSB7XG4gICAgICAgICAgICBpZiAoYy5vcHRpb25zICYmIGMub3B0aW9ucy5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgICAgICAgYy5vcHRpb25zLmxpc3QgPSBuZXdOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5TGlzdC50aXRsZSA9IG5ld1RpdGxlXG4gICAgY29weUxpc3QudHlwZSA9IG5ld1R5cGVcblxuICAgIC8vIEl0ZW1zXG4gICAgY29uc3QgdGV4dHMgPSBmb3JtRGF0YS5nZXRBbGwoJ3RleHQnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCB2YWx1ZXMgPSBmb3JtRGF0YS5nZXRBbGwoJ3ZhbHVlJykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29uc3QgZGVzY3JpcHRpb25zID0gZm9ybURhdGEuZ2V0QWxsKCdkZXNjcmlwdGlvbicpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvcHlMaXN0Lml0ZW1zID0gdGV4dHMubWFwKCh0LCBpKSA9PiAoe1xuICAgICAgdGV4dDogdCxcbiAgICAgIHZhbHVlOiB2YWx1ZXNbaV0sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25zW2ldXG4gIH0pKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgbGlzdCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBsaXN0XG4gICAgY29weS5saXN0cy5zcGxpY2UoZGF0YS5saXN0cy5pbmRleE9mKGxpc3QpLCAxKVxuXG4gICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAubGlzdCA9PT0gbGlzdC5uYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBwLmxpc3RcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwgIT09IGxpc3QgJiYgbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMjAnIGlkPSdsaXN0LW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstIS13aWR0aC10d28tdGhpcmRzJyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QudGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10eXBlJz5WYWx1ZSB0eXBlPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIGl0ZW1zPXtsaXN0Lml0ZW1zfSB0eXBlPXtzdGF0ZS50eXBlfSAvPlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdEVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdENyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIHR5cGU6IHByb3BzLnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB0eXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gSXRlbXNcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCBkZXNjcmlwdGlvbnMgPSBmb3JtRGF0YS5nZXRBbGwoJ2Rlc2NyaXB0aW9uJykubWFwKHQgPT4gdC50cmltKCkpXG5cbiAgICBjb25zdCBpdGVtcyA9IHRleHRzLm1hcCgodCwgaSkgPT4gKHtcbiAgICAgIHRleHQ6IHQsXG4gICAgICB2YWx1ZTogdmFsdWVzW2ldLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uc1tpXVxuICB9KSlcblxuICAgIGNvcHkubGlzdHMucHVzaCh7IG5hbWUsIHRpdGxlLCB0eXBlLCBpdGVtcyB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpc3QtbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtdHlwZSc+VmFsdWUgdHlwZTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIHR5cGU9e3N0YXRlLnR5cGV9IC8+XG5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IExpc3RFZGl0IGZyb20gJy4vbGlzdC1lZGl0J1xuaW1wb3J0IExpc3RDcmVhdGUgZnJvbSAnLi9saXN0LWNyZWF0ZSdcblxuY2xhc3MgTGlzdHNFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uQ2xpY2tMaXN0ID0gKGUsIGxpc3QpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbGlzdDogbGlzdFxuICAgIH0pXG4gIH1cblxuICBvbkNsaWNrQWRkTGlzdCA9IChlLCBsaXN0KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dBZGRMaXN0OiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBsaXN0cyB9ID0gZGF0YVxuICAgIGNvbnN0IGxpc3QgPSB0aGlzLnN0YXRlLmxpc3RcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstYm9keSc+XG4gICAgICAgIHshbGlzdCA/IChcbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAge3RoaXMuc3RhdGUuc2hvd0FkZExpc3QgPyAoXG4gICAgICAgICAgICAgIDxMaXN0Q3JlYXRlIGRhdGE9e2RhdGF9XG4gICAgICAgICAgICAgICAgb25DcmVhdGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaXN0OiBmYWxzZSB9KX1cbiAgICAgICAgICAgICAgICBvbkNhbmNlbD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpc3Q6IGZhbHNlIH0pfSAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT0nZ292dWstbGlzdCc+XG4gICAgICAgICAgICAgICAge2xpc3RzLm1hcCgobGlzdCwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgIDxsaSBrZXk9e2xpc3QubmFtZX0+XG4gICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5vbkNsaWNrTGlzdChlLCBsaXN0KX0+XG4gICAgICAgICAgICAgICAgICAgICAge2xpc3QudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgPGhyIC8+XG4gICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja0FkZExpc3QoZSl9PkFkZCBsaXN0PC9hPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxMaXN0RWRpdCBsaXN0PXtsaXN0fSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBsaXN0OiBudWxsIH0pfVxuICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IGxpc3Q6IG51bGwgfSl9IC8+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdHNFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBTZWN0aW9uRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gc2VjdGlvbi5uYW1lXG4gICAgY29uc3QgY29weVNlY3Rpb24gPSBjb3B5LnNlY3Rpb25zW2RhdGEuc2VjdGlvbnMuaW5kZXhPZihzZWN0aW9uKV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weVNlY3Rpb24ubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBzZWN0aW9uXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChwLnNlY3Rpb24gPT09IHNlY3Rpb24ubmFtZSkge1xuICAgICAgICAgIHAuc2VjdGlvbiA9IG5ld05hbWVcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5U2VjdGlvbi50aXRsZSA9IG5ld1RpdGxlXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIHNlY3Rpb25cbiAgICBjb3B5LnNlY3Rpb25zLnNwbGljZShkYXRhLnNlY3Rpb25zLmluZGV4T2Yoc2VjdGlvbiksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIHNlY3Rpb25cbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5zZWN0aW9uID09PSBzZWN0aW9uLm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAuc2VjdGlvblxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5zZWN0aW9ucy5maW5kKHMgPT4gcyAhPT0gc2VjdGlvbiAmJiBzLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTmFtZSAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nc2VjdGlvbi1uYW1lJyBuYW1lPSduYW1lJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtzZWN0aW9uLm5hbWV9IHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtzZWN0aW9uLnRpdGxlfSByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgU2VjdGlvbkNyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIGNvbnN0IHNlY3Rpb24gPSB7IG5hbWUsIHRpdGxlIH1cbiAgICBjb3B5LnNlY3Rpb25zLnB1c2goc2VjdGlvbilcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEuc2VjdGlvbnMuZmluZChzID0+IHMubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBOYW1lICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhpcyBpcyB1c2VkIGFzIGEgbmFtZXNwYWNlIGluIHRoZSBKU09OIG91dHB1dCBmb3IgYWxsIHBhZ2VzIGluIHRoaXMgc2VjdGlvbi4gVXNlIGBjYW1lbENhc2luZ2AgZS5nLiBjaGVja0JlZm9yZVN0YXJ0IG9yIHBlcnNvbmFsRGV0YWlscy48L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKydcbiAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJOYW1lfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5UaGlzIHRleHQgZGlzcGxheWVkIG9uIHRoZSBwYWdlIGFib3ZlIHRoZSBtYWluIHRpdGxlLjwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWQgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCBTZWN0aW9uRWRpdCBmcm9tICcuL3NlY3Rpb24tZWRpdCdcbmltcG9ydCBTZWN0aW9uQ3JlYXRlIGZyb20gJy4vc2VjdGlvbi1jcmVhdGUnXG5cbmNsYXNzIFNlY3Rpb25zRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrU2VjdGlvbiA9IChlLCBzZWN0aW9uKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlY3Rpb246IHNlY3Rpb25cbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0FkZFNlY3Rpb24gPSAoZSwgc2VjdGlvbikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzaG93QWRkU2VjdGlvbjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5zdGF0ZS5zZWN0aW9uXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWJvZHknPlxuICAgICAgICB7IXNlY3Rpb24gPyAoXG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIHt0aGlzLnN0YXRlLnNob3dBZGRTZWN0aW9uID8gKFxuICAgICAgICAgICAgICA8U2VjdGlvbkNyZWF0ZSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgICAgIG9uQ3JlYXRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkU2VjdGlvbjogZmFsc2UgfSl9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRTZWN0aW9uOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9J2dvdnVrLWxpc3QnPlxuICAgICAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoKHNlY3Rpb24sIGluZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8bGkga2V5PXtzZWN0aW9uLm5hbWV9PlxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja1NlY3Rpb24oZSwgc2VjdGlvbil9PlxuICAgICAgICAgICAgICAgICAgICAgIHtzZWN0aW9uLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgIDxociAvPlxuICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tBZGRTZWN0aW9uKGUpfT5BZGQgc2VjdGlvbjwvYT5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8U2VjdGlvbkVkaXQgc2VjdGlvbj17c2VjdGlvbn0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2VjdGlvbjogbnVsbCB9KX1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzZWN0aW9uOiBudWxsIH0pfSAvPlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlY3Rpb25zRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0IFJlYWN0RE9NIGRhZ3JlICovXG5cbmltcG9ydCBQYWdlIGZyb20gJy4vcGFnZSdcbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgRGF0YU1vZGVsIGZyb20gJy4vZGF0YS1tb2RlbCdcbmltcG9ydCBQYWdlQ3JlYXRlIGZyb20gJy4vcGFnZS1jcmVhdGUnXG5pbXBvcnQgTGlua0VkaXQgZnJvbSAnLi9saW5rLWVkaXQnXG5pbXBvcnQgTGlua0NyZWF0ZSBmcm9tICcuL2xpbmstY3JlYXRlJ1xuaW1wb3J0IExpc3RzRWRpdCBmcm9tICcuL2xpc3RzLWVkaXQnXG5pbXBvcnQgU2VjdGlvbnNFZGl0IGZyb20gJy4vc2VjdGlvbnMtZWRpdCdcblxuZnVuY3Rpb24gZ2V0TGF5b3V0IChwYWdlcywgZWwpIHtcbiAgLy8gQ3JlYXRlIGEgbmV3IGRpcmVjdGVkIGdyYXBoXG4gIHZhciBnID0gbmV3IGRhZ3JlLmdyYXBobGliLkdyYXBoKClcblxuICAvLyBTZXQgYW4gb2JqZWN0IGZvciB0aGUgZ3JhcGggbGFiZWxcbiAgZy5zZXRHcmFwaCh7XG4gICAgcmFua2RpcjogJ0xSJyxcbiAgICBtYXJnaW54OiA1MCxcbiAgICBtYXJnaW55OiAxNTAsXG4gICAgcmFua3NlcDogMTYwXG4gIH0pXG5cbiAgLy8gRGVmYXVsdCB0byBhc3NpZ25pbmcgYSBuZXcgb2JqZWN0IGFzIGEgbGFiZWwgZm9yIGVhY2ggbmV3IGVkZ2UuXG4gIGcuc2V0RGVmYXVsdEVkZ2VMYWJlbChmdW5jdGlvbiAoKSB7IHJldHVybiB7fSB9KVxuXG4gIC8vIEFkZCBub2RlcyB0byB0aGUgZ3JhcGguIFRoZSBmaXJzdCBhcmd1bWVudCBpcyB0aGUgbm9kZSBpZC4gVGhlIHNlY29uZCBpc1xuICAvLyBtZXRhZGF0YSBhYm91dCB0aGUgbm9kZS4gSW4gdGhpcyBjYXNlIHdlJ3JlIGdvaW5nIHRvIGFkZCBsYWJlbHMgdG8gZWFjaCBub2RlXG4gIHBhZ2VzLmZvckVhY2goKHBhZ2UsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgcGFnZUVsID0gZWwuY2hpbGRyZW5baW5kZXhdXG5cbiAgICBnLnNldE5vZGUocGFnZS5wYXRoLCB7IGxhYmVsOiBwYWdlLnBhdGgsIHdpZHRoOiBwYWdlRWwub2Zmc2V0V2lkdGgsIGhlaWdodDogcGFnZUVsLm9mZnNldEhlaWdodCB9KVxuICB9KVxuXG4gIC8vIEFkZCBlZGdlcyB0byB0aGUgZ3JhcGguXG4gIHBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFnZS5uZXh0KSkge1xuICAgICAgcGFnZS5uZXh0LmZvckVhY2gobmV4dCA9PiB7XG4gICAgICAgIC8vIFRoZSBsaW5rZWQgbm9kZSAobmV4dCBwYWdlKSBtYXkgbm90IGV4aXN0IGlmIGl0J3MgZmlsdGVyZWRcbiAgICAgICAgY29uc3QgZXhpc3RzID0gcGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gbmV4dC5wYXRoKVxuICAgICAgICBpZiAoZXhpc3RzKSB7XG4gICAgICAgICAgZy5zZXRFZGdlKHBhZ2UucGF0aCwgbmV4dC5wYXRoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBkYWdyZS5sYXlvdXQoZylcblxuICBjb25zdCBwb3MgPSB7XG4gICAgbm9kZXM6IFtdLFxuICAgIGVkZ2VzOiBbXVxuICB9XG5cbiAgY29uc3Qgb3V0cHV0ID0gZy5ncmFwaCgpXG4gIHBvcy53aWR0aCA9IG91dHB1dC53aWR0aCArICdweCdcbiAgcG9zLmhlaWdodCA9IG91dHB1dC5oZWlnaHQgKyAncHgnXG4gIGcubm9kZXMoKS5mb3JFYWNoKCh2LCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IG5vZGUgPSBnLm5vZGUodilcbiAgICBjb25zdCBwdCA9IHsgbm9kZSB9XG4gICAgcHQudG9wID0gKG5vZGUueSAtIG5vZGUuaGVpZ2h0IC8gMikgKyAncHgnXG4gICAgcHQubGVmdCA9IChub2RlLnggLSBub2RlLndpZHRoIC8gMikgKyAncHgnXG4gICAgcG9zLm5vZGVzLnB1c2gocHQpXG4gIH0pXG5cbiAgZy5lZGdlcygpLmZvckVhY2goKGUsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgZWRnZSA9IGcuZWRnZShlKVxuICAgIHBvcy5lZGdlcy5wdXNoKHtcbiAgICAgIHNvdXJjZTogZS52LFxuICAgICAgdGFyZ2V0OiBlLncsXG4gICAgICBwb2ludHM6IGVkZ2UucG9pbnRzLm1hcChwID0+IHtcbiAgICAgICAgY29uc3QgcHQgPSB7fVxuICAgICAgICBwdC55ID0gcC55XG4gICAgICAgIHB0LnggPSBwLnhcbiAgICAgICAgcmV0dXJuIHB0XG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgcmV0dXJuIHsgZywgcG9zIH1cbn1cblxuY2xhc3MgTGluZXMgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgZWRpdExpbmsgPSAoZWRnZSkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdjbGlja2VkJywgZWRnZSlcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dFZGl0b3I6IGVkZ2VcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxheW91dCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxzdmcgaGVpZ2h0PXtsYXlvdXQuaGVpZ2h0fSB3aWR0aD17bGF5b3V0LndpZHRofT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYXlvdXQuZWRnZXMubWFwKGVkZ2UgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBwb2ludHMgPSBlZGdlLnBvaW50cy5tYXAocG9pbnRzID0+IGAke3BvaW50cy54fSwke3BvaW50cy55fWApLmpvaW4oJyAnKVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxnIGtleT17cG9pbnRzfT5cbiAgICAgICAgICAgICAgICAgIDxwb2x5bGluZVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLmVkaXRMaW5rKGVkZ2UpfVxuICAgICAgICAgICAgICAgICAgICBwb2ludHM9e3BvaW50c30gLz5cbiAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICA8L3N2Zz5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IExpbmsnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8TGlua0VkaXQgZWRnZT17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgTWluaW1hcCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrUGFnZSA9IChlLCBwYXRoKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMudG9nZ2xlRmlsdGVyUGF0aChwYXRoKVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxheW91dCwgc2NhbGUgPSAwLjA1IH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J21pbmltYXAnPlxuICAgICAgICA8c3ZnIGhlaWdodD17cGFyc2VGbG9hdChsYXlvdXQuaGVpZ2h0KSAqIHNjYWxlfSB3aWR0aD17cGFyc2VGbG9hdChsYXlvdXQud2lkdGgpICogc2NhbGV9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5lZGdlcy5tYXAoZWRnZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHBvaW50cyA9IGVkZ2UucG9pbnRzLm1hcChwb2ludHMgPT4gYCR7cG9pbnRzLnggKiBzY2FsZX0sJHtwb2ludHMueSAqIHNjYWxlfWApLmpvaW4oJyAnKVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxnIGtleT17cG9pbnRzfT5cbiAgICAgICAgICAgICAgICAgIDxwb2x5bGluZSBwb2ludHM9e3BvaW50c30gLz5cbiAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5ub2Rlcy5tYXAoKG5vZGUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGcga2V5PXtub2RlICsgaW5kZXh9PlxuICAgICAgICAgICAgICAgICAgPGEgeGxpbmtIcmVmPXtgIyR7bm9kZS5ub2RlLmxhYmVsfWB9PlxuICAgICAgICAgICAgICAgICAgICA8cmVjdCB4PXtwYXJzZUZsb2F0KG5vZGUubGVmdCkgKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICB5PXtwYXJzZUZsb2F0KG5vZGUudG9wKSAqIHNjYWxlfVxuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXtub2RlLm5vZGUud2lkdGggKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9e25vZGUubm9kZS5oZWlnaHQgKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bm9kZS5ub2RlLmxhYmVsfSAvPlxuICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgIDwvZz5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIDwvc3ZnPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIFZpc3VhbGlzYXRpb24gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHtcbiAgICBmaWx0ZXJQYXRoczogW11cbiAgfVxuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5yZWYgPSBSZWFjdC5jcmVhdGVSZWYoKVxuICB9XG5cbiAgc2NoZWR1bGVMYXlvdXQgKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc3QgcGFnZXMgPSB0aGlzLmdldEZpbHRlcmVkUGFnZXMoKVxuICAgICAgY29uc3QgbGF5b3V0ID0gZ2V0TGF5b3V0KHBhZ2VzLCB0aGlzLnJlZi5jdXJyZW50KVxuXG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgbGF5b3V0OiBsYXlvdXQucG9zXG4gICAgICB9KVxuICAgIH0sIDIwMClcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50ICgpIHtcbiAgICB0aGlzLnNjaGVkdWxlTGF5b3V0KClcbiAgfVxuXG4gIGdldEZpbHRlcmVkUGFnZXMgKCkge1xuICAgIGNvbnN0IGluY2x1ZGVVcHN0cmVhbSA9IHRydWVcbiAgICBjb25zdCBpbmNsdWRlRG93bnN0cmVhbSA9IHRydWVcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IGZpbHRlclBhdGhzIH0gPSB0aGlzLnN0YXRlXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgaWYgKCFmaWx0ZXJQYXRocy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBwYWdlc1xuICAgIH1cblxuICAgIGNvbnN0IGZpbHRlcmVkUGFnZXMgPSBmaWx0ZXJQYXRocy5tYXAocGF0aCA9PiBwYWdlcy5maW5kKHBhZ2UgPT4gcGFnZS5wYXRoID09PSBwYXRoKSlcblxuICAgIC8vIFVwc3RyZWFtIHBhdGhzXG4gICAgY29uc3QgdXBzdHJlYW1QYXRocyA9IHt9XG5cbiAgICBpZiAoaW5jbHVkZVVwc3RyZWFtKSB7XG4gICAgICBmaWx0ZXJlZFBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhZ2UubmV4dCkpIHtcbiAgICAgICAgICBwYWdlLm5leHQuZm9yRWFjaChuZXh0ID0+IHtcbiAgICAgICAgICAgIHVwc3RyZWFtUGF0aHNbbmV4dC5wYXRoXSA9IHRydWVcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIERvd25zdHJlYW0gcGF0aHNcbiAgICBjb25zdCBkb3duc3RyZWFtUGF0aHMgPSB7fVxuXG4gICAgaWYgKGluY2x1ZGVEb3duc3RyZWFtKSB7XG4gICAgICBwYWdlcy5mb3JFYWNoKHBhZ2UgPT4ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYWdlLm5leHQpKSB7XG4gICAgICAgICAgcGFnZS5uZXh0LmZvckVhY2gobmV4dCA9PiB7XG4gICAgICAgICAgICBpZiAoZmlsdGVyUGF0aHMuaW5jbHVkZXMobmV4dC5wYXRoKSkge1xuICAgICAgICAgICAgICBkb3duc3RyZWFtUGF0aHNbcGFnZS5wYXRoXSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IGZpbHRlciA9IChwYWdlKSA9PiB7XG4gICAgICByZXR1cm4gZmlsdGVyUGF0aHMuaW5jbHVkZXMocGFnZS5wYXRoKSB8fFxuICAgICAgICB1cHN0cmVhbVBhdGhzW3BhZ2UucGF0aF0gfHxcbiAgICAgICAgZG93bnN0cmVhbVBhdGhzW3BhZ2UucGF0aF1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YS5wYWdlcy5maWx0ZXIoZmlsdGVyKVxuICB9XG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyAoKSB7XG4gICAgdGhpcy5zY2hlZHVsZUxheW91dCgpXG4gIH1cblxuICB0b2dnbGVGaWx0ZXJQYXRoID0gKHBhdGgpID0+IHtcbiAgICBjb25zdCB7IGZpbHRlclBhdGhzIH0gPSB0aGlzLnN0YXRlXG4gICAgY29uc3QgaWR4ID0gZmlsdGVyUGF0aHMuaW5kZXhPZihwYXRoKVxuXG4gICAgaWYgKGlkeCA+IC0xKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgZmlsdGVyUGF0aHM6IGZpbHRlclBhdGhzLmZpbHRlcigoaXRlbSwgaW5kZXgpID0+IGluZGV4ID09PSBpZHgpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgZmlsdGVyUGF0aHM6IGZpbHRlclBhdGhzLmNvbmNhdChwYXRoKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLnNjaGVkdWxlTGF5b3V0KClcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBmaWx0ZXJQYXRocyB9ID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHBhZ2VzID0gdGhpcy5nZXRGaWx0ZXJlZFBhZ2VzKClcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHJlZj17dGhpcy5yZWZ9IGNsYXNzTmFtZT0ndmlzdWFsaXNhdGlvbicgc3R5bGU9e3RoaXMuc3RhdGUubGF5b3V0ICYmXG4gICAgICAgIHsgd2lkdGg6IHRoaXMuc3RhdGUubGF5b3V0LndpZHRoLCBoZWlnaHQ6IHRoaXMuc3RhdGUubGF5b3V0LmhlaWdodCB9fT5cbiAgICAgICAge3BhZ2VzLm1hcCgocGFnZSwgaW5kZXgpID0+IDxQYWdlXG4gICAgICAgICAga2V5PXtpbmRleH0gZGF0YT17ZGF0YX0gcGFnZT17cGFnZX0gZmlsdGVyZWQ9eyFmaWx0ZXJQYXRocy5pbmNsdWRlcyhwYWdlLnBhdGgpfVxuICAgICAgICAgIGxheW91dD17dGhpcy5zdGF0ZS5sYXlvdXQgJiYgdGhpcy5zdGF0ZS5sYXlvdXQubm9kZXNbaW5kZXhdfSAvPlxuICAgICAgICApfVxuICAgICAgICB7dGhpcy5zdGF0ZS5sYXlvdXQgJiZcbiAgICAgICAgICA8TGluZXMgbGF5b3V0PXt0aGlzLnN0YXRlLmxheW91dH0gZGF0YT17ZGF0YX0gLz59XG5cbiAgICAgICAge3RoaXMuc3RhdGUubGF5b3V0ICYmXG4gICAgICAgICAgPE1pbmltYXAgbGF5b3V0PXt0aGlzLnN0YXRlLmxheW91dH0gZGF0YT17ZGF0YX0gLz59XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgTWVudSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge1xuICAgIHRhYjogJ21vZGVsJ1xuICB9XG5cbiAgb25DbGlja1VwbG9hZCA9IChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VwbG9hZCcpLmNsaWNrKClcbiAgfVxuXG4gIG9uRmlsZVVwbG9hZCA9IChlKSA9PiB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZmlsZSA9IGUudGFyZ2V0LmZpbGVzLml0ZW0oMClcbiAgICBjb25zdCByZWFkZXIgPSBuZXcgd2luZG93LkZpbGVSZWFkZXIoKVxuICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUsICdVVEYtOCcpXG4gICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBKU09OLnBhcnNlKGV2dC50YXJnZXQucmVzdWx0KVxuICAgICAgZGF0YS5zYXZlKGNvbnRlbnQpXG4gICAgfVxuICB9XG5cbiAgc2V0VGFiIChlLCBuYW1lKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgdGhpcy5zZXRTdGF0ZSh7IHRhYjogbmFtZSB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEsIHBsYXlncm91bmRNb2RlIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J21lbnUnPlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT17YGdvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCR7dGhpcy5zdGF0ZS5zaG93TWVudSA/ICcgZ292dWstIS1tYXJnaW4tcmlnaHQtMicgOiAnJ31gfVxuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93TWVudTogIXRoaXMuc3RhdGUuc2hvd01lbnUgfSl9PuKYsDwvYnV0dG9uPlxuICAgICAgICB7dGhpcy5zdGF0ZS5zaG93TWVudSAmJiA8c3BhbiBjbGFzc05hbWU9J21lbnUtaW5uZXInPlxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFBhZ2U6IHRydWUgfSl9PkFkZCBQYWdlPC9idXR0b24+eycgJ31cblxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpbms6IHRydWUgfSl9PkFkZCBMaW5rPC9idXR0b24+eycgJ31cblxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRTZWN0aW9uczogdHJ1ZSB9KX0+RWRpdCBTZWN0aW9uczwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0TGlzdHM6IHRydWUgfSl9PkVkaXQgTGlzdHM8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93U3VtbWFyeTogdHJ1ZSB9KX0+U3VtbWFyeTwvYnV0dG9uPlxuXG4gICAgICAgICAge3BsYXlncm91bmRNb2RlICYmIChcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi10b3AtNCc+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0nZ292dWstbGluayBnb3Z1ay1saW5rLS1uby12aXNpdGVkLXN0YXRlIGdvdnVrLSEtZm9udC1zaXplLTE2JyBkb3dubG9hZCBocmVmPScvYXBpL2RhdGE/Zm9ybWF0PXRydWUnPkRvd25sb2FkIEpTT048L2E+eycgJ31cbiAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdnb3Z1ay1saW5rIGdvdnVrLWxpbmstLW5vLXZpc2l0ZWQtc3RhdGUgZ292dWstIS1mb250LXNpemUtMTYnIGhyZWY9JyMnIG9uQ2xpY2s9e3RoaXMub25DbGlja1VwbG9hZH0+VXBsb2FkIEpTT048L2E+eycgJ31cbiAgICAgICAgICAgICAgPGlucHV0IHR5cGU9J2ZpbGUnIGlkPSd1cGxvYWQnIGhpZGRlbiBvbkNoYW5nZT17dGhpcy5vbkZpbGVVcGxvYWR9IC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIFBhZ2UnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0FkZFBhZ2V9XG4gICAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkUGFnZTogZmFsc2UgfSl9PlxuICAgICAgICAgICAgPFBhZ2VDcmVhdGUgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkUGFnZTogZmFsc2UgfSl9IC8+XG4gICAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgICA8Rmx5b3V0IHRpdGxlPSdBZGQgTGluaycgc2hvdz17dGhpcy5zdGF0ZS5zaG93QWRkTGlua31cbiAgICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaW5rOiBmYWxzZSB9KX0+XG4gICAgICAgICAgICA8TGlua0NyZWF0ZSBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaW5rOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgU2VjdGlvbnMnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRTZWN0aW9uc31cbiAgICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0U2VjdGlvbnM6IGZhbHNlIH0pfT5cbiAgICAgICAgICAgIDxTZWN0aW9uc0VkaXQgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdFNlY3Rpb25zOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgTGlzdHMnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRMaXN0c31cbiAgICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0TGlzdHM6IGZhbHNlIH0pfSB3aWR0aD0neGxhcmdlJz5cbiAgICAgICAgICAgIDxMaXN0c0VkaXQgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdExpc3RzOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICAgIDxGbHlvdXQgdGl0bGU9J1N1bW1hcnknIHNob3c9e3RoaXMuc3RhdGUuc2hvd1N1bW1hcnl9IHdpZHRoPSdsYXJnZSdcbiAgICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dTdW1tYXJ5OiBmYWxzZSB9KX0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nanMtZW5hYmxlZCcgc3R5bGU9e3sgcGFkZGluZ1RvcDogJzNweCcgfX0+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay10YWJzJyBkYXRhLW1vZHVsZT0ndGFicyc+XG4gICAgICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT0nZ292dWstdGFic19fdGl0bGUnPlN1bW1hcnk8L2gyPlxuICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9J2dvdnVrLXRhYnNfX2xpc3QnPlxuICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT0nZ292dWstdGFic19fbGlzdC1pdGVtJz5cbiAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdnb3Z1ay10YWJzX190YWInIGhyZWY9JyMnXG4gICAgICAgICAgICAgICAgICAgICAgYXJpYS1zZWxlY3RlZD17dGhpcy5zdGF0ZS50YWIgPT09ICdtb2RlbCcgPyAndHJ1ZScgOiAnZmFsc2UnfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2UgPT4gdGhpcy5zZXRUYWIoZSwgJ21vZGVsJyl9PkRhdGEgTW9kZWw8L2E+XG4gICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT0nZ292dWstdGFic19fbGlzdC1pdGVtJz5cbiAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdnb3Z1ay10YWJzX190YWInIGhyZWY9JyMnXG4gICAgICAgICAgICAgICAgICAgICAgYXJpYS1zZWxlY3RlZD17dGhpcy5zdGF0ZS50YWIgPT09ICdqc29uJyA/ICd0cnVlJyA6ICdmYWxzZSd9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17ZSA9PiB0aGlzLnNldFRhYihlLCAnanNvbicpfT5KU09OPC9hPlxuICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9J2dvdnVrLXRhYnNfX2xpc3QtaXRlbSc+XG4gICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0nZ292dWstdGFic19fdGFiJyBocmVmPScjJ1xuICAgICAgICAgICAgICAgICAgICAgIGFyaWEtc2VsZWN0ZWQ9e3RoaXMuc3RhdGUudGFiID09PSAnc3VtbWFyeScgPyAndHJ1ZScgOiAnZmFsc2UnfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2UgPT4gdGhpcy5zZXRUYWIoZSwgJ3N1bW1hcnknKX0+U3VtbWFyeTwvYT5cbiAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICAgICB7dGhpcy5zdGF0ZS50YWIgPT09ICdtb2RlbCcgJiZcbiAgICAgICAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT0nZ292dWstdGFic19fcGFuZWwnPlxuICAgICAgICAgICAgICAgICAgICA8RGF0YU1vZGVsIGRhdGE9e2RhdGF9IC8+XG4gICAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLnRhYiA9PT0gJ2pzb24nICYmXG4gICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9J2dvdnVrLXRhYnNfX3BhbmVsJz5cbiAgICAgICAgICAgICAgICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMil9PC9wcmU+XG4gICAgICAgICAgICAgICAgICA8L3NlY3Rpb24+XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHt0aGlzLnN0YXRlLnRhYiA9PT0gJ3N1bW1hcnknICYmXG4gICAgICAgICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9J2dvdnVrLXRhYnNfX3BhbmVsJz5cbiAgICAgICAgICAgICAgICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkoZGF0YS5wYWdlcy5tYXAocGFnZSA9PiBwYWdlLnBhdGgpLCBudWxsLCAyKX08L3ByZT5cbiAgICAgICAgICAgICAgICAgIDwvc2VjdGlvbj5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9GbHlvdXQ+XG4gICAgICAgIDwvc3Bhbj5cbiAgICAgICAgfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIEFwcCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBjb21wb25lbnRXaWxsTW91bnQgKCkge1xuICAgIHdpbmRvdy5mZXRjaCgnL2FwaS9kYXRhJykudGhlbihyZXMgPT4gcmVzLmpzb24oKSkudGhlbihkYXRhID0+IHtcbiAgICAgIGRhdGEuc2F2ZSA9IHRoaXMuc2F2ZVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxvYWRlZDogdHJ1ZSwgZGF0YSB9KVxuICAgIH0pXG4gIH1cblxuICBzYXZlID0gKHVwZGF0ZWREYXRhKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5mZXRjaChgL2FwaS9kYXRhYCwge1xuICAgICAgbWV0aG9kOiAncHV0JyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHVwZGF0ZWREYXRhKVxuICAgIH0pLnRoZW4ocmVzID0+IHtcbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHRocm93IEVycm9yKHJlcy5zdGF0dXNUZXh0KVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc1xuICAgIH0pLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpLnRoZW4oZGF0YSA9PiB7XG4gICAgICBkYXRhLnNhdmUgPSB0aGlzLnNhdmVcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBkYXRhIH0pXG5cbiAgICAgIC8vIFJlbG9hZCBmcmFtZSBpZiBzcGxpdCBzY3JlZW4gYW5kIGluIHBsYXlncm91bmQgbW9kZVxuICAgICAgaWYgKHdpbmRvdy5ERkJELnBsYXlncm91bmRNb2RlKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHdpbmRvdy5wYXJlbnRcbiAgICAgICAgaWYgKHBhcmVudC5sb2NhdGlvbi5wYXRobmFtZSA9PT0gJy9zcGxpdCcpIHtcbiAgICAgICAgICBjb25zdCBmcmFtZXMgPSB3aW5kb3cucGFyZW50LmZyYW1lc1xuXG4gICAgICAgICAgaWYgKGZyYW1lcy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgICAgIGNvbnN0IHByZXZpZXcgPSB3aW5kb3cucGFyZW50LmZyYW1lc1sxXVxuICAgICAgICAgICAgcHJldmlldy5sb2NhdGlvbi5yZWxvYWQoKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gZGF0YVxuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIHdpbmRvdy5hbGVydCgnU2F2ZSBmYWlsZWQnKVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmxvYWRlZCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBpZD0nYXBwJz5cbiAgICAgICAgICA8TWVudSBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IHBsYXlncm91bmRNb2RlPXt3aW5kb3cuREZCRC5wbGF5Z3JvdW5kTW9kZX0gLz5cbiAgICAgICAgICA8VmlzdWFsaXNhdGlvbiBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gPGRpdj5Mb2FkaW5nLi4uPC9kaXY+XG4gICAgfVxuICB9XG59XG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPEFwcCAvPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKVxuKVxuIl0sIm5hbWVzIjpbIkZseW91dCIsInByb3BzIiwic2hvdyIsIndpZHRoIiwib25IaWRlIiwiZSIsInRpdGxlIiwiY2hpbGRyZW4iLCJnZXRGb3JtRGF0YSIsImZvcm0iLCJmb3JtRGF0YSIsIndpbmRvdyIsIkZvcm1EYXRhIiwiZGF0YSIsIm9wdGlvbnMiLCJzY2hlbWEiLCJjYXN0IiwibmFtZSIsInZhbCIsImVsIiwiZWxlbWVudHMiLCJkYXRhc2V0IiwidW5kZWZpbmVkIiwiTnVtYmVyIiwiZm9yRWFjaCIsInZhbHVlIiwia2V5Iiwib3B0aW9uc1ByZWZpeCIsInNjaGVtYVByZWZpeCIsInRyaW0iLCJzdGFydHNXaXRoIiwicmVxdWlyZWQiLCJzdWJzdHIiLCJsZW5ndGgiLCJPYmplY3QiLCJrZXlzIiwiY2xvbmUiLCJvYmoiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJQYWdlRWRpdCIsInN0YXRlIiwib25TdWJtaXQiLCJwcmV2ZW50RGVmYXVsdCIsInRhcmdldCIsIm5ld1BhdGgiLCJnZXQiLCJzZWN0aW9uIiwicGFnZSIsImNvcHkiLCJwYXRoQ2hhbmdlZCIsInBhdGgiLCJjb3B5UGFnZSIsInBhZ2VzIiwiaW5kZXhPZiIsImZpbmQiLCJwIiwic2V0Q3VzdG9tVmFsaWRpdHkiLCJyZXBvcnRWYWxpZGl0eSIsIkFycmF5IiwiaXNBcnJheSIsIm5leHQiLCJuIiwic2F2ZSIsInRoZW4iLCJjb25zb2xlIiwibG9nIiwib25FZGl0IiwiY2F0Y2giLCJlcnJvciIsImVyciIsIm9uQ2xpY2tEZWxldGUiLCJjb25maXJtIiwiY29weVBhZ2VJZHgiLCJmaW5kSW5kZXgiLCJpbmRleCIsImkiLCJzcGxpY2UiLCJzZWN0aW9ucyIsIm1hcCIsIlJlYWN0IiwiQ29tcG9uZW50IiwiY29tcG9uZW50VHlwZXMiLCJzdWJUeXBlIiwiQ2xhc3NlcyIsImNvbXBvbmVudCIsImNsYXNzZXMiLCJGaWVsZEVkaXQiLCJoaW50IiwiVGV4dEZpZWxkRWRpdCIsIm1heCIsIm1pbiIsIk11bHRpbGluZVRleHRGaWVsZEVkaXQiLCJyb3dzIiwiTnVtYmVyRmllbGRFZGl0IiwiaW50ZWdlciIsIlNlbGVjdEZpZWxkRWRpdCIsImxpc3RzIiwibGlzdCIsIlJhZGlvc0ZpZWxkRWRpdCIsImJvbGQiLCJDaGVja2JveGVzRmllbGRFZGl0IiwiUGFyYUVkaXQiLCJjb250ZW50IiwiSW5zZXRUZXh0RWRpdCIsIkh0bWxFZGl0IiwiRGV0YWlsc0VkaXQiLCJjb21wb25lbnRUeXBlRWRpdG9ycyIsIkNvbXBvbmVudFR5cGVFZGl0IiwidHlwZSIsInQiLCJUYWdOYW1lIiwiQ29tcG9uZW50RWRpdCIsImNvbXBvbmVudEluZGV4IiwiY29tcG9uZW50cyIsImNvbXBvbmVudElkeCIsImMiLCJpc0xhc3QiLCJjb3B5Q29tcCIsIlNvcnRhYmxlSGFuZGxlIiwiU29ydGFibGVIT0MiLCJEcmFnSGFuZGxlIiwiVGV4dEZpZWxkIiwiVGVsZXBob25lTnVtYmVyRmllbGQiLCJOdW1iZXJGaWVsZCIsIkVtYWlsQWRkcmVzc0ZpZWxkIiwiVGltZUZpZWxkIiwiRGF0ZUZpZWxkIiwiRGF0ZVRpbWVGaWVsZCIsIkRhdGVQYXJ0c0ZpZWxkIiwiRGF0ZVRpbWVQYXJ0c0ZpZWxkIiwiTXVsdGlsaW5lVGV4dEZpZWxkIiwiUmFkaW9zRmllbGQiLCJDaGVja2JveGVzRmllbGQiLCJTZWxlY3RGaWVsZCIsIlllc05vRmllbGQiLCJVa0FkZHJlc3NGaWVsZCIsIlBhcmEiLCJIdG1sIiwiSW5zZXRUZXh0IiwiRGV0YWlscyIsIkJhc2UiLCJDb21wb25lbnRGaWVsZCIsInNob3dFZGl0b3IiLCJzdG9wUHJvcGFnYXRpb24iLCJzZXRTdGF0ZSIsIkNvbXBvbmVudENyZWF0ZSIsInB1c2giLCJvbkNyZWF0ZSIsIlNvcnRhYmxlRWxlbWVudCIsIlNvcnRhYmxlQ29udGFpbmVyIiwiYXJyYXlNb3ZlIiwiU29ydGFibGVJdGVtIiwiU29ydGFibGVMaXN0IiwiUGFnZSIsIm9uU29ydEVuZCIsIm9sZEluZGV4IiwibmV3SW5kZXgiLCJmaWx0ZXJlZCIsImZvcm1Db21wb25lbnRzIiwiZmlsdGVyIiwiY29tcCIsInBhZ2VUaXRsZSIsImxheW91dCIsInNob3dBZGRDb21wb25lbnQiLCJsaXN0VHlwZXMiLCJjb21wb25lbnRUb1N0cmluZyIsIkRhdGFNb2RlbCIsIm1vZGVsIiwiUGFnZUNyZWF0ZSIsImFzc2lnbiIsIkxpbmtFZGl0IiwiZWRnZSIsInNvdXJjZSIsImxpbmsiLCJpZiIsImNvbmRpdGlvbiIsImNvcHlMaW5rIiwiY29weUxpbmtJZHgiLCJMaW5rQ3JlYXRlIiwiZnJvbSIsInRvIiwiaGVhZER1cGxpY2F0ZSIsImFyciIsImoiLCJMaXN0SXRlbXMiLCJvbkNsaWNrQWRkSXRlbSIsIml0ZW1zIiwiY29uY2F0IiwidGV4dCIsImRlc2NyaXB0aW9uIiwicmVtb3ZlSXRlbSIsInMiLCJpZHgiLCJvbkJsdXIiLCJ0ZXh0cyIsImdldEFsbCIsInZhbHVlcyIsImR1cGVUZXh0IiwiZHVwZVZhbHVlIiwiaXRlbSIsIkxpc3RFZGl0IiwibmV3TmFtZSIsIm5ld1RpdGxlIiwibmV3VHlwZSIsIm5hbWVDaGFuZ2VkIiwiY29weUxpc3QiLCJkZXNjcmlwdGlvbnMiLCJvbkJsdXJOYW1lIiwiaW5wdXQiLCJsIiwib25DYW5jZWwiLCJMaXN0Q3JlYXRlIiwiTGlzdHNFZGl0Iiwib25DbGlja0xpc3QiLCJvbkNsaWNrQWRkTGlzdCIsInNob3dBZGRMaXN0IiwiU2VjdGlvbkVkaXQiLCJjb3B5U2VjdGlvbiIsIlNlY3Rpb25DcmVhdGUiLCJTZWN0aW9uc0VkaXQiLCJvbkNsaWNrU2VjdGlvbiIsIm9uQ2xpY2tBZGRTZWN0aW9uIiwic2hvd0FkZFNlY3Rpb24iLCJnZXRMYXlvdXQiLCJnIiwiZGFncmUiLCJncmFwaGxpYiIsIkdyYXBoIiwic2V0R3JhcGgiLCJyYW5rZGlyIiwibWFyZ2lueCIsIm1hcmdpbnkiLCJyYW5rc2VwIiwic2V0RGVmYXVsdEVkZ2VMYWJlbCIsInBhZ2VFbCIsInNldE5vZGUiLCJsYWJlbCIsIm9mZnNldFdpZHRoIiwiaGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0IiwiZXhpc3RzIiwic2V0RWRnZSIsInBvcyIsIm5vZGVzIiwiZWRnZXMiLCJvdXRwdXQiLCJncmFwaCIsInYiLCJub2RlIiwicHQiLCJ0b3AiLCJ5IiwibGVmdCIsIngiLCJ3IiwicG9pbnRzIiwiTGluZXMiLCJlZGl0TGluayIsImpvaW4iLCJNaW5pbWFwIiwib25DbGlja1BhZ2UiLCJ0b2dnbGVGaWx0ZXJQYXRoIiwic2NhbGUiLCJwYXJzZUZsb2F0IiwiVmlzdWFsaXNhdGlvbiIsImZpbHRlclBhdGhzIiwic2NoZWR1bGVMYXlvdXQiLCJyZWYiLCJjcmVhdGVSZWYiLCJzZXRUaW1lb3V0IiwiZ2V0RmlsdGVyZWRQYWdlcyIsImN1cnJlbnQiLCJmaWx0ZXJlZFBhZ2VzIiwidXBzdHJlYW1QYXRocyIsImRvd25zdHJlYW1QYXRocyIsImluY2x1ZGVzIiwiTWVudSIsInRhYiIsIm9uQ2xpY2tVcGxvYWQiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiY2xpY2siLCJvbkZpbGVVcGxvYWQiLCJmaWxlIiwiZmlsZXMiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwicmVhZEFzVGV4dCIsIm9ubG9hZCIsImV2dCIsInJlc3VsdCIsInBsYXlncm91bmRNb2RlIiwic2hvd01lbnUiLCJzaG93QWRkUGFnZSIsInNob3dBZGRMaW5rIiwic2hvd0VkaXRTZWN0aW9ucyIsInNob3dFZGl0TGlzdHMiLCJzaG93U3VtbWFyeSIsInBhZGRpbmdUb3AiLCJzZXRUYWIiLCJBcHAiLCJ1cGRhdGVkRGF0YSIsImZldGNoIiwibWV0aG9kIiwiYm9keSIsInJlcyIsIm9rIiwiRXJyb3IiLCJzdGF0dXNUZXh0IiwianNvbiIsIkRGQkQiLCJwYXJlbnQiLCJsb2NhdGlvbiIsInBhdGhuYW1lIiwiZnJhbWVzIiwicHJldmlldyIsInJlbG9hZCIsImFsZXJ0IiwibG9hZGVkIiwiUmVhY3RET00iLCJyZW5kZXIiXSwibWFwcGluZ3Mi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
