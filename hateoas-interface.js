angular.module("hateoasInterface", [])

	.provider("HateoasInterface", function () {

		// global Hateoas settings
		var globalHttpMethods;

		return {

			setHttpMethods: function (httpMethods) {
				globalHttpMethods = angular.copy(httpMethods);
			},

			$get: function ($resource) {

				var arrayToObject = function (keyItem, valueItem, array) {
					var obj = {};
					$.each(array, function (index, item) {
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
