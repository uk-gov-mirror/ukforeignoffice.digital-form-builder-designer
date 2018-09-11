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
              }, width: 'xlarge' },
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzaWduZXIuanMiLCJzb3VyY2VzIjpbIi4uL2NsaWVudC9mbHlvdXQuanMiLCIuLi9jbGllbnQvaGVscGVycy5qcyIsIi4uL2NsaWVudC9wYWdlLWVkaXQuanMiLCIuLi9jb21wb25lbnQtdHlwZXMuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LXR5cGUtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LWNyZWF0ZS5qcyIsIi4uL2NsaWVudC9wYWdlLmpzIiwiLi4vY2xpZW50L2RhdGEtbW9kZWwuanMiLCIuLi9jbGllbnQvcGFnZS1jcmVhdGUuanMiLCIuLi9jbGllbnQvbGluay1lZGl0LmpzIiwiLi4vY2xpZW50L2xpbmstY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3QtaXRlbXMuanMiLCIuLi9jbGllbnQvbGlzdC1lZGl0LmpzIiwiLi4vY2xpZW50L2xpc3QtY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3RzLWVkaXQuanMiLCIuLi9jbGllbnQvc2VjdGlvbi1lZGl0LmpzIiwiLi4vY2xpZW50L3NlY3Rpb24tY3JlYXRlLmpzIiwiLi4vY2xpZW50L3NlY3Rpb25zLWVkaXQuanMiLCIuLi9jbGllbnQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5mdW5jdGlvbiBGbHlvdXQgKHByb3BzKSB7XG4gIGlmICghcHJvcHMuc2hvdykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCB3aWR0aCA9IHByb3BzLndpZHRoIHx8ICcnXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZmx5b3V0LW1lbnUgc2hvdyc+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YGZseW91dC1tZW51LWNvbnRhaW5lciAke3dpZHRofWB9PlxuICAgICAgICA8YSB0aXRsZT0nQ2xvc2UnIGNsYXNzTmFtZT0nY2xvc2UgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgb25DbGljaz17ZSA9PiBwcm9wcy5vbkhpZGUoZSl9PkNsb3NlPC9hPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFuZWwnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1oZWFkZXIgZ292dWstIS1wYWRkaW5nLXRvcC00IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTQnPlxuICAgICAgICAgICAge3Byb3BzLnRpdGxlICYmIDxoNCBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctbSc+e3Byb3BzLnRpdGxlfTwvaDQ+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1ib2R5Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctbGVmdC00IGdvdnVrLSEtcGFkZGluZy1yaWdodC00IGdvdnVrLSEtcGFkZGluZy1ib3R0b20tNCc+XG4gICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZseW91dFxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1EYXRhIChmb3JtKSB7XG4gIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICBjb25zdCBkYXRhID0ge1xuICAgIG9wdGlvbnM6IHt9LFxuICAgIHNjaGVtYToge31cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhc3QgKG5hbWUsIHZhbCkge1xuICAgIGNvbnN0IGVsID0gZm9ybS5lbGVtZW50c1tuYW1lXVxuICAgIGNvbnN0IGNhc3QgPSBlbCAmJiBlbC5kYXRhc2V0LmNhc3RcblxuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGNhc3QgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gTnVtYmVyKHZhbClcbiAgICB9IGVsc2UgaWYgKGNhc3QgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHZhbCA9PT0gJ29uJ1xuICAgIH1cblxuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICBjb25zdCBvcHRpb25zUHJlZml4ID0gJ29wdGlvbnMuJ1xuICAgIGNvbnN0IHNjaGVtYVByZWZpeCA9ICdzY2hlbWEuJ1xuXG4gICAgdmFsdWUgPSB2YWx1ZS50cmltKClcblxuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG9wdGlvbnNQcmVmaXgpKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGAke29wdGlvbnNQcmVmaXh9cmVxdWlyZWRgICYmIHZhbHVlID09PSAnb24nKSB7XG4gICAgICAgICAgZGF0YS5vcHRpb25zLnJlcXVpcmVkID0gZmFsc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLm9wdGlvbnNba2V5LnN1YnN0cihvcHRpb25zUHJlZml4Lmxlbmd0aCldID0gY2FzdChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleS5zdGFydHNXaXRoKHNjaGVtYVByZWZpeCkpIHtcbiAgICAgICAgZGF0YS5zY2hlbWFba2V5LnN1YnN0cihzY2hlbWFQcmVmaXgubGVuZ3RoKV0gPSBjYXN0KGtleSwgdmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIENsZWFudXBcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLnNjaGVtYSkubGVuZ3RoKSBkZWxldGUgZGF0YS5zY2hlbWFcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLm9wdGlvbnMpLmxlbmd0aCkgZGVsZXRlIGRhdGEub3B0aW9uc1xuXG4gIHJldHVybiBkYXRhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZSAob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld1BhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBwYXRoQ2hhbmdlZCA9IG5ld1BhdGggIT09IHBhZ2UucGF0aFxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlc1tkYXRhLnBhZ2VzLmluZGV4T2YocGFnZSldXG5cbiAgICBpZiAocGF0aENoYW5nZWQpIHtcbiAgICAgIC8vIGBwYXRoYCBoYXMgY2hhbmdlZCAtIHZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgICAgaWYgKGRhdGEucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gbmV3UGF0aCkpIHtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke25ld1BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29weVBhZ2UucGF0aCA9IG5ld1BhdGhcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBwYWdlXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHAubmV4dCkpIHtcbiAgICAgICAgICBwLm5leHQuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgIGlmIChuLnBhdGggPT09IHBhZ2UucGF0aCkge1xuICAgICAgICAgICAgICBuLnBhdGggPSBuZXdQYXRoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIGNvcHlQYWdlLnRpdGxlID0gdGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlQYWdlLnRpdGxlXG4gICAgfVxuXG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIGNvcHlQYWdlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjb3B5UGFnZS5zZWN0aW9uXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2VJZHggPSBjb3B5LnBhZ2VzLmZpbmRJbmRleChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBsaW5rcyB0byB0aGUgcGFnZVxuICAgIGNvcHkucGFnZXMuZm9yRWFjaCgocCwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChpbmRleCAhPT0gY29weVBhZ2VJZHggJiYgQXJyYXkuaXNBcnJheShwLm5leHQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBwLm5leHQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gcC5uZXh0W2ldXG4gICAgICAgICAgaWYgKG5leHQucGF0aCA9PT0gcGFnZS5wYXRoKSB7XG4gICAgICAgICAgICBwLm5leHQuc3BsaWNlKGksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIFJlbW92ZSB0aGUgcGFnZSBpdHNlbGZcbiAgICBjb3B5LnBhZ2VzLnNwbGljZShjb3B5UGFnZUlkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIC8vIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3BhZ2UucGF0aH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGUudGFyZ2V0LnNldEN1c3RvbVZhbGlkaXR5KCcnKX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXRpdGxlJz5UaXRsZSAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0ncGFnZS10aXRsZS1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgSWYgbm90IHN1cHBsaWVkLCB0aGUgdGl0bGUgb2YgdGhlIGZpcnN0IHF1ZXN0aW9uIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17cGFnZS50aXRsZX0gYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJyBkZWZhdWx0VmFsdWU9e3BhZ2Uuc2VjdGlvbn0+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7c2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gKDxvcHRpb24ga2V5PXtzZWN0aW9uLm5hbWV9IHZhbHVlPXtzZWN0aW9uLm5hbWV9PntzZWN0aW9uLnRpdGxlfTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlRWRpdFxuIiwiY29uc3QgY29tcG9uZW50VHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAnVGV4dEZpZWxkJyxcbiAgICB0aXRsZTogJ1RleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdNdWx0aWxpbmVUZXh0RmllbGQnLFxuICAgIHRpdGxlOiAnTXVsdGlsaW5lIHRleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdZZXNOb0ZpZWxkJyxcbiAgICB0aXRsZTogJ1llcy9ObyBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVGaWVsZCcsXG4gICAgdGl0bGU6ICdEYXRlIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ1RpbWUgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgdGltZSBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVQYXJ0c0ZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgcGFydHMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZVBhcnRzRmllbGQnLFxuICAgIHRpdGxlOiAnRGF0ZSB0aW1lIHBhcnRzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnU2VsZWN0RmllbGQnLFxuICAgIHRpdGxlOiAnU2VsZWN0IGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUmFkaW9zRmllbGQnLFxuICAgIHRpdGxlOiAnUmFkaW9zIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQ2hlY2tib3hlc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0NoZWNrYm94ZXMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdOdW1iZXJGaWVsZCcsXG4gICAgdGl0bGU6ICdOdW1iZXIgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdVa0FkZHJlc3NGaWVsZCcsXG4gICAgdGl0bGU6ICdVayBhZGRyZXNzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGVsZXBob25lTnVtYmVyRmllbGQnLFxuICAgIHRpdGxlOiAnVGVsZXBob25lIG51bWJlciBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0VtYWlsQWRkcmVzc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0VtYWlsIGFkZHJlc3MgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdQYXJhJyxcbiAgICB0aXRsZTogJ1BhcmFncmFwaCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnSHRtbCcsXG4gICAgdGl0bGU6ICdIdG1sJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdJbnNldFRleHQnLFxuICAgIHRpdGxlOiAnSW5zZXQgdGV4dCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnRGV0YWlscycsXG4gICAgdGl0bGU6ICdEZXRhaWxzJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfVxuXVxuXG5leHBvcnQgZGVmYXVsdCBjb21wb25lbnRUeXBlc1xuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuXG5mdW5jdGlvbiBDbGFzc2VzIChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5jbGFzc2VzJz5DbGFzc2VzPC9sYWJlbD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+QWRkaXRpb25hbCBDU1MgY2xhc3NlcyB0byBhZGQgdG8gdGhlIGZpZWxkPGJyIC8+XG4gICAgICBFLmcuIGdvdnVrLWlucHV0LS13aWR0aC0yIChvciAzLCA0LCA1LCAxMCwgMjApIG9yIGdvdnVrLSEtd2lkdGgtb25lLWhhbGYgKHR3by10aGlyZHMsIHRocmVlLXF1YXJ0ZXJzIGV0Yy4pPC9zcGFuPlxuICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmNsYXNzZXMnIG5hbWU9J29wdGlvbnMuY2xhc3NlcycgdHlwZT0ndGV4dCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmNsYXNzZXN9IC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhpcyBpcyB1c2VkIGFzIHRoZSBrZXkgaW4gdGhlIEpTT04gb3V0cHV0LiBVc2UgYGNhbWVsQ2FzaW5nYCBlLmcuIGRhdGVPZkJpcnRoIG9yIGZ1bGxOYW1lLjwvc3Bhbj5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTIwJyBpZD0nZmllbGQtbmFtZSdcbiAgICAgICAgICBuYW1lPSduYW1lJyB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5uYW1lfSByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKycgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlRoaXMgaXMgdGhlIHRpdGxlIHRleHQgZGlzcGxheWVkIG9uIHRoZSBwYWdlPC9zcGFuPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2ZpZWxkLXRpdGxlJyBuYW1lPSd0aXRsZScgdHlwZT0ndGV4dCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1oaW50Jz5IaW50IChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlRoZSBoaW50IGNhbiBpbmNsdWRlIEhUTUw8L3NwYW4+XG4gICAgICAgIDx0ZXh0YXJlYSBjbGFzc05hbWU9J2dvdnVrLXRleHRhcmVhJyBpZD0nZmllbGQtaGludCcgbmFtZT0naGludCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5oaW50fSByb3dzPScyJyAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLnJlcXVpcmVkJ1xuICAgICAgICAgICAgbmFtZT0nb3B0aW9ucy5yZXF1aXJlZCcgdHlwZT0nY2hlY2tib3gnIGRlZmF1bHRDaGVja2VkPXtvcHRpb25zLnJlcXVpcmVkID09PSBmYWxzZX0gLz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1jaGVja2JveGVzX19sYWJlbCdcbiAgICAgICAgICAgIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMucmVxdWlyZWQnPk9wdGlvbmFsPC9sYWJlbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvZGl2PlxuICApXG59XG5cbmZ1bmN0aW9uIFRleHRGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBzY2hlbWEgPSBjb21wb25lbnQuc2NoZW1hIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkZXRhaWxzIGNsYXNzTmFtZT0nZ292dWstZGV0YWlscyc+XG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeSc+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5LXRleHQnPm1vcmU8L3NwYW4+XG4gICAgICAgIDwvc3VtbWFyeT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5tYXgnPk1heCBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtYXhpbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWF4JyBuYW1lPSdzY2hlbWEubWF4J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWF4fSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1pbic+TWluIGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1pbmltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5taW4nIG5hbWU9J3NjaGVtYS5taW4nXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5taW59IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubGVuZ3RoJz5MZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBleGFjdCB0ZXh0IGxlbmd0aDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLmxlbmd0aCcgbmFtZT0nc2NoZW1hLmxlbmd0aCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLmxlbmd0aH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBNdWx0aWxpbmVUZXh0RmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgc2NoZW1hID0gY29tcG9uZW50LnNjaGVtYSB8fCB7fVxuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRldGFpbHMgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzJz5cbiAgICAgICAgPHN1bW1hcnkgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5Jz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnktdGV4dCc+bW9yZTwvc3Bhbj5cbiAgICAgICAgPC9zdW1tYXJ5PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1heCc+TWF4IGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5tYXgnIG5hbWU9J3NjaGVtYS5tYXgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5tYXh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWluJz5NaW4gbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWluaW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1pbicgbmFtZT0nc2NoZW1hLm1pbidcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1pbn0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMucm93cyc+Um93czwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGlkPSdmaWVsZC1vcHRpb25zLnJvd3MnIG5hbWU9J29wdGlvbnMucm93cycgdHlwZT0ndGV4dCdcbiAgICAgICAgICAgIGRhdGEtY2FzdD0nbnVtYmVyJyBkZWZhdWx0VmFsdWU9e29wdGlvbnMucm93c30gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2RldGFpbHM+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gTnVtYmVyRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgc2NoZW1hID0gY29tcG9uZW50LnNjaGVtYSB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGV0YWlscyBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHMnPlxuICAgICAgICA8c3VtbWFyeSBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnknPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeS10ZXh0Jz5tb3JlPC9zcGFuPlxuICAgICAgICA8L3N1bW1hcnk+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWluJz5NaW48L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtaW5pbXVtIHZhbHVlPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWluJyBuYW1lPSdzY2hlbWEubWluJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWlufSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1heCc+TWF4PC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWF4aW11bSB2YWx1ZTwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1heCcgbmFtZT0nc2NoZW1hLm1heCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1heH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlcyBnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pbnB1dCcgaWQ9J2ZpZWxkLXNjaGVtYS5pbnRlZ2VyJyBkYXRhLWNhc3Q9J2Jvb2xlYW4nXG4gICAgICAgICAgICAgIG5hbWU9J3NjaGVtYS5pbnRlZ2VyJyB0eXBlPSdjaGVja2JveCcgZGVmYXVsdENoZWNrZWQ9e3NjaGVtYS5pbnRlZ2VyID09PSB0cnVlfSAvPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstY2hlY2tib3hlc19fbGFiZWwnXG4gICAgICAgICAgICAgIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5pbnRlZ2VyJz5JbnRlZ2VyPC9sYWJlbD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2RldGFpbHM+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gU2VsZWN0RmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG4gIGNvbnN0IGxpc3RzID0gZGF0YS5saXN0c1xuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMubGlzdCc+TGlzdDwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCBnb3Z1ay1pbnB1dC0td2lkdGgtMTAnIGlkPSdmaWVsZC1vcHRpb25zLmxpc3QnIG5hbWU9J29wdGlvbnMubGlzdCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5saXN0fSByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtsaXN0cy5tYXAobGlzdCA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiA8b3B0aW9uIGtleT17bGlzdC5uYW1lfSB2YWx1ZT17bGlzdC5uYW1lfT57bGlzdC50aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIFJhZGlvc0ZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQsIGRhdGEgfSA9IHByb3BzXG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuICBjb25zdCBsaXN0cyA9IGRhdGEubGlzdHNcblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmxpc3QnPkxpc3Q8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QgZ292dWstaW5wdXQtLXdpZHRoLTEwJyBpZD0nZmllbGQtb3B0aW9ucy5saXN0JyBuYW1lPSdvcHRpb25zLmxpc3QnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e29wdGlvbnMubGlzdH0gcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7bGlzdHMubWFwKGxpc3QgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e2xpc3QubmFtZX0gdmFsdWU9e2xpc3QubmFtZX0+e2xpc3QudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXMgZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pdGVtJz5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pbnB1dCcgaWQ9J2ZpZWxkLW9wdGlvbnMuYm9sZCcgZGF0YS1jYXN0PSdib29sZWFuJ1xuICAgICAgICAgICAgbmFtZT0nb3B0aW9ucy5ib2xkJyB0eXBlPSdjaGVja2JveCcgZGVmYXVsdENoZWNrZWQ9e29wdGlvbnMuYm9sZCA9PT0gdHJ1ZX0gLz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1jaGVja2JveGVzX19sYWJlbCdcbiAgICAgICAgICAgIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMuYm9sZCc+Qm9sZCBsYWJlbHM8L2xhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmJvbGQnIGRhdGEtY2FzdD0nYm9vbGVhbidcbiAgICAgICAgICAgIG5hbWU9J29wdGlvbnMuYm9sZCcgdHlwZT0nY2hlY2tib3gnIGRlZmF1bHRDaGVja2VkPXtvcHRpb25zLmJvbGQgPT09IHRydWV9IC8+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstY2hlY2tib3hlc19fbGFiZWwnXG4gICAgICAgICAgICBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmJvbGQnPkJvbGQgbGFiZWxzPC9sYWJlbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBQYXJhRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCcgaHRtbEZvcj0ncGFyYS1jb250ZW50Jz5Db250ZW50PC9sYWJlbD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhlIGNvbnRlbnQgY2FuIGluY2x1ZGUgSFRNTCBhbmQgdGhlIGBnb3Z1ay1wcm9zZS1zY29wZWAgY3NzIGNsYXNzIGlzIGF2YWlsYWJsZS4gVXNlIHRoaXMgb24gYSB3cmFwcGluZyBlbGVtZW50IHRvIGFwcGx5IGRlZmF1bHQgZ292dWsgc3R5bGVzLjwvc3Bhbj5cbiAgICAgIDx0ZXh0YXJlYSBjbGFzc05hbWU9J2dvdnVrLXRleHRhcmVhJyBpZD0ncGFyYS1jb250ZW50JyBuYW1lPSdjb250ZW50J1xuICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5jb250ZW50fSByb3dzPScxMCcgcmVxdWlyZWQgLz5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5jb25zdCBJbnNldFRleHRFZGl0ID0gUGFyYUVkaXRcbmNvbnN0IEh0bWxFZGl0ID0gUGFyYUVkaXRcblxuZnVuY3Rpb24gRGV0YWlsc0VkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuXG4gIHJldHVybiAoXG4gICAgPGRpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCcgaHRtbEZvcj0nZGV0YWlscy10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2RldGFpbHMtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LnRpdGxlfSByZXF1aXJlZCAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J2RldGFpbHMtY29udGVudCc+Q29udGVudDwvbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhlIGNvbnRlbnQgY2FuIGluY2x1ZGUgSFRNTCBhbmQgdGhlIGBnb3Z1ay1wcm9zZS1zY29wZWAgY3NzIGNsYXNzIGlzIGF2YWlsYWJsZS4gVXNlIHRoaXMgb24gYSB3cmFwcGluZyBlbGVtZW50IHRvIGFwcGx5IGRlZmF1bHQgZ292dWsgc3R5bGVzLjwvc3Bhbj5cbiAgICAgICAgPHRleHRhcmVhIGNsYXNzTmFtZT0nZ292dWstdGV4dGFyZWEnIGlkPSdkZXRhaWxzLWNvbnRlbnQnIG5hbWU9J2NvbnRlbnQnXG4gICAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQuY29udGVudH0gcm93cz0nMTAnIHJlcXVpcmVkIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5jb25zdCBjb21wb25lbnRUeXBlRWRpdG9ycyA9IHtcbiAgJ1RleHRGaWVsZEVkaXQnOiBUZXh0RmllbGRFZGl0LFxuICAnRW1haWxBZGRyZXNzRmllbGRFZGl0JzogVGV4dEZpZWxkRWRpdCxcbiAgJ1RlbGVwaG9uZU51bWJlckZpZWxkRWRpdCc6IFRleHRGaWVsZEVkaXQsXG4gICdOdW1iZXJGaWVsZEVkaXQnOiBOdW1iZXJGaWVsZEVkaXQsXG4gICdNdWx0aWxpbmVUZXh0RmllbGRFZGl0JzogTXVsdGlsaW5lVGV4dEZpZWxkRWRpdCxcbiAgJ1NlbGVjdEZpZWxkRWRpdCc6IFNlbGVjdEZpZWxkRWRpdCxcbiAgJ1JhZGlvc0ZpZWxkRWRpdCc6IFJhZGlvc0ZpZWxkRWRpdCxcbiAgJ0NoZWNrYm94ZXNGaWVsZEVkaXQnOiBDaGVja2JveGVzRmllbGRFZGl0LFxuICAnUGFyYUVkaXQnOiBQYXJhRWRpdCxcbiAgJ0h0bWxFZGl0JzogSHRtbEVkaXQsXG4gICdJbnNldFRleHRFZGl0JzogSW5zZXRUZXh0RWRpdCxcbiAgJ0RldGFpbHNFZGl0JzogRGV0YWlsc0VkaXRcbn1cblxuY2xhc3MgQ29tcG9uZW50VHlwZUVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCB0eXBlID0gY29tcG9uZW50VHlwZXMuZmluZCh0ID0+IHQubmFtZSA9PT0gY29tcG9uZW50LnR5cGUpXG4gICAgaWYgKCF0eXBlKSB7XG4gICAgICByZXR1cm4gJydcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgVGFnTmFtZSA9IGNvbXBvbmVudFR5cGVFZGl0b3JzW2Ake2NvbXBvbmVudC50eXBlfUVkaXRgXSB8fCBGaWVsZEVkaXRcbiAgICAgIHJldHVybiA8VGFnTmFtZSBjb21wb25lbnQ9e2NvbXBvbmVudH0gZGF0YT17ZGF0YX0gLz5cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50VHlwZUVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUsIGdldEZvcm1EYXRhIH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IENvbXBvbmVudFR5cGVFZGl0IGZyb20gJy4vY29tcG9uZW50LXR5cGUtZWRpdCdcblxuY2xhc3MgQ29tcG9uZW50RWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSwgY29tcG9uZW50IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZm9ybURhdGEgPSBnZXRGb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gcGFnZS5jb21wb25lbnRzLmluZGV4T2YoY29tcG9uZW50KVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHNbY29tcG9uZW50SW5kZXhdID0gZm9ybURhdGFcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkNsaWNrRGVsZXRlID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoIXdpbmRvdy5jb25maXJtKCdDb25maXJtIGRlbGV0ZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvbXBvbmVudElkeCA9IHBhZ2UuY29tcG9uZW50cy5maW5kSW5kZXgoYyA9PiBjID09PSBjb21wb25lbnQpXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuICAgIGNvbnN0IGlzTGFzdCA9IGNvbXBvbmVudElkeCA9PT0gcGFnZS5jb21wb25lbnRzLmxlbmd0aCAtIDFcblxuICAgIC8vIFJlbW92ZSB0aGUgY29tcG9uZW50XG4gICAgY29weVBhZ2UuY29tcG9uZW50cy5zcGxpY2UoY29tcG9uZW50SWR4LCAxKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgaWYgKCFpc0xhc3QpIHtcbiAgICAgICAgICAvLyBXZSBkb250IGhhdmUgYW4gaWQgd2UgY2FuIHVzZSBmb3IgYGtleWAtaW5nIHJlYWN0IDxDb21wb25lbnQgLz4nc1xuICAgICAgICAgIC8vIFdlIHRoZXJlZm9yZSBuZWVkIHRvIGNvbmRpdGlvbmFsbHkgcmVwb3J0IGBvbkVkaXRgIGNoYW5nZXMuXG4gICAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGNvbXBvbmVudCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgY29weUNvbXAgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGNvbXBvbmVudCkpXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGZvcm0gYXV0b0NvbXBsZXRlPSdvZmYnIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3R5cGUnPlR5cGU8L3NwYW4+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHknPntjb21wb25lbnQudHlwZX08L3NwYW4+XG4gICAgICAgICAgICA8aW5wdXQgaWQ9J3R5cGUnIHR5cGU9J2hpZGRlbicgbmFtZT0ndHlwZScgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQudHlwZX0gLz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIDxDb21wb25lbnRUeXBlRWRpdFxuICAgICAgICAgICAgcGFnZT17cGFnZX1cbiAgICAgICAgICAgIGNvbXBvbmVudD17Y29weUNvbXB9XG4gICAgICAgICAgICBkYXRhPXtkYXRhfSAvPlxuXG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdidXR0b24nIG9uQ2xpY2s9e3RoaXMub25DbGlja0RlbGV0ZX0+RGVsZXRlPC9idXR0b24+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnRFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgU29ydGFibGVIT0MgKi9cblxuaW1wb3J0IEZseW91dCBmcm9tICcuL2ZseW91dCdcbmltcG9ydCBDb21wb25lbnRFZGl0IGZyb20gJy4vY29tcG9uZW50LWVkaXQnXG5jb25zdCBTb3J0YWJsZUhhbmRsZSA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlSGFuZGxlXG5jb25zdCBEcmFnSGFuZGxlID0gU29ydGFibGVIYW5kbGUoKCkgPT4gPHNwYW4gY2xhc3NOYW1lPSdkcmFnLWhhbmRsZSc+JiM5Nzc2Ozwvc3Bhbj4pXG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRUeXBlcyA9IHtcbiAgJ1RleHRGaWVsZCc6IFRleHRGaWVsZCxcbiAgJ1RlbGVwaG9uZU51bWJlckZpZWxkJzogVGVsZXBob25lTnVtYmVyRmllbGQsXG4gICdOdW1iZXJGaWVsZCc6IE51bWJlckZpZWxkLFxuICAnRW1haWxBZGRyZXNzRmllbGQnOiBFbWFpbEFkZHJlc3NGaWVsZCxcbiAgJ1RpbWVGaWVsZCc6IFRpbWVGaWVsZCxcbiAgJ0RhdGVGaWVsZCc6IERhdGVGaWVsZCxcbiAgJ0RhdGVUaW1lRmllbGQnOiBEYXRlVGltZUZpZWxkLFxuICAnRGF0ZVBhcnRzRmllbGQnOiBEYXRlUGFydHNGaWVsZCxcbiAgJ0RhdGVUaW1lUGFydHNGaWVsZCc6IERhdGVUaW1lUGFydHNGaWVsZCxcbiAgJ011bHRpbGluZVRleHRGaWVsZCc6IE11bHRpbGluZVRleHRGaWVsZCxcbiAgJ1JhZGlvc0ZpZWxkJzogUmFkaW9zRmllbGQsXG4gICdDaGVja2JveGVzRmllbGQnOiBDaGVja2JveGVzRmllbGQsXG4gICdTZWxlY3RGaWVsZCc6IFNlbGVjdEZpZWxkLFxuICAnWWVzTm9GaWVsZCc6IFllc05vRmllbGQsXG4gICdVa0FkZHJlc3NGaWVsZCc6IFVrQWRkcmVzc0ZpZWxkLFxuICAnUGFyYSc6IFBhcmEsXG4gICdIdG1sJzogSHRtbCxcbiAgJ0luc2V0VGV4dCc6IEluc2V0VGV4dCxcbiAgJ0RldGFpbHMnOiBEZXRhaWxzXG59XG5cbmZ1bmN0aW9uIEJhc2UgKHByb3BzKSB7XG4gIHJldHVybiAoXG4gICAgPGRpdj5cbiAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5mdW5jdGlvbiBDb21wb25lbnRGaWVsZCAocHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gVGV4dEZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gVGVsZXBob25lTnVtYmVyRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggdGVsJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRW1haWxBZGRyZXNzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggZW1haWwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBVa0FkZHJlc3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3gnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2J1dHRvbiBzcXVhcmUnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBNdWx0aWxpbmVUZXh0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHRhbGwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBOdW1iZXJGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBudW1iZXInIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEYXRlRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggZHJvcGRvd24nPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHkgZ292dWstIS1mb250LXNpemUtMTQnPmRkL21tL3l5eXk8L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVUaW1lRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggbGFyZ2UgZHJvcGRvd24nPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWJvZHkgZ292dWstIS1mb250LXNpemUtMTQnPmRkL21tL3l5eXkgaGg6bW08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFRpbWVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+aGg6bW08L3NwYW4+XG4gICAgICA8L2Rpdj5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVUaW1lUGFydHNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1sZWZ0LTEgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IG1lZGl1bSBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsJyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVBhcnRzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwgZ292dWstIS1tYXJnaW4tbGVmdC0xIGdvdnVrLSEtbWFyZ2luLXJpZ2h0LTEnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBtZWRpdW0nIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBSYWRpb3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaXJjbGUnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBDaGVja2JveGVzRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2hlY2snIC8+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaGVjaycgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NoZWNrJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gU2VsZWN0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3ggZHJvcGRvd24nIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBZZXNOb0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERldGFpbHMgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAge2DilrYgYH08c3BhbiBjbGFzc05hbWU9J2xpbmUgZGV0YWlscycgLz5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gSW5zZXRUZXh0ICgpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdpbnNldCBnb3Z1ay0hLXBhZGRpbmctbGVmdC0yJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUnIC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lIHNob3J0IGdvdnVrLSEtbWFyZ2luLWJvdHRvbS0yIGdvdnVrLSEtbWFyZ2luLXRvcC0yJyAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBQYXJhICgpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUgc2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTIgZ292dWstIS1tYXJnaW4tdG9wLTInIC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZnVuY3Rpb24gSHRtbCAoKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0naHRtbCc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSB4c2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTEgZ292dWstIS1tYXJnaW4tdG9wLTEnIC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L0Jhc2U+XG4gIClcbn1cblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBzaG93RWRpdG9yID0gKGUsIHZhbHVlKSA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiB2YWx1ZSB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IFRhZ05hbWUgPSBjb21wb25lbnRUeXBlc1tgJHtjb21wb25lbnQudHlwZX1gXVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQgZ292dWstIS1wYWRkaW5nLTInXG4gICAgICAgICAgb25DbGljaz17KGUpID0+IHRoaXMuc2hvd0VkaXRvcihlLCB0cnVlKX0+XG4gICAgICAgICAgPERyYWdIYW5kbGUgLz5cbiAgICAgICAgICA8VGFnTmFtZSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBDb21wb25lbnQnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zaG93RWRpdG9yKGUsIGZhbHNlKX0+XG4gICAgICAgICAgPENvbXBvbmVudEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9IHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSwgZ2V0Rm9ybURhdGEgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgQ29tcG9uZW50VHlwZUVkaXQgZnJvbSAnLi9jb21wb25lbnQtdHlwZS1lZGl0J1xuLy8gaW1wb3J0IHsgY29tcG9uZW50VHlwZXMgYXMgY29tcG9uZW50VHlwZXNJY29ucyB9IGZyb20gJy4vY29tcG9uZW50J1xuaW1wb3J0IGNvbXBvbmVudFR5cGVzIGZyb20gJy4uL2NvbXBvbmVudC10eXBlcy5qcydcblxuY2xhc3MgQ29tcG9uZW50Q3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZm9ybURhdGEgPSBnZXRGb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMucHVzaChmb3JtRGF0YSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSd0eXBlJz5UeXBlPC9sYWJlbD5cbiAgICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSd0eXBlJyBuYW1lPSd0eXBlJyByZXF1aXJlZFxuICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgY29tcG9uZW50OiB7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0gfSl9PlxuICAgICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICAgIHtjb21wb25lbnRUeXBlcy5tYXAodHlwZSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXt0eXBlLm5hbWV9IHZhbHVlPXt0eXBlLm5hbWV9Pnt0eXBlLnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgICB9KX1cbiAgICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICAgICAgey8qIHtPYmplY3Qua2V5cyhjb21wb25lbnRUeXBlc0ljb25zKS5tYXAodHlwZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IFRhZyA9IGNvbXBvbmVudFR5cGVzSWNvbnNbdHlwZV1cbiAgICAgICAgICAgICAgcmV0dXJuIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQgZ292dWstIS1wYWRkaW5nLTInPjxUYWcgLz48L2Rpdj5cbiAgICAgICAgICAgIH0pfSAqL31cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHt0aGlzLnN0YXRlLmNvbXBvbmVudCAmJiB0aGlzLnN0YXRlLmNvbXBvbmVudC50eXBlICYmIChcbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxDb21wb25lbnRUeXBlRWRpdFxuICAgICAgICAgICAgICAgIHBhZ2U9e3BhZ2V9XG4gICAgICAgICAgICAgICAgY29tcG9uZW50PXt0aGlzLnN0YXRlLmNvbXBvbmVudH1cbiAgICAgICAgICAgICAgICBkYXRhPXtkYXRhfSAvPlxuXG4gICAgICAgICAgICAgIDxidXR0b24gdHlwZT0nc3VibWl0JyBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbic+U2F2ZTwvYnV0dG9uPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKX1cblxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50Q3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgU29ydGFibGVIT0MgKi9cblxuaW1wb3J0IEZseW91dCBmcm9tICcuL2ZseW91dCdcbmltcG9ydCBQYWdlRWRpdCBmcm9tICcuL3BhZ2UtZWRpdCdcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50J1xuaW1wb3J0IENvbXBvbmVudENyZWF0ZSBmcm9tICcuL2NvbXBvbmVudC1jcmVhdGUnXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNvbnN0IFNvcnRhYmxlRWxlbWVudCA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlRWxlbWVudFxuY29uc3QgU29ydGFibGVDb250YWluZXIgPSBTb3J0YWJsZUhPQy5Tb3J0YWJsZUNvbnRhaW5lclxuY29uc3QgYXJyYXlNb3ZlID0gU29ydGFibGVIT0MuYXJyYXlNb3ZlXG5cbmNvbnN0IFNvcnRhYmxlSXRlbSA9IFNvcnRhYmxlRWxlbWVudCgoeyBpbmRleCwgcGFnZSwgY29tcG9uZW50LCBkYXRhIH0pID0+XG4gIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQtaXRlbSc+XG4gICAgPENvbXBvbmVudCBrZXk9e2luZGV4fSBwYWdlPXtwYWdlfSBjb21wb25lbnQ9e2NvbXBvbmVudH0gZGF0YT17ZGF0YX0gLz5cbiAgPC9kaXY+XG4pXG5cbmNvbnN0IFNvcnRhYmxlTGlzdCA9IFNvcnRhYmxlQ29udGFpbmVyKCh7IHBhZ2UsIGRhdGEgfSkgPT4ge1xuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPSdjb21wb25lbnQtbGlzdCc+XG4gICAgICB7cGFnZS5jb21wb25lbnRzLm1hcCgoY29tcG9uZW50LCBpbmRleCkgPT4gKFxuICAgICAgICA8U29ydGFibGVJdGVtIGtleT17aW5kZXh9IGluZGV4PXtpbmRleH0gcGFnZT17cGFnZX0gY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gICAgICApKX1cbiAgICA8L2Rpdj5cbiAgKVxufSlcblxuY2xhc3MgUGFnZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBzaG93RWRpdG9yID0gKGUsIHZhbHVlKSA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiB2YWx1ZSB9KVxuICB9XG5cbiAgb25Tb3J0RW5kID0gKHsgb2xkSW5kZXgsIG5ld0luZGV4IH0pID0+IHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMgPSBhcnJheU1vdmUoY29weVBhZ2UuY29tcG9uZW50cywgb2xkSW5kZXgsIG5ld0luZGV4KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG5cbiAgICAvLyBPUFRJTUlTVElDIFNBVkUgVE8gU1RPUCBKVU1QXG5cbiAgICAvLyBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICAvLyBwYWdlLmNvbXBvbmVudHMgPSBhcnJheU1vdmUocGFnZS5jb21wb25lbnRzLCBvbGRJbmRleCwgbmV3SW5kZXgpXG5cbiAgICAvLyBkYXRhLnNhdmUoZGF0YSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBzZWN0aW9ucyB9ID0gZGF0YVxuICAgIGNvbnN0IGZvcm1Db21wb25lbnRzID0gcGFnZS5jb21wb25lbnRzLmZpbHRlcihjb21wID0+IGNvbXBvbmVudFR5cGVzLmZpbmQodHlwZSA9PiB0eXBlLm5hbWUgPT09IGNvbXAudHlwZSkuc3ViVHlwZSA9PT0gJ2ZpZWxkJylcbiAgICBjb25zdCBwYWdlVGl0bGUgPSBwYWdlLnRpdGxlIHx8IChmb3JtQ29tcG9uZW50cy5sZW5ndGggPT09IDEgJiYgcGFnZS5jb21wb25lbnRzWzBdID09PSBmb3JtQ29tcG9uZW50c1swXSA/IGZvcm1Db21wb25lbnRzWzBdLnRpdGxlIDogcGFnZS50aXRsZSlcbiAgICBjb25zdCBzZWN0aW9uID0gcGFnZS5zZWN0aW9uICYmIHNlY3Rpb25zLmZpbmQoc2VjdGlvbiA9PiBzZWN0aW9uLm5hbWUgPT09IHBhZ2Uuc2VjdGlvbilcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGlkPXtwYWdlLnBhdGh9IGNsYXNzTmFtZT0ncGFnZSB4dG9vbHRpcCcgdGl0bGU9e3BhZ2UucGF0aH0gc3R5bGU9e3RoaXMucHJvcHMubGF5b3V0fT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2hhbmRsZScgb25DbGljaz17KGUpID0+IHRoaXMuc2hvd0VkaXRvcihlLCB0cnVlKX0gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtcGFkZGluZy10b3AtMiBnb3Z1ay0hLXBhZGRpbmctbGVmdC0yIGdvdnVrLSEtcGFkZGluZy1yaWdodC0yJz5cblxuICAgICAgICAgIDxoMyBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctcyc+XG4gICAgICAgICAgICB7c2VjdGlvbiAmJiA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWNhcHRpb24tbSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+e3NlY3Rpb24udGl0bGV9PC9zcGFuPn1cbiAgICAgICAgICAgIHtwYWdlVGl0bGV9XG4gICAgICAgICAgPC9oMz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPFNvcnRhYmxlTGlzdCBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfSBwcmVzc0RlbGF5PXsyMDB9XG4gICAgICAgICAgb25Tb3J0RW5kPXt0aGlzLm9uU29ydEVuZH0gbG9ja0F4aXM9J3knIGhlbHBlckNsYXNzPSdkcmFnZ2luZydcbiAgICAgICAgICBsb2NrVG9Db250YWluZXJFZGdlcyB1c2VEcmFnSGFuZGxlIC8+XG4gICAgICAgIHsvKiB7cGFnZS5jb21wb25lbnRzLm1hcCgoY29tcCwgaW5kZXgpID0+IChcbiAgICAgICAgICA8Q29tcG9uZW50IGtleT17aW5kZXh9IHBhZ2U9e3BhZ2V9IGNvbXBvbmVudD17Y29tcH0gZGF0YT17ZGF0YX0gLz5cbiAgICAgICAgKSl9ICovfVxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctMic+XG4gICAgICAgICAgPGEgY2xhc3NOYW1lPSdwcmV2aWV3IHB1bGwtcmlnaHQgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICAgIGhyZWY9e3BhZ2UucGF0aH0gdGFyZ2V0PSdwcmV2aWV3Jz5PcGVuPC9hPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdidXR0b24gYWN0aXZlJ1xuICAgICAgICAgICAgb25DbGljaz17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogdHJ1ZSB9KX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBQYWdlJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0b3J9XG4gICAgICAgICAgb25IaWRlPXtlID0+IHRoaXMuc2hvd0VkaXRvcihlLCBmYWxzZSl9PlxuICAgICAgICAgIDxQYWdlRWRpdCBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIENvbXBvbmVudCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93QWRkQ29tcG9uZW50fVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRDb21wb25lbnQ6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8Q29tcG9uZW50Q3JlYXRlIHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkNyZWF0ZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBhZ2VcbiIsImNvbnN0IGxpc3RUeXBlcyA9IFsnU2VsZWN0RmllbGQnLCAnUmFkaW9zRmllbGQnLCAnQ2hlY2tib3hlc0ZpZWxkJ11cblxuZnVuY3Rpb24gY29tcG9uZW50VG9TdHJpbmcgKGNvbXBvbmVudCkge1xuICBpZiAofmxpc3RUeXBlcy5pbmRleE9mKGNvbXBvbmVudC50eXBlKSkge1xuICAgIHJldHVybiBgJHtjb21wb25lbnQudHlwZX08JHtjb21wb25lbnQub3B0aW9ucy5saXN0fT5gXG4gIH1cbiAgcmV0dXJuIGAke2NvbXBvbmVudC50eXBlfWBcbn1cblxuZnVuY3Rpb24gRGF0YU1vZGVsIChwcm9wcykge1xuICBjb25zdCB7IGRhdGEgfSA9IHByb3BzXG4gIGNvbnN0IHsgc2VjdGlvbnMsIHBhZ2VzIH0gPSBkYXRhXG5cbiAgY29uc3QgbW9kZWwgPSB7fVxuXG4gIHBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgcGFnZS5jb21wb25lbnRzLmZvckVhY2goY29tcG9uZW50ID0+IHtcbiAgICAgIGlmIChjb21wb25lbnQubmFtZSkge1xuICAgICAgICBpZiAocGFnZS5zZWN0aW9uKSB7XG4gICAgICAgICAgY29uc3Qgc2VjdGlvbiA9IHNlY3Rpb25zLmZpbmQoc2VjdGlvbiA9PiBzZWN0aW9uLm5hbWUgPT09IHBhZ2Uuc2VjdGlvbilcbiAgICAgICAgICBpZiAoIW1vZGVsW3NlY3Rpb24ubmFtZV0pIHtcbiAgICAgICAgICAgIG1vZGVsW3NlY3Rpb24ubmFtZV0gPSB7fVxuICAgICAgICAgIH1cblxuICAgICAgICAgIG1vZGVsW3NlY3Rpb24ubmFtZV1bY29tcG9uZW50Lm5hbWVdID0gY29tcG9uZW50VG9TdHJpbmcoY29tcG9uZW50KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1vZGVsW2NvbXBvbmVudC5uYW1lXSA9IGNvbXBvbmVudFRvU3RyaW5nKGNvbXBvbmVudClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH0pXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkobW9kZWwsIG51bGwsIDIpfTwvcHJlPlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IERhdGFNb2RlbFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgUGFnZUNyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IHBhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIC8vIFZhbGlkYXRlXG4gICAgaWYgKGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gcGF0aCkpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMucGF0aC5zZXRDdXN0b21WYWxpZGl0eShgUGF0aCAnJHtwYXRofScgYWxyZWFkeSBleGlzdHNgKVxuICAgICAgZm9ybS5yZXBvcnRWYWxpZGl0eSgpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9IHtcbiAgICAgIHBhdGg6IHBhdGhcbiAgICB9XG5cbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIHZhbHVlLnRpdGxlID0gdGl0bGVcbiAgICB9XG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIHZhbHVlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfVxuXG4gICAgLy8gQXBwbHlcbiAgICBPYmplY3QuYXNzaWduKHZhbHVlLCB7XG4gICAgICBjb21wb25lbnRzOiBbXSxcbiAgICAgIG5leHQ6IFtdXG4gICAgfSlcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29weS5wYWdlcy5wdXNoKHZhbHVlKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IHZhbHVlIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIC8vIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgLy8gICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gIC8vICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gIC8vICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gIC8vICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gIC8vICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgLy8gICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBMaXN0ICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBzZWN0aW9ucyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXBhdGgnPlBhdGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+RS5nLiAveW91ci1vY2N1cGF0aW9uIG9yIC9wZXJzb25hbC1kZXRhaWxzL2RhdGUtb2YtYmlydGg8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZFxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gZS50YXJnZXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtdGl0bGUnPlRpdGxlIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdwYWdlLXRpdGxlLWhpbnQnIGNsYXNzTmFtZT0nZ292dWstaGludCc+XG4gICAgICAgICAgICBJZiBub3Qgc3VwcGxpZWQsIHRoZSB0aXRsZSBvZiB0aGUgZmlyc3QgcXVlc3Rpb24gd2lsbCBiZSB1c2VkLlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3BhZ2UtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJz5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoc2VjdGlvbiA9PiAoPG9wdGlvbiBrZXk9e3NlY3Rpb24ubmFtZX0gdmFsdWU9e3NlY3Rpb24ubmFtZX0+e3NlY3Rpb24udGl0bGV9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gdHlwZT0nc3VibWl0JyBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbic+U2F2ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBMaW5rRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgY29uc3QgeyBkYXRhLCBlZGdlIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgcGFnZSA9IGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gZWRnZS5zb3VyY2UpXG4gICAgY29uc3QgbGluayA9IHBhZ2UubmV4dC5maW5kKG4gPT4gbi5wYXRoID09PSBlZGdlLnRhcmdldClcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBwYWdlOiBwYWdlLFxuICAgICAgbGluazogbGlua1xuICAgIH1cbiAgfVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGluayA9IGNvcHlQYWdlLm5leHQuZmluZChuID0+IG4ucGF0aCA9PT0gbGluay5wYXRoKVxuXG4gICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgY29weUxpbmsuaWYgPSBjb25kaXRpb25cbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlMaW5rLmlmXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGlua0lkeCA9IGNvcHlQYWdlLm5leHQuZmluZEluZGV4KG4gPT4gbi5wYXRoID09PSBsaW5rLnBhdGgpXG4gICAgY29weVBhZ2UubmV4dC5zcGxpY2UoY29weUxpbmtJZHgsIDEpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxpbmsgfSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGRhdGEsIGVkZ2UgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHBhZ2VzIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstc291cmNlJz5Gcm9tPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGRlZmF1bHRWYWx1ZT17ZWRnZS5zb3VyY2V9IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGluay1zb3VyY2UnIGRpc2FibGVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3BhZ2VzLm1hcChwYWdlID0+ICg8b3B0aW9uIGtleT17cGFnZS5wYXRofSB2YWx1ZT17cGFnZS5wYXRofT57cGFnZS5wYXRofTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstdGFyZ2V0Jz5UbzwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBkZWZhdWx0VmFsdWU9e2VkZ2UudGFyZ2V0fSBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstdGFyZ2V0JyBkaXNhYmxlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLWNvbmRpdGlvbic+Q29uZGl0aW9uIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdsaW5rLWNvbmRpdGlvbi1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgVGhlIGxpbmsgd2lsbCBvbmx5IGJlIHVzZWQgaWYgdGhlIGV4cHJlc3Npb24gZXZhbHVhdGVzIHRvIHRydXRoeS5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaW5rLWNvbmRpdGlvbicgbmFtZT0naWYnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpbmsuaWZ9IGFyaWEtZGVzY3JpYmVkYnk9J2xpbmstY29uZGl0aW9uLWhpbnQnIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlua0VkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIExpbmtDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBmcm9tID0gZm9ybURhdGEuZ2V0KCdwYXRoJylcbiAgICBjb25zdCB0byA9IGZvcm1EYXRhLmdldCgncGFnZScpXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IHBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IGZyb20pXG5cbiAgICBjb25zdCBuZXh0ID0geyBwYXRoOiB0byB9XG5cbiAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICBuZXh0LmlmID0gY29uZGl0aW9uXG4gICAgfVxuXG4gICAgaWYgKCFwYWdlLm5leHQpIHtcbiAgICAgIHBhZ2UubmV4dCA9IFtdXG4gICAgfVxuXG4gICAgcGFnZS5uZXh0LnB1c2gobmV4dClcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBuZXh0IH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXNvdXJjZSc+RnJvbTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstc291cmNlJyBuYW1lPSdwYXRoJyByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXRhcmdldCc+VG88L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaW5rLXRhcmdldCcgbmFtZT0ncGFnZScgcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7cGFnZXMubWFwKHBhZ2UgPT4gKDxvcHRpb24ga2V5PXtwYWdlLnBhdGh9IHZhbHVlPXtwYWdlLnBhdGh9PntwYWdlLnBhdGh9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay1jb25kaXRpb24nPkNvbmRpdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0nbGluay1jb25kaXRpb24taGludCcgY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5cbiAgICAgICAgICAgIFRoZSBsaW5rIHdpbGwgb25seSBiZSB1c2VkIGlmIHRoZSBleHByZXNzaW9uIGV2YWx1YXRlcyB0byB0cnV0aHkuXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGluay1jb25kaXRpb24nIG5hbWU9J2lmJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0nbGluay1jb25kaXRpb24taGludCcgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpbmtDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmZ1bmN0aW9uIGhlYWREdXBsaWNhdGUgKGFycikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGFyci5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGFycltqXSA9PT0gYXJyW2ldKSB7XG4gICAgICAgIHJldHVybiBqXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIExpc3RJdGVtcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpdGVtczogcHJvcHMuaXRlbXMgPyBjbG9uZShwcm9wcy5pdGVtcykgOiBbXVxuICAgIH1cbiAgfVxuXG4gIG9uQ2xpY2tBZGRJdGVtID0gZSA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5jb25jYXQoeyB0ZXh0OiAnJywgdmFsdWU6ICcnLCBkZXNjcmlwdGlvbjogJycgfSlcbiAgICB9KVxuICB9XG5cbiAgcmVtb3ZlSXRlbSA9IGlkeCA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5maWx0ZXIoKHMsIGkpID0+IGkgIT09IGlkeClcbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIGxpc3RcbiAgICBjb3B5Lmxpc3RzLnNwbGljZShkYXRhLmxpc3RzLmluZGV4T2YobGlzdCksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIGxpc3RcbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAubGlzdFxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyID0gZSA9PiB7XG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0LmZvcm1cbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcblxuICAgIC8vIE9ubHkgdmFsaWRhdGUgZHVwZXMgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBpdGVtXG4gICAgaWYgKHRleHRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGZvcm0uZWxlbWVudHMudGV4dC5mb3JFYWNoKGVsID0+IGVsLnNldEN1c3RvbVZhbGlkaXR5KCcnKSlcbiAgICBmb3JtLmVsZW1lbnRzLnZhbHVlLmZvckVhY2goZWwgPT4gZWwuc2V0Q3VzdG9tVmFsaWRpdHkoJycpKVxuXG4gICAgLy8gVmFsaWRhdGUgdW5pcXVlbmVzc1xuICAgIGNvbnN0IGR1cGVUZXh0ID0gaGVhZER1cGxpY2F0ZSh0ZXh0cylcbiAgICBpZiAoZHVwZVRleHQpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMudGV4dFtkdXBlVGV4dF0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB0ZXh0cyBmb3VuZCBpbiB0aGUgbGlzdCBpdGVtcycpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBkdXBlVmFsdWUgPSBoZWFkRHVwbGljYXRlKHZhbHVlcylcbiAgICBpZiAoZHVwZVZhbHVlKSB7XG4gICAgICBmb3JtLmVsZW1lbnRzLnZhbHVlW2R1cGVWYWx1ZV0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB2YWx1ZXMgZm91bmQgaW4gdGhlIGxpc3QgaXRlbXMnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBpdGVtcyB9ID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHsgdHlwZSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDx0YWJsZSBjbGFzc05hbWU9J2dvdnVrLXRhYmxlJz5cbiAgICAgICAgPGNhcHRpb24gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2FwdGlvbic+SXRlbXM8L2NhcHRpb24+XG4gICAgICAgIDx0aGVhZCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkJz5cbiAgICAgICAgICA8dHIgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93Jz5cbiAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkZXInIHNjb3BlPSdjb2wnPlRleHQ8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+VmFsdWU8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+RGVzY3JpcHRpb248L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17dGhpcy5vbkNsaWNrQWRkSXRlbX0+QWRkPC9hPlxuICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICA8L3RoZWFkPlxuICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fYm9keSc+XG4gICAgICAgICAge2l0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IChcbiAgICAgICAgICAgIDx0ciBrZXk9e2l0ZW0udmFsdWUgKyBpbmRleH0gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93JyBzY29wZT0ncm93Jz5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBuYW1lPSd0ZXh0J1xuICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnRleHR9IHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyfSAvPlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAge3R5cGUgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICA/IChcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J3ZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9J251bWJlcicgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IHN0ZXA9J2FueScgLz5cbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIDogKFxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgbmFtZT0ndmFsdWUnXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IC8+XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J2Rlc2NyaXB0aW9uJ1xuICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLmRlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1cn0gLz5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnIHdpZHRoPScyMHB4Jz5cbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J2xpc3QtaXRlbS1kZWxldGUnIG9uQ2xpY2s9eygpID0+IHRoaXMucmVtb3ZlSXRlbShpbmRleCl9PiYjMTI4NDY1OzwvYT5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0SXRlbXNcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICB0eXBlOiBwcm9wcy5saXN0LnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBuZXdUeXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gbGlzdC5uYW1lXG4gICAgY29uc3QgY29weUxpc3QgPSBjb3B5Lmxpc3RzW2RhdGEubGlzdHMuaW5kZXhPZihsaXN0KV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weUxpc3QubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIHAuY29tcG9uZW50cy5mb3JFYWNoKGMgPT4ge1xuICAgICAgICAgIGlmIChjLnR5cGUgPT09ICdTZWxlY3RGaWVsZCcgfHwgYy50eXBlID09PSAnUmFkaW9zRmllbGQnKSB7XG4gICAgICAgICAgICBpZiAoYy5vcHRpb25zICYmIGMub3B0aW9ucy5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgICAgICAgYy5vcHRpb25zLmxpc3QgPSBuZXdOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5TGlzdC50aXRsZSA9IG5ld1RpdGxlXG4gICAgY29weUxpc3QudHlwZSA9IG5ld1R5cGVcblxuICAgIC8vIEl0ZW1zXG4gICAgY29uc3QgdGV4dHMgPSBmb3JtRGF0YS5nZXRBbGwoJ3RleHQnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCB2YWx1ZXMgPSBmb3JtRGF0YS5nZXRBbGwoJ3ZhbHVlJykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29uc3QgZGVzY3JpcHRpb25zID0gZm9ybURhdGEuZ2V0QWxsKCdkZXNjcmlwdGlvbicpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvcHlMaXN0Lml0ZW1zID0gdGV4dHMubWFwKCh0LCBpKSA9PiAoe1xuICAgICAgdGV4dDogdCxcbiAgICAgIHZhbHVlOiB2YWx1ZXNbaV0sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25zW2ldXG4gIH0pKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgbGlzdCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBsaXN0XG4gICAgY29weS5saXN0cy5zcGxpY2UoZGF0YS5saXN0cy5pbmRleE9mKGxpc3QpLCAxKVxuXG4gICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAubGlzdCA9PT0gbGlzdC5uYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBwLmxpc3RcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwgIT09IGxpc3QgJiYgbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMjAnIGlkPSdsaXN0LW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstIS13aWR0aC10d28tdGhpcmRzJyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QudGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10eXBlJz5WYWx1ZSB0eXBlPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIGl0ZW1zPXtsaXN0Lml0ZW1zfSB0eXBlPXtzdGF0ZS50eXBlfSAvPlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdEVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdENyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIHR5cGU6IHByb3BzLnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB0eXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gSXRlbXNcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCBkZXNjcmlwdGlvbnMgPSBmb3JtRGF0YS5nZXRBbGwoJ2Rlc2NyaXB0aW9uJykubWFwKHQgPT4gdC50cmltKCkpXG5cbiAgICBjb25zdCBpdGVtcyA9IHRleHRzLm1hcCgodCwgaSkgPT4gKHtcbiAgICAgIHRleHQ6IHQsXG4gICAgICB2YWx1ZTogdmFsdWVzW2ldLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uc1tpXVxuICB9KSlcblxuICAgIGNvcHkubGlzdHMucHVzaCh7IG5hbWUsIHRpdGxlLCB0eXBlLCBpdGVtcyB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpc3QtbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtdHlwZSc+VmFsdWUgdHlwZTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIHR5cGU9e3N0YXRlLnR5cGV9IC8+XG5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IExpc3RFZGl0IGZyb20gJy4vbGlzdC1lZGl0J1xuaW1wb3J0IExpc3RDcmVhdGUgZnJvbSAnLi9saXN0LWNyZWF0ZSdcblxuY2xhc3MgTGlzdHNFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uQ2xpY2tMaXN0ID0gKGUsIGxpc3QpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbGlzdDogbGlzdFxuICAgIH0pXG4gIH1cblxuICBvbkNsaWNrQWRkTGlzdCA9IChlLCBsaXN0KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dBZGRMaXN0OiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBsaXN0cyB9ID0gZGF0YVxuICAgIGNvbnN0IGxpc3QgPSB0aGlzLnN0YXRlLmxpc3RcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstYm9keSc+XG4gICAgICAgIHshbGlzdCA/IChcbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAge3RoaXMuc3RhdGUuc2hvd0FkZExpc3QgPyAoXG4gICAgICAgICAgICAgIDxMaXN0Q3JlYXRlIGRhdGE9e2RhdGF9XG4gICAgICAgICAgICAgICAgb25DcmVhdGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaXN0OiBmYWxzZSB9KX1cbiAgICAgICAgICAgICAgICBvbkNhbmNlbD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpc3Q6IGZhbHNlIH0pfSAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT0nZ292dWstbGlzdCc+XG4gICAgICAgICAgICAgICAge2xpc3RzLm1hcCgobGlzdCwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgIDxsaSBrZXk9e2xpc3QubmFtZX0+XG4gICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5vbkNsaWNrTGlzdChlLCBsaXN0KX0+XG4gICAgICAgICAgICAgICAgICAgICAge2xpc3QudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgPGhyIC8+XG4gICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja0FkZExpc3QoZSl9PkFkZCBsaXN0PC9hPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxMaXN0RWRpdCBsaXN0PXtsaXN0fSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBsaXN0OiBudWxsIH0pfVxuICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IGxpc3Q6IG51bGwgfSl9IC8+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdHNFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBTZWN0aW9uRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gc2VjdGlvbi5uYW1lXG4gICAgY29uc3QgY29weVNlY3Rpb24gPSBjb3B5LnNlY3Rpb25zW2RhdGEuc2VjdGlvbnMuaW5kZXhPZihzZWN0aW9uKV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weVNlY3Rpb24ubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBzZWN0aW9uXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChwLnNlY3Rpb24gPT09IHNlY3Rpb24ubmFtZSkge1xuICAgICAgICAgIHAuc2VjdGlvbiA9IG5ld05hbWVcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5U2VjdGlvbi50aXRsZSA9IG5ld1RpdGxlXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIHNlY3Rpb25cbiAgICBjb3B5LnNlY3Rpb25zLnNwbGljZShkYXRhLnNlY3Rpb25zLmluZGV4T2Yoc2VjdGlvbiksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIHNlY3Rpb25cbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5zZWN0aW9uID09PSBzZWN0aW9uLm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAuc2VjdGlvblxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5zZWN0aW9ucy5maW5kKHMgPT4gcyAhPT0gc2VjdGlvbiAmJiBzLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTmFtZSAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nc2VjdGlvbi1uYW1lJyBuYW1lPSduYW1lJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtzZWN0aW9uLm5hbWV9IHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtzZWN0aW9uLnRpdGxlfSByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgU2VjdGlvbkNyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIGNvbnN0IHNlY3Rpb24gPSB7IG5hbWUsIHRpdGxlIH1cbiAgICBjb3B5LnNlY3Rpb25zLnB1c2goc2VjdGlvbilcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEuc2VjdGlvbnMuZmluZChzID0+IHMubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBOYW1lICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+VGhpcyBpcyB1c2VkIGFzIGEgbmFtZXNwYWNlIGluIHRoZSBKU09OIG91dHB1dCBmb3IgYWxsIHBhZ2VzIGluIHRoaXMgc2VjdGlvbi4gVXNlIGBjYW1lbENhc2luZ2AgZS5nLiBjaGVja0JlZm9yZVN0YXJ0IG9yIHBlcnNvbmFsRGV0YWlscy48L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKydcbiAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJOYW1lfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5UaGlzIHRleHQgZGlzcGxheWVkIG9uIHRoZSBwYWdlIGFib3ZlIHRoZSBtYWluIHRpdGxlLjwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWQgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCBTZWN0aW9uRWRpdCBmcm9tICcuL3NlY3Rpb24tZWRpdCdcbmltcG9ydCBTZWN0aW9uQ3JlYXRlIGZyb20gJy4vc2VjdGlvbi1jcmVhdGUnXG5cbmNsYXNzIFNlY3Rpb25zRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrU2VjdGlvbiA9IChlLCBzZWN0aW9uKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlY3Rpb246IHNlY3Rpb25cbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0FkZFNlY3Rpb24gPSAoZSwgc2VjdGlvbikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzaG93QWRkU2VjdGlvbjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5zdGF0ZS5zZWN0aW9uXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWJvZHknPlxuICAgICAgICB7IXNlY3Rpb24gPyAoXG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIHt0aGlzLnN0YXRlLnNob3dBZGRTZWN0aW9uID8gKFxuICAgICAgICAgICAgICA8U2VjdGlvbkNyZWF0ZSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgICAgIG9uQ3JlYXRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkU2VjdGlvbjogZmFsc2UgfSl9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRTZWN0aW9uOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9J2dvdnVrLWxpc3QnPlxuICAgICAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoKHNlY3Rpb24sIGluZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8bGkga2V5PXtzZWN0aW9uLm5hbWV9PlxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja1NlY3Rpb24oZSwgc2VjdGlvbil9PlxuICAgICAgICAgICAgICAgICAgICAgIHtzZWN0aW9uLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgIDxociAvPlxuICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tBZGRTZWN0aW9uKGUpfT5BZGQgc2VjdGlvbjwvYT5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8U2VjdGlvbkVkaXQgc2VjdGlvbj17c2VjdGlvbn0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2VjdGlvbjogbnVsbCB9KX1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzZWN0aW9uOiBudWxsIH0pfSAvPlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlY3Rpb25zRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0IFJlYWN0RE9NIGRhZ3JlICovXG5cbmltcG9ydCBQYWdlIGZyb20gJy4vcGFnZSdcbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgRGF0YU1vZGVsIGZyb20gJy4vZGF0YS1tb2RlbCdcbmltcG9ydCBQYWdlQ3JlYXRlIGZyb20gJy4vcGFnZS1jcmVhdGUnXG5pbXBvcnQgTGlua0VkaXQgZnJvbSAnLi9saW5rLWVkaXQnXG5pbXBvcnQgTGlua0NyZWF0ZSBmcm9tICcuL2xpbmstY3JlYXRlJ1xuaW1wb3J0IExpc3RzRWRpdCBmcm9tICcuL2xpc3RzLWVkaXQnXG5pbXBvcnQgU2VjdGlvbnNFZGl0IGZyb20gJy4vc2VjdGlvbnMtZWRpdCdcblxuZnVuY3Rpb24gZ2V0TGF5b3V0IChkYXRhLCBlbCkge1xuICAvLyBDcmVhdGUgYSBuZXcgZGlyZWN0ZWQgZ3JhcGhcbiAgdmFyIGcgPSBuZXcgZGFncmUuZ3JhcGhsaWIuR3JhcGgoKVxuXG4gIC8vIFNldCBhbiBvYmplY3QgZm9yIHRoZSBncmFwaCBsYWJlbFxuICBnLnNldEdyYXBoKHtcbiAgICByYW5rZGlyOiAnTFInLFxuICAgIG1hcmdpbng6IDUwLFxuICAgIG1hcmdpbnk6IDE1MCxcbiAgICByYW5rc2VwOiAxNjBcbiAgfSlcblxuICAvLyBEZWZhdWx0IHRvIGFzc2lnbmluZyBhIG5ldyBvYmplY3QgYXMgYSBsYWJlbCBmb3IgZWFjaCBuZXcgZWRnZS5cbiAgZy5zZXREZWZhdWx0RWRnZUxhYmVsKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHt9IH0pXG5cbiAgLy8gQWRkIG5vZGVzIHRvIHRoZSBncmFwaC4gVGhlIGZpcnN0IGFyZ3VtZW50IGlzIHRoZSBub2RlIGlkLiBUaGUgc2Vjb25kIGlzXG4gIC8vIG1ldGFkYXRhIGFib3V0IHRoZSBub2RlLiBJbiB0aGlzIGNhc2Ugd2UncmUgZ29pbmcgdG8gYWRkIGxhYmVscyB0byBlYWNoIG5vZGVcbiAgZGF0YS5wYWdlcy5mb3JFYWNoKChwYWdlLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IHBhZ2VFbCA9IGVsLmNoaWxkcmVuW2luZGV4XVxuXG4gICAgZy5zZXROb2RlKHBhZ2UucGF0aCwgeyBsYWJlbDogcGFnZS5wYXRoLCB3aWR0aDogcGFnZUVsLm9mZnNldFdpZHRoLCBoZWlnaHQ6IHBhZ2VFbC5vZmZzZXRIZWlnaHQgfSlcbiAgfSlcblxuICAvLyBBZGQgZWRnZXMgdG8gdGhlIGdyYXBoLlxuICBkYXRhLnBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFnZS5uZXh0KSkge1xuICAgICAgcGFnZS5uZXh0LmZvckVhY2gobmV4dCA9PiB7XG4gICAgICAgIGcuc2V0RWRnZShwYWdlLnBhdGgsIG5leHQucGF0aClcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIGRhZ3JlLmxheW91dChnKVxuXG4gIGNvbnN0IHBvcyA9IHtcbiAgICBub2RlczogW10sXG4gICAgZWRnZXM6IFtdXG4gIH1cblxuICBjb25zdCBvdXRwdXQgPSBnLmdyYXBoKClcbiAgcG9zLndpZHRoID0gb3V0cHV0LndpZHRoICsgJ3B4J1xuICBwb3MuaGVpZ2h0ID0gb3V0cHV0LmhlaWdodCArICdweCdcbiAgZy5ub2RlcygpLmZvckVhY2goKHYsIGluZGV4KSA9PiB7XG4gICAgY29uc3Qgbm9kZSA9IGcubm9kZSh2KVxuICAgIGNvbnN0IHB0ID0geyBub2RlIH1cbiAgICBwdC50b3AgPSAobm9kZS55IC0gbm9kZS5oZWlnaHQgLyAyKSArICdweCdcbiAgICBwdC5sZWZ0ID0gKG5vZGUueCAtIG5vZGUud2lkdGggLyAyKSArICdweCdcbiAgICBwb3Mubm9kZXMucHVzaChwdClcbiAgfSlcblxuICBnLmVkZ2VzKCkuZm9yRWFjaCgoZSwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBlZGdlID0gZy5lZGdlKGUpXG4gICAgcG9zLmVkZ2VzLnB1c2goe1xuICAgICAgc291cmNlOiBlLnYsXG4gICAgICB0YXJnZXQ6IGUudyxcbiAgICAgIHBvaW50czogZWRnZS5wb2ludHMubWFwKHAgPT4ge1xuICAgICAgICBjb25zdCBwdCA9IHt9XG4gICAgICAgIHB0LnkgPSBwLnlcbiAgICAgICAgcHQueCA9IHAueFxuICAgICAgICByZXR1cm4gcHRcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4geyBnLCBwb3MgfVxufVxuXG5jbGFzcyBMaW5lcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBlZGl0TGluayA9IChlZGdlKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ2NsaWNrZWQnLCBlZGdlKVxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2hvd0VkaXRvcjogZWRnZVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgbGF5b3V0LCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPHN2ZyBoZWlnaHQ9e2xheW91dC5oZWlnaHR9IHdpZHRoPXtsYXlvdXQud2lkdGh9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5lZGdlcy5tYXAoZWRnZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHBvaW50cyA9IGVkZ2UucG9pbnRzLm1hcChwb2ludHMgPT4gYCR7cG9pbnRzLnh9LCR7cG9pbnRzLnl9YCkuam9pbignICcpXG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGcga2V5PXtwb2ludHN9PlxuICAgICAgICAgICAgICAgICAgPHBvbHlsaW5lXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuZWRpdExpbmsoZWRnZSl9XG4gICAgICAgICAgICAgICAgICAgIHBvaW50cz17cG9pbnRzfSAvPlxuICAgICAgICAgICAgICAgIDwvZz5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIDwvc3ZnPlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgTGluaycgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfVxuICAgICAgICAgIG9uSGlkZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogZmFsc2UgfSl9PlxuICAgICAgICAgIDxMaW5rRWRpdCBlZGdlPXt0aGlzLnN0YXRlLnNob3dFZGl0b3J9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5jbGFzcyBNaW5pbWFwIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uQ2xpY2tQYWdlID0gKGUpID0+IHtcblxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxheW91dCwgZGF0YSwgc2NhbGUgPSAwLjA1IH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J21pbmltYXAnPlxuICAgICAgICA8c3ZnIGhlaWdodD17cGFyc2VGbG9hdChsYXlvdXQuaGVpZ2h0KSAqIHNjYWxlfSB3aWR0aD17cGFyc2VGbG9hdChsYXlvdXQud2lkdGgpICogc2NhbGV9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5lZGdlcy5tYXAoZWRnZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHBvaW50cyA9IGVkZ2UucG9pbnRzLm1hcChwb2ludHMgPT4gYCR7cG9pbnRzLnggKiBzY2FsZX0sJHtwb2ludHMueSAqIHNjYWxlfWApLmpvaW4oJyAnKVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxnIGtleT17cG9pbnRzfT5cbiAgICAgICAgICAgICAgICAgIDxwb2x5bGluZSBwb2ludHM9e3BvaW50c30gLz5cbiAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5ub2Rlcy5tYXAoKG5vZGUsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGcga2V5PXtub2RlICsgaW5kZXh9PlxuICAgICAgICAgICAgICAgICAgPGEgeGxpbmtIcmVmPXtgIyR7bm9kZS5ub2RlLmxhYmVsfWB9PlxuICAgICAgICAgICAgICAgICAgICA8cmVjdCB4PXtwYXJzZUZsb2F0KG5vZGUubGVmdCkgKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICB5PXtwYXJzZUZsb2F0KG5vZGUudG9wKSAqIHNjYWxlfVxuICAgICAgICAgICAgICAgICAgICAgIHdpZHRoPXtub2RlLm5vZGUud2lkdGggKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ9e25vZGUubm9kZS5oZWlnaHQgKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICB0aXRsZT17bm9kZS5ub2RlLmxhYmVsfVxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub25DbGlja1BhZ2V9IC8+XG4gICAgICAgICAgICAgICAgICA8L2E+XG4gICAgICAgICAgICAgICAgPC9nPlxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgPC9zdmc+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgVmlzdWFsaXNhdGlvbiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMucmVmID0gUmVhY3QuY3JlYXRlUmVmKClcbiAgfVxuXG4gIHNjaGVkdWxlTGF5b3V0ICgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGdldExheW91dCh0aGlzLnByb3BzLmRhdGEsIHRoaXMucmVmLmN1cnJlbnQpXG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBsYXlvdXQ6IGxheW91dC5wb3NcbiAgICAgIH0pXG4gICAgfSwgMjAwKVxuICB9XG5cbiAgY29tcG9uZW50RGlkTW91bnQgKCkge1xuICAgIHRoaXMuc2NoZWR1bGVMYXlvdXQoKVxuICB9XG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyAoKSB7XG4gICAgdGhpcy5zY2hlZHVsZUxheW91dCgpXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgcGFnZXMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHJlZj17dGhpcy5yZWZ9IGNsYXNzTmFtZT0ndmlzdWFsaXNhdGlvbicgc3R5bGU9e3RoaXMuc3RhdGUubGF5b3V0ICYmIHsgd2lkdGg6IHRoaXMuc3RhdGUubGF5b3V0LndpZHRoLCBoZWlnaHQ6IHRoaXMuc3RhdGUubGF5b3V0LmhlaWdodCB9fT5cbiAgICAgICAge3BhZ2VzLm1hcCgocGFnZSwgaW5kZXgpID0+IDxQYWdlXG4gICAgICAgICAga2V5PXtpbmRleH0gZGF0YT17ZGF0YX0gcGFnZT17cGFnZX1cbiAgICAgICAgICBsYXlvdXQ9e3RoaXMuc3RhdGUubGF5b3V0ICYmIHRoaXMuc3RhdGUubGF5b3V0Lm5vZGVzW2luZGV4XX0gLz5cbiAgICAgICAgKX1cbiAgICAgICAge3RoaXMuc3RhdGUubGF5b3V0ICYmIDxMaW5lcyBsYXlvdXQ9e3RoaXMuc3RhdGUubGF5b3V0fSBkYXRhPXtkYXRhfSAvPn1cbiAgICAgICAge3RoaXMuc3RhdGUubGF5b3V0ICYmIDxNaW5pbWFwIGxheW91dD17dGhpcy5zdGF0ZS5sYXlvdXR9IGRhdGE9e2RhdGF9IC8+fVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIE1lbnUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25DbGlja1VwbG9hZCA9IChlKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3VwbG9hZCcpLmNsaWNrKClcbiAgfVxuXG4gIG9uRmlsZVVwbG9hZCA9IChlKSA9PiB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgZmlsZSA9IGUudGFyZ2V0LmZpbGVzLml0ZW0oMClcbiAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc1RleHQoZmlsZSwgJ1VURi04JylcbiAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgY29uc3QgY29udGVudCA9IEpTT04ucGFyc2UoZXZ0LnRhcmdldC5yZXN1bHQpXG4gICAgICBkYXRhLnNhdmUoY29udGVudClcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGxheWdyb3VuZE1vZGUgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbWVudSc+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRQYWdlOiB0cnVlIH0pfT5BZGQgUGFnZTwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpbms6IHRydWUgfSl9PkFkZCBMaW5rPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdFNlY3Rpb25zOiB0cnVlIH0pfT5FZGl0IFNlY3Rpb25zPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdExpc3RzOiB0cnVlIH0pfT5FZGl0IExpc3RzPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RGF0YU1vZGVsOiB0cnVlIH0pfT5WaWV3IERhdGEgTW9kZWw8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dKU09ORGF0YTogdHJ1ZSB9KX0+VmlldyBKU09OPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93U3VtbWFyeTogdHJ1ZSB9KX0+U3VtbWFyeTwvYnV0dG9uPlxuXG4gICAgICAgIHtwbGF5Z3JvdW5kTW9kZSAmJiAoXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJnb3Z1ay0hLW1hcmdpbi10b3AtNFwiPlxuICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdnb3Z1ay1saW5rIGdvdnVrLWxpbmstLW5vLXZpc2l0ZWQtc3RhdGUgZ292dWstIS1mb250LXNpemUtMTYnIGRvd25sb2FkIGhyZWY9Jy9hcGkvZGF0YT9mb3JtYXQ9dHJ1ZSc+RG93bmxvYWQgSlNPTjwvYT57JyAnfVxuICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdnb3Z1ay1saW5rIGdvdnVrLWxpbmstLW5vLXZpc2l0ZWQtc3RhdGUgZ292dWstIS1mb250LXNpemUtMTYnIGhyZWY9JyMnIG9uQ2xpY2s9e3RoaXMub25DbGlja1VwbG9hZH0+VXBsb2FkIEpTT048L2E+eycgJ31cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSdmaWxlJyBpZD0ndXBsb2FkJyBoaWRkZW4gb25DaGFuZ2U9e3RoaXMub25GaWxlVXBsb2FkfSAvPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApfVxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0FkZCBQYWdlJyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRQYWdlfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRQYWdlOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPFBhZ2VDcmVhdGUgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkUGFnZTogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0FkZCBMaW5rJyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRMaW5rfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaW5rOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPExpbmtDcmVhdGUgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGluazogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgU2VjdGlvbnMnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRTZWN0aW9uc31cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdFNlY3Rpb25zOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPFNlY3Rpb25zRWRpdCBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0U2VjdGlvbnM6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IExpc3RzJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0TGlzdHN9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRMaXN0czogZmFsc2UgfSl9IHdpZHRoPSd4bGFyZ2UnPlxuICAgICAgICAgIDxMaXN0c0VkaXQgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdExpc3RzOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRGF0YSBNb2RlbCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93RGF0YU1vZGVsfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dEYXRhTW9kZWw6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8RGF0YU1vZGVsIGRhdGE9e2RhdGF9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0pTT04gRGF0YScgc2hvdz17dGhpcy5zdGF0ZS5zaG93SlNPTkRhdGF9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0pTT05EYXRhOiBmYWxzZSB9KX0gd2lkdGg9J2xhcmdlJz5cbiAgICAgICAgICA8cHJlPntKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKX08L3ByZT5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nU3VtbWFyeScgc2hvdz17dGhpcy5zdGF0ZS5zaG93U3VtbWFyeX1cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93U3VtbWFyeTogZmFsc2UgfSl9PlxuICAgICAgICAgIDxwcmU+e0pTT04uc3RyaW5naWZ5KGRhdGEucGFnZXMubWFwKHBhZ2UgPT4gcGFnZS5wYXRoKSwgbnVsbCwgMil9PC9wcmU+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIEFwcCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBjb21wb25lbnRXaWxsTW91bnQgKCkge1xuICAgIHdpbmRvdy5mZXRjaCgnL2FwaS9kYXRhJykudGhlbihyZXMgPT4gcmVzLmpzb24oKSkudGhlbihkYXRhID0+IHtcbiAgICAgIGRhdGEuc2F2ZSA9IHRoaXMuc2F2ZVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxvYWRlZDogdHJ1ZSwgZGF0YSB9KVxuICAgIH0pXG4gIH1cblxuICBzYXZlID0gKHVwZGF0ZWREYXRhKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5mZXRjaChgL2FwaS9kYXRhYCwge1xuICAgICAgbWV0aG9kOiAncHV0JyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHVwZGF0ZWREYXRhKVxuICAgIH0pLnRoZW4ocmVzID0+IHtcbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHRocm93IEVycm9yKHJlcy5zdGF0dXNUZXh0KVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc1xuICAgIH0pLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpLnRoZW4oZGF0YSA9PiB7XG4gICAgICBkYXRhLnNhdmUgPSB0aGlzLnNhdmVcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBkYXRhIH0pXG5cbiAgICAgIC8vIFJlbG9hZCBmcmFtZSBpZiBzcGxpdCBzY3JlZW4gYW5kIGluIHBsYXlncm91bmQgbW9kZVxuICAgICAgaWYgKHdpbmRvdy5ERkJELnBsYXlncm91bmRNb2RlKSB7XG4gICAgICAgIGNvbnN0IHBhcmVudCA9IHdpbmRvdy5wYXJlbnRcbiAgICAgICAgaWYgKHBhcmVudC5sb2NhdGlvbi5wYXRobmFtZSA9PT0gJy9zcGxpdCcpIHtcbiAgICAgICAgICBjb25zdCBmcmFtZXMgPSB3aW5kb3cucGFyZW50LmZyYW1lc1xuICBcbiAgICAgICAgICBpZiAoZnJhbWVzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgY29uc3QgcHJldmlldyA9IHdpbmRvdy5wYXJlbnQuZnJhbWVzWzFdXG4gICAgICAgICAgICBwcmV2aWV3LmxvY2F0aW9uLnJlbG9hZCgpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkYXRhXG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgd2luZG93LmFsZXJ0KCdTYXZlIGZhaWxlZCcpXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUubG9hZGVkKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGlkPSdhcHAnPlxuICAgICAgICAgIDxNZW51IGRhdGE9e3RoaXMuc3RhdGUuZGF0YX0gcGxheWdyb3VuZE1vZGU9e3dpbmRvdy5ERkJELnBsYXlncm91bmRNb2RlfSAvPlxuICAgICAgICAgIDxWaXN1YWxpc2F0aW9uIGRhdGE9e3RoaXMuc3RhdGUuZGF0YX0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiA8ZGl2PkxvYWRpbmcuLi48L2Rpdj5cbiAgICB9XG4gIH1cbn1cblxuUmVhY3RET00ucmVuZGVyKFxuICA8QXBwIC8+LFxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncm9vdCcpXG4pXG4iXSwibmFtZXMiOlsiRmx5b3V0IiwicHJvcHMiLCJzaG93Iiwid2lkdGgiLCJvbkhpZGUiLCJlIiwidGl0bGUiLCJjaGlsZHJlbiIsImdldEZvcm1EYXRhIiwiZm9ybSIsImZvcm1EYXRhIiwid2luZG93IiwiRm9ybURhdGEiLCJkYXRhIiwib3B0aW9ucyIsInNjaGVtYSIsImNhc3QiLCJuYW1lIiwidmFsIiwiZWwiLCJlbGVtZW50cyIsImRhdGFzZXQiLCJ1bmRlZmluZWQiLCJOdW1iZXIiLCJmb3JFYWNoIiwidmFsdWUiLCJrZXkiLCJvcHRpb25zUHJlZml4Iiwic2NoZW1hUHJlZml4IiwidHJpbSIsInN0YXJ0c1dpdGgiLCJyZXF1aXJlZCIsInN1YnN0ciIsImxlbmd0aCIsIk9iamVjdCIsImtleXMiLCJjbG9uZSIsIm9iaiIsIkpTT04iLCJwYXJzZSIsInN0cmluZ2lmeSIsIlBhZ2VFZGl0Iiwic3RhdGUiLCJvblN1Ym1pdCIsInByZXZlbnREZWZhdWx0IiwidGFyZ2V0IiwibmV3UGF0aCIsImdldCIsInNlY3Rpb24iLCJwYWdlIiwiY29weSIsInBhdGhDaGFuZ2VkIiwicGF0aCIsImNvcHlQYWdlIiwicGFnZXMiLCJpbmRleE9mIiwiZmluZCIsInAiLCJzZXRDdXN0b21WYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5IiwiQXJyYXkiLCJpc0FycmF5IiwibmV4dCIsIm4iLCJzYXZlIiwidGhlbiIsImNvbnNvbGUiLCJsb2ciLCJvbkVkaXQiLCJjYXRjaCIsImVycm9yIiwiZXJyIiwib25DbGlja0RlbGV0ZSIsImNvbmZpcm0iLCJjb3B5UGFnZUlkeCIsImZpbmRJbmRleCIsImluZGV4IiwiaSIsInNwbGljZSIsInNlY3Rpb25zIiwibWFwIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb21wb25lbnRUeXBlcyIsInN1YlR5cGUiLCJDbGFzc2VzIiwiY29tcG9uZW50IiwiY2xhc3NlcyIsIkZpZWxkRWRpdCIsImhpbnQiLCJUZXh0RmllbGRFZGl0IiwibWF4IiwibWluIiwiTXVsdGlsaW5lVGV4dEZpZWxkRWRpdCIsInJvd3MiLCJOdW1iZXJGaWVsZEVkaXQiLCJpbnRlZ2VyIiwiU2VsZWN0RmllbGRFZGl0IiwibGlzdHMiLCJsaXN0IiwiUmFkaW9zRmllbGRFZGl0IiwiYm9sZCIsIkNoZWNrYm94ZXNGaWVsZEVkaXQiLCJQYXJhRWRpdCIsImNvbnRlbnQiLCJJbnNldFRleHRFZGl0IiwiSHRtbEVkaXQiLCJEZXRhaWxzRWRpdCIsImNvbXBvbmVudFR5cGVFZGl0b3JzIiwiQ29tcG9uZW50VHlwZUVkaXQiLCJ0eXBlIiwidCIsIlRhZ05hbWUiLCJDb21wb25lbnRFZGl0IiwiY29tcG9uZW50SW5kZXgiLCJjb21wb25lbnRzIiwiY29tcG9uZW50SWR4IiwiYyIsImlzTGFzdCIsImNvcHlDb21wIiwiU29ydGFibGVIYW5kbGUiLCJTb3J0YWJsZUhPQyIsIkRyYWdIYW5kbGUiLCJUZXh0RmllbGQiLCJUZWxlcGhvbmVOdW1iZXJGaWVsZCIsIk51bWJlckZpZWxkIiwiRW1haWxBZGRyZXNzRmllbGQiLCJUaW1lRmllbGQiLCJEYXRlRmllbGQiLCJEYXRlVGltZUZpZWxkIiwiRGF0ZVBhcnRzRmllbGQiLCJEYXRlVGltZVBhcnRzRmllbGQiLCJNdWx0aWxpbmVUZXh0RmllbGQiLCJSYWRpb3NGaWVsZCIsIkNoZWNrYm94ZXNGaWVsZCIsIlNlbGVjdEZpZWxkIiwiWWVzTm9GaWVsZCIsIlVrQWRkcmVzc0ZpZWxkIiwiUGFyYSIsIkh0bWwiLCJJbnNldFRleHQiLCJEZXRhaWxzIiwiQmFzZSIsIkNvbXBvbmVudEZpZWxkIiwic2hvd0VkaXRvciIsInN0b3BQcm9wYWdhdGlvbiIsInNldFN0YXRlIiwiQ29tcG9uZW50Q3JlYXRlIiwicHVzaCIsIm9uQ3JlYXRlIiwiU29ydGFibGVFbGVtZW50IiwiU29ydGFibGVDb250YWluZXIiLCJhcnJheU1vdmUiLCJTb3J0YWJsZUl0ZW0iLCJTb3J0YWJsZUxpc3QiLCJQYWdlIiwib25Tb3J0RW5kIiwib2xkSW5kZXgiLCJuZXdJbmRleCIsImZvcm1Db21wb25lbnRzIiwiZmlsdGVyIiwiY29tcCIsInBhZ2VUaXRsZSIsImxheW91dCIsInNob3dBZGRDb21wb25lbnQiLCJsaXN0VHlwZXMiLCJjb21wb25lbnRUb1N0cmluZyIsIkRhdGFNb2RlbCIsIm1vZGVsIiwiUGFnZUNyZWF0ZSIsImFzc2lnbiIsIkxpbmtFZGl0IiwiZWRnZSIsInNvdXJjZSIsImxpbmsiLCJpZiIsImNvbmRpdGlvbiIsImNvcHlMaW5rIiwiY29weUxpbmtJZHgiLCJMaW5rQ3JlYXRlIiwiZnJvbSIsInRvIiwiaGVhZER1cGxpY2F0ZSIsImFyciIsImoiLCJMaXN0SXRlbXMiLCJvbkNsaWNrQWRkSXRlbSIsIml0ZW1zIiwiY29uY2F0IiwidGV4dCIsImRlc2NyaXB0aW9uIiwicmVtb3ZlSXRlbSIsInMiLCJpZHgiLCJvbkJsdXIiLCJ0ZXh0cyIsImdldEFsbCIsInZhbHVlcyIsImR1cGVUZXh0IiwiZHVwZVZhbHVlIiwiaXRlbSIsIkxpc3RFZGl0IiwibmV3TmFtZSIsIm5ld1RpdGxlIiwibmV3VHlwZSIsIm5hbWVDaGFuZ2VkIiwiY29weUxpc3QiLCJkZXNjcmlwdGlvbnMiLCJvbkJsdXJOYW1lIiwiaW5wdXQiLCJsIiwib25DYW5jZWwiLCJMaXN0Q3JlYXRlIiwiTGlzdHNFZGl0Iiwib25DbGlja0xpc3QiLCJvbkNsaWNrQWRkTGlzdCIsInNob3dBZGRMaXN0IiwiU2VjdGlvbkVkaXQiLCJjb3B5U2VjdGlvbiIsIlNlY3Rpb25DcmVhdGUiLCJTZWN0aW9uc0VkaXQiLCJvbkNsaWNrU2VjdGlvbiIsIm9uQ2xpY2tBZGRTZWN0aW9uIiwic2hvd0FkZFNlY3Rpb24iLCJnZXRMYXlvdXQiLCJnIiwiZGFncmUiLCJncmFwaGxpYiIsIkdyYXBoIiwic2V0R3JhcGgiLCJyYW5rZGlyIiwibWFyZ2lueCIsIm1hcmdpbnkiLCJyYW5rc2VwIiwic2V0RGVmYXVsdEVkZ2VMYWJlbCIsInBhZ2VFbCIsInNldE5vZGUiLCJsYWJlbCIsIm9mZnNldFdpZHRoIiwiaGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0Iiwic2V0RWRnZSIsInBvcyIsIm5vZGVzIiwiZWRnZXMiLCJvdXRwdXQiLCJncmFwaCIsInYiLCJub2RlIiwicHQiLCJ0b3AiLCJ5IiwibGVmdCIsIngiLCJ3IiwicG9pbnRzIiwiTGluZXMiLCJlZGl0TGluayIsImpvaW4iLCJNaW5pbWFwIiwib25DbGlja1BhZ2UiLCJzY2FsZSIsInBhcnNlRmxvYXQiLCJWaXN1YWxpc2F0aW9uIiwicmVmIiwiY3JlYXRlUmVmIiwic2V0VGltZW91dCIsImN1cnJlbnQiLCJzY2hlZHVsZUxheW91dCIsIk1lbnUiLCJvbkNsaWNrVXBsb2FkIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsImNsaWNrIiwib25GaWxlVXBsb2FkIiwiZmlsZSIsImZpbGVzIiwicmVhZGVyIiwiRmlsZVJlYWRlciIsInJlYWRBc1RleHQiLCJvbmxvYWQiLCJldnQiLCJyZXN1bHQiLCJwbGF5Z3JvdW5kTW9kZSIsInNob3dBZGRQYWdlIiwic2hvd0FkZExpbmsiLCJzaG93RWRpdFNlY3Rpb25zIiwic2hvd0VkaXRMaXN0cyIsInNob3dEYXRhTW9kZWwiLCJzaG93SlNPTkRhdGEiLCJzaG93U3VtbWFyeSIsIkFwcCIsInVwZGF0ZWREYXRhIiwiZmV0Y2giLCJtZXRob2QiLCJib2R5IiwicmVzIiwib2siLCJFcnJvciIsInN0YXR1c1RleHQiLCJqc29uIiwiREZCRCIsInBhcmVudCIsImxvY2F0aW9uIiwicGF0aG5hbWUiLCJmcmFtZXMiLCJwcmV2aWV3IiwicmVsb2FkIiwiYWxlcnQiLCJsb2FkZWQiLCJSZWFjdERPTSIsInJlbmRlciJdLCJtYXBwaW5ncyI6Ijs7O0VBQ0EsU0FBU0EsTUFBVCxDQUFpQkMsS0FBakIsRUFBd0I7RUFDdEIsTUFBSSxDQUFDQSxNQUFNQyxJQUFYLEVBQWlCO0VBQ2YsV0FBTyxJQUFQO0VBQ0Q7O0VBRUQsTUFBTUMs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
