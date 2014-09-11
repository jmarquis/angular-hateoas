/**
 * @module hateoas
 *
 * An AngularJS module for working with HATEOAS.
 *
 * Setup
 * =====
 *
 * ```javascript
 * angular.module("your-application", ["hateoas"]);
 * ```
 *
 * Using HateoasInterface
 * ======================
 *
 * The `HateoasInterface` service is a class that can be instantiated to consume a raw HATEOAS response. It searches the response for a `links` property and provides a `resource` method to interact with the links.
 *
 * Assume a resource result `someResult` looks like this:
 *
 * ```json
 * {
 *     "arbitraryStringField": "some value",
 *     "arbitraryNumberField": 31,
 *     "links": [
 *         {
 *             "rel": "something-related",
 *             "href": "/arbitrary/link"
 *         },
 *         {
 *             "rel": "something-else-related",
 *             "href": "/another/arbitrary/link"
 *         }
 *     ]
 * }
 * ```
 *
 * The workflow for implementing `HateoasInterface` might look something like this:
 *
 * ```javascript
 * var someResource = $resource("/some/rest/endpoint");
 * var someResult = someResource.get(null, function () {
 *     var object = new HateoasInterface(someResult);
 *     var putResult = object.resource("something-related").put({ someData: "whatever" }, function () {
 *         // logic, etc.
 *     });
 * });
 * ```
 *
 * Using HateoasInterceptor
 * ========================
 *
 * The `HateoasInterceptor` service is a way of making your application globally HATEOAS-enabled. It adds a global HTTP response interceptor that transforms HATEOAS responses into HateoasInterface instances.
 *
 * First, initialize the interceptor:
 *
 * ```javascript
 * app.config(function (HateoasInterceptorProvider) {
 *     HateoasInterceptorProvider.transformAllResponses();
 * });
 * ```
 *
 * Then any HATEOAS response will automatically have the `resource` method:
 *
 * ```javascript
 * var someResource = $resource("/some/rest/endpoint");
 * var someResult = someResource.get(null, function () {
 *     var putResult = someResult.resource("something-related").put({ someData: "whatever" }, function () {
 *         // logic, etc.
 *     });
 * })
 * ```
 */
angular.module("hateoas", ["ngResource"])

	.provider("HateoasInterface", function () {

		// global Hateoas settings
		var globalHttpMethods,
			linksKey = "links";

		return {

			setLinksKey: function (newLinksKey) {
				linksKey = newLinksKey || linksKey;
			},

			getLinksKey: function () {
				return linksKey;
			},

			setHttpMethods: function (httpMethods) {
				globalHttpMethods = angular.copy(httpMethods);
			},

			$get: ["$injector", function ($injector) {

				var arrayToObject = function (keyItem, valueItem, array) {
					var obj = {};
					angular.forEach(array, function (item, index) {
						if (item[keyItem] && item[valueItem]) {
							obj[item[keyItem]] = item[valueItem];
						}
					});

					return obj;
				};

				var resource = function (linkName, bindings, httpMethods) {
					if (linkName in this[linksKey]) {
						return $injector.get("$resource")(this[linksKey][linkName], bindings, httpMethods || globalHttpMethods);
					} else {
						throw "Link '" + linkName + "' is not present in object.";
					}
				};

				var HateoasInterface = function (data) {

					// if links are present, consume object and convert links
					if (data[linksKey]) {
						var links = {};
						links[linksKey] = arrayToObject("rel", "href", data[linksKey]);
						data = angular.extend(this, data, links, { resource: resource });
					}

					// recursively consume all contained arrays or objects with links
					angular.forEach(data, function (value, key) {
						if (key !== linksKey && angular.isObject(value) && (angular.isArray(value) || value[linksKey])) {
							data[key] = new HateoasInterface(value);
						}
					});

					return data;

				};

				return HateoasInterface;

			}]

		};

	})

	.provider("HateoasInterceptor", ["$httpProvider", function ($httpProvider) {

		return {

			transformAllResponses: function () {
				$httpProvider.interceptors.push("HateoasInterceptor");
			},

			$get: ["HateoasInterface", "$q", function (HateoasInterface, $q) {

				return {
					response: function (response) {

						if (response && angular.isObject(response.data)) {
							response.data = new HateoasInterface(response.data);
						}

						return response || $q.when(response);

					}
				};
			}]

		};

	}]);
