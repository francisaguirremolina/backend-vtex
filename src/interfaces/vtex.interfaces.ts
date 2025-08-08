import { ICarrier as IVtexPackageCarrier } from 'vtex-package-ts/dist/interfaces';

export interface IVtexOrder {
	orderId: string;
	sequence: string;
	marketplaceOrderId: string;
	marketplaceServicesEndpoint: string;
	sellerOrderId: string;
	origin: string;
	affiliateId: string;
	salesChannel: string;
	merchantName: null;
	status: string;
	workflowIsInError: boolean;
	statusDescription: string;
	value: number;
	creationDate: Date;
	lastChange: Date;
	orderGroup: string;
	totals: Total[];
	items: ItemElement[];
	marketplaceItems: any[];
	clientProfileData: ClientProfileData;
	giftRegistryData: null;
	marketingData: null;
	ratesAndBenefitsData: RatesAndBenefitsData;
	shippingData: ShippingData;
	paymentData: PaymentData;
	packageAttachment: PackageAttachment;
	sellers: Seller[];
	callCenterOperatorData: null;
	followUpEmail: string;
	lastMessage: null;
	hostname: string;
	invoiceData: null;
	changesAttachment: null;
	openTextField: null;
	roundingError: number;
	orderFormId: string;
	commercialConditionData: null;
	isCompleted: boolean;
	customData: null;
	storePreferencesData: StorePreferencesData;
	allowCancellation: boolean;
	allowEdition: boolean;
	isCheckedIn: boolean;
	marketplace: Marketplace;
	authorizedDate: Date;
	invoicedDate: null;
	cancelReason: null;
	itemMetadata: ItemMetadata;
	subscriptionData: null;
	taxData: null;
	checkedInPickupPointId: null;
	cancellationData: null;
	clientPreferencesData: ClientPreferencesData;
}

export interface ClientPreferencesData {
	locale: string;
	optinNewsLetter: boolean;
}

export interface ClientProfileData {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	documentType: string;
	document: string;
	phone: string;
	corporateName: null;
	tradeName: null;
	corporateDocument: null;
	stateInscription: null;
	corporatePhone: null;
	isCorporate: boolean;
	userProfileId: string;
	userProfileVersion: null;
	customerClass: null;
}

export interface ItemMetadata {
	Items: Item[];
}

export interface Item {
	Id: string;
	Seller: string;
	Name: string;
	SkuName: string;
	ProductId: string;
	RefId: null;
	Ean: string;
	ImageUrl: string;
	DetailUrl: string;
	AssemblyOptions: any[];
}

export interface ItemElement {
	uniqueId: string;
	id: string;
	productId: string;
	ean: string;
	lockId: string;
	itemAttachment: ItemAttachment;
	attachments: any[];
	quantity: number;
	seller: string;
	name: string;
	refId: null;
	price: number;
	listPrice: number;
	manualPrice: null;
	priceTags: any[];
	imageUrl: string;
	detailUrl: string;
	components: any[];
	bundleItems: any[];
	params: any[];
	offerings: any[];
	attachmentOfferings: any[];
	sellerSku: string;
	priceValidUntil: null;
	commission: number;
	tax: number;
	preSaleDate: null;
	additionalInfo: AdditionalInfo;
	measurementUnit: string;
	unitMultiplier: number;
	sellingPrice: number;
	isGift: boolean;
	shippingPrice: null;
	rewardValue: number;
	freightCommission: number;
	priceDefinition: PriceDefinition;
	taxCode: string;
	parentItemIndex: null;
	parentAssemblyBinding: null;
	callCenterOperator: null;
	serialNumbers: null;
	assemblies: any[];
	costPrice: number;
}

export interface AdditionalInfo {
	brandName: string;
	brandId: string;
	categoriesIds: string;
	categories: Category[];
	productClusterId: string;
	commercialConditionId: string;
	dimension: Dimension;
	offeringInfo: null;
	offeringType: null;
	offeringTypeId: null;
}

export interface Category {
	id: number;
	name: string;
}

export interface Dimension {
	cubicweight: number;
	height: number;
	length: number;
	weight: number;
	width: number;
}

export interface ItemAttachment {
	content: Con;
	name: null;
}

export interface Con {}

export interface PriceDefinition {
	sellingPrices: SellingPrice[];
	calculatedSellingPrice: number;
	total: number;
}

export interface SellingPrice {
	value: number;
	quantity: number;
}

export interface Marketplace {
	baseURL: string;
	isCertified: null;
	name: string;
}

export interface PackageAttachment {
	packages: any[];
}

export interface PaymentData {
	giftCards: any[];
	transactions: Transaction[];
}

export interface Transaction {
	isActive: boolean;
	transactionId: string;
	merchantName: string;
	payments: Payment[];
}

export interface Payment {
	id: string;
	paymentSystem: string;
	paymentSystemName: string;
	value: number;
	installments: number;
	referenceValue: number;
	cardHolder: null;
	cardNumber: null;
	firstDigits: null;
	lastDigits: null;
	cvv2: null;
	expireMonth: null;
	expireYear: null;
	url: null;
	giftCardId: null;
	giftCardName: null;
	giftCardCaption: null;
	redemptionCode: null;
	group: string;
	tid: null;
	dueDate: null;
	connectorResponses: Con;
	giftCardProvider: null;
	giftCardAsDiscount: null;
	koinUrl: null;
	accountId: null;
	parentAccountId: null;
	bankIssuedInvoiceIdentificationNumber: null;
	bankIssuedInvoiceIdentificationNumberFormatted: null;
	bankIssuedInvoiceBarCodeNumber: null;
	bankIssuedInvoiceBarCodeType: null;
	billingAddress: null;
}

export interface RatesAndBenefitsData {
	id: string;
	rateAndBenefitsIdentifiers: any[];
}

export interface Seller {
	id: string;
	name: string;
	logo: string;
	fulfillmentEndpoint: string;
}

export interface ShippingData {
	id: string;
	address: Address;
	logisticsInfo: LogisticsInfo[];
	trackingHints: null;
	selectedAddresses: Address[];
}

export interface Address {
	addressType: string;
	receiverName: string;
	addressId: string;
	versionId: null;
	entityId: null;
	postalCode: string;
	city: string;
	state: string;
	country: string;
	street: string;
	number: string;
	neighborhood: null;
	complement: null;
	reference: null;
	geoCoordinates: number[];
}

export interface LogisticsInfo {
	itemIndex: number;
	selectedSla: string;
	lockTTL: string;
	price: number;
	listPrice: number;
	sellingPrice: number;
	deliveryWindow: null;
	deliveryCompany: string;
	shippingEstimate: string;
	shippingEstimateDate: Date;
	slas: Sla[];
	shipsTo: string[];
	deliveryIds: DeliveryID[];
	deliveryChannels: DeliveryChannel[];
	deliveryChannel: string;
	pickupStoreInfo: PickupStoreInfo;
	addressId: string;
	versionId: null;
	entityId: null;
	polygonName: string;
	pickupPointId: null;
	transitTime: string;
}

export interface DeliveryChannel {
	id: string;
	stockBalance: number;
}

export interface DeliveryID {
	courierId: string;
	courierName: string;
	dockId: string;
	quantity: number;
	warehouseId: string;
	accountCarrierName: string;
	kitItemDetails: any[];
}

export interface PickupStoreInfo {
	additionalInfo: null;
	address: null;
	dockId: null;
	friendlyName: null;
	isPickupStore: boolean;
}

export interface Sla {
	id: string;
	name: string;
	shippingEstimate: string;
	deliveryWindow: null;
	price: number;
	deliveryChannel: string;
	pickupStoreInfo: PickupStoreInfo;
	polygonName: string;
	lockTTL: string;
	pickupPointId: null;
	transitTime: string;
	pickupDistance: number;
}

export interface StorePreferencesData {
	countryCode: string;
	currencyCode: string;
	currencyFormatInfo: CurrencyFormatInfo;
	currencyLocale: number;
	currencySymbol: string;
	timeZone: string;
}

export interface CurrencyFormatInfo {
	CurrencyDecimalDigits: number;
	CurrencyDecimalSeparator: string;
	CurrencyGroupSeparator: string;
	CurrencyGroupSize: number;
	StartsWithCurrencySymbol: boolean;
}

export interface Total {
	id: string;
	name: string;
	value: number;
}

export interface IPickupPoint {
	id: string;
	name: string;
	description: string;
	instructions: string;
	formatted_address: string;
	address: {
		postalCode: string;
		country: {
			acronym: string;
			name: string;
		};
		city: string;
		state: string;
		neighborhood: string;
		street: string;
		number: string;
		complement: string;
		reference: string;
		location: {
			latitude: number;
			longitude: number;
		};
	};
	isActive: boolean;
	businessHours: Array<{
		dayOfWeek: number;
		openingTime: string;
		closingTime: string;
	}>;
	tagsLabel: string[];
}

export interface ICarrier extends IVtexPackageCarrier {
	isActive: boolean;
	shippingMethod: string;
}
