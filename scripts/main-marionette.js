(function ($, Backbone, Marionette, _) {

	var PersonModel = Backbone.Model.extend({
		defaults: {
			'name': '-',
			'number': '-',
			'username': '-'
		},
		idAttribute: '_id',
		url: function () {
			var location = 'http://localhost:9090/contacts';
			return this.id ? (location + '/' + this.id) : location;
		},
		initialize: function () {
			this.validKeys = ['name', 'number', 'username'];
		},
		// Checks if the new attributes are similar to the current attributes
		// Returns: true if all or one attr has changed
		// false if none is changing
		attrChanged: function (newAttr) {
			var changed = _.isEqual(_.pick(this.attributes, this.validKeys), newAttr);
			return !changed;
		}
	});

	var PersonCollection = Backbone.Collection.extend({
		model: PersonModel,
		url: 'http://localhost:9090/contacts',
		initialize: function () {

		}
	});

	var PersonView = Marionette.ItemView.extend({
		tagName: 'tr',
		template: '#contact_template',
		edit_template: $('#edit_mode_template').html(),
		events: {
			'click .edit': 'makeFieldsEditable',
			'click .delete': 'deleteFromDatabase',
			'click .done': 'saveChangesToDatabase',
			'click .cancel': 'showDefaultView'
		},
		initialize: function(options) {
			// Triggers after a model's field changed or updated in the database
			this.listenTo(this.model, 'change', this.showDefaultView);
			// Rerender when a sibling model is remove to reset position
			this.listenTo(this.model.collection, 'remove', this.render);
		},
		makeFieldsEditable: function () {
			var compiledTemplate = _.template(this.edit_template);
			this.$el.html(compiledTemplate(this.model.toJSON()))
			this.$el.addClass('highlight');
		},
		deleteFromDatabase: function () {
			this.model.destroy({
				wait: true,
				success: function (model, resp, opt) {
					console.log('model destroy success: ', model);
				},
				error: function (model, xhr, opt) {
					console.log('model destroy error: ', model);
				}
			})
		},
		saveChangesToDatabase: function () {
			var newAttrs = {
				name: this.$el.find('input[name=fullname]').val(),
				number: this.$el.find('input[name=number]').val(),
				username: this.$el.find('input[name=username]').val()
			}

			if (!this.model.attrChanged(newAttrs)) {
				this.showDefaultView();
			} else {
				this.model.save(newAttrs, {
					wait: true,
					success: function (model, resp, opt) {
						console.log('model update success: ', model);
					},
					error: function (model, xhr, opt) {
						console.log('model update error: ', model);
					}
				});
			}
		},
		showDefaultView: function () {
			this.render();
			this.$el.removeClass('highlight');
		},
		onBeforeRender: function () {
			this.model.set('position', this.model.collection.indexOf(this.model) + 1);
		}
	});

	var EmptyContactsView = Marionette.ItemView.extend({
		tagName: 'tr',
		id: 'contact_empty',
		template: '#contact_empty_template'
	});

	var ContactsApp = Marionette.CompositeView.extend({
		el: '#contacts',
		itemView: PersonView,
		emptyView: EmptyContactsView,
		itemViewContainer: '.table > tbody',
		ui: {
			'count'			: 'span.count',
			'input_name'	: '#inputs input[name=fullname]',
			'input_number'	: '#inputs input[name=number]',
			'input_username': '#inputs input[name=username]',
		},
		events: {
			'click #add_contact': 'addPerson'
		},
		initialize: function () {
			this.isRendered = true;
			this.bindUIElements();

			this.listenTo(this.collection, 'add remove', this.updateContactCounter)
			this.collection.fetch();
		},
		updateContactCounter: function () {
			this.ui.count.text(this.collection.length);
		},
		clearInputs: function () {
			this.ui.input_name.val('');
			this.ui.input_number.val('');
			this.ui.input_username.val('');
		},
		addPerson: function (evt) {
			var _this = this;
			var person = new PersonModel({
				name: this.ui.input_name.val(),
				number: this.ui.input_number.val(),
				username: this.ui.input_username.val()
			});

			person.save(null, {
				success: function (model, resp, options) {
					_this.collection.add(model);
					_this.clearInputs();
				}, 
				error: function (model, xhr, options) {
					alert('Error on save');
				}
			});
		}
	});

	var contactApp = new ContactsApp({ collection: new PersonCollection() });

	// for debugging purposes
	window.app = contactApp;
})(jQuery, Backbone, Marionette, _)