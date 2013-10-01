angular-hateoas
===============

An AngularJS module for using `$resource` with a HATEOAS-enabled REST API.

### What is HATEOAS?

[HATEOAS](http://en.wikipedia.org/wiki/HATEOAS), which stands for **Hypermedia as the Engine of Application State**, is a type of REST architecture that enables enhanced decoupling of server and client. The basic idea is that with every response, the server provides a list of endpoints (or "links") to perform actions or retrieve information related to the data in the response.

### Why HATEOAS?

The use of HATEOAS can allow the client to be completely indifferent to the REST structure of the API, and instead rely on knowledge of relationships between objects. In many cases this can result in a more logical client application flow, as well as the opportunity for the server to evolve independently from the client application without disrupting functionality.

### What does this module do?

Angular does not have a built-in way to cleanly navigate a HATEOAS-style API — the `$resource` object was created to consume traditional service-based endpoints, plugging in variables as needed to account for relationships between objects.

For instance, a traditional approach might look like this:

```javascript
var personResource = $resource("/api/people/:personId");
var addressResource = $resource("/api/people/:personId/addresses");

var people = personResource.query(null, function () {
	var firstPerson = people[0];
	var firstPersonAddresses = addressResource.query({ personId: person[i].personId }, function () {
		console.log(firstPersonAddresses);
	});
});
```

This is a very simplified example, but notice the arbitrary information that the front-end developer needs to know about how to get an address for a person: you need to know where the `addresses` endpoint is, and you need to know what to pass in to the call to get it (`personId`).

Compare this to the HATEOAS approach, where the server delivers links to related endpoints:

```javascript
var personResource = $resource("/api/people/:personId");

var people = personResource.query(null, function () {
	var firstPerson = people[0];
	var firstPersonAddresses = firstPerson.resource("addresses").query(null, function () {
		console.log(firstPersonAddresses);
	});
});
```

The `angular-hateoas` module creates an application-wide interceptor to automatically add the `resource` method to all HATEOAS responses. Alternatively, you could transform a response manually:

```javascript
var personResource = $resource("/api/people/:personId");

var people = personResource.query(null, function () {
	var firstPerson = people[0];
	var firstPersonAddresses = new HateoasInterface(firstPerson).resource("addresses").query(null, function () {
		console.log(firstPersonAddresses);
	});
});
```


Usage
-----

To start, make sure you are including `angular-hateoas.js` in your JavaScript compiler (or the minified version on your page), and add `hateoas` as a dependency in your application module declaration:

```javascript
var app = angular.module("your-application", ["ngResource", "hateoas"]);
```

To enable the global interceptor, invoke `HateoasInterceptorProvider.transformAllResponses()` in a `config` block:

```javascript
app.config(function (HateoasInterceptorProvider) {
	HateoasInterceptorProvider.transformAllResponses();
});
```

And that's it! All HATEOAS-enabled responses will allow you to retrieve related resources as you need them:

```javascript
var item = $resource("/api/path/to/item").get(null, function () {
	console.log("Here's a related $resource object: ", item.resource("some-related-endpoint"));
});

// also works with array results from $resource(...).query()
var items = $resource("/api/path/to/items").query(null, function () {
	angular.forEach(items, function (item) {
		console.log("Here's a related $resource object: ", item.resource("some-related-endpoint"));
	});
});
```

You can also instantiate `HateoasInterface` directly if you prefer not to use an application-wide interceptor. Simply inject `HateoasInterface` where you need it and instantiate a new instance, passing in the raw response data as seen in the previous section.

### Options

The `HateoasInterfaceProvider` allows for some basic configuration.

#### Setting the `links` key

By default, `HateoasInterface` parses the HATEOAS links from an object with the key "links" within the response data. This key can be changed using `setLinksKey`:

```javascript
app.config(function (HateoasInterfaceProvider) {
	HateoasInterfaceProvider.setLinksKey("related");
	// HateoasInterface will now search response data for links in a property called "related"
});
```

#### Setting `$resource` options

Angular's `$resource` object accepts two optional parameters, as seen in [the documentation](http://docs.angularjs.org/api/ngResource.$resource): `paramDefaults` and `actions`. These parameters can be passed directly in to the `$resource` constructor from the `HateoasInterface.resource` method:

```javascript
var relatedResource = someHateoasItem.resource("some-related-endpoint", {
	binding: "value"
}, {
	update: {
		method: "PUT"
	}
});
```

For more information about these parameters, refer to Angular's `$resource` documentation.

The custom HTTP actions can also be set to an application-wide default, which can be useful if you're using the same actions/methods throughout your app:

```javascript
app.config(function (HateoasInterfaceProvider) {
	HateoasInterfaceProvider.setHttpMethods({
		update: {
			method: "PUT"
		}
	});
});
```


About
-----

The `angular-hateoas` module was created for a personal need, and while it is working for my own projects, it is still in a very early stage of development and probably won't fit every HATEOAS developer's needs. Feel free to use and enjoy – while I can't guarantee support, I welcome any comments, forks, pull requests, bug reports, etc.

`angular-hateoas` was built to work with [Spring Hateoas](https://github.com/SpringSource/spring-hateoas), and has yet to be tested in other environments.