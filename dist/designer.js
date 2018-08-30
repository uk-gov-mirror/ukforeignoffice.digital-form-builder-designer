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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzaWduZXIuanMiLCJzb3VyY2VzIjpbIi4uL2NsaWVudC9mbHlvdXQuanMiLCIuLi9jbGllbnQvaGVscGVycy5qcyIsIi4uL2NsaWVudC9wYWdlLWVkaXQuanMiLCIuLi9jb21wb25lbnQtdHlwZXMuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LXR5cGUtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LWNyZWF0ZS5qcyIsIi4uL2NsaWVudC9wYWdlLmpzIiwiLi4vY2xpZW50L2RhdGEtbW9kZWwuanMiLCIuLi9jbGllbnQvcGFnZS1jcmVhdGUuanMiLCIuLi9jbGllbnQvbGluay1lZGl0LmpzIiwiLi4vY2xpZW50L2xpbmstY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3QtaXRlbXMuanMiLCIuLi9jbGllbnQvbGlzdC1lZGl0LmpzIiwiLi4vY2xpZW50L2xpc3QtY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3RzLWVkaXQuanMiLCIuLi9jbGllbnQvc2VjdGlvbi1lZGl0LmpzIiwiLi4vY2xpZW50L3NlY3Rpb24tY3JlYXRlLmpzIiwiLi4vY2xpZW50L3NlY3Rpb25zLWVkaXQuanMiLCIuLi9jbGllbnQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5mdW5jdGlvbiBGbHlvdXQgKHByb3BzKSB7XG4gIGlmICghcHJvcHMuc2hvdykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCB3aWR0aCA9IHByb3BzLndpZHRoIHx8ICcnXG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZmx5b3V0LW1lbnUgc2hvdyc+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YGZseW91dC1tZW51LWNvbnRhaW5lciAke3dpZHRofWB9PlxuICAgICAgICA8YSB0aXRsZT0nQ2xvc2UnIGNsYXNzTmFtZT0nY2xvc2UgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgb25DbGljaz17ZSA9PiBwcm9wcy5vbkhpZGUoZSl9PkNsb3NlPC9hPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFuZWwnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1oZWFkZXIgZ292dWstIS1wYWRkaW5nLXRvcC00IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTQnPlxuICAgICAgICAgICAge3Byb3BzLnRpdGxlICYmIDxoNCBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctbSc+e3Byb3BzLnRpdGxlfTwvaDQ+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1ib2R5Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctbGVmdC00IGdvdnVrLSEtcGFkZGluZy1yaWdodC00IGdvdnVrLSEtcGFkZGluZy1ib3R0b20tNCc+XG4gICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZseW91dFxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1EYXRhIChmb3JtKSB7XG4gIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICBjb25zdCBkYXRhID0ge1xuICAgIG9wdGlvbnM6IHt9LFxuICAgIHNjaGVtYToge31cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhc3QgKG5hbWUsIHZhbCkge1xuICAgIGNvbnN0IGVsID0gZm9ybS5lbGVtZW50c1tuYW1lXVxuICAgIGNvbnN0IGNhc3QgPSBlbCAmJiBlbC5kYXRhc2V0LmNhc3RcblxuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGNhc3QgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gTnVtYmVyKHZhbClcbiAgICB9IGVsc2UgaWYgKGNhc3QgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHZhbCA9PT0gJ29uJ1xuICAgIH1cblxuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICBjb25zdCBvcHRpb25zUHJlZml4ID0gJ29wdGlvbnMuJ1xuICAgIGNvbnN0IHNjaGVtYVByZWZpeCA9ICdzY2hlbWEuJ1xuXG4gICAgdmFsdWUgPSB2YWx1ZS50cmltKClcblxuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG9wdGlvbnNQcmVmaXgpKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGAke29wdGlvbnNQcmVmaXh9cmVxdWlyZWRgICYmIHZhbHVlID09PSAnb24nKSB7XG4gICAgICAgICAgZGF0YS5vcHRpb25zLnJlcXVpcmVkID0gZmFsc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLm9wdGlvbnNba2V5LnN1YnN0cihvcHRpb25zUHJlZml4Lmxlbmd0aCldID0gY2FzdChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleS5zdGFydHNXaXRoKHNjaGVtYVByZWZpeCkpIHtcbiAgICAgICAgZGF0YS5zY2hlbWFba2V5LnN1YnN0cihzY2hlbWFQcmVmaXgubGVuZ3RoKV0gPSBjYXN0KGtleSwgdmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIENsZWFudXBcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLnNjaGVtYSkubGVuZ3RoKSBkZWxldGUgZGF0YS5zY2hlbWFcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLm9wdGlvbnMpLmxlbmd0aCkgZGVsZXRlIGRhdGEub3B0aW9uc1xuXG4gIHJldHVybiBkYXRhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZSAob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld1BhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBwYXRoQ2hhbmdlZCA9IG5ld1BhdGggIT09IHBhZ2UucGF0aFxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlc1tkYXRhLnBhZ2VzLmluZGV4T2YocGFnZSldXG5cbiAgICBpZiAocGF0aENoYW5nZWQpIHtcbiAgICAgIC8vIGBwYXRoYCBoYXMgY2hhbmdlZCAtIHZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgICAgaWYgKGRhdGEucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gbmV3UGF0aCkpIHtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke25ld1BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29weVBhZ2UucGF0aCA9IG5ld1BhdGhcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBwYWdlXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHAubmV4dCkpIHtcbiAgICAgICAgICBwLm5leHQuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgIGlmIChuLnBhdGggPT09IHBhZ2UucGF0aCkge1xuICAgICAgICAgICAgICBuLnBhdGggPSBuZXdQYXRoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIGNvcHlQYWdlLnRpdGxlID0gdGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlQYWdlLnRpdGxlXG4gICAgfVxuXG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIGNvcHlQYWdlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjb3B5UGFnZS5zZWN0aW9uXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2VJZHggPSBjb3B5LnBhZ2VzLmZpbmRJbmRleChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBsaW5rcyB0byB0aGUgcGFnZVxuICAgIGNvcHkucGFnZXMuZm9yRWFjaCgocCwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChpbmRleCAhPT0gY29weVBhZ2VJZHggJiYgQXJyYXkuaXNBcnJheShwLm5leHQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBwLm5leHQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gcC5uZXh0W2ldXG4gICAgICAgICAgaWYgKG5leHQucGF0aCA9PT0gcGFnZS5wYXRoKSB7XG4gICAgICAgICAgICBwLm5leHQuc3BsaWNlKGksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIFJlbW92ZSB0aGUgcGFnZSBpdHNlbGZcbiAgICBjb3B5LnBhZ2VzLnNwbGljZShjb3B5UGFnZUlkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIC8vIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3BhZ2UucGF0aH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGUudGFyZ2V0LnNldEN1c3RvbVZhbGlkaXR5KCcnKX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXRpdGxlJz5UaXRsZSAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0ncGFnZS10aXRsZS1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgSWYgbm90IHN1cHBsaWVkLCB0aGUgdGl0bGUgb2YgdGhlIGZpcnN0IHF1ZXN0aW9uIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17cGFnZS50aXRsZX0gYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJyBkZWZhdWx0VmFsdWU9e3BhZ2Uuc2VjdGlvbn0+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7c2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gKDxvcHRpb24ga2V5PXtzZWN0aW9uLm5hbWV9IHZhbHVlPXtzZWN0aW9uLm5hbWV9PntzZWN0aW9uLnRpdGxlfTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlRWRpdFxuIiwiY29uc3QgY29tcG9uZW50VHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAnVGV4dEZpZWxkJyxcbiAgICB0aXRsZTogJ1RleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdNdWx0aWxpbmVUZXh0RmllbGQnLFxuICAgIHRpdGxlOiAnTXVsdGlsaW5lIHRleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdZZXNOb0ZpZWxkJyxcbiAgICB0aXRsZTogJ1llcy9ObyBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVGaWVsZCcsXG4gICAgdGl0bGU6ICdEYXRlIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ1RpbWUgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgdGltZSBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVQYXJ0c0ZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgcGFydHMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZVBhcnRzRmllbGQnLFxuICAgIHRpdGxlOiAnRGF0ZSB0aW1lIHBhcnRzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnU2VsZWN0RmllbGQnLFxuICAgIHRpdGxlOiAnU2VsZWN0IGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUmFkaW9zRmllbGQnLFxuICAgIHRpdGxlOiAnUmFkaW9zIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQ2hlY2tib3hlc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0NoZWNrYm94ZXMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdOdW1iZXJGaWVsZCcsXG4gICAgdGl0bGU6ICdOdW1iZXIgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdVa0FkZHJlc3NGaWVsZCcsXG4gICAgdGl0bGU6ICdVayBhZGRyZXNzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGVsZXBob25lTnVtYmVyRmllbGQnLFxuICAgIHRpdGxlOiAnVGVsZXBob25lIG51bWJlciBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0VtYWlsQWRkcmVzc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0VtYWlsIGFkZHJlc3MgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdQYXJhJyxcbiAgICB0aXRsZTogJ1BhcmFncmFwaCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnSHRtbCcsXG4gICAgdGl0bGU6ICdIdG1sJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdJbnNldFRleHQnLFxuICAgIHRpdGxlOiAnSW5zZXQgdGV4dCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnRGV0YWlscycsXG4gICAgdGl0bGU6ICdEZXRhaWxzJyxcbiAgICBzdWJUeXBlOiAnY29udGVudCdcbiAgfVxuXVxuXG5leHBvcnQgZGVmYXVsdCBjb21wb25lbnRUeXBlc1xuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuXG5mdW5jdGlvbiBDbGFzc2VzIChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5jbGFzc2VzJz5DbGFzc2VzPC9sYWJlbD5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+QWRkaXRpb25hbCBDU1MgY2xhc3NlcyB0byBhZGQgdG8gdGhlIGZpZWxkPGJyIC8+XG4gICAgICBFLmcuIGdvdnVrLWlucHV0LS13aWR0aC0yLCBnb3Z1ay1pbnB1dC0td2lkdGgtNCwgZ292dWstaW5wdXQtLXdpZHRoLTEwLCBnb3Z1ay0hLXdpZHRoLW9uZS1oYWxmLCBnb3Z1ay0hLXdpZHRoLXR3by10aGlyZHMsIGdvdnVrLSEtd2lkdGgtdGhyZWUtcXVhcnRlcnM8L3NwYW4+XG4gICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2ZpZWxkLW9wdGlvbnMuY2xhc3NlcycgbmFtZT0nb3B0aW9ucy5jbGFzc2VzJyB0eXBlPSd0ZXh0J1xuICAgICAgICBkZWZhdWx0VmFsdWU9e29wdGlvbnMuY2xhc3Nlc30gLz5cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5mdW5jdGlvbiBGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTIwJyBpZD0nZmllbGQtbmFtZSdcbiAgICAgICAgICBuYW1lPSduYW1lJyB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5uYW1lfSByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKycgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2ZpZWxkLXRpdGxlJyBuYW1lPSd0aXRsZScgdHlwZT0ndGV4dCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1oaW50Jz5IaW50IChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2ZpZWxkLWhpbnQnIG5hbWU9J2hpbnQnIHR5cGU9J3RleHQnXG4gICAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQuaGludH0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlcyBnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2l0ZW0nPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2lucHV0JyBpZD0nZmllbGQtb3B0aW9ucy5yZXF1aXJlZCdcbiAgICAgICAgICAgIG5hbWU9J29wdGlvbnMucmVxdWlyZWQnIHR5cGU9J2NoZWNrYm94JyBkZWZhdWx0Q2hlY2tlZD17b3B0aW9ucy5yZXF1aXJlZCA9PT0gZmFsc2V9IC8+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstY2hlY2tib3hlc19fbGFiZWwnXG4gICAgICAgICAgICBodG1sRm9yPSdmaWVsZC1vcHRpb25zLnJlcXVpcmVkJz5PcHRpb25hbDwvbGFiZWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICA8L2Rpdj5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZXh0RmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgc2NoZW1hID0gY29tcG9uZW50LnNjaGVtYSB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGV0YWlscyBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHMnPlxuICAgICAgICA8c3VtbWFyeSBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnknPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeS10ZXh0Jz5tb3JlPC9zcGFuPlxuICAgICAgICA8L3N1bW1hcnk+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWF4Jz5NYXggbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWF4aW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1heCcgbmFtZT0nc2NoZW1hLm1heCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1heH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5taW4nPk1pbiBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtaW5pbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWluJyBuYW1lPSdzY2hlbWEubWluJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWlufSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLmxlbmd0aCc+TGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgZXhhY3QgdGV4dCBsZW5ndGg8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5sZW5ndGgnIG5hbWU9J3NjaGVtYS5sZW5ndGgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5sZW5ndGh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2RldGFpbHM+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gTXVsdGlsaW5lVGV4dEZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IHNjaGVtYSA9IGNvbXBvbmVudC5zY2hlbWEgfHwge31cbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkZXRhaWxzIGNsYXNzTmFtZT0nZ292dWstZGV0YWlscyc+XG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeSc+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5LXRleHQnPm1vcmU8L3NwYW4+XG4gICAgICAgIDwvc3VtbWFyeT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5tYXgnPk1heCBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtYXhpbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWF4JyBuYW1lPSdzY2hlbWEubWF4J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWF4fSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1pbic+TWluIGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1pbmltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5taW4nIG5hbWU9J3NjaGVtYS5taW4nXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5taW59IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1vcHRpb25zLnJvd3MnPlJvd3M8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBpZD0nZmllbGQtb3B0aW9ucy5yb3dzJyBuYW1lPSdvcHRpb25zLnJvd3MnIHR5cGU9J3RleHQnXG4gICAgICAgICAgICBkYXRhLWNhc3Q9J251bWJlcicgZGVmYXVsdFZhbHVlPXtvcHRpb25zLnJvd3N9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kZXRhaWxzPlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIE51bWJlckZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IHNjaGVtYSA9IGNvbXBvbmVudC5zY2hlbWEgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRldGFpbHMgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzJz5cbiAgICAgICAgPHN1bW1hcnkgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5Jz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnktdGV4dCc+bW9yZTwvc3Bhbj5cbiAgICAgICAgPC9zdW1tYXJ5PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1pbic+TWluPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWluaW11bSB2YWx1ZTwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1pbicgbmFtZT0nc2NoZW1hLm1pbidcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1pbn0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5tYXgnPk1heDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1heGltdW0gdmFsdWU8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5tYXgnIG5hbWU9J3NjaGVtYS5tYXgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5tYXh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXMgZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2l0ZW0nPlxuICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faW5wdXQnIGlkPSdmaWVsZC1zY2hlbWEuaW50ZWdlcicgZGF0YS1jYXN0PSdib29sZWFuJ1xuICAgICAgICAgICAgICBuYW1lPSdzY2hlbWEuaW50ZWdlcicgdHlwZT0nY2hlY2tib3gnIGRlZmF1bHRDaGVja2VkPXtzY2hlbWEuaW50ZWdlciA9PT0gdHJ1ZX0gLz5cbiAgICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWNoZWNrYm94ZXNfX2xhYmVsJ1xuICAgICAgICAgICAgICBodG1sRm9yPSdmaWVsZC1zY2hlbWEuaW50ZWdlcic+SW50ZWdlcjwvbGFiZWw+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kZXRhaWxzPlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIFNlbGVjdEZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQsIGRhdGEgfSA9IHByb3BzXG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuICBjb25zdCBsaXN0cyA9IGRhdGEubGlzdHNcblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmxpc3QnPkxpc3Q8L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QgZ292dWstaW5wdXQtLXdpZHRoLTEwJyBpZD0nZmllbGQtb3B0aW9ucy5saXN0JyBuYW1lPSdvcHRpb25zLmxpc3QnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e29wdGlvbnMubGlzdH0gcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7bGlzdHMubWFwKGxpc3QgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e2xpc3QubmFtZX0gdmFsdWU9e2xpc3QubmFtZX0+e2xpc3QudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICB9KX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPENsYXNzZXMgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICA8L2Rpdj5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBSYWRpb3NGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faXRlbSc+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlc19faW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmJvbGQnIGRhdGEtY2FzdD0nYm9vbGVhbidcbiAgICAgICAgICAgIG5hbWU9J29wdGlvbnMuYm9sZCcgdHlwZT0nY2hlY2tib3gnIGRlZmF1bHRDaGVja2VkPXtvcHRpb25zLmJvbGQgPT09IHRydWV9IC8+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstY2hlY2tib3hlc19fbGFiZWwnXG4gICAgICAgICAgICBodG1sRm9yPSdmaWVsZC1vcHRpb25zLmJvbGQnPkJvbGQgbGFiZWxzPC9sYWJlbD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBDaGVja2JveGVzRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG4gIGNvbnN0IGxpc3RzID0gZGF0YS5saXN0c1xuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMubGlzdCc+TGlzdDwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCBnb3Z1ay1pbnB1dC0td2lkdGgtMTAnIGlkPSdmaWVsZC1vcHRpb25zLmxpc3QnIG5hbWU9J29wdGlvbnMubGlzdCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5saXN0fSByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtsaXN0cy5tYXAobGlzdCA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiA8b3B0aW9uIGtleT17bGlzdC5uYW1lfSB2YWx1ZT17bGlzdC5uYW1lfT57bGlzdC50aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstY2hlY2tib3hlcyBnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2l0ZW0nPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2lucHV0JyBpZD0nZmllbGQtb3B0aW9ucy5ib2xkJyBkYXRhLWNhc3Q9J2Jvb2xlYW4nXG4gICAgICAgICAgICBuYW1lPSdvcHRpb25zLmJvbGQnIHR5cGU9J2NoZWNrYm94JyBkZWZhdWx0Q2hlY2tlZD17b3B0aW9ucy5ib2xkID09PSB0cnVlfSAvPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWNoZWNrYm94ZXNfX2xhYmVsJ1xuICAgICAgICAgICAgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5ib2xkJz5Cb2xkIGxhYmVsczwvbGFiZWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gUGFyYUVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J3BhcmEtY29udGVudCc+Q29udGVudDwvbGFiZWw+XG4gICAgICA8dGV4dGFyZWEgY2xhc3NOYW1lPSdnb3Z1ay10ZXh0YXJlYScgaWQ9J3BhcmEtY29udGVudCcgbmFtZT0nY29udGVudCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQuY29udGVudH0gcm93cz0nMTAnIHJlcXVpcmVkIC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuY29uc3QgSW5zZXRUZXh0RWRpdCA9IFBhcmFFZGl0XG5jb25zdCBIdG1sRWRpdCA9IFBhcmFFZGl0XG5cbmZ1bmN0aW9uIERldGFpbHNFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J2RldGFpbHMtdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdkZXRhaWxzLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsJyBodG1sRm9yPSdkZXRhaWxzLWNvbnRlbnQnPkNvbnRlbnQ8L2xhYmVsPlxuICAgICAgICA8dGV4dGFyZWEgY2xhc3NOYW1lPSdnb3Z1ay10ZXh0YXJlYScgaWQ9J2RldGFpbHMtY29udGVudCcgbmFtZT0nY29udGVudCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5jb250ZW50fSByb3dzPScxMCcgcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmNvbnN0IGNvbXBvbmVudFR5cGVFZGl0b3JzID0ge1xuICAnVGV4dEZpZWxkRWRpdCc6IFRleHRGaWVsZEVkaXQsXG4gICdFbWFpbEFkZHJlc3NGaWVsZEVkaXQnOiBUZXh0RmllbGRFZGl0LFxuICAnVGVsZXBob25lTnVtYmVyRmllbGRFZGl0JzogVGV4dEZpZWxkRWRpdCxcbiAgJ051bWJlckZpZWxkRWRpdCc6IE51bWJlckZpZWxkRWRpdCxcbiAgJ011bHRpbGluZVRleHRGaWVsZEVkaXQnOiBNdWx0aWxpbmVUZXh0RmllbGRFZGl0LFxuICAnU2VsZWN0RmllbGRFZGl0JzogU2VsZWN0RmllbGRFZGl0LFxuICAnUmFkaW9zRmllbGRFZGl0JzogUmFkaW9zRmllbGRFZGl0LFxuICAnQ2hlY2tib3hlc0ZpZWxkRWRpdCc6IENoZWNrYm94ZXNGaWVsZEVkaXQsXG4gICdQYXJhRWRpdCc6IFBhcmFFZGl0LFxuICAnSHRtbEVkaXQnOiBIdG1sRWRpdCxcbiAgJ0luc2V0VGV4dEVkaXQnOiBJbnNldFRleHRFZGl0LFxuICAnRGV0YWlsc0VkaXQnOiBEZXRhaWxzRWRpdFxufVxuXG5jbGFzcyBDb21wb25lbnRUeXBlRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBjb21wb25lbnQsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IHR5cGUgPSBjb21wb25lbnRUeXBlcy5maW5kKHQgPT4gdC5uYW1lID09PSBjb21wb25lbnQudHlwZSlcbiAgICBpZiAoIXR5cGUpIHtcbiAgICAgIHJldHVybiAnJ1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBUYWdOYW1lID0gY29tcG9uZW50VHlwZUVkaXRvcnNbYCR7Y29tcG9uZW50LnR5cGV9RWRpdGBdIHx8IEZpZWxkRWRpdFxuICAgICAgcmV0dXJuIDxUYWdOYW1lIGNvbXBvbmVudD17Y29tcG9uZW50fSBkYXRhPXtkYXRhfSAvPlxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnRUeXBlRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSwgZ2V0Rm9ybURhdGEgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgQ29tcG9uZW50VHlwZUVkaXQgZnJvbSAnLi9jb21wb25lbnQtdHlwZS1lZGl0J1xuXG5jbGFzcyBDb21wb25lbnRFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhLCBwYWdlLCBjb21wb25lbnQgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBmb3JtRGF0YSA9IGdldEZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcblxuICAgIC8vIEFwcGx5XG4gICAgY29uc3QgY29tcG9uZW50SW5kZXggPSBwYWdlLmNvbXBvbmVudHMuaW5kZXhPZihjb21wb25lbnQpXG4gICAgY29weVBhZ2UuY29tcG9uZW50c1tjb21wb25lbnRJbmRleF0gPSBmb3JtRGF0YVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSwgY29tcG9uZW50IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29tcG9uZW50SWR4ID0gcGFnZS5jb21wb25lbnRzLmZpbmRJbmRleChjID0+IGMgPT09IGNvbXBvbmVudClcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG4gICAgY29uc3QgaXNMYXN0ID0gY29tcG9uZW50SWR4ID09PSBwYWdlLmNvbXBvbmVudHMubGVuZ3RoIC0gMVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBjb21wb25lbnRcbiAgICBjb3B5UGFnZS5jb21wb25lbnRzLnNwbGljZShjb21wb25lbnRJZHgsIDEpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICBpZiAoIWlzTGFzdCkge1xuICAgICAgICAgIC8vIFdlIGRvbnQgaGF2ZSBhbiBpZCB3ZSBjYW4gdXNlIGZvciBga2V5YC1pbmcgcmVhY3QgPENvbXBvbmVudCAvPidzXG4gICAgICAgICAgLy8gV2UgdGhlcmVmb3JlIG5lZWQgdG8gY29uZGl0aW9uYWxseSByZXBvcnQgYG9uRWRpdGAgY2hhbmdlcy5cbiAgICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgcGFnZSwgY29tcG9uZW50LCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5Q29tcCA9IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoY29tcG9uZW50KSlcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8Zm9ybSBhdXRvQ29tcGxldGU9J29mZicgb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0ndHlwZSc+VHlwZTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSc+e2NvbXBvbmVudC50eXBlfTwvc3Bhbj5cbiAgICAgICAgICAgIDxpbnB1dCBpZD0ndHlwZScgdHlwZT0naGlkZGVuJyBuYW1lPSd0eXBlJyBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50eXBlfSAvPlxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgPENvbXBvbmVudFR5cGVFZGl0XG4gICAgICAgICAgICBwYWdlPXtwYWdlfVxuICAgICAgICAgICAgY29tcG9uZW50PXtjb3B5Q29tcH1cbiAgICAgICAgICAgIGRhdGE9e2RhdGF9IC8+XG5cbiAgICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj57JyAnfVxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudEVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCBTb3J0YWJsZUhPQyAqL1xuXG5pbXBvcnQgRmx5b3V0IGZyb20gJy4vZmx5b3V0J1xuaW1wb3J0IENvbXBvbmVudEVkaXQgZnJvbSAnLi9jb21wb25lbnQtZWRpdCdcbmNvbnN0IFNvcnRhYmxlSGFuZGxlID0gU29ydGFibGVIT0MuU29ydGFibGVIYW5kbGVcbmNvbnN0IERyYWdIYW5kbGUgPSBTb3J0YWJsZUhhbmRsZSgoKSA9PiA8c3BhbiBjbGFzc05hbWU9J2RyYWctaGFuZGxlJz4mIzk3NzY7PC9zcGFuPilcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudFR5cGVzID0ge1xuICAnVGV4dEZpZWxkJzogVGV4dEZpZWxkLFxuICAnVGVsZXBob25lTnVtYmVyRmllbGQnOiBUZWxlcGhvbmVOdW1iZXJGaWVsZCxcbiAgJ051bWJlckZpZWxkJzogTnVtYmVyRmllbGQsXG4gICdFbWFpbEFkZHJlc3NGaWVsZCc6IEVtYWlsQWRkcmVzc0ZpZWxkLFxuICAnVGltZUZpZWxkJzogVGltZUZpZWxkLFxuICAnRGF0ZUZpZWxkJzogRGF0ZUZpZWxkLFxuICAnRGF0ZVRpbWVGaWVsZCc6IERhdGVUaW1lRmllbGQsXG4gICdEYXRlUGFydHNGaWVsZCc6IERhdGVQYXJ0c0ZpZWxkLFxuICAnRGF0ZVRpbWVQYXJ0c0ZpZWxkJzogRGF0ZVRpbWVQYXJ0c0ZpZWxkLFxuICAnTXVsdGlsaW5lVGV4dEZpZWxkJzogTXVsdGlsaW5lVGV4dEZpZWxkLFxuICAnUmFkaW9zRmllbGQnOiBSYWRpb3NGaWVsZCxcbiAgJ0NoZWNrYm94ZXNGaWVsZCc6IENoZWNrYm94ZXNGaWVsZCxcbiAgJ1NlbGVjdEZpZWxkJzogU2VsZWN0RmllbGQsXG4gICdZZXNOb0ZpZWxkJzogWWVzTm9GaWVsZCxcbiAgJ1VrQWRkcmVzc0ZpZWxkJzogVWtBZGRyZXNzRmllbGQsXG4gICdQYXJhJzogUGFyYSxcbiAgJ0h0bWwnOiBIdG1sLFxuICAnSW5zZXRUZXh0JzogSW5zZXRUZXh0LFxuICAnRGV0YWlscyc6IERldGFpbHNcbn1cblxuZnVuY3Rpb24gQmFzZSAocHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvZGl2PlxuICApXG59XG5cbmZ1bmN0aW9uIENvbXBvbmVudEZpZWxkIChwcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZXh0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3gnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZWxlcGhvbmVOdW1iZXJGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCB0ZWwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBFbWFpbEFkZHJlc3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBlbWFpbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFVrQWRkcmVzc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCcgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYnV0dG9uIHNxdWFyZScgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIE11bHRpbGluZVRleHRGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggdGFsbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIE51bWJlckZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94IG51bWJlcicgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBkcm9wZG93bic+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+ZGQvbW0veXl5eTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVRpbWVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBsYXJnZSBkcm9wZG93bic+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+ZGQvbW0veXl5eSBoaDptbTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gVGltZUZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94Jz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5IGdvdnVrLSEtZm9udC1zaXplLTE0Jz5oaDptbTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVRpbWVQYXJ0c0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCcgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsIGdvdnVrLSEtbWFyZ2luLWxlZnQtMSBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggbWVkaXVtIGdvdnVrLSEtbWFyZ2luLXJpZ2h0LTEnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEYXRlUGFydHNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1sZWZ0LTEgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IG1lZGl1bScgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFJhZGlvc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaGVjaycgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NoZWNrJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2hlY2snIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBkcm9wZG93bicgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFllc05vRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGV0YWlscyAoKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICB7YOKWtiBgfTxzcGFuIGNsYXNzTmFtZT0nbGluZSBkZXRhaWxzJyAvPlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBJbnNldFRleHQgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2luc2V0IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTInPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUgc2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTIgZ292dWstIS1tYXJnaW4tdG9wLTInIC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9CYXNlPlxuICApXG59XG5cbmZ1bmN0aW9uIFBhcmEgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUnIC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZSBzaG9ydCBnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMiBnb3Z1ay0hLW1hcmdpbi10b3AtMicgLz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBIdG1sICgpIHtcbiAgcmV0dXJuIChcbiAgICA8QmFzZT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdodG1sJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHhzaG9ydCBnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSBnb3Z1ay0hLW1hcmdpbi10b3AtMScgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIHNob3dFZGl0b3IgPSAoZSwgdmFsdWUpID0+IHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IHZhbHVlIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSwgY29tcG9uZW50IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgVGFnTmFtZSA9IGNvbXBvbmVudFR5cGVzW2Ake2NvbXBvbmVudC50eXBlfWBdXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudCBnb3Z1ay0hLXBhZGRpbmctMidcbiAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gdGhpcy5zaG93RWRpdG9yKGUsIHRydWUpfT5cbiAgICAgICAgICA8RHJhZ0hhbmRsZSAvPlxuICAgICAgICAgIDxUYWdOYW1lIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IENvbXBvbmVudCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfVxuICAgICAgICAgIG9uSGlkZT17ZSA9PiB0aGlzLnNob3dFZGl0b3IoZSwgZmFsc2UpfT5cbiAgICAgICAgICA8Q29tcG9uZW50RWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0gcGFnZT17cGFnZX0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lLCBnZXRGb3JtRGF0YSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBDb21wb25lbnRUeXBlRWRpdCBmcm9tICcuL2NvbXBvbmVudC10eXBlLWVkaXQnXG4vLyBpbXBvcnQgeyBjb21wb25lbnRUeXBlcyBhcyBjb21wb25lbnRUeXBlc0ljb25zIH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuXG5jbGFzcyBDb21wb25lbnRDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBmb3JtRGF0YSA9IGdldEZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcblxuICAgIC8vIEFwcGx5XG4gICAgY29weVBhZ2UuY29tcG9uZW50cy5wdXNoKGZvcm1EYXRhKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3R5cGUnPlR5cGU8L2xhYmVsPlxuICAgICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J3R5cGUnIG5hbWU9J3R5cGUnIHJlcXVpcmVkXG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBjb21wb25lbnQ6IHsgdHlwZTogZS50YXJnZXQudmFsdWUgfSB9KX0+XG4gICAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgICAge2NvbXBvbmVudFR5cGVzLm1hcCh0eXBlID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e3R5cGUubmFtZX0gdmFsdWU9e3R5cGUubmFtZX0+e3R5cGUudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICB7Lyoge09iamVjdC5rZXlzKGNvbXBvbmVudFR5cGVzSWNvbnMpLm1hcCh0eXBlID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgVGFnID0gY29tcG9uZW50VHlwZXNJY29uc1t0eXBlXVxuICAgICAgICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudCBnb3Z1ay0hLXBhZGRpbmctMic+PFRhZyAvPjwvZGl2PlxuICAgICAgICAgICAgfSl9ICovfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAge3RoaXMuc3RhdGUuY29tcG9uZW50ICYmIHRoaXMuc3RhdGUuY29tcG9uZW50LnR5cGUgJiYgKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPENvbXBvbmVudFR5cGVFZGl0XG4gICAgICAgICAgICAgICAgcGFnZT17cGFnZX1cbiAgICAgICAgICAgICAgICBjb21wb25lbnQ9e3RoaXMuc3RhdGUuY29tcG9uZW50fVxuICAgICAgICAgICAgICAgIGRhdGE9e2RhdGF9IC8+XG5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPSdzdWJtaXQnIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJz5TYXZlPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnRDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCBTb3J0YWJsZUhPQyAqL1xuXG5pbXBvcnQgRmx5b3V0IGZyb20gJy4vZmx5b3V0J1xuaW1wb3J0IFBhZ2VFZGl0IGZyb20gJy4vcGFnZS1lZGl0J1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgQ29tcG9uZW50Q3JlYXRlIGZyb20gJy4vY29tcG9uZW50LWNyZWF0ZSdcbmltcG9ydCBjb21wb25lbnRUeXBlcyBmcm9tICcuLi9jb21wb25lbnQtdHlwZXMuanMnXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY29uc3QgU29ydGFibGVFbGVtZW50ID0gU29ydGFibGVIT0MuU29ydGFibGVFbGVtZW50XG5jb25zdCBTb3J0YWJsZUNvbnRhaW5lciA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlQ29udGFpbmVyXG5jb25zdCBhcnJheU1vdmUgPSBTb3J0YWJsZUhPQy5hcnJheU1vdmVcblxuY29uc3QgU29ydGFibGVJdGVtID0gU29ydGFibGVFbGVtZW50KCh7IGluZGV4LCBwYWdlLCBjb21wb25lbnQsIGRhdGEgfSkgPT5cbiAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudC1pdGVtJz5cbiAgICA8Q29tcG9uZW50IGtleT17aW5kZXh9IHBhZ2U9e3BhZ2V9IGNvbXBvbmVudD17Y29tcG9uZW50fSBkYXRhPXtkYXRhfSAvPlxuICA8L2Rpdj5cbilcblxuY29uc3QgU29ydGFibGVMaXN0ID0gU29ydGFibGVDb250YWluZXIoKHsgcGFnZSwgZGF0YSB9KSA9PiB7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudC1saXN0Jz5cbiAgICAgIHtwYWdlLmNvbXBvbmVudHMubWFwKChjb21wb25lbnQsIGluZGV4KSA9PiAoXG4gICAgICAgIDxTb3J0YWJsZUl0ZW0ga2V5PXtpbmRleH0gaW5kZXg9e2luZGV4fSBwYWdlPXtwYWdlfSBjb21wb25lbnQ9e2NvbXBvbmVudH0gZGF0YT17ZGF0YX0gLz5cbiAgICAgICkpfVxuICAgIDwvZGl2PlxuICApXG59KVxuXG5jbGFzcyBQYWdlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIHNob3dFZGl0b3IgPSAoZSwgdmFsdWUpID0+IHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IHZhbHVlIH0pXG4gIH1cblxuICBvblNvcnRFbmQgPSAoeyBvbGRJbmRleCwgbmV3SW5kZXggfSkgPT4ge1xuICAgIGNvbnN0IHsgcGFnZSwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG4gICAgY29weVBhZ2UuY29tcG9uZW50cyA9IGFycmF5TW92ZShjb3B5UGFnZS5jb21wb25lbnRzLCBvbGRJbmRleCwgbmV3SW5kZXgpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcblxuICAgIC8vIE9QVElNSVNUSUMgU0FWRSBUTyBTVE9QIEpVTVBcblxuICAgIC8vIGNvbnN0IHsgcGFnZSwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIC8vIHBhZ2UuY29tcG9uZW50cyA9IGFycmF5TW92ZShwYWdlLmNvbXBvbmVudHMsIG9sZEluZGV4LCBuZXdJbmRleClcblxuICAgIC8vIGRhdGEuc2F2ZShkYXRhKVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHNlY3Rpb25zIH0gPSBkYXRhXG4gICAgY29uc3QgZm9ybUNvbXBvbmVudHMgPSBwYWdlLmNvbXBvbmVudHMuZmlsdGVyKGNvbXAgPT4gY29tcG9uZW50VHlwZXMuZmluZCh0eXBlID0+IHR5cGUubmFtZSA9PT0gY29tcC50eXBlKS5zdWJUeXBlID09PSAnZmllbGQnKVxuICAgIGNvbnN0IHBhZ2VUaXRsZSA9IHBhZ2UudGl0bGUgfHwgKGZvcm1Db21wb25lbnRzLmxlbmd0aCA9PT0gMSAmJiBwYWdlLmNvbXBvbmVudHNbMF0gPT09IGZvcm1Db21wb25lbnRzWzBdID8gZm9ybUNvbXBvbmVudHNbMF0udGl0bGUgOiBwYWdlLnRpdGxlKVxuICAgIGNvbnN0IHNlY3Rpb24gPSBwYWdlLnNlY3Rpb24gJiYgc2VjdGlvbnMuZmluZChzZWN0aW9uID0+IHNlY3Rpb24ubmFtZSA9PT0gcGFnZS5zZWN0aW9uKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9e3BhZ2UucGF0aH0gY2xhc3NOYW1lPSdwYWdlIHh0b29sdGlwJyB0aXRsZT17cGFnZS5wYXRofSBzdHlsZT17dGhpcy5wcm9wcy5sYXlvdXR9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0naGFuZGxlJyBvbkNsaWNrPXsoZSkgPT4gdGhpcy5zaG93RWRpdG9yKGUsIHRydWUpfSAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1wYWRkaW5nLXRvcC0yIGdvdnVrLSEtcGFkZGluZy1sZWZ0LTIgZ292dWstIS1wYWRkaW5nLXJpZ2h0LTInPlxuXG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT0nZ292dWstaGVhZGluZy1zJz5cbiAgICAgICAgICAgIHtzZWN0aW9uICYmIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstY2FwdGlvbi1tIGdvdnVrLSEtZm9udC1zaXplLTE0Jz57c2VjdGlvbi50aXRsZX08L3NwYW4+fVxuICAgICAgICAgICAge3BhZ2VUaXRsZX1cbiAgICAgICAgICA8L2gzPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8U29ydGFibGVMaXN0IHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9IHByZXNzRGVsYXk9ezIwMH1cbiAgICAgICAgICBvblNvcnRFbmQ9e3RoaXMub25Tb3J0RW5kfSBsb2NrQXhpcz0neScgaGVscGVyQ2xhc3M9J2RyYWdnaW5nJ1xuICAgICAgICAgIGxvY2tUb0NvbnRhaW5lckVkZ2VzIHVzZURyYWdIYW5kbGUgLz5cbiAgICAgICAgey8qIHtwYWdlLmNvbXBvbmVudHMubWFwKChjb21wLCBpbmRleCkgPT4gKFxuICAgICAgICAgIDxDb21wb25lbnQga2V5PXtpbmRleH0gcGFnZT17cGFnZX0gY29tcG9uZW50PXtjb21wfSBkYXRhPXtkYXRhfSAvPlxuICAgICAgICApKX0gKi99XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtcGFkZGluZy0yJz5cbiAgICAgICAgICA8YSBjbGFzc05hbWU9J3ByZXZpZXcgcHVsbC1yaWdodCBnb3Z1ay1ib2R5IGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgICAgaHJlZj17cGFnZS5wYXRofSB0YXJnZXQ9J3ByZXZpZXcnPk9wZW48L2E+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2J1dHRvbiBhY3RpdmUnXG4gICAgICAgICAgICBvbkNsaWNrPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkQ29tcG9uZW50OiB0cnVlIH0pfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IFBhZ2UnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zaG93RWRpdG9yKGUsIGZhbHNlKX0+XG4gICAgICAgICAgPFBhZ2VFZGl0IHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdBZGQgQ29tcG9uZW50JyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRDb21wb25lbnR9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogZmFsc2UgfSl9PlxuICAgICAgICAgIDxDb21wb25lbnRDcmVhdGUgcGFnZT17cGFnZX0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uQ3JlYXRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkQ29tcG9uZW50OiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGFnZVxuIiwiY29uc3QgbGlzdFR5cGVzID0gWydTZWxlY3RGaWVsZCcsICdSYWRpb3NGaWVsZCcsICdDaGVja2JveGVzRmllbGQnXVxuXG5mdW5jdGlvbiBjb21wb25lbnRUb1N0cmluZyAoY29tcG9uZW50KSB7XG4gIGlmICh+bGlzdFR5cGVzLmluZGV4T2YoY29tcG9uZW50LnR5cGUpKSB7XG4gICAgcmV0dXJuIGAke2NvbXBvbmVudC50eXBlfTwke2NvbXBvbmVudC5vcHRpb25zLmxpc3R9PmBcbiAgfVxuICByZXR1cm4gYCR7Y29tcG9uZW50LnR5cGV9YFxufVxuXG5mdW5jdGlvbiBEYXRhTW9kZWwgKHByb3BzKSB7XG4gIGNvbnN0IHsgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3QgeyBzZWN0aW9ucywgcGFnZXMgfSA9IGRhdGFcblxuICBjb25zdCBtb2RlbCA9IHt9XG5cbiAgcGFnZXMuZm9yRWFjaChwYWdlID0+IHtcbiAgICBwYWdlLmNvbXBvbmVudHMuZm9yRWFjaChjb21wb25lbnQgPT4ge1xuICAgICAgaWYgKGNvbXBvbmVudC5uYW1lKSB7XG4gICAgICAgIGlmIChwYWdlLnNlY3Rpb24pIHtcbiAgICAgICAgICBjb25zdCBzZWN0aW9uID0gc2VjdGlvbnMuZmluZChzZWN0aW9uID0+IHNlY3Rpb24ubmFtZSA9PT0gcGFnZS5zZWN0aW9uKVxuICAgICAgICAgIGlmICghbW9kZWxbc2VjdGlvbi5uYW1lXSkge1xuICAgICAgICAgICAgbW9kZWxbc2VjdGlvbi5uYW1lXSA9IHt9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbW9kZWxbc2VjdGlvbi5uYW1lXVtjb21wb25lbnQubmFtZV0gPSBjb21wb25lbnRUb1N0cmluZyhjb21wb25lbnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kZWxbY29tcG9uZW50Lm5hbWVdID0gY29tcG9uZW50VG9TdHJpbmcoY29tcG9uZW50KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG4gICAgICA8cHJlPntKU09OLnN0cmluZ2lmeShtb2RlbCwgbnVsbCwgMil9PC9wcmU+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZXhwb3J0IGRlZmF1bHQgRGF0YU1vZGVsXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlQ3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgcGF0aCA9IGZvcm1EYXRhLmdldCgncGF0aCcpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgLy8gVmFsaWRhdGVcbiAgICBpZiAoZGF0YS5wYWdlcy5maW5kKHBhZ2UgPT4gcGFnZS5wYXRoID09PSBwYXRoKSkge1xuICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke3BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlID0ge1xuICAgICAgcGF0aDogcGF0aFxuICAgIH1cblxuICAgIGNvbnN0IHRpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IHNlY3Rpb24gPSBmb3JtRGF0YS5nZXQoJ3NlY3Rpb24nKS50cmltKClcblxuICAgIGlmICh0aXRsZSkge1xuICAgICAgdmFsdWUudGl0bGUgPSB0aXRsZVxuICAgIH1cbiAgICBpZiAoc2VjdGlvbikge1xuICAgICAgdmFsdWUuc2VjdGlvbiA9IHNlY3Rpb25cbiAgICB9XG5cbiAgICAvLyBBcHBseVxuICAgIE9iamVjdC5hc3NpZ24odmFsdWUsIHtcbiAgICAgIGNvbXBvbmVudHM6IFtdLFxuICAgICAgbmV4dDogW11cbiAgICB9KVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICBjb3B5LnBhZ2VzLnB1c2godmFsdWUpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlKHsgdmFsdWUgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgLy8gb25CbHVyTmFtZSA9IGUgPT4ge1xuICAvLyAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgLy8gICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgLy8gICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgLy8gICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgLy8gICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAvLyAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgLy8gICB9IGVsc2Uge1xuICAvLyAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gIC8vICAgfVxuICAvLyB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHNlY3Rpb25zIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZFxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gZS50YXJnZXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtdGl0bGUnPlRpdGxlIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdwYWdlLXRpdGxlLWhpbnQnIGNsYXNzTmFtZT0nZ292dWstaGludCc+XG4gICAgICAgICAgICBJZiBub3Qgc3VwcGxpZWQsIHRoZSB0aXRsZSBvZiB0aGUgZmlyc3QgcXVlc3Rpb24gd2lsbCBiZSB1c2VkLlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3BhZ2UtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJz5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoc2VjdGlvbiA9PiAoPG9wdGlvbiBrZXk9e3NlY3Rpb24ubmFtZX0gdmFsdWU9e3NlY3Rpb24ubmFtZX0+e3NlY3Rpb24udGl0bGV9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gdHlwZT0nc3VibWl0JyBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbic+U2F2ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBMaW5rRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgY29uc3QgeyBkYXRhLCBlZGdlIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgcGFnZSA9IGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gZWRnZS5zb3VyY2UpXG4gICAgY29uc3QgbGluayA9IHBhZ2UubmV4dC5maW5kKG4gPT4gbi5wYXRoID09PSBlZGdlLnRhcmdldClcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBwYWdlOiBwYWdlLFxuICAgICAgbGluazogbGlua1xuICAgIH1cbiAgfVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGluayA9IGNvcHlQYWdlLm5leHQuZmluZChuID0+IG4ucGF0aCA9PT0gbGluay5wYXRoKVxuXG4gICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgY29weUxpbmsuaWYgPSBjb25kaXRpb25cbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlMaW5rLmlmXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGlua0lkeCA9IGNvcHlQYWdlLm5leHQuZmluZEluZGV4KG4gPT4gbi5wYXRoID09PSBsaW5rLnBhdGgpXG4gICAgY29weVBhZ2UubmV4dC5zcGxpY2UoY29weUxpbmtJZHgsIDEpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxpbmsgfSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGRhdGEsIGVkZ2UgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHBhZ2VzIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstc291cmNlJz5Gcm9tPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGRlZmF1bHRWYWx1ZT17ZWRnZS5zb3VyY2V9IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGluay1zb3VyY2UnIGRpc2FibGVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3BhZ2VzLm1hcChwYWdlID0+ICg8b3B0aW9uIGtleT17cGFnZS5wYXRofSB2YWx1ZT17cGFnZS5wYXRofT57cGFnZS5wYXRofTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstdGFyZ2V0Jz5UbzwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBkZWZhdWx0VmFsdWU9e2VkZ2UudGFyZ2V0fSBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstdGFyZ2V0JyBkaXNhYmxlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLWNvbmRpdGlvbic+Q29uZGl0aW9uIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdsaW5rLWNvbmRpdGlvbi1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgVGhlIGxpbmsgd2lsbCBvbmx5IGJlIHVzZWQgaWYgdGhlIGV4cHJlc3Npb24gZXZhbHVhdGVzIHRvIHRydXRoeS5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaW5rLWNvbmRpdGlvbicgbmFtZT0naWYnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpbmsuaWZ9IGFyaWEtZGVzY3JpYmVkYnk9J2xpbmstY29uZGl0aW9uLWhpbnQnIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlua0VkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIExpbmtDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBmcm9tID0gZm9ybURhdGEuZ2V0KCdwYXRoJylcbiAgICBjb25zdCB0byA9IGZvcm1EYXRhLmdldCgncGFnZScpXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IHBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IGZyb20pXG5cbiAgICBjb25zdCBuZXh0ID0geyBwYXRoOiB0byB9XG5cbiAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICBuZXh0LmlmID0gY29uZGl0aW9uXG4gICAgfVxuXG4gICAgaWYgKCFwYWdlLm5leHQpIHtcbiAgICAgIHBhZ2UubmV4dCA9IFtdXG4gICAgfVxuXG4gICAgcGFnZS5uZXh0LnB1c2gobmV4dClcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBuZXh0IH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXNvdXJjZSc+RnJvbTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstc291cmNlJyBuYW1lPSdwYXRoJyByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXRhcmdldCc+VG88L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaW5rLXRhcmdldCcgbmFtZT0ncGFnZScgcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7cGFnZXMubWFwKHBhZ2UgPT4gKDxvcHRpb24ga2V5PXtwYWdlLnBhdGh9IHZhbHVlPXtwYWdlLnBhdGh9PntwYWdlLnBhdGh9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay1jb25kaXRpb24nPkNvbmRpdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0nbGluay1jb25kaXRpb24taGludCcgY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5cbiAgICAgICAgICAgIFRoZSBsaW5rIHdpbGwgb25seSBiZSB1c2VkIGlmIHRoZSBleHByZXNzaW9uIGV2YWx1YXRlcyB0byB0cnV0aHkuXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGluay1jb25kaXRpb24nIG5hbWU9J2lmJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0nbGluay1jb25kaXRpb24taGludCcgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpbmtDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmZ1bmN0aW9uIGhlYWREdXBsaWNhdGUgKGFycikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGFyci5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGFycltqXSA9PT0gYXJyW2ldKSB7XG4gICAgICAgIHJldHVybiBqXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIExpc3RJdGVtcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpdGVtczogcHJvcHMuaXRlbXMgPyBjbG9uZShwcm9wcy5pdGVtcykgOiBbXVxuICAgIH1cbiAgfVxuXG4gIG9uQ2xpY2tBZGRJdGVtID0gZSA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5jb25jYXQoeyB0ZXh0OiAnJywgdmFsdWU6ICcnLCBkZXNjcmlwdGlvbjogJycgfSlcbiAgICB9KVxuICB9XG5cbiAgcmVtb3ZlSXRlbSA9IGlkeCA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5maWx0ZXIoKHMsIGkpID0+IGkgIT09IGlkeClcbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIGxpc3RcbiAgICBjb3B5Lmxpc3RzLnNwbGljZShkYXRhLmxpc3RzLmluZGV4T2YobGlzdCksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIGxpc3RcbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAubGlzdFxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyID0gZSA9PiB7XG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0LmZvcm1cbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcblxuICAgIC8vIE9ubHkgdmFsaWRhdGUgZHVwZXMgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBpdGVtXG4gICAgaWYgKHRleHRzLmxlbmd0aCA8IDIpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGZvcm0uZWxlbWVudHMudGV4dC5mb3JFYWNoKGVsID0+IGVsLnNldEN1c3RvbVZhbGlkaXR5KCcnKSlcbiAgICBmb3JtLmVsZW1lbnRzLnZhbHVlLmZvckVhY2goZWwgPT4gZWwuc2V0Q3VzdG9tVmFsaWRpdHkoJycpKVxuXG4gICAgLy8gVmFsaWRhdGUgdW5pcXVlbmVzc1xuICAgIGNvbnN0IGR1cGVUZXh0ID0gaGVhZER1cGxpY2F0ZSh0ZXh0cylcbiAgICBpZiAoZHVwZVRleHQpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMudGV4dFtkdXBlVGV4dF0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB0ZXh0cyBmb3VuZCBpbiB0aGUgbGlzdCBpdGVtcycpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCBkdXBlVmFsdWUgPSBoZWFkRHVwbGljYXRlKHZhbHVlcylcbiAgICBpZiAoZHVwZVZhbHVlKSB7XG4gICAgICBmb3JtLmVsZW1lbnRzLnZhbHVlW2R1cGVWYWx1ZV0uc2V0Q3VzdG9tVmFsaWRpdHkoJ0R1cGxpY2F0ZSB2YWx1ZXMgZm91bmQgaW4gdGhlIGxpc3QgaXRlbXMnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBpdGVtcyB9ID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHsgdHlwZSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDx0YWJsZSBjbGFzc05hbWU9J2dvdnVrLXRhYmxlJz5cbiAgICAgICAgPGNhcHRpb24gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2FwdGlvbic+SXRlbXM8L2NhcHRpb24+XG4gICAgICAgIDx0aGVhZCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkJz5cbiAgICAgICAgICA8dHIgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93Jz5cbiAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkZXInIHNjb3BlPSdjb2wnPlRleHQ8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+VmFsdWU8L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+RGVzY3JpcHRpb248L3RoPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+XG4gICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17dGhpcy5vbkNsaWNrQWRkSXRlbX0+QWRkPC9hPlxuICAgICAgICAgICAgPC90aD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICA8L3RoZWFkPlxuICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fYm9keSc+XG4gICAgICAgICAge2l0ZW1zLm1hcCgoaXRlbSwgaW5kZXgpID0+IChcbiAgICAgICAgICAgIDx0ciBrZXk9e2l0ZW0udmFsdWUgKyBpbmRleH0gY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fcm93JyBzY29wZT0ncm93Jz5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnPlxuICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBuYW1lPSd0ZXh0J1xuICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnRleHR9IHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyfSAvPlxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAge3R5cGUgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICA/IChcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J3ZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9J251bWJlcicgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IHN0ZXA9J2FueScgLz5cbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgIDogKFxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgbmFtZT0ndmFsdWUnXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLnZhbHVlfSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IC8+XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J2Rlc2NyaXB0aW9uJ1xuICAgICAgICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtpdGVtLmRlc2NyaXB0aW9ufVxuICAgICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1cn0gLz5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnIHdpZHRoPScyMHB4Jz5cbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J2xpc3QtaXRlbS1kZWxldGUnIG9uQ2xpY2s9eygpID0+IHRoaXMucmVtb3ZlSXRlbShpbmRleCl9PiYjMTI4NDY1OzwvYT5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0SXRlbXNcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICB0eXBlOiBwcm9wcy5saXN0LnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBuZXdUeXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gbGlzdC5uYW1lXG4gICAgY29uc3QgY29weUxpc3QgPSBjb3B5Lmxpc3RzW2RhdGEubGlzdHMuaW5kZXhPZihsaXN0KV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weUxpc3QubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIHAuY29tcG9uZW50cy5mb3JFYWNoKGMgPT4ge1xuICAgICAgICAgIGlmIChjLnR5cGUgPT09ICdTZWxlY3RGaWVsZCcgfHwgYy50eXBlID09PSAnUmFkaW9zRmllbGQnKSB7XG4gICAgICAgICAgICBpZiAoYy5vcHRpb25zICYmIGMub3B0aW9ucy5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgICAgICAgYy5vcHRpb25zLmxpc3QgPSBuZXdOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5TGlzdC50aXRsZSA9IG5ld1RpdGxlXG4gICAgY29weUxpc3QudHlwZSA9IG5ld1R5cGVcblxuICAgIC8vIEl0ZW1zXG4gICAgY29uc3QgdGV4dHMgPSBmb3JtRGF0YS5nZXRBbGwoJ3RleHQnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCB2YWx1ZXMgPSBmb3JtRGF0YS5nZXRBbGwoJ3ZhbHVlJykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29uc3QgZGVzY3JpcHRpb25zID0gZm9ybURhdGEuZ2V0QWxsKCdkZXNjcmlwdGlvbicpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvcHlMaXN0Lml0ZW1zID0gdGV4dHMubWFwKCh0LCBpKSA9PiAoe1xuICAgICAgdGV4dDogdCxcbiAgICAgIHZhbHVlOiB2YWx1ZXNbaV0sXG4gICAgICBkZXNjcmlwdGlvbjogZGVzY3JpcHRpb25zW2ldXG4gIH0pKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgbGlzdCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBsaXN0XG4gICAgY29weS5saXN0cy5zcGxpY2UoZGF0YS5saXN0cy5pbmRleE9mKGxpc3QpLCAxKVxuXG4gICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAubGlzdCA9PT0gbGlzdC5uYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBwLmxpc3RcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwgIT09IGxpc3QgJiYgbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMjAnIGlkPSdsaXN0LW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstIS13aWR0aC10d28tdGhpcmRzJyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QudGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10eXBlJz5WYWx1ZSB0eXBlPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIGl0ZW1zPXtsaXN0Lml0ZW1zfSB0eXBlPXtzdGF0ZS50eXBlfSAvPlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdEVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdENyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIHR5cGU6IHByb3BzLnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB0eXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gSXRlbXNcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCBkZXNjcmlwdGlvbnMgPSBmb3JtRGF0YS5nZXRBbGwoJ2Rlc2NyaXB0aW9uJykubWFwKHQgPT4gdC50cmltKCkpXG5cbiAgICBjb25zdCBpdGVtcyA9IHRleHRzLm1hcCgodCwgaSkgPT4gKHtcbiAgICAgIHRleHQ6IHQsXG4gICAgICB2YWx1ZTogdmFsdWVzW2ldLFxuICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uc1tpXVxuICB9KSlcblxuICAgIGNvcHkubGlzdHMucHVzaCh7IG5hbWUsIHRpdGxlLCB0eXBlLCBpdGVtcyB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpc3QtbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtdHlwZSc+VmFsdWUgdHlwZTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIHR5cGU9e3N0YXRlLnR5cGV9IC8+XG5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IExpc3RFZGl0IGZyb20gJy4vbGlzdC1lZGl0J1xuaW1wb3J0IExpc3RDcmVhdGUgZnJvbSAnLi9saXN0LWNyZWF0ZSdcblxuY2xhc3MgTGlzdHNFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uQ2xpY2tMaXN0ID0gKGUsIGxpc3QpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbGlzdDogbGlzdFxuICAgIH0pXG4gIH1cblxuICBvbkNsaWNrQWRkTGlzdCA9IChlLCBsaXN0KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dBZGRMaXN0OiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBsaXN0cyB9ID0gZGF0YVxuICAgIGNvbnN0IGxpc3QgPSB0aGlzLnN0YXRlLmxpc3RcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstYm9keSc+XG4gICAgICAgIHshbGlzdCA/IChcbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAge3RoaXMuc3RhdGUuc2hvd0FkZExpc3QgPyAoXG4gICAgICAgICAgICAgIDxMaXN0Q3JlYXRlIGRhdGE9e2RhdGF9XG4gICAgICAgICAgICAgICAgb25DcmVhdGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaXN0OiBmYWxzZSB9KX1cbiAgICAgICAgICAgICAgICBvbkNhbmNlbD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpc3Q6IGZhbHNlIH0pfSAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT0nZ292dWstbGlzdCc+XG4gICAgICAgICAgICAgICAge2xpc3RzLm1hcCgobGlzdCwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgIDxsaSBrZXk9e2xpc3QubmFtZX0+XG4gICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5vbkNsaWNrTGlzdChlLCBsaXN0KX0+XG4gICAgICAgICAgICAgICAgICAgICAge2xpc3QudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgPGhyIC8+XG4gICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja0FkZExpc3QoZSl9PkFkZCBsaXN0PC9hPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxMaXN0RWRpdCBsaXN0PXtsaXN0fSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBsaXN0OiBudWxsIH0pfVxuICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IGxpc3Q6IG51bGwgfSl9IC8+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdHNFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBTZWN0aW9uRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gc2VjdGlvbi5uYW1lXG4gICAgY29uc3QgY29weVNlY3Rpb24gPSBjb3B5LnNlY3Rpb25zW2RhdGEuc2VjdGlvbnMuaW5kZXhPZihzZWN0aW9uKV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weVNlY3Rpb24ubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBzZWN0aW9uXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChwLnNlY3Rpb24gPT09IHNlY3Rpb24ubmFtZSkge1xuICAgICAgICAgIHAuc2VjdGlvbiA9IG5ld05hbWVcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5U2VjdGlvbi50aXRsZSA9IG5ld1RpdGxlXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIHNlY3Rpb25cbiAgICBjb3B5LnNlY3Rpb25zLnNwbGljZShkYXRhLnNlY3Rpb25zLmluZGV4T2Yoc2VjdGlvbiksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIHNlY3Rpb25cbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5zZWN0aW9uID09PSBzZWN0aW9uLm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAuc2VjdGlvblxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5zZWN0aW9ucy5maW5kKHMgPT4gcyAhPT0gc2VjdGlvbiAmJiBzLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTmFtZSAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nc2VjdGlvbi1uYW1lJyBuYW1lPSduYW1lJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtzZWN0aW9uLm5hbWV9IHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtzZWN0aW9uLnRpdGxlfSByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgU2VjdGlvbkNyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIGNvbnN0IHNlY3Rpb24gPSB7IG5hbWUsIHRpdGxlIH1cbiAgICBjb3B5LnNlY3Rpb25zLnB1c2goc2VjdGlvbilcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEuc2VjdGlvbnMuZmluZChzID0+IHMubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBOYW1lICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nc2VjdGlvbi1uYW1lJyBuYW1lPSduYW1lJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nc2VjdGlvbi10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nc2VjdGlvbi10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLnByb3BzLm9uQ2FuY2VsKGUpfT5DYW5jZWw8L2E+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlY3Rpb25DcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IFNlY3Rpb25FZGl0IGZyb20gJy4vc2VjdGlvbi1lZGl0J1xuaW1wb3J0IFNlY3Rpb25DcmVhdGUgZnJvbSAnLi9zZWN0aW9uLWNyZWF0ZSdcblxuY2xhc3MgU2VjdGlvbnNFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uQ2xpY2tTZWN0aW9uID0gKGUsIHNlY3Rpb24pID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2VjdGlvbjogc2VjdGlvblxuICAgIH0pXG4gIH1cblxuICBvbkNsaWNrQWRkU2VjdGlvbiA9IChlLCBzZWN0aW9uKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dBZGRTZWN0aW9uOiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBzZWN0aW9ucyB9ID0gZGF0YVxuICAgIGNvbnN0IHNlY3Rpb24gPSB0aGlzLnN0YXRlLnNlY3Rpb25cblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstYm9keSc+XG4gICAgICAgIHshc2VjdGlvbiA/IChcbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAge3RoaXMuc3RhdGUuc2hvd0FkZFNlY3Rpb24gPyAoXG4gICAgICAgICAgICAgIDxTZWN0aW9uQ3JlYXRlIGRhdGE9e2RhdGF9XG4gICAgICAgICAgICAgICAgb25DcmVhdGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRTZWN0aW9uOiBmYWxzZSB9KX1cbiAgICAgICAgICAgICAgICBvbkNhbmNlbD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFNlY3Rpb246IGZhbHNlIH0pfSAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT0nZ292dWstbGlzdCc+XG4gICAgICAgICAgICAgICAge3NlY3Rpb25zLm1hcCgoc2VjdGlvbiwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgIDxsaSBrZXk9e3NlY3Rpb24ubmFtZX0+XG4gICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5vbkNsaWNrU2VjdGlvbihlLCBzZWN0aW9uKX0+XG4gICAgICAgICAgICAgICAgICAgICAge3NlY3Rpb24udGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgPGhyIC8+XG4gICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja0FkZFNlY3Rpb24oZSl9PkFkZCBzZWN0aW9uPC9hPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxTZWN0aW9uRWRpdCBzZWN0aW9uPXtzZWN0aW9ufSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzZWN0aW9uOiBudWxsIH0pfVxuICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNlY3Rpb246IG51bGwgfSl9IC8+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2VjdGlvbnNFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgUmVhY3RET00gZGFncmUgKi9cblxuaW1wb3J0IFBhZ2UgZnJvbSAnLi9wYWdlJ1xuaW1wb3J0IEZseW91dCBmcm9tICcuL2ZseW91dCdcbmltcG9ydCBEYXRhTW9kZWwgZnJvbSAnLi9kYXRhLW1vZGVsJ1xuaW1wb3J0IFBhZ2VDcmVhdGUgZnJvbSAnLi9wYWdlLWNyZWF0ZSdcbmltcG9ydCBMaW5rRWRpdCBmcm9tICcuL2xpbmstZWRpdCdcbmltcG9ydCBMaW5rQ3JlYXRlIGZyb20gJy4vbGluay1jcmVhdGUnXG5pbXBvcnQgTGlzdHNFZGl0IGZyb20gJy4vbGlzdHMtZWRpdCdcbmltcG9ydCBTZWN0aW9uc0VkaXQgZnJvbSAnLi9zZWN0aW9ucy1lZGl0J1xuXG5mdW5jdGlvbiBnZXRMYXlvdXQgKGRhdGEsIGVsKSB7XG4gIC8vIENyZWF0ZSBhIG5ldyBkaXJlY3RlZCBncmFwaFxuICB2YXIgZyA9IG5ldyBkYWdyZS5ncmFwaGxpYi5HcmFwaCgpXG5cbiAgLy8gU2V0IGFuIG9iamVjdCBmb3IgdGhlIGdyYXBoIGxhYmVsXG4gIGcuc2V0R3JhcGgoe1xuICAgIHJhbmtkaXI6ICdMUicsXG4gICAgbWFyZ2lueDogNTAsXG4gICAgbWFyZ2lueTogMTUwLFxuICAgIHJhbmtzZXA6IDE2MFxuICB9KVxuXG4gIC8vIERlZmF1bHQgdG8gYXNzaWduaW5nIGEgbmV3IG9iamVjdCBhcyBhIGxhYmVsIGZvciBlYWNoIG5ldyBlZGdlLlxuICBnLnNldERlZmF1bHRFZGdlTGFiZWwoZnVuY3Rpb24gKCkgeyByZXR1cm4ge30gfSlcblxuICAvLyBBZGQgbm9kZXMgdG8gdGhlIGdyYXBoLiBUaGUgZmlyc3QgYXJndW1lbnQgaXMgdGhlIG5vZGUgaWQuIFRoZSBzZWNvbmQgaXNcbiAgLy8gbWV0YWRhdGEgYWJvdXQgdGhlIG5vZGUuIEluIHRoaXMgY2FzZSB3ZSdyZSBnb2luZyB0byBhZGQgbGFiZWxzIHRvIGVhY2ggbm9kZVxuICBkYXRhLnBhZ2VzLmZvckVhY2goKHBhZ2UsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgcGFnZUVsID0gZWwuY2hpbGRyZW5baW5kZXhdXG5cbiAgICBnLnNldE5vZGUocGFnZS5wYXRoLCB7IGxhYmVsOiBwYWdlLnBhdGgsIHdpZHRoOiBwYWdlRWwub2Zmc2V0V2lkdGgsIGhlaWdodDogcGFnZUVsLm9mZnNldEhlaWdodCB9KVxuICB9KVxuXG4gIC8vIEFkZCBlZGdlcyB0byB0aGUgZ3JhcGguXG4gIGRhdGEucGFnZXMuZm9yRWFjaChwYWdlID0+IHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShwYWdlLm5leHQpKSB7XG4gICAgICBwYWdlLm5leHQuZm9yRWFjaChuZXh0ID0+IHtcbiAgICAgICAgZy5zZXRFZGdlKHBhZ2UucGF0aCwgbmV4dC5wYXRoKVxuICAgICAgfSlcbiAgICB9XG4gIH0pXG5cbiAgZGFncmUubGF5b3V0KGcpXG5cbiAgY29uc3QgcG9zID0ge1xuICAgIG5vZGVzOiBbXSxcbiAgICBlZGdlczogW11cbiAgfVxuXG4gIGNvbnN0IG91dHB1dCA9IGcuZ3JhcGgoKVxuICBwb3Mud2lkdGggPSBvdXRwdXQud2lkdGggKyAncHgnXG4gIHBvcy5oZWlnaHQgPSBvdXRwdXQuaGVpZ2h0ICsgJ3B4J1xuICBnLm5vZGVzKCkuZm9yRWFjaCgodiwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBub2RlID0gZy5ub2RlKHYpXG4gICAgY29uc3QgcHQgPSB7IG5vZGUgfVxuICAgIHB0LnRvcCA9IChub2RlLnkgLSBub2RlLmhlaWdodCAvIDIpICsgJ3B4J1xuICAgIHB0LmxlZnQgPSAobm9kZS54IC0gbm9kZS53aWR0aCAvIDIpICsgJ3B4J1xuICAgIHBvcy5ub2Rlcy5wdXNoKHB0KVxuICB9KVxuXG4gIGcuZWRnZXMoKS5mb3JFYWNoKChlLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IGVkZ2UgPSBnLmVkZ2UoZSlcbiAgICBwb3MuZWRnZXMucHVzaCh7XG4gICAgICBzb3VyY2U6IGUudixcbiAgICAgIHRhcmdldDogZS53LFxuICAgICAgcG9pbnRzOiBlZGdlLnBvaW50cy5tYXAocCA9PiB7XG4gICAgICAgIGNvbnN0IHB0ID0ge31cbiAgICAgICAgcHQueSA9IHAueVxuICAgICAgICBwdC54ID0gcC54XG4gICAgICAgIHJldHVybiBwdFxuICAgICAgfSlcbiAgICB9KVxuICB9KVxuXG4gIHJldHVybiB7IGcsIHBvcyB9XG59XG5cbmNsYXNzIExpbmVzIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIGVkaXRMaW5rID0gKGVkZ2UpID0+IHtcbiAgICBjb25zb2xlLmxvZygnY2xpY2tlZCcsIGVkZ2UpXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzaG93RWRpdG9yOiBlZGdlXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBsYXlvdXQsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8c3ZnIGhlaWdodD17bGF5b3V0LmhlaWdodH0gd2lkdGg9e2xheW91dC53aWR0aH0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgbGF5b3V0LmVkZ2VzLm1hcChlZGdlID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgcG9pbnRzID0gZWRnZS5wb2ludHMubWFwKHBvaW50cyA9PiBgJHtwb2ludHMueH0sJHtwb2ludHMueX1gKS5qb2luKCcgJylcbiAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZyBrZXk9e3BvaW50c30+XG4gICAgICAgICAgICAgICAgICA8cG9seWxpbmVcbiAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5lZGl0TGluayhlZGdlKX1cbiAgICAgICAgICAgICAgICAgICAgcG9pbnRzPXtwb2ludHN9IC8+XG4gICAgICAgICAgICAgICAgPC9nPlxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgPC9zdmc+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBMaW5rJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0b3J9XG4gICAgICAgICAgb25IaWRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPExpbmtFZGl0IGVkZ2U9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIE1pbmltYXAgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25DbGlja1BhZ2UgPSAoZSkgPT4ge1xuXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgbGF5b3V0LCBkYXRhLCBzY2FsZSA9IDAuMDUgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbWluaW1hcCc+XG4gICAgICAgIDxzdmcgaGVpZ2h0PXtwYXJzZUZsb2F0KGxheW91dC5oZWlnaHQpICogc2NhbGV9IHdpZHRoPXtwYXJzZUZsb2F0KGxheW91dC53aWR0aCkgKiBzY2FsZX0+XG4gICAgICAgICAge1xuICAgICAgICAgICAgbGF5b3V0LmVkZ2VzLm1hcChlZGdlID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgcG9pbnRzID0gZWRnZS5wb2ludHMubWFwKHBvaW50cyA9PiBgJHtwb2ludHMueCAqIHNjYWxlfSwke3BvaW50cy55ICogc2NhbGV9YCkuam9pbignICcpXG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGcga2V5PXtwb2ludHN9PlxuICAgICAgICAgICAgICAgICAgPHBvbHlsaW5lIHBvaW50cz17cG9pbnRzfSAvPlxuICAgICAgICAgICAgICAgIDwvZz5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAge1xuICAgICAgICAgICAgbGF5b3V0Lm5vZGVzLm1hcCgobm9kZSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZyBrZXk9e25vZGUgKyBpbmRleH0+XG4gICAgICAgICAgICAgICAgICA8YSB4bGlua0hyZWY9e2AjJHtub2RlLm5vZGUubGFiZWx9YH0+XG4gICAgICAgICAgICAgICAgICAgIDxyZWN0IHg9e3BhcnNlRmxvYXQobm9kZS5sZWZ0KSAqIHNjYWxlfVxuICAgICAgICAgICAgICAgICAgICAgIHk9e3BhcnNlRmxvYXQobm9kZS50b3ApICogc2NhbGV9XG4gICAgICAgICAgICAgICAgICAgICAgd2lkdGg9e25vZGUubm9kZS53aWR0aCAqIHNjYWxlfVxuICAgICAgICAgICAgICAgICAgICAgIGhlaWdodD17bm9kZS5ub2RlLmhlaWdodCAqIHNjYWxlfVxuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlPXtub2RlLm5vZGUubGFiZWx9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17dGhpcy5vbkNsaWNrUGFnZX0gLz5cbiAgICAgICAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICA8L3N2Zz5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5jbGFzcyBWaXN1YWxpc2F0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5yZWYgPSBSZWFjdC5jcmVhdGVSZWYoKVxuICB9XG5cbiAgc2NoZWR1bGVMYXlvdXQgKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc3QgbGF5b3V0ID0gZ2V0TGF5b3V0KHRoaXMucHJvcHMuZGF0YSwgdGhpcy5yZWYuY3VycmVudClcblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGxheW91dDogbGF5b3V0LnBvc1xuICAgICAgfSlcbiAgICB9LCAyMDApXG4gIH1cblxuICBjb21wb25lbnREaWRNb3VudCAoKSB7XG4gICAgdGhpcy5zY2hlZHVsZUxheW91dCgpXG4gIH1cblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzICgpIHtcbiAgICB0aGlzLnNjaGVkdWxlTGF5b3V0KClcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgcmVmPXt0aGlzLnJlZn0gY2xhc3NOYW1lPSd2aXN1YWxpc2F0aW9uJyBzdHlsZT17dGhpcy5zdGF0ZS5sYXlvdXQgJiYgeyB3aWR0aDogdGhpcy5zdGF0ZS5sYXlvdXQud2lkdGgsIGhlaWdodDogdGhpcy5zdGF0ZS5sYXlvdXQuaGVpZ2h0IH19PlxuICAgICAgICB7cGFnZXMubWFwKChwYWdlLCBpbmRleCkgPT4gPFBhZ2VcbiAgICAgICAgICBrZXk9e2luZGV4fSBkYXRhPXtkYXRhfSBwYWdlPXtwYWdlfVxuICAgICAgICAgIGxheW91dD17dGhpcy5zdGF0ZS5sYXlvdXQgJiYgdGhpcy5zdGF0ZS5sYXlvdXQubm9kZXNbaW5kZXhdfSAvPlxuICAgICAgICApfVxuICAgICAgICB7dGhpcy5zdGF0ZS5sYXlvdXQgJiYgPExpbmVzIGxheW91dD17dGhpcy5zdGF0ZS5sYXlvdXR9IGRhdGE9e2RhdGF9IC8+fVxuICAgICAgICB7dGhpcy5zdGF0ZS5sYXlvdXQgJiYgPE1pbmltYXAgbGF5b3V0PXt0aGlzLnN0YXRlLmxheW91dH0gZGF0YT17ZGF0YX0gLz59XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgTWVudSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrVXBsb2FkID0gKGUpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndXBsb2FkJykuY2xpY2soKVxuICB9XG5cbiAgb25GaWxlVXBsb2FkID0gKGUpID0+IHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBmaWxlID0gZS50YXJnZXQuZmlsZXMuaXRlbSgwKVxuICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICByZWFkZXIucmVhZEFzVGV4dChmaWxlLCAnVVRGLTgnKVxuICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gSlNPTi5wYXJzZShldnQudGFyZ2V0LnJlc3VsdClcbiAgICAgIGRhdGEuc2F2ZShjb250ZW50KVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhLCBwbGF5Z3JvdW5kTW9kZSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdtZW51Jz5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFBhZ2U6IHRydWUgfSl9PkFkZCBQYWdlPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGluazogdHJ1ZSB9KX0+QWRkIExpbms8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0U2VjdGlvbnM6IHRydWUgfSl9PkVkaXQgU2VjdGlvbnM8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0TGlzdHM6IHRydWUgfSl9PkVkaXQgTGlzdHM8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dEYXRhTW9kZWw6IHRydWUgfSl9PlZpZXcgRGF0YSBNb2RlbDwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0pTT05EYXRhOiB0cnVlIH0pfT5WaWV3IEpTT048L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dTdW1tYXJ5OiB0cnVlIH0pfT5TdW1tYXJ5PC9idXR0b24+XG5cbiAgICAgICAge3BsYXlncm91bmRNb2RlICYmIChcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdvdnVrLSEtbWFyZ2luLXRvcC00XCI+XG4gICAgICAgICAgICA8YSBjbGFzc05hbWU9J2dvdnVrLWxpbmsgZ292dWstbGluay0tbm8tdmlzaXRlZC1zdGF0ZSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgZG93bmxvYWQgaHJlZj0nL2FwaS9kYXRhP2Zvcm1hdD10cnVlJz5Eb3dubG9hZCBKU09OPC9hPnsnICd9XG4gICAgICAgICAgICA8YSBjbGFzc05hbWU9J2dvdnVrLWxpbmsgZ292dWstbGluay0tbm8tdmlzaXRlZC1zdGF0ZSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgaHJlZj0nIycgb25DbGljaz17dGhpcy5vbkNsaWNrVXBsb2FkfT5VcGxvYWQgSlNPTjwvYT57JyAnfVxuICAgICAgICAgICAgPGlucHV0IHR5cGU9J2ZpbGUnIGlkPSd1cGxvYWQnIGhpZGRlbiBvbkNoYW5nZT17dGhpcy5vbkZpbGVVcGxvYWR9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICl9XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIFBhZ2UnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0FkZFBhZ2V9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFBhZ2U6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8UGFnZUNyZWF0ZSBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRQYWdlOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIExpbmsnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0FkZExpbmt9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpbms6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8TGlua0NyZWF0ZSBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaW5rOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBTZWN0aW9ucycgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdFNlY3Rpb25zfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0U2VjdGlvbnM6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8U2VjdGlvbnNFZGl0IGRhdGE9e2RhdGF9IG9uQ3JlYXRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRTZWN0aW9uczogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgTGlzdHMnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRMaXN0c31cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdExpc3RzOiBmYWxzZSB9KX0gd2lkdGg9J3hsYXJnZSc+XG4gICAgICAgICAgPExpc3RzRWRpdCBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0TGlzdHM6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdEYXRhIE1vZGVsJyBzaG93PXt0aGlzLnN0YXRlLnNob3dEYXRhTW9kZWx9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0RhdGFNb2RlbDogZmFsc2UgfSl9PlxuICAgICAgICAgIDxEYXRhTW9kZWwgZGF0YT17ZGF0YX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nSlNPTiBEYXRhJyBzaG93PXt0aGlzLnN0YXRlLnNob3dKU09ORGF0YX1cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93SlNPTkRhdGE6IGZhbHNlIH0pfSB3aWR0aD0nbGFyZ2UnPlxuICAgICAgICAgIDxwcmU+e0pTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpfTwvcHJlPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdTdW1tYXJ5JyBzaG93PXt0aGlzLnN0YXRlLnNob3dTdW1tYXJ5fVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dTdW1tYXJ5OiBmYWxzZSB9KX0+XG4gICAgICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkoZGF0YS5wYWdlcy5tYXAocGFnZSA9PiBwYWdlLnBhdGgpLCBudWxsLCAyKX08L3ByZT5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgQXBwIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIGNvbXBvbmVudFdpbGxNb3VudCAoKSB7XG4gICAgd2luZG93LmZldGNoKCcvYXBpL2RhdGEnKS50aGVuKHJlcyA9PiByZXMuanNvbigpKS50aGVuKGRhdGEgPT4ge1xuICAgICAgZGF0YS5zYXZlID0gdGhpcy5zYXZlXG4gICAgICB0aGlzLnNldFN0YXRlKHsgbG9hZGVkOiB0cnVlLCBkYXRhIH0pXG4gICAgfSlcbiAgfVxuXG4gIHNhdmUgPSAodXBkYXRlZERhdGEpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmZldGNoKGAvYXBpL2RhdGFgLCB7XG4gICAgICBtZXRob2Q6ICdwdXQnLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkodXBkYXRlZERhdGEpXG4gICAgfSkudGhlbihyZXMgPT4ge1xuICAgICAgaWYgKCFyZXMub2spIHtcbiAgICAgICAgdGhyb3cgRXJyb3IocmVzLnN0YXR1c1RleHQpXG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzXG4gICAgfSkudGhlbihyZXMgPT4gcmVzLmpzb24oKSkudGhlbihkYXRhID0+IHtcbiAgICAgIGRhdGEuc2F2ZSA9IHRoaXMuc2F2ZVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGRhdGEgfSlcblxuICAgICAgLy8gUmVsb2FkIGZyYW1lIGlmIHNwbGl0IHNjcmVlbiBhbmQgaW4gcGxheWdyb3VuZCBtb2RlXG4gICAgICBpZiAod2luZG93LkRGQkQucGxheWdyb3VuZE1vZGUpIHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gd2luZG93LnBhcmVudFxuICAgICAgICBpZiAocGFyZW50LmxvY2F0aW9uLnBhdGhuYW1lID09PSAnL3NwbGl0Jykge1xuICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IHdpbmRvdy5wYXJlbnQuZnJhbWVzXG4gIFxuICAgICAgICAgIGlmIChmcmFtZXMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICBjb25zdCBwcmV2aWV3ID0gd2luZG93LnBhcmVudC5mcmFtZXNbMV1cbiAgICAgICAgICAgIHByZXZpZXcubG9jYXRpb24ucmVsb2FkKClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB3aW5kb3cuYWxlcnQoJ1NhdmUgZmFpbGVkJylcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5sb2FkZWQpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgaWQ9J2FwcCc+XG4gICAgICAgICAgPE1lbnUgZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSBwbGF5Z3JvdW5kTW9kZT17d2luZG93LkRGQkQucGxheWdyb3VuZE1vZGV9IC8+XG4gICAgICAgICAgPFZpc3VhbGlzYXRpb24gZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDxkaXY+TG9hZGluZy4uLjwvZGl2PlxuICAgIH1cbiAgfVxufVxuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxBcHAgLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JylcbilcbiJdLCJuYW1lcyI6WyJGbHlvdXQiLCJwcm9wcyIsInNob3ciLCJ3aWR0aCIsIm9uSGlkZSIsImUiLCJ0aXRsZSIsImNoaWxkcmVuIiwiZ2V0Rm9ybURhdGEiLCJmb3JtIiwiZm9ybURhdGEiLCJ3aW5kb3ciLCJGb3JtRGF0YSIsImRhdGEiLCJvcHRpb25zIiwic2NoZW1hIiwiY2FzdCIsIm5hbWUiLCJ2YWwiLCJlbCIsImVsZW1lbnRzIiwiZGF0YXNldCIsInVuZGVmaW5lZCIsIk51bWJlciIsImZvckVhY2giLCJ2YWx1ZSIsImtleSIsIm9wdGlvbnNQcmVmaXgiLCJzY2hlbWFQcmVmaXgiLCJ0cmltIiwic3RhcnRzV2l0aCIsInJlcXVpcmVkIiwic3Vic3RyIiwibGVuZ3RoIiwiT2JqZWN0Iiwia2V5cyIsImNsb25lIiwib2JqIiwiSlNPTiIsInBhcnNlIiwic3RyaW5naWZ5IiwiUGFnZUVkaXQiLCJzdGF0ZSIsIm9uU3VibWl0IiwicHJldmVudERlZmF1bHQiLCJ0YXJnZXQiLCJuZXdQYXRoIiwiZ2V0Iiwic2VjdGlvbiIsInBhZ2UiLCJjb3B5IiwicGF0aENoYW5nZWQiLCJwYXRoIiwiY29weVBhZ2UiLCJwYWdlcyIsImluZGV4T2YiLCJmaW5kIiwicCIsInNldEN1c3RvbVZhbGlkaXR5IiwicmVwb3J0VmFsaWRpdHkiLCJBcnJheSIsImlzQXJyYXkiLCJuZXh0IiwibiIsInNhdmUiLCJ0aGVuIiwiY29uc29sZSIsImxvZyIsIm9uRWRpdCIsImNhdGNoIiwiZXJyb3IiLCJlcnIiLCJvbkNsaWNrRGVsZXRlIiwiY29uZmlybSIsImNvcHlQYWdlSWR4IiwiZmluZEluZGV4IiwiaW5kZXgiLCJpIiwic3BsaWNlIiwic2VjdGlvbnMiLCJtYXAiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbXBvbmVudFR5cGVzIiwic3ViVHlwZSIsIkNsYXNzZXMiLCJjb21wb25lbnQiLCJjbGFzc2VzIiwiRmllbGRFZGl0IiwiaGludCIsIlRleHRGaWVsZEVkaXQiLCJtYXgiLCJtaW4iLCJNdWx0aWxpbmVUZXh0RmllbGRFZGl0Iiwicm93cyIsIk51bWJlckZpZWxkRWRpdCIsImludGVnZXIiLCJTZWxlY3RGaWVsZEVkaXQiLCJsaXN0cyIsImxpc3QiLCJSYWRpb3NGaWVsZEVkaXQiLCJib2xkIiwiQ2hlY2tib3hlc0ZpZWxkRWRpdCIsIlBhcmFFZGl0IiwiY29udGVudCIsIkluc2V0VGV4dEVkaXQiLCJIdG1sRWRpdCIsIkRldGFpbHNFZGl0IiwiY29tcG9uZW50VHlwZUVkaXRvcnMiLCJDb21wb25lbnRUeXBlRWRpdCIsInR5cGUiLCJ0IiwiVGFnTmFtZSIsIkNvbXBvbmVudEVkaXQiLCJjb21wb25lbnRJbmRleCIsImNvbXBvbmVudHMiLCJjb21wb25lbnRJZHgiLCJjIiwiaXNMYXN0IiwiY29weUNvbXAiLCJTb3J0YWJsZUhhbmRsZSIsIlNvcnRhYmxlSE9DIiwiRHJhZ0hhbmRsZSIsIlRleHRGaWVsZCIsIlRlbGVwaG9uZU51bWJlckZpZWxkIiwiTnVtYmVyRmllbGQiLCJFbWFpbEFkZHJlc3NGaWVsZCIsIlRpbWVGaWVsZCIsIkRhdGVGaWVsZCIsIkRhdGVUaW1lRmllbGQiLCJEYXRlUGFydHNGaWVsZCIsIkRhdGVUaW1lUGFydHNGaWVsZCIsIk11bHRpbGluZVRleHRGaWVsZCIsIlJhZGlvc0ZpZWxkIiwiQ2hlY2tib3hlc0ZpZWxkIiwiU2VsZWN0RmllbGQiLCJZZXNOb0ZpZWxkIiwiVWtBZGRyZXNzRmllbGQiLCJQYXJhIiwiSHRtbCIsIkluc2V0VGV4dCIsIkRldGFpbHMiLCJCYXNlIiwiQ29tcG9uZW50RmllbGQiLCJzaG93RWRpdG9yIiwic3RvcFByb3BhZ2F0aW9uIiwic2V0U3RhdGUiLCJDb21wb25lbnRDcmVhdGUiLCJwdXNoIiwib25DcmVhdGUiLCJTb3J0YWJsZUVsZW1lbnQiLCJTb3J0YWJsZUNvbnRhaW5lciIsImFycmF5TW92ZSIsIlNvcnRhYmxlSXRlbSIsIlNvcnRhYmxlTGlzdCIsIlBhZ2UiLCJvblNvcnRFbmQiLCJvbGRJbmRleCIsIm5ld0luZGV4IiwiZm9ybUNvbXBvbmVudHMiLCJmaWx0ZXIiLCJjb21wIiwicGFnZVRpdGxlIiwibGF5b3V0Iiwic2hvd0FkZENvbXBvbmVudCIsImxpc3RUeXBlcyIsImNvbXBvbmVudFRvU3RyaW5nIiwiRGF0YU1vZGVsIiwibW9kZWwiLCJQYWdlQ3JlYXRlIiwiYXNzaWduIiwiTGlua0VkaXQiLCJlZGdlIiwic291cmNlIiwibGluayIsImlmIiwiY29uZGl0aW9uIiwiY29weUxpbmsiLCJjb3B5TGlua0lkeCIsIkxpbmtDcmVhdGUiLCJmcm9tIiwidG8iLCJoZWFkRHVwbGljYXRlIiwiYXJyIiwiaiIsIkxpc3RJdGVtcyIsIm9uQ2xpY2tBZGRJdGVtIiwiaXRlbXMiLCJjb25jYXQiLCJ0ZXh0IiwiZGVzY3JpcHRpb24iLCJyZW1vdmVJdGVtIiwicyIsImlkeCIsIm9uQmx1ciIsInRleHRzIiwiZ2V0QWxsIiwidmFsdWVzIiwiZHVwZVRleHQiLCJkdXBlVmFsdWUiLCJpdGVtIiwiTGlzdEVkaXQiLCJuZXdOYW1lIiwibmV3VGl0bGUiLCJuZXdUeXBlIiwibmFtZUNoYW5nZWQiLCJjb3B5TGlzdCIsImRlc2NyaXB0aW9ucyIsIm9uQmx1ck5hbWUiLCJpbnB1dCIsImwiLCJvbkNhbmNlbCIsIkxpc3RDcmVhdGUiLCJMaXN0c0VkaXQiLCJvbkNsaWNrTGlzdCIsIm9uQ2xpY2tBZGRMaXN0Iiwic2hvd0FkZExpc3QiLCJTZWN0aW9uRWRpdCIsImNvcHlTZWN0aW9uIiwiU2VjdGlvbkNyZWF0ZSIsIlNlY3Rpb25zRWRpdCIsIm9uQ2xpY2tTZWN0aW9uIiwib25DbGlja0FkZFNlY3Rpb24iLCJzaG93QWRkU2VjdGlvbiIsImdldExheW91dCIsImciLCJkYWdyZSIsImdyYXBobGliIiwiR3JhcGgiLCJzZXRHcmFwaCIsInJhbmtkaXIiLCJtYXJnaW54IiwibWFyZ2lueSIsInJhbmtzZXAiLCJzZXREZWZhdWx0RWRnZUxhYmVsIiwicGFnZUVsIiwic2V0Tm9kZSIsImxhYmVsIiwib2Zmc2V0V2lkdGgiLCJoZWlnaHQiLCJvZmZzZXRIZWlnaHQiLCJzZXRFZGdlIiwicG9zIiwibm9kZXMiLCJlZGdlcyIsIm91dHB1dCIsImdyYXBoIiwidiIsIm5vZGUiLCJwdCIsInRvcCIsInkiLCJsZWZ0IiwieCIsInciLCJwb2ludHMiLCJMaW5lcyIsImVkaXRMaW5rIiwiam9pbiIsIk1pbmltYXAiLCJvbkNsaWNrUGFnZSIsInNjYWxlIiwicGFyc2VGbG9hdCIsIlZpc3VhbGlzYXRpb24iLCJyZWYiLCJjcmVhdGVSZWYiLCJzZXRUaW1lb3V0IiwiY3VycmVudCIsInNjaGVkdWxlTGF5b3V0IiwiTWVudSIsIm9uQ2xpY2tVcGxvYWQiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiY2xpY2siLCJvbkZpbGVVcGxvYWQiLCJmaWxlIiwiZmlsZXMiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwicmVhZEFzVGV4dCIsIm9ubG9hZCIsImV2dCIsInJlc3VsdCIsInBsYXlncm91bmRNb2RlIiwic2hvd0FkZFBhZ2UiLCJzaG93QWRkTGluayIsInNob3dFZGl0U2VjdGlvbnMiLCJzaG93RWRpdExpc3RzIiwic2hvd0RhdGFNb2RlbCIsInNob3dKU09ORGF0YSIsInNob3dTdW1tYXJ5IiwiQXBwIiwidXBkYXRlZERhdGEiLCJmZXRjaCIsIm1ldGhvZCIsImJvZHkiLCJyZXMiLCJvayIsIkVycm9yIiwic3RhdHVzVGV4dCIsImpzb24iLCJERkJEIiwicGFyZW50IiwibG9jYXRpb24iLCJwYXRobmFtZSIsImZyYW1lcyIsInByZXZpZXciLCJyZWxvYWQiLCJhbGVydCIsImxvYWRlZCIsIlJlYWN0RE9NIiwicmVuZGVyIl0sIm1hcHBpbmdzIjoiOzs7RUFDQSxTQUFTQSxNQUFULENBQWlCQyxLQUFqQixFQUF3QjtFQUN0QixNQUFJLENBQUNBLE1BQU1DLElBQVgsRUFBaUI7RUFDZixXQUFPLElBQVA7RUFDRDs7RUFFRCxNQUFNQyxRQUFRRixNQUFNRSxLQUFOLElBQWUsRUFBN0I7O0VBRUEsU0FDRTtFQUFBO0VBQUEsTUFBSyxXQUFVLGtCQUFmO0VBQ0U7RUFBQTtFQUFBLFFBQUssc0NBQW9DQSxLQUF6QztFQUNFO0VBQUE7RUFBQSxVQUFHLE9B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
