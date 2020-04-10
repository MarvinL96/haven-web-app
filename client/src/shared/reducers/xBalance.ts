import {
  GET_BALANCES_FAILED,
  GET_BALANCES_FETCHING,
  GET_BALANCES_SUCCEED,
  GET_OFFSHORE_BALANCE_SUCCEED
} from "platforms/desktop/actions/types";
import { AnyAction } from "redux";
import { DesktopAppState } from "platforms/desktop/reducers";
import { INITAL_FETCHING_STATE, Ticker, XFetching } from "./types";
import { selectXRate } from "platforms/desktop/reducers/blockHeaderExchangeRates";
import bigInt from "big-integer";
import {convertBalanceForReading} from "utility/utility";

export const NO_BALANCE = bigInt.zero;

export interface Balance {
  [key: string]: bigInt.BigInteger;
  balance: bigInt.BigInteger;
  unlockedBalance: bigInt.BigInteger;
  lockedBalance: bigInt.BigInteger;
}

export interface ViewBalance {
  [key: string]: number;
  balance: number;
  unlockedBalance: number;
  lockedBalance: number;
}

export type XBalance = Partial<{ [key in Ticker]: Balance }>;
export type XBalances = { [key in Ticker]: Balance };
export type XViewBalance = Partial<{ [key in Ticker]: ViewBalance }>;
export type XViewBalances = { [key in Ticker]: ViewBalance };

const INITIAL_BALANCE: Balance = {
  balance: NO_BALANCE,
  unlockedBalance: NO_BALANCE,
  lockedBalance: NO_BALANCE
};

const INITIAL_VIEW_BALANCE: ViewBalance = {
  balance: -1,
  unlockedBalance: -1,
  lockedBalance: -1
};

const INITIAL_STATE: XBalances = {
  xUSD: { ...INITIAL_BALANCE },
  XHV: { ...INITIAL_BALANCE },
  xBTC: { ...INITIAL_BALANCE }
};

export function fetching(
  state = INITAL_FETCHING_STATE,
  action: AnyAction
): XFetching {
  switch (action.type) {
    case GET_BALANCES_FETCHING:
      return { ...state };
    case GET_BALANCES_FAILED:
      return { ...state };
    default:
      return state;
  }
}

export function xBalance(
  state = INITIAL_STATE,
  action: { type: string; payload: XBalance }
): XBalances {
  switch (action.type) {
    case GET_BALANCES_SUCCEED:
    case GET_OFFSHORE_BALANCE_SUCCEED:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}


export const selectBalances = (state: DesktopAppState): XViewBalance => {


  return {
    [Ticker.XHV] : {
      balance: convertBalanceForReading(state.xBalance[Ticker.XHV].balance),
      unlockedBalance: convertBalanceForReading(state.xBalance[Ticker.XHV].unlockedBalance),
      lockedBalance: convertBalanceForReading(state.xBalance[Ticker.XHV].lockedBalance)
    }
  }



}

export const selectTotalBalances = (state: DesktopAppState): XViewBalance => {
  const defaultBalance = {
    [Ticker.XHV]: { ...INITIAL_VIEW_BALANCE },
    [Ticker.xUSD]: { ...INITIAL_VIEW_BALANCE },
    xBTC: { ...INITIAL_VIEW_BALANCE }
  };

  const xBalance = state.xBalance;

  const xhvToUSdRate = selectXRate(
    state.blockHeaderExchangeRate,
    Ticker.XHV,
    Ticker.xUSD
  );

  const usdToXhvRate = selectXRate(
    state.blockHeaderExchangeRate,
    Ticker.xUSD,
    Ticker.XHV
  );

  const xhvToBtcRate = selectXRate(
    state.blockHeaderExchangeRate,
    Ticker.XHV,
    Ticker.xBTC
  );

  if (xhvToUSdRate === null || xhvToBtcRate === null || usdToXhvRate === null) {
    return defaultBalance;
  }

  const xUSDTotalBalance: ViewBalance = Object.entries(xBalance.xUSD).reduce(
    (result: any, [balanceType, balance]) => {
      const total =
        xBalance.XHV[balanceType].toJSNumber() * xhvToUSdRate +
        balance.toJSNumber();
      result[balanceType] = total / Math.pow(10, 12);
      return result;
    },
    {}
  );

  const xHVTotalBalance: ViewBalance = Object.entries(xBalance.XHV).reduce(
    (result: any, [balanceType, balance]) => {
      const total =
        xBalance.xUSD[balanceType].toJSNumber() * usdToXhvRate +
        balance.toJSNumber();
      result[balanceType] = total / Math.pow(10, 12);
      return result;
    },
    {}
  );

  const btcTotalBalance: ViewBalance = Object.entries(xHVTotalBalance).reduce(
    (result: any, [balanceType, balance]) => {
      const total = balance * xhvToBtcRate;
      result[balanceType] = total;
      return result;
    },
    {}
  );

  return {
    [Ticker.xUSD]: xUSDTotalBalance,
    xBTC: btcTotalBalance
  };
};

export const selectValueOfAssetsInUSD = (
  state: DesktopAppState
): XViewBalance => {
  // const defaultBalance = {
  //   [Ticker.XHV] : {...INITIAL_VIEW_BALANCE},
  //   [Ticker.xUSD] : {...INITIAL_VIEW_BALANCE}
  // };

  const xhvToUSDRate: number = selectXRate(
    state.blockHeaderExchangeRate,
    Ticker.XHV,
    Ticker.xUSD
  );

  let xUSDBalance: ViewBalance = { ...INITIAL_VIEW_BALANCE };
  Object.entries(state.xBalance.xUSD).forEach(
    ([balanceType, balance]) =>
      (xUSDBalance[balanceType] = balance.toJSNumber() / Math.pow(10, 12))
  );

  let xhvBalanceInUSD: ViewBalance = { ...INITIAL_VIEW_BALANCE };
  Object.entries(state.xBalance.XHV).forEach(
    ([balanceType, balance]) =>
      (xhvBalanceInUSD[balanceType] =
        (balance.toJSNumber() / Math.pow(10, 12)) * xhvToUSDRate)
  );

  return {
    [Ticker.XHV]: xhvBalanceInUSD,
    [Ticker.xUSD]: xUSDBalance
  };
};
