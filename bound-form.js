/* global LocalCollection */

var setValue = function(template, name, value) {
  var parts = name.split(".");

  if (parts.length === 1) {
    // short-circuit the below
    template.document.set(name, value);
  }
  else {
    // if name is X.Y.Z, update Y.Z on doc[X]
    var field = template.document.get(parts[0]) || {};
    var update = {};
    update[parts.slice(1).join(".")] = value;
    LocalCollection._modify(field, {$set: update});
    template.document.set(parts[0], field);
  }
};

var initialize = function(template, doc) {
  _.each(doc, function(value, name) {
    setValue(template, name, value);
  });
};

// read each named value from this form
var read = function(template) {
  var update = {};
  _.each(template.$("form").serializeArray(), function(prop) {
    // we"ve seen this property before, make it an array
    //   this will happen for checkboxes and multi-selects
    if (update[prop.name]) {
      // tricky: use the fact that [].concat() is kind of like "ensureArray".
      update[prop.name] = [].concat(update[prop.name], prop.value);
    }
    else {
      update[prop.name] = prop.value;
    }
  });

  var checkedNames = {};
  template.$("form").find("[data-type]").each(function() {
    var name = this.name, type = $(this).data("type");
    if (checkedNames[name]) {
      return;
    }
    checkedNames[name] = true;

    if (type === "Boolean") {
      // we expect update[name] to *not* exist if it"s unset.
      update[name] = !!update[name];
    }
    else if (type === "Array") {
      if (!update[name]) {
        update[name] = [];
      }
      else {
        // ensureArray again
        update[name] = [].concat(update[name]);
      }
    }
  });

  _.each(update, function(value, name) {
    setValue(template, name, value);
  });
};

Template.BoundForm.created = function() {
  this.document = this.data.document;
  check(this.document, ReactiveDict);

  if (this.data.initial) {
    initialize(this, this.data.initial);
  }
};

Template.BoundForm.rendered = function() {
  read(this);
};

Template.BoundForm.helpers({
  attributes: function() {
    return _.omit(this, "document", "initial");
  }
});

Template.BoundForm.events({
  submit: function(event, template) {
    read(template);
  },

  "change [name], blur [name], keyup [name]": function(event, template) {
    if ($(event.target).is("[type=checkbox],[type=select][multiple]")) {
      read(template);
    }
    else {
      setValue(template, event.target.name, $(event.target).val());
    }
  }
});
