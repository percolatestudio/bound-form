# BoundForm
The idea is to handle forms in a very simple and transparent way with a minimum of magic.

The keystone is the `BoundForm` helper, that puts down a form and binds it's output into a reactive dictionary.

Additionally, we've settled on some state handling patterns that attempt to avoid the session and be less global.

## Storing state on the template instance

The overarching pattern is to try and store the state of a template on the template instance itself. So instead of writing state to the session, you use a state variable on the instance, like:

```
Template.X.created = function() {
  this.open = new ReactiveVar(false);
}

Template.X.helpers({
  open: function() {
    return Template.instance().open.get();
  }
});
```

This is a pattern that should be supported natively by Views in a future version of Blaze. But for now it means that you can be very explicit and local about state.

**XXX: is this a good idea? I haven't decided**
If you attach a few state variables to a template, it can be a good idea to create a helper for the instance:

```
Template.X.helpers({
  template: function() {
    return Template.instance();
  }
});
```

Then you can use `{{#if template.open.get}}` inside your template's HTML. (XXX: if https://github.com/meteor/meteor/issues/2923 is fixed, we could make this a global helper too?).

## Bound Forms

The `bound-form` package exports a `{{#BoundForm}}` helper, that you should use to put down forms when you want to reactively change depending on their value. You should pass a reactive dictionary for the form to write to, and optionally, some initial state for that dict.

So, if you attach a `document` reactive-dict to the template instance (see above), you can wire it up with:

```
{{#BoundForm class="foo" document=template.document}}
  <input name="title" value="{{template.document.get 'title'}}">
  <input name="description" value="{{template.document.get 'description'}}">
{{/BoundForm}}
```

This form will add two values to the `document`, which will reactively update as the user modifies the form. If you call `this.document.all()`[1], you'll get back `{title: 'xxx', description: 'yyy'}`. Form elements can have dotted names, and will attempt to update the relevant property in a *non-destructive* way.

## Non form document state

If you want to store state on your edited document that doesn't correspond to a form field (e.g. information returned from embedly on flips edit), then you can put it into the `document` dictionary also.

```
Template.X.events({
  'click .js-show-thumbnail: function(e, template) {
    template.document.set('showThumbnail', true);
  }
});
```

## Initial document state

If you have some initial document state (the `.init()` for the model or perhaps the document being edited), you can pass it into the bound form as `initial`. 

```
{{#BoundForm class="foo" document=template.document initial=this}}
```

The idea behind this pattern is that by the time the form is being rendered you are guaranteed that the document will be loaded (or else the form fields will be wrong anyway!).

## Using current document state

Following the above pattern, the `document` dictionary will contain the composite state of the page, factoring in the initial state and any changes driven by the form or otherwise.

If your document in an `ExtendedReactiveDict`, use `document.all()` to get the current state.

If you only need one property, you can take advantage of per-field reactivity and use `document.get('field')`.

## Passing state into child templates.

If child templates are going to read an set state, make it explicit and pass the state in. So you can write

```
{{> subtemplate parent=template}}

Template.subTemplate.created = function() {
  // grab whichever state fields the subtemplate needs to access
  this.document = this.data.parent.document;
}
```

Then you can maintain a consistent API everywhere (always use `template.flipState.get()` for instance).

## Checkboxes -- type casting

Usually you want checkboxes to represent `Boolean`s or `Array`s. To do so, add `data-type="Boolean"` to the input element. Then the bound form will do the sensible thing when serializing the form (standard form serializing can be a head scratcher).

## Other state on templates

The idea is to make state an explicit API rather than the session which is a nebulous "registry" style set of key-values.

A simple way to do this is to simply use `ReactiveVar`s for the state (XXX: make a `CheckedReactiveVar` so it can be typed).

If you have a few different state vars, it can make sense to use a `CheckedReactiveDict`:

```
Template.X.created = function() {
  this.state = new CheckedReactiveDict({
    recording: false,
    embedlyLoading: false
  }, {recording: Boolean, embedlyLoading: Boolean});
}
```

## Caveats

### Hot Code Reload

Because we are no longer using the session, the state will *not* be impervious to HCR. 

However 
  a) we are moving to a pattern of explicit HCR initiated by the user
  b) we imagine when views have "fields" which allow this more natively, they'll probably migrate across HCR.

### Template instance inside `{{#helpers}}`

Due to https://github.com/meteor/meteor/issues/2923, inside a `{{#helper}}` (e.g. `{{#FormWatcher}}`), `Template.instance()` is wrong in helpers (not event handlers though).

A simple workaround is to set the template instance globally:

```
var template;
Template.X.created = function() {
  template = this;
}

Template.X.helpers({
  template: function() {
    return template;
  }
});
```

It stops more than one of `Template.X` being used but this is fine in most cases.

[1] `.all()` is an `ExtendedReactiveDict` property -- usually you'll want to use one of them rather than a reactive dict. XXX: PR to core?