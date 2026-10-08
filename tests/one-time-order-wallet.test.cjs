const test = require('node:test');
const assert = require('node:assert/strict');

const wallet = require('../one-time-order-wallet.js');

test('uses the backend-reported shortfall for a paid-order top-up', () => {
  assert.equal(wallet.shortfall({
    balance_check_required: true,
    balance_sufficient: false,
    shortfall: '480.00',
    difference: '1920.00',
    available_balance: '1440.00',
  }), 480);
  assert.equal(wallet.isInsufficient({ balance_sufficient: false }), true);
});

test('derives a shortfall from authoritative difference and available balance when omitted', () => {
  assert.equal(wallet.shortfall({
    balance_check_required: true,
    balance_sufficient: false,
    difference: '120.00',
    available_balance: '40.00',
  }), 80);
});

test('recognizes wallet-funded edits that settle on delivery', () => {
  assert.equal(wallet.settlementOnDelivery({ wallet_funded: true }), true);
  assert.equal(wallet.settlementOnDelivery({ settlement_on_delivery: true }), true);
  assert.equal(wallet.settlementOnDelivery({ wallet_funded: false }), false);
});

test('normalizes an execution-time insufficient-wallet error for the same top-up UI', () => {
  const result = wallet.insufficientWalletError({
    code: 'INSUFFICIENT_AVAILABLE_WALLET',
    details: { shortfall: '75.00', available_balance: '25.00' },
  });
  assert.equal(result.balance_check_required, true);
  assert.equal(result.balance_sufficient, false);
  assert.equal(wallet.shortfall(result), 75);
  assert.equal(wallet.insufficientWalletError({ code: 'ORDER_LOCKED', details: {} }), null);
});

test('one-time order top-up is wallet-only and is not attached to an active cart or subscription', () => {
  assert.deepEqual(wallet.rechargePayload(480, {
    cartId: null,
    subscriptionPlanId: null,
    walletOnly: true,
  }), {
    amount: 480,
    wallet_only: true,
  });
});
