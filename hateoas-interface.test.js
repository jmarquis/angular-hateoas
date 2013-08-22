describe("Hateoas Interface module", function () {

	var getMockHateoasResponse = function () {
		return angular.copy({
			stringKey: "value",
			intKey: 1,
			objKey: {
				value: "value"
			},
			arrayKey: [
				"value1",
				"value2"
			],
			links: [
				{
					rel: "self",
					href: "http://root/self"
				},
				{
					rel: "other",
					href: "http://root/other"
				}
			]
		});
	};

	beforeEach(function () {
		module("ngResource");
		module("hateoasInterface");
	});

	describe("HateoasInterface object", function () {

		var HateoasInterface;

		beforeEach(inject(function (_HateoasInterface_) {
			HateoasInterface = _HateoasInterface_;
		}));

		it("should retain all original object properties other than links", function () {
			
			var response = new HateoasInterface(getMockHateoasResponse());
			var rawResponse = getMockHateoasResponse();

			expect(typeof response).toBe("object");

			for (var key in rawResponse) {
				if (key !== "links") expect(response[key]).toEqual(rawResponse[key]);
			}

		});

		it("should provide a resource for each link rel", function () {

			var response = new HateoasInterface(getMockHateoasResponse());

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

	});

	describe("transformAllResponses method", function () {

		var $httpProvider,
			HateoasInterfaceProvider,
			HateoasInterface,
			HateoasInterceptor;

		beforeEach(function () {

			// get providers
			module("ng", function (_HateoasInterfaceProvider_, _$httpProvider_) {
				HateoasInterfaceProvider = _HateoasInterfaceProvider_;
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
			HateoasInterfaceProvider.transformAllResponses();
			expect($httpProvider.interceptors.length).toBe(interceptorCount + 1);
		});

		describe("response interceptor", function () {

			it("should transform a HATEOAS response into a HateoasInterface", function () {
				var transformedResponse = HateoasInterceptor.response(getMockHateoasResponse());
				expect(transformedResponse).toEqual(new HateoasInterface(getMockHateoasResponse()));
			});

			it("should not change a non-HATEOAS response", function () {
				var nonHateoasResponse = { value1: "value1", value2: 2 };
				var transformedResponse = HateoasInterceptor.response(nonHateoasResponse);
				expect(transformedResponse).toEqual(nonHateoasResponse);
			});

		});

	});

});