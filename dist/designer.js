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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVzaWduZXIuanMiLCJzb3VyY2VzIjpbIi4uL2NsaWVudC9mbHlvdXQuanMiLCIuLi9jbGllbnQvaGVscGVycy5qcyIsIi4uL2NsaWVudC9wYWdlLWVkaXQuanMiLCIuLi9jb21wb25lbnQtdHlwZXMuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LXR5cGUtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQtZWRpdC5qcyIsIi4uL2NsaWVudC9jb21wb25lbnQuanMiLCIuLi9jbGllbnQvY29tcG9uZW50LWNyZWF0ZS5qcyIsIi4uL2NsaWVudC9wYWdlLmpzIiwiLi4vY2xpZW50L2RhdGEtbW9kZWwuanMiLCIuLi9jbGllbnQvcGFnZS1jcmVhdGUuanMiLCIuLi9jbGllbnQvbGluay1lZGl0LmpzIiwiLi4vY2xpZW50L2xpbmstY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3QtaXRlbXMuanMiLCIuLi9jbGllbnQvbGlzdC1lZGl0LmpzIiwiLi4vY2xpZW50L2xpc3QtY3JlYXRlLmpzIiwiLi4vY2xpZW50L2xpc3RzLWVkaXQuanMiLCIuLi9jbGllbnQvc2VjdGlvbi1lZGl0LmpzIiwiLi4vY2xpZW50L3NlY3Rpb24tY3JlYXRlLmpzIiwiLi4vY2xpZW50L3NlY3Rpb25zLWVkaXQuanMiLCIuLi9jbGllbnQvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5mdW5jdGlvbiBGbHlvdXQgKHByb3BzKSB7XG4gIGlmICghcHJvcHMuc2hvdykge1xuICAgIHJldHVybiBudWxsXG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPSdmbHlvdXQtbWVudSBzaG93Jz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdmbHlvdXQtbWVudS1jb250YWluZXInPlxuICAgICAgICA8YSB0aXRsZT0nQ2xvc2UnIGNsYXNzTmFtZT0nY2xvc2UgZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNicgb25DbGljaz17ZSA9PiBwcm9wcy5vbkhpZGUoZSl9PkNsb3NlPC9hPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0ncGFuZWwnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1oZWFkZXIgZ292dWstIS1wYWRkaW5nLXRvcC00IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTQnPlxuICAgICAgICAgICAge3Byb3BzLnRpdGxlICYmIDxoNCBjbGFzc05hbWU9J2dvdnVrLWhlYWRpbmctbSc+e3Byb3BzLnRpdGxlfTwvaDQ+fVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYW5lbC1ib2R5Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLXBhZGRpbmctbGVmdC00IGdvdnVrLSEtcGFkZGluZy1yaWdodC00IGdvdnVrLSEtcGFkZGluZy1ib3R0b20tNCc+XG4gICAgICAgICAgICAgIHtwcm9wcy5jaGlsZHJlbn1cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmV4cG9ydCBkZWZhdWx0IEZseW91dFxuIiwiZXhwb3J0IGZ1bmN0aW9uIGdldEZvcm1EYXRhIChmb3JtKSB7XG4gIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICBjb25zdCBkYXRhID0ge1xuICAgIG9wdGlvbnM6IHt9LFxuICAgIHNjaGVtYToge31cbiAgfVxuXG4gIGZ1bmN0aW9uIGNhc3QgKG5hbWUsIHZhbCkge1xuICAgIGNvbnN0IGVsID0gZm9ybS5lbGVtZW50c1tuYW1lXVxuICAgIGNvbnN0IGNhc3QgPSBlbCAmJiBlbC5kYXRhc2V0LmNhc3RcblxuICAgIGlmICghdmFsKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgaWYgKGNhc3QgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gTnVtYmVyKHZhbClcbiAgICB9IGVsc2UgaWYgKGNhc3QgPT09ICdib29sZWFuJykge1xuICAgICAgcmV0dXJuIHZhbCA9PT0gJ29uJ1xuICAgIH1cblxuICAgIHJldHVybiB2YWxcbiAgfVxuXG4gIGZvcm1EYXRhLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICBjb25zdCBvcHRpb25zUHJlZml4ID0gJ29wdGlvbnMuJ1xuICAgIGNvbnN0IHNjaGVtYVByZWZpeCA9ICdzY2hlbWEuJ1xuXG4gICAgdmFsdWUgPSB2YWx1ZS50cmltKClcblxuICAgIGlmICh2YWx1ZSkge1xuICAgICAgaWYgKGtleS5zdGFydHNXaXRoKG9wdGlvbnNQcmVmaXgpKSB7XG4gICAgICAgIGlmIChrZXkgPT09IGAke29wdGlvbnNQcmVmaXh9cmVxdWlyZWRgICYmIHZhbHVlID09PSAnb24nKSB7XG4gICAgICAgICAgZGF0YS5vcHRpb25zLnJlcXVpcmVkID0gZmFsc2VcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBkYXRhLm9wdGlvbnNba2V5LnN1YnN0cihvcHRpb25zUHJlZml4Lmxlbmd0aCldID0gY2FzdChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleS5zdGFydHNXaXRoKHNjaGVtYVByZWZpeCkpIHtcbiAgICAgICAgZGF0YS5zY2hlbWFba2V5LnN1YnN0cihzY2hlbWFQcmVmaXgubGVuZ3RoKV0gPSBjYXN0KGtleSwgdmFsdWUpXG4gICAgICB9IGVsc2UgaWYgKHZhbHVlKSB7XG4gICAgICAgIGRhdGFba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9KVxuXG4gIC8vIENsZWFudXBcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLnNjaGVtYSkubGVuZ3RoKSBkZWxldGUgZGF0YS5zY2hlbWFcbiAgaWYgKCFPYmplY3Qua2V5cyhkYXRhLm9wdGlvbnMpLmxlbmd0aCkgZGVsZXRlIGRhdGEub3B0aW9uc1xuXG4gIHJldHVybiBkYXRhXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjbG9uZSAob2JqKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld1BhdGggPSBmb3JtRGF0YS5nZXQoJ3BhdGgnKS50cmltKClcbiAgICBjb25zdCB0aXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBzZWN0aW9uID0gZm9ybURhdGEuZ2V0KCdzZWN0aW9uJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBwYXRoQ2hhbmdlZCA9IG5ld1BhdGggIT09IHBhZ2UucGF0aFxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlc1tkYXRhLnBhZ2VzLmluZGV4T2YocGFnZSldXG5cbiAgICBpZiAocGF0aENoYW5nZWQpIHtcbiAgICAgIC8vIGBwYXRoYCBoYXMgY2hhbmdlZCAtIHZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgICAgaWYgKGRhdGEucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gbmV3UGF0aCkpIHtcbiAgICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke25ld1BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgY29weVBhZ2UucGF0aCA9IG5ld1BhdGhcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBwYWdlXG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHAubmV4dCkpIHtcbiAgICAgICAgICBwLm5leHQuZm9yRWFjaChuID0+IHtcbiAgICAgICAgICAgIGlmIChuLnBhdGggPT09IHBhZ2UucGF0aCkge1xuICAgICAgICAgICAgICBuLnBhdGggPSBuZXdQYXRoXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBpZiAodGl0bGUpIHtcbiAgICAgIGNvcHlQYWdlLnRpdGxlID0gdGl0bGVcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlQYWdlLnRpdGxlXG4gICAgfVxuXG4gICAgaWYgKHNlY3Rpb24pIHtcbiAgICAgIGNvcHlQYWdlLnNlY3Rpb24gPSBzZWN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZSBjb3B5UGFnZS5zZWN0aW9uXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2VJZHggPSBjb3B5LnBhZ2VzLmZpbmRJbmRleChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBsaW5rcyB0byB0aGUgcGFnZVxuICAgIGNvcHkucGFnZXMuZm9yRWFjaCgocCwgaW5kZXgpID0+IHtcbiAgICAgIGlmIChpbmRleCAhPT0gY29weVBhZ2VJZHggJiYgQXJyYXkuaXNBcnJheShwLm5leHQpKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSBwLm5leHQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBjb25zdCBuZXh0ID0gcC5uZXh0W2ldXG4gICAgICAgICAgaWYgKG5leHQucGF0aCA9PT0gcGFnZS5wYXRoKSB7XG4gICAgICAgICAgICBwLm5leHQuc3BsaWNlKGksIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIFJlbW92ZSB0aGUgcGFnZSBpdHNlbGZcbiAgICBjb3B5LnBhZ2VzLnNwbGljZShjb3B5UGFnZUlkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIC8vIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5vblN1Ym1pdH0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e3BhZ2UucGF0aH1cbiAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IGUudGFyZ2V0LnNldEN1c3RvbVZhbGlkaXR5KCcnKX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdwYWdlLXRpdGxlJz5UaXRsZSAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0ncGFnZS10aXRsZS1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgSWYgbm90IHN1cHBsaWVkLCB0aGUgdGl0bGUgb2YgdGhlIGZpcnN0IHF1ZXN0aW9uIHdpbGwgYmUgdXNlZC5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17cGFnZS50aXRsZX0gYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJyBkZWZhdWx0VmFsdWU9e3BhZ2Uuc2VjdGlvbn0+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7c2VjdGlvbnMubWFwKHNlY3Rpb24gPT4gKDxvcHRpb24ga2V5PXtzZWN0aW9uLm5hbWV9IHZhbHVlPXtzZWN0aW9uLm5hbWV9PntzZWN0aW9uLnRpdGxlfTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlRWRpdFxuIiwiY29uc3QgY29tcG9uZW50VHlwZXMgPSBbXG4gIHtcbiAgICBuYW1lOiAnVGV4dEZpZWxkJyxcbiAgICB0aXRsZTogJ1RleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdNdWx0aWxpbmVUZXh0RmllbGQnLFxuICAgIHRpdGxlOiAnTXVsdGlsaW5lIHRleHQgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdZZXNOb0ZpZWxkJyxcbiAgICB0aXRsZTogJ1llcy9ObyBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVGaWVsZCcsXG4gICAgdGl0bGU6ICdEYXRlIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ1RpbWUgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZUZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgdGltZSBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RhdGVQYXJ0c0ZpZWxkJyxcbiAgICB0aXRsZTogJ0RhdGUgcGFydHMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdEYXRlVGltZVBhcnRzRmllbGQnLFxuICAgIHRpdGxlOiAnRGF0ZSB0aW1lIHBhcnRzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnU2VsZWN0RmllbGQnLFxuICAgIHRpdGxlOiAnU2VsZWN0IGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnUmFkaW9zRmllbGQnLFxuICAgIHRpdGxlOiAnUmFkaW9zIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnQ2hlY2tib3hlc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0NoZWNrYm94ZXMgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdOdW1iZXJGaWVsZCcsXG4gICAgdGl0bGU6ICdOdW1iZXIgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdVa0FkZHJlc3NGaWVsZCcsXG4gICAgdGl0bGU6ICdVayBhZGRyZXNzIGZpZWxkJyxcbiAgICBzdWJUeXBlOiAnZmllbGQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnVGVsZXBob25lTnVtYmVyRmllbGQnLFxuICAgIHRpdGxlOiAnVGVsZXBob25lIG51bWJlciBmaWVsZCcsXG4gICAgc3ViVHlwZTogJ2ZpZWxkJ1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0VtYWlsQWRkcmVzc0ZpZWxkJyxcbiAgICB0aXRsZTogJ0VtYWlsIGFkZHJlc3MgZmllbGQnLFxuICAgIHN1YlR5cGU6ICdmaWVsZCdcbiAgfSxcbiAge1xuICAgIG5hbWU6ICdQYXJhJyxcbiAgICB0aXRsZTogJ1BhcmFncmFwaCcsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH0sXG4gIHtcbiAgICBuYW1lOiAnSW5zZXRUZXh0JyxcbiAgICB0aXRsZTogJ0luc2V0IHRleHQnLFxuICAgIHN1YlR5cGU6ICdjb250ZW50J1xuICB9LFxuICB7XG4gICAgbmFtZTogJ0RldGFpbHMnLFxuICAgIHRpdGxlOiAnRGV0YWlscycsXG4gICAgc3ViVHlwZTogJ2NvbnRlbnQnXG4gIH1cbl1cblxuZXhwb3J0IGRlZmF1bHQgY29tcG9uZW50VHlwZXNcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IGNvbXBvbmVudFR5cGVzIGZyb20gJy4uL2NvbXBvbmVudC10eXBlcy5qcydcblxuZnVuY3Rpb24gQ2xhc3NlcyAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMuY2xhc3Nlcyc+Q2xhc3NlczwvbGFiZWw+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPkFkZGl0aW9uYWwgQ1NTIGNsYXNzZXMgdG8gYWRkIHRvIHRoZSBmaWVsZDxiciAvPlxuICAgICAgRS5nLiBnb3Z1ay1pbnB1dC0td2lkdGgtMiwgZ292dWstaW5wdXQtLXdpZHRoLTQsIGdvdnVrLWlucHV0LS13aWR0aC0xMCwgZ292dWstIS13aWR0aC1vbmUtaGFsZiwgZ292dWstIS13aWR0aC10d28tdGhpcmRzLCBnb3Z1ay0hLXdpZHRoLXRocmVlLXF1YXJ0ZXJzPC9zcGFuPlxuICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC1vcHRpb25zLmNsYXNzZXMnIG5hbWU9J29wdGlvbnMuY2xhc3NlcycgdHlwZT0ndGV4dCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmNsYXNzZXN9IC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtbmFtZSc+TmFtZTwvbGFiZWw+XG4gICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0yMCcgaWQ9J2ZpZWxkLW5hbWUnXG4gICAgICAgICAgbmFtZT0nbmFtZScgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQubmFtZX0gcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnIC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC10aXRsZScgbmFtZT0ndGl0bGUnIHR5cGU9J3RleHQnXG4gICAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQudGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtaGludCc+SGludCAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdmaWVsZC1oaW50JyBuYW1lPSdoaW50JyB0eXBlPSd0ZXh0J1xuICAgICAgICAgIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LmhpbnR9IC8+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXMgZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pdGVtJz5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pbnB1dCcgaWQ9J2ZpZWxkLW9wdGlvbnMucmVxdWlyZWQnXG4gICAgICAgICAgICBuYW1lPSdvcHRpb25zLnJlcXVpcmVkJyB0eXBlPSdjaGVja2JveCcgZGVmYXVsdENoZWNrZWQ9e29wdGlvbnMucmVxdWlyZWQgPT09IGZhbHNlfSAvPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWNoZWNrYm94ZXNfX2xhYmVsJ1xuICAgICAgICAgICAgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5yZXF1aXJlZCc+T3B0aW9uYWw8L2xhYmVsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7cHJvcHMuY2hpbGRyZW59XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZnVuY3Rpb24gVGV4dEZpZWxkRWRpdCAocHJvcHMpIHtcbiAgY29uc3QgeyBjb21wb25lbnQgfSA9IHByb3BzXG4gIGNvbnN0IHNjaGVtYSA9IGNvbXBvbmVudC5zY2hlbWEgfHwge31cblxuICByZXR1cm4gKFxuICAgIDxGaWVsZEVkaXQgY29tcG9uZW50PXtjb21wb25lbnR9PlxuICAgICAgPGRldGFpbHMgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzJz5cbiAgICAgICAgPHN1bW1hcnkgY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5Jz5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnktdGV4dCc+bW9yZTwvc3Bhbj5cbiAgICAgICAgPC9zdW1tYXJ5PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtc2NoZW1hLm1heCc+TWF4IGxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1heGltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnM8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5tYXgnIG5hbWU9J3NjaGVtYS5tYXgnXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5tYXh9IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWluJz5NaW4gbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWluaW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1pbicgbmFtZT0nc2NoZW1hLm1pbidcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1pbn0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5sZW5ndGgnPkxlbmd0aDwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIGV4YWN0IHRleHQgbGVuZ3RoPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubGVuZ3RoJyBuYW1lPSdzY2hlbWEubGVuZ3RoJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubGVuZ3RofSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kZXRhaWxzPlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIE11bHRpbGluZVRleHRGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBzY2hlbWEgPSBjb21wb25lbnQuc2NoZW1hIHx8IHt9XG4gIGNvbnN0IG9wdGlvbnMgPSBjb21wb25lbnQub3B0aW9ucyB8fCB7fVxuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGV0YWlscyBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHMnPlxuICAgICAgICA8c3VtbWFyeSBjbGFzc05hbWU9J2dvdnVrLWRldGFpbHNfX3N1bW1hcnknPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeS10ZXh0Jz5tb3JlPC9zcGFuPlxuICAgICAgICA8L3N1bW1hcnk+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWF4Jz5NYXggbGVuZ3RoPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlNwZWNpZmllcyB0aGUgbWF4aW11bSBudW1iZXIgb2YgY2hhcmFjdGVyczwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgZGF0YS1jYXN0PSdudW1iZXInXG4gICAgICAgICAgICBpZD0nZmllbGQtc2NoZW1hLm1heCcgbmFtZT0nc2NoZW1hLm1heCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17c2NoZW1hLm1heH0gdHlwZT0nbnVtYmVyJyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5taW4nPk1pbiBsZW5ndGg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtaW5pbXVtIG51bWJlciBvZiBjaGFyYWN0ZXJzPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWluJyBuYW1lPSdzY2hlbWEubWluJ1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWlufSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5yb3dzJz5Sb3dzPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCBnb3Z1ay1pbnB1dC0td2lkdGgtMycgaWQ9J2ZpZWxkLW9wdGlvbnMucm93cycgbmFtZT0nb3B0aW9ucy5yb3dzJyB0eXBlPSd0ZXh0J1xuICAgICAgICAgICAgZGF0YS1jYXN0PSdudW1iZXInIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5yb3dzfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBOdW1iZXJGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuICBjb25zdCBzY2hlbWEgPSBjb21wb25lbnQuc2NoZW1hIHx8IHt9XG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkZXRhaWxzIGNsYXNzTmFtZT0nZ292dWstZGV0YWlscyc+XG4gICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT0nZ292dWstZGV0YWlsc19fc3VtbWFyeSc+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1kZXRhaWxzX19zdW1tYXJ5LXRleHQnPm1vcmU8L3NwYW4+XG4gICAgICAgIDwvc3VtbWFyeT5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLXNjaGVtYS5taW4nPk1pbjwvbGFiZWw+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5TcGVjaWZpZXMgdGhlIG1pbmltdW0gdmFsdWU8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQgZ292dWstaW5wdXQtLXdpZHRoLTMnIGRhdGEtY2FzdD0nbnVtYmVyJ1xuICAgICAgICAgICAgaWQ9J2ZpZWxkLXNjaGVtYS5taW4nIG5hbWU9J3NjaGVtYS5taW4nXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU9e3NjaGVtYS5taW59IHR5cGU9J251bWJlcicgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdmaWVsZC1zY2hlbWEubWF4Jz5NYXg8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstaGludCc+U3BlY2lmaWVzIHRoZSBtYXhpbXVtIHZhbHVlPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0IGdvdnVrLWlucHV0LS13aWR0aC0zJyBkYXRhLWNhc3Q9J251bWJlcidcbiAgICAgICAgICAgIGlkPSdmaWVsZC1zY2hlbWEubWF4JyBuYW1lPSdzY2hlbWEubWF4J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtzY2hlbWEubWF4fSB0eXBlPSdudW1iZXInIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzIGdvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1jaGVja2JveGVzX19pdGVtJz5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWNoZWNrYm94ZXNfX2lucHV0JyBpZD0nZmllbGQtc2NoZW1hLmludGVnZXInIGRhdGEtY2FzdD0nYm9vbGVhbidcbiAgICAgICAgICAgICAgbmFtZT0nc2NoZW1hLmludGVnZXInIHR5cGU9J2NoZWNrYm94JyBkZWZhdWx0Q2hlY2tlZD17c2NoZW1hLmludGVnZXIgPT09IHRydWV9IC8+XG4gICAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1jaGVja2JveGVzX19sYWJlbCdcbiAgICAgICAgICAgICAgaHRtbEZvcj0nZmllbGQtc2NoZW1hLmludGVnZXInPkludGVnZXI8L2xhYmVsPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Q2xhc3NlcyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgIDwvZGV0YWlscz5cbiAgICA8L0ZpZWxkRWRpdD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxDbGFzc2VzIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gUmFkaW9zRmllbGRFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gcHJvcHNcbiAgY29uc3Qgb3B0aW9ucyA9IGNvbXBvbmVudC5vcHRpb25zIHx8IHt9XG4gIGNvbnN0IGxpc3RzID0gZGF0YS5saXN0c1xuXG4gIHJldHVybiAoXG4gICAgPEZpZWxkRWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0+XG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2ZpZWxkLW9wdGlvbnMubGlzdCc+TGlzdDwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCBnb3Z1ay1pbnB1dC0td2lkdGgtMTAnIGlkPSdmaWVsZC1vcHRpb25zLmxpc3QnIG5hbWU9J29wdGlvbnMubGlzdCdcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZT17b3B0aW9ucy5saXN0fSByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtsaXN0cy5tYXAobGlzdCA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiA8b3B0aW9uIGtleT17bGlzdC5uYW1lfSB2YWx1ZT17bGlzdC5uYW1lfT57bGlzdC50aXRsZX08L29wdGlvbj5cbiAgICAgICAgICAgIH0pfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvRmllbGRFZGl0PlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZEVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50LCBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCBvcHRpb25zID0gY29tcG9uZW50Lm9wdGlvbnMgfHwge31cbiAgY29uc3QgbGlzdHMgPSBkYXRhLmxpc3RzXG5cbiAgcmV0dXJuIChcbiAgICA8RmllbGRFZGl0IGNvbXBvbmVudD17Y29tcG9uZW50fT5cbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nZmllbGQtb3B0aW9ucy5saXN0Jz5MaXN0PC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0IGdvdnVrLWlucHV0LS13aWR0aC0xMCcgaWQ9J2ZpZWxkLW9wdGlvbnMubGlzdCcgbmFtZT0nb3B0aW9ucy5saXN0J1xuICAgICAgICAgICAgZGVmYXVsdFZhbHVlPXtvcHRpb25zLmxpc3R9IHJlcXVpcmVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge2xpc3RzLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIDxvcHRpb24ga2V5PXtsaXN0Lm5hbWV9IHZhbHVlPXtsaXN0Lm5hbWV9PntsaXN0LnRpdGxlfTwvb3B0aW9uPlxuICAgICAgICAgICAgfSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgPC9GaWVsZEVkaXQ+XG4gIClcbn1cblxuZnVuY3Rpb24gUGFyYUVkaXQgKHByb3BzKSB7XG4gIGNvbnN0IHsgY29tcG9uZW50IH0gPSBwcm9wc1xuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J3BhcmEtY29udGVudCc+Q29udGVudDwvbGFiZWw+XG4gICAgICA8dGV4dGFyZWEgY2xhc3NOYW1lPSdnb3Z1ay10ZXh0YXJlYScgaWQ9J3BhcmEtY29udGVudCcgbmFtZT0nY29udGVudCdcbiAgICAgICAgZGVmYXVsdFZhbHVlPXtjb21wb25lbnQuY29udGVudH0gcm93cz0nMTAnIHJlcXVpcmVkIC8+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuY29uc3QgSW5zZXRUZXh0RWRpdCA9IFBhcmFFZGl0XG5cbmZ1bmN0aW9uIERldGFpbHNFZGl0IChwcm9wcykge1xuICBjb25zdCB7IGNvbXBvbmVudCB9ID0gcHJvcHNcblxuICByZXR1cm4gKFxuICAgIDxkaXY+XG5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwnIGh0bWxGb3I9J2RldGFpbHMtdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdkZXRhaWxzLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsJyBodG1sRm9yPSdkZXRhaWxzLWNvbnRlbnQnPkNvbnRlbnQ8L2xhYmVsPlxuICAgICAgICA8dGV4dGFyZWEgY2xhc3NOYW1lPSdnb3Z1ay10ZXh0YXJlYScgaWQ9J2RldGFpbHMtY29udGVudCcgbmFtZT0nY29udGVudCdcbiAgICAgICAgICBkZWZhdWx0VmFsdWU9e2NvbXBvbmVudC5jb250ZW50fSByb3dzPScxMCcgcmVxdWlyZWQgLz5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApXG59XG5cbmNvbnN0IGNvbXBvbmVudFR5cGVFZGl0b3JzID0ge1xuICAnVGV4dEZpZWxkRWRpdCc6IFRleHRGaWVsZEVkaXQsXG4gICdFbWFpbEFkZHJlc3NGaWVsZEVkaXQnOiBUZXh0RmllbGRFZGl0LFxuICAnVGVsZXBob25lTnVtYmVyRmllbGRFZGl0JzogVGV4dEZpZWxkRWRpdCxcbiAgJ051bWJlckZpZWxkRWRpdCc6IE51bWJlckZpZWxkRWRpdCxcbiAgJ011bHRpbGluZVRleHRGaWVsZEVkaXQnOiBNdWx0aWxpbmVUZXh0RmllbGRFZGl0LFxuICAnU2VsZWN0RmllbGRFZGl0JzogU2VsZWN0RmllbGRFZGl0LFxuICAnUmFkaW9zRmllbGRFZGl0JzogUmFkaW9zRmllbGRFZGl0LFxuICAnQ2hlY2tib3hlc0ZpZWxkRWRpdCc6IENoZWNrYm94ZXNGaWVsZEVkaXQsXG4gICdQYXJhRWRpdCc6IFBhcmFFZGl0LFxuICAnSW5zZXRUZXh0RWRpdCc6IEluc2V0VGV4dEVkaXQsXG4gICdEZXRhaWxzRWRpdCc6IERldGFpbHNFZGl0XG59XG5cbmNsYXNzIENvbXBvbmVudFR5cGVFZGl0IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGNvbXBvbmVudCwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgdHlwZSA9IGNvbXBvbmVudFR5cGVzLmZpbmQodCA9PiB0Lm5hbWUgPT09IGNvbXBvbmVudC50eXBlKVxuICAgIGlmICghdHlwZSkge1xuICAgICAgcmV0dXJuICcnXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IFRhZ05hbWUgPSBjb21wb25lbnRUeXBlRWRpdG9yc1tgJHtjb21wb25lbnQudHlwZX1FZGl0YF0gfHwgRmllbGRFZGl0XG4gICAgICByZXR1cm4gPFRhZ05hbWUgY29tcG9uZW50PXtjb21wb25lbnR9IGRhdGE9e2RhdGF9IC8+XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudFR5cGVFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lLCBnZXRGb3JtRGF0YSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBDb21wb25lbnRUeXBlRWRpdCBmcm9tICcuL2NvbXBvbmVudC10eXBlLWVkaXQnXG5cbmNsYXNzIENvbXBvbmVudEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIHBhZ2UsIGNvbXBvbmVudCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGZvcm1EYXRhID0gZ2V0Rm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBjb3B5UGFnZSA9IGNvcHkucGFnZXMuZmluZChwID0+IHAucGF0aCA9PT0gcGFnZS5wYXRoKVxuXG4gICAgLy8gQXBwbHlcbiAgICBjb25zdCBjb21wb25lbnRJbmRleCA9IHBhZ2UuY29tcG9uZW50cy5pbmRleE9mKGNvbXBvbmVudClcbiAgICBjb3B5UGFnZS5jb21wb25lbnRzW2NvbXBvbmVudEluZGV4XSA9IGZvcm1EYXRhXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBwYWdlLCBjb21wb25lbnQgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBjb21wb25lbnRJZHggPSBwYWdlLmNvbXBvbmVudHMuZmluZEluZGV4KGMgPT4gYyA9PT0gY29tcG9uZW50KVxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBpc0xhc3QgPSBjb21wb25lbnRJZHggPT09IHBhZ2UuY29tcG9uZW50cy5sZW5ndGggLSAxXG5cbiAgICAvLyBSZW1vdmUgdGhlIGNvbXBvbmVudFxuICAgIGNvcHlQYWdlLmNvbXBvbmVudHMuc3BsaWNlKGNvbXBvbmVudElkeCwgMSlcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIGlmICghaXNMYXN0KSB7XG4gICAgICAgICAgLy8gV2UgZG9udCBoYXZlIGFuIGlkIHdlIGNhbiB1c2UgZm9yIGBrZXlgLWluZyByZWFjdCA8Q29tcG9uZW50IC8+J3NcbiAgICAgICAgICAvLyBXZSB0aGVyZWZvcmUgbmVlZCB0byBjb25kaXRpb25hbGx5IHJlcG9ydCBgb25FZGl0YCBjaGFuZ2VzLlxuICAgICAgICAgIHRoaXMucHJvcHMub25FZGl0KHsgZGF0YSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBwYWdlLCBjb21wb25lbnQsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHlDb21wID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShjb21wb25lbnQpKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxmb3JtIGF1dG9Db21wbGV0ZT0nb2ZmJyBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSd0eXBlJz5UeXBlPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5Jz57Y29tcG9uZW50LnR5cGV9PC9zcGFuPlxuICAgICAgICAgICAgPGlucHV0IGlkPSd0eXBlJyB0eXBlPSdoaWRkZW4nIG5hbWU9J3R5cGUnIGRlZmF1bHRWYWx1ZT17Y29tcG9uZW50LnR5cGV9IC8+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICA8Q29tcG9uZW50VHlwZUVkaXRcbiAgICAgICAgICAgIHBhZ2U9e3BhZ2V9XG4gICAgICAgICAgICBjb21wb25lbnQ9e2NvcHlDb21wfVxuICAgICAgICAgICAgZGF0YT17ZGF0YX0gLz5cblxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50RWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0IFNvcnRhYmxlSE9DICovXG5cbmltcG9ydCBGbHlvdXQgZnJvbSAnLi9mbHlvdXQnXG5pbXBvcnQgQ29tcG9uZW50RWRpdCBmcm9tICcuL2NvbXBvbmVudC1lZGl0J1xuY29uc3QgU29ydGFibGVIYW5kbGUgPSBTb3J0YWJsZUhPQy5Tb3J0YWJsZUhhbmRsZVxuY29uc3QgRHJhZ0hhbmRsZSA9IFNvcnRhYmxlSGFuZGxlKCgpID0+IDxzcGFuIGNsYXNzTmFtZT0nZHJhZy1oYW5kbGUnPiYjOTc3Njs8L3NwYW4+KVxuXG5leHBvcnQgY29uc3QgY29tcG9uZW50VHlwZXMgPSB7XG4gICdUZXh0RmllbGQnOiBUZXh0RmllbGQsXG4gICdUZWxlcGhvbmVOdW1iZXJGaWVsZCc6IFRlbGVwaG9uZU51bWJlckZpZWxkLFxuICAnTnVtYmVyRmllbGQnOiBOdW1iZXJGaWVsZCxcbiAgJ0VtYWlsQWRkcmVzc0ZpZWxkJzogRW1haWxBZGRyZXNzRmllbGQsXG4gICdUaW1lRmllbGQnOiBUaW1lRmllbGQsXG4gICdEYXRlRmllbGQnOiBEYXRlRmllbGQsXG4gICdEYXRlVGltZUZpZWxkJzogRGF0ZVRpbWVGaWVsZCxcbiAgJ0RhdGVQYXJ0c0ZpZWxkJzogRGF0ZVBhcnRzRmllbGQsXG4gICdEYXRlVGltZVBhcnRzRmllbGQnOiBEYXRlVGltZVBhcnRzRmllbGQsXG4gICdNdWx0aWxpbmVUZXh0RmllbGQnOiBNdWx0aWxpbmVUZXh0RmllbGQsXG4gICdSYWRpb3NGaWVsZCc6IFJhZGlvc0ZpZWxkLFxuICAnQ2hlY2tib3hlc0ZpZWxkJzogQ2hlY2tib3hlc0ZpZWxkLFxuICAnU2VsZWN0RmllbGQnOiBTZWxlY3RGaWVsZCxcbiAgJ1llc05vRmllbGQnOiBZZXNOb0ZpZWxkLFxuICAnVWtBZGRyZXNzRmllbGQnOiBVa0FkZHJlc3NGaWVsZCxcbiAgJ1BhcmEnOiBQYXJhLFxuICAnSW5zZXRUZXh0JzogSW5zZXRUZXh0LFxuICAnRGV0YWlscyc6IERldGFpbHNcbn1cblxuZnVuY3Rpb24gQmFzZSAocHJvcHMpIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvZGl2PlxuICApXG59XG5cbmZ1bmN0aW9uIENvbXBvbmVudEZpZWxkIChwcm9wcykge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAge3Byb3BzLmNoaWxkcmVufVxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZXh0RmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdib3gnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBUZWxlcGhvbmVOdW1iZXJGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCB0ZWwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBFbWFpbEFkZHJlc3NGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBlbWFpbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFVrQWRkcmVzc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCcgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYnV0dG9uIHNxdWFyZScgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIE11bHRpbGluZVRleHRGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggdGFsbCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIE51bWJlckZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94IG51bWJlcicgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIERhdGVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBkcm9wZG93bic+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+ZGQvbW0veXl5eTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVRpbWVGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBsYXJnZSBkcm9wZG93bic+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstYm9keSBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCc+ZGQvbW0veXl5eSBoaDptbTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gVGltZUZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nYm94Jz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdnb3Z1ay1ib2R5IGdvdnVrLSEtZm9udC1zaXplLTE0Jz5oaDptbTwvc3Bhbj5cbiAgICAgIDwvZGl2PlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGF0ZVRpbWVQYXJ0c0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCcgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IHNtYWxsIGdvdnVrLSEtbWFyZ2luLWxlZnQtMSBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggbWVkaXVtIGdvdnVrLSEtbWFyZ2luLXJpZ2h0LTEnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1yaWdodC0xJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBEYXRlUGFydHNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdib3ggc21hbGwnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2JveCBzbWFsbCBnb3Z1ay0hLW1hcmdpbi1sZWZ0LTEgZ292dWstIS1tYXJnaW4tcmlnaHQtMScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nYm94IG1lZGl1bScgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFJhZGlvc0ZpZWxkICgpIHtcbiAgcmV0dXJuIChcbiAgICA8Q29tcG9uZW50RmllbGQ+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2NpcmNsZScgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nbGluZSBzaG9ydCcgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIENoZWNrYm94ZXNGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtbWFyZ2luLWJvdHRvbS0xJz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdjaGVjaycgLz5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1tYXJnaW4tYm90dG9tLTEnPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2NoZWNrJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2hlY2snIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgPC9Db21wb25lbnRGaWVsZD5cbiAgKVxufVxuXG5mdW5jdGlvbiBTZWxlY3RGaWVsZCAoKSB7XG4gIHJldHVybiAoXG4gICAgPENvbXBvbmVudEZpZWxkPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2JveCBkcm9wZG93bicgLz5cbiAgICA8L0NvbXBvbmVudEZpZWxkPlxuICApXG59XG5cbmZ1bmN0aW9uIFllc05vRmllbGQgKCkge1xuICByZXR1cm4gKFxuICAgIDxDb21wb25lbnRGaWVsZD5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMSc+XG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgICA8c3BhbiBjbGFzc05hbWU9J2xpbmUgc2hvcnQnIC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nY2lyY2xlJyAvPlxuICAgICAgPHNwYW4gY2xhc3NOYW1lPSdsaW5lIHNob3J0JyAvPlxuICAgIDwvQ29tcG9uZW50RmllbGQ+XG4gIClcbn1cblxuZnVuY3Rpb24gRGV0YWlscyAoKSB7XG4gIHJldHVybiAoXG4gICAgPEJhc2U+XG4gICAgICB7YOKWtiBgfTxzcGFuIGNsYXNzTmFtZT0nbGluZSBkZXRhaWxzJyAvPlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5mdW5jdGlvbiBJbnNldFRleHQgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2luc2V0IGdvdnVrLSEtcGFkZGluZy1sZWZ0LTInPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZScgLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUgc2hvcnQgZ292dWstIS1tYXJnaW4tYm90dG9tLTIgZ292dWstIS1tYXJnaW4tdG9wLTInIC8+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgICAgPC9kaXY+XG4gICAgPC9CYXNlPlxuICApXG59XG5cbmZ1bmN0aW9uIFBhcmEgKCkge1xuICByZXR1cm4gKFxuICAgIDxCYXNlPlxuICAgICAgPGRpdiBjbGFzc05hbWU9J2xpbmUnIC8+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT0nbGluZSBzaG9ydCBnb3Z1ay0hLW1hcmdpbi1ib3R0b20tMiBnb3Z1ay0hLW1hcmdpbi10b3AtMicgLz5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdsaW5lJyAvPlxuICAgIDwvQmFzZT5cbiAgKVxufVxuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIHNob3dFZGl0b3IgPSAoZSwgdmFsdWUpID0+IHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IHZhbHVlIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSwgcGFnZSwgY29tcG9uZW50IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgVGFnTmFtZSA9IGNvbXBvbmVudFR5cGVzW2Ake2NvbXBvbmVudC50eXBlfWBdXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudCBnb3Z1ay0hLXBhZGRpbmctMidcbiAgICAgICAgICBvbkNsaWNrPXsoZSkgPT4gdGhpcy5zaG93RWRpdG9yKGUsIHRydWUpfT5cbiAgICAgICAgICA8RHJhZ0hhbmRsZSAvPlxuICAgICAgICAgIDxUYWdOYW1lIC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IENvbXBvbmVudCcgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfVxuICAgICAgICAgIG9uSGlkZT17ZSA9PiB0aGlzLnNob3dFZGl0b3IoZSwgZmFsc2UpfT5cbiAgICAgICAgICA8Q29tcG9uZW50RWRpdCBjb21wb25lbnQ9e2NvbXBvbmVudH0gcGFnZT17cGFnZX0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lLCBnZXRGb3JtRGF0YSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBDb21wb25lbnRUeXBlRWRpdCBmcm9tICcuL2NvbXBvbmVudC10eXBlLWVkaXQnXG4vLyBpbXBvcnQgeyBjb21wb25lbnRUeXBlcyBhcyBjb21wb25lbnRUeXBlc0ljb25zIH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgY29tcG9uZW50VHlwZXMgZnJvbSAnLi4vY29tcG9uZW50LXR5cGVzLmpzJ1xuXG5jbGFzcyBDb21wb25lbnRDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBmb3JtRGF0YSA9IGdldEZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcblxuICAgIC8vIEFwcGx5XG4gICAgY29weVBhZ2UuY29tcG9uZW50cy5wdXNoKGZvcm1EYXRhKVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkNyZWF0ZSh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3R5cGUnPlR5cGU8L2xhYmVsPlxuICAgICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J3R5cGUnIG5hbWU9J3R5cGUnIHJlcXVpcmVkXG4gICAgICAgICAgICAgIG9uQ2hhbmdlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBjb21wb25lbnQ6IHsgdHlwZTogZS50YXJnZXQudmFsdWUgfSB9KX0+XG4gICAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgICAge2NvbXBvbmVudFR5cGVzLm1hcCh0eXBlID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gPG9wdGlvbiBrZXk9e3R5cGUubmFtZX0gdmFsdWU9e3R5cGUubmFtZX0+e3R5cGUudGl0bGV9PC9vcHRpb24+XG4gICAgICAgICAgICAgIH0pfVxuICAgICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgICAgICB7Lyoge09iamVjdC5rZXlzKGNvbXBvbmVudFR5cGVzSWNvbnMpLm1hcCh0eXBlID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgVGFnID0gY29tcG9uZW50VHlwZXNJY29uc1t0eXBlXVxuICAgICAgICAgICAgICByZXR1cm4gPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudCBnb3Z1ay0hLXBhZGRpbmctMic+PFRhZyAvPjwvZGl2PlxuICAgICAgICAgICAgfSl9ICovfVxuICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAge3RoaXMuc3RhdGUuY29tcG9uZW50ICYmIHRoaXMuc3RhdGUuY29tcG9uZW50LnR5cGUgJiYgKFxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPENvbXBvbmVudFR5cGVFZGl0XG4gICAgICAgICAgICAgICAgcGFnZT17cGFnZX1cbiAgICAgICAgICAgICAgICBjb21wb25lbnQ9e3RoaXMuc3RhdGUuY29tcG9uZW50fVxuICAgICAgICAgICAgICAgIGRhdGE9e2RhdGF9IC8+XG5cbiAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPSdzdWJtaXQnIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJz5TYXZlPC9idXR0b24+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApfVxuXG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnRDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCBTb3J0YWJsZUhPQyAqL1xuXG5pbXBvcnQgRmx5b3V0IGZyb20gJy4vZmx5b3V0J1xuaW1wb3J0IFBhZ2VFZGl0IGZyb20gJy4vcGFnZS1lZGl0J1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnQnXG5pbXBvcnQgQ29tcG9uZW50Q3JlYXRlIGZyb20gJy4vY29tcG9uZW50LWNyZWF0ZSdcbmltcG9ydCBjb21wb25lbnRUeXBlcyBmcm9tICcuLi9jb21wb25lbnQtdHlwZXMuanMnXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY29uc3QgU29ydGFibGVFbGVtZW50ID0gU29ydGFibGVIT0MuU29ydGFibGVFbGVtZW50XG5jb25zdCBTb3J0YWJsZUNvbnRhaW5lciA9IFNvcnRhYmxlSE9DLlNvcnRhYmxlQ29udGFpbmVyXG5jb25zdCBhcnJheU1vdmUgPSBTb3J0YWJsZUhPQy5hcnJheU1vdmVcblxuY29uc3QgU29ydGFibGVJdGVtID0gU29ydGFibGVFbGVtZW50KCh7IGluZGV4LCBwYWdlLCBjb21wb25lbnQsIGRhdGEgfSkgPT5cbiAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudC1pdGVtJz5cbiAgICA8Q29tcG9uZW50IGtleT17aW5kZXh9IHBhZ2U9e3BhZ2V9IGNvbXBvbmVudD17Y29tcG9uZW50fSBkYXRhPXtkYXRhfSAvPlxuICA8L2Rpdj5cbilcblxuY29uc3QgU29ydGFibGVMaXN0ID0gU29ydGFibGVDb250YWluZXIoKHsgcGFnZSwgZGF0YSB9KSA9PiB7XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2NvbXBvbmVudC1saXN0Jz5cbiAgICAgIHtwYWdlLmNvbXBvbmVudHMubWFwKChjb21wb25lbnQsIGluZGV4KSA9PiAoXG4gICAgICAgIDxTb3J0YWJsZUl0ZW0ga2V5PXtpbmRleH0gaW5kZXg9e2luZGV4fSBwYWdlPXtwYWdlfSBjb21wb25lbnQ9e2NvbXBvbmVudH0gZGF0YT17ZGF0YX0gLz5cbiAgICAgICkpfVxuICAgIDwvZGl2PlxuICApXG59KVxuXG5jbGFzcyBQYWdlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIHNob3dFZGl0b3IgPSAoZSwgdmFsdWUpID0+IHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpXG4gICAgdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IHZhbHVlIH0pXG4gIH1cblxuICBvblNvcnRFbmQgPSAoeyBvbGRJbmRleCwgbmV3SW5kZXggfSkgPT4ge1xuICAgIGNvbnN0IHsgcGFnZSwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IGNvcHlQYWdlID0gY29weS5wYWdlcy5maW5kKHAgPT4gcC5wYXRoID09PSBwYWdlLnBhdGgpXG4gICAgY29weVBhZ2UuY29tcG9uZW50cyA9IGFycmF5TW92ZShjb3B5UGFnZS5jb21wb25lbnRzLCBvbGRJbmRleCwgbmV3SW5kZXgpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcblxuICAgIC8vIE9QVElNSVNUSUMgU0FWRSBUTyBTVE9QIEpVTVBcblxuICAgIC8vIGNvbnN0IHsgcGFnZSwgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIC8vIHBhZ2UuY29tcG9uZW50cyA9IGFycmF5TW92ZShwYWdlLmNvbXBvbmVudHMsIG9sZEluZGV4LCBuZXdJbmRleClcblxuICAgIC8vIGRhdGEuc2F2ZShkYXRhKVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHBhZ2UsIGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHNlY3Rpb25zIH0gPSBkYXRhXG4gICAgY29uc3QgZm9ybUNvbXBvbmVudHMgPSBwYWdlLmNvbXBvbmVudHMuZmlsdGVyKGNvbXAgPT4gY29tcG9uZW50VHlwZXMuZmluZCh0eXBlID0+IHR5cGUubmFtZSA9PT0gY29tcC50eXBlKS5zdWJUeXBlID09PSAnZmllbGQnKVxuICAgIGNvbnN0IHBhZ2VUaXRsZSA9IHBhZ2UudGl0bGUgfHwgKGZvcm1Db21wb25lbnRzLmxlbmd0aCA9PT0gMSAmJiBwYWdlLmNvbXBvbmVudHNbMF0gPT09IGZvcm1Db21wb25lbnRzWzBdID8gZm9ybUNvbXBvbmVudHNbMF0udGl0bGUgOiBwYWdlLnRpdGxlKVxuICAgIGNvbnN0IHNlY3Rpb24gPSBwYWdlLnNlY3Rpb24gJiYgc2VjdGlvbnMuZmluZChzZWN0aW9uID0+IHNlY3Rpb24ubmFtZSA9PT0gcGFnZS5zZWN0aW9uKVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdwYWdlIHh0b29sdGlwJyBzdHlsZT17dGhpcy5wcm9wcy5sYXlvdXR9PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0naGFuZGxlJyBvbkNsaWNrPXsoZSkgPT4gdGhpcy5zaG93RWRpdG9yKGUsIHRydWUpfSAvPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstIS1wYWRkaW5nLXRvcC0yIGdvdnVrLSEtcGFkZGluZy1sZWZ0LTIgZ292dWstIS1wYWRkaW5nLXJpZ2h0LTInPlxuXG4gICAgICAgICAgPGgzIGNsYXNzTmFtZT0nZ292dWstaGVhZGluZy1zJz5cbiAgICAgICAgICAgIHtzZWN0aW9uICYmIDxzcGFuIGNsYXNzTmFtZT0nZ292dWstY2FwdGlvbi1tIGdvdnVrLSEtZm9udC1zaXplLTE0Jz57c2VjdGlvbi50aXRsZX08L3NwYW4+fVxuICAgICAgICAgICAge3BhZ2VUaXRsZX1cbiAgICAgICAgICA8L2gzPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8U29ydGFibGVMaXN0IHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9IHByZXNzRGVsYXk9ezIwMH1cbiAgICAgICAgICBvblNvcnRFbmQ9e3RoaXMub25Tb3J0RW5kfSBsb2NrQXhpcz0neScgaGVscGVyQ2xhc3M9J2RyYWdnaW5nJ1xuICAgICAgICAgIGxvY2tUb0NvbnRhaW5lckVkZ2VzIHVzZURyYWdIYW5kbGUgLz5cbiAgICAgICAgey8qIHtwYWdlLmNvbXBvbmVudHMubWFwKChjb21wLCBpbmRleCkgPT4gKFxuICAgICAgICAgIDxDb21wb25lbnQga2V5PXtpbmRleH0gcGFnZT17cGFnZX0gY29tcG9uZW50PXtjb21wfSBkYXRhPXtkYXRhfSAvPlxuICAgICAgICApKX0gKi99XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLSEtcGFkZGluZy0yJz5cbiAgICAgICAgICA8YSBjbGFzc05hbWU9J3ByZXZpZXcgcHVsbC1yaWdodCBnb3Z1ay1ib2R5IGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgICAgaHJlZj17cGFnZS5wYXRofSB0YXJnZXQ9J3ByZXZpZXcnPk9wZW48L2E+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2J1dHRvbiBhY3RpdmUnXG4gICAgICAgICAgICBvbkNsaWNrPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkQ29tcG9uZW50OiB0cnVlIH0pfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdFZGl0IFBhZ2UnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRvcn1cbiAgICAgICAgICBvbkhpZGU9e2UgPT4gdGhpcy5zaG93RWRpdG9yKGUsIGZhbHNlKX0+XG4gICAgICAgICAgPFBhZ2VFZGl0IHBhZ2U9e3BhZ2V9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdBZGQgQ29tcG9uZW50JyBzaG93PXt0aGlzLnN0YXRlLnNob3dBZGRDb21wb25lbnR9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZENvbXBvbmVudDogZmFsc2UgfSl9PlxuICAgICAgICAgIDxDb21wb25lbnRDcmVhdGUgcGFnZT17cGFnZX0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uQ3JlYXRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkQ29tcG9uZW50OiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUGFnZVxuIiwiXG5mdW5jdGlvbiBjb21wb25lbnRUb1N0cmluZyAoY29tcG9uZW50KSB7XG4gIHJldHVybiBgJHtjb21wb25lbnQudHlwZX1gXG59XG5cbmZ1bmN0aW9uIERhdGFNb2RlbCAocHJvcHMpIHtcbiAgY29uc3QgeyBkYXRhIH0gPSBwcm9wc1xuICBjb25zdCB7IHNlY3Rpb25zLCBwYWdlcyB9ID0gZGF0YVxuXG4gIGNvbnN0IG1vZGVsID0ge31cblxuICBwYWdlcy5mb3JFYWNoKHBhZ2UgPT4ge1xuICAgIHBhZ2UuY29tcG9uZW50cy5mb3JFYWNoKGNvbXBvbmVudCA9PiB7XG4gICAgICBpZiAoY29tcG9uZW50Lm5hbWUpIHtcbiAgICAgICAgaWYgKHBhZ2Uuc2VjdGlvbikge1xuICAgICAgICAgIGNvbnN0IHNlY3Rpb24gPSBzZWN0aW9ucy5maW5kKHNlY3Rpb24gPT4gc2VjdGlvbi5uYW1lID09PSBwYWdlLnNlY3Rpb24pXG4gICAgICAgICAgaWYgKCFtb2RlbFtzZWN0aW9uLm5hbWVdKSB7XG4gICAgICAgICAgICBtb2RlbFtzZWN0aW9uLm5hbWVdID0ge31cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBtb2RlbFtzZWN0aW9uLm5hbWVdW2NvbXBvbmVudC5uYW1lXSA9IGNvbXBvbmVudFRvU3RyaW5nKGNvbXBvbmVudClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtb2RlbFtjb21wb25lbnQubmFtZV0gPSBjb21wb25lbnRUb1N0cmluZyhjb21wb25lbnQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9KVxuXG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9Jyc+XG4gICAgICA8cHJlPntKU09OLnN0cmluZ2lmeShtb2RlbCwgbnVsbCwgMil9PC9wcmU+XG4gICAgPC9kaXY+XG4gIClcbn1cblxuZXhwb3J0IGRlZmF1bHQgRGF0YU1vZGVsXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBQYWdlQ3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgcGF0aCA9IGZvcm1EYXRhLmdldCgncGF0aCcpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgLy8gVmFsaWRhdGVcbiAgICBpZiAoZGF0YS5wYWdlcy5maW5kKHBhZ2UgPT4gcGFnZS5wYXRoID09PSBwYXRoKSkge1xuICAgICAgZm9ybS5lbGVtZW50cy5wYXRoLnNldEN1c3RvbVZhbGlkaXR5KGBQYXRoICcke3BhdGh9JyBhbHJlYWR5IGV4aXN0c2ApXG4gICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHZhbHVlID0ge1xuICAgICAgcGF0aDogcGF0aFxuICAgIH1cblxuICAgIGNvbnN0IHRpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IHNlY3Rpb24gPSBmb3JtRGF0YS5nZXQoJ3NlY3Rpb24nKS50cmltKClcblxuICAgIGlmICh0aXRsZSkge1xuICAgICAgdmFsdWUudGl0bGUgPSB0aXRsZVxuICAgIH1cbiAgICBpZiAoc2VjdGlvbikge1xuICAgICAgdmFsdWUuc2VjdGlvbiA9IHNlY3Rpb25cbiAgICB9XG5cbiAgICAvLyBBcHBseVxuICAgIE9iamVjdC5hc3NpZ24odmFsdWUsIHtcbiAgICAgIGNvbXBvbmVudHM6IFtdLFxuICAgICAgbmV4dDogW11cbiAgICB9KVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICBjb3B5LnBhZ2VzLnB1c2godmFsdWUpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlKHsgdmFsdWUgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgLy8gb25CbHVyTmFtZSA9IGUgPT4ge1xuICAvLyAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgLy8gICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgLy8gICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgLy8gICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgLy8gICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbC5uYW1lID09PSBuZXdOYW1lKSkge1xuICAvLyAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYExpc3QgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgLy8gICB9IGVsc2Uge1xuICAvLyAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gIC8vICAgfVxuICAvLyB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHNlY3Rpb25zIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtcGF0aCc+UGF0aDwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdwYWdlLXBhdGgnIG5hbWU9J3BhdGgnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyByZXF1aXJlZFxuICAgICAgICAgICAgb25DaGFuZ2U9e2UgPT4gZS50YXJnZXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpfSAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2UtdGl0bGUnPlRpdGxlIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdwYWdlLXRpdGxlLWhpbnQnIGNsYXNzTmFtZT0nZ292dWstaGludCc+XG4gICAgICAgICAgICBJZiBub3Qgc3VwcGxpZWQsIHRoZSB0aXRsZSBvZiB0aGUgZmlyc3QgcXVlc3Rpb24gd2lsbCBiZSB1c2VkLlxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3BhZ2UtdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0ncGFnZS10aXRsZS1oaW50JyAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3BhZ2Utc2VjdGlvbic+U2VjdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0ncGFnZS1zZWN0aW9uJyBuYW1lPSdzZWN0aW9uJz5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoc2VjdGlvbiA9PiAoPG9wdGlvbiBrZXk9e3NlY3Rpb24ubmFtZX0gdmFsdWU9e3NlY3Rpb24ubmFtZX0+e3NlY3Rpb24udGl0bGV9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gdHlwZT0nc3VibWl0JyBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbic+U2F2ZTwvYnV0dG9uPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBQYWdlQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCB7IGNsb25lIH0gZnJvbSAnLi9oZWxwZXJzJ1xuXG5jbGFzcyBMaW5rRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuXG4gICAgY29uc3QgeyBkYXRhLCBlZGdlIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgcGFnZSA9IGRhdGEucGFnZXMuZmluZChwYWdlID0+IHBhZ2UucGF0aCA9PT0gZWRnZS5zb3VyY2UpXG4gICAgY29uc3QgbGluayA9IHBhZ2UubmV4dC5maW5kKG4gPT4gbi5wYXRoID09PSBlZGdlLnRhcmdldClcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBwYWdlOiBwYWdlLFxuICAgICAgbGluazogbGlua1xuICAgIH1cbiAgfVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpLnRyaW0oKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGluayA9IGNvcHlQYWdlLm5leHQuZmluZChuID0+IG4ucGF0aCA9PT0gbGluay5wYXRoKVxuXG4gICAgaWYgKGNvbmRpdGlvbikge1xuICAgICAgY29weUxpbmsuaWYgPSBjb25kaXRpb25cbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGNvcHlMaW5rLmlmXG4gICAgfVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgbGluaywgcGFnZSB9ID0gdGhpcy5zdGF0ZVxuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG4gICAgY29uc3QgY29weVBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IHBhZ2UucGF0aClcbiAgICBjb25zdCBjb3B5TGlua0lkeCA9IGNvcHlQYWdlLm5leHQuZmluZEluZGV4KG4gPT4gbi5wYXRoID09PSBsaW5rLnBhdGgpXG4gICAgY29weVBhZ2UubmV4dC5zcGxpY2UoY29weUxpbmtJZHgsIDEpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGxpbmsgfSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IGRhdGEsIGVkZ2UgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IHBhZ2VzIH0gPSBkYXRhXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGZvcm0gb25TdWJtaXQ9e2UgPT4gdGhpcy5vblN1Ym1pdChlKX0gYXV0b0NvbXBsZXRlPSdvZmYnPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstc291cmNlJz5Gcm9tPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGRlZmF1bHRWYWx1ZT17ZWRnZS5zb3VyY2V9IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGluay1zb3VyY2UnIGRpc2FibGVkPlxuICAgICAgICAgICAgPG9wdGlvbiAvPlxuICAgICAgICAgICAge3BhZ2VzLm1hcChwYWdlID0+ICg8b3B0aW9uIGtleT17cGFnZS5wYXRofSB2YWx1ZT17cGFnZS5wYXRofT57cGFnZS5wYXRofTwvb3B0aW9uPikpfVxuICAgICAgICAgIDwvc2VsZWN0PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J2xpbmstdGFyZ2V0Jz5UbzwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBkZWZhdWx0VmFsdWU9e2VkZ2UudGFyZ2V0fSBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstdGFyZ2V0JyBkaXNhYmxlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLWNvbmRpdGlvbic+Q29uZGl0aW9uIChvcHRpb25hbCk8L2xhYmVsPlxuICAgICAgICAgIDxzcGFuIGlkPSdsaW5rLWNvbmRpdGlvbi1oaW50JyBjbGFzc05hbWU9J2dvdnVrLWhpbnQnPlxuICAgICAgICAgICAgVGhlIGxpbmsgd2lsbCBvbmx5IGJlIHVzZWQgaWYgdGhlIGV4cHJlc3Npb24gZXZhbHVhdGVzIHRvIHRydXRoeS5cbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaW5rLWNvbmRpdGlvbicgbmFtZT0naWYnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpbmsuaWZ9IGFyaWEtZGVzY3JpYmVkYnk9J2xpbmstY29uZGl0aW9uLWhpbnQnIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlua0VkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIExpbmtDcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBmcm9tID0gZm9ybURhdGEuZ2V0KCdwYXRoJylcbiAgICBjb25zdCB0byA9IGZvcm1EYXRhLmdldCgncGFnZScpXG4gICAgY29uc3QgY29uZGl0aW9uID0gZm9ybURhdGEuZ2V0KCdpZicpXG5cbiAgICAvLyBBcHBseVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IHBhZ2UgPSBjb3B5LnBhZ2VzLmZpbmQocCA9PiBwLnBhdGggPT09IGZyb20pXG5cbiAgICBjb25zdCBuZXh0ID0geyBwYXRoOiB0byB9XG5cbiAgICBpZiAoY29uZGl0aW9uKSB7XG4gICAgICBuZXh0LmlmID0gY29uZGl0aW9uXG4gICAgfVxuXG4gICAgaWYgKCFwYWdlLm5leHQpIHtcbiAgICAgIHBhZ2UubmV4dCA9IFtdXG4gICAgfVxuXG4gICAgcGFnZS5uZXh0LnB1c2gobmV4dClcblxuICAgIGRhdGEuc2F2ZShjb3B5KVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXG4gICAgICAgIHRoaXMucHJvcHMub25DcmVhdGUoeyBuZXh0IH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXNvdXJjZSc+RnJvbTwvbGFiZWw+XG4gICAgICAgICAgPHNlbGVjdCBjbGFzc05hbWU9J2dvdnVrLXNlbGVjdCcgaWQ9J2xpbmstc291cmNlJyBuYW1lPSdwYXRoJyByZXF1aXJlZD5cbiAgICAgICAgICAgIDxvcHRpb24gLz5cbiAgICAgICAgICAgIHtwYWdlcy5tYXAocGFnZSA9PiAoPG9wdGlvbiBrZXk9e3BhZ2UucGF0aH0gdmFsdWU9e3BhZ2UucGF0aH0+e3BhZ2UucGF0aH08L29wdGlvbj4pKX1cbiAgICAgICAgICA8L3NlbGVjdD5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaW5rLXRhcmdldCc+VG88L2xhYmVsPlxuICAgICAgICAgIDxzZWxlY3QgY2xhc3NOYW1lPSdnb3Z1ay1zZWxlY3QnIGlkPSdsaW5rLXRhcmdldCcgbmFtZT0ncGFnZScgcmVxdWlyZWQ+XG4gICAgICAgICAgICA8b3B0aW9uIC8+XG4gICAgICAgICAgICB7cGFnZXMubWFwKHBhZ2UgPT4gKDxvcHRpb24ga2V5PXtwYWdlLnBhdGh9IHZhbHVlPXtwYWdlLnBhdGh9PntwYWdlLnBhdGh9PC9vcHRpb24+KSl9XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGluay1jb25kaXRpb24nPkNvbmRpdGlvbiAob3B0aW9uYWwpPC9sYWJlbD5cbiAgICAgICAgICA8c3BhbiBpZD0nbGluay1jb25kaXRpb24taGludCcgY2xhc3NOYW1lPSdnb3Z1ay1oaW50Jz5cbiAgICAgICAgICAgIFRoZSBsaW5rIHdpbGwgb25seSBiZSB1c2VkIGlmIHRoZSBleHByZXNzaW9uIGV2YWx1YXRlcyB0byB0cnV0aHkuXG4gICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGluay1jb25kaXRpb24nIG5hbWU9J2lmJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgYXJpYS1kZXNjcmliZWRieT0nbGluay1jb25kaXRpb24taGludCcgLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+XG4gICAgICA8L2Zvcm0+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpbmtDcmVhdGVcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmZ1bmN0aW9uIGhlYWREdXBsaWNhdGUgKGFycikge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgIGZvciAobGV0IGogPSBpICsgMTsgaiA8IGFyci5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGFycltqXSA9PT0gYXJyW2ldKSB7XG4gICAgICAgIHJldHVybiBqXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIExpc3RJdGVtcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIGNvbnN0cnVjdG9yIChwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKVxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICBpdGVtczogcHJvcHMuaXRlbXMgPyBjbG9uZShwcm9wcy5pdGVtcykgOiBbXVxuICAgIH1cbiAgfVxuXG4gIG9uQ2xpY2tBZGRJdGVtID0gZSA9PiB7XG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBpdGVtczogdGhpcy5zdGF0ZS5pdGVtcy5jb25jYXQoeyB0ZXh0OiAnJywgdmFsdWU6ICcnIH0pXG4gICAgfSlcbiAgfVxuXG4gIHJlbW92ZUl0ZW0gPSBpZHggPT4ge1xuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgaXRlbXM6IHRoaXMuc3RhdGUuaXRlbXMuZmlsdGVyKChzLCBpKSA9PiBpICE9PSBpZHgpXG4gICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgbGlzdCB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBsaXN0XG4gICAgY29weS5saXN0cy5zcGxpY2UoZGF0YS5saXN0cy5pbmRleE9mKGxpc3QpLCAxKVxuXG4gICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAubGlzdCA9PT0gbGlzdC5uYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBwLmxpc3RcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ciA9IGUgPT4ge1xuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldC5mb3JtXG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgdGV4dHMgPSBmb3JtRGF0YS5nZXRBbGwoJ3RleHQnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCB2YWx1ZXMgPSBmb3JtRGF0YS5nZXRBbGwoJ3ZhbHVlJykubWFwKHQgPT4gdC50cmltKCkpXG5cbiAgICAvLyBPbmx5IHZhbGlkYXRlIGR1cGVzIGlmIHRoZXJlIGlzIG1vcmUgdGhhbiBvbmUgaXRlbVxuICAgIGlmICh0ZXh0cy5sZW5ndGggPCAyKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBmb3JtLmVsZW1lbnRzLnRleHQuZm9yRWFjaChlbCA9PiBlbC5zZXRDdXN0b21WYWxpZGl0eSgnJykpXG4gICAgZm9ybS5lbGVtZW50cy52YWx1ZS5mb3JFYWNoKGVsID0+IGVsLnNldEN1c3RvbVZhbGlkaXR5KCcnKSlcblxuICAgIC8vIFZhbGlkYXRlIHVuaXF1ZW5lc3NcbiAgICBjb25zdCBkdXBlVGV4dCA9IGhlYWREdXBsaWNhdGUodGV4dHMpXG4gICAgaWYgKGR1cGVUZXh0KSB7XG4gICAgICBmb3JtLmVsZW1lbnRzLnRleHRbZHVwZVRleHRdLnNldEN1c3RvbVZhbGlkaXR5KCdEdXBsaWNhdGUgdGV4dHMgZm91bmQgaW4gdGhlIGxpc3QgaXRlbXMnKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgZHVwZVZhbHVlID0gaGVhZER1cGxpY2F0ZSh2YWx1ZXMpXG4gICAgaWYgKGR1cGVWYWx1ZSkge1xuICAgICAgZm9ybS5lbGVtZW50cy52YWx1ZVtkdXBlVmFsdWVdLnNldEN1c3RvbVZhbGlkaXR5KCdEdXBsaWNhdGUgdmFsdWVzIGZvdW5kIGluIHRoZSBsaXN0IGl0ZW1zJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgaXRlbXMgfSA9IHRoaXMuc3RhdGVcbiAgICBjb25zdCB7IHR5cGUgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8dGFibGUgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZSc+XG4gICAgICAgIDxjYXB0aW9uIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NhcHRpb24nPkl0ZW1zPC9jYXB0aW9uPlxuICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9faGVhZCc+XG4gICAgICAgICAgPHRyIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX3Jvdyc+XG4gICAgICAgICAgICA8dGggY2xhc3NOYW1lPSdnb3Z1ay10YWJsZV9faGVhZGVyJyBzY29wZT0nY29sJz5UZXh0PC90aD5cbiAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkZXInIHNjb3BlPSdjb2wnPlZhbHVlPC90aD5cbiAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19oZWFkZXInIHNjb3BlPSdjb2wnPlxuICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e3RoaXMub25DbGlja0FkZEl0ZW19PkFkZDwvYT5cbiAgICAgICAgICAgIDwvdGg+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgPC90aGVhZD5cbiAgICAgICAgPHRib2R5IGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2JvZHknPlxuICAgICAgICAgIHtpdGVtcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiAoXG4gICAgICAgICAgICA8dHIga2V5PXtpdGVtLnZhbHVlICsgaW5kZXh9IGNsYXNzTmFtZT0nZ292dWstdGFibGVfX3Jvdycgc2NvcGU9J3Jvdyc+XG4gICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9J2dvdnVrLXRhYmxlX19jZWxsJz5cbiAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgbmFtZT0ndGV4dCdcbiAgICAgICAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17aXRlbS50ZXh0fSByZXF1aXJlZFxuICAgICAgICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1cn0gLz5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnPlxuICAgICAgICAgICAgICAgIHt0eXBlID09PSAnbnVtYmVyJ1xuICAgICAgICAgICAgICAgICAgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBuYW1lPSd2YWx1ZSdcbiAgICAgICAgICAgICAgICAgICAgICB0eXBlPSdudW1iZXInIGRlZmF1bHRWYWx1ZT17aXRlbS52YWx1ZX0gcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyfSBzdGVwPSdhbnknIC8+XG4gICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICA6IChcbiAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIG5hbWU9J3ZhbHVlJ1xuICAgICAgICAgICAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17aXRlbS52YWx1ZX0gcmVxdWlyZWRcbiAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyfSAvPlxuICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0nZ292dWstdGFibGVfX2NlbGwnIHdpZHRoPScyMHB4Jz5cbiAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9J2xpc3QtaXRlbS1kZWxldGUnIG9uQ2xpY2s9eygpID0+IHRoaXMucmVtb3ZlSXRlbShpbmRleCl9PiYjMTI4NDY1OzwvYT5cbiAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgKSl9XG4gICAgICAgIDwvdGJvZHk+XG4gICAgICA8L3RhYmxlPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0SXRlbXNcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5pbXBvcnQgTGlzdEl0ZW1zIGZyb20gJy4vbGlzdC1pdGVtcydcblxuY2xhc3MgTGlzdEVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBjb25zdHJ1Y3RvciAocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcylcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICB0eXBlOiBwcm9wcy5saXN0LnR5cGVcbiAgICB9XG4gIH1cblxuICBvblN1Ym1pdCA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuICAgIGNvbnN0IGZvcm0gPSBlLnRhcmdldFxuICAgIGNvbnN0IGZvcm1EYXRhID0gbmV3IHdpbmRvdy5Gb3JtRGF0YShmb3JtKVxuICAgIGNvbnN0IG5ld05hbWUgPSBmb3JtRGF0YS5nZXQoJ25hbWUnKS50cmltKClcbiAgICBjb25zdCBuZXdUaXRsZSA9IGZvcm1EYXRhLmdldCgndGl0bGUnKS50cmltKClcbiAgICBjb25zdCBuZXdUeXBlID0gZm9ybURhdGEuZ2V0KCd0eXBlJylcbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcblxuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuICAgIGNvbnN0IG5hbWVDaGFuZ2VkID0gbmV3TmFtZSAhPT0gbGlzdC5uYW1lXG4gICAgY29uc3QgY29weUxpc3QgPSBjb3B5Lmxpc3RzW2RhdGEubGlzdHMuaW5kZXhPZihsaXN0KV1cblxuICAgIGlmIChuYW1lQ2hhbmdlZCkge1xuICAgICAgY29weUxpc3QubmFtZSA9IG5ld05hbWVcblxuICAgICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBsaXN0XG4gICAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIHAuY29tcG9uZW50cy5mb3JFYWNoKGMgPT4ge1xuICAgICAgICAgIGlmIChjLnR5cGUgPT09ICdTZWxlY3RGaWVsZCcgfHwgYy50eXBlID09PSAnUmFkaW9zRmllbGQnKSB7XG4gICAgICAgICAgICBpZiAoYy5vcHRpb25zICYmIGMub3B0aW9ucy5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgICAgICAgYy5vcHRpb25zLmxpc3QgPSBuZXdOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBjb3B5TGlzdC50aXRsZSA9IG5ld1RpdGxlXG4gICAgY29weUxpc3QudHlwZSA9IG5ld1R5cGVcblxuICAgIC8vIEl0ZW1zXG4gICAgY29uc3QgdGV4dHMgPSBmb3JtRGF0YS5nZXRBbGwoJ3RleHQnKS5tYXAodCA9PiB0LnRyaW0oKSlcbiAgICBjb25zdCB2YWx1ZXMgPSBmb3JtRGF0YS5nZXRBbGwoJ3ZhbHVlJykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29weUxpc3QuaXRlbXMgPSB0ZXh0cy5tYXAoKHQsIGkpID0+ICh7IHRleHQ6IHQsIHZhbHVlOiB2YWx1ZXNbaV0gfSkpXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25DbGlja0RlbGV0ZSA9IGUgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgaWYgKCF3aW5kb3cuY29uZmlybSgnQ29uZmlybSBkZWxldGUnKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgY29uc3QgeyBkYXRhLCBsaXN0IH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBSZW1vdmUgdGhlIGxpc3RcbiAgICBjb3B5Lmxpc3RzLnNwbGljZShkYXRhLmxpc3RzLmluZGV4T2YobGlzdCksIDEpXG5cbiAgICAvLyBVcGRhdGUgYW55IHJlZmVyZW5jZXMgdG8gdGhlIGxpc3RcbiAgICBjb3B5LnBhZ2VzLmZvckVhY2gocCA9PiB7XG4gICAgICBpZiAocC5saXN0ID09PSBsaXN0Lm5hbWUpIHtcbiAgICAgICAgZGVsZXRlIHAubGlzdFxuICAgICAgfVxuICAgIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uRWRpdCh7IGRhdGEgfSlcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpXG4gICAgICB9KVxuICB9XG5cbiAgb25CbHVyTmFtZSA9IGUgPT4ge1xuICAgIGNvbnN0IGlucHV0ID0gZS50YXJnZXRcbiAgICBjb25zdCB7IGRhdGEsIGxpc3QgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCBuZXdOYW1lID0gaW5wdXQudmFsdWUudHJpbSgpXG5cbiAgICAvLyBWYWxpZGF0ZSBpdCBpcyB1bmlxdWVcbiAgICBpZiAoZGF0YS5saXN0cy5maW5kKGwgPT4gbCAhPT0gbGlzdCAmJiBsLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTGlzdCAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5zdGF0ZVxuICAgIGNvbnN0IHsgbGlzdCB9ID0gdGhpcy5wcm9wc1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC1uYW1lJyBuYW1lPSduYW1lJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgZGVmYXVsdFZhbHVlPXtsaXN0Lm5hbWV9IHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10aXRsZSc+VGl0bGU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC10aXRsZScgbmFtZT0ndGl0bGUnXG4gICAgICAgICAgICB0eXBlPSd0ZXh0JyBkZWZhdWx0VmFsdWU9e2xpc3QudGl0bGV9IHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10eXBlJz5WYWx1ZSB0eXBlPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGlzdC10eXBlJyBuYW1lPSd0eXBlJ1xuICAgICAgICAgICAgdmFsdWU9e3N0YXRlLnR5cGV9XG4gICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgdHlwZTogZS50YXJnZXQudmFsdWUgfSl9PlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0nc3RyaW5nJz5TdHJpbmc8L29wdGlvbj5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J251bWJlcic+TnVtYmVyPC9vcHRpb24+XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxMaXN0SXRlbXMgaXRlbXM9e2xpc3QuaXRlbXN9IHR5cGU9e3N0YXRlLnR5cGV9IC8+XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nc3VibWl0Jz5TYXZlPC9idXR0b24+eycgJ31cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbicgdHlwZT0nYnV0dG9uJyBvbkNsaWNrPXt0aGlzLm9uQ2xpY2tEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBMaXN0RWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcbmltcG9ydCBMaXN0SXRlbXMgZnJvbSAnLi9saXN0LWl0ZW1zJ1xuXG5jbGFzcyBMaXN0Q3JlYXRlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IgKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpXG5cbiAgICB0aGlzLnN0YXRlID0ge1xuICAgICAgdHlwZTogcHJvcHMudHlwZVxuICAgIH1cbiAgfVxuXG4gIG9uU3VibWl0ID0gZSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY29uc3QgZm9ybSA9IGUudGFyZ2V0XG4gICAgY29uc3QgZm9ybURhdGEgPSBuZXcgd2luZG93LkZvcm1EYXRhKGZvcm0pXG4gICAgY29uc3QgbmFtZSA9IGZvcm1EYXRhLmdldCgnbmFtZScpLnRyaW0oKVxuICAgIGNvbnN0IHRpdGxlID0gZm9ybURhdGEuZ2V0KCd0aXRsZScpLnRyaW0oKVxuICAgIGNvbnN0IHR5cGUgPSBmb3JtRGF0YS5nZXQoJ3R5cGUnKVxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICAvLyBJdGVtc1xuICAgIGNvbnN0IHRleHRzID0gZm9ybURhdGEuZ2V0QWxsKCd0ZXh0JykubWFwKHQgPT4gdC50cmltKCkpXG4gICAgY29uc3QgdmFsdWVzID0gZm9ybURhdGEuZ2V0QWxsKCd2YWx1ZScpLm1hcCh0ID0+IHQudHJpbSgpKVxuICAgIGNvbnN0IGl0ZW1zID0gdGV4dHMubWFwKCh0LCBpKSA9PiAoeyB0ZXh0OiB0LCB2YWx1ZTogdmFsdWVzW2ldIH0pKVxuXG4gICAgY29weS5saXN0cy5wdXNoKHsgbmFtZSwgdGl0bGUsIHR5cGUsIGl0ZW1zIH0pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlKHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkJsdXJOYW1lID0gZSA9PiB7XG4gICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IG5ld05hbWUgPSBpbnB1dC52YWx1ZS50cmltKClcblxuICAgIC8vIFZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgIGlmIChkYXRhLmxpc3RzLmZpbmQobCA9PiBsLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTGlzdCAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5zdGF0ZVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxmb3JtIG9uU3VibWl0PXtlID0+IHRoaXMub25TdWJtaXQoZSl9IGF1dG9Db21wbGV0ZT0nb2ZmJz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LW5hbWUnPk5hbWU8L2xhYmVsPlxuICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9J2dvdnVrLWlucHV0JyBpZD0nbGlzdC1uYW1lJyBuYW1lPSduYW1lJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWQgcGF0dGVybj0nXlxcUysnXG4gICAgICAgICAgICBvbkJsdXI9e3RoaXMub25CbHVyTmFtZX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdsaXN0LXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdsaXN0LXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIC8+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nbGlzdC10eXBlJz5WYWx1ZSB0eXBlPC9sYWJlbD5cbiAgICAgICAgICA8c2VsZWN0IGNsYXNzTmFtZT0nZ292dWstc2VsZWN0JyBpZD0nbGlzdC10eXBlJyBuYW1lPSd0eXBlJ1xuICAgICAgICAgICAgdmFsdWU9e3N0YXRlLnR5cGV9XG4gICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgdHlwZTogZS50YXJnZXQudmFsdWUgfSl9PlxuICAgICAgICAgICAgPG9wdGlvbiB2YWx1ZT0nc3RyaW5nJz5TdHJpbmc8L29wdGlvbj5cbiAgICAgICAgICAgIDxvcHRpb24gdmFsdWU9J251bWJlcic+TnVtYmVyPC9vcHRpb24+XG4gICAgICAgICAgPC9zZWxlY3Q+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxMaXN0SXRlbXMgdHlwZT17c3RhdGUudHlwZX0gLz5cblxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uJyB0eXBlPSdzdWJtaXQnPlNhdmU8L2J1dHRvbj5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTGlzdENyZWF0ZVxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgTGlzdEVkaXQgZnJvbSAnLi9saXN0LWVkaXQnXG5pbXBvcnQgTGlzdENyZWF0ZSBmcm9tICcuL2xpc3QtY3JlYXRlJ1xuXG5jbGFzcyBMaXN0c0VkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25DbGlja0xpc3QgPSAoZSwgbGlzdCkgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBsaXN0OiBsaXN0XG4gICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tBZGRMaXN0ID0gKGUsIGxpc3QpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2hvd0FkZExpc3Q6IHRydWVcbiAgICB9KVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcbiAgICBjb25zdCB7IGxpc3RzIH0gPSBkYXRhXG4gICAgY29uc3QgbGlzdCA9IHRoaXMuc3RhdGUubGlzdFxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1ib2R5Jz5cbiAgICAgICAgeyFsaXN0ID8gKFxuICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICB7dGhpcy5zdGF0ZS5zaG93QWRkTGlzdCA/IChcbiAgICAgICAgICAgICAgPExpc3RDcmVhdGUgZGF0YT17ZGF0YX1cbiAgICAgICAgICAgICAgICBvbkNyZWF0ZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpc3Q6IGZhbHNlIH0pfVxuICAgICAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkTGlzdDogZmFsc2UgfSl9IC8+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICA8dWwgY2xhc3NOYW1lPSdnb3Z1ay1saXN0Jz5cbiAgICAgICAgICAgICAgICB7bGlzdHMubWFwKChsaXN0LCBpbmRleCkgPT4gKFxuICAgICAgICAgICAgICAgICAgPGxpIGtleT17bGlzdC5uYW1lfT5cbiAgICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tMaXN0KGUsIGxpc3QpfT5cbiAgICAgICAgICAgICAgICAgICAgICB7bGlzdC50aXRsZX1cbiAgICAgICAgICAgICAgICAgICAgPC9hPiAoe2xpc3QubmFtZX0pXG4gICAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAgICAgIDxociAvPlxuICAgICAgICAgICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17ZSA9PiB0aGlzLm9uQ2xpY2tBZGRMaXN0KGUpfT5BZGQgbGlzdDwvYT5cbiAgICAgICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgICA8L3VsPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8TGlzdEVkaXQgbGlzdD17bGlzdH0gZGF0YT17ZGF0YX1cbiAgICAgICAgICAgIG9uRWRpdD17ZSA9PiB0aGlzLnNldFN0YXRlKHsgbGlzdDogbnVsbCB9KX1cbiAgICAgICAgICAgIG9uQ2FuY2VsPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBsaXN0OiBudWxsIH0pfSAvPlxuICAgICAgICApfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IExpc3RzRWRpdFxuIiwiLyogZ2xvYmFsIFJlYWN0ICovXG5pbXBvcnQgeyBjbG9uZSB9IGZyb20gJy4vaGVscGVycydcblxuY2xhc3MgU2VjdGlvbkVkaXQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBuZXdOYW1lID0gZm9ybURhdGEuZ2V0KCduYW1lJykudHJpbSgpXG4gICAgY29uc3QgbmV3VGl0bGUgPSBmb3JtRGF0YS5nZXQoJ3RpdGxlJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhLCBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG5cbiAgICBjb25zdCBjb3B5ID0gY2xvbmUoZGF0YSlcbiAgICBjb25zdCBuYW1lQ2hhbmdlZCA9IG5ld05hbWUgIT09IHNlY3Rpb24ubmFtZVxuICAgIGNvbnN0IGNvcHlTZWN0aW9uID0gY29weS5zZWN0aW9uc1tkYXRhLnNlY3Rpb25zLmluZGV4T2Yoc2VjdGlvbildXG5cbiAgICBpZiAobmFtZUNoYW5nZWQpIHtcbiAgICAgIGNvcHlTZWN0aW9uLm5hbWUgPSBuZXdOYW1lXG5cbiAgICAgIC8vIFVwZGF0ZSBhbnkgcmVmZXJlbmNlcyB0byB0aGUgc2VjdGlvblxuICAgICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICBpZiAocC5zZWN0aW9uID09PSBzZWN0aW9uLm5hbWUpIHtcbiAgICAgICAgICBwLnNlY3Rpb24gPSBuZXdOYW1lXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29weVNlY3Rpb24udGl0bGUgPSBuZXdUaXRsZVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQ2xpY2tEZWxldGUgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcblxuICAgIGlmICghd2luZG93LmNvbmZpcm0oJ0NvbmZpcm0gZGVsZXRlJykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgZGF0YSwgc2VjdGlvbiB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IGNvcHkgPSBjbG9uZShkYXRhKVxuXG4gICAgLy8gUmVtb3ZlIHRoZSBzZWN0aW9uXG4gICAgY29weS5zZWN0aW9ucy5zcGxpY2UoZGF0YS5zZWN0aW9ucy5pbmRleE9mKHNlY3Rpb24pLCAxKVxuXG4gICAgLy8gVXBkYXRlIGFueSByZWZlcmVuY2VzIHRvIHRoZSBzZWN0aW9uXG4gICAgY29weS5wYWdlcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgaWYgKHAuc2VjdGlvbiA9PT0gc2VjdGlvbi5uYW1lKSB7XG4gICAgICAgIGRlbGV0ZSBwLnNlY3Rpb25cbiAgICAgIH1cbiAgICB9KVxuXG4gICAgZGF0YS5zYXZlKGNvcHkpXG4gICAgICAudGhlbihkYXRhID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgdGhpcy5wcm9wcy5vbkVkaXQoeyBkYXRhIH0pXG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIG9uQmx1ck5hbWUgPSBlID0+IHtcbiAgICBjb25zdCBpbnB1dCA9IGUudGFyZ2V0XG4gICAgY29uc3QgeyBkYXRhLCBzZWN0aW9uIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgbmV3TmFtZSA9IGlucHV0LnZhbHVlLnRyaW0oKVxuXG4gICAgLy8gVmFsaWRhdGUgaXQgaXMgdW5pcXVlXG4gICAgaWYgKGRhdGEuc2VjdGlvbnMuZmluZChzID0+IHMgIT09IHNlY3Rpb24gJiYgcy5uYW1lID09PSBuZXdOYW1lKSkge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoYE5hbWUgJyR7bmV3TmFtZX0nIGFscmVhZHkgZXhpc3RzYClcbiAgICB9IGVsc2Uge1xuICAgICAgaW5wdXQuc2V0Q3VzdG9tVmFsaWRpdHkoJycpXG4gICAgfVxuICB9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IHNlY3Rpb24gfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nc2VjdGlvbi1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17c2VjdGlvbi5uYW1lfSByZXF1aXJlZCBwYXR0ZXJuPSdeXFxTKydcbiAgICAgICAgICAgIG9uQmx1cj17dGhpcy5vbkJsdXJOYW1lfSAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWZvcm0tZ3JvdXAnPlxuICAgICAgICAgIDxsYWJlbCBjbGFzc05hbWU9J2dvdnVrLWxhYmVsIGdvdnVrLWxhYmVsLS1zJyBodG1sRm9yPSdzZWN0aW9uLXRpdGxlJz5UaXRsZTwvbGFiZWw+XG4gICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT0nZ292dWstaW5wdXQnIGlkPSdzZWN0aW9uLXRpdGxlJyBuYW1lPSd0aXRsZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIGRlZmF1bHRWYWx1ZT17c2VjdGlvbi50aXRsZX0gcmVxdWlyZWQgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPnsnICd9XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J2J1dHRvbicgb25DbGljaz17dGhpcy5vbkNsaWNrRGVsZXRlfT5EZWxldGU8L2J1dHRvbj5cbiAgICAgICAgPGEgY2xhc3NOYW1lPSdwdWxsLXJpZ2h0JyBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMucHJvcHMub25DYW5jZWwoZSl9PkNhbmNlbDwvYT5cbiAgICAgIDwvZm9ybT5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2VjdGlvbkVkaXRcbiIsIi8qIGdsb2JhbCBSZWFjdCAqL1xuaW1wb3J0IHsgY2xvbmUgfSBmcm9tICcuL2hlbHBlcnMnXG5cbmNsYXNzIFNlY3Rpb25DcmVhdGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgb25TdWJtaXQgPSBlID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBjb25zdCBmb3JtID0gZS50YXJnZXRcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyB3aW5kb3cuRm9ybURhdGEoZm9ybSlcbiAgICBjb25zdCBuYW1lID0gZm9ybURhdGEuZ2V0KCduYW1lJykudHJpbSgpXG4gICAgY29uc3QgdGl0bGUgPSBmb3JtRGF0YS5nZXQoJ3RpdGxlJykudHJpbSgpXG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgY29weSA9IGNsb25lKGRhdGEpXG5cbiAgICBjb25zdCBzZWN0aW9uID0geyBuYW1lLCB0aXRsZSB9XG4gICAgY29weS5zZWN0aW9ucy5wdXNoKHNlY3Rpb24pXG5cbiAgICBkYXRhLnNhdmUoY29weSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxuICAgICAgICB0aGlzLnByb3BzLm9uQ3JlYXRlKHsgZGF0YSB9KVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycilcbiAgICAgIH0pXG4gIH1cblxuICBvbkJsdXJOYW1lID0gZSA9PiB7XG4gICAgY29uc3QgaW5wdXQgPSBlLnRhcmdldFxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IG5ld05hbWUgPSBpbnB1dC52YWx1ZS50cmltKClcblxuICAgIC8vIFZhbGlkYXRlIGl0IGlzIHVuaXF1ZVxuICAgIGlmIChkYXRhLnNlY3Rpb25zLmZpbmQocyA9PiBzLm5hbWUgPT09IG5ld05hbWUpKSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eShgTmFtZSAnJHtuZXdOYW1lfScgYWxyZWFkeSBleGlzdHNgKVxuICAgIH0gZWxzZSB7XG4gICAgICBpbnB1dC5zZXRDdXN0b21WYWxpZGl0eSgnJylcbiAgICB9XG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8Zm9ybSBvblN1Ym1pdD17ZSA9PiB0aGlzLm9uU3VibWl0KGUpfSBhdXRvQ29tcGxldGU9J29mZic+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPSdnb3Z1ay1mb3JtLWdyb3VwJz5cbiAgICAgICAgICA8bGFiZWwgY2xhc3NOYW1lPSdnb3Z1ay1sYWJlbCBnb3Z1ay1sYWJlbC0tcycgaHRtbEZvcj0nc2VjdGlvbi1uYW1lJz5OYW1lPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tbmFtZScgbmFtZT0nbmFtZSdcbiAgICAgICAgICAgIHR5cGU9J3RleHQnIHJlcXVpcmVkIHBhdHRlcm49J15cXFMrJ1xuICAgICAgICAgICAgb25CbHVyPXt0aGlzLm9uQmx1ck5hbWV9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZ292dWstZm9ybS1ncm91cCc+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT0nZ292dWstbGFiZWwgZ292dWstbGFiZWwtLXMnIGh0bWxGb3I9J3NlY3Rpb24tdGl0bGUnPlRpdGxlPC9sYWJlbD5cbiAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPSdnb3Z1ay1pbnB1dCcgaWQ9J3NlY3Rpb24tdGl0bGUnIG5hbWU9J3RpdGxlJ1xuICAgICAgICAgICAgdHlwZT0ndGV4dCcgcmVxdWlyZWQgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24nIHR5cGU9J3N1Ym1pdCc+U2F2ZTwvYnV0dG9uPlxuICAgICAgICA8YSBjbGFzc05hbWU9J3B1bGwtcmlnaHQnIGhyZWY9JyMnIG9uQ2xpY2s9e2UgPT4gdGhpcy5wcm9wcy5vbkNhbmNlbChlKX0+Q2FuY2VsPC9hPlxuICAgICAgPC9mb3JtPlxuICAgIClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBTZWN0aW9uQ3JlYXRlXG4iLCIvKiBnbG9iYWwgUmVhY3QgKi9cbmltcG9ydCBTZWN0aW9uRWRpdCBmcm9tICcuL3NlY3Rpb24tZWRpdCdcbmltcG9ydCBTZWN0aW9uQ3JlYXRlIGZyb20gJy4vc2VjdGlvbi1jcmVhdGUnXG5cbmNsYXNzIFNlY3Rpb25zRWRpdCBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBvbkNsaWNrU2VjdGlvbiA9IChlLCBzZWN0aW9uKSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG5cbiAgICB0aGlzLnNldFN0YXRlKHtcbiAgICAgIHNlY3Rpb246IHNlY3Rpb25cbiAgICB9KVxuICB9XG5cbiAgb25DbGlja0FkZFNlY3Rpb24gPSAoZSwgc2VjdGlvbikgPT4ge1xuICAgIGUucHJldmVudERlZmF1bHQoKVxuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICBzaG93QWRkU2VjdGlvbjogdHJ1ZVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5wcm9wc1xuICAgIGNvbnN0IHsgc2VjdGlvbnMgfSA9IGRhdGFcbiAgICBjb25zdCBzZWN0aW9uID0gdGhpcy5zdGF0ZS5zZWN0aW9uXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J2dvdnVrLWJvZHknPlxuICAgICAgICB7IXNlY3Rpb24gPyAoXG4gICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgIHt0aGlzLnN0YXRlLnNob3dBZGRTZWN0aW9uID8gKFxuICAgICAgICAgICAgICA8U2VjdGlvbkNyZWF0ZSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgICAgIG9uQ3JlYXRlPXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkU2VjdGlvbjogZmFsc2UgfSl9XG4gICAgICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRTZWN0aW9uOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9J2dvdnVrLWxpc3QnPlxuICAgICAgICAgICAgICAgIHtzZWN0aW9ucy5tYXAoKHNlY3Rpb24sIGluZGV4KSA9PiAoXG4gICAgICAgICAgICAgICAgICA8bGkga2V5PXtzZWN0aW9uLm5hbWV9PlxuICAgICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja1NlY3Rpb24oZSwgc2VjdGlvbil9PlxuICAgICAgICAgICAgICAgICAgICAgIHtzZWN0aW9uLnRpdGxlfVxuICAgICAgICAgICAgICAgICAgICA8L2E+ICh7c2VjdGlvbi5uYW1lfSlcbiAgICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICAgICAgPGhyIC8+XG4gICAgICAgICAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtlID0+IHRoaXMub25DbGlja0FkZFNlY3Rpb24oZSl9PkFkZCBzZWN0aW9uPC9hPlxuICAgICAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICAgIDwvdWw+XG4gICAgICAgICAgICApfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxTZWN0aW9uRWRpdCBzZWN0aW9uPXtzZWN0aW9ufSBkYXRhPXtkYXRhfVxuICAgICAgICAgICAgb25FZGl0PXtlID0+IHRoaXMuc2V0U3RhdGUoeyBzZWN0aW9uOiBudWxsIH0pfVxuICAgICAgICAgICAgb25DYW5jZWw9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNlY3Rpb246IG51bGwgfSl9IC8+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2VjdGlvbnNFZGl0XG4iLCIvKiBnbG9iYWwgUmVhY3QgUmVhY3RET00gZGFncmUgKi9cblxuaW1wb3J0IFBhZ2UgZnJvbSAnLi9wYWdlJ1xuaW1wb3J0IEZseW91dCBmcm9tICcuL2ZseW91dCdcbmltcG9ydCBEYXRhTW9kZWwgZnJvbSAnLi9kYXRhLW1vZGVsJ1xuaW1wb3J0IFBhZ2VDcmVhdGUgZnJvbSAnLi9wYWdlLWNyZWF0ZSdcbmltcG9ydCBMaW5rRWRpdCBmcm9tICcuL2xpbmstZWRpdCdcbmltcG9ydCBMaW5rQ3JlYXRlIGZyb20gJy4vbGluay1jcmVhdGUnXG5pbXBvcnQgTGlzdHNFZGl0IGZyb20gJy4vbGlzdHMtZWRpdCdcbmltcG9ydCBTZWN0aW9uc0VkaXQgZnJvbSAnLi9zZWN0aW9ucy1lZGl0J1xuXG5mdW5jdGlvbiBnZXRMYXlvdXQgKGRhdGEsIGVsKSB7XG4gIC8vIENyZWF0ZSBhIG5ldyBkaXJlY3RlZCBncmFwaFxuICB2YXIgZyA9IG5ldyBkYWdyZS5ncmFwaGxpYi5HcmFwaCgpXG5cbiAgLy8gU2V0IGFuIG9iamVjdCBmb3IgdGhlIGdyYXBoIGxhYmVsXG4gIGcuc2V0R3JhcGgoe1xuICAgIHJhbmtkaXI6ICdMUicsXG4gICAgbWFyZ2lueDogMzAsXG4gICAgbWFyZ2lueTogMzBcbiAgfSlcblxuICAvLyBEZWZhdWx0IHRvIGFzc2lnbmluZyBhIG5ldyBvYmplY3QgYXMgYSBsYWJlbCBmb3IgZWFjaCBuZXcgZWRnZS5cbiAgZy5zZXREZWZhdWx0RWRnZUxhYmVsKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHt9IH0pXG5cbiAgLy8gQWRkIG5vZGVzIHRvIHRoZSBncmFwaC4gVGhlIGZpcnN0IGFyZ3VtZW50IGlzIHRoZSBub2RlIGlkLiBUaGUgc2Vjb25kIGlzXG4gIC8vIG1ldGFkYXRhIGFib3V0IHRoZSBub2RlLiBJbiB0aGlzIGNhc2Ugd2UncmUgZ29pbmcgdG8gYWRkIGxhYmVscyB0byBlYWNoIG5vZGVcbiAgZGF0YS5wYWdlcy5mb3JFYWNoKChwYWdlLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IHBhZ2VFbCA9IGVsLmNoaWxkcmVuW2luZGV4XVxuXG4gICAgZy5zZXROb2RlKHBhZ2UucGF0aCwgeyBsYWJlbDogcGFnZS5wYXRoLCB3aWR0aDogcGFnZUVsLm9mZnNldFdpZHRoLCBoZWlnaHQ6IHBhZ2VFbC5vZmZzZXRIZWlnaHQgfSlcbiAgfSlcblxuICAvLyBBZGQgZWRnZXMgdG8gdGhlIGdyYXBoLlxuICBkYXRhLnBhZ2VzLmZvckVhY2gocGFnZSA9PiB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkocGFnZS5uZXh0KSkge1xuICAgICAgcGFnZS5uZXh0LmZvckVhY2gobmV4dCA9PiB7XG4gICAgICAgIGcuc2V0RWRnZShwYWdlLnBhdGgsIG5leHQucGF0aClcbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIGRhZ3JlLmxheW91dChnKVxuXG4gIGNvbnN0IHBvcyA9IHtcbiAgICBub2RlczogW10sXG4gICAgZWRnZXM6IFtdXG4gIH1cblxuICBjb25zdCBvdXRwdXQgPSBnLmdyYXBoKClcbiAgcG9zLndpZHRoID0gb3V0cHV0LndpZHRoICsgJ3B4J1xuICBwb3MuaGVpZ2h0ID0gb3V0cHV0LmhlaWdodCArICdweCdcbiAgZy5ub2RlcygpLmZvckVhY2goKHYsIGluZGV4KSA9PiB7XG4gICAgY29uc3Qgbm9kZSA9IGcubm9kZSh2KVxuICAgIGNvbnN0IHB0ID0ge31cbiAgICBwdC50b3AgPSAobm9kZS55IC0gbm9kZS5oZWlnaHQgLyAyKSArICdweCdcbiAgICBwdC5sZWZ0ID0gKG5vZGUueCAtIG5vZGUud2lkdGggLyAyKSArICdweCdcbiAgICBwb3Mubm9kZXMucHVzaChwdClcbiAgfSlcblxuICBnLmVkZ2VzKCkuZm9yRWFjaCgoZSwgaW5kZXgpID0+IHtcbiAgICBjb25zdCBlZGdlID0gZy5lZGdlKGUpXG4gICAgcG9zLmVkZ2VzLnB1c2goe1xuICAgICAgc291cmNlOiBlLnYsXG4gICAgICB0YXJnZXQ6IGUudyxcbiAgICAgIHBvaW50czogZWRnZS5wb2ludHMubWFwKHAgPT4ge1xuICAgICAgICBjb25zdCBwdCA9IHt9XG4gICAgICAgIHB0LnkgPSBwLnlcbiAgICAgICAgcHQueCA9IHAueFxuICAgICAgICByZXR1cm4gcHRcbiAgICAgIH0pXG4gICAgfSlcbiAgfSlcblxuICByZXR1cm4geyBnLCBwb3MgfVxufVxuXG5jbGFzcyBMaW5lcyBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gIHN0YXRlID0ge31cblxuICBlZGl0TGluayA9IChlZGdlKSA9PiB7XG4gICAgY29uc29sZS5sb2coJ2NsaWNrZWQnLCBlZGdlKVxuICAgIHRoaXMuc2V0U3RhdGUoe1xuICAgICAgc2hvd0VkaXRvcjogZWRnZVxuICAgIH0pXG4gIH1cblxuICByZW5kZXIgKCkge1xuICAgIGNvbnN0IHsgbGF5b3V0LCBkYXRhIH0gPSB0aGlzLnByb3BzXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPHN2ZyBoZWlnaHQ9e2xheW91dC5oZWlnaHR9IHdpZHRoPXtsYXlvdXQud2lkdGh9PlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGxheW91dC5lZGdlcy5tYXAoZWRnZSA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHBvaW50cyA9IGVkZ2UucG9pbnRzLm1hcChwb2ludHMgPT4gYCR7cG9pbnRzLnh9LCR7cG9pbnRzLnl9YCkuam9pbignICcpXG4gICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgPGcga2V5PXtwb2ludHN9PlxuICAgICAgICAgICAgICAgICAgPHBvbHlsaW5lXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuZWRpdExpbmsoZWRnZSl9XG4gICAgICAgICAgICAgICAgICAgIHBvaW50cz17cG9pbnRzfSAvPlxuICAgICAgICAgICAgICAgIDwvZz5cbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIDwvc3ZnPlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgTGluaycgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdG9yfVxuICAgICAgICAgIG9uSGlkZT17ZSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRvcjogZmFsc2UgfSl9PlxuICAgICAgICAgIDxMaW5rRWRpdCBlZGdlPXt0aGlzLnN0YXRlLnNob3dFZGl0b3J9IGRhdGE9e2RhdGF9XG4gICAgICAgICAgICBvbkVkaXQ9e2UgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0b3I6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufVxuXG5jbGFzcyBWaXN1YWxpc2F0aW9uIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICBzdXBlcigpXG4gICAgdGhpcy5yZWYgPSBSZWFjdC5jcmVhdGVSZWYoKVxuICB9XG5cbiAgc2NoZWR1bGVMYXlvdXQgKCkge1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc3QgbGF5b3V0ID0gZ2V0TGF5b3V0KHRoaXMucHJvcHMuZGF0YSwgdGhpcy5yZWYuY3VycmVudClcblxuICAgICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAgIGxheW91dDogbGF5b3V0LnBvc1xuICAgICAgfSlcbiAgICB9LCAyMDApXG4gIH1cblxuICBjb21wb25lbnREaWRNb3VudCAoKSB7XG4gICAgdGhpcy5zY2hlZHVsZUxheW91dCgpXG4gIH1cblxuICBjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzICgpIHtcbiAgICB0aGlzLnNjaGVkdWxlTGF5b3V0KClcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgY29uc3QgeyBkYXRhIH0gPSB0aGlzLnByb3BzXG4gICAgY29uc3QgeyBwYWdlcyB9ID0gZGF0YVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgcmVmPXt0aGlzLnJlZn0gY2xhc3NOYW1lPSd2aXN1YWxpc2F0aW9uJyBzdHlsZT17dGhpcy5zdGF0ZS5sYXlvdXQgJiYgeyB3aWR0aDogdGhpcy5zdGF0ZS5sYXlvdXQud2lkdGgsIGhlaWdodDogdGhpcy5zdGF0ZS5sYXlvdXQuaGVpZ2h0IH19PlxuICAgICAgICB7cGFnZXMubWFwKChwYWdlLCBpbmRleCkgPT4gPFBhZ2VcbiAgICAgICAgICBrZXk9e2luZGV4fSBkYXRhPXtkYXRhfSBwYWdlPXtwYWdlfVxuICAgICAgICAgIGxheW91dD17dGhpcy5zdGF0ZS5sYXlvdXQgJiYgdGhpcy5zdGF0ZS5sYXlvdXQubm9kZXNbaW5kZXhdfSAvPlxuICAgICAgICApfVxuICAgICAgICB7dGhpcy5zdGF0ZS5sYXlvdXQgJiYgPExpbmVzIGxheW91dD17dGhpcy5zdGF0ZS5sYXlvdXR9IGRhdGE9e2RhdGF9IC8+fVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG5cbmNsYXNzIE1lbnUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICBzdGF0ZSA9IHt9XG5cbiAgcmVuZGVyICgpIHtcbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMucHJvcHNcblxuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93QWRkUGFnZTogdHJ1ZSB9KX0+QWRkIFBhZ2U8L2J1dHRvbj57JyAnfVxuXG4gICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdnb3Z1ay1idXR0b24gZ292dWstIS1mb250LXNpemUtMTQnXG4gICAgICAgICAgb25DbGljaz17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaW5rOiB0cnVlIH0pfT5BZGQgTGluazwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRTZWN0aW9uczogdHJ1ZSB9KX0+RWRpdCBTZWN0aW9uczwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRMaXN0czogdHJ1ZSB9KX0+RWRpdCBMaXN0czwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2dvdnVrLWJ1dHRvbiBnb3Z1ay0hLWZvbnQtc2l6ZS0xNCdcbiAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0RhdGFNb2RlbDogdHJ1ZSB9KX0+VmlldyBEYXRhIE1vZGVsPC9idXR0b24+eycgJ31cblxuICAgICAgICA8YnV0dG9uIGNsYXNzTmFtZT0nZ292dWstYnV0dG9uIGdvdnVrLSEtZm9udC1zaXplLTE0J1xuICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93SlNPTkRhdGE6IHRydWUgfSl9PlZpZXcgSlNPTjwvYnV0dG9uPnsnICd9XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIFBhZ2UnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0FkZFBhZ2V9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZFBhZ2U6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8UGFnZUNyZWF0ZSBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRQYWdlOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nQWRkIExpbmsnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0FkZExpbmt9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0FkZExpbms6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8TGlua0NyZWF0ZSBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dBZGRMaW5rOiBmYWxzZSB9KX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nRWRpdCBTZWN0aW9ucycgc2hvdz17dGhpcy5zdGF0ZS5zaG93RWRpdFNlY3Rpb25zfVxuICAgICAgICAgIG9uSGlkZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0U2VjdGlvbnM6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8U2VjdGlvbnNFZGl0IGRhdGE9e2RhdGF9IG9uQ3JlYXRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0VkaXRTZWN0aW9uczogZmFsc2UgfSl9IC8+XG4gICAgICAgIDwvRmx5b3V0PlxuXG4gICAgICAgIDxGbHlvdXQgdGl0bGU9J0VkaXQgTGlzdHMnIHNob3c9e3RoaXMuc3RhdGUuc2hvd0VkaXRMaXN0c31cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93RWRpdExpc3RzOiBmYWxzZSB9KX0+XG4gICAgICAgICAgPExpc3RzRWRpdCBkYXRhPXtkYXRhfSBvbkNyZWF0ZT17KCkgPT4gdGhpcy5zZXRTdGF0ZSh7IHNob3dFZGl0TGlzdHM6IGZhbHNlIH0pfSAvPlxuICAgICAgICA8L0ZseW91dD5cblxuICAgICAgICA8Rmx5b3V0IHRpdGxlPSdEYXRhIE1vZGVsJyBzaG93PXt0aGlzLnN0YXRlLnNob3dEYXRhTW9kZWx9XG4gICAgICAgICAgb25IaWRlPXsoKSA9PiB0aGlzLnNldFN0YXRlKHsgc2hvd0RhdGFNb2RlbDogZmFsc2UgfSl9PlxuICAgICAgICAgIDxEYXRhTW9kZWwgZGF0YT17ZGF0YX0gLz5cbiAgICAgICAgPC9GbHlvdXQ+XG5cbiAgICAgICAgPEZseW91dCB0aXRsZT0nSlNPTiBEYXRhJyBzaG93PXt0aGlzLnN0YXRlLnNob3dKU09ORGF0YX1cbiAgICAgICAgICBvbkhpZGU9eygpID0+IHRoaXMuc2V0U3RhdGUoeyBzaG93SlNPTkRhdGE6IGZhbHNlIH0pfT5cbiAgICAgICAgICA8cHJlPntKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCAyKX08L3ByZT5cbiAgICAgICAgPC9GbHlvdXQ+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cblxuY2xhc3MgQXBwIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgc3RhdGUgPSB7fVxuXG4gIGNvbXBvbmVudFdpbGxNb3VudCAoKSB7XG4gICAgd2luZG93LmZldGNoKCcvYXBpL2RhdGEnKS50aGVuKHJlcyA9PiByZXMuanNvbigpKS50aGVuKGRhdGEgPT4ge1xuICAgICAgZGF0YS5zYXZlID0gdGhpcy5zYXZlXG4gICAgICB0aGlzLnNldFN0YXRlKHsgbG9hZGVkOiB0cnVlLCBkYXRhIH0pXG4gICAgfSlcbiAgfVxuXG4gIHNhdmUgPSAodXBkYXRlZERhdGEpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmZldGNoKGAvYXBpL2RhdGFgLCB7XG4gICAgICBtZXRob2Q6ICdwdXQnLFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkodXBkYXRlZERhdGEpXG4gICAgfSkudGhlbihyZXMgPT4ge1xuICAgICAgaWYgKCFyZXMub2spIHtcbiAgICAgICAgdGhyb3cgRXJyb3IocmVzLnN0YXR1c1RleHQpXG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzXG4gICAgfSkudGhlbihyZXMgPT4gcmVzLmpzb24oKSkudGhlbihkYXRhID0+IHtcbiAgICAgIGRhdGEuc2F2ZSA9IHRoaXMuc2F2ZVxuICAgICAgdGhpcy5zZXRTdGF0ZSh7IGRhdGEgfSlcbiAgICAgIHJldHVybiBkYXRhXG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKVxuICAgICAgd2luZG93LmFsZXJ0KCdTYXZlIGZhaWxlZCcpXG4gICAgfSlcbiAgfVxuXG4gIHJlbmRlciAoKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUubG9hZGVkKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2IGlkPSdhcHAnPlxuICAgICAgICAgIDxNZW51IGRhdGE9e3RoaXMuc3RhdGUuZGF0YX0gLz5cbiAgICAgICAgICA8VmlzdWFsaXNhdGlvbiBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IC8+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gPGRpdj5Mb2FkaW5nLi4uPC9kaXY+XG4gICAgfVxuICB9XG59XG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPEFwcCAvPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jvb3QnKVxuKVxuIl0sIm5hbWVzIjpbIkZseW91dCIsInByb3BzIiwic2hvdyIsIm9uSGlkZSIsImUiLCJ0aXRsZSIsImNoaWxkcmVuIiwiZ2V0Rm9ybURhdGEiLCJmb3JtIiwiZm9ybURhdGEiLCJ3aW5kb3ciLCJGb3JtRGF0YSIsImRhdGEiLCJvcHRpb25zIiwic2NoZW1hIiwiY2FzdCIsIm5hbWUiLCJ2YWwiLCJlbCIsImVsZW1lbnRzIiwiZGF0YXNldCIsInVuZGVmaW5lZCIsIk51bWJlciIsImZvckVhY2giLCJ2YWx1ZSIsImtleSIsIm9wdGlvbnNQcmVmaXgiLCJzY2hlbWFQcmVmaXgiLCJ0cmltIiwic3RhcnRzV2l0aCIsInJlcXVpcmVkIiwic3Vic3RyIiwibGVuZ3RoIiwiT2JqZWN0Iiwia2V5cyIsImNsb25lIiwib2JqIiwiSlNPTiIsInBhcnNlIiwic3RyaW5naWZ5IiwiUGFnZUVkaXQiLCJzdGF0ZSIsIm9uU3VibWl0IiwicHJldmVudERlZmF1bHQiLCJ0YXJnZXQiLCJuZXdQYXRoIiwiZ2V0Iiwic2VjdGlvbiIsInBhZ2UiLCJjb3B5IiwicGF0aENoYW5nZWQiLCJwYXRoIiwiY29weVBhZ2UiLCJwYWdlcyIsImluZGV4T2YiLCJmaW5kIiwicCIsInNldEN1c3RvbVZhbGlkaXR5IiwicmVwb3J0VmFsaWRpdHkiLCJBcnJheSIsImlzQXJyYXkiLCJuZXh0IiwibiIsInNhdmUiLCJ0aGVuIiwiY29uc29sZSIsImxvZyIsIm9uRWRpdCIsImNhdGNoIiwiZXJyb3IiLCJlcnIiLCJvbkNsaWNrRGVsZXRlIiwiY29uZmlybSIsImNvcHlQYWdlSWR4IiwiZmluZEluZGV4IiwiaW5kZXgiLCJpIiwic3BsaWNlIiwic2VjdGlvbnMiLCJtYXAiLCJSZWFjdCIsIkNvbXBvbmVudCIsImNvbXBvbmVudFR5cGVzIiwic3ViVHlwZSIsIkNsYXNzZXMiLCJjb21wb25lbnQiLCJjbGFzc2VzIiwiRmllbGRFZGl0IiwiaGludCIsIlRleHRGaWVsZEVkaXQiLCJtYXgiLCJtaW4iLCJNdWx0aWxpbmVUZXh0RmllbGRFZGl0Iiwicm93cyIsIk51bWJlckZpZWxkRWRpdCIsImludGVnZXIiLCJTZWxlY3RGaWVsZEVkaXQiLCJsaXN0cyIsImxpc3QiLCJSYWRpb3NGaWVsZEVkaXQiLCJDaGVja2JveGVzRmllbGRFZGl0IiwiUGFyYUVkaXQiLCJjb250ZW50IiwiSW5zZXRUZXh0RWRpdCIsIkRldGFpbHNFZGl0IiwiY29tcG9uZW50VHlwZUVkaXRvcnMiLCJDb21wb25lbnRUeXBlRWRpdCIsInR5cGUiLCJ0IiwiVGFnTmFtZSIsIkNvbXBvbmVudEVkaXQiLCJjb21wb25lbnRJbmRleCIsImNvbXBvbmVudHMiLCJjb21wb25lbnRJZHgiLCJjIiwiaXNMYXN0IiwiY29weUNvbXAiLCJTb3J0YWJsZUhhbmRsZSIsIlNvcnRhYmxlSE9DIiwiRHJhZ0hhbmRsZSIsIlRleHRGaWVsZCIsIlRlbGVwaG9uZU51bWJlckZpZWxkIiwiTnVtYmVyRmllbGQiLCJFbWFpbEFkZHJlc3NGaWVsZCIsIlRpbWVGaWVsZCIsIkRhdGVGaWVsZCIsIkRhdGVUaW1lRmllbGQiLCJEYXRlUGFydHNGaWVsZCIsIkRhdGVUaW1lUGFydHNGaWVsZCIsIk11bHRpbGluZVRleHRGaWVsZCIsIlJhZGlvc0ZpZWxkIiwiQ2hlY2tib3hlc0ZpZWxkIiwiU2VsZWN0RmllbGQiLCJZZXNOb0ZpZWxkIiwiVWtBZGRyZXNzRmllbGQiLCJQYXJhIiwiSW5zZXRUZXh0IiwiRGV0YWlscyIsIkJhc2UiLCJDb21wb25lbnRGaWVsZCIsInNob3dFZGl0b3IiLCJzdG9wUHJvcGFnYXRpb24iLCJzZXRTdGF0ZSIsIkNvbXBvbmVudENyZWF0ZSIsInB1c2giLCJvbkNyZWF0ZSIsIlNvcnRhYmxlRWxlbWVudCIsIlNvcnRhYmxlQ29udGFpbmVyIiwiYXJyYXlNb3ZlIiwiU29ydGFibGVJdGVtIiwiU29ydGFibGVMaXN0IiwiUGFnZSIsIm9uU29ydEVuZCIsIm9sZEluZGV4IiwibmV3SW5kZXgiLCJmb3JtQ29tcG9uZW50cyIsImZpbHRlciIsImNvbXAiLCJwYWdlVGl0bGUiLCJsYXlvdXQiLCJzaG93QWRkQ29tcG9uZW50IiwiY29tcG9uZW50VG9TdHJpbmciLCJEYXRhTW9kZWwiLCJtb2RlbCIsIlBhZ2VDcmVhdGUiLCJhc3NpZ24iLCJMaW5rRWRpdCIsImVkZ2UiLCJzb3VyY2UiLCJsaW5rIiwiaWYiLCJjb25kaXRpb24iLCJjb3B5TGluayIsImNvcHlMaW5rSWR4IiwiTGlua0NyZWF0ZSIsImZyb20iLCJ0byIsImhlYWREdXBsaWNhdGUiLCJhcnIiLCJqIiwiTGlzdEl0ZW1zIiwib25DbGlja0FkZEl0ZW0iLCJpdGVtcyIsImNvbmNhdCIsInRleHQiLCJyZW1vdmVJdGVtIiwicyIsImlkeCIsIm9uQmx1ciIsInRleHRzIiwiZ2V0QWxsIiwidmFsdWVzIiwiZHVwZVRleHQiLCJkdXBlVmFsdWUiLCJpdGVtIiwiTGlzdEVkaXQiLCJuZXdOYW1lIiwibmV3VGl0bGUiLCJuZXdUeXBlIiwibmFtZUNoYW5nZWQiLCJjb3B5TGlzdCIsIm9uQmx1ck5hbWUiLCJpbnB1dCIsImwiLCJvbkNhbmNlbCIsIkxpc3RDcmVhdGUiLCJMaXN0c0VkaXQiLCJvbkNsaWNrTGlzdCIsIm9uQ2xpY2tBZGRMaXN0Iiwic2hvd0FkZExpc3QiLCJTZWN0aW9uRWRpdCIsImNvcHlTZWN0aW9uIiwiU2VjdGlvbkNyZWF0ZSIsIlNlY3Rpb25zRWRpdCIsIm9uQ2xpY2tTZWN0aW9uIiwib25DbGlja0FkZFNlY3Rpb24iLCJzaG93QWRkU2VjdGlvbiIsImdldExheW91dCIsImciLCJkYWdyZSIsImdyYXBobGliIiwiR3JhcGgiLCJzZXRHcmFwaCIsInJhbmtkaXIiLCJtYXJnaW54IiwibWFyZ2lueSIsInNldERlZmF1bHRFZGdlTGFiZWwiLCJwYWdlRWwiLCJzZXROb2RlIiwibGFiZWwiLCJ3aWR0aCIsIm9mZnNldFdpZHRoIiwiaGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0Iiwic2V0RWRnZSIsInBvcyIsIm5vZGVzIiwiZWRnZXMiLCJvdXRwdXQiLCJncmFwaCIsInYiLCJub2RlIiwicHQiLCJ0b3AiLCJ5IiwibGVmdCIsIngiLCJ3IiwicG9pbnRzIiwiTGluZXMiLCJlZGl0TGluayIsImpvaW4iLCJWaXN1YWxpc2F0aW9uIiwicmVmIiwiY3JlYXRlUmVmIiwic2V0VGltZW91dCIsImN1cnJlbnQiLCJzY2hlZHVsZUxheW91dCIsIk1lbnUiLCJzaG93QWRkUGFnZSIsInNob3dBZGRMaW5rIiwic2hvd0VkaXRTZWN0aW9ucyIsInNob3dFZGl0TGlzdHMiLCJzaG93RGF0YU1vZGVsIiwic2hvd0pTT05EYXRhIiwiQXBwIiwidXBkYXRlZERhdGEiLCJmZXRjaCIsIm1ldGhvZCIsImJvZHkiLCJyZXMiLCJvayIsIkVycm9yIiwic3RhdHVzVGV4dCIsImpzb24iLCJhbGVydCIsImxvYWRlZCIsIlJlYWN0RE9NIiwicmVuZGVyIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCJdLCJtYXBwaW5ncyI6Ijs7O0VBQ0EsU0FBU0EsTUFBVCxDQUFpQkMsS0FBakIsRUFBd0I7RUFDdEIsTUFBSSxDQUFDQSxNQUFNQyxJQUFYLEVBQWlCO0VBQ2YsV0FBTyxJQUFQO0VBQ0Q7O0VBRUQsU0FDRTtFQUFBO0VBQUEsTUFBSyxXQUFVLGtCQUFmO0VBQ0U7RUFBQTtFQUFBLFFBQUssV0FBVSx1QkFBZjtFQUNFO0VBQUE7RUFBQSxVQUFHLE9BQU0sT0FBVCxFQUFpQixXQUFVLHVDQUEzQixFQUFtRSxTQUFTO0VBQUEsbUJBQUtELE1BQU1FLE1BQU4sQ0FBYUMsQ0FBYixDQUFMO0VBQUEsV0FBNUU7RUFBQTtFQUFBLE9BREY7RUFFRTtFQUFBO0VBQUEsVUFBSyxXQUFVLE9BQWY7RUFDRTtFQUFBO0VBQUEsWUFBSyxXQUFVLDJEQUFmO0VBQ0dILGdCQUFNSSxLQUFOLElBQWU7RUFBQTtFQUFBLGNBQUksV0FBVSxpQkFBZDtFQUFpQ0osa0JBQU1JO0VBQXZDO0VBRGxCLFNBREY7RUFJRTtFQUFBO0VBQUEsWUFBSyxXQUFVLFlBQWY7RUFDRTtFQUFBO0VBQUEsY0FBSyxXQUFVLHlFQUFmO0VBQ0dKLGtCQUFNSztFQURUO0VBREY7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
