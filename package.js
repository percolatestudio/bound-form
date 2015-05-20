Package.describe({
  name: "bound-form",
  summary: "A form that injects it's values into a reactive dict",
  version: "1.0.0"
});

Package.onUse(function(api) {
  api.versionsFrom("1.0");
  api.use(["underscore", "templating", "blaze", "reactive-dict", "minimongo"]);

  api.addFiles([
    "bound-form.html",
    "bound-form.js"
  ], "client");
});

Package.onTest(function(api) {
  api.use(["tinytest", "blaze", "templating", "extended-reactive-dict"]);
  api.use("bound-form");
  api.addFiles([
    "bound-form-tests.html",
    "bound-form-tests.js"
  ], "client");
});
