(function exposeOneTimeOrderWallet(root, factory) {
  const api = factory();
  if (root) root.AtulyashOneTimeOrderWallet = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis === 'object' ? globalThis : this, function createOneTimeOrderWalletHelpers() {
  function amount(...values) {
    for (const value of values) {
      if (value == null || value === '') continue;
      const parsed = Number(String(value).replace(/[₹,\s]/g, ''));
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }

  function shortfall(preview) {
    const reported = amount(
      preview?.shortfall,
      preview?.shortfall_amount,
      preview?.wallet_shortfall
    );
    if (reported != null && reported > 0) return reported;
    if (preview?.balance_sufficient === false) {
      const required = amount(
        preview?.amount_due,
        preview?.difference,
        preview?.additional_amount
      );
      const available = amount(
        preview?.available_balance,
        preview?.spendable_balance
      ) ?? 0;
      if (required != null) return Math.max(0, required - available);
    }
    return 0;
  }

  function isInsufficient(preview) {
    return preview?.balance_sufficient === false
      || (preview?.balance_check_required === true && shortfall(preview) > 0);
  }

  function settlementOnDelivery(preview) {
    return preview?.settlement_on_delivery === true
      || preview?.wallet_funded === true;
  }

  function insufficientWalletError(error) {
    const details = error?.details
      ?? error?.data
      ?? error?.response?.data
      ?? error?.body;
    if (!details || typeof details !== 'object') return null;
    const code = String(error?.code ?? details.code ?? details.error_code ?? '').toUpperCase();
    if (!code.includes('INSUFFICIENT') || !code.includes('WALLET')) return null;
    return {
      ...details,
      balance_check_required: true,
      balance_sufficient: false
    };
  }

  function rechargePayload(amountValue, { cartId = null, subscriptionPlanId = null, walletOnly = false } = {}) {
    const parsedAmount = amount(amountValue);
    const payload = { amount: Math.max(1, Math.ceil(parsedAmount || 0)) };
    if (cartId != null && cartId !== '') payload.cart_id = cartId;
    if (subscriptionPlanId != null && subscriptionPlanId !== '') {
      payload.subscription_plan_id = subscriptionPlanId;
    }
    if (walletOnly) payload.wallet_only = true;
    return payload;
  }

  return { shortfall, isInsufficient, settlementOnDelivery, insufficientWalletError, rechargePayload };
});
