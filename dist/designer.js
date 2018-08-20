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
      { 'class': 'component-item' },
      React.createElement(Component, { key: index, page: page, component: component, data: data })
    );
  });

  var SortableList = SortableContainer(function (_ref2) {
    var page = _ref2.page,
        data = _ref2.data;

    return React.createElement(
      'div',
      { 'class': 'component-list' },
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
          { className: 'page xtooltip', style: this.props.layout },
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

  function componentToString(component) {
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
      { className: '' },
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
                  ),
                  ' (',
                  list.name,
                  ')'
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
                  ),
                  ' (',
                  section.name,
                  ')'
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
      marginx: 30,
      marginy: 30
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
      var pt = {};
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

  var Visualisation = function (_React$Component2) {
    _inherits$g(Visualisation, _React$Component2);

    function Visualisation() {
      _classCallCheck$g(this, Visualisation);

      var _this3 = _possibleConstructorReturn$g(this, (Visualisation.__proto__ || Object.getPrototypeOf(Visualisation)).call(this));

      _this3.state = {};

      _this3.ref = React.createRef();
      return _this3;
    }

    _createClass$g(Visualisation, [{
      key: 'scheduleLayout',
      value: function scheduleLayout() {
        var _this4 = this;

        setTimeout(function () {
          var layout = getLayout(_this4.props.data, _this4.ref.current);

          _this4.setState({
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
        var _this5 = this;

        var data = this.props.data;
        var pages = data.pages;


        return React.createElement(
          'div',
          { ref: this.ref, className: 'visualisation', style: this.state.layout && { width: this.state.layout.width, height: this.state.layout.height } },
          pages.map(function (page, index) {
            return React.createElement(Page, {
              key: index, data: data, page: page,
              layout: _this5.state.layout && _this5.state.layout.nodes[index] });
          }),
          this.state.layout && React.createElement(Lines, { layout: this.state.layout, data: data })
        );
      }
    }]);

    return Visualisation;
  }(React.Component);

  var Menu = function (_React$Component3) {
    _inherits$g(Menu, _React$Component3);

    function Menu() {
      var _ref2;

      var _temp2, _this6, _ret2;

      _classCallCheck$g(this, Menu);

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return _ret2 = (_temp2 = (_this6 = _possibleConstructorReturn$g(this, (_ref2 = Menu.__proto__ || Object.getPrototypeOf(Menu)).call.apply(_ref2, [this].concat(args))), _this6), _this6.state = {}, _temp2), _possibleConstructorReturn$g(_this6, _ret2);
    }

    _createClass$g(Menu, [{
      key: 'render',
      value: function render() {
        var _this7 = this;

        var data = this.props.data;


        return React.createElement(
          'div',
          null,
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this7.setState({ showAddPage: true });
              } },
            'Add Page'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this7.setState({ showAddLink: true });
              } },
            'Add Link'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this7.setState({ showEditSections: true });
              } },
            'Edit Sections'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this7.setState({ showEditLists: true });
              } },
            'Edit Lists'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this7.setState({ showDataModel: true });
              } },
            'View Data Model'
          ),
          ' ',
          React.createElement(
            'button',
            { className: 'govuk-button govuk-!-font-size-14',
              onClick: function onClick() {
                return _this7.setState({ showJSONData: true });
              } },
            'View JSON'
          ),
          ' ',
          React.createElement(
            Flyout,
            { title: 'Add Page', show: this.state.showAddPage,
              onHide: function onHide() {
                return _this7.setState({ showAddPage: false });
              } },
            React.createElement(PageCreate, { data: data, onCreate: function onCreate() {
                return _this7.setState({ showAddPage: false });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Add Link', show: this.state.showAddLink,
              onHide: function onHide() {
                return _this7.setState({ showAddLink: false });
              } },
            React.createElement(LinkCreate, { data: data, onCreate: function onCreate() {
                return _this7.setState({ showAddLink: false });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Edit Sections', show: this.state.showEditSections,
              onHide: function onHide() {
                return _this7.setState({ showEditSections: false });
              } },
            React.createElement(SectionsEdit, { data: data, onCreate: function onCreate() {
                return _this7.setState({ showEditSections: false });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Edit Lists', show: this.state.showEditLists,
              onHide: function onHide() {
                return _this7.setState({ showEditLists: false });
              } },
            React.createElement(ListsEdit, { data: data, onCreate: function onCreate() {
                return _this7.setState({ showEditLists: false });
              } })
          ),
          React.createElement(
            Flyout,
            { title: 'Data Model', show: this.state.showDataModel,
              onHide: function onHide() {
                return _this7.setState({ showDataModel: false });
              } },
            React.createElement(DataModel, { data: data })
          ),
          React.createElement(
            Flyout,
            { title: 'JSON Data', show: this.state.showJSONData,
              onHide: function onHide() {
                return _this7.setState({ showJSONData: false });
              } },
            React.createElement(
              'pre',
              null,
              JSON.stringify(data, null, 2)
            )
          )
        );
      }
    }]);

    return Menu;
  }(React.Component);

  var App = function (_React$Component4) {
    _inherits$g(App, _React$Component4);

    function App() {
      var _ref3;

      var _temp3, _this8, _ret3;

      _classCallCheck$g(this, App);

      for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      return _ret3 = (_temp3 = (_this8 = _possibleConstructorReturn$g(this, (_ref3 = App.__proto__ || Object.getPrototypeOf(App)).call.apply(_ref3, [this].concat(args))), _this8), _this8.state = {}, _this8.save = function (updatedData) {
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
          data.save = _this8.save;
          _this8.setState({ data: data });
          return data;
        }).catch(function (err) {
          console.error(err);
          window.alert('Save failed');
        });
      }, _temp3), _possibleConstructorReturn$g(_this8, _ret3);
    }

    _createClass$g(App, [{
      key: 'componentWillMount',
      value: function componentWillMount() {
        var _this9 = this;

        window.fetch('/api/data').then(function (res) {
          return res.json();
        }).then(function (data) {
          data.save = _this9.save;
          _this9.setState({ loaded: true, data: data });
        });
      }
    }, {
      key: 'render',
      value: function render() {
        if (this.state.loaded) {
          return React.createElement(
            'div',
            { id: 'app' },
            React.createElement(Menu, { data: this.state.data }),
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzaWduZXIuanMiLCJzb3VyY2VzIjpbIi4uL2NsaWVudC9mbHlvdXQuanMiLCIuLi9jbGllbnQvaGVscGVycy5qcyIsIi4uL2NsaWVudC9wYWdlLWVkaXQuanMiLCIuLi9jb21wb25lbnQtdHlwZXMuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LXR5cGUtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LWNyZWF0ZS5qcyIsIi4uL2NsaWVudC9wYWdlLmpzIiwiLi4vY2xpZW50L2RhdGEtbW9kZWwuanMiLCIuLi9jbGllbnQvcGFnZS1jcmVhdGUuanMiLCIuLi9jbGllbnQvbGluay1lZGl0LmpzIiwiLi4vY2xpZW50L2xpbmstY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3QtaXRlbXMuanMiLCIuLi9jbGllbnQvbGlzdC1lZGl0LmpzIiwiLi4vY2xpZW50L2xpc3QtY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3RzLWVkaXQuanMiLCIuLi9jbGllbnQvc2VjdGlvbi1lZGl0LmpzIiwiLi4vY2xpZW50L3NlY3Rpb24tY3JlYXRlLmpzIiwiLi4vY2xpZW50L3NlY3Rpb25zLWVkaXQuanMiLCIuLi9jbGllbnQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5mdW5jdGlvbiBGbHlvdXQgKHByb3BzKSB7XG4gIGlmICghcHJvcHMuc2hvdykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPSdmbHlvdXQtbWVudSBzaG93Jz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdmbHlvdXQtbWVudS1jb250YWluZXInPlxuICAgICAgICA8YSB0aXRsZT0nQ2xvc2UnIGNsYXNzTmFtZT0nY2xvc2UgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgb25DbGljaz17ZSA9PiBwcm9wcy5vbkhpZGUoZSl9PkNsb3NlPC9hPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFuZWwnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1oZWFkZXIgZ292dWstIS1wYWRkaW5nLXRvcC00IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTQnPlxuICAgICAgICAgICAge3Byb3BzLnRpdGxlICYmIDxoNCBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctbSc+e3Byb3BzLnRpdGxlfTwvaDQ+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1ib2R5Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctbGVmdC00IGdvdnVrLSEtcGFkZGluZy1yaWdodC00IGdvdnVrLSEtcGFkZGluZy1ib3R0b20tNCc+XG4gICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZseW91dFxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1EYXRhIChmb3JtKSB7XG4gIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICBjb25zdCBkYXRhID0ge1xuICAgIG9wdGlvbnM6IHt9LFxuICAgIHNjaGVtYToge31cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhc3QgKG5hbWUsIHZhbCkge1xuICAgIGNvbnN0IGVsID0gZm9ybS5lbGVtZW50c1tuYW1lXVxuICAgIGNvbnN0IGNhc3QgPSBlbCAmJiBlbC5kYXRhc2V0LmNhc3RcblxuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGNhc3QgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gTnVtYmVyKHZhbClcbiAgICB9IGVsc2UgaWYgKGNhc3QgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHZhbCA9PT0gJ29uJ1xuICAgIH1cblxuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICBjb25zdCBvcHRpb25zUHJlZml4ID0gJ29wdGlvbnMuJ1xuICAgIGNvbnN0IHNjaGVtYVByZWZpeCA9ICdzY2hlbWEuJ1xuXG4gICAgdmFsdWUgPSB2YWx1ZS50cmltKClcblxuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG9wdGlvbnNQcmVmaXgpKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGAke29wdGlvbnNQcmVmaXh9cmVxdWlyZWRgICYmIHZhbHVlID09PSAnb24nKSB7XG4gICAgICAgICAgZGF0YS5vcHRpb25zLnJlcXVpcmVkID0gZmFsc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLm9wdGlvbnNba2V5LnN1YnN0cihvcHRpb25zUHJlZml4Lmxlbmd0aCldID0gY2FzdChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleS5zdGFydHNXaXRoKHNjaGVtYVByZWZpeCkpIHtcbiAgICAgICAgZGF0YS5zY2hlbWFba2V5LnN1YnN0cihzY2hlbWFQcmVmaXgubGVuZ3RoKV0gPSBjYXN0KGtleSwgdmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIENsZWFudXBcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLnNjaGVtYSkubGVuZ3RoKSBkZWxldGUgZGF0YS5zY2hlbWFcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLm9wdGlvbnMpLmxlbmd0aCkgZGVsZXRlIGRhdGEub3B0aW9uc1xuXG4gIHJldHVybiBkYXRhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZSAob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld1BhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBwYXRoQ2hhbmdlZCA9IG5ld1BhdGggIT09IHBhZ2UucGF0aFxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlc1tkYXRhLnBhZ2VzLmluZGV4T2YocGFnZSldXG5cbiAgICBpZiAocGF0aENoYW5nZWQpIHtcbiAgICAgIC8vIGBwYXRoYCBoYXMgY2hhbmdlZCAtIHZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgICAgaWYgKGRhdGEucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gbmV3UGF0aCkpIHtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke25ld1BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29weVBhZ2UucGF0aCA9IG5ld1BhdGhcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBwYWdlXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHAubmV4dCkpIHtcbiAgICAgICAgICBwLm5leHQuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgIGlmIChuLnBhdGggPT09IHBhZ2UucGF0aCkge1xuICAgICAgICAgICAgICBuLnBhdGggPSBuZXdQYXRoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIGNvcHlQYWdlLnRpdGxlID0gdGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlQYWdlLnRpdGxlXG4gICAgfVxuXG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIGNvcHlQYWdlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjb3B5UGFnZS5zZWN0aW9uXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2VJZHggPSBjb3B5LnBhZ2VzLmZpbmRJbmRleChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBsaW5rcyB0byB0aGUgcGFnZVxuICAgIGNvcHkucGFnZXMuZm9yRWFjaCgocCwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChpbmRleCAhPT0gY29weVBhZ2VJZHggJiYgQXJyYXkuaXNBcnJheShwLm5leHQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBwLm5leHQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gcC5uZXh0W2ldXG4gICAgICAgICAgaWYgKG5leHQucGF0aCA9PT0gcGFnZS5wYXRoKSB7XG4gICAgICAgICAgICBwLm5leHQuc3BsaWNlKGksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIFJlbW92ZSB0aGUgcGFnZSBpdHNlbGZcbiAgICBjb3B5LnBhZ2VzLnNwbGljZShjb3B5UGFnZUlkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIC8vIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3BhZ2UucGF0aH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGUudGFyZ2V0LnNldEN1c3RvbVZhbGlkaXR5KCcnKX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXRpdGxlJz5UaXRsZSAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0ncGFnZS10aXRsZS1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgSWYgbm90IHN1cHBsaWVkLCB0aGUgdGl0bGUgb2YgdGhlIGZpcnN0IHF1ZXN0aW9uIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17cGFnZS50aXRsZX0gYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJyBkZWZhdWx0VmFsdWU9e3BhZ2Uuc2VjdGlvbn0+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7c2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gKDxvcHRpb24ga2V5PXtzZWN0aW9uLm5hbWV9IHZhbHVlPXtzZWN0aW9uLm5hbWV9PntzZWN0aW9uLnRpdGxlfTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlRWRpdFxuIiwiY29uc3QgY29tcG9uZW50VHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAnVGV4dEZpZWxkJyxcbiAgICB0aXRsZTogJ1RleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdNdWx0aWxpbmVUZXh0RmllbGQnLFxuICAgIHRpdGxlOiAnTXVsdGlsaW5lIHRleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdZZXNOb0ZpZWxkJyxcbiAgICB0aXRsZTogJ1llcy9ObyBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVGaWVsZCcsXG4gICAgdGl0bGU6ICdEYXRlIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ1RpbWUgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgdGltZSBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVQYXJ0c0ZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgcGFydHMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZVBhcnRzRmllbGQnLFxuICAgIHRpdGxlOiAnRGF0ZSB0aW1lIHBhcnRzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnU2VsZWN0RmllbGQnLFxuICAgIHRpdGxlOiAnU2VsZWN0IGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUmFkaW9zRmllbGQnLFxuICAgIHRpdGxlOiAnUmFkaW9zIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQ2hlY2tib3hlc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0NoZWNrYm94ZXMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdOdW1iZXJGaWVsZCcsXG4gICAgdGl0bGU6ICdOdW1iZXIgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdVa0FkZHJlc3NGaWVsZCcsXG4gICAgdGl0bGU6ICdVayBhZGRyZXNzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGVsZXBob25lTnVtYmVyRmllbGQnLFxuICAgIHRpdGxlOiAnVGVsZXBob25lIG51bWJlciBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0VtYWlsQWRkcmVzc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0VtYWlsIGFkZHJlc3MgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdQYXJhJyxcbiAgICB0aXRsZTogJ1BhcmFncmFwaCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnSW5zZXRUZXh0JyxcbiAgICB0aXRsZTogJ0luc2V0IHRleHQnLFxuICAgIHN1YlR5cGU6ICdjb250ZW50J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RldGFpbHMnLFxuICAgIHRpdGxlOiAnRGV0YWlscycsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH1cbl1cblxuZXhwb3J0IGRlZmF1bHQgY29tcG9uZW50VHlwZXNcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IGNvbXBvbmVudFR5cGVzIGZyb20gJy4uL2NvbXBvbmVudC10eXBlcy5qcydcblxuZnVuY3Rpb24gQ2xhc3NlcyAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMuY2xhc3Nlcyc+Q2xhc3NlczwvbGFiZWw+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPkFkZGl0aW9uYWwgQ1NTIGNsYXNzZXMgdG8gYWRkIHRvIHRoZSBmaWVsZDxiciAvPlxuICAgICAgRS5nLiBnb3Z1ay1pbnB1dC0td2lkdGgtMiwgZ292dWstaW5wdXQtLXdpZHRoLTQsIGdvdnVrLWlucHV0LS13aWR0aC0xMCwgZ292dWstIS13aWR0aC1vbmUtaGFsZiwgZ292dWstIS13aWR0aC10d28tdGhpcmRzLCBnb3Z1ay0hLXdpZHRoLXRocmVlLXF1YXJ0ZXJzPC9zcGFuPlxuICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmNsYXNzZXMnIG5hbWU9J29wdGlvbnMuY2xhc3NlcycgdHlwZT0ndGV4dCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmNsYXNzZXN9IC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0yMCcgaWQ9J2ZpZWxkLW5hbWUnXG4gICAgICAgICAgbmFtZT0nbmFtZScgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnIC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC10aXRsZScgbmFtZT0ndGl0bGUnIHR5cGU9J3RleHQnXG4gICAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQudGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtaGludCc+SGludCAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC1oaW50JyBuYW1lPSdoaW50JyB0eXBlPSd0ZXh0J1xuICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LmhpbnR9IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXMgZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pdGVtJz5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pbnB1dCcgaWQ9J2ZpZWxkLW9wdGlvbnMucmVxdWlyZWQnXG4gICAgICAgICAgICBuYW1lPSdvcHRpb25zLnJlcXVpcmVkJyB0eXBlPSdjaGVja2JveCcgZGVmYXVsdENoZWNrZWQ9e29wdGlvbnMucmVxdWlyZWQgPT09IGZhbHNlfSAvPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWNoZWNrYm94ZXNfX2xhYmVsJ1xuICAgICAgICAgICAgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5yZXF1aXJlZCc+T3B0aW9uYWw8L2xhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7cHJvcHMuY2hpbGRyZW59XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gVGV4dEZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IHNjaGVtYSA9IGNvbXBvbmVudC5zY2hlbWEgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRldGFpbHMgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzJz5cbiAgICAgICAgPHN1bW1hcnkgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5Jz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnktdGV4dCc+bW9yZTwvc3Bhbj5cbiAgICAgICAgPC9zdW1tYXJ5PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1heCc+TWF4IGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5tYXgnIG5hbWU9J3NjaGVtYS5tYXgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5tYXh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWluJz5NaW4gbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWluaW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1pbicgbmFtZT0nc2NoZW1hLm1pbidcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1pbn0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5sZW5ndGgnPkxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIGV4YWN0IHRleHQgbGVuZ3RoPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubGVuZ3RoJyBuYW1lPSdzY2hlbWEubGVuZ3RoJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubGVuZ3RofSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kZXRhaWxzPlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIE11bHRpbGluZVRleHRGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBzY2hlbWEgPSBjb21wb25lbnQuc2NoZW1hIHx8IHt9XG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGV0YWlscyBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHMnPlxuICAgICAgICA8c3VtbWFyeSBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnknPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeS10ZXh0Jz5tb3JlPC9zcGFuPlxuICAgICAgICA8L3N1bW1hcnk+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWF4Jz5NYXggbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWF4aW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1heCcgbmFtZT0nc2NoZW1hLm1heCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1heH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5taW4nPk1pbiBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtaW5pbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWluJyBuYW1lPSdzY2hlbWEubWluJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWlufSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5yb3dzJz5Sb3dzPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgaWQ9J2ZpZWxkLW9wdGlvbnMucm93cycgbmFtZT0nb3B0aW9ucy5yb3dzJyB0eXBlPSd0ZXh0J1xuICAgICAgICAgICAgZGF0YS1jYXN0PSdudW1iZXInIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5yb3dzfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBOdW1iZXJGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBzY2hlbWEgPSBjb21wb25lbnQuc2NoZW1hIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkZXRhaWxzIGNsYXNzTmFtZT0nZ292dWstZGV0YWlscyc+XG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeSc+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5LXRleHQnPm1vcmU8L3NwYW4+XG4gICAgICAgIDwvc3VtbWFyeT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5taW4nPk1pbjwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1pbmltdW0gdmFsdWU8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5taW4nIG5hbWU9J3NjaGVtYS5taW4nXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5taW59IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWF4Jz5NYXg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtYXhpbXVtIHZhbHVlPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWF4JyBuYW1lPSdzY2hlbWEubWF4J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWF4fSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pdGVtJz5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2lucHV0JyBpZD0nZmllbGQtc2NoZW1hLmludGVnZXInIGRhdGEtY2FzdD0nYm9vbGVhbidcbiAgICAgICAgICAgICAgbmFtZT0nc2NoZW1hLmludGVnZXInIHR5cGU9J2NoZWNrYm94JyBkZWZhdWx0Q2hlY2tlZD17c2NoZW1hLmludGVnZXIgPT09IHRydWV9IC8+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1jaGVja2JveGVzX19sYWJlbCdcbiAgICAgICAgICAgICAgaHRtbEZvcj0nZmllbGQtc2NoZW1hLmludGVnZXInPkludGVnZXI8L2xhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gUmFkaW9zRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG4gIGNvbnN0IGxpc3RzID0gZGF0YS5saXN0c1xuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMubGlzdCc+TGlzdDwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCBnb3Z1ay1pbnB1dC0td2lkdGgtMTAnIGlkPSdmaWVsZC1vcHRpb25zLmxpc3QnIG5hbWU9J29wdGlvbnMubGlzdCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5saXN0fSByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtsaXN0cy5tYXAobGlzdCA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiA8b3B0aW9uIGtleT17bGlzdC5uYW1lfSB2YWx1ZT17bGlzdC5uYW1lfT57bGlzdC50aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gUGFyYUVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J3BhcmEtY29udGVudCc+Q29udGVudDwvbGFiZWw+XG4gICAgICA8dGV4dGFyZWEgY2xhc3NOYW1lPSdnb3Z1ay10ZXh0YXJlYScgaWQ9J3BhcmEtY29udGVudCcgbmFtZT0nY29udGVudCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQuY29udGVudH0gcm93cz0nMTAnIHJlcXVpcmVkIC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuY29uc3QgSW5zZXRUZXh0RWRpdCA9IFBhcmFFZGl0XG5cbmZ1bmN0aW9uIERldGFpbHNFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J2RldGFpbHMtdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdkZXRhaWxzLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsJyBodG1sRm9yPSdkZXRhaWxzLWNvbnRlbnQnPkNvbnRlbnQ8L2xhYmVsPlxuICAgICAgICA8dGV4dGFyZWEgY2xhc3NOYW1lPSdnb3Z1ay10ZXh0YXJlYScgaWQ9J2RldGFpbHMtY29udGVudCcgbmFtZT0nY29udGVudCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5jb250ZW50fSByb3dzPScxMCcgcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmNvbnN0IGNvbXBvbmVudFR5cGVFZGl0b3JzID0ge1xuICAnVGV4dEZpZWxkRWRpdCc6IFRleHRGaWVsZEVkaXQsXG4gICdFbWFpbEFkZHJlc3NGaWVsZEVkaXQnOiBUZXh0RmllbGRFZGl0LFxuICAnVGVsZXBob25lTnVtYmVyRmllbGRFZGl0JzogVGV4dEZpZWxkRWRpdCxcbiAgJ051bWJlckZpZWxkRWRpdCc6IE51bWJlckZpZWxkRWRpdCxcbiAgJ011bHRpbGluZVRleHRGaWVsZEVkaXQnOiBNdWx0aWxpbmVUZXh0RmllbGRFZGl0LFxuICAnU2VsZWN0RmllbGRFZGl0JzogU2VsZWN0RmllbGRFZGl0LFxuICAnUmFkaW9zRmllbGRFZGl0JzogUmFkaW9zRmllbGRFZGl0LFxuICAnQ2hlY2tib3hlc0ZpZWxkRWRpdCc6IENoZWNrYm94ZXNGaWVsZEVkaXQsXG4gICdQYXJhRWRpdCc6IFBhcmFFZGl0LFxuICAnSW5zZXRUZXh0RWRpdCc6IEluc2V0VGV4dEVkaXQsXG4gICdEZXRhaWxzRWRpdCc6IERldGFpbHNFZGl0XG59XG5cbmNsYXNzIENvbXBvbmVudFR5cGVFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgdHlwZSA9IGNvbXBvbmVudFR5cGVzLmZpbmQodCA9PiB0Lm5hbWUgPT09IGNvbXBvbmVudC50eXBlKVxuICAgIGlmICghdHlwZSkge1xuICAgICAgcmV0dXJuICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IFRhZ05hbWUgPSBjb21wb25lbnRUeXBlRWRpdG9yc1tgJHtjb21wb25lbnQudHlwZX1FZGl0YF0gfHwgRmllbGRFZGl0XG4gICAgICByZXR1cm4gPFRhZ05hbWUgY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudFR5cGVFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lLCBnZXRGb3JtRGF0YSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBDb21wb25lbnRUeXBlRWRpdCBmcm9tICcuL2NvbXBvbmVudC10eXBlLWVkaXQnXG5cbmNsYXNzIENvbXBvbmVudEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGZvcm1EYXRhID0gZ2V0Rm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gQXBwbHlcbiAgICBjb25zdCBjb21wb25lbnRJbmRleCA9IHBhZ2UuY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudClcbiAgICBjb3B5UGFnZS5jb21wb25lbnRzW2NvbXBvbmVudEluZGV4XSA9IGZvcm1EYXRhXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlLCBjb21wb25lbnQgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb21wb25lbnRJZHggPSBwYWdlLmNvbXBvbmVudHMuZmluZEluZGV4KGMgPT4gYyA9PT0gY29tcG9uZW50KVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBpc0xhc3QgPSBjb21wb25lbnRJZHggPT09IHBhZ2UuY29tcG9uZW50cy5sZW5ndGggLSAxXG5cbiAgICAvLyBSZW1vdmUgdGhlIGNvbXBvbmVudFxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMuc3BsaWNlKGNvbXBvbmVudElkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIGlmICghaXNMYXN0KSB7XG4gICAgICAgICAgLy8gV2UgZG9udCBoYXZlIGFuIGlkIHdlIGNhbiB1c2UgZm9yIGBrZXlgLWluZyByZWFjdCA8Q29tcG9uZW50IC8+J3NcbiAgICAgICAgICAvLyBXZSB0aGVyZWZvcmUgbmVlZCB0byBjb25kaXRpb25hbGx5IHJlcG9ydCBgb25FZGl0YCBjaGFuZ2VzLlxuICAgICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBjb21wb25lbnQsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHlDb21wID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb21wb25lbnQpKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxmb3JtIGF1dG9Db21wbGV0ZT0nb2ZmJyBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSd0eXBlJz5UeXBlPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5Jz57Y29tcG9uZW50LnR5cGV9PC9zcGFuPlxuICAgICAgICAgICAgPGlucHV0IGlkPSd0eXBlJyB0eXBlPSdoaWRkZW4nIG5hbWU9J3R5cGUnIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LnR5cGV9IC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8Q29tcG9uZW50VHlwZUVkaXRcbiAgICAgICAgICAgIHBhZ2U9e3BhZ2V9XG4gICAgICAgICAgICBjb21wb25lbnQ9e2NvcHlDb21wfVxuICAgICAgICAgICAgZGF0YT17ZGF0YX0gLz5cblxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50RWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0IFNvcnRhYmxlSE9DICovXG5cbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgQ29tcG9uZW50RWRpdCBmcm9tICcuL2NvbXBvbmVudC1lZGl0J1xuY29uc3QgU29ydGFibGVIYW5kbGUgPSBTb3J0YWJsZUhPQy5Tb3J0YWJsZUhhbmRsZVxuY29uc3QgRHJhZ0hhbmRsZSA9IFNvcnRhYmxlSGFuZGxlKCgpID0+IDxzcGFuIGNsYXNzTmFtZT0nZHJhZy1oYW5kbGUnPiYjOTc3Njs8L3NwYW4+KVxuXG5leHBvcnQgY29uc3QgY29tcG9uZW50VHlwZXMgPSB7XG4gICdUZXh0RmllbGQnOiBUZXh0RmllbGQsXG4gICdUZWxlcGhvbmVOdW1iZXJGaWVsZCc6IFRlbGVwaG9uZU51bWJlckZpZWxkLFxuICAnTnVtYmVyRmllbGQnOiBOdW1iZXJGaWVsZCxcbiAgJ0VtYWlsQWRkcmVzc0ZpZWxkJzogRW1haWxBZGRyZXNzRmllbGQsXG4gICdUaW1lRmllbGQnOiBUaW1lRmllbGQsXG4gICdEYXRlRmllbGQnOiBEYXRlRmllbGQsXG4gICdEYXRlVGltZUZpZWxkJzogRGF0ZVRpbWVGaWVsZCxcbiAgJ0RhdGVQYXJ0c0ZpZWxkJzogRGF0ZVBhcnRzRmllbGQsXG4gICdEYXRlVGltZVBhcnRzRmllbGQnOiBEYXRlVGltZVBhcnRzRmllbGQsXG4gICdNdWx0aWxpbmVUZXh0RmllbGQnOiBNdWx0aWxpbmVUZXh0RmllbGQsXG4gICdSYWRpb3NGaWVsZCc6IFJhZGlvc0ZpZWxkLFxuICAnQ2hlY2tib3hlc0ZpZWxkJzogQ2hlY2tib3hlc0ZpZWxkLFxuICAnU2VsZWN0RmllbGQnOiBTZWxlY3RGaWVsZCxcbiAgJ1llc05vRmllbGQnOiBZZXNOb0ZpZWxkLFxuICAnVWtBZGRyZXNzRmllbGQnOiBVa0FkZHJlc3NGaWVsZCxcbiAgJ1BhcmEnOiBQYXJhLFxuICAnSW5zZXRUZXh0JzogSW5zZXRUZXh0LFxuICAnRGV0YWlscyc6IERldGFpbHNcbn1cblxuZnVuY3Rpb24gQmFzZSAocHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvZGl2PlxuICApXG59XG5cbmZ1bmN0aW9uIENvbXBvbmVudEZpZWxkIChwcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZXh0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3gnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZWxlcGhvbmVOdW1iZXJGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCB0ZWwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBFbWFpbEFkZHJlc3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBlbWFpbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFVrQWRkcmVzc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCcgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYnV0dG9uIHNxdWFyZScgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIE11bHRpbGluZVRleHRGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggdGFsbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIE51bWJlckZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94IG51bWJlcicgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBkcm9wZG93bic+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+ZGQvbW0veXl5eTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVRpbWVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBsYXJnZSBkcm9wZG93bic+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+ZGQvbW0veXl5eSBoaDptbTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gVGltZUZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94Jz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5IGdvdnVrLSEtZm9udC1zaXplLTE0Jz5oaDptbTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVRpbWVQYXJ0c0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCcgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsIGdvdnVrLSEtbWFyZ2luLWxlZnQtMSBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggbWVkaXVtIGdvdnVrLSEtbWFyZ2luLXJpZ2h0LTEnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEYXRlUGFydHNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1sZWZ0LTEgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IG1lZGl1bScgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFJhZGlvc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaGVjaycgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NoZWNrJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2hlY2snIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBkcm9wZG93bicgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFllc05vRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGV0YWlscyAoKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICB7YOKWtiBgfTxzcGFuIGNsYXNzTmFtZT0nbGluZSBkZXRhaWxzJyAvPlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBJbnNldFRleHQgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2luc2V0IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTInPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUgc2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTIgZ292dWstIS1tYXJnaW4tdG9wLTInIC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9CYXNlPlxuICApXG59XG5cbmZ1bmN0aW9uIFBhcmEgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUnIC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZSBzaG9ydCBnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMiBnb3Z1ay0hLW1hcmdpbi10b3AtMicgLz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIHNob3dFZGl0b3IgPSAoZSwgdmFsdWUpID0+IHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IHZhbHVlIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSwgY29tcG9uZW50IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgVGFnTmFtZSA9IGNvbXBvbmVudFR5cGVzW2Ake2NvbXBvbmVudC50eXBlfWBdXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudCBnb3Z1ay0hLXBhZGRpbmctMidcbiAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gdGhpcy5zaG93RWRpdG9yKGUsIHRydWUpfT5cbiAgICAgICAgICA8RHJhZ0hhbmRsZSAvPlxuICAgICAgICAgIDxUYWdOYW1lIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IENvbXBvbmVudCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfVxuICAgICAgICAgIG9uSGlkZT17ZSA9PiB0aGlzLnNob3dFZGl0b3IoZSwgZmFsc2UpfT5cbiAgICAgICAgICA8Q29tcG9uZW50RWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0gcGFnZT17cGFnZX0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lLCBnZXRGb3JtRGF0YSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBDb21wb25lbnRUeXBlRWRpdCBmcm9tICcuL2NvbXBvbmVudC10eXBlLWVkaXQnXG4vLyBpbXBvcnQgeyBjb21wb25lbnRUeXBlcyBhcyBjb21wb25lbnRUeXBlc0ljb25zIH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuXG5jbGFzcyBDb21wb25lbnRDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBmb3JtRGF0YSA9IGdldEZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcblxuICAgIC8vIEFwcGx5XG4gICAgY29weVBhZ2UuY29tcG9uZW50cy5wdXNoKGZvcm1EYXRhKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3R5cGUnPlR5cGU8L2xhYmVsPlxuICAgICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J3R5cGUnIG5hbWU9J3R5cGUnIHJlcXVpcmVkXG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBjb21wb25lbnQ6IHsgdHlwZTogZS50YXJnZXQudmFsdWUgfSB9KX0+XG4gICAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgICAge2NvbXBvbmVudFR5cGVzLm1hcCh0eXBlID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e3R5cGUubmFtZX0gdmFsdWU9e3R5cGUubmFtZX0+e3R5cGUudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICB7Lyoge09iamVjdC5rZXlzKGNvbXBvbmVudFR5cGVzSWNvbnMpLm1hcCh0eXBlID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgVGFnID0gY29tcG9uZW50VHlwZXNJY29uc1t0eXBlXVxuICAgICAgICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudCBnb3Z1ay0hLXBhZGRpbmctMic+PFRhZyAvPjwvZGl2PlxuICAgICAgICAgICAgfSl9ICovfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAge3RoaXMuc3RhdGUuY29tcG9uZW50ICYmIHRoaXMuc3RhdGUuY29tcG9uZW50LnR5cGUgJiYgKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPENvbXBvbmVudFR5cGVFZGl0XG4gICAgICAgICAgICAgICAgcGFnZT17cGFnZX1cbiAgICAgICAgICAgICAgICBjb21wb25lbnQ9e3RoaXMuc3RhdGUuY29tcG9uZW50fVxuICAgICAgICAgICAgICAgIGRhdGE9e2RhdGF9IC8+XG5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPSdzdWJtaXQnIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJz5TYXZlPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnRDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCBTb3J0YWJsZUhPQyAqL1xuXG5pbXBvcnQgRmx5b3V0IGZyb20gJy4vZmx5b3V0J1xuaW1wb3J0IFBhZ2VFZGl0IGZyb20gJy4vcGFnZS1lZGl0J1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgQ29tcG9uZW50Q3JlYXRlIGZyb20gJy4vY29tcG9uZW50LWNyZWF0ZSdcbmltcG9ydCBjb21wb25lbnRUeXBlcyBmcm9tICcuLi9jb21wb25lbnQtdHlwZXMuanMnXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY29uc3QgU29ydGFibGVFbGVtZW50ID0gU29ydGFibGVIT0MuU29ydGFibGVFbGVtZW50XG5jb25zdCBTb3J0YWJsZUNvbnRhaW5lciA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlQ29udGFpbmVyXG5jb25zdCBhcnJheU1vdmUgPSBTb3J0YWJsZUhPQy5hcnJheU1vdmVcblxuY29uc3QgU29ydGFibGVJdGVtID0gU29ydGFibGVFbGVtZW50KCh7IGluZGV4LCBwYWdlLCBjb21wb25lbnQsIGRhdGEgfSkgPT5cbiAgPGRpdiBjbGFzcz0nY29tcG9uZW50LWl0ZW0nPlxuICAgIDxDb21wb25lbnQga2V5PXtpbmRleH0gcGFnZT17cGFnZX0gY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gIDwvZGl2PlxuKVxuXG5jb25zdCBTb3J0YWJsZUxpc3QgPSBTb3J0YWJsZUNvbnRhaW5lcigoeyBwYWdlLCBkYXRhIH0pID0+IHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzPSdjb21wb25lbnQtbGlzdCc+XG4gICAgICB7cGFnZS5jb21wb25lbnRzLm1hcCgoY29tcG9uZW50LCBpbmRleCkgPT4gKFxuICAgICAgICA8U29ydGFibGVJdGVtIGtleT17aW5kZXh9IGluZGV4PXtpbmRleH0gcGFnZT17cGFnZX0gY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gICAgICApKX1cbiAgICA8L2Rpdj5cbiAgKVxufSlcblxuY2xhc3MgUGFnZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBzaG93RWRpdG9yID0gKGUsIHZhbHVlKSA9PiB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKVxuICAgIHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiB2YWx1ZSB9KVxuICB9XG5cbiAgb25Tb3J0RW5kID0gKHsgb2xkSW5kZXgsIG5ld0luZGV4IH0pID0+IHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMgPSBhcnJheU1vdmUoY29weVBhZ2UuY29tcG9uZW50cywgb2xkSW5kZXgsIG5ld0luZGV4KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG5cbiAgICAvLyBPUFRJTUlTVElDIFNBVkUgVE8gU1RPUCBKVU1QXG5cbiAgICAvLyBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICAvLyBwYWdlLmNvbXBvbmVudHMgPSBhcnJheU1vdmUocGFnZS5jb21wb25lbnRzLCBvbGRJbmRleCwgbmV3SW5kZXgpXG5cbiAgICAvLyBkYXRhLnNhdmUoZGF0YSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBzZWN0aW9ucyB9ID0gZGF0YVxuICAgIGNvbnN0IGZvcm1Db21wb25lbnRzID0gcGFnZS5jb21wb25lbnRzLmZpbHRlcihjb21wID0+IGNvbXBvbmVudFR5cGVzLmZpbmQodHlwZSA9PiB0eXBlLm5hbWUgPT09IGNvbXAudHlwZSkuc3ViVHlwZSA9PT0gJ2ZpZWxkJylcbiAgICBjb25zdCBwYWdlVGl0bGUgPSBwYWdlLnRpdGxlIHx8IChmb3JtQ29tcG9uZW50cy5sZW5ndGggPT09IDEgJiYgcGFnZS5jb21wb25lbnRzWzBdID09PSBmb3JtQ29tcG9uZW50c1swXSA/IGZvcm1Db21wb25lbnRzWzBdLnRpdGxlIDogcGFnZS50aXRsZSlcbiAgICBjb25zdCBzZWN0aW9uID0gcGFnZS5zZWN0aW9uICYmIHNlY3Rpb25zLmZpbmQoc2VjdGlvbiA9PiBzZWN0aW9uLm5hbWUgPT09IHBhZ2Uuc2VjdGlvbilcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFnZSB4dG9vbHRpcCcgc3R5bGU9e3RoaXMucHJvcHMubGF5b3V0fT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2hhbmRsZScgb25DbGljaz17KGUpID0+IHRoaXMuc2hvd0VkaXRvcihlLCB0cnVlKX0gLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtcGFkZGluZy10b3AtMiBnb3Z1ay0hLXBhZGRpbmctbGVmdC0yIGdvdnVrLSEtcGFkZGluZy1yaWdodC0yJz5cblxuICAgICAgICAgIDxoMyBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctcyc+XG4gICAgICAgICAgICB7c2VjdGlvbiAmJiA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWNhcHRpb24tbSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+e3NlY3Rpb24udGl0bGV9PC9zcGFuPn1cbiAgICAgICAgICAgIHtwYWdlVGl0bGV9XG4gICAgICAgICAgPC9oMz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPFNvcnRhYmxlTGlzdCBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfSBwcmVzc0RlbGF5PXsyMDB9XG4gICAgICAgICAgb25Tb3J0RW5kPXt0aGlzLm9uU29ydEVuZH0gbG9ja0F4aXM9J3knIGhlbHBlckNsYXNzPSdkcmFnZ2luZydcbiAgICAgICAgICBsb2NrVG9Db250YWluZXJFZGdlcyB1c2VEcmFnSGFuZGxlIC8+XG4gICAgICAgIHsvKiB7cGFnZS5jb21wb25lbnRzLm1hcCgoY29tcCwgaW5kZXgpID0+IChcbiAgICAgICAgICA8Q29tcG9uZW50IGtleT17aW5kZXh9IHBhZ2U9e3BhZ2V9IGNvbXBvbmVudD17Y29tcH0gZGF0YT17ZGF0YX0gLz5cbiAgICAgICAgKSl9ICovfVxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctMic+XG4gICAgICAgICAgPGEgY2xhc3NOYW1lPSdwcmV2aWV3IHB1bGwtcmlnaHQgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICAgIGhyZWY9e3BhZ2UucGF0aH0gdGFyZ2V0PSdwcmV2aWV3Jz5PcGVuPC9hPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdidXR0b24gYWN0aXZlJ1xuICAgICAgICAgICAgb25DbGljaz17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogdHJ1ZSB9KX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBQYWdlJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0b3J9XG4gICAgICAgICAgb25IaWRlPXtlID0+IHRoaXMuc2hvd0VkaXRvcihlLCBmYWxzZSl9PlxuICAgICAgICAgIDxQYWdlRWRpdCBwYWdlPXtwYWdlfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIENvbXBvbmVudCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93QWRkQ29tcG9uZW50fVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRDb21wb25lbnQ6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8Q29tcG9uZW50Q3JlYXRlIHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkNyZWF0ZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFBhZ2VcbiIsIlxuZnVuY3Rpb24gY29tcG9uZW50VG9TdHJpbmcgKGNvbXBvbmVudCkge1xuICByZXR1cm4gYCR7Y29tcG9uZW50LnR5cGV9YFxufVxuXG5mdW5jdGlvbiBEYXRhTW9kZWwgKHByb3BzKSB7XG4gIGNvbnN0IHsgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3QgeyBzZWN0aW9ucywgcGFnZXMgfSA9IGRhdGFcblxuICBjb25zdCBtb2RlbCA9IHt9XG5cbiAgcGFnZXMuZm9yRWFjaChwYWdlID0+IHtcbiAgICBwYWdlLmNvbXBvbmVudHMuZm9yRWFjaChjb21wb25lbnQgPT4ge1xuICAgICAgaWYgKGNvbXBvbmVudC5uYW1lKSB7XG4gICAgICAgIGlmIChwYWdlLnNlY3Rpb24pIHtcbiAgICAgICAgICBjb25zdCBzZWN0aW9uID0gc2VjdGlvbnMuZmluZChzZWN0aW9uID0+IHNlY3Rpb24ubmFtZSA9PT0gcGFnZS5zZWN0aW9uKVxuICAgICAgICAgIGlmICghbW9kZWxbc2VjdGlvbi5uYW1lXSkge1xuICAgICAgICAgICAgbW9kZWxbc2VjdGlvbi5uYW1lXSA9IHt9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbW9kZWxbc2VjdGlvbi5uYW1lXVtjb21wb25lbnQubmFtZV0gPSBjb21wb25lbnRUb1N0cmluZyhjb21wb25lbnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kZWxbY29tcG9uZW50Lm5hbWVdID0gY29tcG9uZW50VG9TdHJpbmcoY29tcG9uZW50KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPScnPlxuICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkobW9kZWwsIG51bGwsIDIpfTwvcHJlPlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IERhdGFNb2RlbFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgUGFnZUNyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IHBhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIC8vIFZhbGlkYXRlXG4gICAgaWYgKGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gcGF0aCkpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMucGF0aC5zZXRDdXN0b21WYWxpZGl0eShgUGF0aCAnJHtwYXRofScgYWxyZWFkeSBleGlzdHNgKVxuICAgICAgZm9ybS5yZXBvcnRWYWxpZGl0eSgpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB2YWx1ZSA9IHtcbiAgICAgIHBhdGg6IHBhdGhcbiAgICB9XG5cbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIHZhbHVlLnRpdGxlID0gdGl0bGVcbiAgICB9XG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIHZhbHVlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfVxuXG4gICAgLy8gQXBwbHlcbiAgICBPYmplY3QuYXNzaWduKHZhbHVlLCB7XG4gICAgICBjb21wb25lbnRzOiBbXSxcbiAgICAgIG5leHQ6IFtdXG4gICAgfSlcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29weS5wYWdlcy5wdXNoKHZhbHVlKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IHZhbHVlIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIC8vIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgLy8gICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gIC8vICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gIC8vICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gIC8vICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gIC8vICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgLy8gICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBMaXN0ICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gIC8vICAgfSBlbHNlIHtcbiAgLy8gICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAvLyAgIH1cbiAgLy8gfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBzZWN0aW9ucyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXBhdGgnPlBhdGg8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0ncGFnZS1wYXRoJyBuYW1lPSdwYXRoJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWRcbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGUudGFyZ2V0LnNldEN1c3RvbVZhbGlkaXR5KCcnKX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXRpdGxlJz5UaXRsZSAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0ncGFnZS10aXRsZS1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgSWYgbm90IHN1cHBsaWVkLCB0aGUgdGl0bGUgb2YgdGhlIGZpcnN0IHF1ZXN0aW9uIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGFyaWEtZGVzY3JpYmVkYnk9J3BhZ2UtdGl0bGUtaGludCcgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXNlY3Rpb24nPlNlY3Rpb24gKG9wdGlvbmFsKTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J3BhZ2Utc2VjdGlvbicgbmFtZT0nc2VjdGlvbic+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7c2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gKDxvcHRpb24ga2V5PXtzZWN0aW9uLm5hbWV9IHZhbHVlPXtzZWN0aW9uLm5hbWV9PntzZWN0aW9uLnRpdGxlfTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8YnV0dG9uIHR5cGU9J3N1Ym1pdCcgY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nPlNhdmU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGFnZUNyZWF0ZVxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgTGlua0VkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIGNvbnN0IHsgZGF0YSwgZWRnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHBhZ2UgPSBkYXRhLnBhZ2VzLmZpbmQocGFnZSA9PiBwYWdlLnBhdGggPT09IGVkZ2Uuc291cmNlKVxuICAgIGNvbnN0IGxpbmsgPSBwYWdlLm5leHQuZmluZChuID0+IG4ucGF0aCA9PT0gZWRnZS50YXJnZXQpXG5cbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgcGFnZTogcGFnZSxcbiAgICAgIGxpbms6IGxpbmtcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IGNvbmRpdGlvbiA9IGZvcm1EYXRhLmdldCgnaWYnKS50cmltKClcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IGxpbmssIHBhZ2UgfSA9IHRoaXMuc3RhdGVcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG4gICAgY29uc3QgY29weUxpbmsgPSBjb3B5UGFnZS5uZXh0LmZpbmQobiA9PiBuLnBhdGggPT09IGxpbmsucGF0aClcblxuICAgIGlmIChjb25kaXRpb24pIHtcbiAgICAgIGNvcHlMaW5rLmlmID0gY29uZGl0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjb3B5TGluay5pZlxuICAgIH1cblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkNsaWNrRGVsZXRlID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoIXdpbmRvdy5jb25maXJtKCdDb25maXJtIGRlbGV0ZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IGxpbmssIHBhZ2UgfSA9IHRoaXMuc3RhdGVcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG4gICAgY29uc3QgY29weUxpbmtJZHggPSBjb3B5UGFnZS5uZXh0LmZpbmRJbmRleChuID0+IG4ucGF0aCA9PT0gbGluay5wYXRoKVxuICAgIGNvcHlQYWdlLm5leHQuc3BsaWNlKGNvcHlMaW5rSWR4LCAxKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBsaW5rIH0gPSB0aGlzLnN0YXRlXG4gICAgY29uc3QgeyBkYXRhLCBlZGdlIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXNvdXJjZSc+RnJvbTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBkZWZhdWx0VmFsdWU9e2VkZ2Uuc291cmNlfSBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstc291cmNlJyBkaXNhYmxlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXRhcmdldCc+VG88L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgZGVmYXVsdFZhbHVlPXtlZGdlLnRhcmdldH0gY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaW5rLXRhcmdldCcgZGlzYWJsZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7cGFnZXMubWFwKHBhZ2UgPT4gKDxvcHRpb24ga2V5PXtwYWdlLnBhdGh9IHZhbHVlPXtwYWdlLnBhdGh9PntwYWdlLnBhdGh9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay1jb25kaXRpb24nPkNvbmRpdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0nbGluay1jb25kaXRpb24taGludCcgY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5cbiAgICAgICAgICAgIFRoZSBsaW5rIHdpbGwgb25seSBiZSB1c2VkIGlmIHRoZSBleHByZXNzaW9uIGV2YWx1YXRlcyB0byB0cnV0aHkuXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGluay1jb25kaXRpb24nIG5hbWU9J2lmJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtsaW5rLmlmfSBhcmlhLWRlc2NyaWJlZGJ5PSdsaW5rLWNvbmRpdGlvbi1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj57JyAnfVxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdidXR0b24nIG9uQ2xpY2s9e3RoaXMub25DbGlja0RlbGV0ZX0+RGVsZXRlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpbmtFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBMaW5rQ3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgZnJvbSA9IGZvcm1EYXRhLmdldCgncGF0aCcpXG4gICAgY29uc3QgdG8gPSBmb3JtRGF0YS5nZXQoJ3BhZ2UnKVxuICAgIGNvbnN0IGNvbmRpdGlvbiA9IGZvcm1EYXRhLmdldCgnaWYnKVxuXG4gICAgLy8gQXBwbHlcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBwYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBmcm9tKVxuXG4gICAgY29uc3QgbmV4dCA9IHsgcGF0aDogdG8gfVxuXG4gICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgbmV4dC5pZiA9IGNvbmRpdGlvblxuICAgIH1cblxuICAgIGlmICghcGFnZS5uZXh0KSB7XG4gICAgICBwYWdlLm5leHQgPSBbXVxuICAgIH1cblxuICAgIHBhZ2UubmV4dC5wdXNoKG5leHQpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlKHsgbmV4dCB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgcGFnZXMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay1zb3VyY2UnPkZyb208L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaW5rLXNvdXJjZScgbmFtZT0ncGF0aCcgcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7cGFnZXMubWFwKHBhZ2UgPT4gKDxvcHRpb24ga2V5PXtwYWdlLnBhdGh9IHZhbHVlPXtwYWdlLnBhdGh9PntwYWdlLnBhdGh9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay10YXJnZXQnPlRvPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGluay10YXJnZXQnIG5hbWU9J3BhZ2UnIHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3BhZ2VzLm1hcChwYWdlID0+ICg8b3B0aW9uIGtleT17cGFnZS5wYXRofSB2YWx1ZT17cGFnZS5wYXRofT57cGFnZS5wYXRofTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstY29uZGl0aW9uJz5Db25kaXRpb24gKG9wdGlvbmFsKTwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gaWQ9J2xpbmstY29uZGl0aW9uLWhpbnQnIGNsYXNzTmFtZT0nZ292dWstaGludCc+XG4gICAgICAgICAgICBUaGUgbGluayB3aWxsIG9ubHkgYmUgdXNlZCBpZiB0aGUgZXhwcmVzc2lvbiBldmFsdWF0ZXMgdG8gdHJ1dGh5LlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpbmstY29uZGl0aW9uJyBuYW1lPSdpZidcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGFyaWEtZGVzY3JpYmVkYnk9J2xpbmstY29uZGl0aW9uLWhpbnQnIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaW5rQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5mdW5jdGlvbiBoZWFkRHVwbGljYXRlIChhcnIpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICBmb3IgKGxldCBqID0gaSArIDE7IGogPCBhcnIubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChhcnJbal0gPT09IGFycltpXSkge1xuICAgICAgICByZXR1cm4galxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBMaXN0SXRlbXMgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgaXRlbXM6IHByb3BzLml0ZW1zID8gY2xvbmUocHJvcHMuaXRlbXMpIDogW11cbiAgICB9XG4gIH1cblxuICBvbkNsaWNrQWRkSXRlbSA9IGUgPT4ge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXRlbXM6IHRoaXMuc3RhdGUuaXRlbXMuY29uY2F0KHsgdGV4dDogJycsIHZhbHVlOiAnJyB9KVxuICAgIH0pXG4gIH1cblxuICByZW1vdmVJdGVtID0gaWR4ID0+IHtcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIGl0ZW1zOiB0aGlzLnN0YXRlLml0ZW1zLmZpbHRlcigocywgaSkgPT4gaSAhPT0gaWR4KVxuICAgIH0pXG4gIH1cblxuICBvbkNsaWNrRGVsZXRlID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoIXdpbmRvdy5jb25maXJtKCdDb25maXJtIGRlbGV0ZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIC8vIFJlbW92ZSB0aGUgbGlzdFxuICAgIGNvcHkubGlzdHMuc3BsaWNlKGRhdGEubGlzdHMuaW5kZXhPZihsaXN0KSwgMSlcblxuICAgIC8vIFVwZGF0ZSBhbnkgcmVmZXJlbmNlcyB0byB0aGUgbGlzdFxuICAgIGNvcHkucGFnZXMuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwLmxpc3QgPT09IGxpc3QubmFtZSkge1xuICAgICAgICBkZWxldGUgcC5saXN0XG4gICAgICB9XG4gICAgfSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkJsdXIgPSBlID0+IHtcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXQuZm9ybVxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IHRleHRzID0gZm9ybURhdGEuZ2V0QWxsKCd0ZXh0JykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29uc3QgdmFsdWVzID0gZm9ybURhdGEuZ2V0QWxsKCd2YWx1ZScpLm1hcCh0ID0+IHQudHJpbSgpKVxuXG4gICAgLy8gT25seSB2YWxpZGF0ZSBkdXBlcyBpZiB0aGVyZSBpcyBtb3JlIHRoYW4gb25lIGl0ZW1cbiAgICBpZiAodGV4dHMubGVuZ3RoIDwgMikge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgZm9ybS5lbGVtZW50cy50ZXh0LmZvckVhY2goZWwgPT4gZWwuc2V0Q3VzdG9tVmFsaWRpdHkoJycpKVxuICAgIGZvcm0uZWxlbWVudHMudmFsdWUuZm9yRWFjaChlbCA9PiBlbC5zZXRDdXN0b21WYWxpZGl0eSgnJykpXG5cbiAgICAvLyBWYWxpZGF0ZSB1bmlxdWVuZXNzXG4gICAgY29uc3QgZHVwZVRleHQgPSBoZWFkRHVwbGljYXRlKHRleHRzKVxuICAgIGlmIChkdXBlVGV4dCkge1xuICAgICAgZm9ybS5lbGVtZW50cy50ZXh0W2R1cGVUZXh0XS5zZXRDdXN0b21WYWxpZGl0eSgnRHVwbGljYXRlIHRleHRzIGZvdW5kIGluIHRoZSBsaXN0IGl0ZW1zJylcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IGR1cGVWYWx1ZSA9IGhlYWREdXBsaWNhdGUodmFsdWVzKVxuICAgIGlmIChkdXBlVmFsdWUpIHtcbiAgICAgIGZvcm0uZWxlbWVudHMudmFsdWVbZHVwZVZhbHVlXS5zZXRDdXN0b21WYWxpZGl0eSgnRHVwbGljYXRlIHZhbHVlcyBmb3VuZCBpbiB0aGUgbGlzdCBpdGVtcycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGl0ZW1zIH0gPSB0aGlzLnN0YXRlXG4gICAgY29uc3QgeyB0eXBlIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPHRhYmxlIGNsYXNzTmFtZT0nZ292dWstdGFibGUnPlxuICAgICAgICA8Y2FwdGlvbiBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19jYXB0aW9uJz5JdGVtczwvY2FwdGlvbj5cbiAgICAgICAgPHRoZWFkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWQnPlxuICAgICAgICAgIDx0ciBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19yb3cnPlxuICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2hlYWRlcicgc2NvcGU9J2NvbCc+VGV4dDwvdGg+XG4gICAgICAgICAgICA8dGggY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9faGVhZGVyJyBzY29wZT0nY29sJz5WYWx1ZTwvdGg+XG4gICAgICAgICAgICA8dGggY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9faGVhZGVyJyBzY29wZT0nY29sJz5cbiAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tBZGRJdGVtfT5BZGQ8L2E+XG4gICAgICAgICAgICA8L3RoPlxuICAgICAgICAgIDwvdHI+XG4gICAgICAgIDwvdGhlYWQ+XG4gICAgICAgIDx0Ym9keSBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19ib2R5Jz5cbiAgICAgICAgICB7aXRlbXMubWFwKChpdGVtLCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgPHRyIGtleT17aXRlbS52YWx1ZSArIGluZGV4fSBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19yb3cnIHNjb3BlPSdyb3cnPlxuICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9fY2VsbCc+XG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J3RleHQnXG4gICAgICAgICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2l0ZW0udGV4dH0gcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJ9IC8+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19jZWxsJz5cbiAgICAgICAgICAgICAgICB7dHlwZSA9PT0gJ251bWJlcidcbiAgICAgICAgICAgICAgICAgID8gKFxuICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgbmFtZT0ndmFsdWUnXG4gICAgICAgICAgICAgICAgICAgICAgdHlwZT0nbnVtYmVyJyBkZWZhdWx0VmFsdWU9e2l0ZW0udmFsdWV9IHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1cn0gc3RlcD0nYW55JyAvPlxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgOiAoXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBuYW1lPSd2YWx1ZSdcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2l0ZW0udmFsdWV9IHJlcXVpcmVkXG4gICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1cn0gLz5cbiAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19jZWxsJyB3aWR0aD0nMjBweCc+XG4gICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPSdsaXN0LWl0ZW0tZGVsZXRlJyBvbkNsaWNrPXsoKSA9PiB0aGlzLnJlbW92ZUl0ZW0oaW5kZXgpfT4mIzEyODQ2NTs8L2E+XG4gICAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICkpfVxuICAgICAgICA8L3Rib2R5PlxuICAgICAgPC90YWJsZT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdEl0ZW1zXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuaW1wb3J0IExpc3RJdGVtcyBmcm9tICcuL2xpc3QtaXRlbXMnXG5cbmNsYXNzIExpc3RFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IgKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG5cbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgdHlwZTogcHJvcHMubGlzdC50eXBlXG4gICAgfVxuICB9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBuZXdOYW1lID0gZm9ybURhdGEuZ2V0KCduYW1lJykudHJpbSgpXG4gICAgY29uc3QgbmV3VGl0bGUgPSBmb3JtRGF0YS5nZXQoJ3RpdGxlJykudHJpbSgpXG4gICAgY29uc3QgbmV3VHlwZSA9IGZvcm1EYXRhLmdldCgndHlwZScpXG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBuYW1lQ2hhbmdlZCA9IG5ld05hbWUgIT09IGxpc3QubmFtZVxuICAgIGNvbnN0IGNvcHlMaXN0ID0gY29weS5saXN0c1tkYXRhLmxpc3RzLmluZGV4T2YobGlzdCldXG5cbiAgICBpZiAobmFtZUNoYW5nZWQpIHtcbiAgICAgIGNvcHlMaXN0Lm5hbWUgPSBuZXdOYW1lXG5cbiAgICAgIC8vIFVwZGF0ZSBhbnkgcmVmZXJlbmNlcyB0byB0aGUgbGlzdFxuICAgICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICBwLmNvbXBvbmVudHMuZm9yRWFjaChjID0+IHtcbiAgICAgICAgICBpZiAoYy50eXBlID09PSAnU2VsZWN0RmllbGQnIHx8IGMudHlwZSA9PT0gJ1JhZGlvc0ZpZWxkJykge1xuICAgICAgICAgICAgaWYgKGMub3B0aW9ucyAmJiBjLm9wdGlvbnMubGlzdCA9PT0gbGlzdC5uYW1lKSB7XG4gICAgICAgICAgICAgIGMub3B0aW9ucy5saXN0ID0gbmV3TmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29weUxpc3QudGl0bGUgPSBuZXdUaXRsZVxuICAgIGNvcHlMaXN0LnR5cGUgPSBuZXdUeXBlXG5cbiAgICAvLyBJdGVtc1xuICAgIGNvbnN0IHRleHRzID0gZm9ybURhdGEuZ2V0QWxsKCd0ZXh0JykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29uc3QgdmFsdWVzID0gZm9ybURhdGEuZ2V0QWxsKCd2YWx1ZScpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvcHlMaXN0Lml0ZW1zID0gdGV4dHMubWFwKCh0LCBpKSA9PiAoeyB0ZXh0OiB0LCB2YWx1ZTogdmFsdWVzW2ldIH0pKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgbGlzdCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBsaXN0XG4gICAgY29weS5saXN0cy5zcGxpY2UoZGF0YS5saXN0cy5pbmRleE9mKGxpc3QpLCAxKVxuXG4gICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAubGlzdCA9PT0gbGlzdC5uYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBwLmxpc3RcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEubGlzdHMuZmluZChsID0+IGwgIT09IGxpc3QgJiYgbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpc3QtbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17bGlzdC5uYW1lfSByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKydcbiAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJOYW1lfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpc3QtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtsaXN0LnRpdGxlfSByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtdHlwZSc+VmFsdWUgdHlwZTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIGl0ZW1zPXtsaXN0Lml0ZW1zfSB0eXBlPXtzdGF0ZS50eXBlfSAvPlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdEVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdENyZWF0ZSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgIHR5cGU6IHByb3BzLnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCB0eXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gSXRlbXNcbiAgICBjb25zdCB0ZXh0cyA9IGZvcm1EYXRhLmdldEFsbCgndGV4dCcpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IHZhbHVlcyA9IGZvcm1EYXRhLmdldEFsbCgndmFsdWUnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCBpdGVtcyA9IHRleHRzLm1hcCgodCwgaSkgPT4gKHsgdGV4dDogdCwgdmFsdWU6IHZhbHVlc1tpXSB9KSlcblxuICAgIGNvcHkubGlzdHMucHVzaCh7IG5hbWUsIHRpdGxlLCB0eXBlLCBpdGVtcyB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuc3RhdGVcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J2xpc3QtbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpc3QtdHlwZSc+VmFsdWUgdHlwZTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpc3QtdHlwZScgbmFtZT0ndHlwZSdcbiAgICAgICAgICAgIHZhbHVlPXtzdGF0ZS50eXBlfVxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHR5cGU6IGUudGFyZ2V0LnZhbHVlIH0pfT5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J3N0cmluZyc+U3RyaW5nPC9vcHRpb24+XG4gICAgICAgICAgICA8b3B0aW9uIHZhbHVlPSdudW1iZXInPk51bWJlcjwvb3B0aW9uPlxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8TGlzdEl0ZW1zIHR5cGU9e3N0YXRlLnR5cGV9IC8+XG5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IExpc3RFZGl0IGZyb20gJy4vbGlzdC1lZGl0J1xuaW1wb3J0IExpc3RDcmVhdGUgZnJvbSAnLi9saXN0LWNyZWF0ZSdcblxuY2xhc3MgTGlzdHNFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uQ2xpY2tMaXN0ID0gKGUsIGxpc3QpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgbGlzdDogbGlzdFxuICAgIH0pXG4gIH1cblxuICBvbkNsaWNrQWRkTGlzdCA9IChlLCBsaXN0KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dBZGRMaXN0OiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBsaXN0cyB9ID0gZGF0YVxuICAgIGNvbnN0IGxpc3QgPSB0aGlzLnN0YXRlLmxpc3RcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstYm9keSc+XG4gICAgICAgIHshbGlzdCA/IChcbiAgICAgICAgICA8ZGl2PlxuICAgICAgICAgICAge3RoaXMuc3RhdGUuc2hvd0FkZExpc3QgPyAoXG4gICAgICAgICAgICAgIDxMaXN0Q3JlYXRlIGRhdGE9e2RhdGF9XG4gICAgICAgICAgICAgICAgb25DcmVhdGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaXN0OiBmYWxzZSB9KX1cbiAgICAgICAgICAgICAgICBvbkNhbmNlbD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpc3Q6IGZhbHNlIH0pfSAvPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT0nZ292dWstbGlzdCc+XG4gICAgICAgICAgICAgICAge2xpc3RzLm1hcCgobGlzdCwgaW5kZXgpID0+IChcbiAgICAgICAgICAgICAgICAgIDxsaSBrZXk9e2xpc3QubmFtZX0+XG4gICAgICAgICAgICAgICAgICAgIDxhIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5vbkNsaWNrTGlzdChlLCBsaXN0KX0+XG4gICAgICAgICAgICAgICAgICAgICAge2xpc3QudGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIDwvYT4gKHtsaXN0Lm5hbWV9KVxuICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICA8aHIgLz5cbiAgICAgICAgICAgICAgICAgIDxhIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5vbkNsaWNrQWRkTGlzdChlKX0+QWRkIGxpc3Q8L2E+XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPExpc3RFZGl0IGxpc3Q9e2xpc3R9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IGxpc3Q6IG51bGwgfSl9XG4gICAgICAgICAgICBvbkNhbmNlbD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgbGlzdDogbnVsbCB9KX0gLz5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0c0VkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIFNlY3Rpb25FZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgbmV3TmFtZSA9IGZvcm1EYXRhLmdldCgnbmFtZScpLnRyaW0oKVxuICAgIGNvbnN0IG5ld1RpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSwgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgbmFtZUNoYW5nZWQgPSBuZXdOYW1lICE9PSBzZWN0aW9uLm5hbWVcbiAgICBjb25zdCBjb3B5U2VjdGlvbiA9IGNvcHkuc2VjdGlvbnNbZGF0YS5zZWN0aW9ucy5pbmRleE9mKHNlY3Rpb24pXVxuXG4gICAgaWYgKG5hbWVDaGFuZ2VkKSB7XG4gICAgICBjb3B5U2VjdGlvbi5uYW1lID0gbmV3TmFtZVxuXG4gICAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIHNlY3Rpb25cbiAgICAgIGNvcHkucGFnZXMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgaWYgKHAuc2VjdGlvbiA9PT0gc2VjdGlvbi5uYW1lKSB7XG4gICAgICAgICAgcC5zZWN0aW9uID0gbmV3TmFtZVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvcHlTZWN0aW9uLnRpdGxlID0gbmV3VGl0bGVcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkNsaWNrRGVsZXRlID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoIXdpbmRvdy5jb25maXJtKCdDb25maXJtIGRlbGV0ZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIC8vIFJlbW92ZSB0aGUgc2VjdGlvblxuICAgIGNvcHkuc2VjdGlvbnMuc3BsaWNlKGRhdGEuc2VjdGlvbnMuaW5kZXhPZihzZWN0aW9uKSwgMSlcblxuICAgIC8vIFVwZGF0ZSBhbnkgcmVmZXJlbmNlcyB0byB0aGUgc2VjdGlvblxuICAgIGNvcHkucGFnZXMuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwLnNlY3Rpb24gPT09IHNlY3Rpb24ubmFtZSkge1xuICAgICAgICBkZWxldGUgcC5zZWN0aW9uXG4gICAgICB9XG4gICAgfSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkJsdXJOYW1lID0gZSA9PiB7XG4gICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSwgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IG5ld05hbWUgPSBpbnB1dC52YWx1ZS50cmltKClcblxuICAgIC8vIFZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgIGlmIChkYXRhLnNlY3Rpb25zLmZpbmQocyA9PiBzICE9PSBzZWN0aW9uICYmIHMubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBOYW1lICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3NlY3Rpb24ubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nc2VjdGlvbi10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nc2VjdGlvbi10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3NlY3Rpb24udGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj57JyAnfVxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdidXR0b24nIG9uQ2xpY2s9e3RoaXMub25DbGlja0RlbGV0ZX0+RGVsZXRlPC9idXR0b24+XG4gICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLnByb3BzLm9uQ2FuY2VsKGUpfT5DYW5jZWw8L2E+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlY3Rpb25FZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBTZWN0aW9uQ3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgbmFtZSA9IGZvcm1EYXRhLmdldCgnbmFtZScpLnRyaW0oKVxuICAgIGNvbnN0IHRpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3Qgc2VjdGlvbiA9IHsgbmFtZSwgdGl0bGUgfVxuICAgIGNvcHkuc2VjdGlvbnMucHVzaChzZWN0aW9uKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5zZWN0aW9ucy5maW5kKHMgPT4gcy5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYE5hbWUgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKydcbiAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJOYW1lfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2VjdGlvbkNyZWF0ZVxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgU2VjdGlvbkVkaXQgZnJvbSAnLi9zZWN0aW9uLWVkaXQnXG5pbXBvcnQgU2VjdGlvbkNyZWF0ZSBmcm9tICcuL3NlY3Rpb24tY3JlYXRlJ1xuXG5jbGFzcyBTZWN0aW9uc0VkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25DbGlja1NlY3Rpb24gPSAoZSwgc2VjdGlvbikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzZWN0aW9uOiBzZWN0aW9uXG4gICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tBZGRTZWN0aW9uID0gKGUsIHNlY3Rpb24pID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2hvd0FkZFNlY3Rpb246IHRydWVcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHNlY3Rpb25zIH0gPSBkYXRhXG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuc3RhdGUuc2VjdGlvblxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1ib2R5Jz5cbiAgICAgICAgeyFzZWN0aW9uID8gKFxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICB7dGhpcy5zdGF0ZS5zaG93QWRkU2VjdGlvbiA/IChcbiAgICAgICAgICAgICAgPFNlY3Rpb25DcmVhdGUgZGF0YT17ZGF0YX1cbiAgICAgICAgICAgICAgICBvbkNyZWF0ZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFNlY3Rpb246IGZhbHNlIH0pfVxuICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkU2VjdGlvbjogZmFsc2UgfSl9IC8+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPSdnb3Z1ay1saXN0Jz5cbiAgICAgICAgICAgICAgICB7c2VjdGlvbnMubWFwKChzZWN0aW9uLCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgICAgPGxpIGtleT17c2VjdGlvbi5uYW1lfT5cbiAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tTZWN0aW9uKGUsIHNlY3Rpb24pfT5cbiAgICAgICAgICAgICAgICAgICAgICB7c2VjdGlvbi50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9hPiAoe3NlY3Rpb24ubmFtZX0pXG4gICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgIDxociAvPlxuICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tBZGRTZWN0aW9uKGUpfT5BZGQgc2VjdGlvbjwvYT5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8U2VjdGlvbkVkaXQgc2VjdGlvbj17c2VjdGlvbn0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2VjdGlvbjogbnVsbCB9KX1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzZWN0aW9uOiBudWxsIH0pfSAvPlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlY3Rpb25zRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0IFJlYWN0RE9NIGRhZ3JlICovXG5cbmltcG9ydCBQYWdlIGZyb20gJy4vcGFnZSdcbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgRGF0YU1vZGVsIGZyb20gJy4vZGF0YS1tb2RlbCdcbmltcG9ydCBQYWdlQ3JlYXRlIGZyb20gJy4vcGFnZS1jcmVhdGUnXG5pbXBvcnQgTGlua0VkaXQgZnJvbSAnLi9saW5rLWVkaXQnXG5pbXBvcnQgTGlua0NyZWF0ZSBmcm9tICcuL2xpbmstY3JlYXRlJ1xuaW1wb3J0IExpc3RzRWRpdCBmcm9tICcuL2xpc3RzLWVkaXQnXG5pbXBvcnQgU2VjdGlvbnNFZGl0IGZyb20gJy4vc2VjdGlvbnMtZWRpdCdcblxuZnVuY3Rpb24gZ2V0TGF5b3V0IChkYXRhLCBlbCkge1xuICAvLyBDcmVhdGUgYSBuZXcgZGlyZWN0ZWQgZ3JhcGhcbiAgdmFyIGcgPSBuZXcgZGFncmUuZ3JhcGhsaWIuR3JhcGgoKVxuXG4gIC8vIFNldCBhbiBvYmplY3QgZm9yIHRoZSBncmFwaCBsYWJlbFxuICBnLnNldEdyYXBoKHtcbiAgICByYW5rZGlyOiAnTFInLFxuICAgIG1hcmdpbng6IDMwLFxuICAgIG1hcmdpbnk6IDMwXG4gIH0pXG5cbiAgLy8gRGVmYXVsdCB0byBhc3NpZ25pbmcgYSBuZXcgb2JqZWN0IGFzIGEgbGFiZWwgZm9yIGVhY2ggbmV3IGVkZ2UuXG4gIGcuc2V0RGVmYXVsdEVkZ2VMYWJlbChmdW5jdGlvbiAoKSB7IHJldHVybiB7fSB9KVxuXG4gIC8vIEFkZCBub2RlcyB0byB0aGUgZ3JhcGguIFRoZSBmaXJzdCBhcmd1bWVudCBpcyB0aGUgbm9kZSBpZC4gVGhlIHNlY29uZCBpc1xuICAvLyBtZXRhZGF0YSBhYm91dCB0aGUgbm9kZS4gSW4gdGhpcyBjYXNlIHdlJ3JlIGdvaW5nIHRvIGFkZCBsYWJlbHMgdG8gZWFjaCBub2RlXG4gIGRhdGEucGFnZXMuZm9yRWFjaCgocGFnZSwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBwYWdlRWwgPSBlbC5jaGlsZHJlbltpbmRleF1cblxuICAgIGcuc2V0Tm9kZShwYWdlLnBhdGgsIHsgbGFiZWw6IHBhZ2UucGF0aCwgd2lkdGg6IHBhZ2VFbC5vZmZzZXRXaWR0aCwgaGVpZ2h0OiBwYWdlRWwub2Zmc2V0SGVpZ2h0IH0pXG4gIH0pXG5cbiAgLy8gQWRkIGVkZ2VzIHRvIHRoZSBncmFwaC5cbiAgZGF0YS5wYWdlcy5mb3JFYWNoKHBhZ2UgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhZ2UubmV4dCkpIHtcbiAgICAgIHBhZ2UubmV4dC5mb3JFYWNoKG5leHQgPT4ge1xuICAgICAgICBnLnNldEVkZ2UocGFnZS5wYXRoLCBuZXh0LnBhdGgpXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBkYWdyZS5sYXlvdXQoZylcblxuICBjb25zdCBwb3MgPSB7XG4gICAgbm9kZXM6IFtdLFxuICAgIGVkZ2VzOiBbXVxuICB9XG5cbiAgY29uc3Qgb3V0cHV0ID0gZy5ncmFwaCgpXG4gIHBvcy53aWR0aCA9IG91dHB1dC53aWR0aCArICdweCdcbiAgcG9zLmhlaWdodCA9IG91dHB1dC5oZWlnaHQgKyAncHgnXG4gIGcubm9kZXMoKS5mb3JFYWNoKCh2LCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IG5vZGUgPSBnLm5vZGUodilcbiAgICBjb25zdCBwdCA9IHt9XG4gICAgcHQudG9wID0gKG5vZGUueSAtIG5vZGUuaGVpZ2h0IC8gMikgKyAncHgnXG4gICAgcHQubGVmdCA9IChub2RlLnggLSBub2RlLndpZHRoIC8gMikgKyAncHgnXG4gICAgcG9zLm5vZGVzLnB1c2gocHQpXG4gIH0pXG5cbiAgZy5lZGdlcygpLmZvckVhY2goKGUsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgZWRnZSA9IGcuZWRnZShlKVxuICAgIHBvcy5lZGdlcy5wdXNoKHtcbiAgICAgIHNvdXJjZTogZS52LFxuICAgICAgdGFyZ2V0OiBlLncsXG4gICAgICBwb2ludHM6IGVkZ2UucG9pbnRzLm1hcChwID0+IHtcbiAgICAgICAgY29uc3QgcHQgPSB7fVxuICAgICAgICBwdC55ID0gcC55XG4gICAgICAgIHB0LnggPSBwLnhcbiAgICAgICAgcmV0dXJuIHB0XG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgcmV0dXJuIHsgZywgcG9zIH1cbn1cblxuY2xhc3MgTGluZXMgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgZWRpdExpbmsgPSAoZWRnZSkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdjbGlja2VkJywgZWRnZSlcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dFZGl0b3I6IGVkZ2VcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxheW91dCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxzdmcgaGVpZ2h0PXtsYXlvdXQuaGVpZ2h0fSB3aWR0aD17bGF5b3V0LndpZHRofT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYXlvdXQuZWRnZXMubWFwKGVkZ2UgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBwb2ludHMgPSBlZGdlLnBvaW50cy5tYXAocG9pbnRzID0+IGAke3BvaW50cy54fSwke3BvaW50cy55fWApLmpvaW4oJyAnKVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxnIGtleT17cG9pbnRzfT5cbiAgICAgICAgICAgICAgICAgIDxwb2x5bGluZVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLmVkaXRMaW5rKGVkZ2UpfVxuICAgICAgICAgICAgICAgICAgICBwb2ludHM9e3BvaW50c30gLz5cbiAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICA8L3N2Zz5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IExpbmsnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8TGlua0VkaXQgZWRnZT17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgVmlzdWFsaXNhdGlvbiBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKVxuICAgIHRoaXMucmVmID0gUmVhY3QuY3JlYXRlUmVmKClcbiAgfVxuXG4gIHNjaGVkdWxlTGF5b3V0ICgpIHtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGNvbnN0IGxheW91dCA9IGdldExheW91dCh0aGlzLnByb3BzLmRhdGEsIHRoaXMucmVmLmN1cnJlbnQpXG5cbiAgICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgICBsYXlvdXQ6IGxheW91dC5wb3NcbiAgICAgIH0pXG4gICAgfSwgMjAwKVxuICB9XG5cbiAgY29tcG9uZW50RGlkTW91bnQgKCkge1xuICAgIHRoaXMuc2NoZWR1bGVMYXlvdXQoKVxuICB9XG5cbiAgY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyAoKSB7XG4gICAgdGhpcy5zY2hlZHVsZUxheW91dCgpXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgcGFnZXMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHJlZj17dGhpcy5yZWZ9IGNsYXNzTmFtZT0ndmlzdWFsaXNhdGlvbicgc3R5bGU9e3RoaXMuc3RhdGUubGF5b3V0ICYmIHsgd2lkdGg6IHRoaXMuc3RhdGUubGF5b3V0LndpZHRoLCBoZWlnaHQ6IHRoaXMuc3RhdGUubGF5b3V0LmhlaWdodCB9fT5cbiAgICAgICAge3BhZ2VzLm1hcCgocGFnZSwgaW5kZXgpID0+IDxQYWdlXG4gICAgICAgICAga2V5PXtpbmRleH0gZGF0YT17ZGF0YX0gcGFnZT17cGFnZX1cbiAgICAgICAgICBsYXlvdXQ9e3RoaXMuc3RhdGUubGF5b3V0ICYmIHRoaXMuc3RhdGUubGF5b3V0Lm5vZGVzW2luZGV4XX0gLz5cbiAgICAgICAgKX1cbiAgICAgICAge3RoaXMuc3RhdGUubGF5b3V0ICYmIDxMaW5lcyBsYXlvdXQ9e3RoaXMuc3RhdGUubGF5b3V0fSBkYXRhPXtkYXRhfSAvPn1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5jbGFzcyBNZW51IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFBhZ2U6IHRydWUgfSl9PkFkZCBQYWdlPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGluazogdHJ1ZSB9KX0+QWRkIExpbms8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0U2VjdGlvbnM6IHRydWUgfSl9PkVkaXQgU2VjdGlvbnM8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0TGlzdHM6IHRydWUgfSl9PkVkaXQgTGlzdHM8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dEYXRhTW9kZWw6IHRydWUgfSl9PlZpZXcgRGF0YSBNb2RlbDwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0pTT05EYXRhOiB0cnVlIH0pfT5WaWV3IEpTT048L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0FkZCBQYWdlJyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRQYWdlfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRQYWdlOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPFBhZ2VDcmVhdGUgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkUGFnZTogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0FkZCBMaW5rJyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRMaW5rfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaW5rOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPExpbmtDcmVhdGUgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGluazogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgU2VjdGlvbnMnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRTZWN0aW9uc31cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdFNlY3Rpb25zOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPFNlY3Rpb25zRWRpdCBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0U2VjdGlvbnM6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IExpc3RzJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0TGlzdHN9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRMaXN0czogZmFsc2UgfSl9PlxuICAgICAgICAgIDxMaXN0c0VkaXQgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdExpc3RzOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRGF0YSBNb2RlbCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93RGF0YU1vZGVsfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dEYXRhTW9kZWw6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8RGF0YU1vZGVsIGRhdGE9e2RhdGF9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0pTT04gRGF0YScgc2hvdz17dGhpcy5zdGF0ZS5zaG93SlNPTkRhdGF9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0pTT05EYXRhOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgMil9PC9wcmU+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIEFwcCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBjb21wb25lbnRXaWxsTW91bnQgKCkge1xuICAgIHdpbmRvdy5mZXRjaCgnL2FwaS9kYXRhJykudGhlbihyZXMgPT4gcmVzLmpzb24oKSkudGhlbihkYXRhID0+IHtcbiAgICAgIGRhdGEuc2F2ZSA9IHRoaXMuc2F2ZVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGxvYWRlZDogdHJ1ZSwgZGF0YSB9KVxuICAgIH0pXG4gIH1cblxuICBzYXZlID0gKHVwZGF0ZWREYXRhKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5mZXRjaChgL2FwaS9kYXRhYCwge1xuICAgICAgbWV0aG9kOiAncHV0JyxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHVwZGF0ZWREYXRhKVxuICAgIH0pLnRoZW4ocmVzID0+IHtcbiAgICAgIGlmICghcmVzLm9rKSB7XG4gICAgICAgIHRocm93IEVycm9yKHJlcy5zdGF0dXNUZXh0KVxuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc1xuICAgIH0pLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpLnRoZW4oZGF0YSA9PiB7XG4gICAgICBkYXRhLnNhdmUgPSB0aGlzLnNhdmVcbiAgICAgIHRoaXMuc2V0U3RhdGUoeyBkYXRhIH0pXG4gICAgICByZXR1cm4gZGF0YVxuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIHdpbmRvdy5hbGVydCgnU2F2ZSBmYWlsZWQnKVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGlmICh0aGlzLnN0YXRlLmxvYWRlZCkge1xuICAgICAgcmV0dXJuIChcbiAgICAgICAgPGRpdiBpZD0nYXBwJz5cbiAgICAgICAgICA8TWVudSBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IC8+XG4gICAgICAgICAgPFZpc3VhbGlzYXRpb24gZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDxkaXY+TG9hZGluZy4uLjwvZGl2PlxuICAgIH1cbiAgfVxufVxuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxBcHAgLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JylcbilcbiJdLCJuYW1lcyI6WyJGbHlvdXQiLCJwcm9wcyIsInNob3ciLCJvbkhpZGUiLCJlIiwidGl0bGUiLCJjaGlsZHJlbiIsImdldEZvcm1EYXRhIiwiZm9ybSIsImZvcm1EYXRhIiwid2luZG93IiwiRm9ybURhdGEiLCJkYXRhIiwib3B0aW9ucyIsInNjaGVtYSIsImNhc3QiLCJuYW1lIiwidmFsIiwiZWwiLCJlbGVtZW50cyIsImRhdGFzZXQiLCJ1bmRlZmluZWQiLCJOdW1iZXIiLCJmb3JFYWNoIiwidmFsdWUiLCJrZXkiLCJvcHRpb25zUHJlZml4Iiwic2NoZW1hUHJlZml4IiwidHJpbSIsInN0YXJ0c1dpdGgiLCJyZXF1aXJlZCIsInN1YnN0ciIsImxlbmd0aCIsIk9iamVjdCIsImtleXMiLCJjbG9uZSIsIm9iaiIsIkpTT04iLCJwYXJzZSIsInN0cmluZ2lmeSIsIlBhZ2VFZGl0Iiwic3RhdGUiLCJvblN1Ym1pdCIsInByZXZlbnREZWZhdWx0IiwidGFyZ2V0IiwibmV3UGF0aCIsImdldCIsInNlY3Rpb24iLCJwYWdlIiwiY29weSIsInBhdGhDaGFuZ2VkIiwicGF0aCIsImNvcHlQYWdlIiwicGFnZXMiLCJpbmRleE9mIiwiZmluZCIsInAiLCJzZXRDdXN0b21WYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5IiwiQXJyYXkiLCJpc0FycmF5IiwibmV4dCIsIm4iLCJzYXZlIiwidGhlbiIsImNvbnNvbGUiLCJsb2ciLCJvbkVkaXQiLCJjYXRjaCIsImVycm9yIiwiZXJyIiwib25DbGlja0RlbGV0ZSIsImNvbmZpcm0iLCJjb3B5UGFnZUlkeCIsImZpbmRJbmRleCIsImluZGV4IiwiaSIsInNwbGljZSIsInNlY3Rpb25zIiwibWFwIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb21wb25lbnRUeXBlcyIsInN1YlR5cGUiLCJDbGFzc2VzIiwiY29tcG9uZW50IiwiY2xhc3NlcyIsIkZpZWxkRWRpdCIsImhpbnQiLCJUZXh0RmllbGRFZGl0IiwibWF4IiwibWluIiwiTXVsdGlsaW5lVGV4dEZpZWxkRWRpdCIsInJvd3MiLCJOdW1iZXJGaWVsZEVkaXQiLCJpbnRlZ2VyIiwiU2VsZWN0RmllbGRFZGl0IiwibGlzdHMiLCJsaXN0IiwiUmFkaW9zRmllbGRFZGl0IiwiQ2hlY2tib3hlc0ZpZWxkRWRpdCIsIlBhcmFFZGl0IiwiY29udGVudCIsIkluc2V0VGV4dEVkaXQiLCJEZXRhaWxzRWRpdCIsImNvbXBvbmVudFR5cGVFZGl0b3JzIiwiQ29tcG9uZW50VHlwZUVkaXQiLCJ0eXBlIiwidCIsIlRhZ05hbWUiLCJDb21wb25lbnRFZGl0IiwiY29tcG9uZW50SW5kZXgiLCJjb21wb25lbnRzIiwiY29tcG9uZW50SWR4IiwiYyIsImlzTGFzdCIsImNvcHlDb21wIiwiU29ydGFibGVIYW5kbGUiLCJTb3J0YWJsZUhPQyIsIkRyYWdIYW5kbGUiLCJUZXh0RmllbGQiLCJUZWxlcGhvbmVOdW1iZXJGaWVsZCIsIk51bWJlckZpZWxkIiwiRW1haWxBZGRyZXNzRmllbGQiLCJUaW1lRmllbGQiLCJEYXRlRmllbGQiLCJEYXRlVGltZUZpZWxkIiwiRGF0ZVBhcnRzRmllbGQiLCJEYXRlVGltZVBhcnRzRmllbGQiLCJNdWx0aWxpbmVUZXh0RmllbGQiLCJSYWRpb3NGaWVsZCIsIkNoZWNrYm94ZXNGaWVsZCIsIlNlbGVjdEZpZWxkIiwiWWVzTm9GaWVsZCIsIlVrQWRkcmVzc0ZpZWxkIiwiUGFyYSIsIkluc2V0VGV4dCIsIkRldGFpbHMiLCJCYXNlIiwiQ29tcG9uZW50RmllbGQiLCJzaG93RWRpdG9yIiwic3RvcFByb3BhZ2F0aW9uIiwic2V0U3RhdGUiLCJDb21wb25lbnRDcmVhdGUiLCJwdXNoIiwib25DcmVhdGUiLCJTb3J0YWJsZUVsZW1lbnQiLCJTb3J0YWJsZUNvbnRhaW5lciIsImFycmF5TW92ZSIsIlNvcnRhYmxlSXRlbSIsIlNvcnRhYmxlTGlzdCIsIlBhZ2UiLCJvblNvcnRFbmQiLCJvbGRJbmRleCIsIm5ld0luZGV4IiwiZm9ybUNvbXBvbmVudHMiLCJmaWx0ZXIiLCJjb21wIiwicGFnZVRpdGxlIiwibGF5b3V0Iiwic2hvd0FkZENvbXBvbmVudCIsImNvbXBvbmVudFRvU3RyaW5nIiwiRGF0YU1vZGVsIiwibW9kZWwiLCJQYWdlQ3JlYXRlIiwiYXNzaWduIiwiTGlua0VkaXQiLCJlZGdlIiwic291cmNlIiwibGluayIsImlmIiwiY29uZGl0aW9uIiwiY29weUxpbmsiLCJjb3B5TGlua0lkeCIsIkxpbmtDcmVhdGUiLCJmcm9tIiwidG8iLCJoZWFkRHVwbGljYXRlIiwiYXJyIiwiaiIsIkxpc3RJdGVtcyIsIm9uQ2xpY2tBZGRJdGVtIiwiaXRlbXMiLCJjb25jYXQiLCJ0ZXh0IiwicmVtb3ZlSXRlbSIsInMiLCJpZHgiLCJvbkJsdXIiLCJ0ZXh0cyIsImdldEFsbCIsInZhbHVlcyIsImR1cGVUZXh0IiwiZHVwZVZhbHVlIiwiaXRlbSIsIkxpc3RFZGl0IiwibmV3TmFtZSIsIm5ld1RpdGxlIiwibmV3VHlwZSIsIm5hbWVDaGFuZ2VkIiwiY29weUxpc3QiLCJvbkJsdXJOYW1lIiwiaW5wdXQiLCJsIiwib25DYW5jZWwiLCJMaXN0Q3JlYXRlIiwiTGlzdHNFZGl0Iiwib25DbGlja0xpc3QiLCJvbkNsaWNrQWRkTGlzdCIsInNob3dBZGRMaXN0IiwiU2VjdGlvbkVkaXQiLCJjb3B5U2VjdGlvbiIsIlNlY3Rpb25DcmVhdGUiLCJTZWN0aW9uc0VkaXQiLCJvbkNsaWNrU2VjdGlvbiIsIm9uQ2xpY2tBZGRTZWN0aW9uIiwic2hvd0FkZFNlY3Rpb24iLCJnZXRMYXlvdXQiLCJnIiwiZGFncmUiLCJncmFwaGxpYiIsIkdyYXBoIiwic2V0R3JhcGgiLCJyYW5rZGlyIiwibWFyZ2lueCIsIm1hcmdpbnkiLCJzZXREZWZhdWx0RWRnZUxhYmVsIiwicGFnZUVsIiwic2V0Tm9kZSIsImxhYmVsIiwid2lkdGgiLCJvZmZzZXRXaWR0aCIsImhlaWdodCIsIm9mZnNldEhlaWdodCIsInNldEVkZ2UiLCJwb3MiLCJub2RlcyIsImVkZ2VzIiwib3V0cHV0IiwiZ3JhcGgiLCJ2Iiwibm9kZSIsInB0IiwidG9wIiwieSIsImxlZnQiLCJ4IiwidyIsInBvaW50cyIsIkxpbmVzIiwiZWRpdExpbmsiLCJqb2luIiwiVmlzdWFsaXNhdGlvbiIsInJlZiIsImNyZWF0ZVJlZiIsInNldFRpbWVvdXQiLCJjdXJyZW50Iiwic2NoZWR1bGVMYXlvdXQiLCJNZW51Iiwic2hvd0FkZFBhZ2UiLCJzaG93QWRkTGluayIsInNob3dFZGl0U2VjdGlvbnMiLCJzaG93RWRpdExpc3RzIiwic2hvd0RhdGFNb2RlbCIsInNob3dKU09ORGF0YSIsIkFwcCIsInVwZGF0ZWREYXRhIiwiZmV0Y2giLCJtZXRob2QiLCJib2R5IiwicmVzIiwib2siLCJFcnJvciIsInN0YXR1c1RleHQiLCJqc29uIiwiYWxlcnQiLCJsb2FkZWQiLCJSZWFjdERPTSIsInJlbmRlciIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiXSwibWFwcGluZ3MiOiI7OztFQUNBLFNBQVNBLE1BQVQsQ0FBaUJDLEtBQWpCLEVBQXdCO0VBQ3RCLE1BQUksQ0FBQ0EsTUFBTUMsSUFBWCxFQUFpQjtFQUNmLFdBQU8sSUFBUDtFQUNEOztFQUVELFNBQ0U7RUFBQTtFQUFBLE1BQUssV0FBVSxrQkFBZjtFQUNFO0VBQUE7RUFBQSxRQUFLLFdBQVUsdUJBQWY7RUFDRTtFQUFBO0VBQUEsVUFBRyxPQUFNLE9BQVQsRUFBaUIsV0FBVSx1Q0FBM0IsRUFBbUUsU0FBUztFQUFBLG1CQUFLRCxNQUFNRSxNQUFOLENBQWFDLENBQWIsQ0FBTDtFQUFBLFdBQTVFO0VBQUE7RUFBQSxPQURGO0VBRUU7RUFBQTtFQUFBLFVBQUssV0FBVSxPQUFmO0VBQ0U7RUFBQTtFQUFBLFlBQUssV0FBVSwyREFBZjtFQUNHSCxnQkFBTUksS0FBTixJQUFlO0VBQUE7RUFBQSxjQUFJLFdBQVUsaUJBQWQ7RUFBaUNKLGtCQUFNSTtFQUF2QztFQURsQixTQURGO0VBSUU7RUFBQTtFQUFBLFlBQUssV0FBVSxZQUFmO0VBQ0U7RUFBQTtFQUFBLGNBQUssV0FBVSx5RUFBZjtFQUNHSixrQkFBTUs7RUFEVDtFQURGO0VBSkY7RUFG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
