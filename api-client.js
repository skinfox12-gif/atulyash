/*
 * Atulyash browser API client
 *
 * This file is deliberately a classic script (no imports or build step). Load it
 * before the application scripts and use window.AtulyashAPI.
 */
(function atulyashApiBootstrap(global) {
  'use strict';

  var ENVIRONMENTS = Object.freeze({
    production: 'https://api.atulyash.com',
    staging: 'https://staging-api.atulyash.com',
    development: 'https://dev-api.atulyash.com',
    dev: 'https://dev-api.atulyash.com'
  });

  var STORAGE_KEY = 'atulyash.api.session.v1';
  var DEFAULT_ENVIRONMENT = 'production';
  var refreshPromise = null;
  var pendingMobile = '';

  var initialConfig = global.ATULYASH_API_CONFIG || {};
  var config = {
    environment: initialConfig.environment || DEFAULT_ENVIRONMENT,
    baseUrl: initialConfig.baseUrl || '',
    timeout: Number(initialConfig.timeout) || 0,
    headers: copyObject(initialConfig.headers),
    /*
     * The backend's current browser CORS allow-list does not include X-Client.
     * It can be enabled when that header is added server-side.
     */
    includeClientHeader: initialConfig.includeClientHeader === true,
    clientHeaderValue: initialConfig.clientHeaderValue || 'mobile'
  };

  function copyObject(value) {
    var result = {};
    if (!value || typeof value !== 'object') return result;
    Object.keys(value).forEach(function copyKey(key) {
      result[key] = value[key];
    });
    return result;
  }

  function mergeObjects() {
    var result = {};
    for (var index = 0; index < arguments.length; index += 1) {
      var source = arguments[index];
      if (!source || typeof source !== 'object') continue;
      Object.keys(source).forEach(function mergeKey(key) {
        result[key] = source[key];
      });
    }
    return result;
  }

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value || {}, key);
  }

  function isPlainObject(value) {
    if (!value || Object.prototype.toString.call(value) !== '[object Object]') {
      return false;
    }
    var prototype = Object.getPrototypeOf(value);
    return prototype === null || prototype === Object.prototype;
  }

  function cleanBaseUrl(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function resolvedBaseUrl() {
    if (config.baseUrl) return cleanBaseUrl(config.baseUrl);
    return ENVIRONMENTS[config.environment] || ENVIRONMENTS[DEFAULT_ENVIRONMENT];
  }

  function safeParse(value) {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch (_error) {
      return null;
    }
  }

  function readStoredSession() {
    try {
      var parsed = safeParse(global.sessionStorage.getItem(STORAGE_KEY));
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  function persistSession(value) {
    try {
      if (value && Object.keys(value).length) {
        global.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } else {
        global.sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch (_error) {
      /*
       * sessionStorage can be unavailable in strict privacy/file contexts.
       * The request still succeeds; callers can react to the emitted event.
       */
    }
  }

  var session = readStoredSession();

  function cloneSession() {
    return mergeObjects({}, session);
  }

  function publicSession() {
    return {
      isAuthenticated: Boolean(session.accessToken),
      userId: session.userId == null ? null : session.userId,
      customerId: session.customerId == null ? null : session.customerId,
      cartId: session.cartId == null ? null : session.cartId,
      mobile: session.mobile || '',
      isRider: Boolean(session.isRider),
      user: session.user || null
    };
  }

  function createEvent(name, detail) {
    if (typeof global.CustomEvent === 'function') {
      return new global.CustomEvent(name, { detail: detail });
    }
    if (global.document && typeof global.document.createEvent === 'function') {
      var event = global.document.createEvent('CustomEvent');
      event.initCustomEvent(name, false, false, detail);
      return event;
    }
    return null;
  }

  function emitSessionEvent(name, detail) {
    if (typeof global.dispatchEvent !== 'function') return;
    var event = createEvent(name, detail);
    if (event) global.dispatchEvent(event);
  }

  function setSession(patch, eventName) {
    var next = mergeObjects({}, session, patch);
    Object.keys(next).forEach(function removeEmpty(key) {
      if (typeof next[key] === 'undefined') delete next[key];
    });
    session = next;
    persistSession(session);
    var detail = { session: publicSession() };
    emitSessionEvent('atulyash:sessionchange', detail);
    if (eventName) emitSessionEvent(eventName, detail);
    return cloneSession();
  }

  function clearSession(reason) {
    var previous = publicSession();
    session = {};
    pendingMobile = '';
    persistSession(session);
    var detail = {
      reason: reason || 'logout',
      previousSession: previous,
      session: publicSession()
    };
    emitSessionEvent('atulyash:sessionchange', detail);
    emitSessionEvent('atulyash:logout', detail);
  }

  function AtulyashAPIError(message, options) {
    options = options || {};
    this.name = 'AtulyashAPIError';
    this.message = message || 'The request could not be completed.';
    this.status = Number(options.status) || 0;
    this.code = options.code || (this.status ? 'HTTP_' + this.status : 'API_ERROR');
    this.details = typeof options.details === 'undefined' ? null : options.details;
    this.url = options.url || '';
    this.method = options.method || '';
    this.isNetworkError = Boolean(options.isNetworkError);
    this.isAborted = Boolean(options.isAborted);
    this.response = options.response || null;
    if (options.cause) this.cause = options.cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AtulyashAPIError);
    }
  }
  AtulyashAPIError.prototype = Object.create(Error.prototype);
  AtulyashAPIError.prototype.constructor = AtulyashAPIError;

  function firstUsefulMessage(details, fallback) {
    if (typeof details === 'string' && details.trim()) return details.trim();
    if (Array.isArray(details)) {
      for (var index = 0; index < details.length; index += 1) {
        var itemMessage = firstUsefulMessage(details[index], '');
        if (itemMessage) return itemMessage;
      }
    }
    if (details && typeof details === 'object') {
      var preferredKeys = [
        'detail',
        'message',
        'error_description',
        'error',
        'non_field_errors',
        'errors'
      ];
      for (var keyIndex = 0; keyIndex < preferredKeys.length; keyIndex += 1) {
        var preferred = firstUsefulMessage(details[preferredKeys[keyIndex]], '');
        if (preferred) return preferred;
      }
      var keys = Object.keys(details);
      for (var objectIndex = 0; objectIndex < keys.length; objectIndex += 1) {
        var nested = firstUsefulMessage(details[keys[objectIndex]], '');
        if (nested) return nested;
      }
    }
    return fallback || '';
  }

  function errorCode(details, status) {
    if (details && typeof details === 'object') {
      return details.code || details.error_code || details.errorCode || ('HTTP_' + status);
    }
    return 'HTTP_' + status;
  }

  function encodeQuery(query) {
    if (!query) return '';
    if (typeof query === 'string') return query.replace(/^\?/, '');
    if (typeof global.URLSearchParams === 'function' && query instanceof global.URLSearchParams) {
      return query.toString();
    }
    var pairs = [];
    Object.keys(query).forEach(function encodeKey(key) {
      var value = query[key];
      if (value === null || typeof value === 'undefined' || value === '') return;
      var values = Array.isArray(value) ? value : [value];
      values.forEach(function encodeValue(item) {
        if (item === null || typeof item === 'undefined') return;
        pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(item)));
      });
    });
    return pairs.join('&');
  }

  function buildUrl(path, query) {
    var rawPath = String(path || '');
    var url = /^https?:\/\//i.test(rawPath)
      ? rawPath
      : resolvedBaseUrl() + (rawPath.charAt(0) === '/' ? rawPath : '/' + rawPath);
    var queryString = encodeQuery(query);
    if (queryString) url += (url.indexOf('?') === -1 ? '?' : '&') + queryString;
    return url;
  }

  function isFormData(value) {
    return typeof global.FormData === 'function' && value instanceof global.FormData;
  }

  function isUrlSearchParams(value) {
    return typeof global.URLSearchParams === 'function' && value instanceof global.URLSearchParams;
  }

  function appendFormValue(formData, key, value) {
    if (typeof value === 'undefined') return;
    if (value === null) {
      formData.append(key, '');
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(function appendArrayItem(item) {
        appendFormValue(formData, key, item);
      });
      return;
    }
    if (isPlainObject(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, value);
  }

  function toFormData(payload) {
    if (isFormData(payload)) return payload;
    if (typeof global.FormData !== 'function') {
      throw new AtulyashAPIError('FormData is not supported in this browser.', {
        code: 'FORM_DATA_UNAVAILABLE'
      });
    }
    var formData = new global.FormData();
    Object.keys(payload || {}).forEach(function appendPayload(key) {
      appendFormValue(formData, key, payload[key]);
    });
    return formData;
  }

  function createHeaders(extraHeaders, accessToken) {
    var headers = typeof global.Headers === 'function' ? new global.Headers() : {};

    function setHeader(name, value) {
      if (value === null || typeof value === 'undefined' || value === '') return;
      if (headers && typeof headers.set === 'function') headers.set(name, String(value));
      else headers[name] = String(value);
    }

    setHeader('Accept', 'application/json');
    if (config.includeClientHeader) setHeader('X-Client', config.clientHeaderValue);

    [config.headers, extraHeaders].forEach(function addHeaderGroup(group) {
      if (!group) return;
      if (typeof global.Headers === 'function' && group instanceof global.Headers) {
        group.forEach(function copyHeader(value, name) {
          setHeader(name, value);
        });
        return;
      }
      Object.keys(group).forEach(function copyHeader(key) {
        setHeader(key, group[key]);
      });
    });

    if (accessToken) setHeader('Authorization', 'Bearer ' + accessToken);
    return headers;
  }

  function combineSignals(externalSignal, timeout) {
    var controller =
      typeof global.AbortController === 'function' ? new global.AbortController() : null;
    var timer = null;
    var removeExternalListener = function noop() {};

    if (!controller) {
      return {
        signal: externalSignal,
        cleanup: function cleanupNoController() {}
      };
    }

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
      } else if (typeof externalSignal.addEventListener === 'function') {
        var abortFromExternal = function abortFromExternal() {
          controller.abort(externalSignal.reason);
        };
        externalSignal.addEventListener('abort', abortFromExternal, { once: true });
        removeExternalListener = function removeSignalListener() {
          externalSignal.removeEventListener('abort', abortFromExternal);
        };
      }
    }

    if (timeout > 0) {
      timer = global.setTimeout(function timeoutRequest() {
        controller.abort();
      }, timeout);
    }

    return {
      signal: controller.signal,
      cleanup: function cleanupSignal() {
        if (timer) global.clearTimeout(timer);
        removeExternalListener();
      }
    };
  }

  function parseResponse(response) {
    if (response.status === 204 || response.status === 205) {
      return Promise.resolve(null);
    }
    var contentType = response.headers && response.headers.get
      ? response.headers.get('content-type') || ''
      : '';
    if (contentType.indexOf('json') !== -1) {
      return response.json().catch(function invalidJson() {
        return null;
      });
    }
    return response.text().then(function normalizeText(text) {
      if (!text) return null;
      var parsed = safeParse(text);
      return parsed === null ? text : parsed;
    });
  }

  function executeRequest(path, options) {
    options = options || {};
    var method = String(options.method || 'GET').toUpperCase();
    var url = buildUrl(path, options.query);
    var accessToken = options.auth === false ? '' : session.accessToken;
    var headers = createHeaders(options.headers, accessToken);
    var body = options.body;

    if (typeof body !== 'undefined' && body !== null && method !== 'GET' && method !== 'HEAD') {
      if (options.form === true && !isFormData(body)) {
        body = toFormData(body);
      } else if (
        !isFormData(body) &&
        !isUrlSearchParams(body) &&
        typeof body !== 'string' &&
        !(typeof global.Blob === 'function' && body instanceof global.Blob)
      ) {
        body = JSON.stringify(body);
        if (headers && typeof headers.set === 'function') {
          if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
        } else if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    } else {
      body = undefined;
    }

    var timeout = hasOwn(options, 'timeout') ? Number(options.timeout) : config.timeout;
    var combined = combineSignals(options.signal, timeout);
    var fetchOptions = {
      method: method,
      headers: headers,
      signal: combined.signal,
      credentials: options.credentials || 'omit'
    };
    if (options.cache) fetchOptions.cache = options.cache;
    if (typeof body !== 'undefined') fetchOptions.body = body;

    return global
      .fetch(url, fetchOptions)
      .then(function readResponse(response) {
        return parseResponse(response).then(function handleResponse(data) {
          if (!response.ok) {
            throw new AtulyashAPIError(
              firstUsefulMessage(data, 'Request failed with status ' + response.status + '.'),
              {
                status: response.status,
                code: errorCode(data, response.status),
                details: data,
                url: url,
                method: method,
                response: response
              }
            );
          }
          return data;
        });
      })
      .catch(function normalizeThrown(error) {
        if (error instanceof AtulyashAPIError) throw error;
        var aborted =
          (combined.signal && combined.signal.aborted) ||
          (error && error.name === 'AbortError');
        throw new AtulyashAPIError(
          aborted ? 'The request was cancelled.' : 'Unable to connect to Atulyash. Please try again.',
          {
            code: aborted ? 'ABORTED' : 'NETWORK_ERROR',
            url: url,
            method: method,
            isAborted: aborted,
            isNetworkError: !aborted,
            cause: error
          }
        );
      })
      .then(
        function cleanupSuccess(data) {
          combined.cleanup();
          return data;
        },
        function cleanupFailure(error) {
          combined.cleanup();
          throw error;
        }
      );
  }

  function recursiveValue(root, names, maxDepth) {
    var visited = [];
    function find(value, depth) {
      if (!value || typeof value !== 'object' || depth > maxDepth) return undefined;
      if (visited.indexOf(value) !== -1) return undefined;
      visited.push(value);
      for (var nameIndex = 0; nameIndex < names.length; nameIndex += 1) {
        var name = names[nameIndex];
        if (hasOwn(value, name) && value[name] !== null && typeof value[name] !== 'undefined') {
          return value[name];
        }
      }
      var keys = Object.keys(value);
      for (var keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
        var nested = value[keys[keyIndex]];
        if (nested && typeof nested === 'object') {
          var found = find(nested, depth + 1);
          if (typeof found !== 'undefined') return found;
        }
      }
      return undefined;
    }
    return find(root, 0);
  }

  function objectIdentifier(value) {
    if (value === null || typeof value === 'undefined') return undefined;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object') {
      return value.id || value.pk || value.uuid;
    }
    return undefined;
  }

  function nestedObject(root, names) {
    var value = recursiveValue(root, names, 4);
    return value && typeof value === 'object' ? value : undefined;
  }

  function decodeJwtPayload(token) {
    if (typeof token !== 'string' || typeof global.atob !== 'function') return {};
    var parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return {};
    try {
      var encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (encoded.length % 4) encoded += '=';
      var payload = safeParse(global.atob(encoded));
      return payload && typeof payload === 'object' ? payload : {};
    } catch (_error) {
      return {};
    }
  }

  function extractSession(response, fallback) {
    fallback = fallback || {};
    var extracted = {};
    var access = recursiveValue(
      response,
      ['access_token', 'accessToken', 'access', 'auth_token', 'authToken', 'token'],
      4
    );
    var refresh = recursiveValue(
      response,
      ['refresh_token', 'refreshToken', 'refresh'],
      4
    );
    var userObject = nestedObject(response, ['user', 'user_data', 'userData']);
    var customerObject = nestedObject(response, ['customer', 'customer_data', 'customerData']);
    var cartObject = nestedObject(response, ['cart', 'active_cart', 'activeCart']);

    var userId = recursiveValue(
      response,
      ['user_id', 'userId', 'user_pk', 'userPk', 'user'],
      4
    );
    var customerId = recursiveValue(
      response,
      ['customer_id', 'customerId', 'customer_pk', 'customerPk', 'customer'],
      4
    );
    var cartId = recursiveValue(response, ['cart_id', 'cartId', 'cart'], 4);
    var tokenClaims = decodeJwtPayload(
      typeof access === 'string' ? access : ''
    );

    if (typeof access !== 'undefined') extracted.accessToken = String(access);
    if (typeof refresh !== 'undefined') extracted.refreshToken = String(refresh);
    userId = objectIdentifier(userId);
    customerId = objectIdentifier(customerId);
    cartId = objectIdentifier(cartId);
    if (typeof userId === 'undefined') userId = objectIdentifier(userObject);
    if (typeof customerId === 'undefined') customerId = objectIdentifier(customerObject);
    if (typeof cartId === 'undefined') cartId = objectIdentifier(cartObject);
    if (typeof userId === 'undefined') {
      userId = objectIdentifier(
        recursiveValue(tokenClaims, ['user_id', 'userId'], 2)
      );
    }
    if (typeof customerId === 'undefined') {
      customerId = objectIdentifier(
        recursiveValue(tokenClaims, ['customer_id', 'customerId'], 2)
      );
    }
    if (typeof userId !== 'undefined') extracted.userId = userId;
    if (typeof customerId !== 'undefined') extracted.customerId = customerId;
    if (typeof cartId !== 'undefined') extracted.cartId = cartId;
    if (userObject) extracted.user = userObject;
    if (fallback.mobile) extracted.mobile = fallback.mobile;
    if (typeof fallback.isRider !== 'undefined') extracted.isRider = Boolean(fallback.isRider);
    return extracted;
  }

  function refreshSession(options) {
    options = options || {};
    if (refreshPromise) return refreshPromise;
    if (!session.refreshToken) {
      return Promise.reject(
        new AtulyashAPIError('Your session has expired. Please sign in again.', {
          status: 401,
          code: 'REFRESH_TOKEN_MISSING'
        })
      );
    }

    refreshPromise = executeRequest('/token/refresh/', {
      method: 'POST',
      body: { refresh: session.refreshToken },
      form: true,
      auth: false,
      signal: options.signal,
      timeout: options.timeout
    })
      .then(function storeRotatedTokens(response) {
        var extracted = extractSession(response);
        if (!extracted.accessToken) {
          throw new AtulyashAPIError('The refreshed session did not include an access token.', {
            status: 401,
            code: 'INVALID_REFRESH_RESPONSE',
            details: response
          });
        }
        /*
         * A rotating backend returns a new refresh token. If a deployment does
         * not rotate, retaining the existing refresh token remains compatible.
         */
        if (!extracted.refreshToken) extracted.refreshToken = session.refreshToken;
        setSession(extracted, 'atulyash:tokenrefresh');
        return cloneSession();
      })
      .catch(function expireSession(error) {
        clearSession('expired');
        emitSessionEvent('atulyash:autherror', { error: error, session: publicSession() });
        throw error;
      })
      .then(
        function finishRefresh(value) {
          refreshPromise = null;
          return value;
        },
        function failRefresh(error) {
          refreshPromise = null;
          throw error;
        }
      );
    return refreshPromise;
  }

  function request(path, options) {
    options = options || {};
    return executeRequest(path, options)
      .catch(function retryAfterUnauthorized(error) {
        var canRefresh =
          error &&
          error.status === 401 &&
          options.auth !== false &&
          options.retryAuth !== false &&
          options._retried !== true &&
          String(path) !== '/token/refresh/' &&
          Boolean(session.refreshToken);
        if (!canRefresh) throw error;
        /*
         * The shared refresh must not inherit one caller's AbortSignal; otherwise
         * cancelling that caller would terminate the refresh for every request
         * waiting on the same single-flight promise.
         */
        return refreshSession({ timeout: options.timeout }).then(
          function retryRequest() {
            return executeRequest(path, mergeObjects({}, options, { _retried: true }));
          }
        );
      })
      .catch(function finalizeUnauthorized(error) {
        if (
          error &&
          error.status === 401 &&
          options.auth !== false &&
          session.accessToken
        ) {
          clearSession('expired');
          emitSessionEvent('atulyash:autherror', {
            error: error,
            session: publicSession()
          });
        }
        throw error;
      });
  }

  function formRequest(method, path, payload, options) {
    options = options || {};
    var requestOptions = mergeObjects({}, options, {
      method: method,
      body: payload || {}
    });
    if (!hasOwn(options, 'form')) requestOptions.form = true;
    return request(path, requestOptions);
  }

  function getRequest(path, query, options) {
    return request(path, mergeObjects({}, options, { method: 'GET', query: query }));
  }

  function publicGet(path, query, options) {
    return request(path, mergeObjects({}, options, {
      method: 'GET',
      query: query,
      auth: false
    }));
  }

  function idPathSegment(value, sessionKey, label) {
    var resolved = value;
    if ((resolved === null || typeof resolved === 'undefined' || resolved === '') && sessionKey) {
      resolved = session[sessionKey];
    }
    if (resolved === null || typeof resolved === 'undefined' || resolved === '') {
      throw new AtulyashAPIError((label || 'ID') + ' is required.', {
        code: 'MISSING_IDENTIFIER'
      });
    }
    return encodeURIComponent(String(resolved));
  }

  function omit(source, keys) {
    var result = {};
    Object.keys(source || {}).forEach(function omitKey(key) {
      if (keys.indexOf(key) === -1) result[key] = source[key];
    });
    return result;
  }

  function withDefaults(defaults, values) {
    return mergeObjects({}, defaults, values || {});
  }

  function valuePayload(value, key) {
    if (isPlainObject(value) || isFormData(value)) return value;
    var payload = {};
    payload[key] = value;
    return payload;
  }

  function listAddresses(params, options) {
    params = params || {};
    var customerId = params.customerId || params.customer__id || session.customerId;
    var query = omit(params, ['customerId']);
    query = withDefaults({ page_size: 100, is_active: true }, query);
    if (customerId !== null && typeof customerId !== 'undefined' && customerId !== '') {
      query.customer__id = customerId;
    }
    return getRequest('/customers/customer-addresses/', query, options);
  }

  var auth = {
    requestOtp: function requestOtp(mobile, options) {
      options = options || {};
      var isRider = options.isRider === true || options.is_rider === true;
      pendingMobile = String(mobile || '').trim();
      return formRequest(
        'POST',
        '/users/otp/request/',
        { mobile: pendingMobile, is_rider: isRider },
        mergeObjects({}, options, { auth: false })
      );
    },

    verifyOtp: function verifyOtp(mobile, otp, options) {
      options = options || {};
      var normalizedMobile = String(mobile || pendingMobile || '').trim();
      var payload = {
        mobile: normalizedMobile,
        otp: String(otp || '').trim(),
        is_rider: options.isRider === true || options.is_rider === true
      };
      return formRequest(
        'POST',
        '/users/otp/verify/',
        payload,
        mergeObjects({}, options, { auth: false })
      ).then(function storeLogin(response) {
        var extracted = extractSession(response, {
          mobile: normalizedMobile,
          isRider: options.isRider === true || options.is_rider === true
        });
        if (!extracted.accessToken) {
          throw new AtulyashAPIError('OTP was verified but no access token was returned.', {
            code: 'INVALID_LOGIN_RESPONSE',
            details: response
          });
        }
        setSession(extracted, 'atulyash:login');
        pendingMobile = '';
        return response;
      });
    },

    refresh: refreshSession,

    logout: function logout(options) {
      options = options || {};
      var unregister = options.deviceToken
        ? notifications.unregisterDevice(options.deviceToken, {
            signal: options.signal,
            timeout: options.timeout
          }).catch(function ignoreUnregisterFailure() {
            return null;
          })
        : Promise.resolve(null);
      return unregister.then(function finishLogout() {
        clearSession('logout');
        return true;
      });
    },

    isAuthenticated: function isAuthenticated() {
      return Boolean(session.accessToken);
    },

    getSession: cloneSession
  };
  auth.requestOTP = auth.requestOtp;
  auth.verifyOTP = auth.verifyOtp;

  var addresses = {
    list: listAddresses,
    create: function createAddress(payload, options) {
      return formRequest('POST', '/customers/customer-addresses/', payload, options);
    },
    update: function updateAddress(addressId, payload, options) {
      return formRequest(
        'PATCH',
        '/customers/customer-addresses/' + idPathSegment(addressId, '', 'Address ID') + '/',
        payload,
        options
      );
    }
  };

  var home = {
    productVideos: function productVideos(params, options) {
      return publicGet(
        '/products/product-videos/',
        withDefaults({ is_active: true }, params),
        options
      );
    },
    sections: function homeSections(params, options) {
      params = params || {};
      var query = omit(params, ['isWeb']);
      query = withDefaults({ is_active: true, is_web: true }, query);
      if (hasOwn(params, 'isWeb')) query.is_web = params.isWeb;
      return publicGet(
        '/products/home-screen-sections/grouped-into-sections/',
        query,
        options
      );
    },
    videoTitles: function videoTitles(params, options) {
      return publicGet('/products/product-video-titles/', params, options);
    }
  };

  var cart = {
    list: function listCarts(params, options) {
      return getRequest(
        '/orders/cart/',
        withDefaults({ is_active: true }, params),
        options
      );
    },
    get: function getCart(cartId, options) {
      return getRequest(
        '/orders/cart/' + idPathSegment(cartId, 'cartId', 'Cart ID') + '/',
        null,
        options
      );
    },
    create: function createCart(payload, options) {
      var requestOptions = mergeObjects({}, options, {
        method: 'POST',
        body: withDefaults(
          { name: 'Atulyash Web Bag', is_active: true },
          isPlainObject(payload) ? payload : {}
        ),
        form: false
      });
      return request('/orders/cart/', requestOptions);
    },
    clear: function clearCart(options) {
      return getRequest('/orders/cart/clear-cart/', null, options);
    },
    addItem: function addCartItem(payload, options) {
      return formRequest('POST', '/orders/cart-items/', payload, options);
    },
    addOneTime: function addOneTime(payload, options) {
      return cart.addItem(withDefaults({ cart_item_type: 'One Time' }, payload), options);
    },
    addAddon: function addAddon(payload, options) {
      return cart.addItem(withDefaults({ cart_item_type: 'Add On' }, payload), options);
    },
    listSubscriptionAddOns: function listSubscriptionAddOns(params, options) {
      return getRequest('/subscription/subscription_add_ons/', params, options);
    },
    createSubscriptionAddOn: function createSubscriptionAddOn(payload, options) {
      return formRequest('POST', '/subscription/subscription_add_ons/', payload, options);
    },
    updateSubscriptionAddOn: function updateSubscriptionAddOn(addOnId, payload, options) {
      return formRequest(
        'PATCH',
        '/subscription/subscription_add_ons/' + idPathSegment(addOnId, '', 'Add-on ID') + '/',
        payload,
        options
      );
    },
    removeSubscriptionAddOn: function removeSubscriptionAddOn(addOnId, options) {
      return request(
        '/subscription/subscription_add_ons/' + idPathSegment(addOnId, '', 'Add-on ID') + '/remove/',
        mergeObjects({}, options, { method: 'POST', form: false })
      );
    },
    addSubscription: function addSubscription(payload, options) {
      return cart.addItem(withDefaults({ cart_item_type: 'Subscription' }, payload), options);
    },
    updateSubscription: function updateCartSubscription(planId, payload, options) {
      return formRequest(
        'POST',
        '/subscription/subscription_plan/' +
          idPathSegment(planId, '', 'Subscription plan ID') +
          '/update-pack/',
        payload,
        options
      );
    },
    updateItem: function updateItem(itemId, payload, options) {
      return formRequest(
        'PATCH',
        '/orders/cart-items/' + idPathSegment(itemId, '', 'Cart item ID') + '/',
        payload,
        options
      );
    },
    deleteItem: function deleteItem(itemId, options) {
      return request(
        '/orders/cart-items/' + idPathSegment(itemId, '', 'Cart item ID') + '/',
        mergeObjects({}, options, { method: 'DELETE' })
      );
    },
    applyCoupon: function applyCoupon(coupon, options) {
      return formRequest(
        'POST',
        '/orders/cart/apply-coupon/',
        valuePayload(coupon, 'coupon_id'),
        options
      );
    },
    removeCoupon: function removeCoupon(options) {
      return formRequest('POST', '/orders/cart/remove-coupon/', {}, options);
    },
    applyKit: function applyKit(options) {
      return formRequest('POST', '/orders/cart/apply-kit/', {}, options);
    },
    removeKit: function removeKit(options) {
      return formRequest('POST', '/orders/cart/remove-kit/', {}, options);
    },
    reorder: function reorder(orderId, options) {
      return formRequest(
        'POST',
        '/orders/order/' + idPathSegment(orderId, '', 'Order ID') + '/reorder/',
        {},
        options
      );
    }
  };

  function cartListItems(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload && payload.results)) return payload.results;
    if (Array.isArray(payload && payload.data)) return payload.data;
    if (Array.isArray(payload && payload.data && payload.data.results)) {
      return payload.data.results;
    }
    return [];
  }

  function firstListedActiveCart(payload) {
    var firstCart = cartListItems(payload)[0];
    return firstCart && firstCart.id != null && firstCart.is_active !== false
      ? firstCart
      : null;
  }

  function cartIdentity(payload) {
    var root =
      payload && payload.data && !Array.isArray(payload.data)
        ? payload.data
        : payload && payload.cart && typeof payload.cart === 'object'
          ? payload.cart
          : payload;
    return {
      cartId: objectIdentifier(root && (root.cart_id || root.cartId || root.id)),
      customerId: objectIdentifier(
        root && (root.customer_id || root.customerId || root.customer)
      )
    };
  }

  function persistCartIdentity(payload, mobile) {
    var identity = cartIdentity(payload);
    if (typeof identity.cartId === 'undefined') {
      throw new AtulyashAPIError('The cart service did not return a cart ID.', {
        code: 'CART_ID_MISSING',
        details: payload
      });
    }
    if (typeof identity.customerId === 'undefined') {
      throw new AtulyashAPIError(
        'Your mobile is verified, but we could not connect your customer account yet.',
        {
          code: 'CUSTOMER_ID_MISSING',
          details: payload
        }
      );
    }
    setSession({
      cartId: identity.cartId,
      customerId: identity.customerId,
      mobile: String(mobile || session.mobile || '').replace(/\D/g, '').slice(-10)
    });
    return payload;
  }

  cart.ensureActive = function ensureActiveCart(mobile, options) {
    options = options || {};
    var rememberedCartId = session.cartId;
    var activeCart;
    if (rememberedCartId != null) {
      activeCart = cart.get(rememberedCartId, options).catch(function refreshMissingCart(error) {
        if (Number(error && error.status) !== 404) throw error;
        return cart.list({ is_active: true }, options).then(function selectListedCart(response) {
          var listedCart = firstListedActiveCart(response);
          return listedCart || cart.create(
            { name: 'Atulyash Web Bag', is_active: true },
            options
          );
        });
      });
    } else {
      activeCart = cart.list({ is_active: true }, options).then(function selectListedCart(response) {
        var listedCart = firstListedActiveCart(response);
        return listedCart || cart.create(
          { name: 'Atulyash Web Bag', is_active: true },
          options
        );
      });
    }
    return activeCart.then(function saveActiveCartIdentity(activeCartPayload) {
      return persistCartIdentity(activeCartPayload, mobile);
    });
  };

  auth.resolveCustomerSession = function resolveCustomerSession(mobile) {
    /*
     * OTP verification is the authoritative identity handshake. The response
     * includes user_id, customer_id, and cart_id, so resolving any of those by
     * listing carts or fetching a user record is both unnecessary and can
     * trigger permission errors for customer sessions.
     */
    if (session.userId != null && session.customerId != null && session.cartId != null) {
      if (mobile) setSession({ mobile: String(mobile).replace(/\D/g, '').slice(-10) });
      return Promise.resolve(cloneSession());
    }
    return Promise.reject(new AtulyashAPIError(
      'OTP verification did not return a complete account session. Please sign in again.',
      {
        status: 401,
        code: 'LOGIN_CONTEXT_MISSING',
        details: {
          hasUserId: session.userId != null,
          hasCustomerId: session.customerId != null,
          hasCartId: session.cartId != null
        }
      }
    ));
  };

  var orders = {
    place: function placeOrder(payload, options) {
      return formRequest('POST', '/orders/order/place/', payload, options);
    },
    deliveryAvailability: function deliveryAvailability(address, options) {
      var query = isPlainObject(address) ? address : { address_id: address };
      return getRequest('/orders/order-delivery/delivery-availability/', query, options);
    },
    validateDeliveryDate: function validateDeliveryDate(payload, options) {
      return formRequest(
        'POST',
        '/orders/order-delivery/validate-delivery-date/',
        payload,
        options
      );
    },
    list: function listOrders(params, options) {
      params = params || {};
      var customerId = params.customerId || params.customer__id || session.customerId;
      var query = omit(params, ['customerId']);
      query = withDefaults(
        { page_size: 15, page: 1, is_active: true, pending_order: false },
        query
      );
      if (customerId !== null && typeof customerId !== 'undefined' && customerId !== '') {
        query.customer__id = customerId;
      }
      return getRequest('/orders/order/', query, options);
    },
    subscriptionDeliveries: function subscriptionDeliveries(orderId, params, options) {
      return getRequest(
        '/orders/order/' + idPathSegment(orderId, '', 'Order ID') + '/subscription-orders/',
        withDefaults({ page_size: 15, page: 1 }, params),
        options
      );
    },
    deliveries: function orderDeliveries(orderId, params, options) {
      return getRequest(
        '/orders/order/' + idPathSegment(orderId, '', 'Order ID') + '/deliveries/',
        params,
        options
      );
    },
    deliveryDetail: function deliveryDetails(deliveryId, options) {
      return getRequest(
        '/orders/order-delivery/' + idPathSegment(deliveryId, '', 'Delivery ID') + '/',
        null,
        options
      );
    },
    deliveryHistory: function deliveryHistory(deliveryId, params, options) {
      return getRequest(
        '/orders/order-delivery/' + idPathSegment(deliveryId, '', 'Delivery ID') + '/history/',
        params,
        options
      );
    },
    detail: function orderDetail(orderId, options) {
      return getRequest(
        '/orders/order/' + idPathSegment(orderId, '', 'Order ID') + '/',
        null,
        options
      );
    },
    changeAddress: function changeOrderAddress(orderId, payload, options) {
      return request(
        '/orders/order/' + idPathSegment(orderId, '', 'Order ID') + '/change-address/',
        mergeObjects({}, options, {
          method: 'POST',
          body: payload || {},
          form: false
        })
      );
    },
    modify: function modifyOrder(orderId, payload, options) {
      return request(
        '/orders/order/' + idPathSegment(orderId, '', 'Order ID') + '/modify/',
        mergeObjects({}, options, {
          method: 'PATCH',
          body: payload || {},
          form: false
        })
      );
    },
    modifyPreview: function previewOrderModification(orderId, payload, options) {
      return request(
        '/orders/order/' + idPathSegment(orderId, '', 'Order ID') + '/modify-preview/',
        mergeObjects({}, options, {
          method: 'POST',
          body: payload || {},
          form: false
        })
      );
    },
    cancel: function cancelOneTimeOrder(orderId, options) {
      return request(
        '/orders/order/' + idPathSegment(orderId, '', 'Order ID') + '/cancel/',
        mergeObjects({}, options, {
          method: 'POST',
          body: {},
          form: false
        })
      );
    },
    reorder: function reorderOrder(orderId, options) {
      return cart.reorder(orderId, options);
    }
  };
  orders.get = orders.detail;
  orders.subscriptionOrders = orders.subscriptionDeliveries;
  orders.listDeliveries = orders.deliveries;
  orders.getOrderDeliveries = orders.deliveries;
  orders.getDeliveryDetails = orders.deliveryDetail;
  orders.getDeliveryHistory = orders.deliveryHistory;
  orders.previewModification = orders.modifyPreview;
  orders.cancelOrder = orders.cancel;

  var products = {
    list: function listProducts(params, options) {
      return publicGet('/products/products/', params, options);
    },
    details: function productDetails(params, options) {
      return products.list(params, options);
    }
  };

  var profile = {
    getUser: function getUser(userId, options) {
      return getRequest(
        '/users/users/' + idPathSegment(userId, 'userId', 'User ID') + '/',
        null,
        options
      );
    },
    updateUser: function updateUser(userId, payload, options) {
      return formRequest(
        'PATCH',
        '/users/users/' + idPathSegment(userId, 'userId', 'User ID') + '/',
        payload,
        options
      );
    },
    getCustomer: function getCustomer(customerId, options) {
      return getRequest(
        '/customers/customers/' +
          idPathSegment(customerId, 'customerId', 'Customer ID') +
          '/',
        null,
        options
      );
    },
    deactivateCustomer: function deactivateCustomer(customerId, options) {
      return formRequest(
        'PATCH',
        '/customers/customers/' +
          idPathSegment(customerId, 'customerId', 'Customer ID') +
          '/',
        { is_active: false },
        options
      );
    },
    requestDeletion: function requestDeletion(reason, options) {
      return formRequest(
        'POST',
        '/users/account-deletion-requests/',
        valuePayload(reason, 'reason'),
        options
      );
    }
  };

  var notifications = {
    list: function listNotifications(params, options) {
      return getRequest('/notifications/', params, options);
    },
    unreadCount: function unreadNotificationCount(options) {
      return getRequest('/notifications/unread-count/', null, options);
    },
    markRead: function markNotificationRead(notificationId, options) {
      return formRequest(
        'PATCH',
        '/notifications/' +
          idPathSegment(notificationId, '', 'Notification ID') +
          '/read/',
        {},
        options
      );
    },
    markAllRead: function markAllNotificationsRead(options) {
      return formRequest('POST', '/notifications/mark-all-read/', {}, options);
    },
    registerDevice: function registerDevice(payload, options) {
      return formRequest('POST', '/notifications/devices/register/', payload, options);
    },
    unregisterDevice: function unregisterDevice(token, options) {
      return request(
        '/notifications/devices/unregister/',
        mergeObjects({}, options, {
          method: 'DELETE',
          query: isPlainObject(token) ? token : { token: token }
        })
      );
    }
  };

  var rider = {
    upcomingOrders: function upcomingOrders(params, options) {
      return getRequest('/beat_plan/my-upcoming-orders/', params, options);
    },
    orderDetail: function riderOrderDetail(deliveryId, options) {
      return getRequest(
        '/beat_plan/beat-plan-order-deliveries/' +
          idPathSegment(deliveryId, '', 'Delivery ID') +
          '/',
        null,
        options
      );
    }
  };

  var subscriptions = {
    listPacks: function listSubscriptionPacks(params, options) {
      return publicGet(
        '/subscription/subscription_pack/',
        withDefaults({ is_active: true, page_size: 100 }, params),
        options
      );
    },
    homeSections: function subscriptionHomeSections(params, options) {
      params = params || {};
      var query = omit(params, ['isWeb']);
      query = withDefaults({ is_active: true, is_web: true }, query);
      if (hasOwn(params, 'isWeb')) query.is_web = params.isWeb;
      return publicGet(
        '/subscription/home_screen_section/grouped-into-sections/',
        query,
        options
      );
    },
    preview: function previewSubscription(payload, options) {
      return formRequest('POST', '/subscription/subscription/preview/', payload, options);
    },
    previewChange: function previewSubscriptionChange(planId, payload, options) {
      return formRequest(
        'POST',
        '/subscription/subscription_plan/' +
          idPathSegment(planId, '', 'Subscription plan ID') +
          '/preview-pack-change/',
        payload,
        options
      );
    },
    updatePack: function updateSubscriptionPack(planId, payload, options) {
      return cart.updateSubscription(planId, payload, options);
    },
    confirmPackChange: function confirmSubscriptionPackChange(planId, payload, options) {
      return formRequest(
        'POST',
        '/subscription/subscription_plan/' +
          idPathSegment(planId, '', 'Subscription plan ID') +
          '/confirm-pack-change/',
        payload,
        options
      );
    },
    updateSchedule: function updateSubscriptionSchedule(planId, payload, options) {
      return request(
        '/subscription/subscription_plan/' +
          idPathSegment(planId, '', 'Subscription plan ID') +
          '/schedule/',
        mergeObjects({}, options, {
          method: 'PATCH',
          body: payload || {},
          form: false
        })
      );
    },
    listActive: function listActiveSubscriptions(params, options) {
      params = params || {};
      var customerId =
        params.customerId ||
        params.customer_address__customer__id ||
        session.customerId;
      var query = omit(params, ['customerId']);
      query = withDefaults({ is_active: true }, query);
      if (customerId !== null && typeof customerId !== 'undefined' && customerId !== '') {
        query.customer_address__customer__id = customerId;
      }
      return getRequest('/subscription/subscription_plan/', query, options);
    },
    cancel: function cancelSubscription(planId, payload, options) {
      return formRequest(
        'POST',
        '/subscription/subscription_plan/' +
          idPathSegment(planId, '', 'Subscription plan ID') +
          '/cancel/',
        payload,
        options
      );
    },
    consumptionCalculator: function consumptionCalculator(rotis, options) {
      var query = isPlainObject(rotis) ? rotis : { rotis_per_day: rotis };
      return publicGet(
        '/subscription/subscription_pack/consumption-calculator/',
        query,
        options
      );
    },
    skip: function skipSubscriptionDelivery(planId, date, options) {
      return formRequest(
        'POST',
        '/subscription/subscription_plan/' +
          idPathSegment(planId, '', 'Subscription plan ID') +
          '/skip/',
        valuePayload(date, 'delivery_date'),
        options
      );
    },
    skipSummary: function subscriptionSkipSummary(planId, options) {
      return getRequest(
        '/subscription/subscription_plan/' +
          idPathSegment(planId, '', 'Subscription plan ID') +
          '/skip-summary/',
        null,
        options
      );
    },
    skippableDeliveries: function skippableSubscriptionDeliveries(planId, options) {
      return getRequest(
        '/subscription/subscription_plan/' +
          idPathSegment(planId, '', 'Subscription plan ID') +
          '/skippable-deliveries/',
        null,
        options
      );
    },
    unskip: function unskipSubscriptionDelivery(planId, date, options) {
      return formRequest(
        'POST',
        '/subscription/subscription_plan/' +
          idPathSegment(planId, '', 'Subscription plan ID') +
          '/unskip/',
        valuePayload(date, 'delivery_date'),
        options
      );
    },
    settings: function subscriptionSettings(options) {
      return publicGet('/subscription/policy/', null, options);
    },
    listVacations: function listVacations(params, options) {
      params = params || {};
      var customerId =
        params.customerId ||
        params.subscription__customer_address__customer ||
        session.customerId;
      var query = omit(params, ['customerId']);
      query = withDefaults({ is_active: true }, query);
      if (customerId !== null && typeof customerId !== 'undefined' && customerId !== '') {
        query.subscription__customer_address__customer = customerId;
      }
      return getRequest('/subscription/vacation/', query, options);
    },
    createVacation: function createVacation(payload, options) {
      return formRequest('POST', '/subscription/vacation/', payload, options);
    },
    updateVacation: function updateVacation(vacationId, payload, options) {
      return formRequest(
        'PATCH',
        '/subscription/vacation/' +
          idPathSegment(vacationId, '', 'Vacation ID') +
          '/',
        payload,
        options
      );
    },
    endVacation: function endVacation(vacationId, options) {
      return formRequest(
        'POST',
        '/subscription/vacation/' +
          idPathSegment(vacationId, '', 'Vacation ID') +
          '/end_vacation/',
        {},
        options
      );
    },
    cancellationReasons: function subscriptionCancellationReasons(options) {
      return getRequest('/subscription/cancellation_reasons/', null, options);
    }
  };

  var faqs = {
    list: function listFaqs(params, options) {
      return publicGet(
        '/customers/customer-faqs/',
        withDefaults({ page_size: 100, is_active: true }, params),
        options
      );
    }
  };

  var truthBook = {
    latest: function latestTruthBook(params, options) {
      return publicGet(
        '/products/product-truth-books/latest/',
        withDefaults({ is_active: true }, params),
        options
      );
    }
  };

  var reviews = {
    list: function listReviews(params, options) {
      return publicGet(
        '/reviews/reviews/',
        withDefaults({ page_size: 50, is_active: true, to_display: true }, params),
        options
      );
    },
    submit: function submitReview(payload, options) {
      return formRequest(
        'POST',
        '/reviews/reviews/',
        withDefaults({ is_active: true, to_display: false }, payload),
        options
      );
    },
    forOrder: function reviewForOrder(orderId, options) {
      return publicGet(
        '/reviews/reviews/',
        { page_size: 10, is_active: true, order: orderId },
        options
      );
    },
    rateRider: function rateRider(deliveryId, rating, options) {
      return formRequest(
        'PATCH',
        '/orders/order-delivery/' +
          idPathSegment(deliveryId, '', 'Delivery ID') +
          '/',
        valuePayload(rating, 'rider_rating'),
        options
      );
    }
  };

  var wallet = {
    balance: function walletBalance(customerId, options) {
      return getRequest(
        '/customers/customer-wallet/' +
          idPathSegment(customerId, 'customerId', 'Customer ID') +
          '/',
        null,
        options
      );
    },
    legacyTopup: function legacyWalletTopup(amount, options) {
      return formRequest(
        'POST',
        '/orders/wallet/topup/',
        valuePayload(amount, 'amount'),
        options
      );
    },
    rechargePreview: function walletRechargePreview(amount, options) {
      /*
       * The wallet policy is evaluated against the authenticated cart. Keep
       * the original numeric-amount signature for existing callers, while
       * allowing checkout to send the cart and subscription context the
       * server uses to resolve the active coupon.
       */
      var payload = isPlainObject(amount) ? amount : valuePayload(amount, 'amount');
      return formRequest(
        'POST',
        '/customers/customer-wallet/recharge/preview/',
        payload,
        options
      );
    },
    rechargeInitiate: function walletRechargeInitiate(amount, options) {
      var payload = isPlainObject(amount) ? amount : valuePayload(amount, 'amount');
      return formRequest(
        'POST',
        '/customers/customer-wallet/recharge/initiate/',
        payload,
        options
      );
    },
    rechargeVerify: function walletRechargeVerify(payload, options) {
      return formRequest(
        'POST',
        '/customers/customer-wallet/recharge/verify/',
        payload,
        options
      );
    },
    rechargeOptions: function walletRechargeOptions(params, options) {
      var query = isPlainObject(params) ? params : { cart_amount: params };
      return getRequest('/customers/customer-wallet/recharge/options/', query, options);
    },
    prepaidAdvantageSlabs: function prepaidAdvantageSlabs(options) {
      return getRequest(
        '/customers/customer-wallet/prepaid-advantage-slabs/',
        null,
        options
      );
    },
    transactions: function walletTransactions(params, options) {
      var query = isPlainObject(params) ? params : { page: params };
      return getRequest('/orders/wallet/', query, options);
    }
  };

  var payment = {
    verify: function verifyPayment(payload, options) {
      return formRequest('POST', '/orders/payment-verify/verify/', payload, options);
    }
  };

  var pincodes = {
    list: function listPincodes(params, options) {
      return getRequest(
        '/pincodes/pincode/',
        withDefaults({ is_active: true, page_size: 200 }, params),
        options
      );
    },
    serviceability: function pincodeServiceability(pincode, options) {
      var query = isPlainObject(pincode) ? pincode : { pincode: pincode };
      return publicGet('/pincodes/pincode/serviceability/', query, options);
    },
    areas: function pincodeAreas(params, options) {
      return publicGet('/pincodes/area/', params || {}, options);
    }
  };

  var coupons = {
    eligible: function eligibleCoupons(params, options) {
      return getRequest(
        '/coupon/coupons/get-coupons-for-cart/',
        withDefaults({ is_active: true }, params),
        options
      );
    }
  };

  var contact = {
    get: function contactDetails(params, options) {
      return publicGet(
        '/products/contact-us/',
        withDefaults({ is_active: true }, params),
        options
      );
    }
  };

  function normalizedPagination(response) {
    var source = response || {};
    var candidate = source;
    if (source.data && typeof source.data === 'object' && !Array.isArray(source.data)) {
      var nestedHasList =
        Array.isArray(source.data.results) ||
        Array.isArray(source.data.items) ||
        Array.isArray(source.data.data);
      if (nestedHasList) candidate = source.data;
    }

    var items = [];
    if (Array.isArray(candidate)) items = candidate;
    else if (Array.isArray(candidate.results)) items = candidate.results;
    else if (Array.isArray(candidate.items)) items = candidate.items;
    else if (Array.isArray(candidate.data)) items = candidate.data;

    var count =
      candidate.count == null
        ? candidate.total == null
          ? candidate.total_count == null
            ? items.length
            : candidate.total_count
          : candidate.total
        : candidate.count;

    return {
      items: items,
      count: Number(count) || 0,
      next: candidate.next || candidate.next_page || candidate.nextPage || null,
      previous:
        candidate.previous || candidate.previous_page || candidate.previousPage || null,
      page:
        Number(candidate.page || candidate.current_page || candidate.currentPage) || null,
      pageSize:
        Number(candidate.page_size || candidate.pageSize || candidate.per_page) || null,
      raw: response
    };
  }

  function pageNumberFromLink(link) {
    if (link === null || typeof link === 'undefined' || link === false) return null;
    if (typeof link === 'number') return link;
    var match = String(link).match(/[?&]page=(\d+)/);
    return match ? Number(match[1]) : null;
  }

  var pagination = {
    normalize: normalizedPagination,
    items: function paginationItems(response) {
      return normalizedPagination(response).items;
    },
    hasNext: function paginationHasNext(response) {
      return Boolean(normalizedPagination(response).next);
    },
    hasPrevious: function paginationHasPrevious(response) {
      return Boolean(normalizedPagination(response).previous);
    },
    nextPage: function paginationNextPage(response) {
      return pageNumberFromLink(normalizedPagination(response).next);
    },
    previousPage: function paginationPreviousPage(response) {
      return pageNumberFromLink(normalizedPagination(response).previous);
    }
  };

  var misc = {
    faqs: faqs.list,
    truthBook: truthBook.latest,
    contact: contact.get,
    reviews: reviews.list,
    submitReview: reviews.submit,
    reviewForOrder: reviews.forOrder,
    rateRider: reviews.rateRider,
    wallet: wallet.balance,
    walletTransactions: wallet.transactions,
    walletLegacyTopup: wallet.legacyTopup,
    rechargePreview: wallet.rechargePreview,
    rechargeInitiate: wallet.rechargeInitiate,
    rechargeVerify: wallet.rechargeVerify,
    rechargeOptions: wallet.rechargeOptions,
    prepaidAdvantageSlabs: wallet.prepaidAdvantageSlabs,
    pincodes: pincodes.list,
    coupons: coupons.eligible,
    verifyPayment: payment.verify,
    cancellationReasons: subscriptions.cancellationReasons
  };

  function configure(nextConfig) {
    nextConfig = nextConfig || {};
    if (
      hasOwn(nextConfig, 'environment') &&
      !hasOwn(ENVIRONMENTS, nextConfig.environment)
    ) {
      throw new AtulyashAPIError(
        'Unknown API environment "' + nextConfig.environment + '".',
        { code: 'INVALID_ENVIRONMENT' }
      );
    }
    if (hasOwn(nextConfig, 'environment')) config.environment = nextConfig.environment;
    if (hasOwn(nextConfig, 'baseUrl')) config.baseUrl = cleanBaseUrl(nextConfig.baseUrl);
    if (hasOwn(nextConfig, 'timeout')) config.timeout = Number(nextConfig.timeout) || 0;
    if (hasOwn(nextConfig, 'headers')) config.headers = copyObject(nextConfig.headers);
    if (hasOwn(nextConfig, 'includeClientHeader')) {
      config.includeClientHeader = nextConfig.includeClientHeader === true;
    }
    if (hasOwn(nextConfig, 'clientHeaderValue')) {
      config.clientHeaderValue = String(nextConfig.clientHeaderValue || 'mobile');
    }
    return getConfig();
  }

  function getConfig() {
    return {
      environment: config.environment,
      baseUrl: resolvedBaseUrl(),
      timeout: config.timeout,
      headers: copyObject(config.headers),
      includeClientHeader: config.includeClientHeader,
      clientHeaderValue: config.clientHeaderValue,
      environments: mergeObjects({}, ENVIRONMENTS)
    };
  }

  function on(eventName, handler, options) {
    if (typeof global.addEventListener !== 'function') return function noop() {};
    var fullName =
      String(eventName).indexOf('atulyash:') === 0
        ? String(eventName)
        : 'atulyash:' + String(eventName);
    global.addEventListener(fullName, handler, options);
    return function unsubscribe() {
      global.removeEventListener(fullName, handler, options);
    };
  }

  function off(eventName, handler, options) {
    if (typeof global.removeEventListener !== 'function') return;
    var fullName =
      String(eventName).indexOf('atulyash:') === 0
        ? String(eventName)
        : 'atulyash:' + String(eventName);
    global.removeEventListener(fullName, handler, options);
  }

  var AtulyashAPI = {
    VERSION: '1.0.0',
    environments: ENVIRONMENTS,
    Error: AtulyashAPIError,
    configure: configure,
    getConfig: getConfig,
    request: request,
    toFormData: toFormData,
    getSession: cloneSession,
    setSession: function apiSetSession(value) {
      return setSession(value || {}, null);
    },
    clearSession: clearSession,
    isAuthenticated: auth.isAuthenticated,
    on: on,
    off: off,
    pagination: pagination,
    auth: auth,
    addresses: addresses,
    home: home,
    cart: cart,
    orders: orders,
    products: products,
    profile: profile,
    notifications: notifications,
    rider: rider,
    subscriptions: subscriptions,
    faqs: faqs,
    truthBook: truthBook,
    reviews: reviews,
    wallet: wallet,
    payment: payment,
    pincodes: pincodes,
    coupons: coupons,
    contact: contact,
    misc: misc
  };

  global.AtulyashAPI = Object.freeze(AtulyashAPI);
})(typeof window !== 'undefined' ? window : globalThis);
