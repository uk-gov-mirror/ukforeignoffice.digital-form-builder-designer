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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzaWduZXIuanMiLCJzb3VyY2VzIjpbIi4uL2NsaWVudC9mbHlvdXQuanMiLCIuLi9jbGllbnQvaGVscGVycy5qcyIsIi4uL2NsaWVudC9wYWdlLWVkaXQuanMiLCIuLi9jb21wb25lbnQtdHlwZXMuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LXR5cGUtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LWNyZWF0ZS5qcyIsIi4uL2NsaWVudC9wYWdlLmpzIiwiLi4vY2xpZW50L2RhdGEtbW9kZWwuanMiLCIuLi9jbGllbnQvcGFnZS1jcmVhdGUuanMiLCIuLi9jbGllbnQvbGluay1lZGl0LmpzIiwiLi4vY2xpZW50L2xpbmstY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3QtaXRlbXMuanMiLCIuLi9jbGllbnQvbGlzdC1lZGl0LmpzIiwiLi4vY2xpZW50L2xpc3QtY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3RzLWVkaXQuanMiLCIuLi9jbGllbnQvc2VjdGlvbi1lZGl0LmpzIiwiLi4vY2xpZW50L3NlY3Rpb24tY3JlYXRlLmpzIiwiLi4vY2xpZW50L3NlY3Rpb25zLWVkaXQuanMiLCIuLi9jbGllbnQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5mdW5jdGlvbiBGbHlvdXQgKHByb3BzKSB7XG4gIGlmICghcHJvcHMuc2hvdykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPSdmbHlvdXQtbWVudSBzaG93Jz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdmbHlvdXQtbWVudS1jb250YWluZXInPlxuICAgICAgICA8YSB0aXRsZT0nQ2xvc2UnIGNsYXNzTmFtZT0nY2xvc2UgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgb25DbGljaz17ZSA9PiBwcm9wcy5vbkhpZGUoZSl9PkNsb3NlPC9hPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFuZWwnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1oZWFkZXIgZ292dWstIS1wYWRkaW5nLXRvcC00IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTQnPlxuICAgICAgICAgICAge3Byb3BzLnRpdGxlICYmIDxoNCBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctbSc+e3Byb3BzLnRpdGxlfTwvaDQ+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1ib2R5Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctbGVmdC00IGdvdnVrLSEtcGFkZGluZy1yaWdodC00IGdvdnVrLSEtcGFkZGluZy1ib3R0b20tNCc+XG4gICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZseW91dFxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1EYXRhIChmb3JtKSB7XG4gIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICBjb25zdCBkYXRhID0ge1xuICAgIG9wdGlvbnM6IHt9LFxuICAgIHNjaGVtYToge31cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhc3QgKG5hbWUsIHZhbCkge1xuICAgIGNvbnN0IGVsID0gZm9ybS5lbGVtZW50c1tuYW1lXVxuICAgIGNvbnN0IGNhc3QgPSBlbCAmJiBlbC5kYXRhc2V0LmNhc3RcblxuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGNhc3QgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gTnVtYmVyKHZhbClcbiAgICB9IGVsc2UgaWYgKGNhc3QgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHZhbCA9PT0gJ29uJ1xuICAgIH1cblxuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICBjb25zdCBvcHRpb25zUHJlZml4ID0gJ29wdGlvbnMuJ1xuICAgIGNvbnN0IHNjaGVtYVByZWZpeCA9ICdzY2hlbWEuJ1xuXG4gICAgdmFsdWUgPSB2YWx1ZS50cmltKClcblxuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG9wdGlvbnNQcmVmaXgpKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGAke29wdGlvbnNQcmVmaXh9cmVxdWlyZWRgICYmIHZhbHVlID09PSAnb24nKSB7XG4gICAgICAgICAgZGF0YS5vcHRpb25zLnJlcXVpcmVkID0gZmFsc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLm9wdGlvbnNba2V5LnN1YnN0cihvcHRpb25zUHJlZml4Lmxlbmd0aCldID0gY2FzdChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleS5zdGFydHNXaXRoKHNjaGVtYVByZWZpeCkpIHtcbiAgICAgICAgZGF0YS5zY2hlbWFba2V5LnN1YnN0cihzY2hlbWFQcmVmaXgubGVuZ3RoKV0gPSBjYXN0KGtleSwgdmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIENsZWFudXBcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLnNjaGVtYSkubGVuZ3RoKSBkZWxldGUgZGF0YS5zY2hlbWFcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLm9wdGlvbnMpLmxlbmd0aCkgZGVsZXRlIGRhdGEub3B0aW9uc1xuXG4gIHJldHVybiBkYXRhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZSAob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld1BhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBwYXRoQ2hhbmdlZCA9IG5ld1BhdGggIT09IHBhZ2UucGF0aFxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlc1tkYXRhLnBhZ2VzLmluZGV4T2YocGFnZSldXG5cbiAgICBpZiAocGF0aENoYW5nZWQpIHtcbiAgICAgIC8vIGBwYXRoYCBoYXMgY2hhbmdlZCAtIHZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgICAgaWYgKGRhdGEucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gbmV3UGF0aCkpIHtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke25ld1BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29weVBhZ2UucGF0aCA9IG5ld1BhdGhcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBwYWdlXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHAubmV4dCkpIHtcbiAgICAgICAgICBwLm5leHQuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgIGlmIChuLnBhdGggPT09IHBhZ2UucGF0aCkge1xuICAgICAgICAgICAgICBuLnBhdGggPSBuZXdQYXRoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIGNvcHlQYWdlLnRpdGxlID0gdGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlQYWdlLnRpdGxlXG4gICAgfVxuXG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIGNvcHlQYWdlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjb3B5UGFnZS5zZWN0aW9uXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2VJZHggPSBjb3B5LnBhZ2VzLmZpbmRJbmRleChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBsaW5rcyB0byB0aGUgcGFnZVxuICAgIGNvcHkucGFnZXMuZm9yRWFjaCgocCwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChpbmRleCAhPT0gY29weVBhZ2VJZHggJiYgQXJyYXkuaXNBcnJheShwLm5leHQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBwLm5leHQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gcC5uZXh0W2ldXG4gICAgICAgICAgaWYgKG5leHQucGF0aCA9PT0gcGFnZS5wYXRoKSB7XG4gICAgICAgICAgICBwLm5leHQuc3BsaWNlKGksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIFJlbW92ZSB0aGUgcGFnZSBpdHNlbGZcbiAgICBjb3B5LnBhZ2VzLnNwbGljZShjb3B5UGFnZUlkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIC8vIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3BhZ2UucGF0aH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGUudGFyZ2V0LnNldEN1c3RvbVZhbGlkaXR5KCcnKX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXRpdGxlJz5UaXRsZSAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0ncGFnZS10aXRsZS1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgSWYgbm90IHN1cHBsaWVkLCB0aGUgdGl0bGUgb2YgdGhlIGZpcnN0IHF1ZXN0aW9uIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17cGFnZS50aXRsZX0gYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJyBkZWZhdWx0VmFsdWU9e3BhZ2Uuc2VjdGlvbn0+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7c2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gKDxvcHRpb24ga2V5PXtzZWN0aW9uLm5hbWV9IHZhbHVlPXtzZWN0aW9uLm5hbWV9PntzZWN0aW9uLnRpdGxlfTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlRWRpdFxuIiwiY29uc3QgY29tcG9uZW50VHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAnVGV4dEZpZWxkJyxcbiAgICB0aXRsZTogJ1RleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdNdWx0aWxpbmVUZXh0RmllbGQnLFxuICAgIHRpdGxlOiAnTXVsdGlsaW5lIHRleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdZZXNOb0ZpZWxkJyxcbiAgICB0aXRsZTogJ1llcy9ObyBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVGaWVsZCcsXG4gICAgdGl0bGU6ICdEYXRlIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ1RpbWUgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgdGltZSBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVQYXJ0c0ZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgcGFydHMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZVBhcnRzRmllbGQnLFxuICAgIHRpdGxlOiAnRGF0ZSB0aW1lIHBhcnRzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnU2VsZWN0RmllbGQnLFxuICAgIHRpdGxlOiAnU2VsZWN0IGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUmFkaW9zRmllbGQnLFxuICAgIHRpdGxlOiAnUmFkaW9zIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQ2hlY2tib3hlc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0NoZWNrYm94ZXMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdOdW1iZXJGaWVsZCcsXG4gICAgdGl0bGU6ICdOdW1iZXIgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdVa0FkZHJlc3NGaWVsZCcsXG4gICAgdGl0bGU6ICdVayBhZGRyZXNzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGVsZXBob25lTnVtYmVyRmllbGQnLFxuICAgIHRpdGxlOiAnVGVsZXBob25lIG51bWJlciBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0VtYWlsQWRkcmVzc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0VtYWlsIGFkZHJlc3MgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdQYXJhJyxcbiAgICB0aXRsZTogJ1BhcmFncmFwaCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnSW5zZXRUZXh0JyxcbiAgICB0aXRsZTogJ0luc2V0IHRleHQnLFxuICAgIHN1YlR5cGU6ICdjb250ZW50J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RldGFpbHMnLFxuICAgIHRpdGxlOiAnRGV0YWlscycsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH1cbl1cblxuZXhwb3J0IGRlZmF1bHQgY29tcG9uZW50VHlwZXNcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IGNvbXBvbmVudFR5cGVzIGZyb20gJy4uL2NvbXBvbmVudC10eXBlcy5qcydcblxuZnVuY3Rpb24gQ2xhc3NlcyAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMuY2xhc3Nlcyc+Q2xhc3NlczwvbGFiZWw+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPkFkZGl0aW9uYWwgQ1NTIGNsYXNzZXMgdG8gYWRkIHRvIHRoZSBmaWVsZDxiciAvPlxuICAgICAgRS5nLiBnb3Z1ay1pbnB1dC0td2lkdGgtMiwgZ292dWstaW5wdXQtLXdpZHRoLTQsIGdvdnVrLWlucHV0LS13aWR0aC0xMCwgZ292dWstIS13aWR0aC1vbmUtaGFsZiwgZ292dWstIS13aWR0aC10d28tdGhpcmRzLCBnb3Z1ay0hLXdpZHRoLXRocmVlLXF1YXJ0ZXJzPC9zcGFuPlxuICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmNsYXNzZXMnIG5hbWU9J29wdGlvbnMuY2xhc3NlcycgdHlwZT0ndGV4dCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmNsYXNzZXN9IC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0yMCcgaWQ9J2ZpZWxkLW5hbWUnXG4gICAgICAgICAgbmFtZT0nbmFtZScgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnIC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC10aXRsZScgbmFtZT0ndGl0bGUnIHR5cGU9J3RleHQnXG4gICAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQudGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtaGludCc+SGludCAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC1oaW50JyBuYW1lPSdoaW50JyB0eXBlPSd0ZXh0J1xuICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LmhpbnR9IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXMgZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pdGVtJz5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pbnB1dCcgaWQ9J2ZpZWxkLW9wdGlvbnMucmVxdWlyZWQnXG4gICAgICAgICAgICBuYW1lPSdvcHRpb25zLnJlcXVpcmVkJyB0eXBlPSdjaGVja2JveCcgZGVmYXVsdENoZWNrZWQ9e29wdGlvbnMucmVxdWlyZWQgPT09IGZhbHNlfSAvPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWNoZWNrYm94ZXNfX2xhYmVsJ1xuICAgICAgICAgICAgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5yZXF1aXJlZCc+T3B0aW9uYWw8L2xhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7cHJvcHMuY2hpbGRyZW59XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gVGV4dEZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IHNjaGVtYSA9IGNvbXBvbmVudC5zY2hlbWEgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRldGFpbHMgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzJz5cbiAgICAgICAgPHN1bW1hcnkgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5Jz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnktdGV4dCc+bW9yZTwvc3Bhbj5cbiAgICAgICAgPC9zdW1tYXJ5PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1heCc+TWF4IGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5tYXgnIG5hbWU9J3NjaGVtYS5tYXgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5tYXh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWluJz5NaW4gbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWluaW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1pbicgbmFtZT0nc2NoZW1hLm1pbidcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1pbn0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5sZW5ndGgnPkxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIGV4YWN0IHRleHQgbGVuZ3RoPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubGVuZ3RoJyBuYW1lPSdzY2hlbWEubGVuZ3RoJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubGVuZ3RofSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kZXRhaWxzPlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIE11bHRpbGluZVRleHRGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBzY2hlbWEgPSBjb21wb25lbnQuc2NoZW1hIHx8IHt9XG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGV0YWlscyBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHMnPlxuICAgICAgICA8c3VtbWFyeSBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnknPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeS10ZXh0Jz5tb3JlPC9zcGFuPlxuICAgICAgICA8L3N1bW1hcnk+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWF4Jz5NYXggbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWF4aW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1heCcgbmFtZT0nc2NoZW1hLm1heCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1heH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5taW4nPk1pbiBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtaW5pbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWluJyBuYW1lPSdzY2hlbWEubWluJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWlufSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5yb3dzJz5Sb3dzPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgaWQ9J2ZpZWxkLW9wdGlvbnMucm93cycgbmFtZT0nb3B0aW9ucy5yb3dzJyB0eXBlPSd0ZXh0J1xuICAgICAgICAgICAgZGF0YS1jYXN0PSdudW1iZXInIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5yb3dzfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBOdW1iZXJGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBzY2hlbWEgPSBjb21wb25lbnQuc2NoZW1hIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkZXRhaWxzIGNsYXNzTmFtZT0nZ292dWstZGV0YWlscyc+XG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeSc+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5LXRleHQnPm1vcmU8L3NwYW4+XG4gICAgICAgIDwvc3VtbWFyeT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5taW4nPk1pbjwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1pbmltdW0gdmFsdWU8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5taW4nIG5hbWU9J3NjaGVtYS5taW4nXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5taW59IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWF4Jz5NYXg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtYXhpbXVtIHZhbHVlPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWF4JyBuYW1lPSdzY2hlbWEubWF4J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWF4fSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pdGVtJz5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2lucHV0JyBpZD0nZmllbGQtc2NoZW1hLmludGVnZXInIGRhdGEtY2FzdD0nYm9vbGVhbidcbiAgICAgICAgICAgICAgbmFtZT0nc2NoZW1hLmludGVnZXInIHR5cGU9J2NoZWNrYm94JyBkZWZhdWx0Q2hlY2tlZD17c2NoZW1hLmludGVnZXIgPT09IHRydWV9IC8+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1jaGVja2JveGVzX19sYWJlbCdcbiAgICAgICAgICAgICAgaHRtbEZvcj0nZmllbGQtc2NoZW1hLmludGVnZXInPkludGVnZXI8L2xhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gUmFkaW9zRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG4gIGNvbnN0IGxpc3RzID0gZGF0YS5saXN0c1xuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMubGlzdCc+TGlzdDwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCBnb3Z1ay1pbnB1dC0td2lkdGgtMTAnIGlkPSdmaWVsZC1vcHRpb25zLmxpc3QnIG5hbWU9J29wdGlvbnMubGlzdCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5saXN0fSByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtsaXN0cy5tYXAobGlzdCA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiA8b3B0aW9uIGtleT17bGlzdC5uYW1lfSB2YWx1ZT17bGlzdC5uYW1lfT57bGlzdC50aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gUGFyYUVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J3BhcmEtY29udGVudCc+Q29udGVudDwvbGFiZWw+XG4gICAgICA8dGV4dGFyZWEgY2xhc3NOYW1lPSdnb3Z1ay10ZXh0YXJlYScgaWQ9J3BhcmEtY29udGVudCcgbmFtZT0nY29udGVudCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQuY29udGVudH0gcm93cz0nMTAnIHJlcXVpcmVkIC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuY29uc3QgSW5zZXRUZXh0RWRpdCA9IFBhcmFFZGl0XG5cbmZ1bmN0aW9uIERldGFpbHNFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J2RldGFpbHMtdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdkZXRhaWxzLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsJyBodG1sRm9yPSdkZXRhaWxzLWNvbnRlbnQnPkNvbnRlbnQ8L2xhYmVsPlxuICAgICAgICA8dGV4dGFyZWEgY2xhc3NOYW1lPSdnb3Z1ay10ZXh0YXJlYScgaWQ9J2RldGFpbHMtY29udGVudCcgbmFtZT0nY29udGVudCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5jb250ZW50fSByb3dzPScxMCcgcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmNvbnN0IGNvbXBvbmVudFR5cGVFZGl0b3JzID0ge1xuICAnVGV4dEZpZWxkRWRpdCc6IFRleHRGaWVsZEVkaXQsXG4gICdFbWFpbEFkZHJlc3NGaWVsZEVkaXQnOiBUZXh0RmllbGRFZGl0LFxuICAnVGVsZXBob25lTnVtYmVyRmllbGRFZGl0JzogVGV4dEZpZWxkRWRpdCxcbiAgJ051bWJlckZpZWxkRWRpdCc6IE51bWJlckZpZWxkRWRpdCxcbiAgJ011bHRpbGluZVRleHRGaWVsZEVkaXQnOiBNdWx0aWxpbmVUZXh0RmllbGRFZGl0LFxuICAnU2VsZWN0RmllbGRFZGl0JzogU2VsZWN0RmllbGRFZGl0LFxuICAnUmFkaW9zRmllbGRFZGl0JzogUmFkaW9zRmllbGRFZGl0LFxuICAnQ2hlY2tib3hlc0ZpZWxkRWRpdCc6IENoZWNrYm94ZXNGaWVsZEVkaXQsXG4gICdQYXJhRWRpdCc6IFBhcmFFZGl0LFxuICAnSW5zZXRUZXh0RWRpdCc6IEluc2V0VGV4dEVkaXQsXG4gICdEZXRhaWxzRWRpdCc6IERldGFpbHNFZGl0XG59XG5cbmNsYXNzIENvbXBvbmVudFR5cGVFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgdHlwZSA9IGNvbXBvbmVudFR5cGVzLmZpbmQodCA9PiB0Lm5hbWUgPT09IGNvbXBvbmVudC50eXBlKVxuICAgIGlmICghdHlwZSkge1xuICAgICAgcmV0dXJuICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IFRhZ05hbWUgPSBjb21wb25lbnRUeXBlRWRpdG9yc1tgJHtjb21wb25lbnQudHlwZX1FZGl0YF0gfHwgRmllbGRFZGl0XG4gICAgICByZXR1cm4gPFRhZ05hbWUgY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudFR5cGVFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lLCBnZXRGb3JtRGF0YSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBDb21wb25lbnRUeXBlRWRpdCBmcm9tICcuL2NvbXBvbmVudC10eXBlLWVkaXQnXG5cbmNsYXNzIENvbXBvbmVudEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGZvcm1EYXRhID0gZ2V0Rm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gQXBwbHlcbiAgICBjb25zdCBjb21wb25lbnRJbmRleCA9IHBhZ2UuY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudClcbiAgICBjb3B5UGFnZS5jb21wb25lbnRzW2NvbXBvbmVudEluZGV4XSA9IGZvcm1EYXRhXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlLCBjb21wb25lbnQgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb21wb25lbnRJZHggPSBwYWdlLmNvbXBvbmVudHMuZmluZEluZGV4KGMgPT4gYyA9PT0gY29tcG9uZW50KVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBpc0xhc3QgPSBjb21wb25lbnRJZHggPT09IHBhZ2UuY29tcG9uZW50cy5sZW5ndGggLSAxXG5cbiAgICAvLyBSZW1vdmUgdGhlIGNvbXBvbmVudFxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMuc3BsaWNlKGNvbXBvbmVudElkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIGlmICghaXNMYXN0KSB7XG4gICAgICAgICAgLy8gV2UgZG9udCBoYXZlIGFuIGlkIHdlIGNhbiB1c2UgZm9yIGBrZXlgLWluZyByZWFjdCA8Q29tcG9uZW50IC8+J3NcbiAgICAgICAgICAvLyBXZSB0aGVyZWZvcmUgbmVlZCB0byBjb25kaXRpb25hbGx5IHJlcG9ydCBgb25FZGl0YCBjaGFuZ2VzLlxuICAgICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBjb21wb25lbnQsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHlDb21wID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb21wb25lbnQpKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxmb3JtIGF1dG9Db21wbGV0ZT0nb2ZmJyBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSd0eXBlJz5UeXBlPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5Jz57Y29tcG9uZW50LnR5cGV9PC9zcGFuPlxuICAgICAgICAgICAgPGlucHV0IGlkPSd0eXBlJyB0eXBlPSdoaWRkZW4nIG5hbWU9J3R5cGUnIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LnR5cGV9IC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8Q29tcG9uZW50VHlwZUVkaXRcbiAgICAgICAgICAgIHBhZ2U9e3BhZ2V9XG4gICAgICAgICAgICBjb21wb25lbnQ9e2NvcHlDb21wfVxuICAgICAgICAgICAgZGF0YT17ZGF0YX0gLz5cblxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50RWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0IFNvcnRhYmxlSE9DICovXG5cbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgQ29tcG9uZW50RWRpdCBmcm9tICcuL2NvbXBvbmVudC1lZGl0J1xuY29uc3QgU29ydGFibGVIYW5kbGUgPSBTb3J0YWJsZUhPQy5Tb3J0YWJsZUhhbmRsZVxuY29uc3QgRHJhZ0hhbmRsZSA9IFNvcnRhYmxlSGFuZGxlKCgpID0+IDxzcGFuIGNsYXNzTmFtZT0nZHJhZy1oYW5kbGUnPiYjOTc3Njs8L3NwYW4+KVxuXG5leHBvcnQgY29uc3QgY29tcG9uZW50VHlwZXMgPSB7XG4gICdUZXh0RmllbGQnOiBUZXh0RmllbGQsXG4gICdUZWxlcGhvbmVOdW1iZXJGaWVsZCc6IFRlbGVwaG9uZU51bWJlckZpZWxkLFxuICAnTnVtYmVyRmllbGQnOiBOdW1iZXJGaWVsZCxcbiAgJ0VtYWlsQWRkcmVzc0ZpZWxkJzogRW1haWxBZGRyZXNzRmllbGQsXG4gICdUaW1lRmllbGQnOiBUaW1lRmllbGQsXG4gICdEYXRlRmllbGQnOiBEYXRlRmllbGQsXG4gICdEYXRlVGltZUZpZWxkJzogRGF0ZVRpbWVGaWVsZCxcbiAgJ0RhdGVQYXJ0c0ZpZWxkJzogRGF0ZVBhcnRzRmllbGQsXG4gICdEYXRlVGltZVBhcnRzRmllbGQnOiBEYXRlVGltZVBhcnRzRmllbGQsXG4gICdNdWx0aWxpbmVUZXh0RmllbGQnOiBNdWx0aWxpbmVUZXh0RmllbGQsXG4gICdSYWRpb3NGaWVsZCc6IFJhZGlvc0ZpZWxkLFxuICAnQ2hlY2tib3hlc0ZpZWxkJzogQ2hlY2tib3hlc0ZpZWxkLFxuICAnU2VsZWN0RmllbGQnOiBTZWxlY3RGaWVsZCxcbiAgJ1llc05vRmllbGQnOiBZZXNOb0ZpZWxkLFxuICAnVWtBZGRyZXNzRmllbGQnOiBVa0FkZHJlc3NGaWVsZCxcbiAgJ1BhcmEnOiBQYXJhLFxuICAnSW5zZXRUZXh0JzogSW5zZXRUZXh0LFxuICAnRGV0YWlscyc6IERldGFpbHNcbn1cblxuZnVuY3Rpb24gQmFzZSAocHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvZGl2PlxuICApXG59XG5cbmZ1bmN0aW9uIENvbXBvbmVudEZpZWxkIChwcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZXh0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3gnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZWxlcGhvbmVOdW1iZXJGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCB0ZWwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBFbWFpbEFkZHJlc3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBlbWFpbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFVrQWRkcmVzc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCcgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYnV0dG9uIHNxdWFyZScgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIE11bHRpbGluZVRleHRGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggdGFsbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIE51bWJlckZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94IG51bWJlcicgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBkcm9wZG93bic+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+ZGQvbW0veXl5eTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVRpbWVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBsYXJnZSBkcm9wZG93bic+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+ZGQvbW0veXl5eSBoaDptbTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gVGltZUZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94Jz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5IGdvdnVrLSEtZm9udC1zaXplLTE0Jz5oaDptbTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVRpbWVQYXJ0c0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCcgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsIGdvdnVrLSEtbWFyZ2luLWxlZnQtMSBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggbWVkaXVtIGdvdnVrLSEtbWFyZ2luLXJpZ2h0LTEnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEYXRlUGFydHNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1sZWZ0LTEgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IG1lZGl1bScgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFJhZGlvc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaGVjaycgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NoZWNrJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2hlY2snIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBkcm9wZG93bicgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFllc05vRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGV0YWlscyAoKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICB7YOKWtiBgfTxzcGFuIGNsYXNzTmFtZT0nbGluZSBkZXRhaWxzJyAvPlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBJbnNldFRleHQgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2luc2V0IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTInPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUgc2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTIgZ292dWstIS1tYXJnaW4tdG9wLTInIC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9CYXNlPlxuICApXG59XG5cbmZ1bmN0aW9uIFBhcmEgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUnIC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZSBzaG9ydCBnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMiBnb3Z1ay0hLW1hcmdpbi10b3AtMicgLz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIHNob3dFZGl0b3IgPSAoZSwgdmFsdWUpID0+IHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IHZhbHVlIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSwgY29tcG9uZW50IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgVGFnTmFtZSA9IGNvbXBvbmVudFR5cGVzW2Ake2NvbXBvbmVudC50eXBlfWBdXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudCBnb3Z1ay0hLXBhZGRpbmctMidcbiAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gdGhpcy5zaG93RWRpdG9yKGUsIHRydWUpfT5cbiAgICAgICAgICA8RHJhZ0hhbmRsZSAvPlxuICAgICAgICAgIDxUYWdOYW1lIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IENvbXBvbmVudCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfVxuICAgICAgICAgIG9uSGlkZT17ZSA9PiB0aGlzLnNob3dFZGl0b3IoZSwgZmFsc2UpfT5cbiAgICAgICAgICA8Q29tcG9uZW50RWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0gcGFnZT17cGFnZX0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lLCBnZXRGb3JtRGF0YSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBDb21wb25lbnRUeXBlRWRpdCBmcm9tICcuL2NvbXBvbmVudC10eXBlLWVkaXQnXG4vLyBpbXBvcnQgeyBjb21wb25lbnRUeXBlcyBhcyBjb21wb25lbnRUeXBlc0ljb25zIH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuXG5jbGFzcyBDb21wb25lbnRDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBmb3JtRGF0YSA9IGdldEZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcblxuICAgIC8vIEFwcGx5XG4gICAgY29weVBhZ2UuY29tcG9uZW50cy5wdXNoKGZvcm1EYXRhKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3R5cGUnPlR5cGU8L2xhYmVsPlxuICAgICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J3R5cGUnIG5hbWU9J3R5cGUnIHJlcXVpcmVkXG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBjb21wb25lbnQ6IHsgdHlwZTogZS50YXJnZXQudmFsdWUgfSB9KX0+XG4gICAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgICAge2NvbXBvbmVudFR5cGVzLm1hcCh0eXBlID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e3R5cGUubmFtZX0gdmFsdWU9e3R5cGUubmFtZX0+e3R5cGUudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICB7Lyoge09iamVjdC5rZXlzKGNvbXBvbmVudFR5cGVzSWNvbnMpLm1hcCh0eXBlID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgVGFnID0gY29tcG9uZW50VHlwZXNJY29uc1t0eXBlXVxuICAgICAgICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudCBnb3Z1ay0hLXBhZGRpbmctMic+PFRhZyAvPjwvZGl2PlxuICAgICAgICAgICAgfSl9ICovfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAge3RoaXMuc3RhdGUuY29tcG9uZW50ICYmIHRoaXMuc3RhdGUuY29tcG9uZW50LnR5cGUgJiYgKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPENvbXBvbmVudFR5cGVFZGl0XG4gICAgICAgICAgICAgICAgcGFnZT17cGFnZX1cbiAgICAgICAgICAgICAgICBjb21wb25lbnQ9e3RoaXMuc3RhdGUuY29tcG9uZW50fVxuICAgICAgICAgICAgICAgIGRhdGE9e2RhdGF9IC8+XG5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPSdzdWJtaXQnIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJz5TYXZlPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnRDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCBTb3J0YWJsZUhPQyAqL1xuXG5pbXBvcnQgRmx5b3V0IGZyb20gJy4vZmx5b3V0J1xuaW1wb3J0IFBhZ2VFZGl0IGZyb20gJy4vcGFnZS1lZGl0J1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgQ29tcG9uZW50Q3JlYXRlIGZyb20gJy4vY29tcG9uZW50LWNyZWF0ZSdcbmltcG9ydCBjb21wb25lbnRUeXBlcyBmcm9tICcuLi9jb21wb25lbnQtdHlwZXMuanMnXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY29uc3QgU29ydGFibGVFbGVtZW50ID0gU29ydGFibGVIT0MuU29ydGFibGVFbGVtZW50XG5jb25zdCBTb3J0YWJsZUNvbnRhaW5lciA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlQ29udGFpbmVyXG5jb25zdCBhcnJheU1vdmUgPSBTb3J0YWJsZUhPQy5hcnJheU1vdmVcblxuY29uc3QgU29ydGFibGVJdGVtID0gU29ydGFibGVFbGVtZW50KCh7IGluZGV4LCBwYWdlLCBjb21wb25lbnQsIGRhdGEgfSkgPT5cbiAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudC1pdGVtJz5cbiAgICA8Q29tcG9uZW50IGtleT17aW5kZXh9IHBhZ2U9e3BhZ2V9IGNvbXBvbmVudD17Y29tcG9uZW50fSBkYXRhPXtkYXRhfSAvPlxuICA8L2Rpdj5cbilcblxuY29uc3QgU29ydGFibGVMaXN0ID0gU29ydGFibGVDb250YWluZXIoKHsgcGFnZSwgZGF0YSB9KSA9PiB7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudC1saXN0Jz5cbiAgICAgIHtwYWdlLmNvbXBvbmVudHMubWFwKChjb21wb25lbnQsIGluZGV4KSA9PiAoXG4gICAgICAgIDxTb3J0YWJsZUl0ZW0ga2V5PXtpbmRleH0gaW5kZXg9e2luZGV4fSBwYWdlPXtwYWdlfSBjb21wb25lbnQ9e2NvbXBvbmVudH0gZGF0YT17ZGF0YX0gLz5cbiAgICAgICkpfVxuICAgIDwvZGl2PlxuICApXG59KVxuXG5jbGFzcyBQYWdlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIHNob3dFZGl0b3IgPSAoZSwgdmFsdWUpID0+IHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IHZhbHVlIH0pXG4gIH1cblxuICBvblNvcnRFbmQgPSAoeyBvbGRJbmRleCwgbmV3SW5kZXggfSkgPT4ge1xuICAgIGNvbnN0IHsgcGFnZSwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG4gICAgY29weVBhZ2UuY29tcG9uZW50cyA9IGFycmF5TW92ZShjb3B5UGFnZS5jb21wb25lbnRzLCBvbGRJbmRleCwgbmV3SW5kZXgpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcblxuICAgIC8vIE9QVElNSVNUSUMgU0FWRSBUTyBTVE9QIEpVTVBcblxuICAgIC8vIGNvbnN0IHsgcGFnZSwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIC8vIHBhZ2UuY29tcG9uZW50cyA9IGFycmF5TW92ZShwYWdlLmNvbXBvbmVudHMsIG9sZEluZGV4LCBuZXdJbmRleClcblxuICAgIC8vIGRhdGEuc2F2ZShkYXRhKVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHNlY3Rpb25zIH0gPSBkYXRhXG4gICAgY29uc3QgZm9ybUNvbXBvbmVudHMgPSBwYWdlLmNvbXBvbmVudHMuZmlsdGVyKGNvbXAgPT4gY29tcG9uZW50VHlwZXMuZmluZCh0eXBlID0+IHR5cGUubmFtZSA9PT0gY29tcC50eXBlKS5zdWJUeXBlID09PSAnZmllbGQnKVxuICAgIGNvbnN0IHBhZ2VUaXRsZSA9IHBhZ2UudGl0bGUgfHwgKGZvcm1Db21wb25lbnRzLmxlbmd0aCA9PT0gMSAmJiBwYWdlLmNvbXBvbmVudHNbMF0gPT09IGZvcm1Db21wb25lbnRzWzBdID8gZm9ybUNvbXBvbmVudHNbMF0udGl0bGUgOiBwYWdlLnRpdGxlKVxuICAgIGNvbnN0IHNlY3Rpb24gPSBwYWdlLnNlY3Rpb24gJiYgc2VjdGlvbnMuZmluZChzZWN0aW9uID0+IHNlY3Rpb24ubmFtZSA9PT0gcGFnZS5zZWN0aW9uKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgaWQ9e3BhZ2UucGF0aH0gY2xhc3NOYW1lPSdwYWdlIHh0b29sdGlwJyB0aXRsZT17cGFnZS5wYXRofSBzdHlsZT17dGhpcy5wcm9wcy5sYXlvdXR9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0naGFuZGxlJyBvbkNsaWNrPXsoZSkgPT4gdGhpcy5zaG93RWRpdG9yKGUsIHRydWUpfSAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1wYWRkaW5nLXRvcC0yIGdvdnVrLSEtcGFkZGluZy1sZWZ0LTIgZ292dWstIS1wYWRkaW5nLXJpZ2h0LTInPlxuXG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT0nZ292dWstaGVhZGluZy1zJz5cbiAgICAgICAgICAgIHtzZWN0aW9uICYmIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstY2FwdGlvbi1tIGdvdnVrLSEtZm9udC1zaXplLTE0Jz57c2VjdGlvbi50aXRsZX08L3NwYW4+fVxuICAgICAgICAgICAge3BhZ2VUaXRsZX1cbiAgICAgICAgICA8L2gzPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8U29ydGFibGVMaXN0IHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9IHByZXNzRGVsYXk9ezIwMH1cbiAgICAgICAgICBvblNvcnRFbmQ9e3RoaXMub25Tb3J0RW5kfSBsb2NrQXhpcz0neScgaGVscGVyQ2xhc3M9J2RyYWdnaW5nJ1xuICAgICAgICAgIGxvY2tUb0NvbnRhaW5lckVkZ2VzIHVzZURyYWdIYW5kbGUgLz5cbiAgICAgICAgey8qIHtwYWdlLmNvbXBvbmVudHMubWFwKChjb21wLCBpbmRleCkgPT4gKFxuICAgICAgICAgIDxDb21wb25lbnQga2V5PXtpbmRleH0gcGFnZT17cGFnZX0gY29tcG9uZW50PXtjb21wfSBkYXRhPXtkYXRhfSAvPlxuICAgICAgICApKX0gKi99XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtcGFkZGluZy0yJz5cbiAgICAgICAgICA8YSBjbGFzc05hbWU9J3ByZXZpZXcgcHVsbC1yaWdodCBnb3Z1ay1ib2R5IGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgICAgaHJlZj17cGFnZS5wYXRofSB0YXJnZXQ9J3ByZXZpZXcnPk9wZW48L2E+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2J1dHRvbiBhY3RpdmUnXG4gICAgICAgICAgICBvbkNsaWNrPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkQ29tcG9uZW50OiB0cnVlIH0pfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IFBhZ2UnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zaG93RWRpdG9yKGUsIGZhbHNlKX0+XG4gICAgICAgICAgPFBhZ2VFZGl0IHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdBZGQgQ29tcG9uZW50JyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRDb21wb25lbnR9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogZmFsc2UgfSl9PlxuICAgICAgICAgIDxDb21wb25lbnRDcmVhdGUgcGFnZT17cGFnZX0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uQ3JlYXRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkQ29tcG9uZW50OiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGFnZVxuIiwiY29uc3QgbGlzdFR5cGVzID0gWydTZWxlY3RGaWVsZCcsICdSYWRpb3NGaWVsZCcsICdDaGVja2JveGVzRmllbGQnXVxuXG5mdW5jdGlvbiBjb21wb25lbnRUb1N0cmluZyAoY29tcG9uZW50KSB7XG4gIGlmICh+bGlzdFR5cGVzLmluZGV4T2YoY29tcG9uZW50LnR5cGUpKSB7XG4gICAgcmV0dXJuIGAke2NvbXBvbmVudC50eXBlfTwke2NvbXBvbmVudC5vcHRpb25zLmxpc3R9PmBcbiAgfVxuICByZXR1cm4gYCR7Y29tcG9uZW50LnR5cGV9YFxufVxuXG5mdW5jdGlvbiBEYXRhTW9kZWwgKHByb3BzKSB7XG4gIGNvbnN0IHsgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3QgeyBzZWN0aW9ucywgcGFnZXMgfSA9IGRhdGFcblxuICBjb25zdCBtb2RlbCA9IHt9XG5cbiAgcGFnZXMuZm9yRWFjaChwYWdlID0+IHtcbiAgICBwYWdlLmNvbXBvbmVudHMuZm9yRWFjaChjb21wb25lbnQgPT4ge1xuICAgICAgaWYgKGNvbXBvbmVudC5uYW1lKSB7XG4gICAgICAgIGlmIChwYWdlLnNlY3Rpb24pIHtcbiAgICAgICAgICBjb25zdCBzZWN0aW9uID0gc2VjdGlvbnMuZmluZChzZWN0aW9uID0+IHNlY3Rpb24ubmFtZSA9PT0gcGFnZS5zZWN0aW9uKVxuICAgICAgICAgIGlmICghbW9kZWxbc2VjdGlvbi5uYW1lXSkge1xuICAgICAgICAgICAgbW9kZWxbc2VjdGlvbi5uYW1lXSA9IHt9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbW9kZWxbc2VjdGlvbi5uYW1lXVtjb21wb25lbnQubmFtZV0gPSBjb21wb25lbnRUb1N0cmluZyhjb21wb25lbnQpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbW9kZWxbY29tcG9uZW50Lm5hbWVdID0gY29tcG9uZW50VG9TdHJpbmcoY29tcG9uZW50KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG4gICAgICA8cHJlPntKU09OLnN0cmluZ2lmeShtb2RlbCwgbnVsbCwgMil9PC9wcmU+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZXhwb3J0IGRlZmF1bHQgRGF0YU1vZGVsXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlQ3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgcGF0aCA9IGZvcm1EYXRhLmdldCgncGF0aCcpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgLy8gVmFsaWRhdGVcbiAgICBpZiAoZGF0YS5wYWdlcy5maW5kKHBhZ2UgPT4gcGFnZS5wYXRoID09PSBwYXRoKSkge1xuICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke3BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlID0ge1xuICAgICAgcGF0aDogcGF0aFxuICAgIH1cblxuICAgIGNvbnN0IHRpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IHNlY3Rpb24gPSBmb3JtRGF0YS5nZXQoJ3NlY3Rpb24nKS50cmltKClcblxuICAgIGlmICh0aXRsZSkge1xuICAgICAgdmFsdWUudGl0bGUgPSB0aXRsZVxuICAgIH1cbiAgICBpZiAoc2VjdGlvbikge1xuICAgICAgdmFsdWUuc2VjdGlvbiA9IHNlY3Rpb25cbiAgICB9XG5cbiAgICAvLyBBcHBseVxuICAgIE9iamVjdC5hc3NpZ24odmFsdWUsIHtcbiAgICAgIGNvbXBvbmVudHM6IFtdLFxuICAgICAgbmV4dDogW11cbiAgICB9KVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICBjb3B5LnBhZ2VzLnB1c2godmFsdWUpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlKHsgdmFsdWUgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgLy8gb25CbHVyTmFtZSA9IGUgPT4ge1xuICAvLyAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgLy8gICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgLy8gICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgLy8gICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgLy8gICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAvLyAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgLy8gICB9IGVsc2Uge1xuICAvLyAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gIC8vICAgfVxuICAvLyB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHNlY3Rpb25zIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZFxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gZS50YXJnZXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtdGl0bGUnPlRpdGxlIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdwYWdlLXRpdGxlLWhpbnQnIGNsYXNzTmFtZT0nZ292dWstaGludCc+XG4gICAgICAgICAgICBJZiBub3Qgc3VwcGxpZWQsIHRoZSB0aXRsZSBvZiB0aGUgZmlyc3QgcXVlc3Rpb24gd2lsbCBiZSB1c2VkLlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3BhZ2UtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJz5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoc2VjdGlvbiA9PiAoPG9wdGlvbiBrZXk9e3NlY3Rpb24ubmFtZX0gdmFsdWU9e3NlY3Rpb24ubmFtZX0+e3NlY3Rpb24udGl0bGV9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gdHlwZT0nc3VibWl0JyBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbic+U2F2ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBMaW5rRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgY29uc3QgeyBkYXRhLCBlZGdlIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgcGFnZSA9IGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gZWRnZS5zb3VyY2UpXG4gICAgY29uc3QgbGluayA9IHBhZ2UubmV4dC5maW5kKG4gPT4gbi5wYXRoID09PSBlZGdlLnRhcmdldClcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBwYWdlOiBwYWdlLFxuICAgICAgbGluazogbGlua1xuICAgIH1cbiAgfVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGluayA9IGNvcHlQYWdlLm5leHQuZmluZChuID0+IG4ucGF0aCA9PT0gbGluay5wYXRoKVxuXG4gICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgY29weUxpbmsuaWYgPSBjb25kaXRpb25cbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlMaW5rLmlmXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGlua0lkeCA9IGNvcHlQYWdlLm5leHQuZmluZEluZGV4KG4gPT4gbi5wYXRoID09PSBsaW5rLnBhdGgpXG4gICAgY29weVBhZ2UubmV4dC5zcGxpY2UoY29weUxpbmtJZHgsIDEpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxpbmsgfSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGRhdGEsIGVkZ2UgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHBhZ2VzIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstc291cmNlJz5Gcm9tPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGRlZmF1bHRWYWx1ZT17ZWRnZS5zb3VyY2V9IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGluay1zb3VyY2UnIGRpc2FibGVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3BhZ2VzLm1hcChwYWdlID0+ICg8b3B0aW9uIGtleT17cGFnZS5wYXRofSB2YWx1ZT17cGFnZS5wYXRofT57cGFnZS5wYXRofTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstdGFyZ2V0Jz5UbzwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBkZWZhdWx0VmFsdWU9e2VkZ2UudGFyZ2V0fSBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstdGFyZ2V0JyBkaXNhYmxlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLWNvbmRpdGlvbic+Q29uZGl0aW9uIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdsaW5rLWNvbmRpdGlvbi1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgVGhlIGxpbmsgd2lsbCBvbmx5IGJlIHVzZWQgaWYgdGhlIGV4cHJlc3Npb24gZXZhbHVhdGVzIHRvIHRydXRoeS5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaW5rLWNvbmRpdGlvbicgbmFtZT0naWYnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpbmsuaWZ9IGFyaWEtZGVzY3JpYmVkYnk9J2xpbmstY29uZGl0aW9uLWhpbnQnIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlua0VkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIExpbmtDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBmcm9tID0gZm9ybURhdGEuZ2V0KCdwYXRoJylcbiAgICBjb25zdCB0byA9IGZvcm1EYXRhLmdldCgncGFnZScpXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IHBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IGZyb20pXG5cbiAgICBjb25zdCBuZXh0ID0geyBwYXRoOiB0byB9XG5cbiAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICBuZXh0LmlmID0gY29uZGl0aW9uXG4gICAgfVxuXG4gICAgaWYgKCFwYWdlLm5leHQpIHtcbiAgICAgIHBhZ2UubmV4dCA9IFtdXG4gICAgfVxuXG4gICAgcGFnZS5uZXh0LnB1c2gobmV4dClcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBuZXh0IH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXNvdXJjZSc+RnJvbTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstc291cmNlJyBuYW1lPSdwYXRoJyByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXRhcmdldCc+VG88L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaW5rLXRhcmdldCcgbmFtZT0ncGFnZScgcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7cGFnZXMubWFwKHBhZ2UgPT4gKDxvcHRpb24ga2V5PXtwYWdlLnBhdGh9IHZhbHVlPXtwYWdlLnBhdGh9PntwYWdlLnBhdGh9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay1jb25kaXRpb24nPkNvbmRpdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0nbGluay1jb25kaXRpb24taGludCcgY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5cbiAgICAgICAgICAgIFRoZSBsaW5rIHdpbGwgb25seSBiZSB1c2VkIGlmIHRoZSBleHByZXNzaW9uIGV2YWx1YXRlcyB0byB0cnV0aHkuXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGluay1jb25kaXRpb24nIG5hbWU9J2lmJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0nbGluay1jb25kaXRpb24taGludCcgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpbmtDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmZ1bmN0aW9uIGhlYWREdXBsaWNhdGUgKGFycikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGFyci5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGFycltqXSA9PT0gYXJyW2ldKSB7XG4gICAgICAgIHJldHVybiBqXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIExpc3RJdGVtcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpdGVtczogcHJvcHMuaXRlbXMgPyBjbG9uZShwcm9wcy5pdGVtcykgOiBbXVxuICAgIH1cbiAgfVxuXG4gIG9uQ2xpY2tBZGRJdGVtID0gZSA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5jb25jYXQoeyB0ZXh0OiAnJywgdmFsdWU6ICcnIH0pXG4gICAgfSlcbiAgfVxuXG4gIHJlbW92ZUl0ZW0gPSBpZHggPT4ge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXRlbXM6IHRoaXMuc3RhdGUuaXRlbXMuZmlsdGVyKChzLCBpKSA9PiBpICE9PSBpZHgpXG4gICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgbGlzdCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBsaXN0XG4gICAgY29weS5saXN0cy5zcGxpY2UoZGF0YS5saXN0cy5pbmRleE9mKGxpc3QpLCAxKVxuXG4gICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAubGlzdCA9PT0gbGlzdC5uYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBwLmxpc3RcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ciA9IGUgPT4ge1xuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldC5mb3JtXG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgdGV4dHMgPSBmb3JtRGF0YS5nZXRBbGwoJ3RleHQnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCB2YWx1ZXMgPSBmb3JtRGF0YS5nZXRBbGwoJ3ZhbHVlJykubWFwKHQgPT4gdC50cmltKCkpXG5cbiAgICAvLyBPbmx5IHZhbGlkYXRlIGR1cGVzIGlmIHRoZXJlIGlzIG1vcmUgdGhhbiBvbmUgaXRlbVxuICAgIGlmICh0ZXh0cy5sZW5ndGggPCAyKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBmb3JtLmVsZW1lbnRzLnRleHQuZm9yRWFjaChlbCA9PiBlbC5zZXRDdXN0b21WYWxpZGl0eSgnJykpXG4gICAgZm9ybS5lbGVtZW50cy52YWx1ZS5mb3JFYWNoKGVsID0+IGVsLnNldEN1c3RvbVZhbGlkaXR5KCcnKSlcblxuICAgIC8vIFZhbGlkYXRlIHVuaXF1ZW5lc3NcbiAgICBjb25zdCBkdXBlVGV4dCA9IGhlYWREdXBsaWNhdGUodGV4dHMpXG4gICAgaWYgKGR1cGVUZXh0KSB7XG4gICAgICBmb3JtLmVsZW1lbnRzLnRleHRbZHVwZVRleHRdLnNldEN1c3RvbVZhbGlkaXR5KCdEdXBsaWNhdGUgdGV4dHMgZm91bmQgaW4gdGhlIGxpc3QgaXRlbXMnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgZHVwZVZhbHVlID0gaGVhZER1cGxpY2F0ZSh2YWx1ZXMpXG4gICAgaWYgKGR1cGVWYWx1ZSkge1xuICAgICAgZm9ybS5lbGVtZW50cy52YWx1ZVtkdXBlVmFsdWVdLnNldEN1c3RvbVZhbGlkaXR5KCdEdXBsaWNhdGUgdmFsdWVzIGZvdW5kIGluIHRoZSBsaXN0IGl0ZW1zJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgaXRlbXMgfSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IHR5cGUgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8dGFibGUgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZSc+XG4gICAgICAgIDxjYXB0aW9uIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NhcHRpb24nPkl0ZW1zPC9jYXB0aW9uPlxuICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9faGVhZCc+XG4gICAgICAgICAgPHRyIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX3Jvdyc+XG4gICAgICAgICAgICA8dGggY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9faGVhZGVyJyBzY29wZT0nY29sJz5UZXh0PC90aD5cbiAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkZXInIHNjb3BlPSdjb2wnPlZhbHVlPC90aD5cbiAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkZXInIHNjb3BlPSdjb2wnPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e3RoaXMub25DbGlja0FkZEl0ZW19PkFkZDwvYT5cbiAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90aGVhZD5cbiAgICAgICAgPHRib2R5IGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2JvZHknPlxuICAgICAgICAgIHtpdGVtcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiAoXG4gICAgICAgICAgICA8dHIga2V5PXtpdGVtLnZhbHVlICsgaW5kZXh9IGNsYXNzTmFtZT0nZ292dWstdGFibGVfX3Jvdycgc2NvcGU9J3Jvdyc+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19jZWxsJz5cbiAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgbmFtZT0ndGV4dCdcbiAgICAgICAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17aXRlbS50ZXh0fSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1cn0gLz5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnPlxuICAgICAgICAgICAgICAgIHt0eXBlID09PSAnbnVtYmVyJ1xuICAgICAgICAgICAgICAgICAgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBuYW1lPSd2YWx1ZSdcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPSdudW1iZXInIGRlZmF1bHRWYWx1ZT17aXRlbS52YWx1ZX0gcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyfSBzdGVwPSdhbnknIC8+XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICA6IChcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J3ZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17aXRlbS52YWx1ZX0gcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyfSAvPlxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnIHdpZHRoPScyMHB4Jz5cbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J2xpc3QtaXRlbS1kZWxldGUnIG9uQ2xpY2s9eygpID0+IHRoaXMucmVtb3ZlSXRlbShpbmRleCl9PiYjMTI4NDY1OzwvYT5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0SXRlbXNcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICB0eXBlOiBwcm9wcy5saXN0LnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBuZXdUeXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gbGlzdC5uYW1lXG4gICAgY29uc3QgY29weUxpc3QgPSBjb3B5Lmxpc3RzW2RhdGEubGlzdHMuaW5kZXhPZihsaXN0KV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weUxpc3QubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIHAuY29tcG9uZW50cy5mb3JFYWNoKGMgPT4ge1xuICAgICAgICAgIGlmIChjLnR5cGUgPT09ICdTZWxlY3RGaWVsZCcgfHwgYy50eXBlID09PSAnUmFkaW9zRmllbGQnKSB7XG4gICAgICAgICAgICBpZiAoYy5vcHRpb25zICYmIGMub3B0aW9ucy5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgICAgICAgYy5vcHRpb25zLmxpc3QgPSBuZXdOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5TGlzdC50aXRsZSA9IG5ld1RpdGxlXG4gICAgY29weUxpc3QudHlwZSA9IG5ld1R5cGVcblxuICAgIC8vIEl0ZW1zXG4gICAgY29uc3QgdGV4dHMgPSBmb3JtRGF0YS5nZXRBbGwoJ3RleHQnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCB2YWx1ZXMgPSBmb3JtRGF0YS5nZXRBbGwoJ3ZhbHVlJykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29weUxpc3QuaXRlbXMgPSB0ZXh0cy5tYXAoKHQsIGkpID0+ICh7IHRleHQ6IHQsIHZhbHVlOiB2YWx1ZXNbaV0gfSkpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIGxpc3RcbiAgICBjb3B5Lmxpc3RzLnNwbGljZShkYXRhLmxpc3RzLmluZGV4T2YobGlzdCksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIGxpc3RcbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAubGlzdFxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbCAhPT0gbGlzdCAmJiBsLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTGlzdCAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHsgbGlzdCB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC1uYW1lJyBuYW1lPSduYW1lJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtsaXN0Lm5hbWV9IHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QudGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10eXBlJz5WYWx1ZSB0eXBlPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGlzdC10eXBlJyBuYW1lPSd0eXBlJ1xuICAgICAgICAgICAgdmFsdWU9e3N0YXRlLnR5cGV9XG4gICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgdHlwZTogZS50YXJnZXQudmFsdWUgfSl9PlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0nc3RyaW5nJz5TdHJpbmc8L29wdGlvbj5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J251bWJlcic+TnVtYmVyPC9vcHRpb24+XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxMaXN0SXRlbXMgaXRlbXM9e2xpc3QuaXRlbXN9IHR5cGU9e3N0YXRlLnR5cGV9IC8+XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0RWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBMaXN0SXRlbXMgZnJvbSAnLi9saXN0LWl0ZW1zJ1xuXG5jbGFzcyBMaXN0Q3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IgKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG5cbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgdHlwZTogcHJvcHMudHlwZVxuICAgIH1cbiAgfVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgbmFtZSA9IGZvcm1EYXRhLmdldCgnbmFtZScpLnRyaW0oKVxuICAgIGNvbnN0IHRpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IHR5cGUgPSBmb3JtRGF0YS5nZXQoJ3R5cGUnKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBJdGVtc1xuICAgIGNvbnN0IHRleHRzID0gZm9ybURhdGEuZ2V0QWxsKCd0ZXh0JykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29uc3QgdmFsdWVzID0gZm9ybURhdGEuZ2V0QWxsKCd2YWx1ZScpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IGl0ZW1zID0gdGV4dHMubWFwKCh0LCBpKSA9PiAoeyB0ZXh0OiB0LCB2YWx1ZTogdmFsdWVzW2ldIH0pKVxuXG4gICAgY29weS5saXN0cy5wdXNoKHsgbmFtZSwgdGl0bGUsIHR5cGUsIGl0ZW1zIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlKHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkJsdXJOYW1lID0gZSA9PiB7XG4gICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IG5ld05hbWUgPSBpbnB1dC52YWx1ZS50cmltKClcblxuICAgIC8vIFZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgIGlmIChkYXRhLmxpc3RzLmZpbmQobCA9PiBsLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTGlzdCAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5zdGF0ZVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC1uYW1lJyBuYW1lPSduYW1lJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaXN0LXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10eXBlJz5WYWx1ZSB0eXBlPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGlzdC10eXBlJyBuYW1lPSd0eXBlJ1xuICAgICAgICAgICAgdmFsdWU9e3N0YXRlLnR5cGV9XG4gICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgdHlwZTogZS50YXJnZXQudmFsdWUgfSl9PlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0nc3RyaW5nJz5TdHJpbmc8L29wdGlvbj5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J251bWJlcic+TnVtYmVyPC9vcHRpb24+XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxMaXN0SXRlbXMgdHlwZT17c3RhdGUudHlwZX0gLz5cblxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdENyZWF0ZVxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgTGlzdEVkaXQgZnJvbSAnLi9saXN0LWVkaXQnXG5pbXBvcnQgTGlzdENyZWF0ZSBmcm9tICcuL2xpc3QtY3JlYXRlJ1xuXG5jbGFzcyBMaXN0c0VkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25DbGlja0xpc3QgPSAoZSwgbGlzdCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBsaXN0OiBsaXN0XG4gICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tBZGRMaXN0ID0gKGUsIGxpc3QpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2hvd0FkZExpc3Q6IHRydWVcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IGxpc3RzIH0gPSBkYXRhXG4gICAgY29uc3QgbGlzdCA9IHRoaXMuc3RhdGUubGlzdFxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1ib2R5Jz5cbiAgICAgICAgeyFsaXN0ID8gKFxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICB7dGhpcy5zdGF0ZS5zaG93QWRkTGlzdCA/IChcbiAgICAgICAgICAgICAgPExpc3RDcmVhdGUgZGF0YT17ZGF0YX1cbiAgICAgICAgICAgICAgICBvbkNyZWF0ZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpc3Q6IGZhbHNlIH0pfVxuICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGlzdDogZmFsc2UgfSl9IC8+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPSdnb3Z1ay1saXN0Jz5cbiAgICAgICAgICAgICAgICB7bGlzdHMubWFwKChsaXN0LCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgICAgPGxpIGtleT17bGlzdC5uYW1lfT5cbiAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tMaXN0KGUsIGxpc3QpfT5cbiAgICAgICAgICAgICAgICAgICAgICB7bGlzdC50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICA8aHIgLz5cbiAgICAgICAgICAgICAgICAgIDxhIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5vbkNsaWNrQWRkTGlzdChlKX0+QWRkIGxpc3Q8L2E+XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPExpc3RFZGl0IGxpc3Q9e2xpc3R9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IGxpc3Q6IG51bGwgfSl9XG4gICAgICAgICAgICBvbkNhbmNlbD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgbGlzdDogbnVsbCB9KX0gLz5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0c0VkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIFNlY3Rpb25FZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgbmV3TmFtZSA9IGZvcm1EYXRhLmdldCgnbmFtZScpLnRyaW0oKVxuICAgIGNvbnN0IG5ld1RpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSwgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgbmFtZUNoYW5nZWQgPSBuZXdOYW1lICE9PSBzZWN0aW9uLm5hbWVcbiAgICBjb25zdCBjb3B5U2VjdGlvbiA9IGNvcHkuc2VjdGlvbnNbZGF0YS5zZWN0aW9ucy5pbmRleE9mKHNlY3Rpb24pXVxuXG4gICAgaWYgKG5hbWVDaGFuZ2VkKSB7XG4gICAgICBjb3B5U2VjdGlvbi5uYW1lID0gbmV3TmFtZVxuXG4gICAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIHNlY3Rpb25cbiAgICAgIGNvcHkucGFnZXMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgaWYgKHAuc2VjdGlvbiA9PT0gc2VjdGlvbi5uYW1lKSB7XG4gICAgICAgICAgcC5zZWN0aW9uID0gbmV3TmFtZVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIGNvcHlTZWN0aW9uLnRpdGxlID0gbmV3VGl0bGVcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkNsaWNrRGVsZXRlID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICBpZiAoIXdpbmRvdy5jb25maXJtKCdDb25maXJtIGRlbGV0ZScpKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBjb25zdCB7IGRhdGEsIHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcblxuICAgIC8vIFJlbW92ZSB0aGUgc2VjdGlvblxuICAgIGNvcHkuc2VjdGlvbnMuc3BsaWNlKGRhdGEuc2VjdGlvbnMuaW5kZXhPZihzZWN0aW9uKSwgMSlcblxuICAgIC8vIFVwZGF0ZSBhbnkgcmVmZXJlbmNlcyB0byB0aGUgc2VjdGlvblxuICAgIGNvcHkucGFnZXMuZm9yRWFjaChwID0+IHtcbiAgICAgIGlmIChwLnNlY3Rpb24gPT09IHNlY3Rpb24ubmFtZSkge1xuICAgICAgICBkZWxldGUgcC5zZWN0aW9uXG4gICAgICB9XG4gICAgfSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkJsdXJOYW1lID0gZSA9PiB7XG4gICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSwgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IG5ld05hbWUgPSBpbnB1dC52YWx1ZS50cmltKClcblxuICAgIC8vIFZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgIGlmIChkYXRhLnNlY3Rpb25zLmZpbmQocyA9PiBzICE9PSBzZWN0aW9uICYmIHMubmFtZSA9PT0gbmV3TmFtZSkpIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KGBOYW1lICcke25ld05hbWV9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgfSBlbHNlIHtcbiAgICAgIGlucHV0LnNldEN1c3RvbVZhbGlkaXR5KCcnKVxuICAgIH1cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3NlY3Rpb24ubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nc2VjdGlvbi10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nc2VjdGlvbi10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3NlY3Rpb24udGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj57JyAnfVxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdidXR0b24nIG9uQ2xpY2s9e3RoaXMub25DbGlja0RlbGV0ZX0+RGVsZXRlPC9idXR0b24+XG4gICAgICAgIDxhIGNsYXNzTmFtZT0ncHVsbC1yaWdodCcgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLnByb3BzLm9uQ2FuY2VsKGUpfT5DYW5jZWw8L2E+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNlY3Rpb25FZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBTZWN0aW9uQ3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgbmFtZSA9IGZvcm1EYXRhLmdldCgnbmFtZScpLnRyaW0oKVxuICAgIGNvbnN0IHRpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3Qgc2VjdGlvbiA9IHsgbmFtZSwgdGl0bGUgfVxuICAgIGNvcHkuc2VjdGlvbnMucHVzaChzZWN0aW9uKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5zZWN0aW9ucy5maW5kKHMgPT4gcy5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYE5hbWUgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLW5hbWUnIG5hbWU9J25hbWUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKydcbiAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJOYW1lfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2VjdGlvbkNyZWF0ZVxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgU2VjdGlvbkVkaXQgZnJvbSAnLi9zZWN0aW9uLWVkaXQnXG5pbXBvcnQgU2VjdGlvbkNyZWF0ZSBmcm9tICcuL3NlY3Rpb24tY3JlYXRlJ1xuXG5jbGFzcyBTZWN0aW9uc0VkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25DbGlja1NlY3Rpb24gPSAoZSwgc2VjdGlvbikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzZWN0aW9uOiBzZWN0aW9uXG4gICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tBZGRTZWN0aW9uID0gKGUsIHNlY3Rpb24pID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2hvd0FkZFNlY3Rpb246IHRydWVcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHNlY3Rpb25zIH0gPSBkYXRhXG4gICAgY29uc3Qgc2VjdGlvbiA9IHRoaXMuc3RhdGUuc2VjdGlvblxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1ib2R5Jz5cbiAgICAgICAgeyFzZWN0aW9uID8gKFxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICB7dGhpcy5zdGF0ZS5zaG93QWRkU2VjdGlvbiA/IChcbiAgICAgICAgICAgICAgPFNlY3Rpb25DcmVhdGUgZGF0YT17ZGF0YX1cbiAgICAgICAgICAgICAgICBvbkNyZWF0ZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFNlY3Rpb246IGZhbHNlIH0pfVxuICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkU2VjdGlvbjogZmFsc2UgfSl9IC8+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPSdnb3Z1ay1saXN0Jz5cbiAgICAgICAgICAgICAgICB7c2VjdGlvbnMubWFwKChzZWN0aW9uLCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgICAgPGxpIGtleT17c2VjdGlvbi5uYW1lfT5cbiAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tTZWN0aW9uKGUsIHNlY3Rpb24pfT5cbiAgICAgICAgICAgICAgICAgICAgICB7c2VjdGlvbi50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgICApKX1cbiAgICAgICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgICAgICA8aHIgLz5cbiAgICAgICAgICAgICAgICAgIDxhIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5vbkNsaWNrQWRkU2VjdGlvbihlKX0+QWRkIHNlY3Rpb248L2E+XG4gICAgICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICkgOiAoXG4gICAgICAgICAgPFNlY3Rpb25FZGl0IHNlY3Rpb249e3NlY3Rpb259IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNlY3Rpb246IG51bGwgfSl9XG4gICAgICAgICAgICBvbkNhbmNlbD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2VjdGlvbjogbnVsbCB9KX0gLz5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uc0VkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCBSZWFjdERPTSBkYWdyZSAqL1xuXG5pbXBvcnQgUGFnZSBmcm9tICcuL3BhZ2UnXG5pbXBvcnQgRmx5b3V0IGZyb20gJy4vZmx5b3V0J1xuaW1wb3J0IERhdGFNb2RlbCBmcm9tICcuL2RhdGEtbW9kZWwnXG5pbXBvcnQgUGFnZUNyZWF0ZSBmcm9tICcuL3BhZ2UtY3JlYXRlJ1xuaW1wb3J0IExpbmtFZGl0IGZyb20gJy4vbGluay1lZGl0J1xuaW1wb3J0IExpbmtDcmVhdGUgZnJvbSAnLi9saW5rLWNyZWF0ZSdcbmltcG9ydCBMaXN0c0VkaXQgZnJvbSAnLi9saXN0cy1lZGl0J1xuaW1wb3J0IFNlY3Rpb25zRWRpdCBmcm9tICcuL3NlY3Rpb25zLWVkaXQnXG5cbmZ1bmN0aW9uIGdldExheW91dCAoZGF0YSwgZWwpIHtcbiAgLy8gQ3JlYXRlIGEgbmV3IGRpcmVjdGVkIGdyYXBoXG4gIHZhciBnID0gbmV3IGRhZ3JlLmdyYXBobGliLkdyYXBoKClcblxuICAvLyBTZXQgYW4gb2JqZWN0IGZvciB0aGUgZ3JhcGggbGFiZWxcbiAgZy5zZXRHcmFwaCh7XG4gICAgcmFua2RpcjogJ0xSJyxcbiAgICBtYXJnaW54OiA1MCxcbiAgICBtYXJnaW55OiAxNTAsXG4gICAgcmFua3NlcDogMTYwXG4gIH0pXG5cbiAgLy8gRGVmYXVsdCB0byBhc3NpZ25pbmcgYSBuZXcgb2JqZWN0IGFzIGEgbGFiZWwgZm9yIGVhY2ggbmV3IGVkZ2UuXG4gIGcuc2V0RGVmYXVsdEVkZ2VMYWJlbChmdW5jdGlvbiAoKSB7IHJldHVybiB7fSB9KVxuXG4gIC8vIEFkZCBub2RlcyB0byB0aGUgZ3JhcGguIFRoZSBmaXJzdCBhcmd1bWVudCBpcyB0aGUgbm9kZSBpZC4gVGhlIHNlY29uZCBpc1xuICAvLyBtZXRhZGF0YSBhYm91dCB0aGUgbm9kZS4gSW4gdGhpcyBjYXNlIHdlJ3JlIGdvaW5nIHRvIGFkZCBsYWJlbHMgdG8gZWFjaCBub2RlXG4gIGRhdGEucGFnZXMuZm9yRWFjaCgocGFnZSwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBwYWdlRWwgPSBlbC5jaGlsZHJlbltpbmRleF1cblxuICAgIGcuc2V0Tm9kZShwYWdlLnBhdGgsIHsgbGFiZWw6IHBhZ2UucGF0aCwgd2lkdGg6IHBhZ2VFbC5vZmZzZXRXaWR0aCwgaGVpZ2h0OiBwYWdlRWwub2Zmc2V0SGVpZ2h0IH0pXG4gIH0pXG5cbiAgLy8gQWRkIGVkZ2VzIHRvIHRoZSBncmFwaC5cbiAgZGF0YS5wYWdlcy5mb3JFYWNoKHBhZ2UgPT4ge1xuICAgIGlmIChBcnJheS5pc0FycmF5KHBhZ2UubmV4dCkpIHtcbiAgICAgIHBhZ2UubmV4dC5mb3JFYWNoKG5leHQgPT4ge1xuICAgICAgICBnLnNldEVkZ2UocGFnZS5wYXRoLCBuZXh0LnBhdGgpXG4gICAgICB9KVxuICAgIH1cbiAgfSlcblxuICBkYWdyZS5sYXlvdXQoZylcblxuICBjb25zdCBwb3MgPSB7XG4gICAgbm9kZXM6IFtdLFxuICAgIGVkZ2VzOiBbXVxuICB9XG5cbiAgY29uc3Qgb3V0cHV0ID0gZy5ncmFwaCgpXG4gIHBvcy53aWR0aCA9IG91dHB1dC53aWR0aCArICdweCdcbiAgcG9zLmhlaWdodCA9IG91dHB1dC5oZWlnaHQgKyAncHgnXG4gIGcubm9kZXMoKS5mb3JFYWNoKCh2LCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IG5vZGUgPSBnLm5vZGUodilcbiAgICBjb25zdCBwdCA9IHsgbm9kZSB9XG4gICAgcHQudG9wID0gKG5vZGUueSAtIG5vZGUuaGVpZ2h0IC8gMikgKyAncHgnXG4gICAgcHQubGVmdCA9IChub2RlLnggLSBub2RlLndpZHRoIC8gMikgKyAncHgnXG4gICAgcG9zLm5vZGVzLnB1c2gocHQpXG4gIH0pXG5cbiAgZy5lZGdlcygpLmZvckVhY2goKGUsIGluZGV4KSA9PiB7XG4gICAgY29uc3QgZWRnZSA9IGcuZWRnZShlKVxuICAgIHBvcy5lZGdlcy5wdXNoKHtcbiAgICAgIHNvdXJjZTogZS52LFxuICAgICAgdGFyZ2V0OiBlLncsXG4gICAgICBwb2ludHM6IGVkZ2UucG9pbnRzLm1hcChwID0+IHtcbiAgICAgICAgY29uc3QgcHQgPSB7fVxuICAgICAgICBwdC55ID0gcC55XG4gICAgICAgIHB0LnggPSBwLnhcbiAgICAgICAgcmV0dXJuIHB0XG4gICAgICB9KVxuICAgIH0pXG4gIH0pXG5cbiAgcmV0dXJuIHsgZywgcG9zIH1cbn1cblxuY2xhc3MgTGluZXMgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgZWRpdExpbmsgPSAoZWRnZSkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdjbGlja2VkJywgZWRnZSlcbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNob3dFZGl0b3I6IGVkZ2VcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxheW91dCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxzdmcgaGVpZ2h0PXtsYXlvdXQuaGVpZ2h0fSB3aWR0aD17bGF5b3V0LndpZHRofT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYXlvdXQuZWRnZXMubWFwKGVkZ2UgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBwb2ludHMgPSBlZGdlLnBvaW50cy5tYXAocG9pbnRzID0+IGAke3BvaW50cy54fSwke3BvaW50cy55fWApLmpvaW4oJyAnKVxuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxnIGtleT17cG9pbnRzfT5cbiAgICAgICAgICAgICAgICAgIDxwb2x5bGluZVxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLmVkaXRMaW5rKGVkZ2UpfVxuICAgICAgICAgICAgICAgICAgICBwb2ludHM9e3BvaW50c30gLz5cbiAgICAgICAgICAgICAgICA8L2c+XG4gICAgICAgICAgICAgIClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICA8L3N2Zz5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IExpbmsnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8TGlua0VkaXQgZWRnZT17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdG9yOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgTWluaW1hcCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrUGFnZSA9IChlKSA9PiB7XG5cbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBsYXlvdXQsIGRhdGEsIHNjYWxlID0gMC4wNSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdtaW5pbWFwJz5cbiAgICAgICAgPHN2ZyBoZWlnaHQ9e3BhcnNlRmxvYXQobGF5b3V0LmhlaWdodCkgKiBzY2FsZX0gd2lkdGg9e3BhcnNlRmxvYXQobGF5b3V0LndpZHRoKSAqIHNjYWxlfT5cbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYXlvdXQuZWRnZXMubWFwKGVkZ2UgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBwb2ludHMgPSBlZGdlLnBvaW50cy5tYXAocG9pbnRzID0+IGAke3BvaW50cy54ICogc2NhbGV9LCR7cG9pbnRzLnkgKiBzY2FsZX1gKS5qb2luKCcgJylcbiAgICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgICA8ZyBrZXk9e3BvaW50c30+XG4gICAgICAgICAgICAgICAgICA8cG9seWxpbmUgcG9pbnRzPXtwb2ludHN9IC8+XG4gICAgICAgICAgICAgICAgPC9nPlxuICAgICAgICAgICAgICApXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgICB7XG4gICAgICAgICAgICBsYXlvdXQubm9kZXMubWFwKChub2RlLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgIDxnIGtleT17bm9kZSArIGluZGV4fT5cbiAgICAgICAgICAgICAgICAgIDxhIHhsaW5rSHJlZj17YCMke25vZGUubm9kZS5sYWJlbH1gfT5cbiAgICAgICAgICAgICAgICAgICAgPHJlY3QgeD17cGFyc2VGbG9hdChub2RlLmxlZnQpICogc2NhbGV9XG4gICAgICAgICAgICAgICAgICAgICAgeT17cGFyc2VGbG9hdChub2RlLnRvcCkgKiBzY2FsZX1cbiAgICAgICAgICAgICAgICAgICAgICB3aWR0aD17bm9kZS5ub2RlLndpZHRoICogc2NhbGV9XG4gICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0PXtub2RlLm5vZGUuaGVpZ2h0ICogc2NhbGV9XG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGU9e25vZGUubm9kZS5sYWJlbH1cbiAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tQYWdlfSAvPlxuICAgICAgICAgICAgICAgICAgPC9hPlxuICAgICAgICAgICAgICAgIDwvZz5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIDwvc3ZnPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIFZpc3VhbGlzYXRpb24gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKClcbiAgICB0aGlzLnJlZiA9IFJlYWN0LmNyZWF0ZVJlZigpXG4gIH1cblxuICBzY2hlZHVsZUxheW91dCAoKSB7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICBjb25zdCBsYXlvdXQgPSBnZXRMYXlvdXQodGhpcy5wcm9wcy5kYXRhLCB0aGlzLnJlZi5jdXJyZW50KVxuXG4gICAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgICAgbGF5b3V0OiBsYXlvdXQucG9zXG4gICAgICB9KVxuICAgIH0sIDIwMClcbiAgfVxuXG4gIGNvbXBvbmVudERpZE1vdW50ICgpIHtcbiAgICB0aGlzLnNjaGVkdWxlTGF5b3V0KClcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMgKCkge1xuICAgIHRoaXMuc2NoZWR1bGVMYXlvdXQoKVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHBhZ2VzIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiByZWY9e3RoaXMucmVmfSBjbGFzc05hbWU9J3Zpc3VhbGlzYXRpb24nIHN0eWxlPXt0aGlzLnN0YXRlLmxheW91dCAmJiB7IHdpZHRoOiB0aGlzLnN0YXRlLmxheW91dC53aWR0aCwgaGVpZ2h0OiB0aGlzLnN0YXRlLmxheW91dC5oZWlnaHQgfX0+XG4gICAgICAgIHtwYWdlcy5tYXAoKHBhZ2UsIGluZGV4KSA9PiA8UGFnZVxuICAgICAgICAgIGtleT17aW5kZXh9IGRhdGE9e2RhdGF9IHBhZ2U9e3BhZ2V9XG4gICAgICAgICAgbGF5b3V0PXt0aGlzLnN0YXRlLmxheW91dCAmJiB0aGlzLnN0YXRlLmxheW91dC5ub2Rlc1tpbmRleF19IC8+XG4gICAgICAgICl9XG4gICAgICAgIHt0aGlzLnN0YXRlLmxheW91dCAmJiA8TGluZXMgbGF5b3V0PXt0aGlzLnN0YXRlLmxheW91dH0gZGF0YT17ZGF0YX0gLz59XG4gICAgICAgIHt0aGlzLnN0YXRlLmxheW91dCAmJiA8TWluaW1hcCBsYXlvdXQ9e3RoaXMuc3RhdGUubGF5b3V0fSBkYXRhPXtkYXRhfSAvPn1cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5jbGFzcyBNZW51IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uQ2xpY2tVcGxvYWQgPSAoZSkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1cGxvYWQnKS5jbGljaygpXG4gIH1cblxuICBvbkZpbGVVcGxvYWQgPSAoZSkgPT4ge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGZpbGUgPSBlLnRhcmdldC5maWxlcy5pdGVtKDApXG4gICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUsICdVVEYtOCcpXG4gICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBKU09OLnBhcnNlKGV2dC50YXJnZXQucmVzdWx0KVxuICAgICAgZGF0YS5zYXZlKGNvbnRlbnQpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEsIHBsYXlncm91bmRNb2RlIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J21lbnUnPlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkUGFnZTogdHJ1ZSB9KX0+QWRkIFBhZ2U8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaW5rOiB0cnVlIH0pfT5BZGQgTGluazwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRTZWN0aW9uczogdHJ1ZSB9KX0+RWRpdCBTZWN0aW9uczwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRMaXN0czogdHJ1ZSB9KX0+RWRpdCBMaXN0czwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0RhdGFNb2RlbDogdHJ1ZSB9KX0+VmlldyBEYXRhIE1vZGVsPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93SlNPTkRhdGE6IHRydWUgfSl9PlZpZXcgSlNPTjwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd1N1bW1hcnk6IHRydWUgfSl9PlN1bW1hcnk8L2J1dHRvbj5cblxuICAgICAgICB7cGxheWdyb3VuZE1vZGUgJiYgKFxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ292dWstIS1tYXJnaW4tdG9wLTRcIj5cbiAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0nZ292dWstbGluayBnb3Z1ay1saW5rLS1uby12aXNpdGVkLXN0YXRlIGdvdnVrLSEtZm9udC1zaXplLTE2JyBkb3dubG9hZCBocmVmPScvYXBpL2RhdGE/Zm9ybWF0PXRydWUnPkRvd25sb2FkIEpTT048L2E+eycgJ31cbiAgICAgICAgICAgIDxhIGNsYXNzTmFtZT0nZ292dWstbGluayBnb3Z1ay1saW5rLS1uby12aXNpdGVkLXN0YXRlIGdvdnVrLSEtZm9udC1zaXplLTE2JyBocmVmPScjJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tVcGxvYWR9PlVwbG9hZCBKU09OPC9hPnsnICd9XG4gICAgICAgICAgICA8aW5wdXQgdHlwZT0nZmlsZScgaWQ9J3VwbG9hZCcgaGlkZGVuIG9uQ2hhbmdlPXt0aGlzLm9uRmlsZVVwbG9hZH0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKX1cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdBZGQgUGFnZScgc2hvdz17dGhpcy5zdGF0ZS5zaG93QWRkUGFnZX1cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkUGFnZTogZmFsc2UgfSl9PlxuICAgICAgICAgIDxQYWdlQ3JlYXRlIGRhdGE9e2RhdGF9IG9uQ3JlYXRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFBhZ2U6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdBZGQgTGluaycgc2hvdz17dGhpcy5zdGF0ZS5zaG93QWRkTGlua31cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGluazogZmFsc2UgfSl9PlxuICAgICAgICAgIDxMaW5rQ3JlYXRlIGRhdGE9e2RhdGF9IG9uQ3JlYXRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpbms6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IFNlY3Rpb25zJyBzaG93PXt0aGlzLnN0YXRlLnNob3dFZGl0U2VjdGlvbnN9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRTZWN0aW9uczogZmFsc2UgfSl9PlxuICAgICAgICAgIDxTZWN0aW9uc0VkaXQgZGF0YT17ZGF0YX0gb25DcmVhdGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdFNlY3Rpb25zOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBMaXN0cycgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdExpc3RzfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0TGlzdHM6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8TGlzdHNFZGl0IGRhdGE9e2RhdGF9IG9uQ3JlYXRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRMaXN0czogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0RhdGEgTW9kZWwnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0RhdGFNb2RlbH1cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RGF0YU1vZGVsOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPERhdGFNb2RlbCBkYXRhPXtkYXRhfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdKU09OIERhdGEnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0pTT05EYXRhfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dKU09ORGF0YTogZmFsc2UgfSl9PlxuICAgICAgICAgIDxwcmU+e0pTT04uc3RyaW5naWZ5KGRhdGEsIG51bGwsIDIpfTwvcHJlPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdTdW1tYXJ5JyBzaG93PXt0aGlzLnN0YXRlLnNob3dTdW1tYXJ5fVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dTdW1tYXJ5OiBmYWxzZSB9KX0+XG4gICAgICAgICAgPHByZT57SlNPTi5zdHJpbmdpZnkoZGF0YS5wYWdlcy5tYXAocGFnZSA9PiBwYWdlLnBhdGgpLCBudWxsLCAyKX08L3ByZT5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgQXBwIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIGNvbXBvbmVudFdpbGxNb3VudCAoKSB7XG4gICAgd2luZG93LmZldGNoKCcvYXBpL2RhdGEnKS50aGVuKHJlcyA9PiByZXMuanNvbigpKS50aGVuKGRhdGEgPT4ge1xuICAgICAgZGF0YS5zYXZlID0gdGhpcy5zYXZlXG4gICAgICB0aGlzLnNldFN0YXRlKHsgbG9hZGVkOiB0cnVlLCBkYXRhIH0pXG4gICAgfSlcbiAgfVxuXG4gIHNhdmUgPSAodXBkYXRlZERhdGEpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmZldGNoKGAvYXBpL2RhdGFgLCB7XG4gICAgICBtZXRob2Q6ICdwdXQnLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkodXBkYXRlZERhdGEpXG4gICAgfSkudGhlbihyZXMgPT4ge1xuICAgICAgaWYgKCFyZXMub2spIHtcbiAgICAgICAgdGhyb3cgRXJyb3IocmVzLnN0YXR1c1RleHQpXG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzXG4gICAgfSkudGhlbihyZXMgPT4gcmVzLmpzb24oKSkudGhlbihkYXRhID0+IHtcbiAgICAgIGRhdGEuc2F2ZSA9IHRoaXMuc2F2ZVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGRhdGEgfSlcblxuICAgICAgLy8gUmVsb2FkIGZyYW1lIGlmIHNwbGl0IHNjcmVlbiBhbmQgaW4gcGxheWdyb3VuZCBtb2RlXG4gICAgICBpZiAod2luZG93LkRGQkQucGxheWdyb3VuZE1vZGUpIHtcbiAgICAgICAgY29uc3QgcGFyZW50ID0gd2luZG93LnBhcmVudFxuICAgICAgICBpZiAocGFyZW50LmxvY2F0aW9uLnBhdGhuYW1lID09PSAnL3NwbGl0Jykge1xuICAgICAgICAgIGNvbnN0IGZyYW1lcyA9IHdpbmRvdy5wYXJlbnQuZnJhbWVzXG4gIFxuICAgICAgICAgIGlmIChmcmFtZXMubGVuZ3RoID09PSAyKSB7XG4gICAgICAgICAgICBjb25zdCBwcmV2aWV3ID0gd2luZG93LnBhcmVudC5mcmFtZXNbMV1cbiAgICAgICAgICAgIHByZXZpZXcubG9jYXRpb24ucmVsb2FkKClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB3aW5kb3cuYWxlcnQoJ1NhdmUgZmFpbGVkJylcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBpZiAodGhpcy5zdGF0ZS5sb2FkZWQpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXYgaWQ9J2FwcCc+XG4gICAgICAgICAgPE1lbnUgZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSBwbGF5Z3JvdW5kTW9kZT17d2luZG93LkRGQkQucGxheWdyb3VuZE1vZGV9IC8+XG4gICAgICAgICAgPFZpc3VhbGlzYXRpb24gZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIDxkaXY+TG9hZGluZy4uLjwvZGl2PlxuICAgIH1cbiAgfVxufVxuXG5SZWFjdERPTS5yZW5kZXIoXG4gIDxBcHAgLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyb290JylcbilcbiJdLCJuYW1lcyI6WyJGbHlvdXQiLCJwcm9wcyIsInNob3ciLCJvbkhpZGUiLCJlIiwidGl0bGUiLCJjaGlsZHJlbiIsImdldEZvcm1EYXRhIiwiZm9ybSIsImZvcm1EYXRhIiwid2luZG93IiwiRm9ybURhdGEiLCJkYXRhIiwib3B0aW9ucyIsInNjaGVtYSIsImNhc3QiLCJuYW1lIiwidmFsIiwiZWwiLCJlbGVtZW50cyIsImRhdGFzZXQiLCJ1bmRlZmluZWQiLCJOdW1iZXIiLCJmb3JFYWNoIiwidmFsdWUiLCJrZXkiLCJvcHRpb25zUHJlZml4Iiwic2NoZW1hUHJlZml4IiwidHJpbSIsInN0YXJ0c1dpdGgiLCJyZXF1aXJlZCIsInN1YnN0ciIsImxlbmd0aCIsIk9iamVjdCIsImtleXMiLCJjbG9uZSIsIm9iaiIsIkpTT04iLCJwYXJzZSIsInN0cmluZ2lmeSIsIlBhZ2VFZGl0Iiwic3RhdGUiLCJvblN1Ym1pdCIsInByZXZlbnREZWZhdWx0IiwidGFyZ2V0IiwibmV3UGF0aCIsImdldCIsInNlY3Rpb24iLCJwYWdlIiwiY29weSIsInBhdGhDaGFuZ2VkIiwicGF0aCIsImNvcHlQYWdlIiwicGFnZXMiLCJpbmRleE9mIiwiZmluZCIsInAiLCJzZXRDdXN0b21WYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5IiwiQXJyYXkiLCJpc0FycmF5IiwibmV4dCIsIm4iLCJzYXZlIiwidGhlbiIsImNvbnNvbGUiLCJsb2ciLCJvbkVkaXQiLCJjYXRjaCIsImVycm9yIiwiZXJyIiwib25DbGlja0RlbGV0ZSIsImNvbmZpcm0iLCJjb3B5UGFnZUlkeCIsImZpbmRJbmRleCIsImluZGV4IiwiaSIsInNwbGljZSIsInNlY3Rpb25zIiwibWFwIiwiUmVhY3QiLCJDb21wb25lbnQiLCJjb21wb25lbnRUeXBlcyIsInN1YlR5cGUiLCJDbGFzc2VzIiwiY29tcG9uZW50IiwiY2xhc3NlcyIsIkZpZWxkRWRpdCIsImhpbnQiLCJUZXh0RmllbGRFZGl0IiwibWF4IiwibWluIiwiTXVsdGlsaW5lVGV4dEZpZWxkRWRpdCIsInJvd3MiLCJOdW1iZXJGaWVsZEVkaXQiLCJpbnRlZ2VyIiwiU2VsZWN0RmllbGRFZGl0IiwibGlzdHMiLCJsaXN0IiwiUmFkaW9zRmllbGRFZGl0IiwiQ2hlY2tib3hlc0ZpZWxkRWRpdCIsIlBhcmFFZGl0IiwiY29udGVudCIsIkluc2V0VGV4dEVkaXQiLCJEZXRhaWxzRWRpdCIsImNvbXBvbmVudFR5cGVFZGl0b3JzIiwiQ29tcG9uZW50VHlwZUVkaXQiLCJ0eXBlIiwidCIsIlRhZ05hbWUiLCJDb21wb25lbnRFZGl0IiwiY29tcG9uZW50SW5kZXgiLCJjb21wb25lbnRzIiwiY29tcG9uZW50SWR4IiwiYyIsImlzTGFzdCIsImNvcHlDb21wIiwiU29ydGFibGVIYW5kbGUiLCJTb3J0YWJsZUhPQyIsIkRyYWdIYW5kbGUiLCJUZXh0RmllbGQiLCJUZWxlcGhvbmVOdW1iZXJGaWVsZCIsIk51bWJlckZpZWxkIiwiRW1haWxBZGRyZXNzRmllbGQiLCJUaW1lRmllbGQiLCJEYXRlRmllbGQiLCJEYXRlVGltZUZpZWxkIiwiRGF0ZVBhcnRzRmllbGQiLCJEYXRlVGltZVBhcnRzRmllbGQiLCJNdWx0aWxpbmVUZXh0RmllbGQiLCJSYWRpb3NGaWVsZCIsIkNoZWNrYm94ZXNGaWVsZCIsIlNlbGVjdEZpZWxkIiwiWWVzTm9GaWVsZCIsIlVrQWRkcmVzc0ZpZWxkIiwiUGFyYSIsIkluc2V0VGV4dCIsIkRldGFpbHMiLCJCYXNlIiwiQ29tcG9uZW50RmllbGQiLCJzaG93RWRpdG9yIiwic3RvcFByb3BhZ2F0aW9uIiwic2V0U3RhdGUiLCJDb21wb25lbnRDcmVhdGUiLCJwdXNoIiwib25DcmVhdGUiLCJTb3J0YWJsZUVsZW1lbnQiLCJTb3J0YWJsZUNvbnRhaW5lciIsImFycmF5TW92ZSIsIlNvcnRhYmxlSXRlbSIsIlNvcnRhYmxlTGlzdCIsIlBhZ2UiLCJvblNvcnRFbmQiLCJvbGRJbmRleCIsIm5ld0luZGV4IiwiZm9ybUNvbXBvbmVudHMiLCJmaWx0ZXIiLCJjb21wIiwicGFnZVRpdGxlIiwibGF5b3V0Iiwic2hvd0FkZENvbXBvbmVudCIsImxpc3RUeXBlcyIsImNvbXBvbmVudFRvU3RyaW5nIiwiRGF0YU1vZGVsIiwibW9kZWwiLCJQYWdlQ3JlYXRlIiwiYXNzaWduIiwiTGlua0VkaXQiLCJlZGdlIiwic291cmNlIiwibGluayIsImlmIiwiY29uZGl0aW9uIiwiY29weUxpbmsiLCJjb3B5TGlua0lkeCIsIkxpbmtDcmVhdGUiLCJmcm9tIiwidG8iLCJoZWFkRHVwbGljYXRlIiwiYXJyIiwiaiIsIkxpc3RJdGVtcyIsIm9uQ2xpY2tBZGRJdGVtIiwiaXRlbXMiLCJjb25jYXQiLCJ0ZXh0IiwicmVtb3ZlSXRlbSIsInMiLCJpZHgiLCJvbkJsdXIiLCJ0ZXh0cyIsImdldEFsbCIsInZhbHVlcyIsImR1cGVUZXh0IiwiZHVwZVZhbHVlIiwiaXRlbSIsIkxpc3RFZGl0IiwibmV3TmFtZSIsIm5ld1RpdGxlIiwibmV3VHlwZSIsIm5hbWVDaGFuZ2VkIiwiY29weUxpc3QiLCJvbkJsdXJOYW1lIiwiaW5wdXQiLCJsIiwib25DYW5jZWwiLCJMaXN0Q3JlYXRlIiwiTGlzdHNFZGl0Iiwib25DbGlja0xpc3QiLCJvbkNsaWNrQWRkTGlzdCIsInNob3dBZGRMaXN0IiwiU2VjdGlvbkVkaXQiLCJjb3B5U2VjdGlvbiIsIlNlY3Rpb25DcmVhdGUiLCJTZWN0aW9uc0VkaXQiLCJvbkNsaWNrU2VjdGlvbiIsIm9uQ2xpY2tBZGRTZWN0aW9uIiwic2hvd0FkZFNlY3Rpb24iLCJnZXRMYXlvdXQiLCJnIiwiZGFncmUiLCJncmFwaGxpYiIsIkdyYXBoIiwic2V0R3JhcGgiLCJyYW5rZGlyIiwibWFyZ2lueCIsIm1hcmdpbnkiLCJyYW5rc2VwIiwic2V0RGVmYXVsdEVkZ2VMYWJlbCIsInBhZ2VFbCIsInNldE5vZGUiLCJsYWJlbCIsIndpZHRoIiwib2Zmc2V0V2lkdGgiLCJoZWlnaHQiLCJvZmZzZXRIZWlnaHQiLCJzZXRFZGdlIiwicG9zIiwibm9kZXMiLCJlZGdlcyIsIm91dHB1dCIsImdyYXBoIiwidiIsIm5vZGUiLCJwdCIsInRvcCIsInkiLCJsZWZ0IiwieCIsInciLCJwb2ludHMiLCJMaW5lcyIsImVkaXRMaW5rIiwiam9pbiIsIk1pbmltYXAiLCJvbkNsaWNrUGFnZSIsInNjYWxlIiwicGFyc2VGbG9hdCIsIlZpc3VhbGlzYXRpb24iLCJyZWYiLCJjcmVhdGVSZWYiLCJzZXRUaW1lb3V0IiwiY3VycmVudCIsInNjaGVkdWxlTGF5b3V0IiwiTWVudSIsIm9uQ2xpY2tVcGxvYWQiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiY2xpY2siLCJvbkZpbGVVcGxvYWQiLCJmaWxlIiwiZmlsZXMiLCJyZWFkZXIiLCJGaWxlUmVhZGVyIiwicmVhZEFzVGV4dCIsIm9ubG9hZCIsImV2dCIsInJlc3VsdCIsInBsYXlncm91bmRNb2RlIiwic2hvd0FkZFBhZ2UiLCJzaG93QWRkTGluayIsInNob3dFZGl0U2VjdGlvbnMiLCJzaG93RWRpdExpc3RzIiwic2hvd0RhdGFNb2RlbCIsInNob3dKU09ORGF0YSIsInNob3dTdW1tYXJ5IiwiQXBwIiwidXBkYXRlZERhdGEiLCJmZXRjaCIsIm1ldGhvZCIsImJvZHkiLCJyZXMiLCJvayIsIkVycm9yIiwic3RhdHVzVGV4dCIsImpzb24iLCJERkJEIiwicGFyZW50IiwibG9jYXRpb24iLCJwYXRobmFtZSIsImZyYW1lcyIsInByZXZpZXciLCJyZWxvYWQiLCJhbGVydCIsImxvYWRlZCIsIlJlYWN0RE9NIiwicmVuZGVyIl0sIm1hcHBpbmdzIjoiOzs7RUFDQSxTQUFTQSxNQUFULENBQWlCQyxLQUFqQixFQUF3QjtFQUN0QixNQUFJLENBQUNBLE1BQU1DLElBQVgsRUFBaUI7RUFDZixXQUFPLElBQVA7RUFDRDs7RUFFRCxTQUNFO0VBQUE7RUFBQSxNQUFLLFdBQVUsa0JBQWY7RUFDRTtFQUFBO0VBQUEsUUFBSyxXQUFVLHVCQUFmO0VBQ0U7RUFBQTtFQUFBLFVBQUcsT0FBTSxPQUFULEVBQWlCLFdBQVUsdUNBQTNCLEVBQW1FLFNBQVM7RUFBQSxtQkFBS0QsTUFBTUUsTUFBTixDQUFhQyxDQUFiLENBQUw7RUFBQSxXQUE1RTtFQUFBO0VBQUEsT0FERjtFQUVFO0VBQUE7RUFBQSxVQUFLLFdBQVUsT0FBZjtFQUNFO0VBQUE7RUFBQSxZQUFLLFdBQVUsMkRBQWY7RUFDR0gsZ0JBQU1JLEtBQU4sSUFBZTtFQUFBO0VBQUEsY0FBSSxXQUFVLGlCQUFkO0VBQWlDSixrQkFBTUk7RUFBdkM7RUFEbEIsU0FERjtFQUlFO0VBQUE7RUFBQSxZQUFLLFdBQVUsWUFBZjtFQUNFO0VBQUE7RUFBQSxjQUFLLFdBQVUseUVB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
