describe("Hateoas Interface module", function () {

	var getMockAngularResponseData = function (linksKey) {

		var responseData = angular.copy({
			stringKey: "value",
			intKey: 1,
			objKey: {
				value: "value"
			},
			arrayKey: [
				"value1",
				"value2"
			]
		});

		responseData[linksKey || "links"] = [
			{
				rel: "self",
				href: "http://root/self"
			},
			{
				rel: "other",
				href: "http://root/other"
			}
		];

		return responseData;

	};

	beforeEach(function () {
		module("ngResource");
		module("hateoas");
	});

	describe("HateoasInterface object", function () {

		var HateoasInterface,
			HateoasInterfaceProvider;

		beforeEach(function () {

			// get providers
			module("ng", function (_HateoasInterfaceProvider_) {
				HateoasInterfaceProvider = _HateoasInterfaceProvider_;
			});

			// get injectables
			inject(function (_HateoasInterface_) {
				HateoasInterface = _HateoasInterface_;
			});

		});

		it("should retain all original object properties other than links", function () {

			var response = new HateoasInterface(getMockAngularResponseData());
			var rawResponse = getMockAngularResponseData();

			expect(typeof response).toBe("object");

			for (var key in rawResponse) {
				if (key !== "links") expect(response[key]).toEqual(rawResponse[key]);
			}

		});

		it("should provide a resource for each link rel", function () {

			var response = new HateoasInterface(getMockAngularResponseData());

			expect(typeof response.resource).toBe("function");

			expect(response.resource("self")).toBeTruthy();
			expect(typeof response.resource("self").get).toBe("function");

			expect(response.resource("other")).toBeTruthy();
			expect(typeof response.resource("other").get).toBe("function");

			expect(response.resource).toThrow();
			expect(function () {
				response.resource("invalid link");
			}).toThrow();

		});

		it("should recursively process an array response", function () {

			var response = new HateoasInterface([getMockAngularResponseData(), getMockAngularResponseData()]);

			expect(response.length).toBe(2);

			expect(response[0] instanceof HateoasInterface).toBe(true);
			expect(response[1] instanceof HateoasInterface).toBe(true);

		});

		it("should recursively process nested objects", function () {

			var response = new HateoasInterface({
				nestedObj1: getMockAngularResponseData(),
				nestedObj2: getMockAngularResponseData()
			});

			expect(response.nestedObj1 instanceof HateoasInterface).toBe(true);
			expect(response.nestedObj2 instanceof HateoasInterface).toBe(true);

		});

		it("should allow customization of links key", function () {

			var linksKey;

			for (var i = 0; i < 10; i++) {

				linksKey = Math.random().toString(36).slice(-10);

				HateoasInterfaceProvider.setLinksKey(linksKey);

				var response = new HateoasInterface(getMockAngularResponseData(linksKey));
				expect(response instanceof HateoasInterface).toBe(true);
				expect(response[linksKey] instanceof Object).toBe(true);

				expect(response.resource("self")).toBeTruthy();
				expect(typeof response.resource("self").get).toBe("function");

				expect(response.resource("other")).toBeTruthy();
				expect(typeof response.resource("other").get).toBe("function");

			}

		});

	});

	describe("transformAllResponses method", function () {

		var $httpProvider,
			HateoasInterceptorProvider,
			HateoasInterface,
			HateoasInterceptor;

		beforeEach(function () {

			// get providers
			module("ng", function (_HateoasInterceptorProvider_, _$httpProvider_) {
				HateoasInterceptorProvider = _HateoasInterceptorProvider_;
				$httpProvider = _$httpProvider_;
				$httpProvider.interceptors = [];
			});

			// get injectables
			inject(function (_HateoasInterface_, _HateoasInterceptor_) {
				HateoasInterface = _HateoasInterface_;
				HateoasInterceptor = _HateoasInterceptor_;
			});

		});

		it("should add a global HTTP interceptor", function () {
			var interceptorCount = $httpProvider.interceptors.length;
			HateoasInterceptorProvider.transformAllResponses();
			expect($httpProvider.interceptors.length).toBe(interceptorCount + 1);
		});

		describe("response interceptor", function () {

			it("should transform a HATEOAS response into a HateoasInterface", function () {
				var transformedResponse = HateoasInterceptor.response({ data: getMockAngularResponseData() }).data;
				expect(transformedResponse).toEqual(new HateoasInterface(getMockAngularResponseData()));
			});

			it("should not change a non-HATEOAS response", function () {
				var nonHateoasResponse = { value1: "value1", value2: 2 };
				var transformedResponse = HateoasInterceptor.response(nonHateoasResponse);
				expect(transformedResponse).toEqual(nonHateoasResponse);
			});

		});

	});

});