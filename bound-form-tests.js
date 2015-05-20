/* global ExtendedReactiveDict */

var withDiv = function(callback) {
  var el = document.createElement("div");
  document.body.appendChild(el);
  try {
    callback(el);
  }
  finally {
    document.body.removeChild(el);
  }
};

var withRenderedTemplate = function(template, data, callback) {
  withDiv(function(el) {
    template = _.isString(template) ? Template[template] : template;
    Blaze.renderWithData(template, data, el);
    Deps.flush();
    callback(el);
  });
};

Template.simpleBoundForm.helpers({
  document: function() {
    return this.document;
  }
});

Tinytest.add("BoundForm - Basic - Initial Read", function(test) {
  var doc = new ExtendedReactiveDict();
  withRenderedTemplate("simpleBoundForm", {document: doc}, function() {
    test.equal(doc.all(), {
      foo: "",
      bar: {baz: ""},
      one: {two: {three: ""}}
    });
  });
});

Tinytest.add("BoundForm - Basic - Bound Properly", function(test) {
  var doc = new ExtendedReactiveDict();
  withRenderedTemplate("simpleBoundForm", {document: doc}, function(el) {
    $(el).find("[name=foo]").val("value").change();
    test.equal(doc.get("foo"), "value");
  });
});

Tinytest.add("BoundForm - Basic - Initial Doc", function(test) {
  var doc = new ExtendedReactiveDict();
  var initial = {
    foo: {
      bar: "bar",
      baz: "baz"
    }
  };
  withRenderedTemplate("formWithInitial", {document: doc, initial: initial}, function() {
    test.equal(doc.all(), {
      foo: {
        bar: "",
        baz: "baz"
      }
    });
  });
});

Tinytest.add("BoundForm - Selectively overwrites", function(test) {
  var doc = new ExtendedReactiveDict();
  doc.set("one", {is: "great"});
  withRenderedTemplate("simpleBoundForm", {document: doc}, function(el) {
    test.equal(doc.get("one"), {is: "great", two: {three: ""}});

    doc.set("one", {is: "great"});
    test.equal(doc.get("one"), {is: "great"});
    $(el).find("[name='one.two.three']").val("value").change();
    test.equal(doc.get("one"), {is: "great", two: {three: "value"}});
  });
});

Tinytest.add("BoundForm - Types - Initial Read", function(test) {
  var doc = new ExtendedReactiveDict();
  withRenderedTemplate("formWithTypes", {document: doc}, function() {
    test.equal(doc.all(), {
      on: true,
      off: false,
      tags: ["first", "second", "fourth"],
      empty: []
    });
  });
});

Tinytest.add("BoundForm - Types - Bound Properly", function(test) {
  var doc = new ExtendedReactiveDict();
  withRenderedTemplate("formWithTypes", {document: doc}, function(el) {
    $(el).find("[name=off]").prop("checked", true).change();
    test.equal(doc.get("off"), true);

    $(el).find("[name=off]").prop("checked", false).change();
    test.equal(doc.get("off"), false);

    $(el).find("[name=tags][value=fifth]").prop("checked", true).change();
    test.equal(doc.get("tags"), ["first", "second", "fourth", "fifth"]);

    $(el).find("[name=empty]").prop("checked", true).change();
    test.equal(doc.get("empty"), ["empty"]);

    $(el).find("[name=empty]").prop("checked", false).change();
    test.equal(doc.get("empty"), []);
  });
});
