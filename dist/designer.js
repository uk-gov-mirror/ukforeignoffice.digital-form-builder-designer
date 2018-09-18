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

      return _ret3 = (_temp3 = (_this7 = _possibleConstructorReturn$g(this, (_ref3 = Menu.__proto__ || Object.getPrototypeOf(Menu)).call.apply(_ref3, [this].concat(args))), _this7), _this7.state = {}, _this7.onClickUpload = function (e) {
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
                  return _this8.setState({ showDataModel: true });
                } },
              'View Data Model'
            ),
            ' ',
            React.createElement(
              'button',
              { className: 'govuk-button govuk-!-font-size-14',
                onClick: function onClick() {
                  return _this8.setState({ showJSONData: true });
                } },
              'View JSON'
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
              { title: 'Data Model', show: this.state.showDataModel,
                onHide: function onHide() {
                  return _this8.setState({ showDataModel: false });
                } },
              React.createElement(DataModel, { data: data })
            ),
            React.createElement(
              Flyout,
              { title: 'JSON Data', show: this.state.showJSONData,
                onHide: function onHide() {
                  return _this8.setState({ showJSONData: false });
                }, width: 'large' },
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
                  return _this8.setState({ showSummary: false });
                } },
              React.createElement(
                'pre',
                null,
                JSON.stringify(data.pages.map(function (page) {
                  return page.path;
                }), null, 2)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzaWduZXIuanMiLCJzb3VyY2VzIjpbIi4uL2NsaWVudC9mbHlvdXQuanMiLCIuLi9jbGllbnQvaGVscGVycy5qcyIsIi4uL2NsaWVudC9wYWdlLWVkaXQuanMiLCIuLi9jb21wb25lbnQtdHlwZXMuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LXR5cGUtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LWNyZWF0ZS5qcyIsIi4uL2NsaWVudC9wYWdlLmpzIiwiLi4vY2xpZW50L2RhdGEtbW9kZWwuanMiLCIuLi9jbGllbnQvcGFnZS1jcmVhdGUuanMiLCIuLi9jbGllbnQvbGluay1lZGl0LmpzIiwiLi4vY2xpZW50L2xpbmstY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3QtaXRlbXMuanMiLCIuLi9jbGllbnQvbGlzdC1lZGl0LmpzIiwiLi4vY2xpZW50L2xpc3QtY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3RzLWVkaXQuanMiLCIuLi9jbGllbnQvc2VjdGlvbi1lZGl0LmpzIiwiLi4vY2xpZW50L3NlY3Rpb24tY3JlYXRlLmpzIiwiLi4vY2xpZW50L3NlY3Rpb25zLWVkaXQuanMiLCIuLi9jbGllbnQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5mdW5jdGlvbiBGbHlvdXQgKHByb3BzKSB7XG4gIGlmICghcHJvcHMuc2hvdykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCB3aWR0aCA9IHByb3BzLndpZHRoIHx8ICcnXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZmx5b3V0LW1lbnUgc2hvdyc+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YGZseW91dC1tZW51LWNvbnRhaW5lciAke3dpZHRofWB9PlxuICAgICAgICA8YSB0aXRsZT0nQ2xvc2UnIGNsYXNzTmFtZT0nY2xvc2UgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgb25DbGljaz17ZSA9PiBwcm9wcy5vbkhpZGUoZSl9PkNsb3NlPC9hPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFuZWwnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1oZWFkZXIgZ292dWstIS1wYWRkaW5nLXRvcC00IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTQnPlxuICAgICAgICAgICAge3Byb3BzLnRpdGxlICYmIDxoNCBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctbSc+e3Byb3BzLnRpdGxlfTwvaDQ+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1ib2R5Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctbGVmdC00IGdvdnVrLSEtcGFkZGluZy1yaWdodC00IGdvdnVrLSEtcGFkZGluZy1ib3R0b20tNCc+XG4gICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZseW91dFxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1EYXRhIChmb3JtKSB7XG4gIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICBjb25zdCBkYXRhID0ge1xuICAgIG9wdGlvbnM6IHt9LFxuICAgIHNjaGVtYToge31cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhc3QgKG5hbWUsIHZhbCkge1xuICAgIGNvbnN0IGVsID0gZm9ybS5lbGVtZW50c1tuYW1lXVxuICAgIGNvbnN0IGNhc3QgPSBlbCAmJiBlbC5kYXRhc2V0LmNhc3RcblxuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGNhc3QgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gTnVtYmVyKHZhbClcbiAgICB9IGVsc2UgaWYgKGNhc3QgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHZhbCA9PT0gJ29uJ1xuICAgIH1cblxuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICBjb25zdCBvcHRpb25zUHJlZml4ID0gJ29wdGlvbnMuJ1xuICAgIGNvbnN0IHNjaGVtYVByZWZpeCA9ICdzY2hlbWEuJ1xuXG4gICAgdmFsdWUgPSB2YWx1ZS50cmltKClcblxuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG9wdGlvbnNQcmVmaXgpKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGAke29wdGlvbnNQcmVmaXh9cmVxdWlyZWRgICYmIHZhbHVlID09PSAnb24nKSB7XG4gICAgICAgICAgZGF0YS5vcHRpb25zLnJlcXVpcmVkID0gZmFsc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLm9wdGlvbnNba2V5LnN1YnN0cihvcHRpb25zUHJlZml4Lmxlbmd0aCldID0gY2FzdChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleS5zdGFydHNXaXRoKHNjaGVtYVByZWZpeCkpIHtcbiAgICAgICAgZGF0YS5zY2hlbWFba2V5LnN1YnN0cihzY2hlbWFQcmVmaXgubGVuZ3RoKV0gPSBjYXN0KGtleSwgdmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIENsZWFudXBcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLnNjaGVtYSkubGVuZ3RoKSBkZWxldGUgZGF0YS5zY2hlbWFcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLm9wdGlvbnMpLmxlbmd0aCkgZGVsZXRlIGRhdGEub3B0aW9uc1xuXG4gIHJldHVybiBkYXRhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZSAob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld1BhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBwYXRoQ2hhbmdlZCA9IG5ld1BhdGggIT09IHBhZ2UucGF0aFxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlc1tkYXRhLnBhZ2VzLmluZGV4T2YocGFnZSldXG5cbiAgICBpZiAocGF0aENoYW5nZWQpIHtcbiAgICAgIC8vIGBwYXRoYCBoYXMgY2hhbmdlZCAtIHZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgICAgaWYgKGRhdGEucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gbmV3UGF0aCkpIHtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke25ld1BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29weVBhZ2UucGF0aCA9IG5ld1BhdGhcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBwYWdlXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHAubmV4dCkpIHtcbiAgICAgICAgICBwLm5leHQuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgIGlmIChuLnBhdGggPT09IHBhZ2UucGF0aCkge1xuICAgICAgICAgICAgICBuLnBhdGggPSBuZXdQYXRoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIGNvcHlQYWdlLnRpdGxlID0gdGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlQYWdlLnRpdGxlXG4gICAgfVxuXG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIGNvcHlQYWdlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjb3B5UGFnZS5zZWN0aW9uXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2VJZHggPSBjb3B5LnBhZ2VzLmZpbmRJbmRleChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBsaW5rcyB0byB0aGUgcGFnZVxuICAgIGNvcHkucGFnZXMuZm9yRWFjaCgocCwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChpbmRleCAhPT0gY29weVBhZ2VJZHggJiYgQXJyYXkuaXNBcnJheShwLm5leHQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBwLm5leHQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gcC5uZXh0W2ldXG4gICAgICAgICAgaWYgKG5leHQucGF0aCA9PT0gcGFnZS5wYXRoKSB7XG4gICAgICAgICAgICBwLm5leHQuc3BsaWNlKGksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIFJlbW92ZSB0aGUgcGFnZSBpdHNlbGZcbiAgICBjb3B5LnBhZ2VzLnNwbGljZShjb3B5UGFnZUlkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIC8vIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3BhZ2UucGF0aH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGUudGFyZ2V0LnNldEN1c3RvbVZhbGlkaXR5KCcnKX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXRpdGxlJz5UaXRsZSAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0ncGFnZS10aXRsZS1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgSWYgbm90IHN1cHBsaWVkLCB0aGUgdGl0bGUgb2YgdGhlIGZpcnN0IHF1ZXN0aW9uIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17cGFnZS50aXRsZX0gYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJyBkZWZhdWx0VmFsdWU9e3BhZ2Uuc2VjdGlvbn0+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7c2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gKDxvcHRpb24ga2V5PXtzZWN0aW9uLm5hbWV9IHZhbHVlPXtzZWN0aW9uLm5hbWV9PntzZWN0aW9uLnRpdGxlfTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlRWRpdFxuIiwiY29uc3QgY29tcG9uZW50VHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAnVGV4dEZpZWxkJyxcbiAgICB0aXRsZTogJ1RleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdNdWx0aWxpbmVUZXh0RmllbGQnLFxuICAgIHRpdGxlOiAnTXVsdGlsaW5lIHRleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdZZXNOb0ZpZWxkJyxcbiAgICB0aXRsZTogJ1llcy9ObyBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVGaWVsZCcsXG4gICAgdGl0bGU6ICdEYXRlIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ1RpbWUgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgdGltZSBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVQYXJ0c0ZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgcGFydHMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZVBhcnRzRmllbGQnLFxuICAgIHRpdGxlOiAnRGF0ZSB0aW1lIHBhcnRzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnU2VsZWN0RmllbGQnLFxuICAgIHRpdGxlOiAnU2VsZWN0IGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUmFkaW9zRmllbGQnLFxuICAgIHRpdGxlOiAnUmFkaW9zIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQ2hlY2tib3hlc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0NoZWNrYm94ZXMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdOdW1iZXJGaWVsZCcsXG4gICAgdGl0bGU6ICdOdW1iZXIgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdVa0FkZHJlc3NGaWVsZCcsXG4gICAgdGl0bGU6ICdVayBhZGRyZXNzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGVsZXBob25lTnVtYmVyRmllbGQnLFxuICAgIHRpdGxlOiAnVGVsZXBob25lIG51bWJlciBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0VtYWlsQWRkcmVzc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0VtYWlsIGFkZHJlc3MgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdQYXJhJyxcbiAgICB0aXRsZTogJ1BhcmFncmFwaCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnSHRtbCcsXG4gICAgdGl0bGU6ICdIdG1sJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdJbnNldFRleHQnLFxuICAgIHRpdGxlOiAnSW5zZXQgdGV4dCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnRGV0YWlscycsXG4gICAgdGl0bGU6ICdEZXRhaWxzJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfVxuXVxuXG5leHBvcnQgZGVmYXVsdCBjb21wb25lbnRUeXBlc1xuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuXG5mdW5jdGlvbiBDbGFzc2VzIChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5jbGFzc2VzJz5DbGFzc2VzPC9sYWJlbD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+QWRkaXRpb25hbCBDU1MgY2xhc3NlcyB0byBhZGQgdG8gdGhlIGZpZWxkPGJyIC8+XG4gICAgICBFLmcuIGdvdnVrLWlucHV0LS13aWR0aC0yIChvciAzLCA0LCA1LCAxMCwgMjApIG9yIGdvdnVrLSEtd2lkdGgtb25lLWhhbGYgKHR3by10aGlyZHMsIHRocmVlLXF1YXJ0ZXJzIGV0Yy4pPC9zcGFuPlxuICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmNsYXNzZXMnIG5hbWU9J29wdGlvbnMuY2xhc3NlcycgdHlwZT0ndGV4dCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmNsYXNzZXN9IC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhpcyBpcyB1c2VkIGFzIHRoZSBrZXkgaW4gdGhlIEpTT04gb3V0cHV0LiBVc2UgYGNhbWVsQ2FzaW5nYCBlLmcuIGRhdGVPZkJpcnRoIG9yIGZ1bGxOYW1lLjwvc3Bhbj5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTIwJyBpZD0nZmllbGQtbmFtZSdcbiAgICAgICAgICBuYW1lPSduYW1lJyB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5uYW1lfSByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKycgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlRoaXMgaXMgdGhlIHRpdGxlIHRleHQgZGlzcGxheWVkIG9uIHRoZSBwYWdlPC9zcGFuPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2ZpZWxkLXRpdGxlJyBuYW1lPSd0aXRsZScgdHlwZT0ndGV4dCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1oaW50Jz5IaW50IChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlRoZSBoaW50IGNhbiBpbmNsdWRlIEhUTUw8L3NwYW4+XG4gICAgICAgIDx0ZXh0YXJlYSBjbGFzc05hbWU9J2dvdnVrLXRleHRhcmVhJyBpZD0nZmllbGQtaGludCcgbmFtZT0naGludCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5oaW50fSByb3dzPScyJyAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLnJlcXVpcmVkJ1xuICAgICAgICAgICAgbmFtZT0nb3B0aW9ucy5yZXF1aXJlZCcgdHlwZT0nY2hlY2tib3gnIGRlZmF1bHRDaGVja2VkPXtvcHRpb25zLnJlcXVpcmVkID09PSBmYWxzZX0gLz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1jaGVja2JveGVzX19sYWJlbCdcbiAgICAgICAgICAgIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMucmVxdWlyZWQnPk9wdGlvbmFsPC9sYWJlbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvZGl2PlxuICApXG59XG5cbmZ1bmN0aW9uIFRleHRGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBzY2hlbWEgPSBjb21wb25lbnQuc2NoZW1hIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkZXRhaWxzIGNsYXNzTmFtZT0nZ292dWstZGV0YWlscyc+XG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeSc+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5LXRleHQnPm1vcmU8L3NwYW4+XG4gICAgICAgIDwvc3VtbWFyeT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5tYXgnPk1heCBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtYXhpbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWF4JyBuYW1lPSdzY2hlbWEubWF4J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWF4fSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1pbic+TWluIGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1pbmltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5taW4nIG5hbWU9J3NjaGVtYS5taW4nXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5taW59IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubGVuZ3RoJz5MZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBleGFjdCB0ZXh0IGxlbmd0aDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLmxlbmd0aCcgbmFtZT0nc2NoZW1hLmxlbmd0aCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLmxlbmd0aH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBNdWx0aWxpbmVUZXh0RmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgc2NoZW1hID0gY29tcG9uZW50LnNjaGVtYSB8fCB7fVxuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRldGFpbHMgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzJz5cbiAgICAgICAgPHN1bW1hcnkgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5Jz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnktdGV4dCc+bW9yZTwvc3Bhbj5cbiAgICAgICAgPC9zdW1tYXJ5PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1heCc+TWF4IGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5tYXgnIG5hbWU9J3NjaGVtYS5tYXgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5tYXh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWluJz5NaW4gbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWluaW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1pbicgbmFtZT0nc2NoZW1hLm1pbidcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1pbn0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMucm93cyc+Um93czwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGlkPSdmaWVsZC1vcHRpb25zLnJvd3MnIG5hbWU9J29wdGlvbnMucm93cycgdHlwZT0ndGV4dCdcbiAgICAgICAgICAgIGRhdGEtY2FzdD0nbnVtYmVyJyBkZWZhdWx0VmFsdWU9e29wdGlvbnMucm93c30gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2RldGFpbHM+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gTnVtYmVyRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgc2NoZW1hID0gY29tcG9uZW50LnNjaGVtYSB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGV0YWlscyBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHMnPlxuICAgICAgICA8c3VtbWFyeSBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnknPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeS10ZXh0Jz5tb3JlPC9zcGFuPlxuICAgICAgICA8L3N1bW1hcnk+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWluJz5NaW48L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtaW5pbXVtIHZhbHVlPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWluJyBuYW1lPSdzY2hlbWEubWluJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWlufSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1heCc+TWF4PC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWF4aW11bSB2YWx1ZTwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1heCcgbmFtZT0nc2NoZW1hLm1heCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1heH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlcyBnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pbnB1dCcgaWQ9J2ZpZWxkLXNjaGVtYS5pbnRlZ2VyJyBkYXRhLWNhc3Q9J2Jvb2xlYW4nXG4gICAgICAgICAgICAgIG5hbWU9J3NjaGVtYS5pbnRlZ2VyJyB0eXBlPSdjaGVja2JveCcgZGVmYXVsdENoZWNrZWQ9e3NjaGVtYS5pbnRlZ2VyID09PSB0cnVlfSAvPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstY2hlY2tib3hlc19fbGFiZWwnXG4gICAgICAgICAgICAgIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5pbnRlZ2VyJz5JbnRlZ2VyPC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2RldGFpbHM+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gU2VsZWN0RmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG4gIGNvbnN0IGxpc3RzID0gZGF0YS5saXN0c1xuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMubGlzdCc+TGlzdDwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCBnb3Z1ay1pbnB1dC0td2lkdGgtMTAnIGlkPSdmaWVsZC1vcHRpb25zLmxpc3QnIG5hbWU9J29wdGlvbnMubGlzdCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5saXN0fSByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtsaXN0cy5tYXAobGlzdCA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiA8b3B0aW9uIGtleT17bGlzdC5uYW1lfSB2YWx1ZT17bGlzdC5uYW1lfT57bGlzdC50aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIFJhZGlvc0ZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQsIGRhdGEgfSA9IHByb3BzXG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuICBjb25zdCBsaXN0cyA9IGRhdGEubGlzdHNcblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmxpc3QnPkxpc3Q8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QgZ292dWstaW5wdXQtLXdpZHRoLTEwJyBpZD0nZmllbGQtb3B0aW9ucy5saXN0JyBuYW1lPSdvcHRpb25zLmxpc3QnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e29wdGlvbnMubGlzdH0gcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7bGlzdHMubWFwKGxpc3QgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e2xpc3QubmFtZX0gdmFsdWU9e2xpc3QubmFtZX0+e2xpc3QudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXMgZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pdGVtJz5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pbnB1dCcgaWQ9J2ZpZWxkLW9wdGlvbnMuYm9sZCcgZGF0YS1jYXN0PSdib29sZWFuJ1xuICAgICAgICAgICAgbmFtZT0nb3B0aW9ucy5ib2xkJyB0eXBlPSdjaGVja2JveCcgZGVmYXVsdENoZWNrZWQ9e29wdGlvbnMuYm9sZCA9PT0gdHJ1ZX0gLz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1jaGVja2JveGVzX19sYWJlbCdcbiAgICAgICAgICAgIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMuYm9sZCc+Qm9sZCBsYWJlbHM8L2xhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmJvbGQnIGRhdGEtY2FzdD0nYm9vbGVhbidcbiAgICAgICAgICAgIG5hbWU9J29wdGlvbnMuYm9sZCcgdHlwZT0nY2hlY2tib3gnIGRlZmF1bHRDaGVja2VkPXtvcHRpb25zLmJvbGQgPT09IHRydWV9IC8+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstY2hlY2tib3hlc19fbGFiZWwnXG4gICAgICAgICAgICBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmJvbGQnPkJvbGQgbGFiZWxzPC9sYWJlbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBQYXJhRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCcgaHRtbEZvcj0ncGFyYS1jb250ZW50Jz5Db250ZW50PC9sYWJlbD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhlIGNvbnRlbnQgY2FuIGluY2x1ZGUgSFRNTCBhbmQgdGhlIGBnb3Z1ay1wcm9zZS1zY29wZWAgY3NzIGNsYXNzIGlzIGF2YWlsYWJsZS4gVXNlIHRoaXMgb24gYSB3cmFwcGluZyBlbGVtZW50IHRvIGFwcGx5IGRlZmF1bHQgZ292dWsgc3R5bGVzLjwvc3Bhbj5cbiAgICAgIDx0ZXh0YXJlYSBjbGFzc05hbWU9J2dvdnVrLXRleHRhcmVhJyBpZD0ncGFyYS1jb250ZW50JyBuYW1lPSdjb250ZW50J1xuICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5jb250ZW50fSByb3dzPScxMCcgcmVxdWlyZWQgLz5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5jb25zdCBJbnNldFRleHRFZGl0ID0gUGFyYUVkaXRcbmNvbnN0IEh0bWxFZGl0ID0gUGFyYUVkaXRcblxuZnVuY3Rpb24gRGV0YWlsc0VkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuXG4gIHJldHVybiAoXG4gICAgPGRpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCcgaHRtbEZvcj0nZGV0YWlscy10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2RldGFpbHMtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LnRpdGxlfSByZXF1aXJlZCAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J2RldGFpbHMtY29udGVudCc+Q29udGVudDwvbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhlIGNvbnRlbnQgY2FuIGluY2x1ZGUgSFRNTCBhbmQgdGhlIGBnb3Z1ay1wcm9zZS1zY29wZWAgY3NzIGNsYXNzIGlzIGF2YWlsYWJsZS4gVXNlIHRoaXMgb24gYSB3cmFwcGluZyBlbGVtZW50IHRvIGFwcGx5IGRlZmF1bHQgZ292dWsgc3R5bGVzLjwvc3Bhbj5cbiAgICAgICAgPHRleHRhcmVhIGNsYXNzTmFtZT0nZ292dWstdGV4dGFyZWEnIGlkPSdkZXRhaWxzLWNvbnRlbnQnIG5hbWU9J2NvbnRlbnQnXG4gICAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQuY29udGVudH0gcm93cz0nMTAnIHJlcXVpcmVkIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5jb25zdCBjb21wb25lbnRUeXBlRWRpdG9ycyA9IHtcbiAgJ1RleHRGaWVsZEVkaXQnOiBUZXh0RmllbGRFZGl0LFxuICAnRW1haWxBZGRyZXNzRmllbGRFZGl0JzogVGV4dEZpZWxkRWRpdCxcbiAgJ1RlbGVwaG9uZU51bWJlckZpZWxkRWRpdCc6IFRleHRGaWVsZEVkaXQsXG4gICdOdW1iZXJGaWVsZEVkaXQnOiBOdW1iZXJGaWVsZEVkaXQsXG4gICdNdWx0aWxpbmVUZXh0RmllbGRFZGl0JzogTXVsdGlsaW5lVGV4dEZpZWxkRWRpdCxcbiAgJ1NlbGVjdEZpZWxkRWRpdCc6IFNlbGVjdEZpZWxkRWRpdCxcbiAgJ1JhZGlvc0ZpZWxkRWRpdCc6IFJhZGlvc0ZpZWxkRWRpdCxcbiAgJ0NoZWNrYm94ZXNGaWVsZEVkaXQnOiBDaGVja2JveGVzRmllbGRFZGl0LFxuICAnUGFyYUVkaXQnOiBQYXJhRWRpdCxcbiAgJ0h0bWxFZGl0JzogSHRtbEVkaXQsXG4gICdJbnNldFRleHRFZGl0JzogSW5zZXRUZXh0RWRpdCxcbiAgJ0RldGFpbHNFZGl0JzogRGV0YWlsc0VkaXRcbn1cblxuY2xhc3MgQ29tcG9uZW50VHlwZUVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCB0eXBlID0gY29tcG9uZW50VHlwZXMuZmluZCh0ID0+IHQubmFtZSA9PT0gY29tcG9uZW50LnR5cGUpXG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgVGFnTmFtZSA9IGNvbXBvbmVudFR5cGVFZGl0b3JzW2Ake2NvbXBvbmVudC50eXBlfUVkaXRgXSB8fCBGaWVsZEVkaXRcbiAgICAgIHJldHVybiA8VGFnTmFtZSBjb21wb25lbnQ9e2NvbXBvbmVudH0gZGF0YT17ZGF0YX0gLz5cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50VHlwZUVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUsIGdldEZvcm1EYXRhIH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IENvbXBvbmVudFR5cGVFZGl0IGZyb20gJy4vY29tcG9uZW50LXR5cGUtZWRpdCdcblxuY2xhc3MgQ29tcG9uZW50RWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSwgY29tcG9uZW50IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZm9ybURhdGEgPSBnZXRGb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gcGFnZS5jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHNbY29tcG9uZW50SW5kZXhdID0gZm9ybURhdGFcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkNsaWNrRGVsZXRlID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoIXdpbmRvdy5jb25maXJtKCdDb25maXJtIGRlbGV0ZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvbXBvbmVudElkeCA9IHBhZ2UuY29tcG9uZW50cy5maW5kSW5kZXgoYyA9PiBjID09PSBjb21wb25lbnQpXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuICAgIGNvbnN0IGlzTGFzdCA9IGNvbXBvbmVudElkeCA9PT0gcGFnZS5jb21wb25lbnRzLmxlbmd0aCAtIDFcblxuICAgIC8vIFJlbW92ZSB0aGUgY29tcG9uZW50XG4gICAgY29weVBhZ2UuY29tcG9uZW50cy5zcGxpY2UoY29tcG9uZW50SWR4LCAxKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgaWYgKCFpc0xhc3QpIHtcbiAgICAgICAgICAvLyBXZSBkb250IGhhdmUgYW4gaWQgd2UgY2FuIHVzZSBmb3IgYGtleWAtaW5nIHJlYWN0IDxDb21wb25lbnQgLz4nc1xuICAgICAgICAgIC8vIFdlIHRoZXJlZm9yZSBuZWVkIHRvIGNvbmRpdGlvbmFsbHkgcmVwb3J0IGBvbkVkaXRgIGNoYW5nZXMuXG4gICAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGNvbXBvbmVudCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgY29weUNvbXAgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNvbXBvbmVudCkpXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGZvcm0gYXV0b0NvbXBsZXRlPSdvZmYnIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3R5cGUnPlR5cGU8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHknPntjb21wb25lbnQudHlwZX08L3NwYW4+XG4gICAgICAgICAgICA8aW5wdXQgaWQ9J3R5cGUnIHR5cGU9J2hpZGRlbicgbmFtZT0ndHlwZScgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQudHlwZX0gLz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxDb21wb25lbnRUeXBlRWRpdFxuICAgICAgICAgICAgcGFnZT17cGFnZX1cbiAgICAgICAgICAgIGNvbXBvbmVudD17Y29weUNvbXB9XG4gICAgICAgICAgICBkYXRhPXtkYXRhfSAvPlxuXG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdidXR0b24nIG9uQ2xpY2s9e3RoaXMub25DbGlja0RlbGV0ZX0+RGVsZXRlPC9idXR0b24+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnRFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgU29ydGFibGVIT0MgKi9cblxuaW1wb3J0IEZseW91dCBmcm9tICcuL2ZseW91dCdcbmltcG9ydCBDb21wb25lbnRFZGl0IGZyb20gJy4vY29tcG9uZW50LWVkaXQnXG5jb25zdCBTb3J0YWJsZUhhbmRsZSA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlSGFuZGxlXG5jb25zdCBEcmFnSGFuZGxlID0gU29ydGFibGVIYW5kbGUoKCkgPT4gPHNwYW4gY2xhc3NOYW1lPSdkcmFnLWhhbmRsZSc+JiM5Nzc2Ozwvc3Bhbj4pXG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRUeXBlcyA9IHtcbiAgJ1RleHRGaWVsZCc6IFRleHRGaWVsZCxcbiAgJ1RlbGVwaG9uZU51bWJlckZpZWxkJzogVGVsZXBob25lTnVtYmVyRmllbGQsXG4gICdOdW1iZXJGaWVsZCc6IE51bWJlckZpZWxkLFxuICAnRW1haWxBZGRyZXNzRmllbGQnOiBFbWFpbEFkZHJlc3NGaWVsZCxcbiAgJ1RpbWVGaWVsZCc6IFRpbWVGaWVsZCxcbiAgJ0RhdGVGaWVsZCc6IERhdGVGaWVsZCxcbiAgJ0RhdGVUaW1lRmllbGQnOiBEYXRlVGltZUZpZWxkLFxuICAnRGF0ZVBhcnRzRmllbGQnOiBEYXRlUGFydHNGaWVsZCxcbiAgJ0RhdGVUaW1lUGFydHNGaWVsZCc6IERhdGVUaW1lUGFydHNGaWVsZCxcbiAgJ011bHRpbGluZVRleHRGaWVsZCc6IE11bHRpbGluZVRleHRGaWVsZCxcbiAgJ1JhZGlvc0ZpZWxkJzogUmFkaW9zRmllbGQsXG4gICdDaGVja2JveGVzRmllbGQnOiBDaGVja2JveGVzRmllbGQsXG4gICdTZWxlY3RGaWVsZCc6IFNlbGVjdEZpZWxkLFxuICAnWWVzTm9GaWVsZCc6IFllc05vRmllbGQsXG4gICdVa0FkZHJlc3NGaWVsZCc6IFVrQWRkcmVzc0ZpZWxkLFxuICAnUGFyYSc6IFBhcmEsXG4gICdIdG1sJzogSHRtbCxcbiAgJ0luc2V0VGV4dCc6IEluc2V0VGV4dCxcbiAgJ0RldGFpbHMnOiBEZXRhaWxzXG59XG5cbmZ1bmN0aW9uIEJhc2UgKHByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5mdW5jdGlvbiBDb21wb25lbnRGaWVsZCAocHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gVGV4dEZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gVGVsZXBob25lTnVtYmVyRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggdGVsJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRW1haWxBZGRyZXNzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggZW1haWwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBVa0FkZHJlc3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3gnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2J1dHRvbiBzcXVhcmUnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBNdWx0aWxpbmVUZXh0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHRhbGwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBOdW1iZXJGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBudW1iZXInIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEYXRlRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggZHJvcGRvd24nPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHkgZ292dWstIS1mb250LXNpemUtMTQnPmRkL21tL3l5eXk8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVUaW1lRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggbGFyZ2UgZHJvcGRvd24nPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHkgZ292dWstIS1mb250LXNpemUtMTQnPmRkL21tL3l5eXkgaGg6bW08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFRpbWVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+aGg6bW08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVUaW1lUGFydHNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1sZWZ0LTEgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IG1lZGl1bSBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVBhcnRzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwgZ292dWstIS1tYXJnaW4tbGVmdC0xIGdvdnVrLSEtbWFyZ2luLXJpZ2h0LTEnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBtZWRpdW0nIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBSYWRpb3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBDaGVja2JveGVzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2hlY2snIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaGVjaycgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NoZWNrJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gU2VsZWN0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggZHJvcGRvd24nIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBZZXNOb0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERldGFpbHMgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAge2DilrYgYH08c3BhbiBjbGFzc05hbWU9J2xpbmUgZGV0YWlscycgLz5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gSW5zZXRUZXh0ICgpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdpbnNldCBnb3Z1ay0hLXBhZGRpbmctbGVmdC0yJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUnIC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lIHNob3J0IGdvdnVrLSEtbWFyZ2luLWJvdHRvbS0yIGdvdnVrLSEtbWFyZ2luLXRvcC0yJyAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBQYXJhICgpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUgc2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTIgZ292dWstIS1tYXJnaW4tdG9wLTInIC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gSHRtbCAoKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0naHRtbCc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSB4c2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTEgZ292dWstIS1tYXJnaW4tdG9wLTEnIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBzaG93RWRpdG9yID0gKGUsIHZhbHVlKSA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiB2YWx1ZSB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IFRhZ05hbWUgPSBjb21wb25lbnRUeXBlc1tgJHtjb21wb25lbnQudHlwZX1gXVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQgZ292dWstIS1wYWRkaW5nLTInXG4gICAgICAgICAgb25DbGljaz17KGUpID0+IHRoaXMuc2hvd0VkaXRvcihlLCB0cnVlKX0+XG4gICAgICAgICAgPERyYWdIYW5kbGUgLz5cbiAgICAgICAgICA8VGFnTmFtZSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBDb21wb25lbnQnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zaG93RWRpdG9yKGUsIGZhbHNlKX0+XG4gICAgICAgICAgPENvbXBvbmVudEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9IHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSwgZ2V0Rm9ybURhdGEgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgQ29tcG9uZW50VHlwZUVkaXQgZnJvbSAnLi9jb21wb25lbnQtdHlwZS1lZGl0J1xuLy8gaW1wb3J0IHsgY29tcG9uZW50VHlwZXMgYXMgY29tcG9uZW50VHlwZXNJY29ucyB9IGZyb20gJy4vY29tcG9uZW50J1xuaW1wb3J0IGNvbXBvbmVudFR5cGVzIGZyb20gJy4uL2NvbXBvbmVudC10eXBlcy5qcydcblxuY2xhc3MgQ29tcG9uZW50Q3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZm9ybURhdGEgPSBnZXRGb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMucHVzaChmb3JtRGF0YSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSd0eXBlJz5UeXBlPC9sYWJlbD5cbiAgICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSd0eXBlJyBuYW1lPSd0eXBlJyByZXF1aXJlZFxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgY29tcG9uZW50OiB7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0gfSl9PlxuICAgICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICAgIHtjb21wb25lbnRUeXBlcy5tYXAodHlwZSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXt0eXBlLm5hbWV9IHZhbHVlPXt0eXBlLm5hbWV9Pnt0eXBlLnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgey8qIHtPYmplY3Qua2V5cyhjb21wb25lbnRUeXBlc0ljb25zKS5tYXAodHlwZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IFRhZyA9IGNvbXBvbmVudFR5cGVzSWNvbnNbdHlwZV1cbiAgICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQgZ292dWstIS1wYWRkaW5nLTInPjxUYWcgLz48L2Rpdj5cbiAgICAgICAgICAgIH0pfSAqL31cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHt0aGlzLnN0YXRlLmNvbXBvbmVudCAmJiB0aGlzLnN0YXRlLmNvbXBvbmVudC50eXBlICYmIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxDb21wb25lbnRUeXBlRWRpdFxuICAgICAgICAgICAgICAgIHBhZ2U9e3BhZ2V9XG4gICAgICAgICAgICAgICAgY29tcG9uZW50PXt0aGlzLnN0YXRlLmNvbXBvbmVudH1cbiAgICAgICAgICAgICAgICBkYXRhPXtkYXRhfSAvPlxuXG4gICAgICAgICAgICAgIDxidXR0b24gdHlwZT0nc3VibWl0JyBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbic+U2F2ZTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cblxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50Q3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgU29ydGFibGVIT0MgKi9cblxuaW1wb3J0IEZseW91dCBmcm9tICcuL2ZseW91dCdcbmltcG9ydCBQYWdlRWRpdCBmcm9tICcuL3BhZ2UtZWRpdCdcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50J1xuaW1wb3J0IENvbXBvbmVudENyZWF0ZSBmcm9tICcuL2NvbXBvbmVudC1jcmVhdGUnXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNvbnN0IFNvcnRhYmxlRWxlbWVudCA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlRWxlbWVudFxuY29uc3QgU29ydGFibGVDb250YWluZXIgPSBTb3J0YWJsZUhPQy5Tb3J0YWJsZUNvbnRhaW5lclxuY29uc3QgYXJyYXlNb3ZlID0gU29ydGFibGVIT0MuYXJyYXlNb3ZlXG5cbmNvbnN0IFNvcnRhYmxlSXRlbSA9IFNvcnRhYmxlRWxlbWVudCgoeyBpbmRleCwgcGFnZSwgY29tcG9uZW50LCBkYXRhIH0pID0+XG4gIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQtaXRlbSc+XG4gICAgPENvbXBvbmVudCBrZXk9e2luZGV4fSBwYWdlPXtwYWdlfSBjb21wb25lbnQ9e2NvbXBvbmVudH0gZGF0YT17ZGF0YX0gLz5cbiAgPC9kaXY+XG4pXG5cbmNvbnN0IFNvcnRhYmxlTGlzdCA9IFNvcnRhYmxlQ29udGFpbmVyKCh7IHBhZ2UsIGRhdGEgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQtbGlzdCc+XG4gICAgICB7cGFnZS5jb21wb25lbnRzLm1hcCgoY29tcG9uZW50LCBpbmRleCkgPT4gKFxuICAgICAgICA8U29ydGFibGVJdGVtIGtleT17aW5kZXh9IGluZGV4PXtpbmRleH0gcGFnZT17cGFnZX0gY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gICAgICApKX1cbiAgICA8L2Rpdj5cbiAgKVxufSlcblxuY2xhc3MgUGFnZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBzaG93RWRpdG9yID0gKGUsIHZhbHVlKSA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiB2YWx1ZSB9KVxuICB9XG5cbiAgb25Tb3J0RW5kID0gKHsgb2xkSW5kZXgsIG5ld0luZGV4IH0pID0+IHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMgPSBhcnJheU1vdmUoY29weVBhZ2UuY29tcG9uZW50cywgb2xkSW5kZXgsIG5ld0luZGV4KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG5cbiAgICAvLyBPUFRJTUlTVElDIFNBVkUgVE8gU1RPUCBKVU1QXG5cbiAgICAvLyBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICAvLyBwYWdlLmNvbXBvbmVudHMgPSBhcnJheU1vdmUocGFnZS5jb21wb25lbnRzLCBvbGRJbmRleCwgbmV3SW5kZXgpXG5cbiAgICAvLyBkYXRhLnNhdmUoZGF0YSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhLCBmaWx0ZXJlZCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcbiAgICBjb25zdCBmb3JtQ29tcG9uZW50cyA9IHBhZ2UuY29tcG9uZW50cy5maWx0ZXIoY29tcCA9PiBjb21wb25lbnRUeXBlcy5maW5kKHR5cGUgPT4gdHlwZS5uYW1lID09PSBjb21wLnR5cGUpLnN1YlR5cGUgPT09ICdmaWVsZCcpXG4gICAgY29uc3QgcGFnZVRpdGxlID0gcGFnZS50aXRsZSB8fCAoZm9ybUNvbXBvbmVudHMubGVuZ3RoID09PSAxICYmIHBhZ2UuY29tcG9uZW50c1swXSA9PT0gZm9ybUNvbXBvbmVudHNbMF0gPyBmb3JtQ29tcG9uZW50c1swXS50aXRsZSA6IHBhZ2UudGl0bGUpXG4gICAgY29uc3Qgc2VjdGlvbiA9IHBhZ2Uuc2VjdGlvbiAmJiBzZWN0aW9ucy5maW5kKHNlY3Rpb24gPT4gc2VjdGlvbi5uYW1lID09PSBwYWdlLnNlY3Rpb24pXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBpZD17cGFnZS5wYXRofSBjbGFzc05hbWU9e2BwYWdlJHtmaWx0ZXJlZCA/ICcgZmlsdGVyZWQnIDogJyd9YH0gdGl0bGU9e3BhZ2UucGF0aH0gc3R5bGU9e3RoaXMucHJvcHMubGF5b3V0fT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2hhbmRsZScgb25DbGljaz17KGUpID0+IHRoaXMuc2hvd0VkaXRvcihlLCB0cnVlKX0gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtcGFkZGluZy10b3AtMiBnb3Z1ay0hLXBhZGRpbmctbGVmdC0yIGdvdnVrLSEtcGFkZGluZy1yaWdodC0yJz5cblxuICAgICAgICAgIDxoMyBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctcyc+XG4gICAgICAgICAgICB7c2VjdGlvbiAmJiA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWNhcHRpb24tbSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+e3NlY3Rpb24udGl0bGV9PC9zcGFuPn1cbiAgICAgICAgICAgIHtwYWdlVGl0bGV9XG4gICAgICAgICAgPC9oMz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPFNvcnRhYmxlTGlzdCBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfSBwcmVzc0RlbGF5PXsyMDB9XG4gICAgICAgICAgb25Tb3J0RW5kPXt0aGlzLm9uU29ydEVuZH0gbG9ja0F4aXM9J3knIGhlbHBlckNsYXNzPSdkcmFnZ2luZydcbiAgICAgICAgICBsb2NrVG9Db250YWluZXJFZGdlcyB1c2VEcmFnSGFuZGxlIC8+XG4gICAgICAgIHsvKiB7cGFnZS5jb21wb25lbnRzLm1hcCgoY29tcCwgaW5kZXgpID0+IChcbiAgICAgICAgICA8Q29tcG9uZW50IGtleT17aW5kZXh9IHBhZ2U9e3BhZ2V9IGNvbXBvbmVudD17Y29tcH0gZGF0YT17ZGF0YX0gLz5cbiAgICAgICAgKSl9ICovfVxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctMic+XG4gICAgICAgICAgPGEgY2xhc3NOYW1lPSdwcmV2aWV3IHB1bGwtcmlnaHQgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICAgIGhyZWY9e3BhZ2UucGF0aH0gdGFyZ2V0PSdwcmV2aWV3Jz5PcGVuPC9hPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdidXR0b24gYWN0aXZlJ1xuICAgICAgICAgICAgb25DbGljaz17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogdHJ1ZSB9KX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBQYWdlJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0b3J9XG4gICAgICAgICAgb25IaWRlPXtlID0+IHRoaXMuc2hvd0VkaXRvcihlLCBmYWxzZSl9PlxuICAgICAgICAgIDxQYWdlRWRpdCBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIENvbXBvbmVudCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93QWRkQ29tcG9uZW50fVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRDb21wb25lbnQ6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8Q29tcG9uZW50Q3JlYXRlIHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkNyZWF0ZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBhZ2VcbiIsImNvbnN0IGxpc3RUeXBlcyA9IFsnU2VsZWN0RmllbGQnLCAnUmFkaW9zRmllbGQnLCAnQ2hlY2tib3hlc0ZpZWxkJ11cblxuZnVuY3Rpb24gY29tcG9uZW50VG9TdHJpbmcgKGNvbXBvbmVudCkge1xuICBpZiAofmxpc3RUeXBlcy5pbmRleE9mKGNvbXBvbmVudC50eXBlKSkge1xuICAgIHJldHVybiBgJHtjb21wb25lbnQudHlwZX08JHtjb21wb25lbnQub3B0aW9ucy5saXN0fT5gXG4gIH1cbiAgcmV0dXJuIGAke2NvbXBvbmVudC50eXBlfWBcbn1cblxuZnVuY3Rpb24gRGF0YU1vZGVsIChwcm9wcykge1xuICBjb25zdCB7IGRhdGEgfSA9IHByb3BzXG4gIGNvbnN0IHsgc2VjdGlvbnMsIHBhZ2VzIH0gPSBkYXRhXG5cbiAgY29uc3QgbW9kZWwgPSB7fVxuXG4gIHBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgcGFnZS5jb21wb25lbnRzLmZvckVhY2goY29tcG9uZW50ID0+IHtcbiAgICAgIGlmIChjb21wb25lbnQubmFtZSkge1xuICAgICAgICBpZiAocGFnZS5zZWN0aW9uKSB7XG4gICAgICAgICAgY29uc3Qgc2VjdGlvbiA9IHNlY3Rpb25zLmZpbmQoc2VjdGlvbiA9PiBzZWN0aW9uLm5hbWUgPT09IHBhZ2Uuc2VjdGlvbilcbiAgICAgICAgICBpZiAoIW1vZGVsW3NlY3Rpb24ubmFtZV0pIHtcbiAgICAgICAgICAgIG1vZGVsW3NlY3Rpb24ubmFtZV0gPSB7fVxuICAgICAgICAgIH1cblxuICAgICAgICAgIG1vZGVsW3NlY3Rpb24ubmFtZV1bY29tcG9uZW50Lm5hbWVdID0gY29tcG9uZW50VG9TdHJpbmcoY29tcG9uZW50KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1vZGVsW2NvbXBvbmVudC5uYW1lXSA9IGNvbXBvbmVudFRvU3RyaW5nKGNvbXBvbmVudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkobW9kZWwsIG51bGwsIDIpfTwvcHJlPlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IERhdGFNb2RlbFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgUGFnZUNyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IHBhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIC8vIFZhbGlkYXRlXG4gICAgaWYgKGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gcGF0aCkpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMucGF0aC5zZXRDdXN0b21WYWxpZGl0eShgUGF0aCAnJHtwYXRofScgYWxyZWFkeSBleGlzdHNgKVxuICAgICAgZm9ybS5yZXBvcnRWYWxpZGl0eSgpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9IHtcbiAgICAgIHBhdGg6IHBhdGhcbiAgICB9XG5cbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIHZhbHVlLnRpdGxlID0gdGl0bGVcbiAgICB9XG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIHZhbHVlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfVxuXG4gICAgLy8gQXBwbHlcbiAgICBPYmplY3QuYXNzaWduKHZhbHVlLCB7XG4gICAgICBjb21wb25lbnRzOiBbXSxcbiAgICAgIG5leHQ6IFtdXG4gICAgfSlcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29weS5wYWdlcy5wdXNoKHZhbHVlKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IHZhbHVlIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIC8vIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgLy8gICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gIC8vICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gIC8vICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gIC8vICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gIC8vICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgLy8gICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBMaXN0ICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBzZWN0aW9ucyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXBhdGgnPlBhdGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+RS5nLiAveW91ci1vY2N1cGF0aW9uIG9yIC9wZXJzb25hbC1kZXRhaWxzL2RhdGUtb2YtYmlydGg8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZFxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gZS50YXJnZXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtdGl0bGUnPlRpdGxlIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdwYWdlLXRpdGxlLWhpbnQnIGNsYXNzTmFtZT0nZ292dWstaGludCc+XG4gICAgICAgICAgICBJZiBub3Qgc3VwcGxpZWQsIHRoZSB0aXRsZSBvZiB0aGUgZmlyc3QgcXVlc3Rpb24gd2lsbCBiZSB1c2VkLlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3BhZ2UtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJz5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoc2VjdGlvbiA9PiAoPG9wdGlvbiBrZXk9e3NlY3Rpb24ubmFtZX0gdmFsdWU9e3NlY3Rpb24ubmFtZX0+e3NlY3Rpb24udGl0bGV9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gdHlwZT0nc3VibWl0JyBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbic+U2F2ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBMaW5rRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgY29uc3QgeyBkYXRhLCBlZGdlIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgcGFnZSA9IGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gZWRnZS5zb3VyY2UpXG4gICAgY29uc3QgbGluayA9IHBhZ2UubmV4dC5maW5kKG4gPT4gbi5wYXRoID09PSBlZGdlLnRhcmdldClcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBwYWdlOiBwYWdlLFxuICAgICAgbGluazogbGlua1xuICAgIH1cbiAgfVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGluayA9IGNvcHlQYWdlLm5leHQuZmluZChuID0+IG4ucGF0aCA9PT0gbGluay5wYXRoKVxuXG4gICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgY29weUxpbmsuaWYgPSBjb25kaXRpb25cbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlMaW5rLmlmXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGlua0lkeCA9IGNvcHlQYWdlLm5leHQuZmluZEluZGV4KG4gPT4gbi5wYXRoID09PSBsaW5rLnBhdGgpXG4gICAgY29weVBhZ2UubmV4dC5zcGxpY2UoY29weUxpbmtJZHgsIDEpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxpbmsgfSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGRhdGEsIGVkZ2UgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHBhZ2VzIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstc291cmNlJz5Gcm9tPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGRlZmF1bHRWYWx1ZT17ZWRnZS5zb3VyY2V9IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGluay1zb3VyY2UnIGRpc2FibGVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3BhZ2VzLm1hcChwYWdlID0+ICg8b3B0aW9uIGtleT17cGFnZS5wYXRofSB2YWx1ZT17cGFnZS5wYXRofT57cGFnZS5wYXRofTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstdGFyZ2V0Jz5UbzwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBkZWZhdWx0VmFsdWU9e2VkZ2UudGFyZ2V0fSBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstdGFyZ2V0JyBkaXNhYmxlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLWNvbmRpdGlvbic+Q29uZGl0aW9uIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdsaW5rLWNvbmRpdGlvbi1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgVGhlIGxpbmsgd2lsbCBvbmx5IGJlIHVzZWQgaWYgdGhlIGV4cHJlc3Npb24gZXZhbHVhdGVzIHRvIHRydXRoeS5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaW5rLWNvbmRpdGlvbicgbmFtZT0naWYnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpbmsuaWZ9IGFyaWEtZGVzY3JpYmVkYnk9J2xpbmstY29uZGl0aW9uLWhpbnQnIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlua0VkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIExpbmtDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBmcm9tID0gZm9ybURhdGEuZ2V0KCdwYXRoJylcbiAgICBjb25zdCB0byA9IGZvcm1EYXRhLmdldCgncGFnZScpXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IHBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IGZyb20pXG5cbiAgICBjb25zdCBuZXh0ID0geyBwYXRoOiB0byB9XG5cbiAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICBuZXh0LmlmID0gY29uZGl0aW9uXG4gICAgfVxuXG4gICAgaWYgKCFwYWdlLm5leHQpIHtcbiAgICAgIHBhZ2UubmV4dCA9IFtdXG4gICAgfVxuXG4gICAgcGFnZS5uZXh0LnB1c2gobmV4dClcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBuZXh0IH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXNvdXJjZSc+RnJvbTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstc291cmNlJyBuYW1lPSdwYXRoJyByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXRhcmdldCc+VG88L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaW5rLXRhcmdldCcgbmFtZT0ncGFnZScgcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7cGFnZXMubWFwKHBhZ2UgPT4gKDxvcHRpb24ga2V5PXtwYWdlLnBhdGh9IHZhbHVlPXtwYWdlLnBhdGh9PntwYWdlLnBhdGh9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay1jb25kaXRpb24nPkNvbmRpdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0nbGluay1jb25kaXRpb24taGludCcgY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5cbiAgICAgICAgICAgIFRoZSBsaW5rIHdpbGwgb25seSBiZSB1c2VkIGlmIHRoZSBleHByZXNzaW9uIGV2YWx1YXRlcyB0byB0cnV0aHkuXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGluay1jb25kaXRpb24nIG5hbWU9J2lmJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0nbGluay1jb25kaXRpb24taGludCcgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpbmtDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmZ1bmN0aW9uIGhlYWREdXBsaWNhdGUgKGFycikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGFyci5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGFycltqXSA9PT0gYXJyW2ldKSB7XG4gICAgICAgIHJldHVybiBqXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIExpc3RJdGVtcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpdGVtczogcHJvcHMuaXRlbXMgPyBjbG9uZShwcm9wcy5pdGVtcykgOiBbXVxuICAgIH1cbiAgfVxuXG4gIG9uQ2xpY2tBZGRJdGVtID0gZSA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5jb25jYXQoeyB0ZXh0OiAnJywgdmFsdWU6ICcnLCBkZXNjcmlwdGlvbjogJycgfSlcbiAgICB9KVxuICB9XG5cbiAgcmVtb3ZlSXRlbSA9IGlkeCA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5maWx0ZXIoKHMsIGkpID0+IGkgIT09IGlkeClcbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIGxpc3RcbiAgICBjb3B5Lmxpc3RzLnNwbGljZShkYXRhLmxpc3RzLmluZGV4T2YobGlzdCksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIGxpc3RcbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAubGlzdFxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyID0gZSA9PiB7XG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0LmZvcm1cbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcblxuICAgIC8vIE9ubHkgdmFsaWRhdGUgZHVwZXMgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBpdGVtXG4gICAgaWYgKHRleHRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGZvcm0uZWxlbWVudHMudGV4dC5mb3JFYWNoKGVsID0+IGVsLnNldEN1c3RvbVZhbGlkaXR5KCcnKSlcbiAgICBmb3JtLmVsZW1lbnRzLnZhbHVlLmZvckVhY2goZWwgPT4gZWwuc2V0Q3VzdG9tVmFsaWRpdHkoJycpKVxuXG4gICAgLy8gVmFsaWRhdGUgdW5pcXVlbmVzc1xuICAgIGNvbnN0IGR1cGVUZXh0ID0gaGVhZER1cGxpY2F0ZSh0ZXh0cylcbiAgICBpZiAoZHVwZVRleHQpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMudGV4dFtkdXBlVGV4dF0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB0ZXh0cyBmb3VuZCBpbiB0aGUgbGlzdCBpdGVtcycpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBkdXBlVmFsdWUgPSBoZWFkRHVwbGljYXRlKHZhbHVlcylcbiAgICBpZiAoZHVwZVZhbHVlKSB7XG4gICAgICBmb3JtLmVsZW1lbnRzLnZhbHVlW2R1cGVWYWx1ZV0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB2YWx1ZXMgZm91bmQgaW4gdGhlIGxpc3QgaXRlbXMnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBpdGVtcyB9ID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHsgdHlwZSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDx0YWJsZSBjbGFzc05hbWU9J2dvdnVrLXRhYmxlJz5cbiAgICAgICAgPGNhcHRpb24gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2FwdGlvbic+SXRlbXM8L2NhcHRpb24+XG4gICAgICAgIDx0aGVhZCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkJz5cbiAgICAgICAgICA8dHIgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93Jz5cbiAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkZXInIHNjb3BlPSdjb2wnPlRleHQ8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+VmFsdWU8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+RGVzY3JpcHRpb248L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17dGhpcy5vbkNsaWNrQWRkSXRlbX0+QWRkPC9hPlxuICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICA8L3RoZWFkPlxuICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fYm9keSc+XG4gICAgICAgICAge2l0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IChcbiAgICAgICAgICAgIDx0ciBrZXk9e2l0ZW0udmFsdWUgKyBpbmRleH0gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93JyBzY29wZT0ncm93Jz5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBuYW1lPSd0ZXh0J1xuICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnRleHR9IHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyfSAvPlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAge3R5cGUgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICA/IChcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J3ZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9J251bWJlcicgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IHN0ZXA9J2FueScgLz5cbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIDogKFxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgbmFtZT0ndmFsdWUnXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IC8+XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J2Rlc2NyaXB0aW9uJ1xuICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLmRlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1cn0gLz5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnIHdpZHRoPScyMHB4Jz5cbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J2xpc3QtaXRlbS1kZWxldGUnIG9uQ2xpY2s9eygpID0+IHRoaXMucmVtb3ZlSXRlbShpbmRleCl9PiYjMTI4NDY1OzwvYT5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0SXRlbXNcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICB0eXBlOiBwcm9wcy5saXN0LnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBuZXdUeXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gbGlzdC5uYW1lXG4gICAgY29uc3QgY29weUxpc3QgPSBjb3B5Lmxpc3RzW2RhdGEubGlzdHMuaW5kZXhPZihsaXN0KV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weUxpc3QubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIHAuY29tcG9uZW50cy5mb3JFYWNoKGMgPT4ge1xuICAgICAgICAgIGlmIChjLnR5cGUgPT09ICdTZWxlY3RGaWVsZCcgfHwgYy50eXBlID09PSAnUmFkaW9zRmllbGQnKSB7XG4gICAgICAgICAgICBpZiAoYy5vcHRpb25zICYmIGMub3B0aW9ucy5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgICAgICAgYy5vcHRpb25zLmxpc3QgPSBuZXdOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5TGlzdC50aXRsZSA9IG5ld1RpdGxlXG4gICAgY29weUxpc3QudHlwZSA9IG5ld1R5cGVcblxuICAgIC8vIEl0ZW1zXG4gICAgY29uc3QgdGV4dHMgPSBmb3JtRGF0YS5nZXRBbGwoJ3RleHQnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCB2YWx1ZXMgPSBmb3JtRGF0YS5nZXRBbGwoJ3ZhbHVlJykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29uc3QgZGVzY3JpcHRpb25zID0gZm9ybURhdGEuZ2V0QWxsKCdkZXNjcmlwdGlvbicpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvcHlMaXN0Lml0ZW1zID0gdGV4dHMubWFwKCh0LCBpKSA9PiAoe1xuICAgICAgdGV4dDogdCxcbiAgICAgIHZhbHVlOiB2YWx1ZXNbaV0sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25zW2ldXG4gIH0pKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgbGlzdCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBsaXN0XG4gICAgY29weS5saXN0cy5zcGxpY2UoZGF0YS5saXN0cy5pbmRleE9mKGxpc3QpLCAxKVxuXG4gICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAubGlzdCA9PT0gbGlzdC5uYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBwLmxpc3RcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwgIT09IGxpc3QgJiYgbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMjAnIGlkPSdsaXN0LW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstIS13aWR0aC10d28tdGhpcmRzJyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QudGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10eXBlJz5WYWx1ZSB0eXBlPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIGl0ZW1zPXtsaXN0Lml0ZW1zfSB0eXBlPXtzdGF0ZS50eXBlfSAvPlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdEVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdENyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIHR5cGU6IHByb3BzLnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB0eXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gSXRlbXNcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCBkZXNjcmlwdGlvbnMgPSBmb3JtRGF0YS5nZXRBbGwoJ2Rlc2NyaXB0aW9uJykubWFwKHQgPT4gdC50cmltKCkpXG5cbiAgICBjb25zdCBpdGVtcyA9IHRleHRzLm1hcCgodCwgaSkgPT4gKHtcbiAgICAgIHRleHQ6IHQsXG4gICAgICB2YWx1ZTogdmFsdWVzW2ldLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uc1tpXVxuICB9KSlcblxuICAgIGNvcHkubGlzdHMucHVzaCh7IG5hbWUsIHRpdGxlLCB0eXBlLCBpdGVtcyB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpc3QtbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtdHlwZSc+VmFsdWUgdHlwZTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIHR5cGU9e3N0YXRlLnR5cGV9IC8+XG5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IExpc3RFZGl0IGZyb20gJy4vbGlzdC1lZGl0J1xuaW1wb3J0IExpc3RDcmVhdGUgZnJvbSAnLi9saXN0LWNyZWF0ZSdcblxuY2xhc3MgTGlzdHNFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uQ2xpY2tMaXN0ID0gKGUsIGxpc3QpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbGlzdDogbGlzdFxuICAgIH0pXG4gIH1cblxuICBvbkNsaWNrQWRkTGlzdCA9IChlLCBsaXN0KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dBZGRMaXN0OiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBsaXN0cyB9ID0gZGF0YVxuICAgIGNvbnN0IGxpc3QgPSB0aGlzLnN0YXRlLmxpc3RcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstYm9keSc+XG4gICAgICAgIHshbGlzdCA/IChcbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAge3RoaXMuc3RhdGUuc2hvd0FkZExpc3QgPyAoXG4gICAgICAgICAgICAgIDxMaXN0Q3JlYXRlIGRhdGE9e2RhdGF9XG4gICAgICAgICAgICAgICAgb25DcmVhdGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaXN0OiBmYWxzZSB9KX1cbiAgICAgICAgICAgICAgICBvbkNhbmNlbD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpc3Q6IGZhbHNlIH0pfSAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT0nZ292dWstbGlzdCc+XG4gICAgICAgICAgICAgICAge2xpc3RzLm1hcCgobGlzdCwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgIDxsaSBrZXk9e2xpc3QubmFtZX0+XG4gICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5vbkNsaWNrTGlzdChlLCBsaXN0KX0+XG4gICAgICAgICAgICAgICAgICAgICAge2xpc3QudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgPGhyIC8+XG4gICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja0FkZExpc3QoZSl9PkFkZCBsaXN0PC9hPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxMaXN0RWRpdCBsaXN0PXtsaXN0fSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBsaXN0OiBudWxsIH0pfVxuICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IGxpc3Q6IG51bGwgfSl9IC8+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdHNFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBTZWN0aW9uRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gc2VjdGlvbi5uYW1lXG4gICAgY29uc3QgY29weVNlY3Rpb24gPSBjb3B5LnNlY3Rpb25zW2RhdGEuc2VjdGlvbnMuaW5kZXhPZihzZWN0aW9uKV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weVNlY3Rpb24ubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBzZWN0aW9uXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChwLnNlY3Rpb24gPT09IHNlY3Rpb24ubmFtZSkge1xuICAgICAgICAgIHAuc2VjdGlvbiA9IG5ld05hbWVcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5U2VjdGlvbi50aXRsZSA9IG5ld1RpdGxlXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIHNlY3Rpb25cbiAgICBjb3B5LnNlY3Rpb25zLnNwbGljZShkYXRhLnNlY3Rpb25zLmluZGV4T2Yoc2VjdGlvbiksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIHNlY3Rpb25cbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5zZWN0aW9uID09PSBzZWN0aW9uLm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAuc2VjdGlvblxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5zZWN0aW9ucy5maW5kKHMgPT4gcyAhPT0gc2VjdGlvbiAmJiBzLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTmFtZSAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nc2VjdGlvbi1uYW1lJyBuYW1lPSduYW1lJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtzZWN0aW9uLm5hbWV9IHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtzZWN0aW9uLnRpdGxlfSByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgU2VjdGlvbkNyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIGNvbnN0IHNlY3Rpb24gPSB7IG5hbWUsIHRpdGxlIH1cbiAgICBjb3B5LnNlY3Rpb25zLnB1c2goc2VjdGlvbilcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEuc2VjdGlvbnMuZmluZChzID0+IHMubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBOYW1lICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhpcyBpcyB1c2VkIGFzIGEgbmFtZXNwYWNlIGluIHRoZSBKU09OIG91dHB1dCBmb3IgYWxsIHBhZ2VzIGluIHRoaXMgc2VjdGlvbi4gVXNlIGBjYW1lbENhc2luZ2AgZS5nLiBjaGVja0JlZm9yZVN0YXJ0IG9yIHBlcnNvbmFsRGV0YWlscy48L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKydcbiAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJOYW1lfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5UaGlzIHRleHQgZGlzcGxheWVkIG9uIHRoZSBwYWdlIGFib3ZlIHRoZSBtYWluIHRpdGxlLjwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWQgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCBTZWN0aW9uRWRpdCBmcm9tICcuL3NlY3Rpb24tZWRpdCdcbmltcG9ydCBTZWN0aW9uQ3JlYXRlIGZyb20gJy4vc2VjdGlvbi1jcmVhdGUnXG5cbmNsYXNzIFNlY3Rpb25zRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrU2VjdGlvbiA9IChlLCBzZWN0aW9uKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlY3Rpb246IHNlY3Rpb25cbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0FkZFNlY3Rpb24gPSAoZSwgc2VjdGlvbikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzaG93QWRkU2VjdGlvbjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5zdGF0ZS5zZWN0aW9uXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWJvZHknPlxuICAgICAgICB7IXNlY3Rpb24gPyAoXG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIHt0aGlzLnN0YXRlLnNob3dBZGRTZWN0aW9uID8gKFxuICAgICAgICAgICAgICA8U2VjdGlvbkNyZWF0ZSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgICAgIG9uQ3JlYXRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkU2VjdGlvbjogZmFsc2UgfSl9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRTZWN0aW9uOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9J2dvdnVrLWxpc3QnPlxuICAgICAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoKHNlY3Rpb24sIGluZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8bGkga2V5PXtzZWN0aW9uLm5hbWV9PlxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja1NlY3Rpb24oZSwgc2VjdGlvbil9PlxuICAgICAgICAgICAgICAgICAgICAgIHtzZWN0aW9uLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgIDxociAvPlxuICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tBZGRTZWN0aW9uKGUpfT5BZGQgc2VjdGlvbjwvYT5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8U2VjdGlvbkVkaXQgc2VjdGlvbj17c2VjdGlvbn0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2VjdGlvbjogbnVsbCB9KX1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzZWN0aW9uOiBudWxsIH0pfSAvPlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlY3Rpb25zRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0IFJlYWN0RE9NIGRhZ3JlICovXG5cbmltcG9ydCBQYWdlIGZyb20gJy4vcGFnZSdcbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgRGF0YU1vZGVsIGZyb20gJy4vZGF0YS1tb2RlbCdcbmltcG9ydCBQYWdlQ3JlYXRlIGZyb20gJy4vcGFnZS1jcmVhdGUnXG5pbXBvcnQgTGlua0VkaXQgZnJvbSAnLi9saW5rLWVkaXQnXG5pbXBvcnQgTGlua0NyZWF0ZSBmcm9tICcuL2xpbmstY3JlYXRlJ1xuaW1wb3J0IExpc3RzRWRpdCBmcm9tICcuL2xpc3RzLWVkaXQnXG5pbXBvcnQgU2VjdGlvbnNFZGl0IGZyb20gJy4vc2VjdGlvbnMtZWRpdCdcblxuZnVuY3Rpb24gZ2V0TGF5b3V0IChwYWdlcywgZWwpIHtcbiAgLy8gQ3JlYXRlIGEgbmV3IGRpcmVjdGVkIGdyYXBoXG4gIHZhciBnID0gbmV3IGRhZ3JlLmdyYXBobGliLkdyYXBoKClcblxuICAvLyBTZXQgYW4gb2JqZWN0IGZvciB0aGUgZ3JhcGggbGFiZWxcbiAgZy5zZXRHcmFwaCh7XG4gICAgcmFua2RpcjogJ0xSJyxcbiAgICBtYXJnaW54OiA1MCxcbiAgICBtYXJnaW55OiAxNTAsXG4gICAgcmFua3NlcDogMTYwXG4gIH0pXG5cbiAgLy8gRGVmYXVsdCB0byBhc3NpZ25pbmcgYSBuZXcgb2JqZWN0IGFzIGEgbGFiZWwgZm9yIGVhY2ggbmV3IGVkZ2UuXG4gIGcuc2V0RGVmYXVsdEVkZ2VMYWJlbChmdW5jdGlvbiAoKSB7IHJldHVybiB7fSB9KVxuXG4gIC8vIEFkZCBub2RlcyB0byB0aGUgZ3JhcGguIFRoZSBmaXJzdCBhcmd1bWVudCBpcyB0aGUgbm9kZSBpZC4gVGhlIHNlY29uZCBpc1xuICAvLyBtZXRhZGF0YSBhYm91dCB0aGUgbm9kZS4gSW4gdGhpcyBjYXNlIHdlJ3JlIGdvaW5nIHRvIGFkZCBsYWJlbHMgdG8gZWFjaCBub2RlXG4gIHBhZ2VzLmZvckVhY2goKHBhZ2UsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgcGFnZUVsID0gZWwuY2hpbGRyZW5baW5kZXhdXG5cbiAgICBnLnNldE5vZGUocGFnZS5wYXRoLCB7IGxhYmVsOiBwYWdlLnBhdGgsIHdpZHRoOiBwYWdlRWwub2Zmc2V0V2lkdGgsIGhlaWdodDogcGFnZUVsLm9mZnNldEhlaWdodCB9KVxuICB9KVxuXG4gIC8vIEFkZCBlZGdlcyB0byB0aGUgZ3JhcGguXG4gIHBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFnZS5uZXh0KSkge1xuICAgICAgcGFnZS5uZXh0LmZvckVhY2gobmV4dCA9PiB7XG4gICAgICAgIC8vIFRoZSBsaW5rZWQgbm9kZSAobmV4dCBwYWdlKSBtYXkgbm90IGV4aXN0IGlmIGl0J3MgZmlsdGVyZWRcbiAgICAgICAgY29uc3QgZXhpc3RzID0gcGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gbmV4dC5wYXRoKVxuICAgICAgICBpZiAoZXhpc3RzKSB7XG4gICAgICAgICAgZy5zZXRFZGdlKHBhZ2UucGF0aCwgbmV4dC5wYXRoKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBkYWdyZS5sYXlvdXQoZylcblxuICBjb25zdCBwb3MgPSB7XG4gICAgbm9kZXM6IFtdLFxuICAgIGVkZ2VzOiBbXVxuICB9XG5cbiAgY29uc3Qgb3V0cHV0ID0gZy5ncmFwaCgpXG4gIHBvcy53aWR0aCA9IG91dHB1dC53aWR0aCArICdweCdcbiAgcG9zLmhlaWdodCA9IG91dHB1dC5oZWlnaHQgKyAncHgnXG4gIGcubm9kZXMoKS5mb3JFYWNoKCh2LCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IG5vZGUgPSBnLm5vZGUodilcbiAgICBjb25zdCBwdCA9IHsgbm9kZSB9XG4gICAgcHQudG9wID0gKG5vZGUueSAtIG5vZGUuaGVpZ2h0IC8gMikgKyAncHgnXG4gICAgcHQubGVmdCA9IChub2RlLnggLSBub2RlLndpZHRoIC8gMikgKyAncHgnXG4gICAgcG9zLm5vZGVzLnB1c2gocHQpXG4gIH0pXG5cbiAgZy5lZGdlcygpLmZvckVhY2goKGUsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgZWRnZSA9IGcuZWRnZShlKVxuICAgIHBvcy5lZGdlcy5wdXNoKHtcbiAgICAgIHNvdXJjZTogZS52LFxuICAgICAgdGFyZ2V0OiBlLncsXG4gICAgICBwb2ludHM6IGVkZ2UucG9pbnRzLm1hcChwID0+IHtcbiAgICAgICAgY29uc3QgcHQgPSB7fVxuICAgICAgICBwdC55ID0gcC55XG4gICAgICAgIHB0LnggPSBwLnhcbiAgICAgICAgcmV0dXJuIHB0XG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgcmV0dXJuIHsgZywgcG9zIH1cbn1cblxuY2xhc3MgTGluZXMgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgZWRpdExpbmsgPSAoZWRnZSkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdjbGlja2VkJywgZWRnZSlcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dFZGl0b3I6IGVkZ2VcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxheW91dCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxzdmcgaGVpZ2h0PXtsYXlvdXQuaGVpZ2h0fSB3aWR0aD17bGF5b3V0LndpZHRofT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYXlvdXQuZWRnZXMubWFwKGVkZ2UgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBwb2ludHMgPSBlZGdlLnBvaW50cy5tYXAocG9pbnRzID0+IGAke3BvaW50cy54fSwke3BvaW50cy55fWApLmpvaW4oJyAnKVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxnIGtleT17cG9pbnRzfT5cbiAgICAgICAgICAgICAgICAgIDxwb2x5bGluZVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLmVkaXRMaW5rKGVkZ2UpfVxuICAgICAgICAgICAgICAgICAgICBwb2ludHM9e3BvaW50c30gLz5cbiAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICA8L3N2Zz5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IExpbmsnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8TGlua0VkaXQgZWRnZT17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgTWluaW1hcCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrUGFnZSA9IChlLCBwYXRoKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMucHJvcHMudG9nZ2xlRmlsdGVyUGF0aChwYXRoKVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxheW91dCwgc2NhbGUgPSAwLjA1IH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J21pbmltYXAnPlxuICAgICAgICA8c3ZnIGhlaWdodD17cGFyc2VGbG9hdChsYXlvdXQuaGVpZ2h0KSAqIHNjYWxlfSB3aWR0aD17cGFyc2VGbG9hdChsYXlvdXQud2lkdGgpICogc2NhbGV9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5lZGdlcy5tYXAoZWRnZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHBvaW50cyA9IGVkZ2UucG9pbnRzLm1hcChwb2ludHMgPT4gYCR7cG9pbnRzLnggKiBzY2FsZX0sJHtwb2ludHMueSAqIHNjYWxlfWApLmpvaW4oJyAnKVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxnIGtleT17cG9pbnRzfT5cbiAgICAgICAgICAgICAgICAgIDxwb2x5bGluZSBwb2ludHM9e3BvaW50c30gLz5cbiAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5ub2Rlcy5tYXAoKG5vZGUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGcga2V5PXtub2RlICsgaW5kZXh9PlxuICAgICAgICAgICAgICAgICAgPGEgeGxpbmtIcmVmPXtgIyR7bm9kZS5ub2RlLmxhYmVsfWB9PlxuICAgICAgICAgICAgICAgICAgICA8cmVjdCB4PXtwYXJzZUZsb2F0KG5vZGUubGVmdCkgKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICB5PXtwYXJzZUZsb2F0KG5vZGUudG9wKSAqIHNjYWxlfVxuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXtub2RlLm5vZGUud2lkdGggKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9e25vZGUubm9kZS5oZWlnaHQgKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bm9kZS5ub2RlLmxhYmVsfSAvPlxuICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgIDwvZz5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIDwvc3ZnPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIFZpc3VhbGlzYXRpb24gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHtcbiAgICBmaWx0ZXJQYXRoczogW11cbiAgfVxuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5yZWYgPSBSZWFjdC5jcmVhdGVSZWYoKVxuICB9XG5cbiAgc2NoZWR1bGVMYXlvdXQgKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc3QgcGFnZXMgPSB0aGlzLmdldEZpbHRlcmVkUGFnZXMoKVxuICAgICAgY29uc3QgbGF5b3V0ID0gZ2V0TGF5b3V0KHBhZ2VzLCB0aGlzLnJlZi5jdXJyZW50KVxuXG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgbGF5b3V0OiBsYXlvdXQucG9zXG4gICAgICB9KVxuICAgIH0sIDIwMClcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50ICgpIHtcbiAgICB0aGlzLnNjaGVkdWxlTGF5b3V0KClcbiAgfVxuXG4gIGdldEZpbHRlcmVkUGFnZXMgKCkge1xuICAgIGNvbnN0IGluY2x1ZGVVcHN0cmVhbSA9IHRydWVcbiAgICBjb25zdCBpbmNsdWRlRG93bnN0cmVhbSA9IHRydWVcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IGZpbHRlclBhdGhzIH0gPSB0aGlzLnN0YXRlXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgaWYgKCFmaWx0ZXJQYXRocy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBwYWdlc1xuICAgIH1cblxuICAgIGNvbnN0IGZpbHRlcmVkUGFnZXMgPSBmaWx0ZXJQYXRocy5tYXAocGF0aCA9PiBwYWdlcy5maW5kKHBhZ2UgPT4gcGFnZS5wYXRoID09PSBwYXRoKSlcblxuICAgIC8vIFVwc3RyZWFtIHBhdGhzXG4gICAgY29uc3QgdXBzdHJlYW1QYXRocyA9IHt9XG5cbiAgICBpZiAoaW5jbHVkZVVwc3RyZWFtKSB7XG4gICAgICBmaWx0ZXJlZFBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHBhZ2UubmV4dCkpIHtcbiAgICAgICAgICBwYWdlLm5leHQuZm9yRWFjaChuZXh0ID0+IHtcbiAgICAgICAgICAgIHVwc3RyZWFtUGF0aHNbbmV4dC5wYXRoXSA9IHRydWVcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIERvd25zdHJlYW0gcGF0aHNcbiAgICBjb25zdCBkb3duc3RyZWFtUGF0aHMgPSB7fVxuXG4gICAgaWYgKGluY2x1ZGVEb3duc3RyZWFtKSB7XG4gICAgICBwYWdlcy5mb3JFYWNoKHBhZ2UgPT4ge1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShwYWdlLm5leHQpKSB7XG4gICAgICAgICAgcGFnZS5uZXh0LmZvckVhY2gobmV4dCA9PiB7XG4gICAgICAgICAgICBpZiAoZmlsdGVyUGF0aHMuaW5jbHVkZXMobmV4dC5wYXRoKSkge1xuICAgICAgICAgICAgICBkb3duc3RyZWFtUGF0aHNbcGFnZS5wYXRoXSA9IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvbnN0IGZpbHRlciA9IChwYWdlKSA9PiB7XG4gICAgICByZXR1cm4gZmlsdGVyUGF0aHMuaW5jbHVkZXMocGFnZS5wYXRoKSB8fFxuICAgICAgICB1cHN0cmVhbVBhdGhzW3BhZ2UucGF0aF0gfHxcbiAgICAgICAgZG93bnN0cmVhbVBhdGhzW3BhZ2UucGF0aF1cbiAgICB9XG5cbiAgICByZXR1cm4gZGF0YS5wYWdlcy5maWx0ZXIoZmlsdGVyKVxuICB9XG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyAoKSB7XG4gICAgdGhpcy5zY2hlZHVsZUxheW91dCgpXG4gIH1cblxuICB0b2dnbGVGaWx0ZXJQYXRoID0gKHBhdGgpID0+IHtcbiAgICBjb25zdCB7IGZpbHRlclBhdGhzIH0gPSB0aGlzLnN0YXRlXG4gICAgY29uc3QgaWR4ID0gZmlsdGVyUGF0aHMuaW5kZXhPZihwYXRoKVxuXG4gICAgaWYgKGlkeCA+IC0xKSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgZmlsdGVyUGF0aHM6IGZpbHRlclBhdGhzLmZpbHRlcigoaXRlbSwgaW5kZXgpID0+IGluZGV4ID09PSBpZHgpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgZmlsdGVyUGF0aHM6IGZpbHRlclBhdGhzLmNvbmNhdChwYXRoKVxuICAgICAgfSlcbiAgICB9XG5cbiAgICB0aGlzLnNjaGVkdWxlTGF5b3V0KClcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBmaWx0ZXJQYXRocyB9ID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHBhZ2VzID0gdGhpcy5nZXRGaWx0ZXJlZFBhZ2VzKClcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHJlZj17dGhpcy5yZWZ9IGNsYXNzTmFtZT0ndmlzdWFsaXNhdGlvbicgc3R5bGU9e3RoaXMuc3RhdGUubGF5b3V0ICYmXG4gICAgICAgIHsgd2lkdGg6IHRoaXMuc3RhdGUubGF5b3V0LndpZHRoLCBoZWlnaHQ6IHRoaXMuc3RhdGUubGF5b3V0LmhlaWdodCB9fT5cbiAgICAgICAge3BhZ2VzLm1hcCgocGFnZSwgaW5kZXgpID0+IDxQYWdlXG4gICAgICAgICAga2V5PXtpbmRleH0gZGF0YT17ZGF0YX0gcGFnZT17cGFnZX0gZmlsdGVyZWQ9eyFmaWx0ZXJQYXRocy5pbmNsdWRlcyhwYWdlLnBhdGgpfVxuICAgICAgICAgIGxheW91dD17dGhpcy5zdGF0ZS5sYXlvdXQgJiYgdGhpcy5zdGF0ZS5sYXlvdXQubm9kZXNbaW5kZXhdfSAvPlxuICAgICAgICApfVxuICAgICAgICB7dGhpcy5zdGF0ZS5sYXlvdXQgJiZcbiAgICAgICAgICA8TGluZXMgbGF5b3V0PXt0aGlzLnN0YXRlLmxheW91dH0gZGF0YT17ZGF0YX0gLz59XG5cbiAgICAgICAge3RoaXMuc3RhdGUubGF5b3V0ICYmXG4gICAgICAgICAgPE1pbmltYXAgbGF5b3V0PXt0aGlzLnN0YXRlLmxheW91dH0gZGF0YT17ZGF0YX0gLz59XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgTWVudSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrVXBsb2FkID0gKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXBsb2FkJykuY2xpY2soKVxuICB9XG5cbiAgb25GaWxlVXBsb2FkID0gKGUpID0+IHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBmaWxlID0gZS50YXJnZXQuZmlsZXMuaXRlbSgwKVxuICAgIGNvbnN0IHJlYWRlciA9IG5ldyB3aW5kb3cuRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc1RleHQoZmlsZSwgJ1VURi04JylcbiAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgY29uc3QgY29udGVudCA9IEpTT04ucGFyc2UoZXZ0LnRhcmdldC5yZXN1bHQpXG4gICAgICBkYXRhLnNhdmUoY29udGVudClcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGxheWdyb3VuZE1vZGUgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbWVudSc+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPXtgZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0JHt0aGlzLnN0YXRlLnNob3dNZW51ID8gJyBnb3Z1ay0hLW1hcmdpbi1yaWdodC0yJyA6ICcnfWB9XG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dNZW51OiAhdGhpcy5zdGF0ZS5zaG93TWVudSB9KX0+4piwPC9idXR0b24+XG4gICAgICAgIHt0aGlzLnN0YXRlLnNob3dNZW51ICYmIDxzcGFuIGNsYXNzTmFtZT0nbWVudS1pbm5lcic+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkUGFnZTogdHJ1ZSB9KX0+QWRkIFBhZ2U8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGluazogdHJ1ZSB9KX0+QWRkIExpbms8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdFNlY3Rpb25zOiB0cnVlIH0pfT5FZGl0IFNlY3Rpb25zPC9idXR0b24+eycgJ31cblxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRMaXN0czogdHJ1ZSB9KX0+RWRpdCBMaXN0czwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dEYXRhTW9kZWw6IHRydWUgfSl9PlZpZXcgRGF0YSBNb2RlbDwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dKU09ORGF0YTogdHJ1ZSB9KX0+VmlldyBKU09OPC9idXR0b24+eycgJ31cblxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd1N1bW1hcnk6IHRydWUgfSl9PlN1bW1hcnk8L2J1dHRvbj5cblxuICAgICAgICAgIHtwbGF5Z3JvdW5kTW9kZSAmJiAoXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tdG9wLTQnPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J2dvdnVrLWxpbmsgZ292dWstbGluay0tbm8tdmlzaXRlZC1zdGF0ZSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgZG93bmxvYWQgaHJlZj0nL2FwaS9kYXRhP2Zvcm1hdD10cnVlJz5Eb3dubG9hZCBKU09OPC9hPnsnICd9XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0nZ292dWstbGluayBnb3Z1ay1saW5rLS1uby12aXNpdGVkLXN0YXRlIGdvdnVrLSEtZm9udC1zaXplLTE2JyBocmVmPScjJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tVcGxvYWR9PlVwbG9hZCBKU09OPC9hPnsnICd9XG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSdmaWxlJyBpZD0ndXBsb2FkJyBoaWRkZW4gb25DaGFuZ2U9e3RoaXMub25GaWxlVXBsb2FkfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cblxuICAgICAgICAgIDxGbHlvdXQgdGl0bGU9J0FkZCBQYWdlJyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRQYWdlfVxuICAgICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFBhZ2U6IGZhbHNlIH0pfT5cbiAgICAgICAgICAgIDxQYWdlQ3JlYXRlIGRhdGE9e2RhdGF9IG9uQ3JlYXRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFBhZ2U6IGZhbHNlIH0pfSAvPlxuICAgICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIExpbmsnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0FkZExpbmt9XG4gICAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGluazogZmFsc2UgfSl9PlxuICAgICAgICAgICAgPExpbmtDcmVhdGUgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGluazogZmFsc2UgfSl9IC8+XG4gICAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IFNlY3Rpb25zJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0U2VjdGlvbnN9XG4gICAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdFNlY3Rpb25zOiBmYWxzZSB9KX0+XG4gICAgICAgICAgICA8U2VjdGlvbnNFZGl0IGRhdGE9e2RhdGF9IG9uQ3JlYXRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRTZWN0aW9uczogZmFsc2UgfSl9IC8+XG4gICAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IExpc3RzJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0TGlzdHN9XG4gICAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdExpc3RzOiBmYWxzZSB9KX0gd2lkdGg9J3hsYXJnZSc+XG4gICAgICAgICAgICA8TGlzdHNFZGl0IGRhdGE9e2RhdGF9IG9uQ3JlYXRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRMaXN0czogZmFsc2UgfSl9IC8+XG4gICAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgICA8Rmx5b3V0IHRpdGxlPSdEYXRhIE1vZGVsJyBzaG93PXt0aGlzLnN0YXRlLnNob3dEYXRhTW9kZWx9XG4gICAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RGF0YU1vZGVsOiBmYWxzZSB9KX0+XG4gICAgICAgICAgICA8RGF0YU1vZGVsIGRhdGE9e2RhdGF9IC8+XG4gICAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgICA8Rmx5b3V0IHRpdGxlPSdKU09OIERhdGEnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0pTT05EYXRhfVxuICAgICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0pTT05EYXRhOiBmYWxzZSB9KX0gd2lkdGg9J2xhcmdlJz5cbiAgICAgICAgICAgIDxwcmU+e0pTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpfTwvcHJlPlxuICAgICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgICAgPEZseW91dCB0aXRsZT0nU3VtbWFyeScgc2hvdz17dGhpcy5zdGF0ZS5zaG93U3VtbWFyeX1cbiAgICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dTdW1tYXJ5OiBmYWxzZSB9KX0+XG4gICAgICAgICAgICA8cHJlPntKU09OLnN0cmluZ2lmeShkYXRhLnBhZ2VzLm1hcChwYWdlID0+IHBhZ2UucGF0aCksIG51bGwsIDIpfTwvcHJlPlxuICAgICAgICAgIDwvRmx5b3V0PlxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIH1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5jbGFzcyBBcHAgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgY29tcG9uZW50V2lsbE1vdW50ICgpIHtcbiAgICB3aW5kb3cuZmV0Y2goJy9hcGkvZGF0YScpLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpLnRoZW4oZGF0YSA9PiB7XG4gICAgICBkYXRhLnNhdmUgPSB0aGlzLnNhdmVcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBsb2FkZWQ6IHRydWUsIGRhdGEgfSlcbiAgICB9KVxuICB9XG5cbiAgc2F2ZSA9ICh1cGRhdGVkRGF0YSkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuZmV0Y2goYC9hcGkvZGF0YWAsIHtcbiAgICAgIG1ldGhvZDogJ3B1dCcsXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh1cGRhdGVkRGF0YSlcbiAgICB9KS50aGVuKHJlcyA9PiB7XG4gICAgICBpZiAoIXJlcy5vaykge1xuICAgICAgICB0aHJvdyBFcnJvcihyZXMuc3RhdHVzVGV4dClcbiAgICAgIH1cbiAgICAgIHJldHVybiByZXNcbiAgICB9KS50aGVuKHJlcyA9PiByZXMuanNvbigpKS50aGVuKGRhdGEgPT4ge1xuICAgICAgZGF0YS5zYXZlID0gdGhpcy5zYXZlXG4gICAgICB0aGlzLnNldFN0YXRlKHsgZGF0YSB9KVxuXG4gICAgICAvLyBSZWxvYWQgZnJhbWUgaWYgc3BsaXQgc2NyZWVuIGFuZCBpbiBwbGF5Z3JvdW5kIG1vZGVcbiAgICAgIGlmICh3aW5kb3cuREZCRC5wbGF5Z3JvdW5kTW9kZSkge1xuICAgICAgICBjb25zdCBwYXJlbnQgPSB3aW5kb3cucGFyZW50XG4gICAgICAgIGlmIChwYXJlbnQubG9jYXRpb24ucGF0aG5hbWUgPT09ICcvc3BsaXQnKSB7XG4gICAgICAgICAgY29uc3QgZnJhbWVzID0gd2luZG93LnBhcmVudC5mcmFtZXNcblxuICAgICAgICAgIGlmIChmcmFtZXMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICBjb25zdCBwcmV2aWV3ID0gd2luZG93LnBhcmVudC5mcmFtZXNbMV1cbiAgICAgICAgICAgIHByZXZpZXcubG9jYXRpb24ucmVsb2FkKClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB3aW5kb3cuYWxlcnQoJ1NhdmUgZmFpbGVkJylcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5sb2FkZWQpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgaWQ9J2FwcCc+XG4gICAgICAgICAgPE1lbnUgZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSBwbGF5Z3JvdW5kTW9kZT17d2luZG93LkRGQkQucGxheWdyb3VuZE1vZGV9IC8+XG4gICAgICAgICAgPFZpc3VhbGlzYXRpb24gZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDxkaXY+TG9hZGluZy4uLjwvZGl2PlxuICAgIH1cbiAgfVxufVxuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxBcHAgLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JylcbilcbiJdLCJuYW1lcyI6WyJGbHlvdXQiLCJwcm9wcyIsInNob3ciLCJ3aWR0aCIsIm9uSGlkZSIsImUiLCJ0aXRsZSIsImNoaWxkcmVuIiwiZ2V0Rm9ybURhdGEiLCJmb3JtIiwiZm9ybURhdGEiLCJ3aW5kb3ciLCJGb3JtRGF0YSIsImRhdGEiLCJvcHRpb25zIiwic2NoZW1hIiwiY2FzdCIsIm5hbWUiLCJ2YWwiLCJlbCIsImVsZW1lbnRzIiwiZGF0YXNldCIsInVuZGVmaW5lZCIsIk51bWJlciIsImZvckVhY2giLCJ2YWx1ZSIsImtleSIsIm9wdGlvbnNQcmVmaXgiLCJzY2hlbWFQcmVmaXgiLCJ0cmltIiwic3RhcnRzV2l0aCIsInJlcXVpcmVkIiwic3Vic3RyIiwibGVuZ3RoIiwiT2JqZWN0Iiwia2V5cyIsImNsb25lIiwib2JqIiwiSlNPTiIsInBhcnNlIiwic3RyaW5naWZ5IiwiUGFnZUVkaXQiLCJzdGF0ZSIsIm9uU3VibWl0IiwicHJldmVudERlZmF1bHQiLCJ0YXJnZXQiLCJuZXdQYXRoIiwiZ2V0Iiwic2VjdGlvbiIsInBhZ2UiLCJjb3B5IiwicGF0aENoYW5nZWQiLCJwYXRoIiwiY29weVBhZ2UiLCJwYWdlcyIsImluZGV4T2YiLCJmaW5kIiwicCIsInNldEN1c3RvbVZhbGlkaXR5IiwicmVwb3J0VmFsaWRpdHkiLCJBcnJheSIsImlzQXJyYXkiLCJuZXh0IiwibiIsInNhdmUiLCJ0aGVuIiwiY29uc29sZSIsImxvZyIsIm9uRWRpdCIsImNhdGNoIiwiZXJyb3IiLCJlcnIiLCJvbkNsaWNrRGVsZXRlIiwiY29uZmlybSIsImNvcHlQYWdlSWR4IiwiZmluZEluZGV4IiwiaW5kZXgiLCJpIiwic3BsaWNlIiwic2VjdGlvbnMiLCJtYXAiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbXBvbmVudFR5cGVzIiwic3ViVHlwZSIsIkNsYXNzZXMiLCJjb21wb25lbnQiLCJjbGFzc2VzIiwiRmllbGRFZGl0IiwiaGludCIsIlRleHRGaWVsZEVkaXQiLCJtYXgiLCJtaW4iLCJNdWx0aWxpbmVUZXh0RmllbGRFZGl0Iiwicm93cyIsIk51bWJlckZpZWxkRWRpdCIsImludGVnZXIiLCJTZWxlY3RGaWVsZEVkaXQiLCJsaXN0cyIsImxpc3QiLCJSYWRpb3NGaWVsZEVkaXQiLCJib2xkIiwiQ2hlY2tib3hlc0ZpZWxkRWRpdCIsIlBhcmFFZGl0IiwiY29udGVudCIsIkluc2V0VGV4dEVkaXQiLCJIdG1sRWRpdCIsIkRldGFpbHNFZGl0IiwiY29tcG9uZW50VHlwZUVkaXRvcnMiLCJDb21wb25lbnRUeXBlRWRpdCIsInR5cGUiLCJ0IiwiVGFnTmFtZSIsIkNvbXBvbmVudEVkaXQiLCJjb21wb25lbnRJbmRleCIsImNvbXBvbmVudHMiLCJjb21wb25lbnRJZHgiLCJjIiwiaXNMYXN0IiwiY29weUNvbXAiLCJTb3J0YWJsZUhhbmRsZSIsIlNvcnRhYmxlSE9DIiwiRHJhZ0hhbmRsZSIsIlRleHRGaWVsZCIsIlRlbGVwaG9uZU51bWJlckZpZWxkIiwiTnVtYmVyRmllbGQiLCJFbWFpbEFkZHJlc3NGaWVsZCIsIlRpbWVGaWVsZCIsIkRhdGVGaWVsZCIsIkRhdGVUaW1lRmllbGQiLCJEYXRlUGFydHNGaWVsZCIsIkRhdGVUaW1lUGFydHNGaWVsZCIsIk11bHRpbGluZVRleHRGaWVsZCIsIlJhZGlvc0ZpZWxkIiwiQ2hlY2tib3hlc0ZpZWxkIiwiU2VsZWN0RmllbGQiLCJZZXNOb0ZpZWxkIiwiVWtBZGRyZXNzRmllbGQiLCJQYXJhIiwiSHRtbCIsIkluc2V0VGV4dCIsIkRldGFpbHMiLCJCYXNlIiwiQ29tcG9uZW50RmllbGQiLCJzaG93RWRpdG9yIiwic3RvcFByb3BhZ2F0aW9uIiwic2V0U3RhdGUiLCJDb21wb25lbnRDcmVhdGUiLCJwdXNoIiwib25DcmVhdGUiLCJTb3J0YWJsZUVsZW1lbnQiLCJTb3J0YWJsZUNvbnRhaW5lciIsImFycmF5TW92ZSIsIlNvcnRhYmxlSXRlbSIsIlNvcnRhYmxlTGlzdCIsIlBhZ2UiLCJvblNvcnRFbmQiLCJvbGRJbmRleCIsIm5ld0luZGV4IiwiZmlsdGVyZWQiLCJmb3JtQ29tcG9uZW50cyIsImZpbHRlciIsImNvbXAiLCJwYWdlVGl0bGUiLCJsYXlvdXQiLCJzaG93QWRkQ29tcG9uZW50IiwibGlzdFR5cGVzIiwiY29tcG9uZW50VG9TdHJpbmciLCJEYXRhTW9kZWwiLCJtb2RlbCIsIlBhZ2VDcmVhdGUiLCJhc3NpZ24iLCJMaW5rRWRpdCIsImVkZ2UiLCJzb3VyY2UiLCJsaW5rIiwiaWYiLCJjb25kaXRpb24iLCJjb3B5TGluayIsImNvcHlMaW5rSWR4IiwiTGlua0NyZWF0ZSIsImZyb20iLCJ0byIsImhlYWREdXBsaWNhdGUiLCJhcnIiLCJqIiwiTGlzdEl0ZW1zIiwib25DbGlja0FkZEl0ZW0iLCJpdGVtcyIsImNvbmNhdCIsInRleHQiLCJkZXNjcmlwdGlvbiIsInJlbW92ZUl0ZW0iLCJzIiwiaWR4Iiwib25CbHVyIiwidGV4dHMiLCJnZXRBbGwiLCJ2YWx1ZXMiLCJkdXBlVGV4dCIsImR1cGVWYWx1ZSIsIml0ZW0iLCJMaXN0RWRpdCIsIm5ld05hbWUiLCJuZXdUaXRsZSIsIm5ld1R5cGUiLCJuYW1lQ2hhbmdlZCIsImNvcHlMaXN0IiwiZGVzY3JpcHRpb25zIiwib25CbHVyTmFtZSIsImlucHV0IiwibCIsIm9uQ2FuY2VsIiwiTGlzdENyZWF0ZSIsIkxpc3RzRWRpdCIsIm9uQ2xpY2tMaXN0Iiwib25DbGlja0FkZExpc3QiLCJzaG93QWRkTGlzdCIsIlNlY3Rpb25FZGl0IiwiY29weVNlY3Rpb24iLCJTZWN0aW9uQ3JlYXRlIiwiU2VjdGlvbnNFZGl0Iiwib25DbGlja1NlY3Rpb24iLCJvbkNsaWNrQWRkU2VjdGlvbiIsInNob3dBZGRTZWN0aW9uIiwiZ2V0TGF5b3V0IiwiZyIsImRhZ3JlIiwiZ3JhcGhsaWIiLCJHcmFwaCIsInNldEdyYXBoIiwicmFua2RpciIsIm1hcmdpbngiLCJtYXJnaW55IiwicmFua3NlcCIsInNldERlZmF1bHRFZGdlTGFiZWwiLCJwYWdlRWwiLCJzZXROb2RlIiwibGFiZWwiLCJvZmZzZXRXaWR0aCIsImhlaWdodCIsIm9mZnNldEhlaWdodCIsImV4aXN0cyIsInNldEVkZ2UiLCJwb3MiLCJub2RlcyIsImVkZ2VzIiwib3V0cHV0IiwiZ3JhcGgiLCJ2Iiwibm9kZSIsInB0IiwidG9wIiwieSIsImxlZnQiLCJ4IiwidyIsInBvaW50cyIsIkxpbmVzIiwiZWRpdExpbmsiLCJqb2luIiwiTWluaW1hcCIsIm9uQ2xpY2tQYWdlIiwidG9nZ2xlRmlsdGVyUGF0aCIsInNjYWxlIiwicGFyc2VGbG9hdCIsIlZpc3VhbGlzYXRpb24iLCJmaWx0ZXJQYXRocyIsInNjaGVkdWxlTGF5b3V0IiwicmVmIiwiY3JlYXRlUmVmIiwic2V0VGltZW91dCIsImdldEZpbHRlcmVkUGFnZXMiLCJjdXJyZW50IiwiZmlsdGVyZWRQYWdlcyIsInVwc3RyZWFtUGF0aHMiLCJkb3duc3RyZWFtUGF0aHMiLCJpbmNsdWRlcyIsIk1lbnUiLCJvbkNsaWNrVXBsb2FkIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImNsaWNrIiwib25GaWxlVXBsb2FkIiwiZmlsZSIsImZpbGVzIiwicmVhZGVyIiwiRmlsZVJlYWRlciIsInJlYWRBc1RleHQiLCJvbmxvYWQiLCJldnQiLCJyZXN1bHQiLCJwbGF5Z3JvdW5kTW9kZSIsInNob3dNZW51Iiwic2hvd0FkZFBhZ2UiLCJzaG93QWRkTGluayIsInNob3dFZGl0U2VjdGlvbnMiLCJzaG93RWRpdExpc3RzIiwic2hvd0RhdGFNb2RlbCIsInNob3dKU09ORGF0YSIsInNob3dTdW1tYXJ5IiwiQXBwIiwidXBkYXRlZERhdGEiLCJmZXRjaCIsIm1ldGhvZCIsImJvZHkiLCJyZXMiLCJvayIsIkVycm9yIiwic3RhdHVzVGV4dCIsImpzb24iLCJERkJEIiwicGFyZW50IiwibG9jYXRpb24iLCJwYXRobmFtZSIsImZyYW1lcyIsInByZXZpZXciLCJyZWxvYWQiLCJhbGVydCIsImxvYWRlZCIsIlJlYWN0RE9NIiwicmVuZGVyIl0sIm1hcHBpbmdzIjoiOzs7RUFDQSxTQUFTQSxNQUFULENBQWlCQyxLQUFqQixFQUF3QjtFQUN0QixNQUFJLENBQUNBLE1BQU1DLElBQVgsRUFBaUI7RUFDZixXQUFPLElBQVA7RUFDRDs7RUFFRCxNQUFNQyxRQUFRRixNQUFNRSxLQUFOLElBQWUsRUFBN0I7O0VBRUEsU0FDRTtFQUFBO0VBQUEsTUFBSyxXQUFVLGtCQUFmO0VBQ0U7RUFBQTtFQUFBLFFBQUssc0NBQW9DQSxLQUF6QztFQUNFO0VBQUE7RUFBQSxVQUFHLE9BQU0sT0FBVCxFQUFpQixXQUFVLHVDQUEzQixFQUFtRSxTQUFTO0VBQUEsbUJBQUtGLE1BQU1H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
