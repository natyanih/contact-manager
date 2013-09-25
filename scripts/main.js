(function ($, BB, _) {

	$('#add_contact').tooltip();

	var App = Backbone.View.extend({
		el: "#contacts",
		events: {
			'click #add_contact': 'addPerson'
		},
		initialize: function () {
			this.$input_name = $('#inputs input[name=fullname]');
			this.$input_number = $('#inputs input[name=number]');
			this.$input_username = $('#inputs input[name=username]');
			this.$contacts_list = $('.table tbody');

			this.listenTo(this.collection, 'add', this.createView);
			// Fetch contacts from server
			this.collection.fetch();
		},
		clearInputs: function () {
			this.$input_name.val('');
			this.$input_number.val('');
			this.$input_username.val('');
		},
		addPerson: function (evt) {
			var _this = this;

			var person = new PersonModel({
				name: this.$input_name.val(),
				number: this.$input_number.val(),
				username: this.$input_username.val()
			});

			person.save(null, {
				success: function (model, resp, options) {
					_this.collection.add(model);
				}, 
				error: function (model, xhr, options) {
					alert('Error on save');
				}
			});
		},
		createView: function (model, collection) {
			model.set('position', this.collection.models.indexOf(model) + 1);
			var view = new PersonView({model: model});
			this.$contacts_list.append(view.render().el);
			this.clearInputs();
		}
	});

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

	var PersonView = Backbone.View.extend({
		tagName: 'tr',
		template: $('#contact_template').html(),
		edit_template: $('#edit_mode_template').html(),
		events: {
			'click .edit': 'makeFieldsEditable',
			'click .delete': 'deleteFromDatabase',
			'click .done': 'saveChangesToDatabase',
			'click .cancel': 'showDefaultView'
		},
		initialize: function() {
			// Triggers after a model is deleted in the database
			this.listenTo(this.model, 'destroy', this.removeView);
			// Triggers after a model's field changed or updated in the database
			this.listenTo(this.model, 'change', this.showDefaultView);
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
			var compiledTemplate = _.template(this.template);
			this.$el.html(compiledTemplate(this.model.toJSON()));
			this.$el.removeClass('highlight');
		},
		removeView: function () {
			this.undelegateEvents();
			this.stopListening();
			this.remove();
		},
		render: function() {
			var compiledTemplate = _.template(this.template);
			this.$el.html(compiledTemplate(this.model.toJSON()))
			return this;
		}
	});

	var contactApp = new App({ collection: new PersonCollection() });

	// for debugging purposes
	window.app = contactApp;
})(jQuery, Backbone, _)