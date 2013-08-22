angular.module("hateoasInterface", ["ngResource"])

	.provider("HateoasInterceptor", function () {
		
		var linksKey = "links";

		return {
			
			setLinksKey: function (newLinksKey) {
				linksKey = newLinksKey || linksKey;
			},

			$get: function (HateoasInterface, $q) {
				return {
					response: function (response) {
						if (response && typeof response[linksKey] === "object") {
							response = new HateoasInterface(response);
						}
						return response || $q.when(response);
					}
				};
			}

		};

	})

	.provider("HateoasInterface", function ($httpProvider, HateoasInterceptorProvider) {

		// global Hateoas settings
		var globalHttpMethods;

		return {

			setHttpMethods: function (httpMethods) {
				globalHttpMethods = angular.copy(httpMethods);
			},

			transformAllResponses: function (linksKey) {
				HateoasInterceptorProvider.setLinksKey(linksKey);
				$httpProvider.interceptors.push("HateoasInterceptor");
			},

			$get: function ($resource) {

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
					angular.extend(this, dataObject, { links: arrayToObject("rel", "href", dataObject.links) });
					return this;
				};

				HateoasInterface.prototype.resource = function (linkName, bindings, httpMethods) {
					if (linkName in this.links) {
						return $resource(this.links[linkName], bindings, httpMethods || globalHttpMethods);
					} else {
						throw "Link is not present in object.";
					}
				};

				return HateoasInterface;

			}

		};

	});
