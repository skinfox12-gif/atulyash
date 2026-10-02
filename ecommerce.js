(() => {
  'use strict';

  let PRODUCT = {
    name: 'Atulyash Whole Wheat Atta',
    image: 'images/sack5g.webp',
    unitPrice: 120,
    variants: {
      2: { weight: 2, price: 240, apiId: null, available: true },
      4: { weight: 4, price: 480, apiId: null, available: true },
      6: { weight: 6, price: 720, apiId: null, available: true },
      8: { weight: 8, price: 960, apiId: null, available: true }
    }
  };

  let WEEKLY_PLANS = [];
  let WEEKLY_PLAN_BY_ID = new Map(WEEKLY_PLANS.map((plan) => [plan.id, plan]));
  const DELIVERY_DAYS = ['Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const ROTI_ATTA_GRAMS = 30;
  const MIN_DAILY_ROTIS = 1;
  const CART_STORAGE_KEY = 'atulyash-cart-v1';
  const CART_SYNC_STORAGE_KEY = 'atulyash-cart-sync-v1';
  const PENDING_ORDER_STORAGE_KEY = 'atulyash-pending-order-v1';
  const STOREFRONT_INTENT_KEY = 'atulyash-storefront-intent-v1';
  const CHECKOUT_CONTEXT_KEY = 'atulyash-checkout-context-v1';
  const COUPON_CONTEXT_KEY = 'atulyash-coupon-context-v1';
  const SERVICEABILITY_STORAGE_KEY = 'atulyash-home-serviceability-v1';
  const SERVICEABILITY_MAX_AGE = 6 * 60 * 60 * 1000;
  const CHECKOUT_CONTEXT_TTL = 2 * 60 * 60 * 1000;
  // Temporarily keep the storefront open for browsing and ordering without a
  // frontend PIN prompt. Checkout and the backend remain authoritative for delivery validation.
  const STOREFRONT_SERVICEABILITY_ENABLED = false;
  const API = window.AtulyashAPI || null;
  const currency = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  const elements = {
    headerAccountLink: document.getElementById('headerAccountLink'),
    headerAccountLabel: document.getElementById('headerAccountLabel'),
    checkoutHandoff: document.getElementById('checkoutHandoff'),
    checkoutHandoffTitle: document.getElementById('checkoutHandoffTitle'),
    checkoutHandoffStatus: document.getElementById('checkoutHandoffStatus'),
    checkoutHandoffActions: document.getElementById('checkoutHandoffActions'),
    checkoutHandoffReview: document.getElementById('checkoutHandoffReview'),
    checkoutHandoffReturn: document.getElementById('checkoutHandoffReturn'),
    headerCartButton: document.getElementById('headerCartButton'),
    headerCartCount: document.getElementById('headerCartCount'),
    heroUnitPrice: document.getElementById('heroUnitPrice'),
    heroVisualUnitPrice: document.getElementById('heroVisualUnitPrice'),
    heroWeeklyButton: document.getElementById('heroWeeklyButton'),
    startWeeklyButton: document.getElementById('startWeeklyButton'),
    headerLocationButton: document.getElementById('headerLocationButton'),
    headerLocationLabel: document.getElementById('headerLocationLabel'),
    serviceabilityDialog: document.getElementById('serviceabilityDialog'),
    serviceabilityCloseButton: document.getElementById('serviceabilityCloseButton'),
    serviceabilityLocationButton: document.getElementById('serviceabilityLocationButton'),
    serviceabilityLocationLabel: document.getElementById('serviceabilityLocationLabel'),
    serviceabilityForm: document.getElementById('serviceabilityForm'),
    serviceabilityPincode: document.getElementById('serviceabilityPincode'),
    serviceabilityCheckButton: document.getElementById('serviceabilityCheckButton'),
    serviceabilityStatus: document.getElementById('serviceabilityStatus'),
    serviceabilityStatusMark: document.getElementById('serviceabilityStatusMark'),
    serviceabilityStatusTitle: document.getElementById('serviceabilityStatusTitle'),
    serviceabilityStatusCopy: document.getElementById('serviceabilityStatusCopy'),
    serviceabilityContinueButton: document.getElementById('serviceabilityContinueButton'),
    serviceabilityBrowseButton: document.getElementById('serviceabilityBrowseButton'),
    productShowcase: document.getElementById('productShowcase'),
    storeServiceStatus: document.getElementById('storeServiceStatus'),
    storeServiceStatusLabel: document.getElementById('storeServiceStatusLabel'),
    storeServiceRetryButton: document.getElementById('storeServiceRetryButton'),
    catalogApiStatus: document.getElementById('catalogApiStatus'),
    catalogApiStatusLabel: document.getElementById('catalogApiStatusLabel'),
    catalogRetryButton: document.getElementById('catalogRetryButton'),
    productGallery: document.querySelector('.product-gallery'),
    productImage: document.getElementById('shopProductImage'),
    packFillAnimation: document.getElementById('packFillAnimation'),
    packSelectionScene: document.getElementById('packSelectionScene'),
    packSelectionSceneWeight: document.getElementById('packSelectionSceneWeight'),
    packSelectionMiniFill: document.getElementById('packSelectionMiniFill'),
    productPrice: document.getElementById('productPrice'),
    productUnitPrice: document.getElementById('productUnitPrice'),
    addToCartPrice: document.getElementById('addToCartPrice'),
    packSelector: document.getElementById('packSelector'),
    packSizeSelect: document.getElementById('packSizeSelect'),
    purchaseSelector: document.getElementById('purchaseSelector'),
    weeklyPlanPanel: document.getElementById('weeklyPlanPanel'),
    weeklyPlanSelect: document.getElementById('weeklyPlanSelect'),
    weeklyPlanSummary: document.getElementById('weeklyPlanSummary'),
    weeklyCalculatorSuggestionLabel: document.getElementById('weeklyCalculatorSuggestionLabel'),
    weeklyCalculatorSuggestionTitle: document.getElementById('weeklyCalculatorSuggestionTitle'),
    weeklyCalculatorSuggestionText: document.getElementById('weeklyCalculatorSuggestionText'),
    weeklyCalculatorLink: document.getElementById('weeklyCalculatorLink'),
    weeklyCalculatorApplyButton: document.getElementById('weeklyCalculatorApplyButton'),
    productQuantity: document.getElementById('productQuantity'),
    quantityMinus: document.getElementById('productQuantityMinus'),
    quantityPlus: document.getElementById('productQuantityPlus'),
    addToCartButton: document.getElementById('addToCartButton'),
    addToCartLabel: document.getElementById('addToCartLabel'),
    buyNowButton: document.getElementById('buyNowButton'),
    backdrop: document.getElementById('commerceBackdrop'),
    cartDrawer: document.getElementById('cartDrawer'),
    cartCloseButton: document.getElementById('cartCloseButton'),
    cartTitleCount: document.getElementById('cartTitleCount'),
    cartAuthGate: document.getElementById('cartAuthGate'),
    cartAuthLoginLink: document.getElementById('cartAuthLoginLink'),
    cartEmpty: document.getElementById('cartEmpty'),
    cartItems: document.getElementById('cartItems'),
    cartPromise: document.getElementById('cartPromise'),
    cartFooter: document.getElementById('cartFooter'),
    cartApiStatus: document.getElementById('cartApiStatus'),
    cartApiStatusLabel: document.getElementById('cartApiStatusLabel'),
    cartApiRetryButton: document.getElementById('cartApiRetryButton'),
    cartSubtotalLabel: document.getElementById('cartSubtotalLabel'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartExperienceCreditRow: document.getElementById('cartExperienceCreditRow'),
    cartExperienceCredit: document.getElementById('cartExperienceCredit'),
    cartDiscountLabel: document.getElementById('cartDiscountLabel'),
    cartTotalLabel: document.getElementById('cartTotalLabel'),
    cartTotal: document.getElementById('cartTotal'),
    cartDeliveryChargeRow: document.getElementById('cartDeliveryChargeRow'),
    cartDeliveryChargeLabel: document.getElementById('cartDeliveryChargeLabel'),
    cartDeliveryCharge: document.getElementById('cartDeliveryCharge'),
    cartDeliveryChargeNote: document.getElementById('cartDeliveryChargeNote'),
    couponOffer: document.getElementById('couponOffer'),
    couponToggleButton: document.getElementById('couponToggleButton'),
    couponOfferSummary: document.getElementById('couponOfferSummary'),
    couponPanel: document.getElementById('couponPanel'),
    couponSearch: document.getElementById('couponSearch'),
    couponStatus: document.getElementById('couponStatus'),
    couponList: document.getElementById('couponList'),
    emptyCartShopButton: document.getElementById('emptyCartShopButton'),
    continueShoppingButton: document.getElementById('continueShoppingButton'),
    checkoutButton: document.getElementById('checkoutButton'),
    checkoutModal: document.getElementById('checkoutModal'),
    checkoutCloseButton: document.getElementById('checkoutCloseButton'),
    checkoutReturnLabel: document.getElementById('checkoutReturnLabel'),
    checkoutPurchaseClarity: document.getElementById('checkoutPurchaseClarity'),
    checkoutPurchaseClarityTitle: document.getElementById('checkoutPurchaseClarityTitle'),
    checkoutPurchaseClarityDescription: document.getElementById('checkoutPurchaseClarityDescription'),
    checkoutPurchaseClarityChange: document.getElementById('checkoutPurchaseClarityChange'),
    checkoutForm: document.getElementById('checkoutForm'),
    checkoutErrorSummary: document.getElementById('checkoutErrorSummary'),
    checkoutPhone: document.getElementById('checkoutPhone'),
    checkoutIdentityDetailsView: document.getElementById('checkoutIdentityDetailsView'),
    checkoutOtpView: document.getElementById('checkoutOtpView'),
    checkoutOtpPhone: document.getElementById('checkoutOtpPhone'),
    checkoutOtp: document.getElementById('checkoutOtp'),
    checkoutOtpError: document.getElementById('checkoutOtpError'),
    checkoutOtpStatus: document.getElementById('checkoutOtpStatus'),
    checkoutResetOtpButton: document.getElementById('checkoutResetOtpButton'),
    checkoutOtpVerifyButton: document.getElementById('checkoutOtpVerifyButton'),
    checkoutOtpVerifyLabel: document.getElementById('checkoutOtpVerifyLabel'),
    checkoutOtpResendStatus: document.getElementById('checkoutOtpResendStatus'),
    checkoutOtpResendTimer: document.getElementById('checkoutOtpResendTimer'),
    checkoutResendOtpLabel: document.getElementById('checkoutResendOtpLabel'),
    checkoutChangeNumberButton: document.getElementById('checkoutChangeNumberButton'),
    checkoutOtpVerifiedView: document.getElementById('checkoutOtpVerifiedView'),
    checkoutOtpVerifiedTitle: document.getElementById('checkoutOtpVerifiedTitle'),
    checkoutVerifiedPhone: document.getElementById('checkoutVerifiedPhone'),
    checkoutVerifiedChangeButton: document.getElementById('checkoutVerifiedChangeButton'),
    checkoutIdentitySubmit: document.getElementById('checkoutIdentitySubmit'),
    checkoutIdentitySubmitLabel: document.getElementById('checkoutIdentitySubmitLabel'),
    checkoutBackButton: document.getElementById('checkoutBackButton'),
    checkoutDeliveryBackButton: document.getElementById('checkoutDeliveryBackButton'),
    checkoutDeliveryTitle: document.getElementById('checkoutDeliveryTitle'),
    checkoutDeliveryIntro: document.getElementById('checkoutDeliveryIntro'),
    checkoutDeliveryFlow: document.getElementById('checkoutDeliveryFlow'),
    checkoutDeliveryFlowStatus: document.getElementById('checkoutDeliveryFlowStatus'),
    checkoutDeliverySubmit: document.getElementById('checkoutDeliverySubmit'),
    checkoutDeliverySubmitLabel: document.getElementById('checkoutDeliverySubmitLabel'),
    checkoutReviewAddress: document.getElementById('checkoutReviewAddress'),
    checkoutAddressStatus: document.getElementById('checkoutAddressStatus'),
    checkoutAddressStatusLabel: document.getElementById('checkoutAddressStatusLabel'),
    checkoutAddressRetryButton: document.getElementById('checkoutAddressRetryButton'),
    checkoutSavedAddressSection: document.getElementById('checkoutSavedAddressSection'),
    checkoutAddressList: document.getElementById('checkoutAddressList'),
    checkoutAddressEmpty: document.getElementById('checkoutAddressEmpty'),
    checkoutAddAddressButton: document.getElementById('checkoutAddAddressButton'),
    checkoutNewAddressFields: document.getElementById('checkoutNewAddressFields'),
    checkoutAddressNext: document.getElementById('checkoutAddressNext'),
    checkoutPincode: document.getElementById('checkoutPincode'),
    checkoutAreaField: document.getElementById('checkoutAreaField'),
    checkoutArea: document.getElementById('checkoutArea'),
    checkoutOtherAreaField: document.getElementById('checkoutOtherAreaField'),
    checkoutOtherArea: document.getElementById('checkoutOtherArea'),
    checkoutPincodeServiceability: document.getElementById('checkoutPincodeServiceability'),
    checkoutPincodeTitle: document.getElementById('checkoutPincodeTitle'),
    checkoutPincodeStatus: document.getElementById('checkoutPincodeStatus'),
    checkoutPincodeCheckButton: document.getElementById('checkoutPincodeCheckButton'),
    checkoutPincodeLoginLink: document.getElementById('checkoutPincodeLoginLink'),
    checkoutRefreshAvailabilityButton: document.getElementById('checkoutRefreshAvailabilityButton'),
    checkoutDeliveryAvailability: document.getElementById('checkoutDeliveryAvailability'),
    checkoutDeliveryAvailabilityStatus: document.getElementById('checkoutDeliveryAvailabilityStatus'),
    checkoutDeliveryDate: document.getElementById('checkoutDeliveryDate'),
    checkoutDeliveryDateError: document.getElementById('checkoutDeliveryDateError'),
    checkoutOrderNotes: document.getElementById('checkoutOrderNotes'),
    checkoutOrderNotesCount: document.getElementById('checkoutOrderNotesCount'),
    checkoutPaymentMethods: document.getElementById('checkoutPaymentMethods'),
    checkoutPaymentWallet: document.getElementById('checkoutPaymentWallet'),
    checkoutWalletCard: document.getElementById('checkoutWalletCard'),
    checkoutWalletState: document.getElementById('checkoutWalletState'),
    checkoutWalletBalance: document.getElementById('checkoutWalletBalance'),
    checkoutWalletReservedRow: document.getElementById('checkoutWalletReservedRow'),
    checkoutWalletReserved: document.getElementById('checkoutWalletReserved'),
    checkoutWalletOrderLabel: document.getElementById('checkoutWalletOrderLabel'),
    checkoutWalletOrderTotal: document.getElementById('checkoutWalletOrderTotal'),
    checkoutWalletRequirementRow: document.getElementById('checkoutWalletRequirementRow'),
    checkoutWalletRequirementLabel: document.getElementById('checkoutWalletRequirementLabel'),
    checkoutWalletRequirement: document.getElementById('checkoutWalletRequirement'),
    checkoutWalletShortfallRow: document.getElementById('checkoutWalletShortfallRow'),
    checkoutWalletShortfall: document.getElementById('checkoutWalletShortfall'),
    checkoutWalletExplanation: document.getElementById('checkoutWalletExplanation'),
    checkoutWalletAddButton: document.getElementById('checkoutWalletAddButton'),
    checkoutWalletAddButtonLabel: document.getElementById('checkoutWalletAddButtonLabel'),
    checkoutWalletRefreshButton: document.getElementById('checkoutWalletRefreshButton'),
    checkoutWalletTopup: document.getElementById('checkoutWalletTopup'),
    checkoutWalletTopupTitle: document.getElementById('checkoutWalletTopupTitle'),
    checkoutWalletTopupSummary: document.getElementById('checkoutWalletTopupSummary'),
    checkoutWalletTopupCancel: document.getElementById('checkoutWalletTopupCancel'),
    checkoutWalletTopupConfirm: document.getElementById('checkoutWalletTopupConfirm'),
    checkoutWalletTopupConfirmLabel: document.getElementById('checkoutWalletTopupConfirmLabel'),
    checkoutPaymentStatus: document.getElementById('checkoutPaymentStatus'),
    checkoutConsent: document.getElementById('checkoutConsent'),
    checkoutConsentText: document.getElementById('checkoutConsentText'),
    checkoutConsentError: document.getElementById('checkoutConsentError'),
    checkoutWalletPolicyTitle: document.getElementById('checkoutWalletPolicyTitle'),
    checkoutWalletPolicyDescription: document.getElementById('checkoutWalletPolicyDescription'),
    placeOrderButton: document.getElementById('placeOrderButton'),
    placeOrderButtonLabel: document.getElementById('placeOrderButtonLabel'),
    checkoutPlaceOrderStatus: document.getElementById('checkoutPlaceOrderStatus'),
    checkoutPlaceOrderStatusLabel: document.getElementById('checkoutPlaceOrderStatusLabel'),
    checkoutSuccess: document.getElementById('checkoutSuccess'),
    checkoutSuccessCelebration: document.getElementById('checkoutSuccessCelebration'),
    checkoutSuccessSkipAnimation: document.getElementById('checkoutSuccessSkipAnimation'),
    checkoutReference: document.getElementById('checkoutReference'),
    checkoutSuccessMessage: document.getElementById('checkoutSuccessMessage'),
    checkoutSuccessDetails: document.getElementById('checkoutSuccessDetails'),
    checkoutSuccessDeliveryDate: document.getElementById('checkoutSuccessDeliveryDate'),
    checkoutSuccessPaymentStatus: document.getElementById('checkoutSuccessPaymentStatus'),
    checkoutViewOrderLink: document.getElementById('checkoutViewOrderLink'),
    checkoutSummary: document.querySelector('.checkout-summary'),
    checkoutSummaryItems: document.getElementById('checkoutSummaryItems'),
    checkoutSubtotal: document.getElementById('checkoutSubtotal'),
    checkoutSubtotalLabel: document.getElementById('checkoutSubtotalLabel'),
    checkoutExperienceCreditRow: document.getElementById('checkoutExperienceCreditRow'),
    checkoutExperienceCredit: document.getElementById('checkoutExperienceCredit'),
    checkoutDiscountLabel: document.getElementById('checkoutDiscountLabel'),
    checkoutTotalLabel: document.getElementById('checkoutTotalLabel'),
    checkoutTotal: document.getElementById('checkoutTotal'),
    checkoutDeliveryChargeRow: document.getElementById('checkoutDeliveryChargeRow'),
    checkoutDeliveryChargeLabel: document.getElementById('checkoutDeliveryChargeLabel'),
    checkoutDeliveryCharge: document.getElementById('checkoutDeliveryCharge'),
    checkoutDeliveryChargeNote: document.getElementById('checkoutDeliveryChargeNote'),
    whatsappOrderLink: document.getElementById('whatsappOrderLink'),
    successCloseButton: document.getElementById('successCloseButton'),
    toast: document.getElementById('commerceToast'),
    dailyRotis: document.getElementById('dailyRotis'),
    dailyRotisMinus: document.getElementById('dailyRotisMinus'),
    dailyRotisPlus: document.getElementById('dailyRotisPlus'),
    weeklyWalletOutput: document.getElementById('weeklyWalletOutput'),
    weeklyOutput: document.getElementById('weeklyOutput'),
    calculatorFormulaSummary: document.getElementById('calculatorFormulaSummary'),
    calculatorCta: document.getElementById('calculatorCta'),
    closestPackOutput: document.getElementById('closestPackOutput'),
    checkoutWeeklyScheduleField: document.getElementById('checkoutWeeklyScheduleField'),
    checkoutDeliveryDay: document.getElementById('checkoutDeliveryDay'),
    mobileBuyBar: document.getElementById('mobileBuyBar'),
    mobilePackLabel: document.getElementById('mobilePackLabel'),
    mobilePackPrice: document.getElementById('mobilePackPrice'),
    mobileAddButton: document.getElementById('mobileAddButton')
  };

  const IS_CHECKOUT_PAGE = document.body?.dataset.commercePage === 'checkout';
  const IS_STOREFRONT_PAGE = Boolean(elements.productShowcase);
  if (!IS_STOREFRONT_PAGE && !IS_CHECKOUT_PAGE) return;

  let selectedWeight = 2;
  let selectedPurchaseType = 'once';
  let selectedWeeklyPlanId = '';
  let selectedQuantity = 1;
  let calculatorRecommendation = null;
  let calculatorHasUserInput = false;
  let weeklyCatalogMessage = 'Loading weekly plans…';
  let cart = loadCart();
  let checkoutStep = 1;
  let checkoutProfilePhone = '';
  let authOtpState = 'details';
  let authPendingPhone = '';
  let authVerifiedPhone = '';
  let apiSession = getApiSession();
  let serverCartId = null;
  let serverCartSummary = null;
  let firstOrderEligibility = null;
  let firstOrderEligibilityRequest = null;
  let serverCartActive = false;
  let cartNeedsAuthentication = false;
  let pendingGuestCart = [];
  let guestSyncRecord = loadSessionRecord(CART_SYNC_STORAGE_KEY, {});
  let guestSyncCustomerId = guestSyncRecord?.customerId ?? null;
  let guestSyncTargets = (
    guestSyncRecord?.targets
    && !Array.isArray(guestSyncRecord.targets)
    && typeof guestSyncRecord.targets === 'object'
  ) ? guestSyncRecord.targets : {};
  let savedAddresses = [];
  let selectedAddressId = null;
  let selectedDeliveryDate = '';
  // Keep the complete availability response so changing the preferred
  // weekday can filter the date selector without another network request.
  let availableDeliveryDates = [];
  let lastOrderResponse = null;
  let pendingOrder = loadSessionRecord(PENDING_ORDER_STORAGE_KEY, null);
  let catalogReadiness = { products: false, subscriptions: false };
  let purchaseButtonsBusy = false;
  let otpRequestInFlight = false;
  let otpVerifyInFlight = false;
  let addressSaveInFlight = false;
  let deliveryStepInFlight = false;
  let deliveryAvailabilityGeneration = 0;
  let orderInFlight = false;
  let checkoutWalletBalanceAmount = null;
  let checkoutWalletReservedAmount = null;
  let checkoutWalletBalanceGeneration = 0;
  let walletRechargePreview = null;
  let walletFundingPolicy = null;
  let walletRechargeInFlight = false;
  let walletRechargeVerificationPending = false;
  let couponData = { valid: [], invalid: [] };
  let couponsLoaded = false;
  let couponBusy = false;
  let couponMessage = '';
  let appliedCouponOverride = loadSessionRecord(COUPON_CONTEXT_KEY, null)?.coupon || null;
  let pincodeCheckInFlight = false;
  let checkedServiceabilityPincode = '';
  let checkedServiceabilityArea = '';
  let checkedServiceabilityResult = null;
  let checkoutServiceabilityRequest = 0;
  let checkoutOtherAreaCheckTimer = null;
  let checkoutVerifiedState = '';
  let checkoutVerifiedStatePincode = '';
  let checkoutAreaLookupRequest = 0;
  const CHECKOUT_OTHER_AREA_VALUE = '__atulyash_other_area__';
  let accountHandoffActive = false;
  let checkoutReturnUrl = '';
  let cartReturnUrl = '';
  let lastCartFailureMessage = '';
  let storefrontServiceability = null;
  let serviceabilityCheckInFlight = false;
  let serviceabilityLocationInFlight = false;
  let pendingServiceabilityAction = null;
  let pendingServiceabilityLabel = 'Continue to Atulyash';
  const cartItemUpdateLocks = new Set();
  let otpResendAvailableAt = 0;
  let otpResendTimer;
  let activeLayer = null;
  let previousFocus = null;
  let toastTimer;
  let backdropTimer;
  let variantAnimationTimer;
  let variantAnimationGeneration = 0;

  if (
    !pendingOrder
    || typeof pendingOrder !== 'object'
    || (!pendingOrder.orderPayload && pendingOrder.stage !== 'placing')
  ) {
    pendingOrder = null;
  }

  function loadSessionRecord(key, fallback) {
    try {
      const value = window.sessionStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function saveSessionRecord(key, value) {
    try {
      if (value == null || (typeof value === 'object' && !Object.keys(value).length)) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      // Checkout still works in memory when session storage is unavailable.
    }
  }

  function checkoutReturnPath(origin = 'home') {
    return origin === 'account' ? 'account.html#shop' : 'index.html#shop';
  }

  function checkoutReturnForOrigin(origin = 'home') {
    return new URL(checkoutReturnPath(origin), window.location.href).href;
  }

  function rememberCheckoutContext(origin = 'home') {
    const normalizedOrigin = origin === 'account' ? 'account' : 'home';
    const context = {
      version: 1,
      origin: normalizedOrigin,
      createdAt: Date.now()
    };
    saveSessionRecord(CHECKOUT_CONTEXT_KEY, context);
    return context;
  }

  function readCheckoutContext() {
    const stored = loadSessionRecord(CHECKOUT_CONTEXT_KEY, null);
    const createdAt = Number(stored?.createdAt);
    if (
      stored?.version === 1
      && ['home', 'account'].includes(stored?.origin)
      && Number.isFinite(createdAt)
      && Math.abs(Date.now() - createdAt) <= CHECKOUT_CONTEXT_TTL
    ) {
      return stored;
    }
    saveSessionRecord(CHECKOUT_CONTEXT_KEY, null);
    let inferredOrigin = 'home';
    try {
      const referrer = document.referrer ? new URL(document.referrer) : null;
      if (referrer?.origin === window.location.origin && referrer.pathname.endsWith('/account.html')) {
        inferredOrigin = 'account';
      }
    } catch (error) {
      inferredOrigin = 'home';
    }
    return rememberCheckoutContext(inferredOrigin);
  }

  function clearCheckoutContext() {
    saveSessionRecord(CHECKOUT_CONTEXT_KEY, null);
  }

  function checkoutOriginFromReturnUrl(value) {
    if (!value) return 'home';
    try {
      const url = new URL(String(value), window.location.href);
      return url.origin === window.location.origin && url.pathname.endsWith('/account.html')
        ? 'account'
        : 'home';
    } catch (error) {
      return 'home';
    }
  }

  function updateCheckoutContextUI(origin = 'home') {
    const accountOrigin = origin === 'account';
    const label = accountOrigin ? 'Back to My Atulyash' : 'Back to shop';
    if (elements.checkoutReturnLabel) elements.checkoutReturnLabel.textContent = label;
    if (elements.checkoutCloseButton) {
      elements.checkoutCloseButton.setAttribute('aria-label', label);
    }
    if (elements.checkoutHandoffReturn) {
      elements.checkoutHandoffReturn.href = checkoutReturnPath(origin);
      elements.checkoutHandoffReturn.textContent = accountOrigin ? 'Return to My Atulyash' : 'Return to bag';
    }
    if (elements.checkoutPurchaseClarityChange) {
      elements.checkoutPurchaseClarityChange.href = checkoutReturnPath(origin);
    }
    if (elements.successCloseButton) {
      elements.successCloseButton.textContent = accountOrigin ? 'Return to My Atulyash' : 'Return to Atulyash';
    }
  }

  function navigateToCheckout(origin = 'home') {
    rememberCheckoutContext(origin);
    window.location.assign('checkout.html');
    return true;
  }

  function getApiSession() {
    return API?.auth?.getSession?.()
      || API?.session?.get?.()
      || API?.getSession?.()
      || null;
  }

  function isApiAuthenticated() {
    return Boolean(
      API
      && (API.auth?.isAuthenticated?.() ?? API.session?.isAuthenticated?.() ?? getApiSession()?.access)
    );
  }

  function apiResults(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  function numericValue(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function firstValue(...values) {
    return values.find((value) => value !== undefined && value !== null && value !== '');
  }

  function extractWeight(value) {
    const match = String(value || '').match(/(\d+(?:\.\d+)?)\s*kg/i);
    return match ? numericValue(match[1]) : 0;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setAsyncButton(button, busy, busyLabel, idleLabel) {
    if (!button) return;
    button.disabled = busy;
    button.setAttribute('aria-busy', String(busy));
    const label = button.querySelector('span:first-child');
    if (label && (busyLabel || idleLabel)) label.textContent = busy ? busyLabel : idleLabel;
  }

  async function invokeApi(group, method, args = [], fallback = null) {
    const handler = API?.[group]?.[method];
    if (typeof handler === 'function') return handler(...args);
    if (fallback && typeof API?.request === 'function') {
      return API.request(fallback.path, fallback.options || {});
    }
    throw new Error('The Atulyash service is not available in this build.');
  }

  function loadStorefrontServiceability() {
    const record = loadSessionRecord(SERVICEABILITY_STORAGE_KEY, null);
    const pincode = String(record?.pincode || '').replace(/\D/g, '').slice(0, 6);
    const checkedAt = Number(record?.checkedAt);
    if (
      !record
      || !/^\d{6}$/.test(pincode)
      || !Number.isFinite(checkedAt)
      || Date.now() - checkedAt > SERVICEABILITY_MAX_AGE
    ) {
      saveSessionRecord(SERVICEABILITY_STORAGE_KEY, null);
      return null;
    }
    return { ...record, pincode, serviceable: record.serviceable === true };
  }

  function saveStorefrontServiceability(record) {
    storefrontServiceability = record;
    saveSessionRecord(SERVICEABILITY_STORAGE_KEY, record);
    updateHeaderServiceability(record);
  }

  function updateHeaderServiceability(record = storefrontServiceability) {
    if (!elements.headerLocationButton || !elements.headerLocationLabel) return;
    if (record?.serviceable === true && record?.pincode) {
      elements.headerLocationLabel.textContent = `Deliver to ${record.pincode}`;
      elements.headerLocationButton.setAttribute('aria-label', `Delivery is available at PIN ${record.pincode}. Change delivery PIN code.`);
      return;
    }
    elements.headerLocationLabel.textContent = record?.pincode ? 'Change delivery PIN' : 'Check delivery';
    elements.headerLocationButton.setAttribute('aria-label', record?.pincode
      ? `PIN ${record.pincode} is not serviceable. Check another delivery PIN code.`
      : 'Check delivery availability for your PIN code');
  }

  function verifiedStorefrontServiceability() {
    if (!STOREFRONT_SERVICEABILITY_ENABLED) return { serviceable: true, pincode: '' };
    if (!storefrontServiceability) storefrontServiceability = loadStorefrontServiceability();
    return storefrontServiceability?.serviceable === true
      ? storefrontServiceability
      : null;
  }

  function renderStorefrontServiceability(state = 'idle', {
    title = 'Live delivery check',
    message = 'Enter a six-digit PIN code or use your current location.'
  } = {}) {
    if (!elements.serviceabilityStatus) return;
    elements.serviceabilityStatus.dataset.state = state;
    if (elements.serviceabilityStatusTitle) elements.serviceabilityStatusTitle.textContent = title;
    if (elements.serviceabilityStatusCopy) elements.serviceabilityStatusCopy.textContent = message;
    if (elements.serviceabilityStatusMark) {
      elements.serviceabilityStatusMark.textContent = state === 'success' ? '✓' : state === 'error' ? '!' : 'i';
    }
    if (elements.serviceabilityContinueButton) {
      elements.serviceabilityContinueButton.hidden = state !== 'success';
      elements.serviceabilityContinueButton.firstChild.textContent = `${pendingServiceabilityLabel} `;
    }
  }

  function setStorefrontServiceabilityBusy() {
    const busy = serviceabilityCheckInFlight || serviceabilityLocationInFlight;
    if (elements.serviceabilityCheckButton) {
      elements.serviceabilityCheckButton.disabled = busy;
      elements.serviceabilityCheckButton.textContent = serviceabilityCheckInFlight ? 'Checking…' : 'Check availability';
      elements.serviceabilityCheckButton.setAttribute('aria-busy', String(serviceabilityCheckInFlight));
    }
    if (elements.serviceabilityLocationButton) {
      elements.serviceabilityLocationButton.disabled = busy;
      elements.serviceabilityLocationButton.setAttribute('aria-busy', String(serviceabilityLocationInFlight));
    }
    if (elements.serviceabilityLocationLabel) {
      elements.serviceabilityLocationLabel.textContent = serviceabilityLocationInFlight
        ? 'Finding your PIN code…'
        : 'Use my current location';
    }
  }

  function serviceableLocationCopy(record) {
    const location = [record?.city, record?.state]
      .map((value) => String(value || '').trim())
      .filter((value, index, values) => value && values.indexOf(value) === index)
      .join(', ');
    return `${location || 'Your area'} is serviceable for fresh Atulyash delivery at PIN ${record.pincode}.`;
  }

  function openStorefrontServiceability({ action = null, label = 'Continue to Atulyash', force = false } = {}) {
    if (!STOREFRONT_SERVICEABILITY_ENABLED) {
      if (typeof action === 'function') action();
      return true;
    }
    if (!elements.serviceabilityDialog) {
      if (typeof action === 'function') action();
      return false;
    }
    const verified = verifiedStorefrontServiceability();
    if (verified && typeof action === 'function' && !force) {
      action();
      return true;
    }

    pendingServiceabilityAction = typeof action === 'function' ? action : null;
    pendingServiceabilityLabel = label;
    const record = storefrontServiceability || loadStorefrontServiceability();
    if (record?.pincode && elements.serviceabilityPincode) {
      elements.serviceabilityPincode.value = record.pincode;
    }
    if (record?.serviceable === true) {
      renderStorefrontServiceability('success', {
        title: 'Fresh delivery is available',
        message: serviceableLocationCopy(record)
      });
    } else if (record?.pincode) {
      renderStorefrontServiceability('error', {
        title: 'We do not deliver here yet',
        message: `PIN ${record.pincode} is outside the current Atulyash delivery area. Try another PIN or browse the website for now.`
      });
    } else {
      renderStorefrontServiceability();
    }

    if (!elements.serviceabilityDialog.open) {
      document.body.classList.add('serviceability-open');
      elements.serviceabilityDialog.showModal();
    }
    window.setTimeout(() => {
      const focusTarget = record?.serviceable
        ? elements.serviceabilityContinueButton
        : elements.serviceabilityLocationButton;
      focusTarget?.focus({ preventScroll: true });
    }, 40);
    return false;
  }

  function closeStorefrontServiceability({ continueAction = false } = {}) {
    const action = continueAction && verifiedStorefrontServiceability()
      ? pendingServiceabilityAction
      : null;
    pendingServiceabilityAction = null;
    pendingServiceabilityLabel = 'Continue to Atulyash';
    if (elements.serviceabilityDialog?.open) elements.serviceabilityDialog.close();
    document.body.classList.remove('serviceability-open');
    if (typeof action === 'function') window.setTimeout(action, 0);
  }

  function requireStorefrontServiceability(action, label) {
    if (!IS_STOREFRONT_PAGE) {
      if (typeof action === 'function') action();
      return true;
    }
    return openStorefrontServiceability({ action, label });
  }

  async function checkStorefrontServiceability(pincodeValue) {
    const pincode = String(pincodeValue || '').replace(/\D/g, '').slice(0, 6);
    if (elements.serviceabilityPincode) elements.serviceabilityPincode.value = pincode;
    if (!/^\d{6}$/.test(pincode)) {
      elements.serviceabilityPincode?.setAttribute('aria-invalid', 'true');
      renderStorefrontServiceability('error', {
        title: 'Enter all six digits',
        message: 'A valid Indian delivery PIN code contains six numbers.'
      });
      elements.serviceabilityPincode?.focus({ preventScroll: true });
      return false;
    }

    elements.serviceabilityPincode?.removeAttribute('aria-invalid');
    serviceabilityCheckInFlight = true;
    setStorefrontServiceabilityBusy();
    renderStorefrontServiceability('checking', {
      title: 'Checking delivery coverage',
      message: `Confirming live Atulyash service for PIN ${pincode}…`
    });

    try {
      const payload = await invokeApi('pincodes', 'serviceability', [pincode], {
        path: '/pincodes/pincode/serviceability/',
        options: { method: 'GET', auth: false, cache: 'no-store', query: { pincode } }
      });
      const result = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
      const responsePincode = String(result?.pincode || pincode).replace(/\D/g, '').slice(0, 6);
      if (responsePincode !== pincode) {
        throw new Error('The delivery service returned a different PIN code. Please try again.');
      }
      const record = {
        pincode,
        serviceable: result?.serviceable === true,
        city: String(result?.city || '').trim(),
        state: String(result?.state || '').trim(),
        availableAreas: Array.isArray(result?.available_areas) ? result.available_areas : [],
        checkedAt: Date.now()
      };
      saveStorefrontServiceability(record);
      if (record.serviceable) {
        renderStorefrontServiceability('success', {
          title: 'Fresh delivery is available',
          message: serviceableLocationCopy(record)
        });
        elements.serviceabilityContinueButton?.focus({ preventScroll: true });
        return true;
      }
      elements.serviceabilityPincode?.setAttribute('aria-invalid', 'true');
      renderStorefrontServiceability('error', {
        title: 'We do not deliver here yet',
        message: `PIN ${pincode} is outside the current Atulyash delivery area. Ordering is unavailable, but you can try another PIN.`
      });
      return false;
    } catch (error) {
      renderStorefrontServiceability('error', {
        title: 'Coverage could not be checked',
        message: error?.message || 'The live delivery service is unavailable. Please try again.'
      });
      return null;
    } finally {
      serviceabilityCheckInFlight = false;
      setStorefrontServiceabilityBusy();
    }
  }

  async function useCurrentLocationForServiceability() {
    if (!navigator.geolocation) {
      renderStorefrontServiceability('error', {
        title: 'Location is unavailable',
        message: 'This browser cannot share its location. Enter your six-digit PIN code instead.'
      });
      elements.serviceabilityPincode?.focus({ preventScroll: true });
      return;
    }

    serviceabilityLocationInFlight = true;
    setStorefrontServiceabilityBusy();
    renderStorefrontServiceability('checking', {
      title: 'Finding your location',
      message: 'Allow location access when your browser asks. We will use it only to find your PIN code.'
    });
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 300000
        });
      });
      const lookup = window.AtulyashGoogleAreaLookup;
      if (!lookup?.reverseGeocodeCoordinates) {
        throw new Error('Location lookup is not configured. Enter your PIN code instead.');
      }
      const result = await lookup.reverseGeocodeCoordinates(
        position.coords.latitude,
        position.coords.longitude
      );
      const pincode = String(result?.pincode || '').replace(/\D/g, '').slice(0, 6);
      if (!/^\d{6}$/.test(pincode)) {
        throw new Error('We found your location but could not identify its PIN code. Enter it manually below.');
      }
      if (elements.serviceabilityPincode) elements.serviceabilityPincode.value = pincode;
      await checkStorefrontServiceability(pincode);
    } catch (error) {
      const permissionDenied = Number(error?.code) === 1;
      renderStorefrontServiceability('error', {
        title: permissionDenied ? 'Location permission was not granted' : 'Location could not be identified',
        message: permissionDenied
          ? 'Allow location access in your browser, or enter your six-digit PIN code below.'
          : (error?.message || 'Enter your six-digit PIN code to check delivery availability.')
      });
      elements.serviceabilityPincode?.focus({ preventScroll: true });
    } finally {
      serviceabilityLocationInFlight = false;
      setStorefrontServiceabilityBusy();
    }
  }

  function initializeStorefrontServiceability() {
    if (!IS_STOREFRONT_PAGE || !elements.serviceabilityDialog) return;
    storefrontServiceability = loadStorefrontServiceability();
    updateHeaderServiceability(storefrontServiceability);
    if (!STOREFRONT_SERVICEABILITY_ENABLED) return;
    const hasAccountHandoff = new URLSearchParams(window.location.search).get('checkout') === 'account'
      || loadSessionRecord(STOREFRONT_INTENT_KEY, null)?.origin === 'account';
    if (hasAccountHandoff) return;
    window.setTimeout(() => openStorefrontServiceability({ force: true }), 260);
  }

  function updateAccountHeader() {
    if (!elements.headerAccountLabel || !elements.headerAccountLink) return;
    elements.headerAccountLabel.textContent = 'My Atulyash';
    elements.headerAccountLink.setAttribute('aria-label', 'Open My Atulyash — orders, weekly plans and account');
  }

  function setCartApiStatus(message = '', {
    state = 'idle',
    retry = false,
    hidden = false
  } = {}) {
    if (!elements.cartApiStatus) return;
    elements.cartApiStatus.hidden = hidden;
    elements.cartApiStatus.dataset.state = state;
    if (elements.cartApiStatusLabel) elements.cartApiStatusLabel.textContent = message;
    if (elements.cartApiRetryButton) elements.cartApiRetryButton.hidden = !retry;
  }

  function clearCartLoginGate() {
    cartNeedsAuthentication = false;
    if (elements.cartAuthGate) elements.cartAuthGate.hidden = true;
    if (elements.cartItems) elements.cartItems.hidden = false;
  }

  function showCartLoginGate({ returnToCheckout = Boolean(checkoutReturnUrl) } = {}) {
    if (IS_CHECKOUT_PAGE) {
      cartNeedsAuthentication = true;
      apiSession = getApiSession();
      serverCartActive = false;
      serverCartId = null;
      serverCartSummary = null;
      if (!cart.length) cart = loadCart();
      setCartApiStatus('', { hidden: true });
      renderCart();
      clearCheckoutErrors();
      if (elements.checkoutSuccess) elements.checkoutSuccess.hidden = true;
      if (elements.checkoutForm) elements.checkoutForm.hidden = false;
      resetOtpState({
        message: 'Your secure session ended. Verify your mobile again to continue with the same bag.',
        preserveSession: true
      });
      activeLayer = 'checkout';
      if (elements.checkoutModal) {
        elements.checkoutModal.inert = false;
        elements.checkoutModal.classList.add('is-open');
        elements.checkoutModal.setAttribute('aria-hidden', 'false');
      }
      setCheckoutStep(1, { focus: true });
      closeCheckoutHandoff('Sign in securely to continue.');
      announce('Your session ended. Verify your mobile again to continue checkout.');
      return;
    }

    const interruptedCheckoutReturnUrl = checkoutReturnUrl;
    if (interruptedCheckoutReturnUrl) {
      cartReturnUrl = interruptedCheckoutReturnUrl;
      checkoutReturnUrl = '';
    }
    if (elements.cartAuthLoginLink) {
      elements.cartAuthLoginLink.href = returnToCheckout
        ? 'account.html?return=checkout#login'
        : 'account.html?return=cart#login';
    }
    cartNeedsAuthentication = true;
    apiSession = getApiSession();
    serverCartActive = false;
    serverCartId = null;
    serverCartSummary = null;
    cart = loadCart();
    setCartApiStatus('', { hidden: true });
    renderCart();

    if (activeLayer === 'checkout') {
      elements.checkoutModal?.classList.remove('is-open');
      elements.checkoutModal?.setAttribute('aria-hidden', 'true');
      if (elements.checkoutModal) elements.checkoutModal.inert = true;
      clearOtpResendTimer();
      activeLayer = null;
      elements.headerCartButton?.focus({ preventScroll: true });
    }

    openCart();
    window.setTimeout(() => elements.cartAuthLoginLink?.focus(), 60);
  }

  function setPurchaseButtonsBusy(busy) {
    purchaseButtonsBusy = busy;
    if (elements.addToCartLabel) {
      elements.addToCartLabel.textContent = busy ? 'Adding…' : 'Add to bag';
    }
    if (elements.mobileAddButton) {
      elements.mobileAddButton.textContent = busy ? 'Adding…' : 'Add to bag';
    }
    syncPurchaseAvailability();
  }

  function currentSelectionHasLiveCatalog() {
    if (selectedPurchaseType === 'weekly') {
      return catalogReadiness.subscriptions && getWeeklyPlan()?.apiId != null;
    }
    return catalogReadiness.products && getVariant()?.apiId != null;
  }

  function syncPurchaseAvailability() {
    const orderable = currentSelectionHasLiveCatalog() && !pendingOrder;
    [elements.addToCartButton, elements.buyNowButton, elements.mobileAddButton].forEach((button) => {
      if (!button) return;
      button.disabled = purchaseButtonsBusy || !orderable;
      button.setAttribute('aria-busy', String(purchaseButtonsBusy));
      if (!orderable) {
        button.title = pendingOrder
          ? 'Complete the pending order payment before changing your bag.'
          : 'Live availability is required before this selection can be ordered.';
      } else {
        button.removeAttribute('title');
      }
    });
  }

  function renderCatalogPackOptions() {
    const host = elements.packSizeSelect;
    if (!host) return;
    const variants = Object.values(PRODUCT.variants)
      .filter((variant) => variant.available !== false)
      .sort((a, b) => a.weight - b.weight);
    if (!variants.length) return;

    const fragment = document.createDocumentFragment();
    variants.forEach((variant) => {
      const option = document.createElement('option');
      option.value = String(variant.weight);
      option.textContent = `${formatWeight(variant.weight)} kg · ${formatPrice(variant.price)}`;
      option.selected = variant.weight === selectedWeight;
      fragment.append(option);
    });
    host.replaceChildren(fragment);
    host.value = String(selectedWeight);
  }

  function setWeeklyCatalogControls(available, message = 'Loading weekly plans…') {
    const weeklyRadio = document.querySelector('input[name="purchaseType"][value="weekly"]');
    const weeklyLabel = weeklyRadio?.closest('.purchase-option');
    if (weeklyRadio) weeklyRadio.disabled = !available;
    if (weeklyLabel) weeklyLabel.setAttribute('aria-disabled', String(!available));
    if (elements.weeklyPlanSelect) elements.weeklyPlanSelect.disabled = !available;
    if (elements.calculatorCta) {
      elements.calculatorCta.disabled = !available;
      elements.calculatorCta.setAttribute('aria-disabled', String(!available));
    }
    [elements.heroWeeklyButton, elements.startWeeklyButton].forEach((button) => {
      if (!button) return;
      if ('disabled' in button) button.disabled = !available;
      button.setAttribute('aria-disabled', String(!available));
      if (!available) button.title = message;
      else button.removeAttribute('title');
    });
  }

  function clearWeeklyCatalog(message = 'Loading weekly plans…') {
    WEEKLY_PLANS = [];
    WEEKLY_PLAN_BY_ID = new Map();
    weeklyCatalogMessage = message;
    selectedWeeklyPlanId = '';
    if (selectedPurchaseType === 'weekly') selectedPurchaseType = 'once';

    if (elements.weeklyPlanSelect) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = message;
      option.selected = true;
      option.disabled = true;
      elements.weeklyPlanSelect.replaceChildren(option);
    }
    if (elements.weeklyPlanSummary) elements.weeklyPlanSummary.textContent = message;
    setWeeklyCatalogControls(false, message);
    syncPurchaseAvailability();
    updateProductUI();
    updateRotiCalculator();
  }

  function renderCatalogWeeklyOptions() {
    if (!WEEKLY_PLANS.length) {
      clearWeeklyCatalog('No weekly plans are currently available.');
      return;
    }
    const selectedPlan = WEEKLY_PLAN_BY_ID.get(selectedWeeklyPlanId) || WEEKLY_PLANS[0];
    selectedWeeklyPlanId = selectedPlan.id;
    weeklyCatalogMessage = '';

    if (elements.weeklyPlanSelect) {
      const fragment = document.createDocumentFragment();
      WEEKLY_PLANS.forEach((plan) => {
        const option = document.createElement('option');
        option.value = plan.id;
        option.textContent = `${formatWeight(plan.weeklyKg)} kg every week · ${formatPrice(plan.pricePerDelivery)} per delivery · ${formatPrice(plan.minimumWalletRequired)} wallet funding for ${plan.minimumDeliveriesRequired} deliveries`;
        fragment.append(option);
      });
      elements.weeklyPlanSelect.replaceChildren(fragment);
      elements.weeklyPlanSelect.value = selectedWeeklyPlanId;
    }

    setWeeklyCatalogControls(true);
    updateRotiCalculator();
  }

  async function hydratePublicCommerce() {
    if (!API) {
      clearWeeklyCatalog('Weekly plan service is unavailable.');
      if (elements.catalogApiStatus) elements.catalogApiStatus.hidden = false;
      if (elements.catalogApiStatusLabel) {
        elements.catalogApiStatusLabel.textContent = 'Live catalogue service is unavailable. Ordering is disabled.';
      }
      if (elements.catalogRetryButton) elements.catalogRetryButton.hidden = false;
      return;
    }
    const stockLabel = document.querySelector('.product-stock');
    catalogReadiness = { products: false, subscriptions: false };
    clearWeeklyCatalog('Loading weekly plans…');
    syncPurchaseAvailability();
    if (elements.storeServiceStatus) {
      elements.storeServiceStatus.hidden = false;
      elements.storeServiceStatus.dataset.state = 'idle';
    }
    if (elements.catalogApiStatus) elements.catalogApiStatus.hidden = false;
    if (elements.storeServiceStatusLabel) elements.storeServiceStatusLabel.textContent = 'Connecting to Atulyash services…';
    if (elements.catalogApiStatusLabel) elements.catalogApiStatusLabel.textContent = 'Loading today’s packs and prices…';
    if (elements.storeServiceRetryButton) elements.storeServiceRetryButton.hidden = true;
    if (elements.catalogRetryButton) elements.catalogRetryButton.hidden = true;
    try {
      if (stockLabel) stockLabel.lastChild.textContent = ' Connecting live availability';
      const [productsResult, plansResult] = await Promise.allSettled([
        invokeApi('products', 'list', [], {
          path: '/products/products/',
          options: { method: 'GET', auth: false }
        }),
        invokeApi('subscriptions', 'listPacks', [], {
          path: '/subscription/subscription_pack/',
          options: { method: 'GET', auth: false, query: { is_active: true, page_size: 100 } }
        })
      ]);

      let product = null;
      let livePacks = [];
      if (productsResult.status === 'fulfilled') {
        const products = apiResults(productsResult.value);
        product = products.find((item) => item?.is_active !== false) || products[0] || null;
        livePacks = (product?.all_packs || product?.packs || [])
          .filter((pack) => pack?.is_active !== false && numericValue(pack?.stock_quantity, 1) > 0)
          .map((pack) => ({
            weight: extractWeight(pack?.name) || numericValue(pack?.weight || pack?.amount),
            price: numericValue(pack?.price),
            apiId: pack?.id,
            stock: numericValue(pack?.stock_quantity),
            available: true
          }))
          .filter((pack) => pack.weight > 0 && pack.price >= 0 && pack.apiId != null);
        catalogReadiness.products = Boolean(product && livePacks.length);
      }

      if (product && livePacks.length) {
        const preservedVariants = Object.fromEntries(
          Object.values(PRODUCT.variants).map((variant) => [
            variant.weight,
            { ...variant, available: false }
          ])
        );
        livePacks.forEach((pack) => { preservedVariants[pack.weight] = pack; });
        PRODUCT = {
          ...PRODUCT,
          name: product.name || PRODUCT.name,
          unitPrice: numericValue(product.price_per_kg, livePacks[0].price / livePacks[0].weight),
          productId: product.id,
          variants: preservedVariants
        };
        const liveWeights = livePacks.map((pack) => pack.weight).sort((a, b) => a - b);
        if (!liveWeights.includes(selectedWeight)) selectedWeight = liveWeights[0];
        renderCatalogPackOptions();
      }

      let livePlans = [];
      if (plansResult.status === 'fulfilled') {
        livePlans = apiResults(plansResult.value)
          .filter((plan) => plan?.is_active !== false)
          .map((plan) => {
            const weeklyKg = Number(plan?.weekly_quantity);
            const pricePerDelivery = Number(plan?.price_per_delivery);
            const minimumDeliveriesRequired = Number(plan?.minimum_deliveries_required);
            const minimumWalletRequired = Number(plan?.minimum_wallet_required);
            const fourDeliveryWalletFunding = Number(plan?.four_delivery_wallet_funding);
            const billingFrequency = String(plan?.billing_frequency || '').toLowerCase();
            if (
              plan?.id == null
              || !Number.isFinite(weeklyKg)
              || weeklyKg < 2
              || weeklyKg > 10
              || !Number.isFinite(pricePerDelivery)
              || pricePerDelivery < 0
              || !Number.isInteger(minimumDeliveriesRequired)
              || minimumDeliveriesRequired <= 0
              || !Number.isFinite(minimumWalletRequired)
              || minimumWalletRequired < 0
              || !Number.isFinite(fourDeliveryWalletFunding)
              || fourDeliveryWalletFunding < 0
              || billingFrequency !== 'weekly'
            ) {
              return null;
            }
            return {
              id: `subscription-${plan.id}`,
              apiId: plan.id,
              name: plan.name || `${formatWeight(weeklyKg)} Kg/week`,
              weeklyKg,
              pricePerDelivery,
              billingFrequency,
              minimumDeliveriesRequired,
              minimumWalletRequired,
              fourDeliveryWalletFunding
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.weeklyKg - b.weeklyKg);
        catalogReadiness.subscriptions = livePlans.length > 0;
      }

      if (livePlans.length) {
        const previousWeekly = getWeeklyPlan()?.weeklyKg || livePlans[0].weeklyKg;
        WEEKLY_PLANS = livePlans;
        WEEKLY_PLAN_BY_ID = new Map(livePlans.map((plan) => [plan.id, plan]));
        selectedWeeklyPlanId = livePlans.reduce((closest, plan) => (
          Math.abs(plan.weeklyKg - previousWeekly) < Math.abs(closest.weeklyKg - previousWeekly) ? plan : closest
        ), livePlans[0]).id;
        renderCatalogWeeklyOptions();
      } else {
        clearWeeklyCatalog(
          plansResult.status === 'rejected'
            ? 'Weekly plans could not be loaded.'
            : 'No weekly plans are currently available.'
        );
      }

      migrateCartToLiveCatalog();
      updateProductUI();
      updateRotiCalculator();
      renderCart();

      const fullyConnected = catalogReadiness.products && catalogReadiness.subscriptions;
      if (stockLabel) {
        stockLabel.lastChild.textContent = fullyConnected
          ? ' Live fresh-batch availability'
          : ' Live ordering partly unavailable';
      }
      if (elements.storeServiceStatus) {
        elements.storeServiceStatus.dataset.state = fullyConnected ? 'success' : 'error';
      }
      if (elements.storeServiceStatusLabel) {
        elements.storeServiceStatusLabel.textContent = fullyConnected
          ? 'Live Atulyash catalogue connected'
          : 'Some live catalogue services could not be reached. Unverified selections are disabled.';
      }
      if (elements.catalogApiStatusLabel) {
        elements.catalogApiStatusLabel.textContent = fullyConnected
          ? 'Live packs and subscription plans are up to date.'
          : [
              catalogReadiness.products ? 'Packs connected.' : 'Pack ordering unavailable.',
              catalogReadiness.subscriptions ? 'Weekly plans connected.' : 'Weekly-plan ordering unavailable.'
            ].join(' ');
      }
      if (elements.storeServiceRetryButton) elements.storeServiceRetryButton.hidden = fullyConnected;
      if (elements.catalogRetryButton) elements.catalogRetryButton.hidden = fullyConnected;
      if (fullyConnected) {
        window.setTimeout(() => {
          if (elements.storeServiceStatus?.dataset.state === 'success') elements.storeServiceStatus.hidden = true;
          if (elements.catalogApiStatus && !elements.catalogRetryButton?.hidden) return;
          if (elements.catalogApiStatus) elements.catalogApiStatus.hidden = true;
        }, 2200);
      }
    } catch (error) {
      catalogReadiness = { products: false, subscriptions: false };
      clearWeeklyCatalog('Weekly plans could not be loaded.');
      syncPurchaseAvailability();
      if (stockLabel) stockLabel.lastChild.textContent = ' Ordering temporarily unavailable';
      if (elements.storeServiceStatus) elements.storeServiceStatus.dataset.state = 'error';
      if (elements.storeServiceStatusLabel) elements.storeServiceStatusLabel.textContent = 'Live availability could not be reached. Ordering is temporarily disabled.';
      if (elements.catalogApiStatusLabel) elements.catalogApiStatusLabel.textContent = 'Published pack information remains visible, but checkout needs the live catalogue.';
      if (elements.storeServiceRetryButton) elements.storeServiceRetryButton.hidden = false;
      if (elements.catalogRetryButton) elements.catalogRetryButton.hidden = false;
      console.warn('Atulyash live catalog unavailable; ordering is disabled until it reconnects.', error);
    }
  }

  function normalizeCart(rawCart) {
    if (!Array.isArray(rawCart)) return [];

    const mergedItems = new Map();
    rawCart.forEach((item) => {
      const quantity = Number(item?.quantity);
      const purchaseType = item?.purchaseType === 'weekly' ? 'weekly' : 'once';
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return;

      if (purchaseType === 'once') {
        const weight = Number(item?.weightKg ?? item?.weight);
        const variant = PRODUCT.variants[weight];
        if (!Number.isFinite(weight) || weight <= 0) return;
        const id = `once-${weight}`;
        const existing = mergedItems.get(id);
        mergedItems.set(id, {
          id,
          weight,
          weightKg: weight,
          apiPackId: item?.apiPackId,
          purchaseType,
          pricePerDelivery: variant?.price ?? numericValue(item?.pricePerDelivery, weight * PRODUCT.unitPrice),
          unavailable: !variant,
          quantity: Math.min(20, (existing?.quantity || 0) + quantity)
        });
        return;
      }

      const suppliedWeight = Number(item?.weeklyKg ?? item?.weightKg ?? item?.weight);
      const matchedPlan = WEEKLY_PLAN_BY_ID.get(item?.planId)
        || WEEKLY_PLANS.find((plan) => plan.weeklyKg === suppliedWeight);
      const validStoredWeight = Number.isFinite(suppliedWeight) && suppliedWeight >= 2 && suppliedWeight <= 10;
      if (!matchedPlan && !validStoredWeight) return;
      const weeklyKg = matchedPlan?.weeklyKg ?? suppliedWeight;
      if (!Number.isFinite(weeklyKg) || weeklyKg < 2 || weeklyKg > 10) return;
      const planId = matchedPlan?.id || item?.planId || `legacy-${String(weeklyKg).replace('.', '-')}`;
      const deliveryDay = DELIVERY_DAYS.includes(item?.deliveryDay) ? item.deliveryDay : '';
      const id = `weekly-${planId}`;
      const existing = mergedItems.get(id);
      mergedItems.set(id, {
        id,
        purchaseType,
        planId,
        apiPlanId: item?.apiPlanId,
        weight: weeklyKg,
        weightKg: weeklyKg,
        weeklyKg,
        pricePerDelivery: matchedPlan?.pricePerDelivery ?? numericValue(item?.pricePerDelivery),
        minimumDeliveriesRequired: matchedPlan?.minimumDeliveriesRequired
          ?? numericValue(item?.minimumDeliveriesRequired, 4),
        minimumWalletRequired: matchedPlan?.minimumWalletRequired
          ?? numericValue(item?.minimumWalletRequired),
        fourDeliveryWalletFunding: matchedPlan?.fourDeliveryWalletFunding
          ?? numericValue(item?.fourDeliveryWalletFunding),
        billingFrequency: matchedPlan?.billingFrequency ?? item?.billingFrequency ?? 'weekly',
        deliveryDay,
        unavailable: !matchedPlan,
        quantity: Math.min(20, (existing?.quantity || 0) + quantity)
      });
    });
    return [...mergedItems.values()];
  }

  function migrateCartItems(items) {
    return items.map((item) => {
      if (item.purchaseType === 'weekly') {
        const plan = findPlanByApiId(item.apiPlanId)
          || WEEKLY_PLAN_BY_ID.get(item.planId)
          || WEEKLY_PLANS.find((candidate) => (
            Number(candidate.weeklyKg) === Number(item.weeklyKg ?? item.weightKg ?? item.weight)
          ));
        if (!catalogReadiness.subscriptions || !plan?.apiId) {
          return { ...item, unavailable: true };
        }
        return {
          ...item,
          id: item.serverItemId != null ? item.id : `weekly-${plan.id}`,
          planId: plan.id,
          apiPlanId: plan.apiId,
          weight: plan.weeklyKg,
          weightKg: plan.weeklyKg,
          weeklyKg: plan.weeklyKg,
          pricePerDelivery: plan.pricePerDelivery,
          minimumDeliveriesRequired: plan.minimumDeliveriesRequired,
          minimumWalletRequired: plan.minimumWalletRequired,
          fourDeliveryWalletFunding: plan.fourDeliveryWalletFunding,
          billingFrequency: plan.billingFrequency,
          unavailable: false
        };
      }

      const variant = findVariantByApiId(item.apiPackId)
        || PRODUCT.variants[Number(item.weightKg ?? item.weight)];
      if (
        !catalogReadiness.products
        || !variant?.apiId
        || variant.available === false
      ) {
        return { ...item, unavailable: true };
      }
      return {
        ...item,
        id: item.serverItemId != null ? item.id : `once-${variant.weight}`,
        apiPackId: variant.apiId,
        weight: variant.weight,
        weightKg: variant.weight,
        pricePerDelivery: variant.price,
        unavailable: false
      };
    });
  }

  function migrateCartToLiveCatalog() {
    cart = migrateCartItems(cart);
    if (pendingGuestCart.length) pendingGuestCart = migrateCartItems(pendingGuestCart);
    saveCart();
    persistGuestSyncState();
  }

  function cartLineKey(item) {
    if (item.purchaseType === 'weekly') {
      const plan = findPlanByApiId(item.apiPlanId)
        || WEEKLY_PLAN_BY_ID.get(item.planId)
        || WEEKLY_PLANS.find((candidate) => (
          Number(candidate.weeklyKg) === Number(item.weeklyKg ?? item.weightKg ?? item.weight)
        ));
      return `weekly:${plan?.apiId ?? item.apiPlanId ?? item.weeklyKg ?? item.weightKg}`;
    }
    const variant = findVariantByApiId(item.apiPackId)
      || PRODUCT.variants[Number(item.weightKg ?? item.weight)];
    return `once:${variant?.apiId ?? item.apiPackId ?? item.weightKg ?? item.weight}`;
  }

  function persistGuestSyncState() {
    try {
      if (pendingGuestCart.length) {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(pendingGuestCart));
      } else if (serverCartActive) {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      // The in-memory queue remains available if storage is unavailable.
    }
    if (!pendingGuestCart.length && !Object.keys(guestSyncTargets).length) {
      guestSyncCustomerId = null;
    }
    guestSyncRecord = {
      customerId: guestSyncCustomerId,
      targets: guestSyncTargets
    };
    saveSessionRecord(
      CART_SYNC_STORAGE_KEY,
      guestSyncCustomerId || Object.keys(guestSyncTargets).length ? guestSyncRecord : null
    );
  }

  function serverQuantityForKey(key) {
    return cart
      .filter((item) => cartLineKey(item) === key)
      .reduce((total, item) => total + numericValue(item.quantity, 0), 0);
  }

  function cartHasConfigurationIssues() {
    return cart.some((item) => {
      if (item.unavailable) return true;
      if (item.purchaseType === 'weekly') {
        const plan = findPlanByApiId(item.apiPlanId) || WEEKLY_PLAN_BY_ID.get(item.planId);
        return !catalogReadiness.subscriptions || !plan?.apiId;
      }
      const variant = findVariantByApiId(item.apiPackId)
        || PRODUCT.variants[Number(item.weightKg ?? item.weight)];
      return !catalogReadiness.products || !variant?.apiId || variant.available === false;
    });
  }

  function loadCart() {
    try {
      return normalizeCart(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]'));
    } catch (error) {
      return [];
    }
  }

  function storedGuestCartExists() {
    try {
      const value = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
      return Array.isArray(value) && value.length > 0;
    } catch (error) {
      return false;
    }
  }

  function saveCart() {
    if (serverCartActive) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      // The cart remains functional in memory when storage is unavailable.
    }
  }

  function sessionIdentifier(name) {
    const session = getApiSession() || apiSession || {};
    let accountMeta = {};
    try {
      accountMeta = JSON.parse(sessionStorage.getItem('atulyash-account-meta-v1') || '{}');
    } catch (error) {
      accountMeta = {};
    }
    const aliases = {
      customerId: ['customerId', 'customer_id', 'customer'],
      userId: ['userId', 'user_id', 'user'],
      cartId: ['cartId', 'cart_id', 'cart']
    };
    for (const key of aliases[name] || [name]) {
      const value = session?.[key];
      if (value && typeof value === 'object' && value.id != null) return value.id;
      if (value != null && value !== '') return value;
    }
    const sessionMobile = String(
      session?.mobile
      || session?.phone
      || session?.user?.mobile
      || session?.user?.phone_number
      || ''
    ).replace(/\D/g, '').slice(-10);
    const metaMobile = String(accountMeta?.mobile || '').replace(/\D/g, '').slice(-10);
    if (sessionMobile && metaMobile && sessionMobile !== metaMobile) return null;
    const metaValue = accountMeta?.[name];
    if (metaValue && typeof metaValue === 'object' && metaValue.id != null) return metaValue.id;
    if (metaValue != null && metaValue !== '') return metaValue;
    return null;
  }

  function sessionHasVerifiedIdentity(session = getApiSession()) {
    if (!session || typeof session !== 'object') return false;
    const aliases = {
      userId: ['userId', 'user_id', 'user'],
      customerId: ['customerId', 'customer_id', 'customer'],
      cartId: ['cartId', 'cart_id', 'cart']
    };
    return Object.values(aliases).every((keys) => keys.some((key) => {
      const value = session[key];
      if (value && typeof value === 'object') return value.id != null || value.pk != null || value.uuid != null;
      return value != null && value !== '';
    }));
  }

  function cartResponseSources(payload) {
    return [
      payload,
      payload?.data,
      payload?.cart,
      payload?.data?.cart,
      payload?.summary,
      payload?.totals,
      payload?.data?.summary,
      payload?.data?.totals
    ].filter((source) => source && typeof source === 'object');
  }

  function firstMoney(sources, keys) {
    for (const source of sources) {
      for (const key of keys) {
        if (source?.[key] == null || source?.[key] === '') continue;
        const value = numericValue(source[key], NaN);
        if (Number.isFinite(value)) return value;
      }
    }
    return NaN;
  }

  function normalizeCoupon(rawCoupon) {
    if (rawCoupon == null || rawCoupon === '') return null;
    if (typeof rawCoupon !== 'object') {
      const value = String(rawCoupon);
      return { id: value, code: value, name: value, reason: '' };
    }
    const description = rawCoupon.description;
    const descriptionText = typeof description === 'object'
      ? description?.description || description?.text || description?.message
      : description;
    const id = rawCoupon.coupon_id ?? rawCoupon.couponId ?? rawCoupon.id ?? rawCoupon.pk;
    const code = rawCoupon.code ?? rawCoupon.coupon_code ?? rawCoupon.couponCode ?? rawCoupon.name;
    if (id == null && !code) return null;
    return {
      id: id ?? code,
      code: String(code || `Offer ${id}`),
      name: String(rawCoupon.coupon_name || rawCoupon.title || rawCoupon.name || code || 'Atulyash offer'),
      description: String(descriptionText || ''),
      reason: String(rawCoupon.reason || rawCoupon.ineligible_reason || rawCoupon.message || ''),
      discountType: String(rawCoupon.discount_type || rawCoupon.type || '').toLowerCase(),
      discountValue: numericValue(rawCoupon.discount_value ?? rawCoupon.value ?? rawCoupon.discount, NaN),
      minimumOrder: numericValue(rawCoupon.minimum_order_value ?? rawCoupon.min_order_value ?? rawCoupon.minimum_amount, NaN),
      maximumDiscount: numericValue(rawCoupon.maximum_discount_value ?? rawCoupon.max_discount_value ?? rawCoupon.max_discount, NaN)
    };
  }

  function appliedCouponFromSources(sources) {
    const couponKeys = ['applied_coupon', 'coupon_detail', 'coupon'];
    for (const source of sources) {
      for (const key of couponKeys) {
        const coupon = normalizeCoupon(source?.[key]);
        if (coupon) {
          const sameOverride = appliedCouponOverride
            && String(appliedCouponOverride.code || '').toLowerCase() === String(coupon.code || '').toLowerCase();
          return sameOverride
            ? {
                ...coupon,
                ...appliedCouponOverride,
                id: coupon.id ?? appliedCouponOverride.id,
                code: coupon.code || appliedCouponOverride.code
              }
            : coupon;
        }
      }
      const code = source?.applied_coupon_code ?? source?.coupon_code;
      if (code) {
        return normalizeCoupon({
          id: source?.applied_coupon_id ?? source?.coupon_id ?? code,
          code
        });
      }
    }
    return null;
  }

  function normalizeServerCartSummary(payload) {
    const sources = cartResponseSources(payload);
    const subtotal = firstMoney(sources, ['items_total', 'subtotal', 'sub_total', 'cart_subtotal', 'gross_amount', 'total_before_discount']);
    const discount = firstMoney(sources, ['applied_coupon_discount', 'discount_amount', 'discount', 'coupon_discount', 'kit_discount', 'total_discount']);
    const cashback = firstMoney(sources, [
      'cashback_balance',
      'cashback_credit',
      'cashback_amount',
      'wallet_cashback',
      'bonus_amount',
      'extra_credit',
      'prepaid_advantage_amount',
      'atulyash_cashback',
      'coupon_cashback',
      'coupon_credit'
    ]);
    const cashbackTreatment = firstValue(
      ...sources.flatMap((source) => [
        source?.cashback_treatment,
        source?.coupon_treatment,
        source?.credit_treatment,
        source?.wallet_credit_type
      ])
    );
    const walletBalanceTotal = firstMoney(sources, [
      'wallet_balance_total',
      'total_wallet_balance',
      'wallet_total_balance',
      'wallet_credit_total',
      'post_payment_wallet_balance',
      'wallet_balance_after_payment',
      'total_credit',
      'new_wallet_balance',
      'new_balance'
    ]);
    const deliveryCharge = firstMoney(sources, ['delivery_charge']);
    const total = firstMoney(sources, ['cart_total', 'net_payable', 'grand_total', 'final_amount', 'payable_amount', 'total_amount', 'total']);
    let deliveryReason = '';
    let requiresSupport;
    for (const source of sources) {
      if (!deliveryReason && source.delivery_charge_reason) {
        deliveryReason = String(source.delivery_charge_reason);
      }
      if (typeof source.delivery_requires_customer_care === 'boolean') {
        requiresSupport = source.delivery_requires_customer_care;
      }
    }
    return {
      subtotal: Number.isFinite(subtotal) ? subtotal : undefined,
      discount: Number.isFinite(discount) ? Math.max(0, discount) : 0,
      cashback: Number.isFinite(cashback) ? Math.max(0, cashback) : 0,
      cashbackTreatment: cashbackTreatment ? String(cashbackTreatment) : '',
      walletBalanceTotal: Number.isFinite(walletBalanceTotal) ? Math.max(0, walletBalanceTotal) : undefined,
      deliveryCharge: Number.isFinite(deliveryCharge) ? Math.max(0, deliveryCharge) : undefined,
      deliveryReason,
      requiresSupport,
      total: Number.isFinite(total) ? total : undefined,
      coupon: appliedCouponFromSources(sources) || appliedCouponOverride
    };
  }

  function extractServerCartItems(payload) {
    const sources = cartResponseSources(payload);
    const keys = ['cart_items', 'items', 'line_items', 'results'];
    for (const source of sources) {
      for (const key of keys) {
        if (Array.isArray(source?.[key])) return { found: true, items: source[key] };
      }
    }
    return { found: false, items: [] };
  }

  function findVariantByApiId(apiId) {
    return Object.values(PRODUCT.variants).find((variant) => String(variant.apiId) === String(apiId));
  }

  function findPlanByApiId(apiId) {
    return WEEKLY_PLANS.find((plan) => String(plan.apiId) === String(apiId));
  }

  function normalizeServerCartItem(item) {
    if (!item || item.id == null) return null;
    const type = String(item.cart_item_type || item.item_type || '').toLowerCase();
    const isWeekly = type.includes('subscription') || Boolean(item.subscription_pack);
    const quantity = Math.max(1, numericValue(item.quantity, 1));

    if (isWeekly) {
      const rawPack = item.subscription_pack;
      const packId = rawPack && typeof rawPack === 'object' ? rawPack.id : rawPack;
      const rawSubscriptionPlan = item.subscription_plan;
      const subscriptionPlanId = firstValue(
        rawSubscriptionPlan && typeof rawSubscriptionPlan === 'object'
          ? rawSubscriptionPlan.id
          : rawSubscriptionPlan,
        rawSubscriptionPlan && typeof rawSubscriptionPlan === 'object'
          ? rawSubscriptionPlan.pk
          : null,
        item.subscription_plan_id,
        item.subscriptionPlanId
      );
      const plan = findPlanByApiId(packId);
      const rawWeeklyKg = Number(rawPack?.weekly_quantity ?? item.weekly_quantity);
      const rawPricePerDelivery = Number(
        rawPack?.price_per_delivery
          ?? item.subscription_pack_price_per_delivery
          ?? item.price_per_delivery
      );
      const rawMinimumDeliveriesRequired = Number(
        rawPack?.minimum_deliveries_required
          ?? item.subscription_pack_minimum_deliveries_required
      );
      const rawMinimumWalletRequired = Number(
        rawPack?.minimum_wallet_required
          ?? item.subscription_pack_minimum_wallet_required
      );
      const rawFourDeliveryWalletFunding = Number(
        rawPack?.four_delivery_wallet_funding
          ?? item.subscription_pack_four_delivery_wallet_funding
      );
      const rawBillingFrequency = String(
        rawPack?.billing_frequency
          ?? item.subscription_pack_billing_frequency
          ?? 'weekly'
      ).toLowerCase();
      const weeklyKg = plan?.weeklyKg ?? (Number.isFinite(rawWeeklyKg) && rawWeeklyKg > 0 ? rawWeeklyKg : 0);
      const pricePerDelivery = plan?.pricePerDelivery
        ?? (Number.isFinite(rawPricePerDelivery) && rawPricePerDelivery >= 0 ? rawPricePerDelivery : 0);
      const minimumDeliveriesRequired = plan?.minimumDeliveriesRequired
        ?? (Number.isFinite(rawMinimumDeliveriesRequired) && rawMinimumDeliveriesRequired > 0
          ? rawMinimumDeliveriesRequired
          : 4);
      const minimumWalletRequired = plan?.minimumWalletRequired
        ?? (Number.isFinite(rawMinimumWalletRequired) && rawMinimumWalletRequired >= 0
          ? rawMinimumWalletRequired
          : NaN);
      const fourDeliveryWalletFunding = plan?.fourDeliveryWalletFunding
        ?? (Number.isFinite(rawFourDeliveryWalletFunding) && rawFourDeliveryWalletFunding >= 0
          ? rawFourDeliveryWalletFunding
          : minimumWalletRequired);
      return {
        id: `api-${item.id}`,
        serverItemId: item.id,
        purchaseType: 'weekly',
        planId: plan?.id || `subscription-${packId}`,
        apiPlanId: packId,
        subscriptionPlanId,
        weight: weeklyKg || 0,
        weightKg: weeklyKg || 0,
        weeklyKg: weeklyKg || 0,
        pricePerDelivery,
        minimumDeliveriesRequired,
        minimumWalletRequired,
        fourDeliveryWalletFunding,
        billingFrequency: plan?.billingFrequency ?? rawBillingFrequency,
        deliveryDay: DELIVERY_DAYS.includes(item.delivery_day) ? item.delivery_day : '',
        quantity,
        unavailable: !plan?.apiId || !weeklyKg,
        unavailableLabel: rawPack?.name || 'Subscription item unavailable'
      };
    }

    const rawPack = item.product_pack;
    const packId = rawPack && typeof rawPack === 'object' ? rawPack.id : rawPack;
    const variant = findVariantByApiId(packId);
    const weight = variant?.weight || extractWeight(rawPack?.name) || numericValue(item.weight);
    const price = variant?.price || numericValue(rawPack?.price) || numericValue(item.unit_price || item.price);
    return {
      id: `api-${item.id}`,
      serverItemId: item.id,
      purchaseType: 'once',
      apiPackId: packId,
      weight: weight || 0,
      weightKg: weight || 0,
      pricePerDelivery: price,
      quantity,
      unavailable: !variant?.apiId || !weight,
      unavailableLabel: rawPack?.name || 'Product item unavailable'
    };
  }

  function cartIdFromResponse(payload, { useSessionFallback = true } = {}) {
    for (const source of cartResponseSources(payload)) {
      const value = source.cart_id ?? source.cartId ?? source.id;
      if (value != null && typeof value !== 'object') return value;
      if (value && typeof value === 'object' && value.id != null) return value.id;
    }
    return useSessionFallback ? sessionIdentifier('cartId') : null;
  }

  function isMissingCartError(error) {
    return Number(error?.status) === 404
      && /cart|not found|matches the given query/i.test(String(error?.message || ''));
  }

  function friendlyCartError(error) {
    const message = String(error?.message || '').trim();
    if (
      Number(error?.status) === 400
      && /field|required|invalid|blank/i.test(message)
    ) {
      return 'We could not prepare your secure bag. Please review your selection and try again.';
    }
    return message || 'This selection could not be added to your bag.';
  }

  function isUnauthorizedError(error) {
    const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status);
    return status === 401
      || /unauthori|token.*expired|authentication credentials|sign in again/i.test(String(error?.message || ''));
  }

  function cartCustomerIdentifier(payload) {
    for (const source of cartResponseSources(payload)) {
      const customer = source?.customer;
      if (customer && typeof customer === 'object') {
        return customer.id ?? customer.pk ?? customer.customer_id ?? null;
      }
      const customerId = customer ?? source?.customer_id ?? source?.customerId;
      if (customerId != null && customerId !== '') return customerId;
    }
    return null;
  }

  function rememberCustomerId(customerId) {
    if (customerId == null || customerId === '') return;
    API?.setSession?.({ customerId });
    apiSession = getApiSession();
    try {
      const meta = JSON.parse(sessionStorage.getItem('atulyash-account-meta-v1') || '{}');
      const sessionMobile = sessionPhone(apiSession);
      const metaMobile = String(meta?.mobile || '').replace(/\D/g, '').slice(-10);
      if (!metaMobile || !sessionMobile || metaMobile === sessionMobile) {
        sessionStorage.setItem(
          'atulyash-account-meta-v1',
          JSON.stringify({ ...meta, mobile: sessionMobile || metaMobile, customerId })
        );
      }
    } catch (error) {
      // The authenticated API session remains the source of truth.
    }
  }

  function selectCartFromCollection(payload) {
    const firstCart = apiResults(payload)[0];
    return firstCart && firstCart.id != null ? firstCart : null;
  }

  function rememberServerCartId(cartId) {
    if (cartId == null || cartId === '') return;
    serverCartId = cartId;
    API?.setSession?.({ cartId });
    apiSession = getApiSession();
  }

  function applyServerCartPayload(payload, {
    render = true,
    cartId = null
  } = {}) {
    clearCartLoginGate();
    const resolvedCartId = cartId || cartIdFromResponse(payload);
    if (resolvedCartId != null && resolvedCartId !== '') {
      rememberServerCartId(resolvedCartId);
    }
    rememberCustomerId(cartCustomerIdentifier(payload));
    const extracted = extractServerCartItems(payload);
    const normalizedItems = extracted.items.map(normalizeServerCartItem).filter(Boolean);
    if (extracted.found) cart = normalizedItems;
    serverCartSummary = normalizeServerCartSummary(payload);
    const savedCouponContext = loadSessionRecord(COUPON_CONTEXT_KEY, null);
    if (
      savedCouponContext?.cartId != null
      && resolvedCartId != null
      && String(savedCouponContext.cartId) !== String(resolvedCartId)
    ) {
      appliedCouponOverride = null;
      saveSessionRecord(COUPON_CONTEXT_KEY, null);
      serverCartSummary.coupon = appliedCouponFromSources(cartResponseSources(payload));
    }
    if (
      !appliedCouponFromSources(cartResponseSources(payload))
      && serverCartSummary.discount === 0
      && serverCartSummary.cashback === 0
    ) {
      appliedCouponOverride = null;
      saveSessionRecord(COUPON_CONTEXT_KEY, null);
      serverCartSummary.coupon = null;
    }
    serverCartActive = true;

    const preserveStoredGuestCart = pendingGuestCart.length > 0 || storedGuestCartExists();
    if (!preserveStoredGuestCart && !pendingGuestCart.length) {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
      } catch (error) {
        // The canonical server cart remains active in memory.
      }
    }
    if (render) renderCart();
    return payload;
  }

  async function readServerCart(cartId, { render = true } = {}) {
    const payload = await invokeApi('cart', 'get', [cartId], {
      path: `/orders/cart/${encodeURIComponent(cartId)}/`,
      options: { method: 'GET', auth: true, cache: 'no-store' }
    });
    return applyServerCartPayload(payload, { render, cartId });
  }

  async function createServerCart(customerId, { render = true } = {}) {
    setCartApiStatus('Preparing your first secure Atulyash bag…', { state: 'loading' });
    const cartDraft = {
      name: 'Atulyash Web Bag',
      is_active: true
    };
    const payload = await invokeApi('cart', 'create', [cartDraft], {
      path: '/orders/cart/',
      options: {
        method: 'POST',
        auth: true,
        body: cartDraft,
        form: false
      }
    });
    const createdCartId = cartIdFromResponse(payload, { useSessionFallback: false });
    if (!createdCartId) {
      throw new Error('Your new bag was created, but its cart ID was not returned by the service.');
    }
    const returnedCustomerId = cartCustomerIdentifier(payload);
    if (
      customerId != null
      && returnedCustomerId != null
      && String(returnedCustomerId) !== String(customerId)
    ) {
      throw new Error('The secure bag returned by the service does not match this customer.');
    }
    cart = [];
    applyServerCartPayload(payload, { render, cartId: createdCartId });
    setCartApiStatus('Your secure bag is ready.', { state: 'success' });
    return payload;
  }

  async function refreshServerCart({ render = true, createIfMissing = true } = {}) {
    const customerId = sessionIdentifier('customerId');
    setCartApiStatus('Synchronising your secure Atulyash bag…', { state: 'loading' });

    const preferredCartId = serverCartId || sessionIdentifier('cartId');
    if (preferredCartId) {
      try {
        const payload = await readServerCart(preferredCartId, { render });
        setCartApiStatus('Your bag is securely synchronised.', { state: 'success' });
        return payload;
      } catch (error) {
        if (isUnauthorizedError(error)) {
          showCartLoginGate();
          throw error;
        }
        if (!isMissingCartError(error)) {
          setCartApiStatus(friendlyCartError(error), { state: 'error', retry: true });
          throw error;
        }
      }
    }

    try {
      // Resolve the authenticated customer's cart from the collection only
      // when there is no usable remembered ID (or that ID no longer exists).
      // The cart ID is always results[0].id; customer/user IDs are never used
      // as cart identifiers.
      const collection = await invokeApi('cart', 'list', [{ is_active: true }], {
        path: '/orders/cart/',
        options: {
          method: 'GET',
          auth: true,
          cache: 'no-store',
          query: { is_active: true }
        }
      });
      const existingCart = selectCartFromCollection(collection);
      if (existingCart) {
        const payload = await readServerCart(existingCart.id, { render });
        setCartApiStatus('Your bag is securely synchronised.', { state: 'success' });
        return payload;
      }
      if (!createIfMissing) {
        throw new Error('No active cart is available for this customer.');
      }
      return await createServerCart(customerId, { render });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        showCartLoginGate();
      }
      setCartApiStatus(friendlyCartError(error), { state: 'error', retry: true });
      throw error;
    }
  }

  async function addDraftItemToServer(item) {
    if (!serverCartId) throw new Error('The active cart ID was not returned by the service.');
    if (item.purchaseType === 'weekly') {
      const plan = WEEKLY_PLAN_BY_ID.get(item.planId);
      if (!plan?.apiId) throw new Error(`${formatWeight(item.weeklyKg)} kg/week is not configured in the live subscription catalog.`);
      return invokeApi('cart', 'addSubscription', [{
        cart: serverCartId,
        subscription_pack: plan.apiId,
        cart_item_type: 'Subscription',
        subscription_duration_in_months: 1,
        quantity: item.quantity
      }], {
        path: '/orders/cart-items/',
        options: {
          method: 'POST',
          auth: true,
          body: {
            cart: serverCartId,
            subscription_pack: plan.apiId,
            cart_item_type: 'Subscription',
            subscription_duration_in_months: 1,
            quantity: item.quantity
          },
          form: true
        }
      });
    }

    const variant = PRODUCT.variants[item.weightKg ?? item.weight];
    if (!variant?.apiId) throw new Error(`${formatWeight(item.weightKg ?? item.weight)} kg is not configured in the live product catalog.`);
    return invokeApi('cart', 'addItem', [{
      quantity: item.quantity,
      cart: serverCartId,
      product_pack: variant.apiId,
      cart_item_type: 'One Time'
    }], {
      path: '/orders/cart-items/',
      options: {
        method: 'POST',
        auth: true,
        body: {
          quantity: item.quantity,
          cart: serverCartId,
          product_pack: variant.apiId,
          cart_item_type: 'One Time'
        },
        form: true
      }
    });
  }

  async function syncGuestCartToServer() {
    if (!isApiAuthenticated()) throw new Error('Sign in before synchronising your bag.');
    apiSession = getApiSession();
    await refreshServerCart({ render: false });
    const activeCustomerId = sessionIdentifier('customerId');
    if (!activeCustomerId) {
      throw new Error('Your mobile is verified, but we could not connect your customer account yet.');
    }
    if (
      guestSyncCustomerId != null
      && String(guestSyncCustomerId) !== String(activeCustomerId)
      && (storedGuestCartExists() || pendingGuestCart.length || Object.keys(guestSyncTargets).length)
    ) {
      throw new Error('This unsynchronised bag belongs to another signed-in account. Sign back into that account to finish its checkout.');
    }
    guestSyncCustomerId = activeCustomerId;
    if (!pendingGuestCart.length) {
      const storedDraft = loadCart();
      pendingGuestCart = (serverCartActive ? storedDraft : cart).map((item) => ({ ...item }));
    }
    pendingGuestCart = migrateCartItems(pendingGuestCart);
    if (pendingGuestCart.some((item) => item.unavailable)) {
      persistGuestSyncState();
      throw new Error('One or more saved bag items are no longer available. Remove them before checkout.');
    }
    persistGuestSyncState();

    if (!guestSyncTargets || Array.isArray(guestSyncTargets) || typeof guestSyncTargets !== 'object') {
      guestSyncTargets = {};
    }
    pendingGuestCart.forEach((item) => {
      const key = cartLineKey(item);
      if (!Number.isFinite(Number(guestSyncTargets[key]))) {
        guestSyncTargets[key] = serverQuantityForKey(key) + item.quantity;
      }
    });
    persistGuestSyncState();

    const failures = [];
    for (const item of pendingGuestCart) {
      const key = cartLineKey(item);
      const outstanding = Math.max(0, numericValue(guestSyncTargets[key]) - serverQuantityForKey(key));
      if (!outstanding) continue;
      try {
        await addDraftItemToServer({ ...item, quantity: outstanding });
      } catch (error) {
        failures.push({ key, error });
      }
    }

    if (pendingGuestCart.length && !failures.length) {
      try {
        await invokeApi('cart', 'applyKit', [], {
          path: '/orders/cart/apply-kit/',
          options: { method: 'POST', auth: true }
        });
      } catch (error) {
        // Eligibility is decided by the server; an ineligible kit does not block checkout.
      }
    }

    await refreshServerCart();
    pendingGuestCart = pendingGuestCart.filter((item) => {
      const key = cartLineKey(item);
      const complete = serverQuantityForKey(key) >= numericValue(guestSyncTargets[key], Infinity);
      if (complete) delete guestSyncTargets[key];
      return !complete;
    });
    persistGuestSyncState();
    const unresolvedFailures = failures.filter(({ key }) =>
      pendingGuestCart.some((item) => cartLineKey(item) === key)
    );
    if (unresolvedFailures.length) {
      throw new Error(unresolvedFailures.map(({ error }) => (
        error?.message || 'A bag item could not be synchronised.'
      )).join(' '));
    }
  }

  function getVariant(weight = selectedWeight) {
    return PRODUCT.variants[weight] || PRODUCT.variants[2];
  }

  function getWeeklyPlan(planId = selectedWeeklyPlanId) {
    return WEEKLY_PLAN_BY_ID.get(planId) || null;
  }

  function formatWeight(weight) {
    return Number.isInteger(Number(weight)) ? String(Number(weight)) : Number(weight).toFixed(1);
  }

  function weeklyPlanCadenceText(plan) {
    return `${formatWeight(plan?.weeklyKg || 0)} kg every week`;
  }

  function weeklyPlanSelectionLabel(plan) {
    return weeklyPlanCadenceText(plan);
  }

  function selectedQuote() {
    if (selectedPurchaseType === 'weekly') {
      const plan = getWeeklyPlan();
      if (!plan) return null;
      return {
        weightKg: plan.weeklyKg,
        price: plan.pricePerDelivery,
        pricePerDelivery: plan.pricePerDelivery,
        walletCover: plan.fourDeliveryWalletFunding,
        minimumDeliveriesRequired: plan.minimumDeliveriesRequired,
        plan,
        planId: plan.id
      };
    }
    const variant = getVariant();
    return {
      weightKg: variant.weight,
      price: variant.price,
      unitPrice: PRODUCT.unitPrice
    };
  }

  function itemDescriptor(item) {
    if (item.unavailable) {
      const weightKg = numericValue(item.weeklyKg ?? item.weightKg ?? item.weight);
      return {
        weightKg,
        pricePerDelivery: numericValue(item.pricePerDelivery),
        minimumDeliveriesRequired: numericValue(item.minimumDeliveriesRequired, 4),
        minimumWalletRequired: numericValue(item.minimumWalletRequired),
        fourDeliveryWalletFunding: numericValue(item.fourDeliveryWalletFunding, item.minimumWalletRequired),
        billingFrequency: item.billingFrequency || 'weekly',
        deliveryDay: DELIVERY_DAYS.includes(item.deliveryDay) ? item.deliveryDay : '',
        unavailable: true
      };
    }
    if (item.purchaseType === 'weekly') {
      const matchedPlan = WEEKLY_PLAN_BY_ID.get(item.planId);
      const weightKg = matchedPlan?.weeklyKg ?? Number(item.weeklyKg ?? item.weightKg ?? item.weight);
      const pricePerDelivery = matchedPlan?.pricePerDelivery ?? numericValue(item.pricePerDelivery);
      const minimumWalletRequired = matchedPlan?.minimumWalletRequired
        ?? numericValue(item.minimumWalletRequired, NaN);
      return {
        weightKg,
        pricePerDelivery,
        minimumDeliveriesRequired: matchedPlan?.minimumDeliveriesRequired
          ?? numericValue(item.minimumDeliveriesRequired, 4),
        minimumWalletRequired,
        fourDeliveryWalletFunding: matchedPlan?.fourDeliveryWalletFunding
          ?? numericValue(item.fourDeliveryWalletFunding, minimumWalletRequired),
        billingFrequency: matchedPlan?.billingFrequency ?? item.billingFrequency ?? 'weekly',
        deliveryDay: DELIVERY_DAYS.includes(item.deliveryDay) ? item.deliveryDay : ''
      };
    }
    const suppliedWeight = Number(item.weightKg ?? item.weight);
    const variant = PRODUCT.variants[suppliedWeight];
    return {
      weightKg: variant?.weight ?? suppliedWeight,
      price: variant?.price ?? 0
    };
  }

  function formatPrice(amount) {
    return currency.format(amount);
  }

  function weeklyWalletCoverAmount(descriptor) {
    const cover = Number(descriptor?.fourDeliveryWalletFunding);
    if (Number.isFinite(cover) && cover >= 0) return cover;
    const minimum = Number(descriptor?.minimumWalletRequired);
    return Number.isFinite(minimum) && minimum >= 0 ? minimum : 0;
  }

  function cartItemTotal(item) {
    const descriptor = itemDescriptor(item);
    const unitCharge = item.purchaseType === 'weekly'
      ? weeklyWalletCoverAmount(descriptor)
      : descriptor.price;
    return (Number.isFinite(unitCharge) ? unitCharge : 0) * item.quantity;
  }

  function cartSubtotal() {
    const hasWeekly = cart.some((item) => item.purchaseType === 'weekly');
    // Subscription lines use the server-provided four-delivery wallet cover.
    // It is not presented as an upfront debit.
    if (!hasWeekly && serverCartActive && Number.isFinite(serverCartSummary?.subtotal)) {
      return serverCartSummary.subtotal;
    }
    return cart.reduce((total, item) => total + cartItemTotal(item), 0);
  }

  function needsFirstOrderEligibility() {
    // The live cart is authoritative for delivery charges. The separate
    // order-history request only matters for an unsynchronised one-time bag
    // where the client still needs to decide whether first delivery is free.
    return isApiAuthenticated()
      && !serverCartActive
      && cart.some((item) => item.purchaseType !== 'weekly');
  }

  async function loadFirstOrderEligibility() {
    if (!needsFirstOrderEligibility()) {
      firstOrderEligibility = null;
      return null;
    }
    if (firstOrderEligibilityRequest) return firstOrderEligibilityRequest;
    const query = {
      page_size: 1,
      page: 1,
      is_active: true,
      pending_order: false
    };
    const request = (async () => {
      try {
        const response = await invokeApi('orders', 'list', [query], {
          path: '/orders/order/',
          options: { method: 'GET', auth: true, cache: 'no-store', query }
        });
        const suppliedCount = Number(response?.count ?? response?.data?.count);
        const hasEarlierOrder = Number.isFinite(suppliedCount)
          ? suppliedCount > 0
          : apiResults(response).length > 0;
        firstOrderEligibility = !hasEarlierOrder;
        renderCart();
        return firstOrderEligibility;
      } catch (error) {
        firstOrderEligibility = null;
        return null;
      }
    })();
    firstOrderEligibilityRequest = request;
    try {
      return await request;
    } finally {
      if (firstOrderEligibilityRequest === request) firstOrderEligibilityRequest = null;
    }
  }

  function deliveryChargeQuote() {
    const oneTimeWeight = cart
      .filter((item) => item.purchaseType !== 'weekly')
      .reduce((total, item) => total + (itemDescriptor(item).weightKg * item.quantity), 0);
    const hasWeekly = cart.some((item) => item.purchaseType === 'weekly');
    if (
      serverCartActive
      && (
        Number.isFinite(serverCartSummary?.deliveryCharge)
        || typeof serverCartSummary?.requiresSupport === 'boolean'
      )
    ) {
      const amount = Number.isFinite(serverCartSummary.deliveryCharge)
        ? serverCartSummary.deliveryCharge
        : null;
      const requiresSupport = serverCartSummary.requiresSupport === true;
      const reasonLabels = {
        ONE_TIME_2_TO_6_KG: 'One-time delivery · 2–6 kg',
        ONE_TIME_7_TO_10_KG: 'One-time delivery · 7–10 kg',
        ONE_TIME_11_TO_40_KG: 'One-time delivery · 11–40 kg',
        ACTIVE_SUBSCRIPTION_ONE_TIME: 'Active subscriber benefit',
        ABOVE_40_KG_CUSTOMER_CARE: 'Large-order delivery'
      };
      return {
        amount,
        weight: oneTimeWeight,
        requiresSupport,
        label: reasonLabels[serverCartSummary.deliveryReason]
          || (hasWeekly ? 'Fresh-batch delivery' : `One-time delivery · ${formatWeight(oneTimeWeight)} kg`),
        note: requiresSupport
          ? 'This order needs confirmation from Atulyash Customer Care before checkout.'
          : serverCartSummary.deliveryReason === 'ACTIVE_SUBSCRIPTION_ONE_TIME'
            ? 'Free delivery because your active weekly subscription includes delivery coverage for this one-time order.'
          : amount === 0
            ? 'The live cart confirms free delivery.'
            : `The live cart confirms a ${formatPrice(amount)} delivery charge.`
      };
    }
    if (serverCartActive) {
      return {
        amount: null,
        weight: oneTimeWeight,
        requiresSupport: true,
        label: 'Delivery charge unavailable',
        note: 'The live cart did not return a delivery-charge decision. Refresh your bag before checkout.'
      };
    }
    if (oneTimeWeight <= 0) {
      return {
        amount: 0,
        weight: 0,
        requiresSupport: false,
        label: 'Scheduled subscription delivery',
        note: 'Scheduled subscription deliveries are always free.'
      };
    }
    if (hasWeekly) {
      return {
        amount: 0,
        weight: oneTimeWeight,
        requiresSupport: false,
        label: 'Added to scheduled weekly delivery',
        note: 'Atta added to the same scheduled subscription delivery has no delivery charge.'
      };
    }
    if (
      oneTimeWeight >= 2
      && (
        firstOrderEligibility === true
        || (!isApiAuthenticated() && !serverCartActive)
      )
    ) {
      return {
        amount: 0,
        weight: oneTimeWeight,
        requiresSupport: false,
        label: 'First Atulyash Experience delivery',
        note: 'Your first Atulyash Experience delivery is free.'
      };
    }
    if (oneTimeWeight > 40) {
      return {
        amount: null,
        weight: oneTimeWeight,
        requiresSupport: true,
        label: `Delivery charge · ${formatWeight(oneTimeWeight)} kg`,
        note: 'Orders above 40 kg are arranged through Atulyash Customer Care.'
      };
    }
    const amount = oneTimeWeight <= 6 ? 40 : oneTimeWeight <= 10 ? 30 : 0;
    return {
      amount,
      weight: oneTimeWeight,
      requiresSupport: false,
      label: `One-time delivery · ${formatWeight(oneTimeWeight)} kg`,
      note: amount === 0
        ? 'One-time orders of 11–40 kg are delivered free.'
        : `This one-time delivery has a ${formatPrice(amount)} delivery charge.`
    };
  }

  function experienceCredit() {
    // Welcome savings are server-authoritative. Never invent a promotional
    // credit while the cart is a guest draft or while the live cart is syncing.
    if (couponIsCashback()) return 0;
    return serverCartActive && Number.isFinite(serverCartSummary?.discount)
      ? Math.max(0, serverCartSummary.discount)
      : 0;
  }

  function cashbackCouponIsApplied() {
    if (!cart.some((item) => item.purchaseType === 'weekly')) return false;
    const coupon = appliedCoupon();
    if (!coupon) return false;
    const code = String(coupon.code || '').trim().toUpperCase();
    const descriptor = [coupon.discountType, coupon.name, coupon.description]
      .map((value) => String(value || '').toLowerCase())
      .join(' ');
    // ATULYASH100 is the legacy code for the subscription cashback offer. The
    // amount still comes from the live cart/backend response; only the
    // treatment is inferred here when an older cart response omits it.
    return code === 'ATULYASH100' || /cashback|bonus|credit/.test(descriptor);
  }

  function cashbackAmount() {
    if (!serverCartActive || !serverCartSummary) return 0;
    const treatment = String(
      serverCartSummary.cashbackTreatment || walletFundingPolicy?.cashbackTreatment || ''
    ).toLowerCase();
    const explicitCashback = Number(serverCartSummary.cashback) || Number(walletFundingPolicy?.cashbackCredit);
    if (explicitCashback > 0) return explicitCashback;
    return (cashbackCouponIsApplied() || /cashback|bonus|credit/.test(treatment)) && Number(serverCartSummary.discount) > 0
      ? Math.max(0, serverCartSummary.discount)
      : 0;
  }

  function couponIsCashback() {
    const treatment = String(
      serverCartSummary?.cashbackTreatment || walletFundingPolicy?.cashbackTreatment || ''
    ).toLowerCase();
    return cashbackAmountFromSummary() > 0
      || Number(walletFundingPolicy?.cashbackCredit) > 0
      || cashbackCouponIsApplied()
      || /cashback|bonus|credit/.test(treatment);
  }

  function cashbackAmountFromSummary() {
    const value = Number(serverCartSummary?.cashback);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  function orderTotal() {
    const hasWeekly = cart.some((item) => item.purchaseType === 'weekly');
    // A weekly plan is funded in the wallet for the minimum number of
    // deliveries. Once returned, the server's coupon-adjusted requirement is
    // authoritative; before that response, the live cart discount is the best
    // estimate available to prepare the first policy request.
    const minimumWalletRequired = hasWeekly
      ? couponIsCashback() && Number.isFinite(walletFundingPolicy?.grossWalletRequired)
        ? walletFundingPolicy.grossWalletRequired
        : numericValue(walletFundingPolicy?.minimumWalletRequired, NaN)
      : NaN;
    if (Number.isFinite(minimumWalletRequired) && minimumWalletRequired >= 0) {
      return minimumWalletRequired;
    }
    const delivery = deliveryChargeQuote();
    if (
      serverCartActive
      && !hasWeekly
      && Number.isFinite(serverCartSummary?.total)
    ) {
      return Math.max(0, serverCartSummary.total);
    }
    return Math.max(0, cartSubtotal() - experienceCredit()) + (Number.isFinite(delivery.amount) ? delivery.amount : 0);
  }

  function cartQuantity() {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }

  function announce(message) {
    if (!elements.toast) return;
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => elements.toast.classList.remove('is-visible'), 2800);
  }

  function buildChapatiTokens(layer, count, compact = false) {
    if (!layer) return;
    const fragment = document.createDocumentFragment();
    const spread = compact ? 13 : 32;

    for (let index = 0; index < count; index += 1) {
      const chapati = document.createElement('span');
      const position = index - (count - 1) / 2;
      const startX = position * spread;
      chapati.className = 'chapati-token';
      chapati.style.setProperty('--roti-start-x', `${startX}px`);
      chapati.style.setProperty('--roti-mid-x', `${startX * 0.45}px`);
      chapati.style.setProperty('--roti-rotation', `${position * 19 + (index % 2 ? 11 : -8)}deg`);
      chapati.style.setProperty('--roti-mid-rotation', `${position * -5 + (index % 2 ? -3 : 2)}deg`);
      chapati.style.setProperty('--roti-delay', `${35 + index * 70}ms`);
      fragment.append(chapati);
    }

    layer.replaceChildren(fragment);
  }

  function clearVariantAnimation() {
    clearTimeout(variantAnimationTimer);
    elements.productGallery?.classList.remove('is-filling');
    elements.packSelectionScene?.classList.remove('is-filling');
    elements.packFillAnimation?.replaceChildren();
    elements.packSelectionMiniFill?.replaceChildren();
  }

  function animateVariantChange(weight) {
    variantAnimationGeneration += 1;
    const generation = variantAnimationGeneration;
    clearVariantAnimation();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const count = Math.max(1, Math.min(4, Math.ceil(Number(weight) / 2)));
    const compact = window.matchMedia('(max-width: 940px)').matches;
    const animationHost = compact ? elements.packSelectionScene : elements.productGallery;
    const animationLayer = compact ? elements.packSelectionMiniFill : elements.packFillAnimation;

    if (elements.packSelectionSceneWeight) {
      elements.packSelectionSceneWeight.textContent = `${weight} kg fresh batch`;
    }

    buildChapatiTokens(animationLayer, count, compact);
    void animationHost?.offsetWidth;
    animationHost?.classList.add('is-filling');

    variantAnimationTimer = window.setTimeout(() => {
      if (generation !== variantAnimationGeneration) return;
      clearVariantAnimation();
    }, 920);
  }

  function updateProductUI({ animate = false } = {}) {
    const quote = selectedQuote();
    if (!quote) {
      selectedPurchaseType = 'once';
      updateProductUI();
      return;
    }
    const isWeekly = selectedPurchaseType === 'weekly';
    const total = (isWeekly ? quote.walletCover : quote.price) * selectedQuantity;
    const weightLabel = formatWeight(quote.weightKg);
    const weeklyLabel = isWeekly ? weeklyPlanSelectionLabel(quote.plan) : '';

    if (animate) animateVariantChange(quote.weightKg);
    if (elements.packSelector) {
      elements.packSelector.hidden = isWeekly;
      elements.packSelector.inert = isWeekly;
    }
    if (elements.weeklyPlanPanel) {
      elements.weeklyPlanPanel.hidden = !isWeekly;
      elements.weeklyPlanPanel.inert = !isWeekly;
    }
    if (elements.productPrice) elements.productPrice.textContent = formatPrice(quote.price);
    if (elements.productUnitPrice) {
      elements.productUnitPrice.textContent = isWeekly
        ? `${weeklyLabel} · ${formatPrice(quote.pricePerDelivery)} per delivery · ${formatPrice(quote.walletCover)} wallet funding for ${quote.minimumDeliveriesRequired} deliveries`
        : `${formatPrice(PRODUCT.unitPrice)} per kg`;
    }
    if (elements.heroUnitPrice) {
      elements.heroUnitPrice.textContent = `${formatPrice(PRODUCT.unitPrice)} per kg`;
    }
    if (elements.heroVisualUnitPrice) {
      elements.heroVisualUnitPrice.textContent = formatPrice(PRODUCT.unitPrice);
    }
    if (elements.addToCartPrice) elements.addToCartPrice.textContent = formatPrice(total);
    if (elements.productQuantity) elements.productQuantity.textContent = selectedQuantity;
    if (elements.mobilePackLabel) {
      elements.mobilePackLabel.textContent = isWeekly
        ? `${weeklyLabel} · ${quote.minimumDeliveriesRequired} deliveries covered`
        : `${weightLabel} kg · buy once`;
    }
    if (elements.mobilePackPrice) elements.mobilePackPrice.textContent = formatPrice(total);
    if (elements.weeklyPlanSelect) elements.weeklyPlanSelect.value = selectedWeeklyPlanId;
    if (elements.weeklyPlanSummary && isWeekly) {
      elements.weeklyPlanSummary.textContent = `${weeklyLabel} · ${formatPrice(quote.pricePerDelivery)} per delivery · ${formatPrice(quote.walletCover)} wallet funding for ${quote.minimumDeliveriesRequired} deliveries`;
    }
    renderWeeklyCalculatorSuggestion();

    if (elements.packSizeSelect) elements.packSizeSelect.value = String(selectedWeight);

    document.querySelectorAll('input[name="purchaseType"]').forEach((input) => {
      const selected = input.value === selectedPurchaseType;
      input.checked = selected;
      input.closest('.purchase-option')?.classList.toggle('is-selected', selected);
    });
    syncPurchaseAvailability();
  }

  function selectWeight(weight, { scroll = false, notify = false } = {}) {
    const nextWeight = Number(weight);
    if (!PRODUCT.variants[nextWeight]) return;
    const changed = nextWeight !== selectedWeight;
    selectedWeight = nextWeight;
    updateProductUI({ animate: changed });

    if (scroll) {
      elements.packSelector?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520;
      window.setTimeout(() => elements.packSizeSelect?.focus({ preventScroll: true }), delay);
    }
    if (notify) announce(`${nextWeight} kg pack selected from your weekly estimate.`);
  }

  function selectWeeklyPlan(planId, { scroll = false, notify = false } = {}) {
    const plan = WEEKLY_PLAN_BY_ID.get(planId);
    if (!plan) return;
    const changed = selectedWeeklyPlanId !== plan.id || selectedPurchaseType !== 'weekly';
    selectedWeeklyPlanId = plan.id;
    selectedPurchaseType = 'weekly';
    updateProductUI({ animate: changed });

    if (scroll) {
      elements.purchaseSelector?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520;
      window.setTimeout(() => elements.weeklyPlanSelect?.focus({ preventScroll: true }), delay);
    }
    if (notify) {
      announce(`${weeklyPlanSelectionLabel(plan)} plan selected for your household.`);
    }
  }

  async function addSelectionToCart({ openAfter = false, openBagAfter = !openAfter } = {}) {
    lastCartFailureMessage = '';
    if (pendingOrder) {
      lastCartFailureMessage = 'Complete the pending order payment before changing your bag.';
      announce(lastCartFailureMessage);
      return false;
    }
    if (!currentSelectionHasLiveCatalog()) {
      lastCartFailureMessage = 'This selection cannot be ordered until live availability reconnects.';
      announce(lastCartFailureMessage);
      return false;
    }
    const isWeekly = selectedPurchaseType === 'weekly';
    const plan = getWeeklyPlan();
    if (isWeekly && !plan?.apiId) {
      lastCartFailureMessage = 'Weekly plans are not available right now.';
      announce(lastCartFailureMessage);
      return false;
    }
    const id = isWeekly
      ? `weekly-${plan.id}`
      : `once-${selectedWeight}`;
    const draftItem = isWeekly ? {
      id,
      purchaseType: 'weekly',
      planId: plan.id,
      apiPlanId: plan.apiId,
      weight: plan.weeklyKg,
      weightKg: plan.weeklyKg,
      weeklyKg: plan.weeklyKg,
      pricePerDelivery: plan.pricePerDelivery,
      minimumDeliveriesRequired: plan.minimumDeliveriesRequired,
      minimumWalletRequired: plan.minimumWalletRequired,
      fourDeliveryWalletFunding: plan.fourDeliveryWalletFunding,
      billingFrequency: plan.billingFrequency,
      quantity: selectedQuantity
    } : {
      id,
      weight: selectedWeight,
      weightKg: selectedWeight,
      apiPackId: getVariant().apiId,
      purchaseType: 'once',
      pricePerDelivery: getVariant().price,
      quantity: selectedQuantity
    };

    if (isApiAuthenticated()) {
      let added = false;
      setPurchaseButtonsBusy(true);
      try {
        if (accountHandoffActive) {
          await refreshServerCart({ render: false });
        } else if (pendingGuestCart.length || storedGuestCartExists()) {
          await syncGuestCartToServer();
        } else if (!serverCartActive || !serverCartId) {
          if (cart.length) await syncGuestCartToServer();
          else await refreshServerCart({ render: false });
        }
        await addDraftItemToServer(draftItem);
        await refreshServerCart();
        invalidateCoupons({ reloadOpen: true });
        const selection = isWeekly
          ? `${formatWeight(plan.weeklyKg)} kg every week`
          : `${selectedWeight} kg pack`;
        announce(`${selectedQuantity} × ${selection} added to your secure bag.`);
        if (openAfter && !openCheckout()) {
          lastCartFailureMessage = 'Your bag needs attention before delivery can continue.';
          openCart();
          return false;
        }
        if (openBagAfter) openCart();
        added = true;
      } catch (error) {
        if (isUnauthorizedError(error)) {
          lastCartFailureMessage = 'Please sign in to view and update your bag.';
          showCartLoginGate();
          return false;
        }
        const message = friendlyCartError(error);
        lastCartFailureMessage = message;
        setCartApiStatus(message, { state: 'error', retry: true });
        announce(message);
        if (openBagAfter) openCart();
      } finally {
        setPurchaseButtonsBusy(false);
      }
      return added;
    }

    const existing = cart.find((item) => item.id === id);
    let actualAdded = selectedQuantity;

    if (existing) {
      const previousQuantity = existing.quantity;
      existing.quantity = Math.min(20, existing.quantity + selectedQuantity);
      actualAdded = existing.quantity - previousQuantity;
    } else {
      cart.push(draftItem);
    }

    saveCart();
    invalidateCoupons();
    renderCart({ pulse: true });
    if (actualAdded > 0) {
      const selection = isWeekly
        ? `${formatWeight(plan.weeklyKg)} kg every week`
        : `${selectedWeight} kg pack`;
      announce(`${actualAdded} × ${selection} added to your bag.`);
    } else {
      announce('Maximum quantity for this selection is 20.');
    }
    if (openAfter && !openCheckout()) {
      lastCartFailureMessage = 'Your bag needs attention before delivery can continue.';
      openCart();
      return false;
    }
    if (openBagAfter) openCart();
    return true;
  }

  function cartItemMarkup(item) {
    const descriptor = itemDescriptor(item);
    const isWeekly = item.purchaseType === 'weekly';
    if (item.unavailable) {
      return `
        <article class="cart-item unified-bag-item is-unavailable" data-cart-id="${escapeHtml(item.id)}">
          <div class="cart-item-visual unified-bag-item-visual">
            <img src="${escapeHtml(PRODUCT.image)}" width="490" height="512" alt="" loading="lazy">
          </div>
          <div class="cart-item-info unified-bag-item-info">
            <div class="cart-item-top unified-bag-item-top">
              <h3>${escapeHtml(item.unavailableLabel || 'Unavailable catalogue item')}</h3>
              <strong>${formatPrice(cartItemTotal(item))}</strong>
            </div>
            <p class="cart-item-meta unified-bag-item-meta">This server bag item is visible for transparency, but it is not in the active catalogue. Remove it before checkout.</p>
            <div class="cart-item-controls unified-bag-item-controls">
              <span class="cart-item-warning">Ordering unavailable</span>
              <button class="cart-item-remove" type="button" data-cart-action="remove">Remove</button>
            </div>
          </div>
        </article>`;
    }
    const weightLabel = formatWeight(descriptor.weightKg);
    const plan = WEEKLY_PLAN_BY_ID.get(item.planId) || descriptor;
    const deliverySchedule = descriptor.deliveryDay
      ? descriptor.deliveryDay
      : 'Schedule selected at checkout';
    const schedule = isWeekly
      ? `${weeklyPlanSelectionLabel(plan)} · ${deliverySchedule}`
      : 'One-time order';
    const priceContext = isWeekly
      ? `${formatPrice(descriptor.pricePerDelivery)} per delivery · ${formatPrice(weeklyWalletCoverAmount(descriptor))} wallet funding for ${descriptor.minimumDeliveriesRequired} deliveries`
      : `${formatPrice(descriptor.price)} each`;
    const quantityLabel = isWeekly ? `${weeklyPlanSelectionLabel(plan)} plan` : `${weightLabel} kg pack`;

    return `
      <article class="cart-item unified-bag-item" data-cart-id="${escapeHtml(item.id)}">
        <div class="cart-item-visual unified-bag-item-visual">
          <img src="${escapeHtml(PRODUCT.image)}" width="490" height="512" alt="" loading="lazy">
        </div>
        <div class="cart-item-info unified-bag-item-info">
          <div class="cart-item-top unified-bag-item-top">
            <h3>${escapeHtml(PRODUCT.name)}</h3>
            <strong>${formatPrice(cartItemTotal(item))}</strong>
          </div>
          <p class="cart-item-meta unified-bag-item-meta">${escapeHtml(isWeekly ? weeklyPlanSelectionLabel(plan) : `${weightLabel} kg`)} · ${escapeHtml(schedule)} · ${escapeHtml(priceContext)}</p>
          <div class="cart-item-controls unified-bag-item-controls">
            <div class="cart-item-quantity unified-bag-quantity" aria-label="Quantity for ${escapeHtml(quantityLabel)}">
              <button type="button" data-cart-action="decrease" aria-label="Decrease ${escapeHtml(quantityLabel)} quantity">−</button>
              <span aria-live="polite">${item.quantity}</span>
              <button type="button" data-cart-action="increase" aria-label="Increase ${escapeHtml(quantityLabel)} quantity" ${item.quantity >= 20 ? 'disabled' : ''}>+</button>
            </div>
            <button class="cart-item-remove" type="button" data-cart-action="remove">Remove</button>
          </div>
        </div>
      </article>`;
  }

  function summaryItemMarkup(item) {
    const descriptor = itemDescriptor(item);
    if (item.unavailable) {
      return `
        <div class="checkout-summary-item is-unavailable" data-cart-id="${escapeHtml(item.id)}">
          <div class="checkout-summary-item-image"><img src="${escapeHtml(PRODUCT.image)}" width="490" height="512" alt=""></div>
          <div><strong>${escapeHtml(item.unavailableLabel || 'Unavailable catalogue item')}</strong><small>Remove this item before checkout</small></div>
          <div class="checkout-summary-item-aside">
            <b>${formatPrice(cartItemTotal(item))}</b>
            <button class="checkout-summary-remove" type="button" data-cart-action="remove" aria-label="Remove unavailable item from your bag"><span aria-hidden="true">×</span><span>Remove</span></button>
          </div>
        </div>`;
    }
    const isWeekly = item.purchaseType === 'weekly';
    const plan = WEEKLY_PLAN_BY_ID.get(item.planId) || descriptor;
    const deliverySchedule = descriptor.deliveryDay
      ? descriptor.deliveryDay
      : 'Schedule selected at checkout';
    const schedule = isWeekly
      ? `${weeklyPlanSelectionLabel(plan)} · ${deliverySchedule} · charged after rider confirmation`
      : 'Delivered once · no automatic repeat order';
    const summaryWeight = isWeekly
      ? weeklyPlanSelectionLabel(plan)
      : `${formatWeight(descriptor.weightKg)} kg Atulyash atta × ${item.quantity}`;
    return `
      <div class="checkout-summary-item" data-cart-id="${escapeHtml(item.id)}" data-purchase-type="${isWeekly ? 'weekly' : 'once'}">
        <div class="checkout-summary-item-image"><img src="${escapeHtml(PRODUCT.image)}" width="490" height="512" alt=""></div>
        <div><span class="checkout-summary-cadence">${isWeekly ? 'Weekly plan' : 'One-time purchase'}</span><strong>${escapeHtml(summaryWeight)}</strong><small>${escapeHtml(schedule)}</small></div>
        <div class="checkout-summary-item-aside">
          <b><span class="checkout-summary-price-label">${isWeekly ? 'Wallet funding for 4 deliveries' : 'Line total'}</span>${formatPrice(cartItemTotal(item))}</b>
          <button class="checkout-summary-remove" type="button" data-cart-action="remove" aria-label="Remove ${escapeHtml(summaryWeight)} from your bag"><span aria-hidden="true">×</span><span>Remove</span></button>
        </div>
      </div>`;
  }

  function emptyCheckoutSummaryMarkup() {
    const returnPath = checkoutReturnPath(IS_CHECKOUT_PAGE ? readCheckoutContext().origin : 'home');
    return `
      <div class="checkout-summary-empty" role="status">
        <strong>Your bag is empty.</strong>
        <small>Choose a fresh-batch pack before continuing to delivery.</small>
        <a href="${escapeHtml(returnPath)}">Return to shop <span aria-hidden="true">→</span></a>
      </div>`;
  }

  function cartCadence() {
    const hasWeekly = cart.some((item) => item.purchaseType === 'weekly');
    const hasOneTime = cart.some((item) => item.purchaseType !== 'weekly');
    return hasWeekly && hasOneTime ? 'mixed' : hasWeekly ? 'weekly' : 'once';
  }

  function checkoutOrderActionLabel() {
    const cadence = cartCadence();
    if (cadence === 'weekly') return 'Start weekly plan';
    if (cadence === 'mixed') return 'Place order & start weekly plan';
    return 'Place one-time order';
  }

  function renderCheckoutPurchaseClarity() {
    if (!elements.checkoutPurchaseClarity) return;
    const oneTimeItems = cart.filter((item) => item.purchaseType !== 'weekly');
    const weeklyItems = cart.filter((item) => item.purchaseType === 'weekly');
    const hasOneTime = oneTimeItems.length > 0;
    const hasWeekly = weeklyItems.length > 0;
    const mode = cartCadence();
    let title = 'One-time purchase';
    let description = 'Delivered once. No automatic repeat order or weekly billing.';
    let deliveryTitle = 'Choose where and when.';
    let deliveryIntro = 'Select an address and an available fresh-batch delivery date. This order will not repeat.';
    let consent = 'I confirm this one-time order, delivery address, date and Atulyash Wallet payment.';
    let walletPolicyTitle = 'Wallet-only order payment';
    let walletPolicyDescription = 'Your wallet funds are credited to your account after payment. Delivery charges are applied only after the delivery partner confirms delivery. If the balance is low, you can add the exact shortfall first.';

    if (hasWeekly && !hasOneTime) {
      const walletFunding = weeklyItems.reduce((total, item) => (
        total + weeklyWalletCoverAmount(itemDescriptor(item)) * item.quantity
      ), 0);
      const walletCopy = weeklyWalletRequirementCopy(walletFunding);
      title = 'Fresh weekly plan';
      description = `${weeklyItems.map((item) => weeklyPlanSelectionLabel(WEEKLY_PLAN_BY_ID.get(item.planId) || itemDescriptor(item))).join(' · ')}. ${walletCopy.detail} Each delivery is charged only after the rider confirms it.`;
      deliveryTitle = 'Choose your weekly rhythm.';
      deliveryIntro = 'Select an address, your preferred weekly delivery day and an available starting date.';
      consent = 'I confirm this weekly plan, its four-delivery wallet funding, address and delivery preference.';
      walletPolicyTitle = 'Four-delivery wallet requirement';
      walletPolicyDescription = `${walletCopy.detail} The paid amount stays in your wallet and is charged only after the delivery partner confirms each delivery, not as one upfront bulk debit.`;
    } else if (hasWeekly && hasOneTime) {
      title = 'One-time + weekly items';
      description = 'Wallet-funded one-time packs are charged after rider confirmation. Each weekly plan needs enough wallet balance for four scheduled deliveries and is charged after rider confirmation, delivery by delivery.';
      deliveryTitle = 'Choose delivery for this bag.';
      deliveryIntro = 'Your one-time packs arrive on the selected date; weekly-plan packs follow your chosen weekly day from that date.';
      consent = 'I confirm the one-time order and weekly plan, their delivery schedules, address and Atulyash Wallet payment.';
      walletPolicyTitle = 'Wallet requirement before delivery';
      walletPolicyDescription = 'The paid amount stays in your wallet. One-time and weekly delivery charges are applied only after the delivery partner confirms each delivery.';
    }

    elements.checkoutPurchaseClarity.dataset.mode = mode;
    if (elements.checkoutPurchaseClarityTitle) elements.checkoutPurchaseClarityTitle.textContent = title;
    if (elements.checkoutPurchaseClarityDescription) elements.checkoutPurchaseClarityDescription.textContent = description;
    if (elements.checkoutDeliveryTitle) elements.checkoutDeliveryTitle.textContent = deliveryTitle;
    if (elements.checkoutDeliveryIntro) elements.checkoutDeliveryIntro.textContent = deliveryIntro;
    if (elements.checkoutConsentText) elements.checkoutConsentText.textContent = consent;
    if (elements.checkoutWalletPolicyTitle) elements.checkoutWalletPolicyTitle.textContent = walletPolicyTitle;
    if (elements.checkoutWalletPolicyDescription) elements.checkoutWalletPolicyDescription.textContent = walletPolicyDescription;
    if (elements.placeOrderButtonLabel && !orderInFlight && !pendingOrder) {
      elements.placeOrderButtonLabel.textContent = checkoutOrderActionLabel();
    }
  }

  function couponBenefit(coupon) {
    if (!coupon) return '';
    const value = coupon.discountValue;
    let benefit = coupon.description;
    if (!benefit && Number.isFinite(value)) {
      benefit = coupon.discountType.includes('percent')
        ? `${value}% off`
        : `${formatPrice(value)} off`;
    }
    const details = [];
    if (benefit) details.push(benefit);
    if (Number.isFinite(coupon.minimumOrder) && coupon.minimumOrder > 0) {
      details.push(`Minimum bag ${formatPrice(coupon.minimumOrder)}`);
    }
    if (Number.isFinite(coupon.maximumDiscount) && coupon.maximumDiscount > 0) {
      details.push(`Up to ${formatPrice(coupon.maximumDiscount)}`);
    }
    return details.join(' · ') || 'Eligible for this bag';
  }

  function appliedCoupon() {
    return serverCartSummary?.coupon || appliedCouponOverride || null;
  }

  function couponDiscountPending() {
    if (couponIsCashback()) return false;
    return Boolean(
      serverCartActive
      && appliedCoupon()
      && (!Number.isFinite(serverCartSummary?.discount) || serverCartSummary.discount <= 0)
    );
  }

  function couponMatchesSearch(coupon) {
    const query = String(elements.couponSearch?.value || '').trim().toLowerCase();
    if (!query) return true;
    return [coupon.code, coupon.name, coupon.description, coupon.reason]
      .some((value) => String(value || '').toLowerCase().includes(query));
  }

  function couponCard(coupon, { valid = true, applied = false } = {}) {
    const card = document.createElement('article');
    card.className = `commerce-coupon${valid ? '' : ' is-ineligible'}${applied ? ' is-applied' : ''}`;

    const copy = document.createElement('div');
    const top = document.createElement('div');
    top.className = 'commerce-coupon-top';
    const code = document.createElement('strong');
    code.textContent = coupon.code;
    const badge = document.createElement('span');
    badge.textContent = applied ? 'Applied' : valid ? 'Eligible' : 'Unavailable';
    top.append(code, badge);

    const name = document.createElement('h4');
    name.textContent = coupon.name;
    const detail = document.createElement('p');
    detail.textContent = valid ? couponBenefit(coupon) : (coupon.reason || 'This offer is not eligible for the current bag.');
    copy.append(top, name, detail);

    const action = document.createElement('button');
    action.type = 'button';
    action.dataset.couponAction = applied ? 'remove' : 'apply';
    action.dataset.couponId = String(coupon.id);
    action.textContent = applied ? 'Remove' : 'Apply';
    action.disabled = couponBusy || !valid || Boolean(pendingOrder);
    if (!valid) action.hidden = true;
    card.append(copy, action);
    return card;
  }

  function couponEmptyState(message, { login = false } = {}) {
    const empty = document.createElement('div');
    empty.className = 'commerce-offers-empty';
    const copy = document.createElement('p');
    copy.textContent = message;
    empty.append(copy);
    if (login) {
      const link = document.createElement('a');
      link.href = IS_CHECKOUT_PAGE ? 'account.html?return=checkout#login' : 'account.html?return=cart#login';
      link.textContent = 'Sign in securely →';
      empty.append(link);
    }
    return empty;
  }

  function renderCouponPanel() {
    if (!elements.couponOffer || !elements.couponList) return;
    const currentCoupon = appliedCoupon();
    const discount = experienceCredit();
    const cashback = cashbackAmount();
    if (elements.couponOfferSummary) {
      elements.couponOfferSummary.textContent = currentCoupon
        ? cashback > 0
          ? `${currentCoupon.code} applied · +${formatPrice(cashback)} cashback`
          : discount > 0
          ? `${currentCoupon.code} applied · ${formatPrice(discount)} saved`
          : `${currentCoupon.code} attached · discount not confirmed`
        : 'See eligible Atulyash coupons';
    }
    [elements.cartDiscountLabel, elements.checkoutDiscountLabel].forEach((label) => {
      if (!label) return;
      label.textContent = cashback > 0
        ? 'Atulyash cashback'
        : currentCoupon
          ? `Coupon ${currentCoupon.code}`
          : 'Welcome saving';
    });
    elements.couponList.replaceChildren();

    if (!isApiAuthenticated() || !serverCartActive) {
      elements.couponList.append(couponEmptyState(
        'Sign in to see offers verified for your live bag.',
        { login: true }
      ));
      if (elements.couponStatus) elements.couponStatus.textContent = '';
      return;
    }

    if (couponBusy) {
      if (elements.couponStatus) elements.couponStatus.textContent = 'Updating your verified offer…';
    } else if (elements.couponStatus) {
      elements.couponStatus.textContent = couponMessage || (couponDiscountPending()
        ? 'The coupon service has not returned a confirmed discount. Remove this coupon before checkout to avoid an incorrect total.'
        : '');
    }

    if (currentCoupon && couponMatchesSearch(currentCoupon)) {
      elements.couponList.append(couponCard(currentCoupon, { valid: true, applied: true }));
    }
    if (!couponsLoaded) {
      if (!couponBusy) elements.couponList.append(couponEmptyState('Open offers to check the latest coupons for this bag.'));
      return;
    }

    const appliedId = String(currentCoupon?.id ?? '');
    const appliedCode = String(currentCoupon?.code ?? '').toLowerCase();
    const valid = couponData.valid.filter((coupon) => (
      couponMatchesSearch(coupon)
      && String(coupon.id) !== appliedId
      && String(coupon.code).toLowerCase() !== appliedCode
    ));
    valid.forEach((coupon) => elements.couponList.append(couponCard(coupon, { valid: true })));

    if (!elements.couponList.children.length) {
      elements.couponList.append(couponEmptyState(
        elements.couponSearch?.value.trim()
          ? 'No coupon matches this search.'
          : 'No coupon is available for this bag right now.'
      ));
    }
  }

  function couponArrays(payload) {
    const root = payload?.data ?? payload ?? {};
    const validCandidates = root.valid_coupons
      ?? root.applicable_coupons
      ?? root.eligible_coupons
      ?? root.valid
      ?? root.coupons;
    const generic = Array.isArray(root) ? root : apiResults(root);
    return {
      valid: (Array.isArray(validCandidates) ? validCandidates : generic).map(normalizeCoupon).filter(Boolean),
      // Invalid/disabled coupons are intentionally never rendered to
      // customers. The backend now returns only usable offers in the valid or
      // applicable collections; keep this empty for older responses too.
      invalid: []
    };
  }

  async function loadEligibleCoupons({ force = false } = {}) {
    if (!elements.couponOffer || couponBusy) return;
    if (!isApiAuthenticated() || !serverCartActive) {
      renderCouponPanel();
      return;
    }
    if (couponsLoaded && !force) {
      renderCouponPanel();
      return;
    }
    couponBusy = true;
    couponMessage = '';
    if (elements.couponStatus) elements.couponStatus.textContent = 'Checking offers for this bag…';
    renderCouponPanel();
    try {
      const query = serverCartId ? { cart_id: serverCartId } : {};
      const payload = await invokeApi('coupons', 'eligible', [query], {
        path: '/coupon/coupons/get-coupons-for-cart/',
        options: { method: 'GET', auth: true, cache: 'no-store', query }
      });
      couponData = couponArrays(payload);
      couponsLoaded = true;
      couponMessage = '';
    } catch (error) {
      couponsLoaded = false;
      if (isUnauthorizedError(error)) {
        showCartLoginGate({ returnToCheckout: IS_CHECKOUT_PAGE });
        return;
      }
      couponMessage = error?.message || 'Offers could not be checked right now.';
    } finally {
      couponBusy = false;
      renderCouponPanel();
    }
  }

  function invalidateCoupons({ reloadOpen = false } = {}) {
    couponsLoaded = false;
    couponData = { valid: [], invalid: [] };
    couponMessage = '';
    renderCouponPanel();
    if (reloadOpen && elements.couponToggleButton?.getAttribute('aria-expanded') === 'true') {
      loadEligibleCoupons({ force: true });
    }
  }

  async function changeCoupon(action, couponId) {
    if (couponBusy || pendingOrder) return;
    const candidate = couponData.valid
      .find((coupon) => String(coupon.id) === String(couponId));
    couponBusy = true;
    couponMessage = '';
    renderCouponPanel();
    try {
      if (action === 'remove') {
        await invokeApi('cart', 'removeCoupon', [], {
          path: '/orders/cart/remove-coupon/',
          options: { method: 'POST', auth: true, body: {}, form: true }
        });
        appliedCouponOverride = null;
        saveSessionRecord(COUPON_CONTEXT_KEY, null);
      } else {
        if (!candidate) throw new Error('This coupon is no longer available. Refresh offers and try again.');
        await invokeApi('cart', 'applyCoupon', [candidate.id], {
          path: '/orders/cart/apply-coupon/',
          options: { method: 'POST', auth: true, body: { coupon_id: candidate.id }, form: true }
        });
        appliedCouponOverride = candidate;
        saveSessionRecord(COUPON_CONTEXT_KEY, {
          cartId: serverCartId,
          coupon: candidate,
          savedAt: Date.now()
        });
      }
      couponsLoaded = false;
      await refreshServerCart();
      couponMessage = '';
      announce(action === 'remove' ? 'Coupon removed from your bag.' : `${candidate.code} attached. Waiting for the service to confirm the discount.`);
      couponBusy = false;
      await loadEligibleCoupons({ force: true });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        showCartLoginGate({ returnToCheckout: IS_CHECKOUT_PAGE });
        return;
      }
      couponMessage = error?.message || 'This coupon could not be updated.';
      announce(couponMessage);
    } finally {
      couponBusy = false;
      renderCart();
    }
  }

  function renderCart({ pulse = false } = {}) {
    const quantity = cartQuantity();
    const subtotal = cartSubtotal();
    const credit = experienceCredit();
    const cashback = cashbackAmount();
    const total = orderTotal();
    const delivery = deliveryChargeQuote();

    if (elements.headerCartCount) {
      elements.headerCartCount.textContent = quantity;
      if (pulse) {
        elements.headerCartCount.classList.remove('is-pulsing');
        void elements.headerCartCount.offsetWidth;
        elements.headerCartCount.classList.add('is-pulsing');
      }
    }

    elements.headerCartButton?.setAttribute('aria-label', `Open shopping bag, ${quantity} ${quantity === 1 ? 'item' : 'items'}`);
    if (elements.cartTitleCount) elements.cartTitleCount.textContent = `(${quantity})`;
    if (elements.cartSubtotal) elements.cartSubtotal.textContent = formatPrice(subtotal);
    if (elements.checkoutSubtotal) elements.checkoutSubtotal.textContent = formatPrice(subtotal);
    const cadence = cartCadence();
    const hasWeekly = cadence !== 'once';
    if (elements.checkoutWeeklyScheduleField) {
      elements.checkoutWeeklyScheduleField.hidden = !hasWeekly;
      elements.checkoutWeeklyScheduleField.inert = !hasWeekly;
    }
    if (elements.checkoutDeliveryDay) {
      elements.checkoutDeliveryDay.required = hasWeekly;
      if (!hasWeekly) elements.checkoutDeliveryDay.value = '';
    }
    const subtotalLabel = cadence === 'weekly'
      ? 'Four-delivery wallet cover'
      : cadence === 'mixed'
        ? 'Bag subtotal'
        : 'Subtotal';
    // The grand total is the amount the customer pays into the wallet. A
    // cashback credit increases the projected wallet balance, but must not be
    // presented as an additional payment amount.
    const displayTotal = total;
    const totalLabel = cadence === 'weekly'
      ? 'Amount to pay'
      : cadence === 'mixed'
        ? 'Wallet needed to begin'
        : 'Order total';
    if (elements.cartSubtotalLabel) elements.cartSubtotalLabel.textContent = subtotalLabel;
    if (elements.checkoutSubtotalLabel) elements.checkoutSubtotalLabel.textContent = subtotalLabel;
    if (elements.cartExperienceCreditRow) elements.cartExperienceCreditRow.hidden = credit === 0 && cashback === 0;
    if (elements.checkoutExperienceCreditRow) elements.checkoutExperienceCreditRow.hidden = credit === 0 && cashback === 0;
    if (elements.cartDiscountLabel) elements.cartDiscountLabel.textContent = cashback > 0 ? 'Atulyash cashback' : 'Welcome saving';
    if (elements.checkoutDiscountLabel) elements.checkoutDiscountLabel.textContent = cashback > 0 ? 'Atulyash cashback' : 'Welcome saving';
    if (elements.cartExperienceCredit) elements.cartExperienceCredit.textContent = cashback > 0 ? `+${formatPrice(cashback)}` : `−${formatPrice(credit)}`;
    if (elements.checkoutExperienceCredit) elements.checkoutExperienceCredit.textContent = cashback > 0 ? `+${formatPrice(cashback)}` : `−${formatPrice(credit)}`;
    [
      [elements.cartDeliveryChargeRow, elements.cartDeliveryChargeLabel, elements.cartDeliveryCharge, elements.cartDeliveryChargeNote],
      [elements.checkoutDeliveryChargeRow, elements.checkoutDeliveryChargeLabel, elements.checkoutDeliveryCharge, elements.checkoutDeliveryChargeNote]
    ].forEach(([row, label, amount, note]) => {
      if (row) row.hidden = cart.length === 0;
      if (label) label.textContent = delivery.label;
      if (amount) amount.textContent = delivery.requiresSupport ? 'Contact care' : delivery.amount === 0 ? 'Free' : formatPrice(delivery.amount);
      if (note) note.textContent = delivery.note;
    });
    if (elements.cartTotalLabel) elements.cartTotalLabel.textContent = totalLabel;
    if (elements.checkoutTotalLabel) elements.checkoutTotalLabel.textContent = totalLabel;
    if (elements.cartTotal) elements.cartTotal.textContent = formatPrice(displayTotal);
    if (elements.checkoutTotal) elements.checkoutTotal.textContent = formatPrice(displayTotal);
    renderCouponPanel();
    renderCheckoutPurchaseClarity();
    renderWalletPaymentState();

    if (cartNeedsAuthentication) {
      if (elements.cartAuthGate) elements.cartAuthGate.hidden = false;
      if (elements.cartItems) {
        elements.cartItems.replaceChildren();
        elements.cartItems.hidden = true;
      }
      if (elements.checkoutSummaryItems) elements.checkoutSummaryItems.replaceChildren();
      if (elements.cartEmpty) elements.cartEmpty.hidden = true;
      if (elements.cartPromise) elements.cartPromise.hidden = true;
      if (elements.cartFooter) elements.cartFooter.hidden = true;
      return;
    }

    if (elements.cartAuthGate) elements.cartAuthGate.hidden = true;
    if (elements.cartItems) {
      elements.cartItems.hidden = false;
      elements.cartItems.innerHTML = cart.map(cartItemMarkup).join('');
    }
    if (elements.checkoutSummaryItems) {
      elements.checkoutSummaryItems.innerHTML = cart.length
        ? cart.map(summaryItemMarkup).join('')
        : emptyCheckoutSummaryMarkup();
    }
    if (elements.cartEmpty) elements.cartEmpty.hidden = cart.length > 0 || Boolean(pendingOrder);
    if (elements.cartPromise) elements.cartPromise.hidden = cart.length === 0 && !pendingOrder;
    if (elements.cartFooter) elements.cartFooter.hidden = cart.length === 0 && !pendingOrder;
    if (elements.checkoutButton) {
      const blocked = cartHasConfigurationIssues() && !pendingOrder;
      elements.checkoutButton.disabled = blocked;
      elements.checkoutButton.replaceChildren(
        document.createTextNode(pendingOrder ? `${pendingOrderActionLabel()} ` : 'Proceed to delivery '),
        Object.assign(document.createElement('span'), {
          textContent: '→',
          ariaHidden: 'true'
        })
      );
      if (blocked) {
        elements.checkoutButton.title = 'Remove unavailable items or reconnect the live catalogue before checkout.';
      } else {
        elements.checkoutButton.removeAttribute('title');
      }
    }
  }

  async function updateCartItem(id, action) {
    if (pendingOrder) {
      announce('Complete the pending order payment before changing your bag.');
      return;
    }
    const item = cart.find((candidate) => candidate.id === id);
    if (!item) return;

    if (action === 'increase' && item.quantity >= 20) {
      announce('Maximum quantity for this selection is 20.');
      return;
    }
    const nextQuantity = action === 'increase'
      ? item.quantity + 1
      : action === 'decrease'
        ? item.quantity - 1
        : 0;

    if (serverCartActive && isApiAuthenticated() && item.serverItemId != null) {
      if (cartItemUpdateLocks.has(id)) return;
      cartItemUpdateLocks.add(id);
      [elements.cartItems, elements.checkoutSummaryItems].forEach((container) => {
        container
          ?.querySelectorAll(`[data-cart-id="${CSS.escape(id)}"] button`)
          .forEach((control) => { control.disabled = true; });
      });
      setCartApiStatus('Updating your secure bag…', { state: 'loading' });
      try {
        if (action === 'remove' || nextQuantity < 1) {
          await invokeApi('cart', 'deleteItem', [item.serverItemId], {
            path: `/orders/cart-items/${encodeURIComponent(item.serverItemId)}/`,
            options: { method: 'DELETE', auth: true }
          });
        } else {
          await invokeApi('cart', 'updateItem', [item.serverItemId, { quantity: nextQuantity }], {
            path: `/orders/cart-items/${encodeURIComponent(item.serverItemId)}/`,
            options: {
              method: 'PATCH',
              auth: true,
              body: { quantity: nextQuantity },
              form: true
            }
          });
        }
        await refreshServerCart();
        invalidateCoupons({ reloadOpen: true });
        announce(action === 'remove' || nextQuantity < 1 ? 'Item removed from your bag.' : 'Bag quantity updated.');
      } catch (error) {
        if (isUnauthorizedError(error)) {
          showCartLoginGate();
          return;
        }
        const message = error?.message || 'Your bag could not be updated.';
        setCartApiStatus(message, { state: 'error', retry: true });
        announce(message);
      } finally {
        cartItemUpdateLocks.delete(id);
        const refreshedItem = cart.find((candidate) => candidate.id === id);
        [elements.cartItems, elements.checkoutSummaryItems].forEach((container) => {
          container
            ?.querySelectorAll(`[data-cart-id="${CSS.escape(id)}"] button`)
            .forEach((control) => {
              control.disabled = (
                control.dataset.cartAction === 'increase'
                && numericValue(refreshedItem?.quantity) >= 20
              );
            });
        });
      }
      return;
    }

    if (action === 'increase') item.quantity += 1;
    if (action === 'decrease') item.quantity -= 1;
    if (action === 'remove' || item.quantity < 1) cart = cart.filter((candidate) => candidate.id !== id);

    saveCart();
    invalidateCoupons();
    renderCart();
    announce(action === 'remove' || item.quantity < 1 ? 'Item removed from your bag.' : 'Bag quantity updated.');

    const replacement = elements.cartItems?.querySelector(`[data-cart-id="${CSS.escape(id)}"] [data-cart-action="${action}"]`)
      || elements.checkoutSummaryItems?.querySelector(`[data-cart-id="${CSS.escape(id)}"] [data-cart-action="${action}"]`);
    if (replacement instanceof HTMLElement) replacement.focus();
    else if (elements.checkoutSummaryItems) {
      elements.checkoutSummaryItems.querySelector('.checkout-summary-remove, .checkout-summary-empty a')?.focus();
    }
    else if (cart.length) elements.checkoutButton?.focus();
    else elements.cartCloseButton?.focus();
  }

  function closePrimaryNavigation() {
    const nav = document.getElementById('primaryNav');
    const toggle = document.getElementById('menuToggle');
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    const label = toggle?.querySelector('.sr-only');
    if (label) label.textContent = 'Open navigation';
    document.body.classList.remove('menu-open');
  }

  function setPageBackgroundInert(inert) {
    if (IS_CHECKOUT_PAGE) return;
    document.querySelectorAll('.announcement, .site-header, main, .site-footer').forEach((region) => {
      region.inert = inert;
    });
  }

  function showBackdrop() {
    if (!elements.backdrop) return;
    clearTimeout(backdropTimer);
    elements.backdrop.hidden = false;
    requestAnimationFrame(() => elements.backdrop?.classList.add('is-visible'));
  }

  function hideBackdrop() {
    if (!elements.backdrop) return;
    elements.backdrop.classList.remove('is-visible');
    backdropTimer = window.setTimeout(() => {
      if (!activeLayer) elements.backdrop.hidden = true;
    }, 280);
  }

  function openCart() {
    if (!elements.cartDrawer) return;
    closePrimaryNavigation();
    previousFocus = document.activeElement;
    activeLayer = 'cart';
    setPageBackgroundInert(true);
    document.body.classList.add('commerce-open');
    showBackdrop();
    elements.cartDrawer.inert = false;
    elements.cartDrawer.classList.add('is-open');
    elements.cartDrawer.setAttribute('aria-hidden', 'false');
    window.setTimeout(() => elements.cartCloseButton?.focus(), 40);
    updateMobileBuyBar();
  }

  function closeCart({ keepBackdrop = false, restoreFocus = true } = {}) {
    if (!elements.cartDrawer) return;
    elements.cartDrawer.classList.remove('is-open');
    elements.cartDrawer.setAttribute('aria-hidden', 'true');
    elements.cartDrawer.inert = true;
    if (activeLayer === 'cart') activeLayer = null;
    if (!keepBackdrop) {
      setPageBackgroundInert(false);
      document.body.classList.remove('commerce-open');
      hideBackdrop();
    }
    const returnUrl = keepBackdrop ? '' : cartReturnUrl;
    if (!keepBackdrop) cartReturnUrl = '';
    if (returnUrl) {
      window.location.assign(returnUrl);
      return;
    }
    if (restoreFocus && previousFocus instanceof HTMLElement) previousFocus.focus();
    updateMobileBuyBar();
  }

  function setCheckoutStep(step, { focus = false } = {}) {
    checkoutStep = step;
    document.querySelectorAll('[data-checkout-step]').forEach((panel) => {
      const active = Number(panel.dataset.checkoutStep) === step;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    document.querySelectorAll('[data-checkout-indicator]').forEach((indicator) => {
      const indicatorStep = Number(indicator.dataset.checkoutIndicator);
      indicator.classList.toggle('is-active', indicatorStep <= step);
      if (indicatorStep === step) indicator.setAttribute('aria-current', 'step');
      else indicator.removeAttribute('aria-current');
    });
    const headingId = step === 1 ? 'checkoutTitle' : step === 2 ? 'checkoutDeliveryTitle' : 'reviewTitle';
    elements.checkoutModal?.setAttribute('aria-labelledby', headingId);
    if (focus) {
      const heading = document.getElementById(headingId);
      heading?.setAttribute('tabindex', '-1');
      heading?.focus();
    }
  }

  function resetCheckout() {
    elements.checkoutSuccess.hidden = true;
    elements.checkoutForm.hidden = false;
    elements.checkoutSuccessSkipAnimation?.setAttribute('hidden', '');
    elements.checkoutSuccessCelebration?.classList.remove('is-celebrating', 'is-skipped');
    elements.checkoutConsent.checked = false;
    if (elements.checkoutConsentError) elements.checkoutConsentError.textContent = '';
    elements.checkoutModal?.setAttribute('aria-labelledby', 'checkoutTitle');
    clearCheckoutErrors();
    if (!restoreAuthenticatedCheckout()) resetOtpState({ preserveSession: true });
    selectedAddressId = null;
    selectedDeliveryDate = '';
    availableDeliveryDates = [];
    savedAddresses = [];
    checkoutWalletBalanceGeneration += 1;
    checkoutWalletBalanceAmount = null;
    checkoutWalletReservedAmount = null;
    resetWalletRechargePreview();
    if (elements.checkoutDeliveryDay) elements.checkoutDeliveryDay.value = '';
    if (elements.checkoutDeliveryDate) {
      elements.checkoutDeliveryDate.replaceChildren(new Option('Choose an address first', ''));
    }
    setCheckoutStep(1);
    updateCheckoutDeliveryFlow();
    updateCheckoutAvailabilityAction();
  }

  function openCheckout() {
    if (!cart.length && !pendingOrder) {
      announce('Choose a pack before continuing to delivery.');
      return false;
    }
    if (cartHasConfigurationIssues() && !pendingOrder) {
      announce('Remove unavailable items or reconnect the live catalogue before checkout.');
      return false;
    }

    if (!elements.checkoutModal) {
      return navigateToCheckout(checkoutOriginFromReturnUrl(checkoutReturnUrl || cartReturnUrl));
    }

    if (!checkoutReturnUrl && cartReturnUrl) {
      checkoutReturnUrl = cartReturnUrl;
      cartReturnUrl = '';
    }
    if (!IS_CHECKOUT_PAGE) {
      closePrimaryNavigation();
      const returnTarget = activeLayer === 'cart' ? previousFocus : document.activeElement;
      closeCart({ keepBackdrop: true, restoreFocus: false });
      previousFocus = returnTarget;
      setPageBackgroundInert(true);
      document.body.classList.add('commerce-open');
      showBackdrop();
    }
    activeLayer = 'checkout';
    resetCheckout();
    const firstWeeklyItem = cart.find((item) => item.purchaseType === 'weekly');
    if (elements.checkoutDeliveryDay) {
      const storedDay = firstWeeklyItem ? itemDescriptor(firstWeeklyItem).deliveryDay : '';
      elements.checkoutDeliveryDay.value = DELIVERY_DAYS.includes(storedDay) ? storedDay : '';
    }
    renderCart();
    elements.checkoutModal.inert = false;
    elements.checkoutModal.classList.add('is-open');
    elements.checkoutModal.setAttribute('aria-hidden', 'false');
    elements.checkoutModal.scrollTop = 0;
    if (IS_CHECKOUT_PAGE) window.scrollTo({ top: 0, behavior: 'auto' });
    if (pendingOrder) {
      setOrderInteractionLocked(false);
      if (elements.checkoutPlaceOrderStatus) elements.checkoutPlaceOrderStatus.hidden = false;
      if (elements.checkoutPlaceOrderStatusLabel) {
        elements.checkoutPlaceOrderStatusLabel.textContent = pendingOrderStatusText();
      }
      setAsyncButton(elements.placeOrderButton, false, '', pendingOrderActionLabel());
    }
    const verifiedSession = isOtpVerified();
    const openingStep = pendingOrder && verifiedSession ? 3 : verifiedSession ? 2 : 1;
    window.setTimeout(async () => {
      setCheckoutStep(openingStep, { focus: true });
      if (openingStep !== 2) return;
      const results = await Promise.allSettled([
        loadSavedAddresses(),
        loadWalletBalance()
      ]);
      const addressFailure = results[0]?.status === 'rejected' ? results[0].reason : null;
      if (addressFailure) {
        showCheckoutError(addressFailure?.message || 'Your saved addresses could not be loaded. Try again below.');
      }
    }, 50);
    updateMobileBuyBar();
    return true;
  }

  function closeCheckout() {
    if (!elements.checkoutModal) return;
    if (orderInFlight) {
      announce('Please wait for the current secure order step to finish.');
      return;
    }
    if (IS_CHECKOUT_PAGE) {
      clearOtpResendTimer();
      activeLayer = null;
      const context = readCheckoutContext();
      const returnUrl = checkoutReturnUrl || checkoutReturnForOrigin(context.origin);
      checkoutReturnUrl = '';
      clearCheckoutContext();
      window.location.assign(returnUrl);
      return;
    }
    elements.checkoutModal.classList.remove('is-open');
    elements.checkoutModal.setAttribute('aria-hidden', 'true');
    elements.checkoutModal.inert = true;
    clearOtpResendTimer();
    if (activeLayer === 'checkout') activeLayer = null;
    setPageBackgroundInert(false);
    document.body.classList.remove('commerce-open');
    hideBackdrop();
    const returnUrl = checkoutReturnUrl;
    checkoutReturnUrl = '';
    if (returnUrl) {
      window.location.assign(returnUrl);
      return;
    }
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
    updateMobileBuyBar();
  }

  function closeActiveLayer() {
    if (orderInFlight) {
      announce('Please wait for the current secure order step to finish.');
      return;
    }
    if (activeLayer === 'checkout') closeCheckout();
    else if (activeLayer === 'cart') closeCart();
  }

  function clearCheckoutErrors() {
    if (elements.checkoutErrorSummary) {
      elements.checkoutErrorSummary.hidden = true;
      elements.checkoutErrorSummary.textContent = '';
    }
    elements.checkoutForm?.querySelectorAll('.checkout-field').forEach((field) => field.classList.remove('has-error'));
    elements.checkoutForm?.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
    elements.checkoutForm?.querySelectorAll('[aria-describedby]').forEach((field) => {
      if (field.id === 'checkoutConsent') return;
      const remainingIds = (field.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter(Boolean)
        .filter((id) => id !== `${field.id}Error`);
      if (remainingIds.length) field.setAttribute('aria-describedby', remainingIds.join(' '));
      else field.removeAttribute('aria-describedby');
    });
    elements.checkoutForm?.querySelectorAll('.field-error').forEach((error) => { error.textContent = ''; });
  }

  function fieldValue(id) {
    const field = document.getElementById(id);
    return field ? field.value.trim() : '';
  }

  function maskedPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '').slice(-10);
    return digits.length === 10 ? `+91 ••••••${digits.slice(-4)}` : '+91 ••••••0000';
  }

  function formattedPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '').slice(-10);
    return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : '+91';
  }

  function isOtpVerified() {
    return authOtpState === 'verified'
      && isApiAuthenticated()
      && authVerifiedPhone === fieldValue('checkoutPhone');
  }

  function clearOtpError() {
    if (elements.checkoutOtpError) elements.checkoutOtpError.textContent = '';
    elements.checkoutOtp?.removeAttribute('aria-invalid');
    elements.checkoutOtp?.closest('.checkout-field')?.classList.remove('has-error');
  }

  function setOtpError(message) {
    if (elements.checkoutOtpError) elements.checkoutOtpError.textContent = message;
    if (elements.checkoutOtp) {
      elements.checkoutOtp.setAttribute('aria-invalid', 'true');
      elements.checkoutOtp.setAttribute('aria-describedby', 'checkoutOtpHelp checkoutOtpError');
    }
    elements.checkoutOtp?.closest('.checkout-field')?.classList.add('has-error');
    elements.checkoutOtp?.focus();
    elements.checkoutOtp?.select();
  }

  function renderOtpState({ focus = false } = {}) {
    const checkingCode = authOtpState === 'otp';
    const verified = authOtpState === 'verified';

    if (elements.checkoutIdentityDetailsView) {
      elements.checkoutIdentityDetailsView.hidden = checkingCode || verified;
      elements.checkoutIdentityDetailsView.inert = checkingCode || verified;
    }
    if (elements.checkoutOtpView) {
      elements.checkoutOtpView.hidden = !checkingCode;
      elements.checkoutOtpView.inert = !checkingCode;
    }
    if (elements.checkoutOtpVerifiedView) {
      elements.checkoutOtpVerifiedView.hidden = !verified;
      elements.checkoutOtpVerifiedView.inert = !verified;
    }
    if (elements.checkoutPhone) elements.checkoutPhone.readOnly = checkingCode || verified;
    if (elements.checkoutOtpPhone) {
      elements.checkoutOtpPhone.textContent = maskedPhone(authPendingPhone || fieldValue('checkoutPhone'));
    }
    if (elements.checkoutVerifiedPhone) {
      elements.checkoutVerifiedPhone.textContent = formattedPhone(authVerifiedPhone || fieldValue('checkoutPhone'));
    }
    if (elements.checkoutIdentitySubmitLabel) {
      elements.checkoutIdentitySubmitLabel.textContent = checkingCode
        ? 'Verify OTP'
        : verified
          ? 'Continue to delivery'
          : 'Send secure OTP';
    }

    if (!focus) return;
    if (checkingCode) {
      elements.checkoutOtp?.focus();
    } else if (verified) {
      elements.checkoutOtpVerifiedTitle?.focus();
    }
  }

  function clearOtpResendTimer() {
    window.clearInterval(otpResendTimer);
    otpResendTimer = null;
    otpResendAvailableAt = 0;
    if (elements.checkoutOtpResendTimer) elements.checkoutOtpResendTimer.hidden = true;
    if (elements.checkoutResetOtpButton) elements.checkoutResetOtpButton.disabled = false;
    if (elements.checkoutResendOtpLabel) elements.checkoutResendOtpLabel.textContent = 'Resend OTP';
  }

  function startOtpResendTimer(seconds = 30) {
    clearOtpResendTimer();
    otpResendAvailableAt = Date.now() + (seconds * 1000);
    const update = () => {
      const remaining = Math.max(0, Math.ceil((otpResendAvailableAt - Date.now()) / 1000));
      if (remaining <= 0) {
        clearOtpResendTimer();
        if (elements.checkoutOtpResendStatus) elements.checkoutOtpResendStatus.textContent = 'Didn’t receive the code?';
        return;
      }
      if (elements.checkoutResetOtpButton) elements.checkoutResetOtpButton.disabled = true;
      if (elements.checkoutResendOtpLabel) elements.checkoutResendOtpLabel.textContent = `Resend in ${remaining}s`;
      if (elements.checkoutOtpResendTimer) {
        elements.checkoutOtpResendTimer.hidden = false;
        elements.checkoutOtpResendTimer.dateTime = `PT${remaining}S`;
        elements.checkoutOtpResendTimer.textContent = `${remaining} seconds`;
      }
    };
    update();
    otpResendTimer = window.setInterval(update, 1000);
  }

  function resetOtpState({
    clearPhone = false,
    focusPhone = false,
    message = '',
    preserveSession = false
  } = {}) {
    authOtpState = 'details';
    authPendingPhone = '';
    authVerifiedPhone = '';
    checkoutProfilePhone = '';
    if (elements.checkoutOtp) elements.checkoutOtp.value = '';
    if (clearPhone && elements.checkoutPhone) elements.checkoutPhone.value = '';
    clearOtpResendTimer();
    clearOtpError();
    if (!preserveSession && clearPhone) {
      API?.auth?.logout?.();
      apiSession = null;
      serverCartActive = false;
      serverCartId = null;
      serverCartSummary = null;
    }
    if (elements.checkoutOtpStatus) elements.checkoutOtpStatus.textContent = message;
    renderOtpState();
    if (focusPhone) {
      elements.checkoutPhone?.focus();
      elements.checkoutPhone?.select();
    }
  }

  function sessionPhone(session = getApiSession()) {
    let accountMetaMobile = '';
    try {
      accountMetaMobile = JSON.parse(sessionStorage.getItem('atulyash-account-meta-v1') || '{}')?.mobile || '';
    } catch (error) {
      accountMetaMobile = '';
    }
    const candidates = [
      session?.mobile,
      session?.phone,
      session?.phone_number,
      session?.user?.phone_number,
      session?.user?.mobile,
      accountMetaMobile
    ];
    return String(candidates.find(Boolean) || '').replace(/\D/g, '').slice(-10);
  }

  function restoreAuthenticatedCheckout() {
    apiSession = getApiSession();
    if (!isApiAuthenticated() || !sessionHasVerifiedIdentity(apiSession)) {
      resetOtpState({ preserveSession: true });
      return false;
    }
    const phone = sessionPhone(apiSession) || fieldValue('checkoutPhone');
    if (phone && elements.checkoutPhone) elements.checkoutPhone.value = phone;
    authOtpState = 'verified';
    authPendingPhone = phone;
    authVerifiedPhone = phone;
    checkoutProfilePhone = phone;
    if (elements.checkoutOtpStatus) {
      elements.checkoutOtpStatus.textContent = sessionHasVerifiedIdentity(apiSession)
        ? 'Your secure Atulyash session is active.'
        : 'Verify your mobile to continue with your Atulyash account.';
    }
    renderOtpState();
    return true;
  }

  async function requestOtp({ resend = false } = {}) {
    if (otpRequestInFlight) return;
    if (!validateIdentity()) return;
    const phone = fieldValue('checkoutPhone');
    otpRequestInFlight = true;
    setAsyncButton(
      resend ? elements.checkoutResetOtpButton : elements.checkoutIdentitySubmit,
      true,
      resend ? 'Sending…' : 'Sending OTP…',
      resend ? 'Resend OTP' : 'Send secure OTP'
    );
    clearOtpError();
    if (elements.checkoutOtpStatus) elements.checkoutOtpStatus.textContent = 'Requesting a secure OTP…';
    try {
      await invokeApi('auth', 'requestOtp', [phone, { isRider: false }], {
        path: '/users/otp/request/',
        options: {
          method: 'POST',
          auth: false,
          body: { mobile: phone, is_rider: false },
          form: true
        }
      });
      authOtpState = 'otp';
      authPendingPhone = phone;
      authVerifiedPhone = '';
      checkoutProfilePhone = '';
      if (elements.checkoutOtp) elements.checkoutOtp.value = '';
      if (elements.checkoutOtpStatus) {
        elements.checkoutOtpStatus.textContent = resend
          ? 'A new OTP has been sent to your mobile.'
          : 'OTP sent. Enter the 4-digit code to continue.';
      }
      startOtpResendTimer();
      renderOtpState({ focus: true });
    } catch (error) {
      if (elements.checkoutOtpStatus) elements.checkoutOtpStatus.textContent = '';
      showCheckoutValidationErrors([[
        elements.checkoutPhone,
        error?.message || 'We could not send an OTP. Check the number and try again.'
      ]]);
    } finally {
      otpRequestInFlight = false;
      setAsyncButton(
        resend ? elements.checkoutResetOtpButton : elements.checkoutIdentitySubmit,
        false,
        '',
        resend ? 'Resend OTP' : authOtpState === 'otp' ? 'Verify OTP' : 'Send secure OTP'
      );
    }
  }

  async function updateAuthenticatedProfile() {
    const userId = sessionIdentifier('userId');
    if (!userId) return;
    const name = fieldValue('checkoutName');
    const email = fieldValue('checkoutEmail');
    if (!name && !email) return;
    try {
      await invokeApi('profile', 'updateUser', [userId, { name, email }], {
        path: `/users/users/${encodeURIComponent(userId)}/`,
        options: {
          method: 'PATCH',
          auth: true,
          body: { name, ...(email ? { email } : {}) },
          form: true
        }
      });
    } catch (error) {
      // Profile enrichment is helpful but should not invalidate a successful login.
    }
  }

  async function verifyOtp() {
    if (otpVerifyInFlight) return;
    if (!authPendingPhone || fieldValue('checkoutPhone') !== authPendingPhone) {
      resetOtpState({
        clearPhone: true,
        focusPhone: true,
        message: 'The mobile number changed. Request a new OTP.'
      });
      return;
    }

    const code = (elements.checkoutOtp?.value || '').replace(/\D/g, '').slice(0, 4);
    if (elements.checkoutOtp) elements.checkoutOtp.value = code;
    clearOtpError();
    if (code.length !== 4) {
      setOtpError('Enter all 4 digits of the OTP.');
      return;
    }

    otpVerifyInFlight = true;
    setAsyncButton(elements.checkoutOtpVerifyButton, true, 'Verifying…', 'Verify OTP');
    setAsyncButton(elements.checkoutIdentitySubmit, true, 'Verifying…', 'Verify OTP');
    if (elements.checkoutOtpStatus) elements.checkoutOtpStatus.textContent = 'Verifying your mobile securely…';
    try {
      await invokeApi('auth', 'verifyOtp', [authPendingPhone, code, { isRider: false }], {
        path: '/users/otp/verify/',
        options: {
          method: 'POST',
          auth: false,
          body: { mobile: authPendingPhone, otp: code, is_rider: false },
          form: true
        }
      });
      apiSession = getApiSession();
      if (!isApiAuthenticated()) {
        throw new Error('The login response did not include a usable access token.');
      }
      if (!sessionHasVerifiedIdentity(apiSession)) {
        throw new Error('The login response did not include user, customer, and cart IDs. Please try again.');
      }
      authOtpState = 'verified';
      authVerifiedPhone = authPendingPhone;
      checkoutProfilePhone = authVerifiedPhone;
      if (elements.checkoutOtp) elements.checkoutOtp.value = '';
      clearOtpError();
      clearOtpResendTimer();
      if (elements.checkoutOtpStatus) {
        elements.checkoutOtpStatus.textContent = 'Mobile verified. Your Atulyash account is ready.';
      }
      renderOtpState({ focus: true });
    } catch (error) {
      if (elements.checkoutOtpStatus) elements.checkoutOtpStatus.textContent = '';
      setOtpError(error?.message || 'The OTP is incorrect or expired. Try the latest code.');
    } finally {
      otpVerifyInFlight = false;
      setAsyncButton(elements.checkoutOtpVerifyButton, false, '', 'Verify OTP');
      setAsyncButton(
        elements.checkoutIdentitySubmit,
        false,
        '',
        authOtpState === 'verified' ? 'Continue to delivery' : 'Verify OTP'
      );
    }
  }

  async function changeCheckoutMobile() {
    try {
      await API?.auth?.logout?.();
    } catch (error) {
      API?.clearSession?.('checkout-number-change');
    }
    apiSession = null;
    serverCartActive = false;
    serverCartId = null;
    serverCartSummary = null;
    resetOtpState({
      clearPhone: true,
      focusPhone: true,
      preserveSession: true,
      message: 'Enter the mobile number you want to use for this order.'
    });
    updateAccountHeader();
  }

  function setFieldError(field, message) {
    if (!field) return;
    field.setAttribute('aria-invalid', 'true');
    const wrapper = field.closest('.checkout-field');
    wrapper?.classList.add('has-error');
    const error = wrapper?.querySelector('.field-error');
    if (error) {
      if (!error.id) error.id = `${field.id}Error`;
      error.textContent = message;
      const describedBy = new Set((field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
      describedBy.add(error.id);
      field.setAttribute('aria-describedby', [...describedBy].join(' '));
    }
  }

  function showCheckoutValidationErrors(errors) {
    errors.forEach(([field, message]) => setFieldError(field, message));
    if (errors.length && elements.checkoutErrorSummary) {
      elements.checkoutErrorSummary.textContent = `Please correct ${errors.length} ${errors.length === 1 ? 'detail' : 'details'} before continuing.`;
      elements.checkoutErrorSummary.hidden = false;
      elements.checkoutErrorSummary.focus();
    }
    return errors.length === 0;
  }

  function showCheckoutError(message) {
    if (!elements.checkoutErrorSummary) {
      announce(message);
      return;
    }
    elements.checkoutErrorSummary.textContent = message;
    elements.checkoutErrorSummary.hidden = false;
    elements.checkoutErrorSummary.focus();
  }

  function validateIdentity() {
    clearCheckoutErrors();
    const fields = {
      name: document.getElementById('checkoutName'),
      phone: document.getElementById('checkoutPhone'),
      email: document.getElementById('checkoutEmail')
    };
    const errors = [];

    if (!fields.name.value.trim()) errors.push([fields.name, 'Please enter your full name.']);
    if (!/^\d{10}$/.test(fields.phone.value.trim())) errors.push([fields.phone, 'Enter a valid 10-digit mobile number.']);
    if (fields.email.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.value.trim())) errors.push([fields.email, 'Enter a valid email address.']);

    return showCheckoutValidationErrors(errors);
  }

  function validateDelivery({ requireDate = true, requireSchedule = true } = {}) {
    clearCheckoutErrors();
    const fields = {
      address: document.getElementById('checkoutAddress'),
      building: document.getElementById('checkoutBuilding'),
      pincode: document.getElementById('checkoutPincode'),
      area: document.getElementById('checkoutArea'),
      otherArea: document.getElementById('checkoutOtherArea'),
      city: document.getElementById('checkoutCity'),
      state: document.getElementById('checkoutState'),
      deliveryDay: document.getElementById('checkoutDeliveryDay'),
      deliveryDate: document.getElementById('checkoutDeliveryDate')
    };
    const errors = [];

    if (!selectedAddressId) {
      if (!fields.address.value.trim()) errors.push([fields.address, 'Please enter your house or flat number.']);
      if (!fields.building.value.trim()) errors.push([fields.building, 'Please enter the building or street.']);
      if (!/^\d{6}$/.test(fields.pincode.value.trim())) errors.push([fields.pincode, 'Enter a valid 6-digit PIN code.']);
      const areaChoice = String(fields.area?.value || '');
      const isCustomArea = areaChoice === CHECKOUT_OTHER_AREA_VALUE;
      const areaName = isCustomArea ? String(fields.otherArea?.value || '').trim() : areaChoice.trim();
      if (!areaName) {
        errors.push([
          isCustomArea ? fields.otherArea : fields.area,
          isCustomArea ? 'Enter your area or locality.' : 'Choose an area or select Others.'
        ]);
      }
      if (!fields.city.value.trim()) errors.push([fields.city, 'Please enter your city.']);
      const pincode = fields.pincode.value.trim();
      const stateMatchesPincode = checkoutStateMatchesPincode(pincode);
      if (!stateMatchesPincode) {
        errors.push([fields.pincode, 'Verify this PIN code to confirm its matching state before continuing.']);
      }
    }
    const hasWeekly = cart.some((item) => item.purchaseType === 'weekly');
    if (hasWeekly && requireSchedule && !DELIVERY_DAYS.includes(fields.deliveryDay.value)) {
      errors.push([fields.deliveryDay, 'Please choose your preferred weekly delivery day.']);
    }
    if (requireDate && !fields.deliveryDate.value) {
      errors.push([fields.deliveryDate, 'Please choose an available delivery date.']);
    }
    if (
      hasWeekly
      && fields.deliveryDay.value
      && fields.deliveryDate.value
      && deliveryDateWeekday(fields.deliveryDate.value) !== fields.deliveryDay.value
    ) {
      errors.push([fields.deliveryDate, `Choose a ${fields.deliveryDay.value} delivery date.`]);
    }

    return showCheckoutValidationErrors(errors);
  }

  function addressDisplay(address) {
    return [
      address?.house_name || address?.house_number,
      address?.tower_wing || address?.building,
      address?.landmark,
      address?.area,
      address?.city,
      address?.state,
      address?.pincode
    ].filter(Boolean).join(', ');
  }

  function selectedSavedAddress() {
    return savedAddresses.find((address) => String(address.id) === String(selectedAddressId)) || null;
  }

  function checkoutAreaIsCustom() {
    return String(elements.checkoutArea?.value || '') === CHECKOUT_OTHER_AREA_VALUE;
  }

  function selectedCheckoutArea() {
    return checkoutAreaIsCustom()
      ? String(elements.checkoutOtherArea?.value || '').trim()
      : String(elements.checkoutArea?.value || '').trim();
  }

  function syncCheckoutCustomAreaField() {
    const isCustom = checkoutAreaIsCustom();
    if (elements.checkoutOtherAreaField) {
      elements.checkoutOtherAreaField.hidden = !isCustom;
      elements.checkoutOtherAreaField.inert = !isCustom;
    }
    if (elements.checkoutOtherArea) elements.checkoutOtherArea.required = isCustom;
  }

  function resetCheckoutAreaOptions(message = 'Enter a six-digit PIN code first') {
    const field = elements.checkoutAreaField;
    const select = elements.checkoutArea;
    if (!field || !select) return;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = message;
    placeholder.disabled = true;
    placeholder.selected = true;
    select.replaceChildren(placeholder);
    select.disabled = true;
    select.value = '';
    field.hidden = true;
    field.inert = true;
    if (elements.checkoutOtherArea) {
      elements.checkoutOtherArea.value = '';
      elements.checkoutOtherArea.required = false;
      elements.checkoutOtherArea.removeAttribute('aria-invalid');
    }
    if (elements.checkoutOtherAreaField) {
      elements.checkoutOtherAreaField.hidden = true;
      elements.checkoutOtherAreaField.inert = true;
    }
  }

  function renderCheckoutGoogleAreas(result) {
    const field = elements.checkoutAreaField;
    const select = elements.checkoutArea;
    if (!field || !select) return '';
    const rawAreas = result?.areas || result?.available_areas || result?.serviceable_areas || result?.area_options || [];
    const areas = [...new Set((Array.isArray(rawAreas) ? rawAreas : []).map((area) => {
      if (area && typeof area === 'object') return String(area.name || area.area || area.label || area.locality || '').trim();
      return String(area || '').trim();
    }).filter(Boolean))];
    const current = select.value;
    const options = areas.map((area) => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = area;
      return option;
    });
    const otherOption = document.createElement('option');
    otherOption.value = CHECKOUT_OTHER_AREA_VALUE;
    otherOption.textContent = 'Others';
    options.push(otherOption);
    const selected = current === CHECKOUT_OTHER_AREA_VALUE
      ? CHECKOUT_OTHER_AREA_VALUE
      : (areas.includes(current)
        ? current
        : (areas.includes(result?.selectedArea) ? result.selectedArea : (areas[0] || CHECKOUT_OTHER_AREA_VALUE)));
    select.replaceChildren(...options);
    select.disabled = false;
    select.value = selected;
    field.hidden = false;
    field.inert = false;
    syncCheckoutCustomAreaField();
    return selected;
  }

  function checkoutStateFromLookup(value, stateField) {
    const key = String(value || '').trim().toLocaleLowerCase('en-IN')
      .replace(/,\s*india$/i, '')
      .replace(/[^a-z]/g, '');
    const aliases = {
      delhi: 'Delhi',
      newdelhi: 'Delhi',
      nctofdelhi: 'Delhi',
      nationalcapitalterritoryofdelhi: 'Delhi',
      haryana: 'Haryana',
      hr: 'Haryana',
      punjab: 'Punjab',
      pb: 'Punjab',
      rajasthan: 'Rajasthan',
      rj: 'Rajasthan',
      uttarpradesh: 'Uttar Pradesh',
      up: 'Uttar Pradesh'
    };
    const canonical = aliases[key];
    if (!canonical) return '';
    return [...stateField.options].find((option) => option.value === canonical)?.value || '';
  }

  function setGoogleAddressContext(result, pincode) {
    const normalizedPincode = String(pincode || '').replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(normalizedPincode) || normalizedPincode !== String(elements.checkoutPincode?.value || '')) return false;
    const city = String(result?.city || '').trim();
    const state = String(result?.state || '').trim();
    const cityField = document.getElementById('checkoutCity');
    const stateField = document.getElementById('checkoutState');
    // City is server-derived from the PIN code. Keep it synchronized even
    // when the customer changes the PIN after a previous lookup.
    if (city && cityField) cityField.value = city;
    if (state && stateField) {
      const canonicalState = checkoutStateFromLookup(state, stateField);
      if (!canonicalState) {
        checkoutVerifiedState = '';
        checkoutVerifiedStatePincode = '';
        stateField.value = '';
        stateField.disabled = true;
        return false;
      }
      stateField.value = canonicalState;
      stateField.disabled = true;
      checkoutVerifiedState = canonicalState;
      checkoutVerifiedStatePincode = normalizedPincode;
    }
    return Boolean(
      checkoutVerifiedState
      && checkoutVerifiedStatePincode === normalizedPincode
      && stateField?.value === checkoutVerifiedState
    );
  }

  function checkoutStateMatchesPincode(pincodeValue = fieldValue('checkoutPincode')) {
    const pincode = String(pincodeValue || '').trim();
    const stateField = document.getElementById('checkoutState');
    return Boolean(
      checkoutVerifiedState
      && checkoutVerifiedStatePincode === pincode
      && stateField?.value === checkoutVerifiedState
    );
  }

  async function lookupCheckoutArea(pincode) {
    const normalizedPincode = String(pincode || '').replace(/\D/g, '').slice(0, 6);
    const request = ++checkoutAreaLookupRequest;
    if (!/^\d{6}$/.test(normalizedPincode)) {
      resetCheckoutAreaOptions();
      return null;
    }
    const field = elements.checkoutAreaField;
    const select = elements.checkoutArea;
    if (field && select) {
      const loadingOption = document.createElement('option');
      loadingOption.value = '';
      loadingOption.textContent = 'Finding your area…';
      loadingOption.disabled = true;
      loadingOption.selected = true;
      select.replaceChildren(loadingOption);
      select.disabled = true;
      field.hidden = false;
      field.inert = false;
    }
    renderPincodeServiceability('checking', {
      title: 'Finding your area',
      message: `Looking up the locality for PIN ${normalizedPincode}…`
    });

    try {
      const serviceability = await invokeApi('pincodes', 'serviceability', [normalizedPincode], {
        path: '/pincodes/pincode/serviceability/',
        options: { method: 'GET', auth: false, cache: 'no-store', query: { pincode: normalizedPincode } }
      });
      let result = serviceability?.data && typeof serviceability.data === 'object' ? serviceability.data : serviceability;
      if (request !== checkoutAreaLookupRequest || normalizedPincode !== String(elements.checkoutPincode?.value || '')) return null;
      const responsePincode = String(result?.pincode || '').replace(/\D/g, '').slice(0, 6);
      if (responsePincode && responsePincode !== normalizedPincode) {
        throw new Error(`The PIN lookup returned ${responsePincode} instead of ${normalizedPincode}. Please try again.`);
      }
      // Never reuse areas from a previous lookup when the current PIN is not
      // serviceable. Stop before querying the optional area-list endpoint.
      if (result?.serviceable === false) {
        resetCheckoutAreaOptions('Delivery is not available for this PIN');
        renderPincodeServiceability('error', {
          title: 'We do not deliver here yet',
          message: `PIN ${normalizedPincode} is not currently serviceable. Please use another delivery address.`
        });
        return null;
      }
      const returnedAreas = result?.areas || result?.available_areas || result?.serviceable_areas || result?.area_options;
      if (!Array.isArray(returnedAreas) || !returnedAreas.length) {
        try {
          const areaResponse = await invokeApi('pincodes', 'areas', [normalizedPincode], {
            path: '/pincodes/area/',
            options: { method: 'GET', auth: false, cache: 'no-store', query: { pincode: normalizedPincode } }
          });
          const areaData = areaResponse?.data && typeof areaResponse.data === 'object' ? areaResponse.data : areaResponse;
          const areas = areaData?.areas || areaData?.results || areaData?.data || areaData;
          if (Array.isArray(areas)) result = { ...result, areas };
        } catch (_areaError) {
          // The serviceability response remains authoritative if the area list endpoint is unavailable.
        }
      }
      if (request !== checkoutAreaLookupRequest || normalizedPincode !== String(elements.checkoutPincode?.value || '')) return null;
      const area = renderCheckoutGoogleAreas(result);
      if (!area) throw new Error('Choose an area, or select Others to enter your locality.');
      setGoogleAddressContext(result, normalizedPincode);
      await checkPincodeServiceability({ force: true });
      return result;
    } catch (error) {
      if (request !== checkoutAreaLookupRequest) return null;
      resetCheckoutAreaOptions('No delivery areas returned for this PIN');
      renderPincodeServiceability('error', {
        title: 'Area could not be identified',
        message: error?.message || 'Please check the PIN code and try again.'
      });
      return null;
    }
  }

  function renderPincodeServiceability(state = 'idle', {
    title = 'Verify delivery availability',
    message = 'Enter your six-digit PIN code.'
  } = {}) {
    if (!elements.checkoutPincodeServiceability) return;
    elements.checkoutPincodeServiceability.dataset.state = state;
    if (elements.checkoutPincodeTitle) elements.checkoutPincodeTitle.textContent = title;
    if (elements.checkoutPincodeStatus) elements.checkoutPincodeStatus.textContent = message;
    if (elements.checkoutPincodeCheckButton) {
      elements.checkoutPincodeCheckButton.hidden = state === 'auth' || state === 'success';
      elements.checkoutPincodeCheckButton.disabled = pincodeCheckInFlight;
      elements.checkoutPincodeCheckButton.textContent = pincodeCheckInFlight
        ? 'Checking…'
        : 'Verify PIN code';
      elements.checkoutPincodeCheckButton.setAttribute('aria-busy', String(pincodeCheckInFlight));
    }
    if (elements.checkoutPincodeLoginLink) elements.checkoutPincodeLoginLink.hidden = state !== 'auth';
    updateCheckoutAvailabilityAction();
  }

  function resetPincodeServiceability() {
    checkedServiceabilityPincode = '';
    checkedServiceabilityArea = '';
    checkedServiceabilityResult = null;
    renderPincodeServiceability();
  }

  async function checkPincodeServiceability({ force = false } = {}) {
    const pincode = String(elements.checkoutPincode?.value || '').replace(/\D/g, '').slice(0, 6);
    if (elements.checkoutPincode) elements.checkoutPincode.value = pincode;
    if (!/^\d{6}$/.test(pincode)) {
      checkedServiceabilityPincode = '';
      checkedServiceabilityArea = '';
      checkedServiceabilityResult = false;
      setFieldError(elements.checkoutPincode, 'Enter a valid 6-digit PIN code.');
      renderPincodeServiceability('error', {
        title: 'PIN code incomplete',
        message: 'Enter all six digits to check live delivery coverage.'
      });
      return false;
    }
    const areaChoice = String(elements.checkoutArea?.value || '').trim();
    const area = selectedCheckoutArea();
    if (!areaChoice || !area) {
      setFieldError(elements.checkoutArea, 'We could not identify your area. Check the PIN code again.');
      renderPincodeServiceability('error', {
        title: 'Area needed',
        message: checkoutAreaIsCustom()
          ? 'Enter your locality so we can verify delivery coverage there.'
          : 'Wait for Atulyash to return the available areas for this PIN code.'
      });
      return false;
    }
    if (
      !force
      && checkedServiceabilityPincode === pincode
      && checkedServiceabilityArea === area
      && checkedServiceabilityResult !== null
    ) {
      return checkedServiceabilityResult;
    }
    const request = ++checkoutServiceabilityRequest;
    pincodeCheckInFlight = true;
    renderPincodeServiceability('checking', {
      title: 'Checking your PIN code',
      message: `Confirming live Atulyash delivery coverage for ${pincode}…`
    });
    try {
      const query = { pincode, area };
      const payload = await invokeApi('pincodes', 'serviceability', [pincode], {
        path: '/pincodes/pincode/serviceability/',
        options: { method: 'GET', auth: false, cache: 'no-store', query }
      });
      const result = payload?.data && typeof payload.data === 'object' ? payload.data : payload;
      if (
        request !== checkoutServiceabilityRequest
        || pincode !== String(elements.checkoutPincode?.value || '')
        || area !== selectedCheckoutArea()
      ) return null;
      const responsePincode = String(result?.pincode || '').replace(/\D/g, '').slice(0, 6);
      if (responsePincode && responsePincode !== pincode) {
        throw new Error(`The PIN lookup returned ${responsePincode} instead of ${pincode}. Please verify the PIN again.`);
      }
      if (result?.serviceable === true && !setGoogleAddressContext(result, pincode)) {
        throw new Error('We could not confirm the state for this PIN code. Please verify the PIN again.');
      }
      checkedServiceabilityPincode = pincode;
      checkedServiceabilityArea = area;
      checkedServiceabilityResult = result?.serviceable === true;
      if (checkedServiceabilityResult) {
        renderPincodeServiceability('success', {
          title: 'Fresh-batch delivery is available',
          message: area
            ? `${area}, ${pincode} is inside the current Atulyash delivery area. State: ${checkoutVerifiedState}.`
            : `PIN ${pincode} is covered. State: ${checkoutVerifiedState}; your entered locality will be saved with this delivery address.`
        });
        return true;
      }
      const areaNotServiceable = String(result?.code || result?.serviceability_reason || '')
        .toUpperCase() === 'AREA_NOT_SERVICEABLE';
      if (areaNotServiceable) {
        renderPincodeServiceability('error', {
          title: 'This area is not serviceable yet',
          message: `Atulyash does not currently deliver to ${area}, PIN ${pincode}. Choose another locality or delivery address.`
        });
        return false;
      }
      resetCheckoutAreaOptions('Delivery is not available for this PIN');
      renderPincodeServiceability('error', {
        title: 'We do not deliver here yet',
        message: `PIN ${pincode} is not currently serviceable. Please use another delivery address.`
      });
      return false;
    } catch (error) {
      if (
        request !== checkoutServiceabilityRequest
        || pincode !== String(elements.checkoutPincode?.value || '')
        || area !== selectedCheckoutArea()
      ) return null;
      checkedServiceabilityPincode = pincode;
      checkedServiceabilityArea = area;
      checkedServiceabilityResult = null;
      renderPincodeServiceability('error', {
        title: 'Coverage could not be checked',
        message: error?.message || 'The live PIN-code service is unavailable. Please try again.'
      });
      return null;
    } finally {
      if (request === checkoutServiceabilityRequest) {
        pincodeCheckInFlight = false;
        const state = elements.checkoutPincodeServiceability?.dataset.state || 'idle';
        renderPincodeServiceability(state, {
          title: elements.checkoutPincodeTitle?.textContent,
          message: elements.checkoutPincodeStatus?.textContent
        });
      }
    }
  }

  async function ensurePincodeServiceability() {
    const result = await checkPincodeServiceability();
    if (result === true) return true;
    const currentMessage = String(elements.checkoutPincodeStatus?.textContent || '').trim();
    if (result === false) {
      showCheckoutError(currentMessage || 'This PIN code is not currently serviceable. Please use another delivery address.');
      return false;
    }
    showCheckoutError(currentMessage || 'We could not verify this PIN code from the live service. Check it again before saving the address.');
    return false;
  }

  function setNewAddressMode(enabled) {
    if (elements.checkoutNewAddressFields) {
      elements.checkoutNewAddressFields.hidden = !enabled;
      elements.checkoutNewAddressFields.inert = !enabled;
    }
    if (elements.checkoutAddAddressButton) {
      elements.checkoutAddAddressButton.setAttribute('aria-expanded', String(enabled));
      elements.checkoutAddAddressButton.textContent = enabled ? 'Use a saved address' : 'Add a new address';
    }
    if (enabled) {
      selectedAddressId = null;
      resetPincodeServiceability();
      resetCheckoutAreaOptions();
      elements.checkoutAddressList
        ?.querySelectorAll('input[name="saved_address"]')
        .forEach((input) => { input.checked = false; });
      elements.checkoutAddressList
        ?.querySelectorAll('.checkout-address-card')
        .forEach((card) => card.classList.remove('is-selected'));
      renderAvailableDeliveryDates([]);
      if (elements.checkoutDeliveryAvailabilityStatus) {
        elements.checkoutDeliveryAvailabilityStatus.textContent = 'Complete the new address, then check available dates.';
      }
    } else {
      const preferred = savedAddresses.find((address) => address.is_default) || savedAddresses[0];
      selectedAddressId = preferred?.id ?? null;
      renderSavedAddresses();
      if (selectedAddressId) loadDeliveryAvailability();
    }
    updateCheckoutDeliveryFlow();
    updateCheckoutAvailabilityAction();
  }

  function renderSavedAddresses() {
    if (!elements.checkoutAddressList) return;
    const fragment = document.createDocumentFragment();
    savedAddresses.forEach((address, index) => {
      const label = document.createElement('label');
      label.className = 'checkout-address-option checkout-address-card';
      if (String(address.id) === String(selectedAddressId)) label.classList.add('is-selected');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'saved_address';
      input.value = String(address.id);
      input.checked = String(address.id) === String(selectedAddressId);
      const marker = document.createElement('i');
      marker.className = 'checkout-address-card-marker';
      marker.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('span');
      const title = document.createElement('strong');
      const detail = document.createElement('small');
      const meta = document.createElement('em');
      title.textContent = address.receiver_name || address.name || `Delivery address ${index + 1}`;
      detail.textContent = addressDisplay(address);
      meta.textContent = `${String(address.address_type || 'HOME').toLowerCase()}${address.is_default ? ' · Default' : ''}`;
      copy.append(title, detail, meta);
      label.append(input, marker, copy);
      fragment.append(label);
    });
    elements.checkoutAddressList.replaceChildren(fragment);
    if (elements.checkoutSavedAddressSection) elements.checkoutSavedAddressSection.hidden = false;
    if (elements.checkoutAddressEmpty) elements.checkoutAddressEmpty.hidden = savedAddresses.length > 0;
    if (elements.checkoutNewAddressFields) {
      elements.checkoutNewAddressFields.hidden = savedAddresses.length > 0;
      elements.checkoutNewAddressFields.inert = savedAddresses.length > 0;
    }
    if (elements.checkoutAddAddressButton) {
      elements.checkoutAddAddressButton.hidden = savedAddresses.length === 0;
      elements.checkoutAddAddressButton.setAttribute('aria-expanded', String(savedAddresses.length === 0));
      elements.checkoutAddAddressButton.textContent = 'Add a new address';
    }
    updateCheckoutDeliveryFlow();
    updateCheckoutAvailabilityAction();
  }

  async function loadSavedAddresses() {
    const customerId = sessionIdentifier('customerId');
    if (!customerId) {
      throw new Error('Your customer account is still connecting. Please retry in a moment.');
    }
    if (elements.checkoutAddressStatus) elements.checkoutAddressStatus.hidden = false;
    if (elements.checkoutAddressStatusLabel) elements.checkoutAddressStatusLabel.textContent = 'Loading your saved addresses…';
    if (elements.checkoutAddressRetryButton) elements.checkoutAddressRetryButton.hidden = true;
    try {
      const payload = await invokeApi('addresses', 'list', [{ customerId }], {
        path: '/customers/customer-addresses/',
        options: {
          method: 'GET',
          auth: true,
          query: { page_size: 100, customer__id: customerId, is_active: true }
        }
      });
      savedAddresses = apiResults(payload);
      const preferred = savedAddresses.find((address) => address.is_default) || savedAddresses[0];
      selectedAddressId = preferred?.id ?? null;
      renderSavedAddresses();
      if (elements.checkoutAddressStatus) elements.checkoutAddressStatus.hidden = true;
      if (selectedAddressId) await loadDeliveryAvailability();
    } catch (error) {
      if (elements.checkoutAddressStatusLabel) {
        elements.checkoutAddressStatusLabel.textContent = error?.message || 'Saved addresses could not be loaded.';
      }
      if (elements.checkoutAddressRetryButton) elements.checkoutAddressRetryButton.hidden = false;
      throw error;
    }
  }

  function newAddressPayload() {
    const customerId = sessionIdentifier('customerId');
    const house = fieldValue('checkoutAddress');
    const building = fieldValue('checkoutBuilding');
    const landmark = fieldValue('checkoutLandmark');
    const area = selectedCheckoutArea();
    const areaIsCustom = checkoutAreaIsCustom();
    const city = fieldValue('checkoutCity');
    const state = fieldValue('checkoutState');
    const pincode = fieldValue('checkoutPincode');
    return {
      customer: customerId,
      receiver_name: fieldValue('checkoutName'),
      address_phone: fieldValue('checkoutPhone'),
      house_name: house,
      tower_wing: building,
      landmark,
      area,
      area_is_custom: areaIsCustom,
      city,
      state,
      country: 'IN',
      pincode,
      address_type: ['HOME', 'WORK', 'OTHER'].includes(fieldValue('checkoutAddressType').toUpperCase())
        ? fieldValue('checkoutAddressType').toUpperCase()
        : 'HOME',
      full_address: [house, building, landmark, area, city, state, pincode].filter(Boolean).join(', '),
      is_default: savedAddresses.length === 0
    };
  }

  async function saveNewAddress() {
    if (!checkoutStateMatchesPincode()) {
      throw new Error('The state must match the latest verified PIN code. Please verify your PIN code again.');
    }
    const payload = newAddressPayload();
    const response = await invokeApi('addresses', 'create', [payload], {
      path: '/customers/customer-addresses/',
      options: { method: 'POST', auth: true, body: payload, form: true }
    });
    const created = response?.data || response;
    if (!created?.id) throw new Error('The address was saved but no address ID was returned.');
    savedAddresses.push(created);
    selectedAddressId = created.id;
    renderSavedAddresses();
    return created;
  }

  function collectDeliveryDates(payload) {
    if (Array.isArray(payload)) {
      return payload.map((entry) => (
        typeof entry === 'string'
          ? entry
          : entry?.date || entry?.delivery_date || entry?.available_date || entry?.value
      )).filter(Boolean);
    }
    const sources = [
      payload,
      payload?.data,
      payload?.availability,
      payload?.data?.availability
    ].filter(Boolean);
    const keys = ['available_dates', 'delivery_dates', 'dates', 'results', 'slots'];
    for (const source of sources) {
      for (const key of keys) {
        if (!Array.isArray(source?.[key])) continue;
        return source[key]
          .filter((entry) => (
            typeof entry === 'string'
            || (
              entry?.is_available !== false
              && entry?.available !== false
              && !/unavailable|blocked|full/i.test(String(entry?.status || ''))
            )
          ))
          .map((entry) => (
            typeof entry === 'string'
              ? entry
              : entry?.date || entry?.delivery_date || entry?.available_date || entry?.value
          ))
          .filter(Boolean);
      }
    }
    return [];
  }

  function deliveryDateWeekday(dateValue) {
    const normalized = String(dateValue || '').slice(0, 10);
    const date = new Date(`${normalized}T12:00:00Z`);
    if (!normalized || Number.isNaN(date.getTime())) return '';
    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getUTCDay()];
  }

  function filteredDeliveryDates(dates = availableDeliveryDates) {
    const hasWeekly = cart.some((item) => item.purchaseType === 'weekly');
    const selectedDay = elements.checkoutDeliveryDay?.value || '';
    const normalizedDates = dates
      .map((dateValue) => String(dateValue || '').slice(0, 10))
      .filter((dateValue, index, values) => dateValue && values.indexOf(dateValue) === index);
    return normalizedDates.filter((dateValue) => {
      const weekday = deliveryDateWeekday(dateValue);
      // Monday and Tuesday are reserved for plant deep cleaning and plant
      // care, so neither day is available for delivery.
      if (!weekday || weekday === 'Monday' || weekday === 'Tuesday') return false;
      return !hasWeekly || !selectedDay || weekday === selectedDay;
    });
  }

  function newCheckoutAddressReady() {
    if (selectedAddressId) return true;
    const pincode = fieldValue('checkoutPincode');
    return Boolean(
      fieldValue('checkoutAddress')
      && fieldValue('checkoutBuilding')
      && /^\d{6}$/.test(pincode)
      && selectedCheckoutArea()
      && fieldValue('checkoutCity')
      && checkoutStateMatchesPincode(pincode)
      && checkedServiceabilityPincode === pincode
      && checkedServiceabilityArea === selectedCheckoutArea()
      && checkedServiceabilityResult === true
    );
  }

  function updateCheckoutDeliveryFlow() {
    const flow = elements.checkoutDeliveryFlow;
    if (!flow) return;
    updateCheckoutDeliveryStage();
    const dateSelected = Boolean(selectedDeliveryDate || elements.checkoutDeliveryDate?.value);
    const hasDateOptions = filteredDeliveryDates().length > 0;
    let state = 'address';
    let message = 'Step 1 of 3 · Complete your address details, then verify the PIN.';
    if (selectedAddressId && dateSelected) {
      state = 'review';
      message = 'Step 3 of 3 · Your date is selected. Continue to review your order.';
    } else if (selectedAddressId && hasDateOptions) {
      state = 'dates';
      message = 'Step 2 of 3 · Choose one of the available delivery dates.';
    } else if (selectedAddressId) {
      state = 'dates';
      message = 'Step 2 of 3 · Find an available delivery date for this address.';
    } else if (newCheckoutAddressReady()) {
      message = 'Step 1 of 3 · PIN verified. Save the address to find delivery dates.';
    }
    flow.dataset.state = state;
    if (elements.checkoutDeliveryFlowStatus) {
      elements.checkoutDeliveryFlowStatus.textContent = message;
    }
    flow.querySelectorAll('[data-delivery-flow-step]').forEach((step) => {
      const key = step.dataset.deliveryFlowStep;
      step.classList.toggle('is-current', key === state);
      step.classList.toggle('is-complete',
        (state === 'dates' && key === 'address')
        || (state === 'review' && ['address', 'dates'].includes(key))
      );
    });
    updateCheckoutReviewAction();
  }

  function updateCheckoutDeliveryStage() {
    const hasSavedAddress = Boolean(selectedAddressId);
    if (elements.checkoutDeliveryAvailability) {
      elements.checkoutDeliveryAvailability.hidden = !hasSavedAddress;
    }
    if (elements.checkoutAddressNext) {
      elements.checkoutAddressNext.hidden = hasSavedAddress;
    }
  }

  function updateCheckoutReviewAction() {
    const button = elements.checkoutDeliverySubmit;
    if (!button || button.getAttribute('aria-busy') === 'true') return;
    const dateSelected = Boolean(selectedDeliveryDate || elements.checkoutDeliveryDate?.value);
    button.disabled = !(selectedAddressId && dateSelected);
  }

  function updateCheckoutAvailabilityAction() {
    const button = elements.checkoutRefreshAvailabilityButton;
    if (!button) return;
    const saving = addressSaveInFlight;
    const blocked = !selectedAddressId && !newCheckoutAddressReady();
    button.disabled = saving || pincodeCheckInFlight || blocked;
    button.setAttribute('aria-busy', String(saving));
    if (saving) {
      button.textContent = 'Saving address…';
    } else if (selectedAddressId) {
      button.textContent = 'Refresh available dates';
    } else {
      button.textContent = 'Save address & find dates';
    }
    updateCheckoutDeliveryFlow();
  }

  function updateDeliveryAvailabilityStatus() {
    if (!elements.checkoutDeliveryAvailabilityStatus) return;
    const dates = filteredDeliveryDates();
    const hasWeekly = cart.some((item) => item.purchaseType === 'weekly');
    const selectedDay = elements.checkoutDeliveryDay?.value || '';
    if (!availableDeliveryDates.length) {
      elements.checkoutDeliveryAvailabilityStatus.textContent = selectedAddressId
        ? 'No delivery date is currently available for this address.'
        : 'Choose an address to see available delivery dates.';
      updateCheckoutDeliveryFlow();
      return;
    }
    if (hasWeekly && selectedDay && !dates.length) {
      elements.checkoutDeliveryAvailabilityStatus.textContent = `No ${selectedDay} delivery dates are currently available for this address. Choose another weekday or check dates again.`;
      updateCheckoutDeliveryFlow();
      return;
    }
    const dayLabel = hasWeekly && selectedDay ? ` for ${selectedDay}` : '';
    elements.checkoutDeliveryAvailabilityStatus.textContent = `${dates.length} fresh-batch ${dates.length === 1 ? 'date is' : 'dates are'} available${dayLabel} for this address.`;
    updateCheckoutDeliveryFlow();
  }

  function renderAvailableDeliveryDates(dates, { preserveSelection = false } = {}) {
    if (!elements.checkoutDeliveryDate) return;
    availableDeliveryDates = Array.isArray(dates) ? dates : [];
    const visibleDates = filteredDeliveryDates();
    const previous = preserveSelection ? selectedDeliveryDate || elements.checkoutDeliveryDate.value : '';
    const fragment = document.createDocumentFragment();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = visibleDates.length ? 'Choose a delivery date' : 'No dates currently available';
    fragment.append(placeholder);
    const formatter = new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });
    visibleDates.forEach((dateValue) => {
      const date = new Date(`${dateValue}T12:00:00Z`);
      const option = document.createElement('option');
      option.value = dateValue;
      option.textContent = formatter.format(date);
      fragment.append(option);
    });
    elements.checkoutDeliveryDate.replaceChildren(fragment);
    if (previous && visibleDates.includes(previous)) {
      elements.checkoutDeliveryDate.value = previous;
      selectedDeliveryDate = previous;
    } else {
      elements.checkoutDeliveryDate.value = '';
      selectedDeliveryDate = '';
    }
    elements.checkoutDeliveryDate.disabled = visibleDates.length === 0;
    updateCheckoutDeliveryFlow();
  }

  async function loadDeliveryAvailability() {
    if (!selectedAddressId) {
      deliveryAvailabilityGeneration += 1;
      renderAvailableDeliveryDates([]);
      if (elements.checkoutDeliveryAvailabilityStatus) {
        elements.checkoutDeliveryAvailabilityStatus.textContent = 'Choose an address to see available delivery dates.';
      }
      updateCheckoutAvailabilityAction();
      return;
    }
    const requestedAddressId = String(selectedAddressId);
    const requestGeneration = ++deliveryAvailabilityGeneration;
    if (elements.checkoutDeliveryAvailabilityStatus) {
      elements.checkoutDeliveryAvailabilityStatus.textContent = 'Checking fresh-batch delivery dates…';
    }
    if (elements.checkoutRefreshAvailabilityButton) elements.checkoutRefreshAvailabilityButton.disabled = true;
    updateCheckoutDeliveryFlow();
    try {
      const payload = await invokeApi('orders', 'deliveryAvailability', [requestedAddressId], {
        path: '/orders/order-delivery/delivery-availability/',
        options: { method: 'GET', auth: true, query: { address_id: requestedAddressId } }
      });
      if (
        requestGeneration !== deliveryAvailabilityGeneration
        || String(selectedAddressId) !== requestedAddressId
      ) return;
      const dates = collectDeliveryDates(payload);
      renderAvailableDeliveryDates(dates);
      updateDeliveryAvailabilityStatus();
    } catch (error) {
      if (
        requestGeneration !== deliveryAvailabilityGeneration
        || String(selectedAddressId) !== requestedAddressId
      ) return;
      renderAvailableDeliveryDates([]);
      if (elements.checkoutDeliveryAvailabilityStatus) {
        elements.checkoutDeliveryAvailabilityStatus.textContent = error?.message || 'Delivery availability could not be checked.';
      }
      updateCheckoutDeliveryFlow();
    } finally {
      if (
        elements.checkoutRefreshAvailabilityButton
        && requestGeneration === deliveryAvailabilityGeneration
      ) {
        updateCheckoutAvailabilityAction();
      }
    }
  }

  async function checkDeliveryAvailabilityForCurrentAddress() {
    if (addressSaveInFlight) return;
    addressSaveInFlight = true;
    if (elements.checkoutRefreshAvailabilityButton) {
      elements.checkoutRefreshAvailabilityButton.disabled = true;
      elements.checkoutRefreshAvailabilityButton.setAttribute('aria-busy', 'true');
    }
    updateCheckoutAvailabilityAction();
    try {
      if (!selectedAddressId) {
        if (!validateDelivery({ requireDate: false, requireSchedule: false })) return;
        if (!await ensurePincodeServiceability()) return;
        if (elements.checkoutDeliveryAvailabilityStatus) {
          elements.checkoutDeliveryAvailabilityStatus.textContent = 'Saving your address securely…';
        }
        await saveNewAddress();
      }
      await loadDeliveryAvailability();
    } finally {
      addressSaveInFlight = false;
      updateCheckoutAvailabilityAction();
    }
  }

  async function validateSelectedDeliveryDate() {
    const date = fieldValue('checkoutDeliveryDate');
    if (!selectedAddressId || !date) throw new Error('Choose a saved address and an available delivery date.');
    await invokeApi('orders', 'validateDeliveryDate', [{
      date,
      address_id: selectedAddressId
    }], {
      path: '/orders/order-delivery/validate-delivery-date/',
      options: {
        method: 'POST',
        auth: true,
        body: { date, address_id: selectedAddressId },
        form: true
      }
    });

    const weeklyItems = cart.filter((item) => item.purchaseType === 'weekly');
    const previewedPlanIds = new Set();
    for (const weeklyItem of weeklyItems) {
      const plan = findPlanByApiId(weeklyItem.apiPlanId) || WEEKLY_PLAN_BY_ID.get(weeklyItem.planId);
      if (!plan?.apiId) {
        throw new Error('A weekly plan in your bag is no longer available. Remove it before checkout.');
      }
      if (!previewedPlanIds.has(String(plan.apiId))) {
        previewedPlanIds.add(String(plan.apiId));
        await invokeApi('subscriptions', 'preview', [{
          address_id: selectedAddressId,
          subscription_pack_id: plan.apiId,
          duration_in_months: 1,
          is_continuous: true,
          delivery_day: fieldValue('checkoutDeliveryDay'),
          start_date: date
        }], {
          path: '/subscription/subscription/preview/',
          options: {
            method: 'POST',
            auth: true,
            body: {
              address_id: selectedAddressId,
              subscription_pack_id: plan.apiId,
              duration_in_months: 1,
              is_continuous: true,
              delivery_day: fieldValue('checkoutDeliveryDay'),
              start_date: date
            },
            form: true
          }
        });
      }
    }
    selectedDeliveryDate = date;
  }

  function populateReviewAddress() {
    if (!elements.checkoutReviewAddress) return;
    const savedAddress = selectedSavedAddress();
    const address = savedAddress ? addressDisplay(savedAddress) : newAddressPayload().full_address;
    const contact = [fieldValue('checkoutPhone'), fieldValue('checkoutEmail')].filter(Boolean).join(' · ');
    const nameLine = document.createElement('strong');
    const addressLine = document.createElement('span');
    const contactLine = document.createElement('span');
    const deliveryLine = document.createElement('span');
    nameLine.textContent = fieldValue('checkoutName');
    addressLine.textContent = address;
    contactLine.textContent = contact;
    const cadence = cartCadence();
    const reviewDate = selectedDeliveryDate || fieldValue('checkoutDeliveryDate');
    deliveryLine.textContent = cadence === 'weekly'
      ? `Weekly plan starts: ${reviewDate}`
      : `One-time delivery: ${reviewDate}`;
    const reviewLines = [nameLine, addressLine, contactLine, deliveryLine];
    cart
      .filter((item) => item.purchaseType === 'weekly')
      .forEach((weeklyItem) => {
      const descriptor = itemDescriptor(weeklyItem);
      const plan = WEEKLY_PLAN_BY_ID.get(weeklyItem.planId) || descriptor;
      const deliveryDay = fieldValue('checkoutDeliveryDay') || descriptor.deliveryDay;
      const scheduleLine = document.createElement('span');
      scheduleLine.textContent = `Weekly plan: ${weeklyPlanCadenceText(plan)} every ${deliveryDay} · starting ${selectedDeliveryDate} · charged after rider confirmation.`;
      reviewLines.push(scheduleLine);
    });
    elements.checkoutReviewAddress.replaceChildren(...reviewLines);
  }

  function updateWeeklyCartDeliveryDay(day) {
    if (!DELIVERY_DAYS.includes(day) || !cart.some((item) => item.purchaseType === 'weekly')) return;
    cart = cart.map((item) => item.purchaseType === 'weekly' ? { ...item, deliveryDay: day } : item);
    saveCart();
    renderCart();
  }

  function responseSources(payload) {
    return [
      payload,
      payload?.data,
      payload?.order,
      payload?.data?.order,
      payload?.payment,
      payload?.data?.payment,
      payload?.wallet,
      payload?.data?.wallet,
      payload?.razorpay,
      payload?.data?.razorpay
    ].filter((source) => source && typeof source === 'object');
  }

  function firstResponseValue(payload, keys) {
    for (const source of responseSources(payload)) {
      for (const key of keys) {
        if (source[key] != null && source[key] !== '') return source[key];
      }
    }
    return null;
  }

  function walletAmountValue(...values) {
    for (const value of values) {
      if (value == null || value === '') continue;
      const normalized = typeof value === 'string' ? value.replace(/[^0-9.-]/g, '') : value;
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }

  function walletBalanceSnapshot(payload) {
    const reserved = walletAmountValue(firstResponseValue(payload, [
      'reserved_balance',
      'wallet_reserved_balance',
      'reserved_amount',
      'wallet_reserved_amount',
      'amount_reserved',
      'held_balance',
      'wallet_hold_amount'
    ]));
    const total = walletAmountValue(firstResponseValue(payload, [
      'wallet_balance',
      'current_balance',
      'balance',
      'total_balance',
      'ledger_balance',
      'amount'
    ]));
    const explicitAvailable = walletAmountValue(firstResponseValue(payload, [
      'available_balance',
      'available_to_spend',
      'spendable_balance',
      'wallet_available_balance'
    ]));
    const available = explicitAvailable !== null
      ? explicitAvailable
      : total !== null && reserved !== null
        ? Math.max(0, total - reserved)
        : total;
    return {
      total,
      available,
      reserved: reserved === null ? null : Math.max(0, reserved)
    };
  }

  function walletReservationAmount(payload) {
    const value = walletAmountValue(firstResponseValue(payload, [
      'amount_reserved',
      'reserved_amount',
      'wallet_reserved_amount',
      'reservation_amount',
      'wallet_hold_amount',
      'amount_held'
    ]));
    return value === null ? null : Math.max(0, value);
  }

  function walletReservationStatus(payload) {
    const value = firstResponseValue(payload, [
      'reservation_status',
      'wallet_reservation_status',
      'hold_status',
      'wallet_hold_status',
      'settlement_status'
    ]);
    return value == null ? '' : String(value);
  }

  function walletFundingRequestPayload(amount) {
    const payload = { amount: Math.max(1, Math.ceil(numericValue(amount, 0))) };
    const cartId = serverCartId || sessionIdentifier('cartId');
    if (cartId != null && cartId !== '') payload.cart_id = cartId;

    const weeklyItem = cart.find((item) => item.purchaseType === 'weekly');
    // `apiPlanId` is the public subscription-pack/catalogue ID and must not be
    // sent as `subscription_plan_id`. Only forward a real customer-owned
    // subscription plan ID when the cart API supplies one; for a new plan the
    // backend resolves the context from cart_id and the field stays optional.
    const subscriptionPlanId = firstValue(
      weeklyItem?.subscriptionPlanId,
      weeklyItem?.subscription_plan_id,
      weeklyItem?.subscriptionPlan?.id
    );
    if (subscriptionPlanId != null && subscriptionPlanId !== '') {
      payload.subscription_plan_id = subscriptionPlanId;
    }
    return payload;
  }

  async function requestWalletFundingPreview(amount) {
    const payload = walletFundingRequestPayload(amount);
    return {
      amount: payload.amount,
      payload: await invokeApi('wallet', 'rechargePreview', [payload], {
        path: '/customers/customer-wallet/recharge/preview/',
        options: { method: 'POST', auth: true, body: payload, form: true }
      })
    };
  }

  function walletShortfall() {
    if (!Number.isFinite(checkoutWalletBalanceAmount)) return null;
    const backendShortfall = cart.some((item) => item.purchaseType === 'weekly')
      ? numericValue(walletFundingPolicy?.shortfall, NaN)
      : NaN;
    if (Number.isFinite(backendShortfall) && !couponIsCashback()) return Math.max(0, backendShortfall);
    return Math.max(0, walletRequiredBalance() - checkoutWalletBalanceAmount);
  }

  function walletRechargeAmount() {
    // The customer-facing recharge is the amount still needed to reach the
    // required wallet cover, not the gross four-delivery requirement. Some
    // older API responses populate minimum_recharge_amount with the gross
    // requirement, so prefer the canonical shortfall whenever it is present.
    const shortfall = walletShortfall();
    if (Number.isFinite(shortfall)) return Math.max(0, Math.ceil(shortfall));
    const minimumRecharge = numericValue(walletFundingPolicy?.minimumRechargeAmount, NaN);
    return Number.isFinite(minimumRecharge) ? Math.max(0, Math.ceil(minimumRecharge)) : 0;
  }

  function walletRequiredBalance() {
    const backendMinimum = cart.some((item) => item.purchaseType === 'weekly')
      ? couponIsCashback() && Number.isFinite(walletFundingPolicy?.grossWalletRequired)
        ? walletFundingPolicy.grossWalletRequired
        : numericValue(walletFundingPolicy?.minimumWalletRequired, NaN)
      : NaN;
    return Number.isFinite(backendMinimum) && backendMinimum >= 0
      ? backendMinimum
      : orderTotal();
  }

  function weeklyWalletRequirementCopy(grossAmount) {
    const required = numericValue(walletFundingPolicy?.minimumWalletRequired, NaN);
    if (!Number.isFinite(required)) {
      return {
        required: null,
        text: 'the live wallet requirement',
        detail: `The four-delivery cover is ${formatPrice(grossAmount)}. We will confirm the effective wallet requirement from the live service before payment.`
      };
    }
    const serverGross = numericValue(walletFundingPolicy?.grossWalletRequired, NaN);
    const serverCover = numericValue(walletFundingPolicy?.fourDeliveryWalletFunding, NaN);
    const resolvedGross = Number.isFinite(serverGross)
      ? serverGross
      : Number.isFinite(serverCover) ? serverCover : grossAmount;
    const couponDiscount = numericValue(walletFundingPolicy?.couponDiscount, NaN);
    const cashback = numericValue(walletFundingPolicy?.cashbackCredit, NaN);
    const hasCashback = Number.isFinite(cashback) && cashback > 0;
    const hasCouponSaving = Number.isFinite(couponDiscount) && couponDiscount > 0 && !hasCashback;
    const projectedWalletTotal = hasCashback
      ? (Number.isFinite(walletFundingPolicy?.walletBalanceTotal)
        ? walletFundingPolicy.walletBalanceTotal
        : resolvedGross + cashback)
      : null;
    return {
      required,
      text: formatPrice(required),
      detail: hasCashback
        ? `The four-delivery wallet cover is ${formatPrice(resolvedGross)}. It includes ${formatPrice(cashback)} Atulyash cashback; your projected wallet total will be ${formatPrice(projectedWalletTotal)}.`
        : hasCouponSaving
        ? `The four-delivery cover is ${formatPrice(resolvedGross)}. Your ${formatPrice(couponDiscount)} coupon reduces the minimum wallet balance to ${formatPrice(required)}.`
        : `Keep at least ${formatPrice(required)} in your wallet for the first four scheduled deliveries.`
    };
  }

  function applyWalletFundingPolicy(payload) {
    const minimumWalletRequired = numericValue(firstResponseValue(payload, [
      'minimum_wallet_required',
      'subscription_pack_minimum_wallet_required'
    ]), NaN);
    const grossWalletRequired = numericValue(firstResponseValue(payload, ['gross_wallet_required']), NaN);
    const couponDiscount = numericValue(firstResponseValue(payload, ['coupon_discount']), NaN);
    const cashbackCredit = numericValue(firstResponseValue(payload, [
      'cashback_balance',
      'cashback_credit',
      'cashback_amount',
      'wallet_cashback',
      'bonus_amount',
      'extra_credit',
      'prepaid_advantage_amount',
      'atulyash_cashback',
      'coupon_cashback',
      'coupon_credit'
    ]), NaN);
    const cashbackTreatment = firstResponseValue(payload, [
      'cashback_treatment',
      'coupon_treatment',
      'credit_treatment',
      'wallet_credit_type'
    ]);
    const minimumDeliveriesRequired = numericValue(firstResponseValue(payload, [
      'minimum_deliveries_required',
      'subscription_pack_minimum_deliveries_required'
    ]), NaN);
    const pricePerDelivery = numericValue(firstResponseValue(payload, [
      'price_per_delivery',
      'subscription_pack_price_per_delivery'
    ]), NaN);
    const fourDeliveryWalletFunding = numericValue(firstResponseValue(payload, [
      'four_delivery_wallet_funding',
      'subscription_pack_four_delivery_wallet_funding'
    ]), NaN);
    const shortfall = numericValue(firstResponseValue(payload, ['shortfall']), NaN);
    const availableBalance = numericValue(firstResponseValue(payload, ['available_balance']), NaN);
    const minimumRechargeAmount = numericValue(firstResponseValue(payload, [
      'minimum_recharge_amount',
      'minimum_recharge',
      'min_recharge_amount'
    ]), NaN);
    const walletBalanceTotal = numericValue(firstResponseValue(payload, [
      'wallet_balance_total',
      'total_wallet_balance',
      'wallet_total_balance',
      'wallet_credit_total',
      'post_payment_wallet_balance',
      'wallet_balance_after_payment',
      'total_credit',
      'new_wallet_balance',
      'new_balance'
    ]), NaN);
    const canStart = firstResponseValue(payload, ['can_start_subscription']);
    if (!Number.isFinite(minimumWalletRequired)) return null;
    walletFundingPolicy = {
      minimumWalletRequired,
      grossWalletRequired: Number.isFinite(grossWalletRequired) ? Math.max(0, grossWalletRequired) : null,
      couponDiscount: Number.isFinite(couponDiscount) ? Math.max(0, couponDiscount) : 0,
      cashbackCredit: Number.isFinite(cashbackCredit) ? Math.max(0, cashbackCredit) : 0,
      cashbackTreatment: cashbackTreatment ? String(cashbackTreatment) : '',
      walletBalanceTotal: Number.isFinite(walletBalanceTotal) ? Math.max(0, walletBalanceTotal) : null,
      minimumDeliveriesRequired: Number.isFinite(minimumDeliveriesRequired)
        ? minimumDeliveriesRequired
        : 4,
      pricePerDelivery: Number.isFinite(pricePerDelivery) ? pricePerDelivery : null,
      fourDeliveryWalletFunding: Number.isFinite(fourDeliveryWalletFunding)
        ? fourDeliveryWalletFunding
        : null,
      shortfall: Number.isFinite(shortfall) ? Math.max(0, shortfall) : null,
      availableBalance: Number.isFinite(availableBalance) ? availableBalance : null,
      minimumRechargeAmount: Number.isFinite(minimumRechargeAmount) ? minimumRechargeAmount : null,
      canStart: typeof canStart === 'boolean' ? canStart : null
    };
    return walletFundingPolicy;
  }

  function syncWalletOrderAvailability() {
    if (!elements.placeOrderButton) return;
    const shortfall = walletShortfall();
    const subscriptionFundingBlocked = cart.some((item) => item.purchaseType === 'weekly')
      && walletFundingPolicy?.canStart === false;
    const blocked = orderInFlight || (!pendingOrder && (cart.length === 0 || deliveryChargeQuote().requiresSupport ||
      !Number.isFinite(checkoutWalletBalanceAmount) || shortfall > 0 || subscriptionFundingBlocked || couponDiscountPending()
    ));
    elements.placeOrderButton.disabled = blocked;
    elements.placeOrderButton.setAttribute('aria-disabled', String(blocked));
  }

  function resetWalletRechargePreview() {
    walletRechargePreview = null;
    if (elements.checkoutWalletTopup) elements.checkoutWalletTopup.hidden = true;
    elements.checkoutWalletTopupSummary?.replaceChildren();
    setAsyncButton(elements.checkoutWalletTopupConfirm, false, '', 'Continue to add money');
  }

  function renderWalletPaymentState({ loading = false, error = '' } = {}) {
    if (!elements.checkoutWalletCard) return;
    const hasWeekly = cart.some((item) => item.purchaseType === 'weekly');
    const total = hasWeekly ? walletRequiredBalance() : orderTotal();
    const balance = checkoutWalletBalanceAmount;
    const shortfall = walletShortfall();
    if (elements.checkoutWalletOrderLabel) {
      elements.checkoutWalletOrderLabel.textContent = hasWeekly ? 'Minimum wallet balance' : 'Order total';
    }
    if (elements.checkoutWalletOrderTotal) elements.checkoutWalletOrderTotal.textContent = formatPrice(total);
    if (elements.checkoutWalletRequirementRow) elements.checkoutWalletRequirementRow.hidden = !hasWeekly;
    if (elements.checkoutWalletRequirementLabel) elements.checkoutWalletRequirementLabel.textContent = 'Minimum recharge policy';
    if (elements.checkoutWalletRequirement) {
      const deliveryCount = numericValue(walletFundingPolicy?.minimumDeliveriesRequired, 4);
      elements.checkoutWalletRequirement.textContent = `${deliveryCount} deliveries`;
    }

    elements.checkoutWalletShortfallRow.hidden = true;
    elements.checkoutWalletAddButton.hidden = true;
    elements.checkoutWalletRefreshButton.hidden = false;

    if (couponDiscountPending()) {
      elements.checkoutWalletCard.dataset.state = 'error';
      elements.checkoutWalletState.textContent = 'Coupon pending';
      elements.checkoutWalletBalance.textContent = Number.isFinite(balance) ? formatPrice(balance) : 'Checking required';
      elements.checkoutWalletExplanation.textContent = 'The coupon is attached, but the order service has not confirmed its discount. Remove the coupon before placing this order.';
      elements.checkoutPaymentStatus.textContent = 'No order will be submitted with an unconfirmed coupon total.';
    } else if (loading) {
      elements.checkoutWalletCard.dataset.state = 'loading';
      elements.checkoutWalletState.textContent = 'Checking';
      elements.checkoutWalletBalance.textContent = 'Checking…';
      elements.checkoutWalletExplanation.textContent = 'Confirming your live wallet balance securely.';
      elements.checkoutPaymentStatus.textContent = 'Checking your live wallet balance…';
    } else if (error || !Number.isFinite(balance)) {
      elements.checkoutWalletCard.dataset.state = 'error';
      elements.checkoutWalletState.textContent = 'Unavailable';
      elements.checkoutWalletBalance.textContent = 'Could not load';
      elements.checkoutWalletExplanation.textContent = error || 'Your live wallet balance could not be confirmed.';
      elements.checkoutPaymentStatus.textContent = 'Refresh the balance before placing your order. No order payment will be taken directly.';
    } else if (shortfall > 0) {
      // The server returns the net shortfall after any applicable coupon.
      // This is the amount the customer needs to add; never replace it with
      // the gross four-delivery cover.
      const rechargeAmount = walletRechargeAmount() || Math.ceil(shortfall);
      elements.checkoutWalletCard.dataset.state = 'low';
      elements.checkoutWalletState.textContent = walletRechargeVerificationPending ? 'Confirming' : 'Add money';
      elements.checkoutWalletBalance.textContent = formatPrice(balance);
      elements.checkoutWalletShortfall.textContent = formatPrice(shortfall);
      elements.checkoutWalletShortfallRow.hidden = false;
      elements.checkoutWalletAddButton.hidden = Boolean(pendingOrder) || walletRechargeVerificationPending;
      elements.checkoutWalletAddButtonLabel.textContent = `Add ${formatPrice(rechargeAmount)} to wallet`;
      elements.checkoutWalletExplanation.textContent = walletRechargeVerificationPending
        ? 'A wallet recharge is awaiting confirmation. Refresh the balance before attempting another payment.'
        : hasWeekly
          ? `Add ${formatPrice(rechargeAmount)} so your wallet meets the minimum balance for the next four scheduled deliveries.`
          : `Add ${formatPrice(rechargeAmount)} so your wallet can cover this order.`;
      elements.checkoutPaymentStatus.textContent = walletRechargeVerificationPending
        ? 'Do not recharge again yet. Refresh your wallet balance or contact Atulyash support.'
        : 'Razorpay opens only for the wallet recharge. The atta order is paid from your wallet.';
    } else {
      walletRechargeVerificationPending = false;
      elements.checkoutWalletCard.dataset.state = 'ready';
      elements.checkoutWalletState.textContent = 'Ready';
      elements.checkoutWalletBalance.textContent = formatPrice(balance);
      elements.checkoutWalletExplanation.textContent = hasWeekly
        ? `Your verified wallet balance meets the minimum recharge policy for the next ${numericValue(walletFundingPolicy?.minimumDeliveriesRequired, 4)} scheduled deliveries. The paid amount stays in your wallet and is charged only after the delivery partner confirms each delivery.`
        : 'Your verified wallet balance covers this order. The paid amount stays in your wallet and is charged only after the delivery partner confirms delivery.';
      elements.checkoutPaymentStatus.textContent = hasWeekly
          ? `${formatPrice(walletRequiredBalance())} is the required wallet balance for ${numericValue(walletFundingPolicy?.minimumDeliveriesRequired, 4)} scheduled deliveries. Your wallet is charged only after the rider confirms each delivery.`
        : 'The order amount will stay in your wallet and be charged only after the delivery partner confirms delivery.';
      if (walletRechargePreview) resetWalletRechargePreview();
    }
    syncWalletOrderAvailability();
  }

  async function loadWalletBalance() {
    if (!elements.checkoutPaymentWallet || !elements.checkoutWalletBalance) return null;
    const requestGeneration = ++checkoutWalletBalanceGeneration;
    const customerId = sessionIdentifier('customerId');
    checkoutWalletBalanceAmount = null;
    renderWalletPaymentState({ loading: true });
    if (elements.checkoutWalletRefreshButton) elements.checkoutWalletRefreshButton.disabled = true;
    if (!customerId) {
      const message = 'Sign in again to confirm your Atulyash Wallet balance.';
      renderWalletPaymentState({ error: message });
      if (elements.checkoutWalletRefreshButton) elements.checkoutWalletRefreshButton.disabled = false;
      return null;
    }
    try {
      const payload = await invokeApi('wallet', 'balance', [customerId], {
        path: `/customers/customer-wallet/${encodeURIComponent(customerId)}/`,
        options: { method: 'GET', auth: true }
      });
      if (requestGeneration !== checkoutWalletBalanceGeneration) return checkoutWalletBalanceAmount;
      const walletSnapshot = walletBalanceSnapshot(payload);
      if (!Number.isFinite(walletSnapshot.available)) {
        throw new Error('The live service did not return a valid wallet balance.');
      }
      checkoutWalletReservedAmount = walletSnapshot.reserved;
      walletFundingPolicy = null;
      if (cart.some((item) => item.purchaseType === 'weekly')) {
        // Seed the server-authoritative policy with the coupon-adjusted
        // estimate when the live cart has already confirmed a discount.
        // The backend still resolves eligibility and returns the final
        // minimum/shortfall; this only keeps the requested recharge amount
        // aligned with the net amount (₹860 rather than the ₹960 gross cover
        // for the ATULYASH100 example).
        // orderTotal() already includes the live cart coupon discount. Do not
        // subtract experienceCredit() a second time (₹960 − ₹100 must be
        // requested as ₹860, not ₹760).
        const provisionalRequirement = Math.max(1, Math.ceil(orderTotal()));
        const preview = await requestWalletFundingPreview(provisionalRequirement);
        const policy = applyWalletFundingPolicy(preview.payload);
        if (!policy) {
          throw new Error('The live service did not return the four-delivery wallet requirement.');
        }
        if (checkoutWalletReservedAmount === null) {
          checkoutWalletReservedAmount = walletBalanceSnapshot(preview.payload).reserved;
        }
        checkoutWalletBalanceAmount = Number.isFinite(policy.availableBalance)
          ? policy.availableBalance
          : walletSnapshot.available;
      } else {
        checkoutWalletBalanceAmount = walletSnapshot.available;
      }
      // The server policy can differ from the couponed cart total (for
      // example, ₹960 wallet cover versus an ₹860 discounted order total).
      // Rerender the full checkout summary now that the authoritative policy
      // is available so both wallet labels show the same requirement.
      renderCart();
      return checkoutWalletBalanceAmount;
    } catch (error) {
      if (requestGeneration !== checkoutWalletBalanceGeneration) return checkoutWalletBalanceAmount;
      checkoutWalletBalanceAmount = null;
      checkoutWalletReservedAmount = null;
      const message = isUnauthorizedError(error)
        ? 'Your secure session has expired. Sign in again before continuing.'
        : error?.message || 'Your live wallet balance could not be confirmed.';
      renderWalletPaymentState({ error: message });
      return null;
    } finally {
      if (requestGeneration === checkoutWalletBalanceGeneration && elements.checkoutWalletRefreshButton) {
        elements.checkoutWalletRefreshButton.disabled = false;
      }
    }
  }

  function orderReference(payload, { includeGenericId = true } = {}) {
    const keys = [
      'order_number',
      'number',
      'reference',
      'order_reference',
      'order_id'
    ];
    if (includeGenericId) keys.push('id');
    const value = firstResponseValue(payload, keys);
    return value == null ? '' : String(value);
  }

  function pendingOrderActionLabel() {
    if (pendingOrder?.stage === 'placing') return 'Check order status';
    return pendingOrder?.paymentMethod === 'wallet'
      ? 'View confirmed order'
      : 'Resolve pending payment';
  }

  function pendingOrderStatusText() {
    if (pendingOrder?.stage === 'placing') {
      return 'Order status is uncertain · check My Account before another attempt.';
    }
    return pendingOrder?.paymentMethod === 'wallet'
      ? 'Your wallet order was created · open it without placing another order.'
      : 'A legacy direct-payment order needs attention in My Account.';
  }

  function setPendingOrder(value) {
    pendingOrder = value;
    saveSessionRecord(PENDING_ORDER_STORAGE_KEY, value);
    syncPurchaseAvailability();
    renderCart();
  }

  function clearPendingOrder() {
    pendingOrder = null;
    saveSessionRecord(PENDING_ORDER_STORAGE_KEY, null);
    syncPurchaseAvailability();
  }

  function setOrderInteractionLocked(locked) {
    orderInFlight = locked;
    [elements.checkoutCloseButton, elements.checkoutDeliveryBackButton, elements.successCloseButton]
      .forEach((control) => {
        if (control) control.disabled = locked;
      });
    if (elements.checkoutBackButton) {
      elements.checkoutBackButton.disabled = locked || Boolean(pendingOrder);
    }
    elements.checkoutModal?.setAttribute('aria-busy', String(locked));
    syncWalletOrderAvailability();
  }

  let razorpayLoader;

  function loadRazorpay() {
    if (typeof window.Razorpay === 'function') return Promise.resolve(window.Razorpay);
    if (razorpayLoader) return razorpayLoader;
    razorpayLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      const fail = (error) => {
        script.remove();
        razorpayLoader = null;
        reject(error);
      };
      script.onload = () => {
        if (typeof window.Razorpay === 'function') {
          resolve(window.Razorpay);
        } else {
          fail(new Error('Razorpay loaded without a checkout client.'));
        }
      };
      script.onerror = () => fail(new Error('Razorpay checkout could not be loaded.'));
      document.head.append(script);
    });
    return razorpayLoader;
  }

  function renderWalletRechargeSummary(preview) {
    if (!elements.checkoutWalletTopupSummary) return;
    const rows = [];
    if (walletFundingPolicy) {
      rows.push(
        ['Target wallet cover', formatPrice(walletRequiredBalance())],
        ['Available balance', formatPrice(checkoutWalletBalanceAmount)]
      );
    }
    rows.push(
      ['Recharge now', formatPrice(preview.amount)],
      ['Extra wallet credit', preview.bonus > 0 ? `+${formatPrice(preview.bonus)}` : 'No extra credit'],
      ['Tax / charges', formatPrice(preview.tax)],
      ['Pay securely now', formatPrice(preview.payable)],
      ['Wallet receives', formatPrice(preview.credited)]
    );
    const nodes = [];
    rows.forEach(([label, value]) => {
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      nodes.push(term, description);
    });
    elements.checkoutWalletTopupSummary.replaceChildren(...nodes);
  }

  async function previewWalletRecharge() {
    if (walletRechargeInFlight || pendingOrder) return;
    setAsyncButton(elements.checkoutWalletAddButton, true, 'Checking balance…', 'Add money to wallet');
    try {
      const latestBalance = await loadWalletBalance();
      if (!Number.isFinite(latestBalance)) {
        throw new Error(
          elements.checkoutWalletExplanation?.textContent
          || 'Your live wallet balance must be available before money can be added.'
        );
      }
      // The customer pays only the remaining shortfall. The gross wallet
      // requirement is displayed separately and must never become the
      // recharge amount just because an older response labels it as
      // minimum_recharge_amount.
      const amount = walletRechargeAmount() || Math.max(0, Math.ceil(walletShortfall()));
      if (amount <= 0) {
        resetWalletRechargePreview();
        announce(cart.some((item) => item.purchaseType === 'weekly')
          ? 'Your Atulyash Wallet already meets the four-delivery minimum balance.'
          : 'Your Atulyash Wallet already covers this order.');
        return;
      }
      setAsyncButton(elements.checkoutWalletAddButton, true, 'Preparing…', `Add ${formatPrice(amount)} to wallet`);
      const preview = await requestWalletFundingPreview(amount);
      const payload = preview.payload;
      applyWalletFundingPolicy(payload);
      const serverRechargeAmount = numericValue(firstResponseValue(payload, [
        'shortfall',
        'minimum_recharge_amount',
        'recharge_amount',
        'amount'
      ]), NaN);
      const rechargeAmount = Number.isFinite(serverRechargeAmount) && serverRechargeAmount > 0
        ? Math.ceil(serverRechargeAmount)
        : amount;
      const bonus = numericValue(firstResponseValue(payload, [
        'bonus_amount',
        'prepaid_advantage_amount',
        'bonus',
        'extra_credit',
        'cashback'
      ]), 0);
      const tax = numericValue(firstResponseValue(payload, ['tax', 'tax_amount', 'gst']), 0);
      const explicitPayable = numericValue(firstResponseValue(payload, [
        'amount_payable', 'payable_amount', 'amount_to_pay', 'payment_amount'
      ]), NaN);
      const expectedPayable = rechargeAmount + Math.max(0, tax);
      const payable = Number.isFinite(explicitPayable)
        && explicitPayable <= expectedPayable + 0.01
        ? explicitPayable
        : expectedPayable;
      const explicitCredit = numericValue(firstResponseValue(payload, [
        'credited_amount', 'credit_amount', 'wallet_credit', 'wallet_receives'
      ]), NaN);
      const expectedCredit = rechargeAmount + bonus;
      const credited = Number.isFinite(explicitCredit)
        && Math.abs(explicitCredit - expectedCredit) < 0.01
        ? explicitCredit
        : expectedCredit;
      walletRechargePreview = { amount: rechargeAmount, bonus, tax, payable, credited };
      if (elements.checkoutWalletTopupTitle) {
        elements.checkoutWalletTopupTitle.textContent = `Add ${formatPrice(rechargeAmount)} to your wallet`;
      }
      renderWalletRechargeSummary(walletRechargePreview);
      elements.checkoutWalletTopup.hidden = false;
      elements.checkoutPaymentStatus.textContent = 'Review the recharge below. Razorpay will add money to your wallet only.';
      elements.checkoutWalletTopup.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'nearest'
      });
      elements.checkoutWalletTopupConfirm?.focus({ preventScroll: true });
    } catch (error) {
      const message = isUnauthorizedError(error)
        ? 'Your secure session has expired. Sign in again before adding money.'
        : error?.message || 'The wallet recharge could not be prepared.';
      elements.checkoutPaymentStatus.textContent = message;
      announce(message);
    } finally {
      const shortfall = walletShortfall();
      setAsyncButton(
        elements.checkoutWalletAddButton,
        false,
        '',
        walletRechargeAmount() > 0
          ? `Add ${formatPrice(walletRechargeAmount())} to wallet`
          : 'Add money to wallet'
      );
      syncWalletOrderAvailability();
    }
  }

  function razorpayResponseSources(payload) {
    const envelopeKeys = [
      'data',
      'payment',
      'razorpay',
      'order',
      'razorpay_order',
      'razorpayOrder',
      'payment_order',
      'payment_details',
      'payment_data',
      'checkout'
    ];
    const sources = [];
    const visited = new Set();
    const visit = (value, depth) => {
      if (!value || typeof value !== 'object' || visited.has(value) || depth > 4) return;
      visited.add(value);
      sources.push(value);
      envelopeKeys.forEach((key) => visit(value[key], depth + 1));
    };
    visit(payload, 0);
    return sources;
  }

  function firstRazorpayValue(payload, keys) {
    for (const source of razorpayResponseSources(payload)) {
      for (const key of keys) {
        if (source[key] != null && source[key] !== '') return source[key];
      }
    }
    return null;
  }

  function razorpayOrderObject(payload) {
    const namedOrder = firstRazorpayValue(payload, [
      'razorpay_order', 'razorpayOrder', 'payment_order', 'order'
    ]);
    if (namedOrder && typeof namedOrder === 'object') return namedOrder;
    return razorpayResponseSources(payload).find((source) => (
      typeof source.id === 'string'
      && source.id.startsWith('order_')
    )) || null;
  }

  function walletRechargeConfiguration(payload, requestedAmount) {
    const order = razorpayOrderObject(payload);
    const key = firstRazorpayValue(payload, [
      'razorpay_key_id',
      'razorpayKeyId',
      'razorpay_key',
      'razorpayKey',
      'key_id',
      'public_key',
      'publicKey',
      'key'
    ]);
    const namedOrder = firstRazorpayValue(payload, ['razorpay_order', 'razorpayOrder']);
    const explicitOrderId = firstRazorpayValue(payload, [
      'razorpay_order_id', 'razorpayOrderId', 'payment_order_id'
    ]);
    const genericOrderId = firstRazorpayValue(payload, ['order_id', 'orderId']);
    const orderId = explicitOrderId
      || (typeof namedOrder === 'string' ? namedOrder : null)
      || order?.id
      || order?.order_id
      || (String(genericOrderId || '').startsWith('order_') ? genericOrderId : null);
    const orderAmountPaise = numericValue(order?.amount, NaN);
    const explicitPaise = numericValue(firstRazorpayValue(payload, [
      'amount_in_paise', 'amount_paise', 'razorpay_amount', 'razorpayAmount'
    ]), NaN);
    const responseRupees = numericValue(firstRazorpayValue(payload, [
      'minimum_recharge_amount', 'recharge_amount', 'payable_amount',
      'amount_to_pay', 'final_amount', 'total_amount'
    ]), NaN);
    const previewRupees = numericValue(walletRechargePreview?.payable, NaN);
    const requestedRupees = numericValue(requestedAmount, NaN);
    const rupeeAmount = responseRupees > 0
      ? responseRupees
      : previewRupees > 0
        ? previewRupees
        : requestedRupees;
    return {
      key,
      orderId,
      amount: Number.isFinite(orderAmountPaise) && orderAmountPaise > 0
        ? orderAmountPaise
        : Number.isFinite(explicitPaise) && explicitPaise > 0
          ? explicitPaise
          : Math.round(rupeeAmount * 100),
      currency: order?.currency || firstRazorpayValue(payload, ['currency']) || 'INR'
    };
  }

  async function openWalletRecharge(payload, requestedAmount) {
    const config = walletRechargeConfiguration(payload, requestedAmount);
    if (!config.key || !config.orderId || !Number.isFinite(config.amount) || config.amount <= 0) {
      const missing = [
        !config.key ? 'Razorpay Key ID' : '',
        !config.orderId ? 'Razorpay Order ID' : '',
        !Number.isFinite(config.amount) || config.amount <= 0 ? 'payment amount' : ''
      ].filter(Boolean);
      const returnedFields = [...new Set(
        razorpayResponseSources(payload).flatMap((source) => Object.keys(source))
      )].sort();
      console.warn('Atulyash wallet recharge configuration is incomplete.', {
        missing,
        returnedFields
      });
      throw new Error(`The Atulyash payment service did not return ${missing.join(' and ')}. No payment has been taken.`);
    }
    const Razorpay = await loadRazorpay();
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (handler, value) => {
        if (settled) return;
        settled = true;
        handler(value);
      };
      const checkout = new Razorpay({
        key: config.key,
        order_id: config.orderId,
        amount: config.amount,
        currency: config.currency,
        name: 'Atulyash',
        description: 'Atulyash Wallet Recharge',
        image: new URL('images/brand-mark.webp', window.location.href).href,
        prefill: {
          name: fieldValue('checkoutName'),
          contact: fieldValue('checkoutPhone'),
          email: fieldValue('checkoutEmail')
        },
        theme: { color: '#123f33' },
        modal: {
          ondismiss: () => finish(
            reject,
            Object.assign(new Error('Wallet recharge cancelled. Your atta order was not placed.'), {
              code: 'WALLET_RECHARGE_CANCELLED'
            })
          )
        },
        handler: (payment) => finish(resolve, payment)
      });
      checkout.on?.('payment.failed', (event) => {
        finish(reject, new Error(event?.error?.description || 'Razorpay could not complete the wallet recharge.'));
      });
      checkout.open();
    });
  }

  async function initiateWalletRecharge() {
    if (walletRechargeInFlight || !walletRechargePreview) return;
    const amount = numericValue(walletRechargePreview.amount, 0);
    if (amount <= 0) {
      elements.checkoutPaymentStatus.textContent = 'The wallet recharge amount is invalid. Prepare it again.';
      resetWalletRechargePreview();
      return;
    }
    walletRechargeInFlight = true;
    let paymentCompleted = false;
    setAsyncButton(elements.checkoutWalletTopupConfirm, true, 'Opening secure payment…', 'Continue to add money');
    if (elements.checkoutWalletTopupCancel) elements.checkoutWalletTopupCancel.disabled = true;
    if (elements.checkoutWalletRefreshButton) elements.checkoutWalletRefreshButton.disabled = true;
    try {
      const requestPayload = walletFundingRequestPayload(amount);
      const payload = await invokeApi('wallet', 'rechargeInitiate', [requestPayload], {
        path: '/customers/customer-wallet/recharge/initiate/',
        options: { method: 'POST', auth: true, body: requestPayload, form: true }
      });
      const payment = await openWalletRecharge(payload, amount);
      paymentCompleted = true;
      elements.checkoutPaymentStatus.textContent = 'Payment received. Confirming the wallet credit with Atulyash…';
      await invokeApi('wallet', 'rechargeVerify', [payment], {
        path: '/customers/customer-wallet/recharge/verify/',
        options: { method: 'POST', auth: true, body: payment, form: true }
      });
      walletRechargeVerificationPending = false;
      resetWalletRechargePreview();
      const refreshedBalance = await loadWalletBalance();
      if (Number.isFinite(refreshedBalance) && walletShortfall() === 0) {
        const message = 'Money added successfully. Your wallet is ready for this order.';
        elements.checkoutPaymentStatus.textContent = message;
        announce(message);
        elements.placeOrderButton?.focus({ preventScroll: true });
      } else if (Number.isFinite(refreshedBalance)) {
        const message = `Wallet updated. Add ${formatPrice(Math.ceil(walletShortfall()))} more before placing this order.`;
        elements.checkoutPaymentStatus.textContent = message;
        announce(message);
      } else {
        const message = 'The recharge was verified, but the refreshed wallet balance is unavailable. Refresh the balance before ordering.';
        elements.checkoutPaymentStatus.textContent = message;
        announce(message);
      }
    } catch (error) {
      const cancelled = error?.code === 'WALLET_RECHARGE_CANCELLED';
      let message;
      if (cancelled) {
        message = error.message;
      } else if (paymentCompleted) {
        walletRechargeVerificationPending = true;
        resetWalletRechargePreview();
        const refreshedBalance = await loadWalletBalance();
        message = Number.isFinite(refreshedBalance) && walletShortfall() === 0
          ? 'Your wallet balance has updated and now covers this order.'
          : 'Payment may have completed, but wallet verification is still pending. Refresh your balance before trying another recharge or contact Atulyash support.';
      } else if (isUnauthorizedError(error)) {
        message = 'Your secure session expired. The order was not placed; sign in again and refresh your wallet.';
      } else {
        message = error?.message || 'The wallet recharge could not be completed. Your atta order was not placed.';
      }
      elements.checkoutPaymentStatus.textContent = message;
      announce(message);
    } finally {
      walletRechargeInFlight = false;
      setAsyncButton(elements.checkoutWalletTopupConfirm, false, '', 'Continue to add money');
      if (elements.checkoutWalletTopupCancel) elements.checkoutWalletTopupCancel.disabled = false;
      if (elements.checkoutWalletRefreshButton) elements.checkoutWalletRefreshButton.disabled = false;
      syncWalletOrderAvailability();
    }
  }

  function confirmedOrderId(payload) {
    const value = firstResponseValue(payload, ['order_id', 'id', 'pk', 'uuid']);
    if (value && typeof value === 'object') return firstResponseValue(value, ['id', 'pk', 'uuid']);
    return value == null || value === '' ? '' : String(value);
  }

  function confirmedDateText(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(parsed);
  }

  function confirmedAddressText(address) {
    if (!address) return '';
    if (typeof address === 'string') return address;
    return [
      address.house_name || address.house_number || address.flat_number || address.address_line_1,
      address.tower_wing || address.building || address.address_line_2,
      address.landmark,
      address.area || address.locality,
      address.city,
      address.state,
      address.pincode?.pincode || address.pincode?.code || address.pincode || address.postal_code
    ].filter(Boolean).join(', ');
  }

  function renderCheckoutSuccessDetails(payload, reference) {
    const details = elements.checkoutSuccessDetails;
    if (!details) return;

    const date = firstResponseValue(payload, [
      'confirmed_delivery_date',
      'delivery_date',
      'order_delivery_date',
      'expected_delivery_date'
    ]);
    const paymentStatus = firstResponseValue(payload, [
      'payment_status_display',
      'payment_status',
      'wallet_payment_status'
    ]);
    const productName = firstResponseValue(payload, [
      'product_name',
      'product_title',
      'item_name'
    ]);
    const packSize = firstResponseValue(payload, ['pack_size', 'weight_kg', 'weight', 'quantity_kg']);
    const quantity = firstResponseValue(payload, ['quantity', 'item_quantity']);
    const purchaseType = firstResponseValue(payload, ['purchase_type', 'order_type', 'fulfilment_type']);
    const weeklyQuantity = firstResponseValue(payload, ['weekly_quantity', 'weekly_kg', 'quantity_per_week']);
    const deliveryDay = firstResponseValue(payload, ['delivery_day', 'preferred_delivery_day']);
    const amount = firstResponseValue(payload, [
      'net_payable',
      'wallet_debit',
      'final_amount',
      'total_amount',
      'grand_total',
      'order_total',
      'amount_payable'
    ]);
    const coupon = firstResponseValue(payload, [
      'coupon_discount',
      'applied_coupon_discount',
      'discount_amount'
    ]);
    const deliveryCharge = firstResponseValue(payload, ['delivery_charge', 'delivery_fee']);
    const walletDebit = firstResponseValue(payload, ['wallet_debit', 'wallet_amount_debited']);
    const reservedAmount = walletReservationAmount(payload);
    const address = firstResponseValue(payload, ['delivery_address', 'address', 'customer_address']);
    const paymentLabel = paymentStatus
      || (walletDebit != null
        ? 'Wallet payment recorded'
        : 'Wallet payment · charged after delivery confirmation');
    const rows = [
      ['Order', reference],
      productName ? ['Product', String(productName)] : null,
      packSize ? ['Pack', `${packSize}${/kg/i.test(String(packSize)) ? '' : ' kg'}${quantity ? ` × ${quantity}` : ''}`] : null,
      purchaseType ? ['Order type', /week|subscr/i.test(String(purchaseType)) ? 'Weekly freshness' : 'One-time order'] : null,
      amount != null ? ['Confirmed amount', formatPrice(numericValue(amount, 0))] : null,
      coupon != null && numericValue(coupon, 0) > 0 ? ['Coupon saving', `−${formatPrice(numericValue(coupon, 0))}`] : null,
      deliveryCharge != null ? ['Delivery charge', numericValue(deliveryCharge, 0) === 0 ? 'Free' : formatPrice(numericValue(deliveryCharge, 0))] : null,
      walletDebit != null ? ['Wallet debited', formatPrice(numericValue(walletDebit, 0))] : null,
      date ? ['Expected delivery', confirmedDateText(date)] : null,
      address ? ['Delivery address', confirmedAddressText(address)] : null,
      weeklyQuantity ? ['Weekly quantity', `${weeklyQuantity}${/kg/i.test(String(weeklyQuantity)) ? '' : ' kg'} per week`] : null,
      deliveryDay ? ['Preferred delivery day', String(deliveryDay)] : null,
      ['Payment', String(paymentLabel)]
    ].filter(Boolean);
    details.replaceChildren(...rows.map(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      return row;
    }));
  }

  function skipSuccessAnimation({ focus = true } = {}) {
    const celebration = elements.checkoutSuccessCelebration;
    if (!celebration) return;
    celebration.classList.add('is-skipped', 'is-celebrating');
    if (elements.checkoutSuccessSkipAnimation) {
      elements.checkoutSuccessSkipAnimation.hidden = true;
    }
    if (focus) elements.checkoutViewOrderLink?.focus({ preventScroll: true });
  }

  function showOrderSuccess(orderPayload, paymentMethod, verificationPayload = null) {
    const finalPayload = verificationPayload || orderPayload;
    const finalOrderId = confirmedOrderId(finalPayload) || confirmedOrderId(orderPayload);
    if (!finalOrderId) {
      const message = 'Your payment was received, but the order number is still being confirmed. Check My Atulyash before trying again.';
      if (elements.checkoutPaymentStatus) elements.checkoutPaymentStatus.textContent = message;
      announce(message);
      return false;
    }
    clearPendingOrder();
    const reference = orderReference(finalPayload, { includeGenericId: false })
      || orderReference(orderPayload)
      || `#${finalOrderId}`;
    lastOrderResponse = finalPayload;
    if (elements.checkoutReference) elements.checkoutReference.textContent = reference;
    if (elements.checkoutSuccessMessage) {
      elements.checkoutSuccessMessage.replaceChildren(
        document.createTextNode('Order '),
        Object.assign(document.createElement('strong'), { textContent: reference }),
        document.createTextNode(' has been placed successfully.')
      );
    }
    if (elements.checkoutSuccessDeliveryDate) {
      const confirmedDate = firstResponseValue(finalPayload, [
        'confirmed_delivery_date',
        'delivery_date',
        'order_delivery_date',
        'expected_delivery_date'
      ]);
      elements.checkoutSuccessDeliveryDate.textContent = confirmedDate ? confirmedDateText(confirmedDate) : 'Confirmed in your account';
    }
    if (elements.checkoutSuccessPaymentStatus) {
      const reservationAmount = walletReservationAmount(finalPayload);
      const paymentStatus = firstResponseValue(finalPayload, [
        'payment_status_display',
        'payment_status',
        'wallet_payment_status'
      ]);
      elements.checkoutSuccessPaymentStatus.textContent = paymentStatus
        || (reservationAmount !== null && reservationAmount > 0
          ? 'Wallet payment · charged after delivery confirmation'
          : 'Wallet payment will be charged after delivery confirmation');
    }
    renderCheckoutSuccessDetails(finalPayload, reference);
    if (elements.checkoutViewOrderLink) {
      elements.checkoutViewOrderLink.href = `account.html#orders/${encodeURIComponent(finalOrderId)}`;
    }
    if (elements.whatsappOrderLink) {
      const message = `Hello Atulyash team, I need help with order ${reference}.`;
      elements.whatsappOrderLink.href = `https://wa.me/919818588996?text=${encodeURIComponent(message)}`;
    }
    elements.checkoutReviewAddress?.replaceChildren();
    elements.checkoutForm.hidden = true;
    elements.checkoutSuccess.hidden = false;
    document.body.classList.add('checkout-complete');
    elements.checkoutSuccessSkipAnimation?.removeAttribute('hidden');
    if (elements.checkoutSuccessCelebration) {
      elements.checkoutSuccessCelebration.classList.remove('is-celebrating', 'is-skipped');
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => elements.checkoutSuccessCelebration.classList.add('is-celebrating'));
      });
    }
    if (elements.checkoutSummary) elements.checkoutSummary.hidden = true;
    elements.checkoutModal?.setAttribute('aria-labelledby', 'checkoutSuccessTitle');
    document.querySelectorAll('[data-checkout-indicator]').forEach((indicator) => indicator.classList.add('is-active'));
    elements.checkoutSuccess.querySelector('h2')?.focus();
    cart = [];
    serverCartSummary = null;
    serverCartActive = false;
    serverCartId = null;
    appliedCouponOverride = null;
    saveSessionRecord(COUPON_CONTEXT_KEY, null);
    renderCart();
    return true;
  }

  async function completeOrderRequest() {
    if (orderInFlight) return;
    if (!cart.length && !pendingOrder) {
      announce('Your bag is empty. Choose a fresh-batch pack before placing your order.');
      elements.checkoutSummaryItems?.querySelector('.checkout-summary-empty a')?.focus();
      return;
    }
    if (!isOtpVerified() || !checkoutProfilePhone || checkoutProfilePhone !== authVerifiedPhone) {
      announce('Verify your mobile before placing the order.');
      resetOtpState({ message: 'Verify your mobile before continuing.', preserveSession: true });
      setCheckoutStep(1, { focus: true });
      return;
    }
    if (couponDiscountPending()) {
      const message = 'The coupon discount has not been confirmed by the order service. Remove the coupon before placing this order.';
      if (elements.checkoutPaymentStatus) elements.checkoutPaymentStatus.textContent = message;
      announce(message);
      renderCouponPanel();
      return;
    }
    if (
      pendingOrder
      && pendingOrder.customerId != null
      && String(pendingOrder.customerId) !== String(sessionIdentifier('customerId'))
    ) {
      clearPendingOrder();
      announce('This pending order belongs to a different account. Check it from that account before ordering again.');
      return;
    }
    if (pendingOrder?.paymentMethod === 'razorpay') {
      const message = 'This earlier direct-payment order cannot be continued in wallet-only checkout. Check My Atulyash → Orders or contact support; a second order will not be created.';
      elements.checkoutPaymentStatus.textContent = message;
      if (elements.checkoutPlaceOrderStatus) elements.checkoutPlaceOrderStatus.hidden = false;
      if (elements.checkoutPlaceOrderStatusLabel) elements.checkoutPlaceOrderStatusLabel.textContent = 'Resolve the existing order from My Atulyash.';
      announce(message);
      window.location.assign('account.html#orders');
      return;
    }
    if (pendingOrder?.stage === 'placing' && !pendingOrder.orderPayload) {
      const message = 'The previous order request has an uncertain status, so this frontend will not create a second order. Check My Atulyash → Orders or contact Atulyash before trying again.';
      elements.checkoutPaymentStatus.textContent = message;
      if (elements.checkoutPlaceOrderStatus) elements.checkoutPlaceOrderStatus.hidden = false;
      if (elements.checkoutPlaceOrderStatusLabel) elements.checkoutPlaceOrderStatusLabel.textContent = 'Order status must be checked before another attempt.';
      announce(message);
      window.location.assign('account.html#orders');
      return;
    }
    if (pendingOrder?.paymentMethod === 'wallet' && pendingOrder.orderPayload) {
      showOrderSuccess(pendingOrder.orderPayload, 'wallet');
      return;
    }
    if (!elements.checkoutConsent?.checked) {
      announce('Please confirm the order and wallet payment terms.');
      if (elements.checkoutConsentError) elements.checkoutConsentError.textContent = 'Please confirm the order and wallet payment terms.';
      elements.checkoutConsent?.focus();
      return;
    }
    if (elements.checkoutConsentError) elements.checkoutConsentError.textContent = '';
    if (!selectedAddressId || !selectedDeliveryDate) {
      announce('Choose a confirmed address and delivery date.');
      setCheckoutStep(2, { focus: true });
      return;
    }

    const paymentMethod = 'wallet';
    const hasWeekly = cart.some((item) => item.purchaseType === 'weekly');
    const payload = {
      address_id: selectedAddressId,
      payment_method: 'wallet',
      notes: fieldValue('checkoutOrderNotes'),
      delivery_date: selectedDeliveryDate,
      ...(hasWeekly ? { duration_in_months: 1, is_continuous: true } : {})
    };

    setOrderInteractionLocked(true);
    setAsyncButton(elements.placeOrderButton, true, 'Checking wallet…', checkoutOrderActionLabel());
    if (elements.checkoutPlaceOrderStatus) elements.checkoutPlaceOrderStatus.hidden = false;
    if (elements.checkoutPlaceOrderStatusLabel) elements.checkoutPlaceOrderStatusLabel.textContent = 'Confirming your live wallet balance…';
    try {
      const latestBalance = await loadWalletBalance();
      if (!Number.isFinite(latestBalance)) {
        throw new Error('Your live wallet balance could not be confirmed. Refresh it before placing the order.');
      }
      const shortfall = walletShortfall();
      if (shortfall > 0) {
        throw new Error(`Add ${formatPrice(Math.ceil(shortfall))} to your Atulyash Wallet before placing this order.`);
      }

      setAsyncButton(elements.placeOrderButton, true, 'Placing order…', checkoutOrderActionLabel());
      if (elements.checkoutPlaceOrderStatusLabel) elements.checkoutPlaceOrderStatusLabel.textContent = 'Creating your order from your Atulyash Wallet…';
      const placementAttempt = {
        stage: 'placing',
        paymentMethod,
        customerId: sessionIdentifier('customerId'),
        addressId: selectedAddressId,
        deliveryDate: selectedDeliveryDate,
        requestStartedAt: new Date().toISOString()
      };
      setPendingOrder(placementAttempt);
      let orderPayload;
      try {
        orderPayload = await invokeApi('orders', 'place', [payload], {
          path: '/orders/order/place/',
          options: { method: 'POST', auth: true, body: payload, form: true }
        });
      } catch (error) {
        const status = Number(error?.status);
        if ([400, 401, 403, 404, 405, 422].includes(status)) clearPendingOrder();
        throw error;
      }
      if (!confirmedOrderId(orderPayload)) {
        throw new Error('Your order was accepted, but the service did not return an order number yet. Check My Atulyash before trying again.');
      }
      const orderRecord = {
        stage: 'created',
        orderPayload,
        paymentMethod,
        customerId: sessionIdentifier('customerId')
      };
      setPendingOrder(orderRecord);
      showOrderSuccess(orderPayload, paymentMethod);
    } catch (error) {
      const message = pendingOrder?.stage === 'placing' && !pendingOrder.orderPayload
        ? `${error?.message || 'The order request could not be confirmed.'} Its status is uncertain, so no automatic retry will create another order. Check My Atulyash → Orders or contact Atulyash.`
        : error?.message || 'The wallet order could not be completed. Review the details and try again.';
      elements.checkoutPaymentStatus.textContent = message;
      if (elements.checkoutPlaceOrderStatusLabel && pendingOrder) {
        elements.checkoutPlaceOrderStatusLabel.textContent = 'Order status is uncertain · check your account before retrying.';
      }
      announce(message);
    } finally {
      setOrderInteractionLocked(false);
      setAsyncButton(
        elements.placeOrderButton,
        false,
        '',
        pendingOrder ? pendingOrderActionLabel() : checkoutOrderActionLabel()
      );
      syncWalletOrderAvailability();
      if (elements.checkoutPlaceOrderStatus) elements.checkoutPlaceOrderStatus.hidden = !pendingOrder;
    }
  }

  function focusableElements(container) {
    return [...container.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hidden && element.offsetParent !== null);
  }

  function trapFocus(event) {
    if (IS_CHECKOUT_PAGE || event.key !== 'Tab' || !activeLayer) return;
    const container = activeLayer === 'checkout' ? elements.checkoutModal : elements.cartDrawer;
    if (!container) return;
    const focusable = focusableElements(container);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const DEFAULT_ATTA_BUFFER = 10;

  function selectedAttaBuffer() {
    const selected = document.querySelector('input[name="attaBuffer"]:checked');
    const buffer = Number(selected?.value);
    return [15, 20, 25, 30].includes(buffer) ? buffer : DEFAULT_ATTA_BUFFER;
  }

  function renderWeeklyCalculatorSuggestion() {
    const {
      weeklyCalculatorSuggestionLabel: label,
      weeklyCalculatorSuggestionTitle: title,
      weeklyCalculatorSuggestionText: text,
      weeklyCalculatorLink: link,
      weeklyCalculatorApplyButton: applyButton
    } = elements;

    if (!label || !title || !text || !link || !applyButton) return;

    link.firstChild.textContent = calculatorHasUserInput ? 'Adjust calculation ' : 'Use the roti calculator ';

    if (!calculatorHasUserInput) {
      label.textContent = 'Not sure how much atta?';
      title.textContent = 'Let your daily rotis suggest the right plan.';
      text.textContent = 'Tell us your household’s daily roti count and add a little extra for parathas or pooris.';
      applyButton.hidden = true;
      applyButton.disabled = true;
      return;
    }

    const currentDailyRotis = Number(elements.dailyRotis?.value);
    if (!Number.isInteger(currentDailyRotis) || currentDailyRotis < MIN_DAILY_ROTIS) {
      label.textContent = 'Calculator needs one detail';
      title.textContent = 'Enter your household’s actual daily roti count.';
      text.textContent = 'Use the total number of rotis cooked for everyone in your household on a usual day.';
      applyButton.hidden = true;
      applyButton.disabled = true;
      return;
    }

    if (!calculatorRecommendation?.plan) {
      label.textContent = 'Calculator update';
      title.textContent = WEEKLY_PLANS.length
        ? 'No available weekly plan fully covers this estimate.'
        : 'Your plan suggestion is waiting for availability.';
      text.textContent = WEEKLY_PLANS.length
        ? 'Adjust your calculation or speak with our team for the right household quantity.'
        : (weeklyCatalogMessage || 'Weekly plans are unavailable right now.');
      applyButton.hidden = true;
      applyButton.disabled = true;
      return;
    }

    const { plan, weeklyKg, dailyRotis, buffer } = calculatorRecommendation;
    const suggestionIsSelected = (
      selectedPurchaseType === 'weekly'
      && selectedWeeklyPlanId === plan.id
    );
    label.textContent = 'Your calculator suggestion';
    title.textContent = `${weeklyPlanSelectionLabel(plan)} · ${formatPrice(plan.pricePerDelivery)} per delivery`;
    text.textContent = `Covers your ${weeklyKg.toFixed(2)} kg/week estimate from ${dailyRotis} rotis a day${buffer ? ` with ${buffer}% extra` : ''}.`;
    applyButton.hidden = false;
    applyButton.disabled = suggestionIsSelected;
    applyButton.firstChild.textContent = suggestionIsSelected
      ? 'Suggested plan selected '
      : `Use ${weeklyPlanSelectionLabel(plan)} plan `;
    const arrow = applyButton.querySelector('[aria-hidden="true"]');
    if (arrow) arrow.textContent = suggestionIsSelected ? '✓' : '→';
  }

  function setCalculatorCta(recommendation) {
    if (!elements.calculatorCta) return;
    const available = Boolean(recommendation?.plan);
    elements.calculatorCta.disabled = !available;
    elements.calculatorCta.setAttribute('aria-disabled', String(!available));
    const label = available
      ? `Choose ${weeklyPlanSelectionLabel(recommendation.plan)} plan `
      : 'Choose my weekly plan ';
    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    elements.calculatorCta.replaceChildren(document.createTextNode(label), arrow);
    renderWeeklyCalculatorSuggestion();
  }

  function findCoveringWeeklyPlan(requiredWeeklyKg) {
    return WEEKLY_PLANS
      .filter((plan) => plan.weeklyKg + 0.000001 >= requiredWeeklyKg)
      .sort((a, b) => a.weeklyKg - b.weeklyKg || a.pricePerDelivery - b.pricePerDelivery)[0] || null;
  }

  function updateRotiCalculator({ markUsed = false } = {}) {
    if (!elements.dailyRotis) return null;
    if (markUsed) calculatorHasUserInput = true;
    const dailyRotis = Number(elements.dailyRotis.value);
    const validRotiCount = (
      Number.isInteger(dailyRotis)
      && dailyRotis >= MIN_DAILY_ROTIS
    );

    elements.dailyRotis.setAttribute('aria-invalid', String(!validRotiCount));
    if (elements.dailyRotisMinus) {
      elements.dailyRotisMinus.disabled = validRotiCount && dailyRotis <= MIN_DAILY_ROTIS;
    }

    if (!validRotiCount) {
      calculatorRecommendation = null;
      if (elements.weeklyOutput) elements.weeklyOutput.textContent = '—';
      if (elements.weeklyWalletOutput) elements.weeklyWalletOutput.textContent = 'Enter your daily count';
      if (elements.calculatorFormulaSummary) {
        elements.calculatorFormulaSummary.textContent = 'Enter a whole number of rotis eaten by your household in a usual day.';
      }
      if (elements.closestPackOutput) {
        elements.closestPackOutput.textContent = 'Enter a valid daily count to see your recommended weekly plan.';
      }
      setCalculatorCta(null);
      return null;
    }

    const buffer = selectedAttaBuffer();
    const weeklyKg = (dailyRotis * ROTI_ATTA_GRAMS * 7 * (1 + (buffer / 100))) / 1000;

    if (elements.weeklyOutput) elements.weeklyOutput.textContent = weeklyKg.toFixed(2);
    if (elements.weeklyWalletOutput) elements.weeklyWalletOutput.textContent = `Approx. ${(weeklyKg * 4).toFixed(1)} kg over 4 weeks`;
    if (elements.calculatorFormulaSummary) {
      elements.calculatorFormulaSummary.textContent = `${dailyRotis} rotis/day × ${ROTI_ATTA_GRAMS} g/roti × 7 days${buffer ? ` + ${buffer}% buffer` : ''}`;
    }

    const plan = findCoveringWeeklyPlan(weeklyKg);
    if (!plan) {
      calculatorRecommendation = null;
      if (elements.closestPackOutput) {
        elements.closestPackOutput.textContent = WEEKLY_PLANS.length
          ? 'Your estimate is above the currently available weekly plans. Please speak with our team for the right quantity.'
          : weeklyCatalogMessage || 'Weekly plans are unavailable right now.';
      }
      setCalculatorCta(null);
      return null;
    }

    calculatorRecommendation = { plan, dailyRotis, buffer, weeklyKg };
    if (elements.closestPackOutput) {
      const minimumAvailableKg = WEEKLY_PLANS.reduce((minimum, item) => Math.min(minimum, item.weeklyKg), Infinity);
      const belowMinimum = Number.isFinite(minimumAvailableKg) && weeklyKg < minimumAvailableKg;
      elements.closestPackOutput.textContent = belowMinimum
        ? `Your estimated need is ${weeklyKg.toFixed(2)} kg/week. Atulyash weekly plans start from ${formatWeight(minimumAvailableKg)} kg per delivery. Recommended Weekly Plan: ${weeklyPlanSelectionLabel(plan)} · ${formatPrice(plan.pricePerDelivery)} per delivery.`
        : `Recommended Weekly Plan: ${weeklyPlanSelectionLabel(plan)} · ${formatPrice(plan.pricePerDelivery)} per delivery.`;
    }
    setCalculatorCta(calculatorRecommendation);
    return calculatorRecommendation;
  }

  function normalizeDailyRotiCount({ markUsed = false } = {}) {
    if (!elements.dailyRotis) return;
    const rawValue = Number(elements.dailyRotis.value);
    const normalized = Number.isFinite(rawValue)
      ? Math.max(MIN_DAILY_ROTIS, Math.round(rawValue))
      : MIN_DAILY_ROTIS;
    elements.dailyRotis.value = String(normalized);
    updateRotiCalculator({ markUsed });
  }

  function changeDailyRotiCount(change) {
    if (!elements.dailyRotis) return;
    const current = Number(elements.dailyRotis.value);
    const next = Math.max(
      MIN_DAILY_ROTIS,
      (Number.isFinite(current) ? Math.round(current) : MIN_DAILY_ROTIS) + change
    );
    elements.dailyRotis.value = String(next);
    updateRotiCalculator({ markUsed: true });
  }

  function updateMobileBuyBar() {
    if (!elements.mobileBuyBar) return;
    const footer = document.querySelector('.site-footer');
    const primaryBuyButton = elements.addToCartButton;
    const productOfferHasPassed = primaryBuyButton
      && primaryBuyButton.getBoundingClientRect().bottom < 92;
    const beforeFooter = !footer || footer.getBoundingClientRect().top > window.innerHeight * 0.7;
    const visible = window.innerWidth <= 680
      && productOfferHasPassed
      && beforeFooter
      && !activeLayer
      && !document.body.classList.contains('menu-open');
    elements.mobileBuyBar.classList.toggle('is-visible', visible);
    elements.mobileBuyBar.setAttribute('aria-hidden', String(!visible));
    elements.mobileBuyBar.inert = !visible;
  }

  elements.serviceabilityForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (serviceabilityCheckInFlight || serviceabilityLocationInFlight) return;
    void checkStorefrontServiceability(elements.serviceabilityPincode?.value);
  });
  elements.serviceabilityPincode?.addEventListener('input', (event) => {
    const pincode = String(event.target.value || '').replace(/\D/g, '').slice(0, 6);
    event.target.value = pincode;
    event.target.removeAttribute('aria-invalid');
    if (storefrontServiceability?.pincode && storefrontServiceability.pincode !== pincode) {
      saveStorefrontServiceability(null);
    }
    renderStorefrontServiceability();
  });
  elements.serviceabilityLocationButton?.addEventListener('click', () => {
    if (serviceabilityCheckInFlight || serviceabilityLocationInFlight) return;
    void useCurrentLocationForServiceability();
  });
  elements.headerLocationButton?.addEventListener('click', () => {
    closePrimaryNavigation();
    openStorefrontServiceability({ force: true });
  });
  elements.serviceabilityContinueButton?.addEventListener('click', () => {
    closeStorefrontServiceability({ continueAction: true });
  });
  elements.serviceabilityCloseButton?.addEventListener('click', () => closeStorefrontServiceability());
  elements.serviceabilityBrowseButton?.addEventListener('click', () => closeStorefrontServiceability());
  elements.serviceabilityDialog?.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeStorefrontServiceability();
  });
  elements.serviceabilityDialog?.addEventListener('close', () => {
    document.body.classList.remove('serviceability-open');
  });

  document.querySelectorAll('[data-serviceability-intent="first-experience"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      requireStorefrontServiceability(() => {
        selectedPurchaseType = 'once';
        updateProductUI();
        elements.packSelector?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'center'
        });
        const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520;
        window.setTimeout(() => {
          elements.packSizeSelect?.focus({ preventScroll: true });
        }, delay);
      }, 'Continue to choose a fresh batch');
    });
  });

  elements.packSizeSelect?.addEventListener('change', (event) => selectWeight(event.target.value));

  elements.purchaseSelector?.addEventListener('change', (event) => {
    if (!event.target.matches('input[name="purchaseType"]')) return;
    if (event.target.value === 'weekly' && !catalogReadiness.subscriptions) {
      event.target.checked = false;
      selectedPurchaseType = 'once';
      announce('Weekly plans are not available right now.');
      updateProductUI();
      return;
    }
    const nextPurchaseType = event.target.value === 'weekly' ? 'weekly' : 'once';
    if (!verifiedStorefrontServiceability()) {
      event.target.checked = false;
      const currentInput = elements.purchaseSelector.querySelector(`input[name="purchaseType"][value="${selectedPurchaseType}"]`);
      if (currentInput) currentInput.checked = true;
    }
    requireStorefrontServiceability(() => {
      selectedPurchaseType = nextPurchaseType;
      const nextInput = elements.purchaseSelector?.querySelector(`input[name="purchaseType"][value="${nextPurchaseType}"]`);
      if (nextInput) nextInput.checked = true;
      updateProductUI();
    }, nextPurchaseType === 'weekly' ? 'Continue to weekly plans' : 'Continue with a one-time order');
  });

  elements.weeklyPlanSelect?.addEventListener('change', (event) => {
    if (!WEEKLY_PLAN_BY_ID.has(event.target.value)) return;
    selectedWeeklyPlanId = event.target.value;
    updateProductUI({ animate: true });
  });

  elements.weeklyCalculatorLink?.addEventListener('click', (event) => {
    event.preventDefault();
    const calculatorSection = document.getElementById('weekly');
    calculatorSection?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520;
    window.setTimeout(() => elements.dailyRotis?.focus({ preventScroll: true }), delay);
  });

  elements.weeklyCalculatorApplyButton?.addEventListener('click', () => {
    const recommendation = updateRotiCalculator({ markUsed: true });
    if (!recommendation?.plan) {
      announce(
        WEEKLY_PLANS.length
          ? 'No current weekly plan fully covers this estimate.'
          : 'Weekly plans are not available right now.'
      );
      return;
    }
    selectedQuantity = 1;
    selectWeeklyPlan(recommendation.plan.id, { notify: true });
    elements.weeklyPlanSelect?.focus({ preventScroll: true });
  });

  elements.quantityMinus?.addEventListener('click', () => {
    selectedQuantity = Math.max(1, selectedQuantity - 1);
    updateProductUI();
  });

  elements.quantityPlus?.addEventListener('click', () => {
    selectedQuantity = Math.min(10, selectedQuantity + 1);
    updateProductUI();
  });

  elements.addToCartButton?.addEventListener('click', () => {
    requireStorefrontServiceability(
      () => addSelectionToCart(),
      selectedPurchaseType === 'weekly' ? 'Continue with this weekly plan' : 'Continue with this one-time order'
    );
  });
  elements.mobileAddButton?.addEventListener('click', () => {
    requireStorefrontServiceability(
      () => addSelectionToCart(),
      selectedPurchaseType === 'weekly' ? 'Continue with this weekly plan' : 'Continue with this one-time order'
    );
  });
  elements.buyNowButton?.addEventListener('click', () => {
    requireStorefrontServiceability(
      () => addSelectionToCart({ openAfter: true }),
      selectedPurchaseType === 'weekly' ? 'Continue with this weekly plan' : 'Continue with this one-time order'
    );
  });
  elements.headerCartButton?.addEventListener('click', openCart);
  elements.checkoutHandoffReview?.addEventListener('click', () => {
    if (IS_CHECKOUT_PAGE) {
      window.location.reload();
      return;
    }
    closeCheckoutHandoff();
    elements.productShowcase?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });
  [elements.heroWeeklyButton, elements.startWeeklyButton].forEach((button) => {
    button?.addEventListener('click', (event) => {
      event.preventDefault();
      if (!selectedWeeklyPlanId || !catalogReadiness.subscriptions) {
        announce('Weekly plans are not available right now.');
        return;
      }
      requireStorefrontServiceability(
        () => selectWeeklyPlan(selectedWeeklyPlanId, { scroll: true, notify: true }),
        'Continue to weekly plans'
      );
    });
  });
  elements.cartCloseButton?.addEventListener('click', () => closeCart());
  elements.continueShoppingButton?.addEventListener('click', () => closeCart());
  elements.checkoutCloseButton?.addEventListener('click', closeCheckout);
  elements.checkoutButton?.addEventListener('click', () => {
    requireStorefrontServiceability(openCheckout, 'Continue to delivery details');
  });
  [elements.storeServiceRetryButton, elements.catalogRetryButton].forEach((button) => {
    button?.addEventListener('click', hydratePublicCommerce);
  });
  elements.cartApiRetryButton?.addEventListener('click', async () => {
    if (!isApiAuthenticated()) {
      setCartApiStatus('', { hidden: true });
      return;
    }
    try {
      await refreshServerCart();
    } catch (error) {
      // refreshServerCart keeps the actionable status visible.
    }
  });
  elements.checkoutAddressRetryButton?.addEventListener('click', async () => {
    try {
      await loadSavedAddresses();
    } catch (error) {
      // loadSavedAddresses keeps the retry state visible.
    }
  });
  elements.checkoutAddAddressButton?.addEventListener('click', () => {
    const expanded = elements.checkoutAddAddressButton?.getAttribute('aria-expanded') === 'true';
    setNewAddressMode(!expanded);
    if (!expanded) document.getElementById('checkoutAddress')?.focus();
  });
  elements.checkoutAddressList?.addEventListener('change', async (event) => {
    if (!event.target.matches('input[name="saved_address"]')) return;
    selectedAddressId = event.target.value;
    renderSavedAddresses();
    try {
      await loadDeliveryAvailability();
    } catch (error) {
      // The availability region reports the service error.
    }
  });
  elements.checkoutPincode?.addEventListener('input', (event) => {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6);
    // Invalidate any older in-flight lookup so only the latest PIN can set
    // the address state or authorize checkout.
    checkoutServiceabilityRequest += 1;
    pincodeCheckInFlight = false;
    checkoutVerifiedState = '';
    checkoutVerifiedStatePincode = '';
    // Never carry the previous PIN's city into a new address lookup.
    const cityField = document.getElementById('checkoutCity');
    const stateField = document.getElementById('checkoutState');
    if (cityField) cityField.value = '';
    if (stateField) {
      stateField.value = '';
      stateField.disabled = true;
    }
    // Clear areas returned for the previous PIN before the new lookup starts.
    resetCheckoutAreaOptions();
    if (event.target.value !== checkedServiceabilityPincode) resetPincodeServiceability();
    void lookupCheckoutArea(event.target.value);
    event.target.removeAttribute('aria-invalid');
    event.target.closest('.checkout-field')?.classList.remove('has-error');
    const error = event.target.closest('.checkout-field')?.querySelector('.field-error');
    if (error) error.textContent = '';
    updateCheckoutAvailabilityAction();
  });
  elements.checkoutArea?.addEventListener('change', (event) => {
    checkoutServiceabilityRequest += 1;
    syncCheckoutCustomAreaField();
    event.target.removeAttribute('aria-invalid');
    const error = event.target.closest('.checkout-field')?.querySelector('.field-error');
    if (error) error.textContent = '';
    resetPincodeServiceability();
    void checkPincodeServiceability({ force: true });
    updateCheckoutAvailabilityAction();
  });
  elements.checkoutOtherArea?.addEventListener('input', (event) => {
    checkoutServiceabilityRequest += 1;
    window.clearTimeout(checkoutOtherAreaCheckTimer);
    resetPincodeServiceability();
    event.target.removeAttribute('aria-invalid');
    event.target.closest('.checkout-field')?.classList.remove('has-error');
    const error = event.target.closest('.checkout-field')?.querySelector('.field-error');
    if (error) error.textContent = '';
    if (selectedCheckoutArea().length >= 2) {
      checkoutOtherAreaCheckTimer = window.setTimeout(() => {
        void checkPincodeServiceability({ force: true });
      }, 350);
    }
    updateCheckoutAvailabilityAction();
  });
  ['checkoutAddress', 'checkoutBuilding', 'checkoutLandmark', 'checkoutCity', 'checkoutState', 'checkoutAddressType']
    .forEach((id) => {
      const field = document.getElementById(id);
      field?.addEventListener('input', updateCheckoutAvailabilityAction);
      field?.addEventListener('change', updateCheckoutAvailabilityAction);
    });
  elements.checkoutPincodeCheckButton?.addEventListener('click', async () => {
    const result = await checkPincodeServiceability({ force: true });
    if (result === true) announce('Fresh-batch delivery is available for this PIN code.');
  });
  elements.checkoutRefreshAvailabilityButton?.addEventListener('click', async () => {
    try {
      await checkDeliveryAvailabilityForCurrentAddress();
    } catch (error) {
      showCheckoutError(error?.message || 'Delivery dates could not be checked for this address.');
    }
  });
  elements.checkoutDeliveryDay?.addEventListener('change', (event) => {
    const selectedDay = event.target.value;
    if (selectedDay && !DELIVERY_DAYS.includes(selectedDay)) return;
    updateWeeklyCartDeliveryDay(selectedDay);
    // The API returns all serviceable dates. Keep that response and show only
    // dates that fall on the weekday the customer selected.
    renderAvailableDeliveryDates(availableDeliveryDates, { preserveSelection: true });
    updateDeliveryAvailabilityStatus();
    event.target.removeAttribute('aria-invalid');
    const error = event.target.closest('.checkout-field')?.querySelector('.field-error');
    if (error) error.textContent = '';
    updateCheckoutDeliveryFlow();
    updateCheckoutAvailabilityAction();
  });
  elements.checkoutDeliveryDate?.addEventListener('change', (event) => {
    selectedDeliveryDate = event.target.value;
    if (elements.checkoutDeliveryDateError) elements.checkoutDeliveryDateError.textContent = '';
    event.target.removeAttribute('aria-invalid');
    updateCheckoutDeliveryFlow();
  });
  elements.checkoutOrderNotes?.addEventListener('input', (event) => {
    if (elements.checkoutOrderNotesCount) {
      elements.checkoutOrderNotesCount.textContent = String(event.target.value.length);
    }
  });
  elements.checkoutWalletAddButton?.addEventListener('click', previewWalletRecharge);
  elements.checkoutWalletRefreshButton?.addEventListener('click', async () => {
    resetWalletRechargePreview();
    const balance = await loadWalletBalance();
    if (Number.isFinite(balance)) announce('Your live wallet balance has been refreshed.');
  });
  elements.checkoutWalletTopupConfirm?.addEventListener('click', initiateWalletRecharge);
  elements.checkoutWalletTopupCancel?.addEventListener('click', () => {
    resetWalletRechargePreview();
    renderWalletPaymentState();
    elements.checkoutWalletAddButton?.focus({ preventScroll: true });
  });
  elements.checkoutBackButton?.addEventListener('click', () => {
    if (orderInFlight || pendingOrder) {
      announce('This existing order is waiting for payment confirmation.');
      return;
    }
    clearCheckoutErrors();
    setCheckoutStep(2, { focus: true });
  });
  elements.checkoutDeliveryBackButton?.addEventListener('click', () => {
    if (orderInFlight) {
      announce('Please wait for the current secure order step to finish.');
      return;
    }
    clearCheckoutErrors();
    setCheckoutStep(1, { focus: true });
  });
  elements.checkoutChangeNumberButton?.addEventListener('click', changeCheckoutMobile);
  elements.checkoutVerifiedChangeButton?.addEventListener('click', changeCheckoutMobile);
  elements.checkoutOtpVerifyButton?.addEventListener('click', verifyOtp);
  elements.checkoutResetOtpButton?.addEventListener('click', () => {
    if (Date.now() < otpResendAvailableAt) return;
    requestOtp({ resend: true });
  });
  elements.checkoutOtp?.addEventListener('input', (event) => {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
    clearOtpError();
  });
  elements.checkoutPhone?.addEventListener('input', (event) => {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 10);
    const lockedPhone = authVerifiedPhone || authPendingPhone;
    if (authOtpState !== 'details' && event.target.value !== lockedPhone) {
      resetOtpState({ message: 'The mobile number changed. Request a new OTP.', preserveSession: true });
    }
  });
  elements.placeOrderButton?.addEventListener('click', completeOrderRequest);
  elements.successCloseButton?.addEventListener('click', closeCheckout);
  elements.checkoutSuccessSkipAnimation?.addEventListener('click', () => skipSuccessAnimation());
  elements.backdrop?.addEventListener('click', closeActiveLayer);

  elements.emptyCartShopButton?.addEventListener('click', () => {
    closeCart({ restoreFocus: false });
    const weeklyMode = selectedPurchaseType === 'weekly';
    const target = weeklyMode ? elements.weeklyPlanPanel : elements.packSelector;
    const focusTarget = weeklyMode
      ? elements.weeklyPlanSelect
      : elements.packSizeSelect;
    target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    window.setTimeout(() => focusTarget?.focus({ preventScroll: true }), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 520);
  });

  elements.cartItems?.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-cart-action]');
    const item = actionButton?.closest('[data-cart-id]');
    if (actionButton && item) updateCartItem(item.dataset.cartId, actionButton.dataset.cartAction);
  });

  elements.checkoutSummaryItems?.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-cart-action]');
    const item = actionButton?.closest('[data-cart-id]');
    if (actionButton && item) updateCartItem(item.dataset.cartId, actionButton.dataset.cartAction);
  });

  elements.couponToggleButton?.addEventListener('click', async () => {
    const expanded = elements.couponToggleButton.getAttribute('aria-expanded') === 'true';
    elements.couponToggleButton.setAttribute('aria-expanded', String(!expanded));
    if (elements.couponPanel) elements.couponPanel.hidden = expanded;
    if (!expanded) {
      renderCouponPanel();
      await loadEligibleCoupons();
      elements.couponSearch?.focus({ preventScroll: true });
    }
  });
  elements.couponSearch?.addEventListener('input', renderCouponPanel);
  elements.couponList?.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-coupon-action]');
    if (!action) return;
    await changeCoupon(action.dataset.couponAction, action.dataset.couponId);
  });

  elements.checkoutForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!cart.length && !pendingOrder) {
      announce('Your bag is empty. Choose a fresh-batch pack before continuing.');
      elements.checkoutSummaryItems?.querySelector('.checkout-summary-empty a')?.focus();
      return;
    }
    if (checkoutStep === 1) {
      if (authOtpState === 'details') {
        await requestOtp();
        return;
      }
      if (authOtpState === 'otp') {
        await verifyOtp();
        return;
      }
      if (!validateIdentity()) return;
      if (!isOtpVerified()) {
        resetOtpState({ message: 'Verify your mobile before continuing.', preserveSession: true });
        return;
      }
      checkoutProfilePhone = authVerifiedPhone;
      if (pendingOrder) {
        if (elements.checkoutPlaceOrderStatus) elements.checkoutPlaceOrderStatus.hidden = false;
        if (elements.checkoutPlaceOrderStatusLabel) {
          elements.checkoutPlaceOrderStatusLabel.textContent = pendingOrderStatusText();
        }
        setOrderInteractionLocked(false);
        setAsyncButton(elements.placeOrderButton, false, '', pendingOrderActionLabel());
        setCheckoutStep(3, { focus: true });
        return;
      }
      setAsyncButton(elements.checkoutIdentitySubmit, true, 'Preparing delivery…', 'Continue to delivery');
      try {
        await updateAuthenticatedProfile();
        await syncGuestCartToServer();
        setCheckoutStep(2, { focus: true });
        const results = await Promise.allSettled([
          loadSavedAddresses(),
          loadWalletBalance()
        ]);
        const addressFailure = results[0]?.status === 'rejected' ? results[0].reason : null;
        if (addressFailure) {
          showCheckoutError(addressFailure?.message || 'Your saved addresses could not be loaded. Try again below.');
        }
      } catch (error) {
        showCheckoutError(error?.message || 'Your secure bag could not be prepared for checkout.');
      } finally {
        setAsyncButton(elements.checkoutIdentitySubmit, false, '', 'Continue to delivery');
      }
      return;
    }
    if (checkoutStep === 3) {
      await completeOrderRequest();
      return;
    }
    if (checkoutStep !== 2) return;
    if (deliveryStepInFlight || addressSaveInFlight) {
      announce('Please wait while the address and delivery dates are being checked.');
      return;
    }
    deliveryStepInFlight = true;
    if (!isOtpVerified() || checkoutProfilePhone !== authVerifiedPhone) {
      deliveryStepInFlight = false;
      resetOtpState({ message: 'Verify your mobile before continuing.', preserveSession: true });
      setCheckoutStep(1, { focus: true });
      return;
    }
    if (!validateDelivery({
      requireDate: Boolean(selectedAddressId),
      requireSchedule: Boolean(selectedAddressId)
    })) {
      deliveryStepInFlight = false;
      return;
    }
    if (couponDiscountPending()) {
      deliveryStepInFlight = false;
      showCheckoutError('The coupon discount has not been confirmed by the order service. Remove the coupon before reviewing payment.');
      renderCouponPanel();
      return;
    }
    setAsyncButton(elements.checkoutDeliverySubmit, true, 'Checking delivery…', 'Review my order');
    try {
      if (!selectedAddressId) {
        if (!await ensurePincodeServiceability()) return;
        addressSaveInFlight = true;
        if (elements.checkoutRefreshAvailabilityButton) {
          elements.checkoutRefreshAvailabilityButton.disabled = true;
          elements.checkoutRefreshAvailabilityButton.setAttribute('aria-busy', 'true');
        }
        try {
          await saveNewAddress();
        } finally {
          addressSaveInFlight = false;
          if (elements.checkoutRefreshAvailabilityButton) {
            elements.checkoutRefreshAvailabilityButton.disabled = false;
            elements.checkoutRefreshAvailabilityButton.setAttribute('aria-busy', 'false');
          }
        }
        await loadDeliveryAvailability();
        if (!fieldValue('checkoutDeliveryDate')) {
          showCheckoutError('Your address is saved. Choose one of the available delivery dates, then continue.');
          return;
        }
      }
      if (!validateDelivery({ requireDate: true })) return;
      await validateSelectedDeliveryDate();
      updateWeeklyCartDeliveryDay(fieldValue('checkoutDeliveryDay'));
      populateReviewAddress();
      await loadWalletBalance();
      setCheckoutStep(3, { focus: true });
    } catch (error) {
      showCheckoutError(error?.message || 'This delivery date could not be confirmed.');
    } finally {
      deliveryStepInFlight = false;
      setAsyncButton(elements.checkoutDeliverySubmit, false, '', 'Review my order');
    }
  });

  elements.dailyRotis?.addEventListener('input', () => updateRotiCalculator({ markUsed: true }));
  elements.dailyRotis?.addEventListener('change', () => normalizeDailyRotiCount({ markUsed: true }));
  elements.dailyRotis?.addEventListener('blur', () => normalizeDailyRotiCount({ markUsed: true }));
  elements.dailyRotisMinus?.addEventListener('click', () => changeDailyRotiCount(-1));
  elements.dailyRotisPlus?.addEventListener('click', () => changeDailyRotiCount(1));
  let activeAttaBufferInput = document.querySelector('input[name="attaBuffer"]:checked');
  document.querySelectorAll('input[name="attaBuffer"]').forEach((input) => {
    input.addEventListener('click', (event) => {
      // Radios normally cannot be deselected. Allow a second click so the
      // calculator can return to its neutral 10% buffer estimate.
      if (!input.checked) return;
      if (input === activeAttaBufferInput) {
        event.preventDefault();
        activeAttaBufferInput = null;
        // The browser may restore a radio's checked state after click handlers
        // finish, so clear it on the next turn as well as updating the result.
        window.setTimeout(() => {
          input.checked = false;
          updateRotiCalculator({ markUsed: true });
        }, 0);
        return;
      }
    });
    input.addEventListener('change', () => {
      activeAttaBufferInput = input.checked ? input : null;
      updateRotiCalculator({ markUsed: true });
    });
  });
  elements.calculatorCta?.addEventListener('click', () => {
    const recommendation = calculatorRecommendation?.plan
      ? calculatorRecommendation
      : updateRotiCalculator({ markUsed: true });
    if (!recommendation?.plan) {
      announce(
        WEEKLY_PLANS.length
          ? 'No current weekly plan fully covers this estimate.'
          : 'Weekly plans are not available right now.'
      );
      return;
    }
    selectedQuantity = 1;
    selectWeeklyPlan(recommendation.plan.id, { scroll: true, notify: true });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeLayer && !IS_CHECKOUT_PAGE) closeActiveLayer();
    trapFocus(event);
  });

  window.addEventListener('scroll', updateMobileBuyBar, { passive: true });
  window.addEventListener('resize', updateMobileBuyBar, { passive: true });
  const refreshWalletWhenReviewVisible = () => {
    if (
      checkoutStep === 3
      && isOtpVerified()
      && !pendingOrder
      && !orderInFlight
      && !walletRechargeInFlight
      && document.visibilityState !== 'hidden'
    ) {
      loadWalletBalance();
    }
  };
  if (elements.checkoutWalletCard) {
    window.addEventListener('focus', refreshWalletWhenReviewVisible);
    window.addEventListener('pageshow', refreshWalletWhenReviewVisible);
    document.addEventListener('visibilitychange', refreshWalletWhenReviewVisible);
  }
  new MutationObserver(updateMobileBuyBar).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  API?.on?.('sessionchange', () => {
    apiSession = getApiSession();
    if (isApiAuthenticated()) {
      clearCartLoginGate();
      renderCart();
      void loadFirstOrderEligibility();
    }
    updateAccountHeader();
  });
  API?.on?.('logout', () => {
    apiSession = null;
    serverCartActive = false;
    serverCartId = null;
    serverCartSummary = null;
    firstOrderEligibility = null;
    checkoutWalletBalanceGeneration += 1;
    checkoutWalletBalanceAmount = null;
    walletRechargeVerificationPending = false;
    resetWalletRechargePreview();
    cart = loadCart();
    updateAccountHeader();
    renderCart();
  });
  API?.on?.('autherror', () => {
    showCartLoginGate();
  });

  function takeStorefrontIntent() {
    let intent = null;
    try {
      const raw = sessionStorage.getItem(STOREFRONT_INTENT_KEY);
      sessionStorage.removeItem(STOREFRONT_INTENT_KEY);
      intent = raw ? JSON.parse(raw) : null;
    } catch (error) {
      intent = null;
    }
    const params = new URLSearchParams(window.location.search);
    const hasAccountHandoff = params.get('checkout') === 'account';
    if (hasAccountHandoff) {
      const mode = params.get('mode') === 'weekly' ? 'weekly' : 'once';
      intent = {
        action: 'checkout',
        mode,
        quantity: params.get('quantity'),
        weight: params.get('weight'),
        weeklyKg: params.get('weeklyKg'),
        origin: 'account',
        returnTo: 'account.html#shop',
        createdAt: params.get('handoff')
      };
    }
    if (hasAccountHandoff) {
      const cleanUrl = `${window.location.pathname}${window.location.hash || '#shop'}`;
      window.history.replaceState(null, '', cleanUrl);
    }
    if (!intent || typeof intent !== 'object' || Array.isArray(intent)) return null;
    const createdAt = Number(intent.createdAt);
    if (!Number.isFinite(createdAt) || Math.abs(Date.now() - createdAt) > 15 * 60 * 1000) {
      return intent.origin === 'account' ? { ...intent, expired: true } : null;
    }
    return intent;
  }

  function safeCheckoutReturnUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(String(value), window.location.href);
      if (url.origin !== window.location.origin) return '';
      if (url.pathname.endsWith('/account.html')) return checkoutReturnForOrigin('account');
      if (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/')) {
        return checkoutReturnForOrigin('home');
      }
      return '';
    } catch (error) {
      return '';
    }
  }

  function closeCheckoutHandoff(message = '') {
    if (elements.checkoutHandoffStatus && message) {
      elements.checkoutHandoffStatus.textContent = message;
    }
    if (!elements.checkoutHandoff) return;
    elements.checkoutHandoff.classList.add('is-complete');
    window.setTimeout(() => {
      elements.checkoutHandoff.hidden = true;
      elements.checkoutHandoff.classList.remove('is-complete', 'is-error');
      if (elements.checkoutHandoffActions) elements.checkoutHandoffActions.hidden = true;
      if (elements.checkoutHandoffTitle) {
        elements.checkoutHandoffTitle.textContent = 'Preparing your delivery.';
      }
      if (elements.checkoutHandoffStatus) {
        elements.checkoutHandoffStatus.textContent = 'Bringing your selected pack into secure checkout…';
      }
      document.body.classList.remove('checkout-handoff-open');
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240);
  }

  function failCheckoutHandoff(message) {
    if (!elements.checkoutHandoff) return;
    elements.checkoutHandoff.hidden = false;
    elements.checkoutHandoff.classList.remove('is-complete');
    elements.checkoutHandoff.classList.add('is-error');
    document.body.classList.add('checkout-handoff-open');
    if (elements.checkoutHandoffTitle) {
      elements.checkoutHandoffTitle.textContent = 'We couldn’t prepare your delivery.';
    }
    if (elements.checkoutHandoffStatus) elements.checkoutHandoffStatus.textContent = message;
    if (elements.checkoutHandoffActions) elements.checkoutHandoffActions.hidden = false;
  }

  async function resumeStorefrontIntent() {
    const intent = takeStorefrontIntent();
    if (!intent) return false;
    const accountReturnUrl = intent.origin === 'account'
      ? safeCheckoutReturnUrl(intent.returnTo)
      : '';
    if (elements.checkoutHandoffTitle) {
      elements.checkoutHandoffTitle.textContent = 'Preparing your delivery.';
    }
    if (intent.expired) {
      failCheckoutHandoff('This checkout request has expired. Return to My Atulyash and continue from your current bag.');
      return true;
    }

    if (intent.action === 'openCart') {
      if (isApiAuthenticated()) {
        try {
          if (pendingGuestCart.length || storedGuestCartExists()) {
            await syncGuestCartToServer();
          } else {
            await refreshServerCart();
          }
        } catch (error) {
          // The existing cart service status gives the customer a retry action.
        }
      } else {
        renderCart();
      }
      openCart();
      closeCheckoutHandoff();
      return true;
    }

    if (intent.action === 'openCheckout') {
      rememberCheckoutContext(intent.origin === 'account' ? 'account' : 'home');
      window.location.assign('checkout.html');
      return true;
    }

    const mode = intent.mode === 'weekly' ? 'weekly' : 'once';
    selectedQuantity = Math.max(1, Math.min(10, Math.round(Number(intent.quantity) || 1)));
    if (mode === 'weekly') {
      const requestedWeeklyKg = Number(intent.weeklyKg);
      const plan = WEEKLY_PLANS.find((item) => Math.abs(item.weeklyKg - requestedWeeklyKg) < 0.01);
      if (!plan) {
        announce('That weekly rhythm is not available today. Please choose another plan.');
        failCheckoutHandoff('That weekly plan is unavailable today. Choose another rhythm or review live availability.');
        return true;
      }
      selectWeeklyPlan(plan.id);
    } else {
      const requestedWeight = Number(intent.weight);
      if (!PRODUCT.variants[requestedWeight]?.available) {
        announce('That pack is not available today. Please choose another size.');
        failCheckoutHandoff('That pack is unavailable today. Choose another size or review live availability.');
        return true;
      }
      selectedPurchaseType = 'once';
      selectWeight(requestedWeight);
    }
    updateProductUI({ animate: true });
    if (pendingOrder) {
      checkoutReturnUrl = accountReturnUrl;
      const checkoutOpened = openCheckout();
      if (checkoutOpened) closeCheckoutHandoff('Your pending checkout is ready.');
      else {
        checkoutReturnUrl = '';
        failCheckoutHandoff('Your pending checkout needs attention before it can continue.');
      }
      return true;
    }
    checkoutReturnUrl = accountReturnUrl;
    accountHandoffActive = true;
    let added = false;
    try {
      added = await addSelectionToCart({ openAfter: intent.action !== 'cart' });
    } finally {
      accountHandoffActive = false;
    }
    if (added) closeCheckoutHandoff('Your delivery details are ready.');
    else {
      checkoutReturnUrl = '';
      failCheckoutHandoff(lastCartFailureMessage || 'We could not prepare checkout from the live service. Your order was not confirmed.');
    }
    return true;
  }

  async function initializeCommerce() {
    updateAccountHeader();
    updateProductUI();
    updateRotiCalculator();
    renderCart();
    updateMobileBuyBar();
    initializeStorefrontServiceability();
    await hydratePublicCommerce();
    if (await resumeStorefrontIntent()) return;
    closeCheckoutHandoff();
    if (!isApiAuthenticated()) return;
    apiSession = getApiSession();
    if (cart.length) {
      setCartApiStatus('Signed in · your bag will sync securely at checkout.', { state: 'success' });
      await loadFirstOrderEligibility();
      return;
    }
    try {
      await refreshServerCart();
      await loadFirstOrderEligibility();
    } catch (error) {
      // The cart status includes the retry action.
    }
  }

  async function initializeDedicatedCheckout() {
    const context = readCheckoutContext();
    checkoutReturnUrl = checkoutReturnForOrigin(context.origin);
    updateCheckoutContextUI(context.origin);
    renderCart();

    await hydratePublicCommerce();

    if (isApiAuthenticated()) {
      apiSession = getApiSession();
      try {
        if (pendingGuestCart.length || storedGuestCartExists()) {
          await syncGuestCartToServer();
        } else {
          await refreshServerCart();
        }
        await loadFirstOrderEligibility();
      } catch (error) {
        if (isUnauthorizedError(error)) {
          showCartLoginGate();
          return;
        }
        failCheckoutHandoff(
          friendlyCartError(error)
          || 'Your secure bag could not be loaded. Your order was not placed.'
        );
        return;
      }
    } else {
      cart = loadCart();
      migrateCartToLiveCatalog();
      renderCart();
    }

    if (!cart.length && !pendingOrder) {
      failCheckoutHandoff('Your bag is empty. Return to the shop, choose a fresh-batch pack and continue when you are ready.');
      return;
    }
    if (cartHasConfigurationIssues() && !pendingOrder) {
      failCheckoutHandoff('One or more bag items are not available from the live catalogue. Return to your bag and update the selection.');
      return;
    }

    if (!openCheckout()) {
      failCheckoutHandoff('Your bag needs attention before checkout can continue. Return to your bag and review the selection.');
      return;
    }
    closeCheckoutHandoff('Your secure checkout is ready.');
  }

  if (IS_CHECKOUT_PAGE) initializeDedicatedCheckout();
  else initializeCommerce();
})();
