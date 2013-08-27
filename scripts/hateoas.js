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
 *     HateoasInterceptorProvider.interceptAllResponses();
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

			$get: function ($injector) {

				var arrayToObject = function (keyItem, valueItem, array) {
					var obj = {};
					angular.forEach(array, function (item, index) {
						if (item[keyItem] && item[valueItem]) {
							obj[item[keyItem]] = item[valueItem];
						}
					});

					return obj;
				};

				var HateoasInterface = function (dataObject) {
					angular.extend(this, dataObject, { links: arrayToObject("rel", "href", dataObject[linksKey]) });
					return this;
				};

				HateoasInterface.prototype.resource = function (linkName, bindings, httpMethods) {
					if (linkName in this[linksKey]) {
						return $injector.get("$resource")(this[linksKey][linkName], bindings, httpMethods || globalHttpMethods);
					} else {
						throw "Link '" + linkName + "' is not present in object.";
					}
				};

				return HateoasInterface;

			}

		};

	})

	.provider("HateoasInterceptor", function ($httpProvider, HateoasInterfaceProvider) {
		
		var linksKey = HateoasInterfaceProvider.getLinksKey();

		return {
			
			transformAllResponses: function () {
				$httpProvider.interceptors.push("HateoasInterceptor");
			},

			$get: function (HateoasInterface, $q) {

				return {
					response: function (response) {

						if (response && angular.isObject(response.data)) {

							if (angular.isArray(response.data)) {
								for (var i = 0; i < response.data.length; i++) {
									if (angular.isArray(response.data[i][linksKey])) {
										response.data[i] = new HateoasInterface(response.data[i]);
									}
								}
							} else if (angular.isArray(response.data[linksKey])) {
								response.data = new HateoasInterface(response.data);
							}
						
						}

						return response || $q.when(response);

					}
				};
			}

		};

	});

