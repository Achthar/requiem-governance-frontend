import { Currency, CurrencyAmount, Token, TokenAmount } from "@requiemswap/sdk"
import { BigNumber } from "ethers"
import { parseUnits } from "ethers/lib/utils"

// try to parse a user entered amount for a given token
export function tryParseTokenAmount(value: string, token: Token): TokenAmount | undefined {
    if (!value || !token) {
      return undefined
    }
    try {
      const typedValueParsed = parseUnits(value, token.decimals).toString()
      if (typedValueParsed !== '0') {
        return new TokenAmount(token, BigNumber.from(typedValueParsed))
      }
    } catch (error: any) {
      // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
      console.debug(`Failed to parse input amount: "${value}"`, error)
    }
    // necessary for all paths to return a value
    return undefined
  }
  
  // try to parse a user entered amount for a given token
  export function tryParseAmount(chainId: number, value?: string, currency?: Currency): CurrencyAmount | undefined {
    if (!value || !currency) {
      return undefined
    }
    try {
      const typedValueParsed = parseUnits(value, currency.decimals).toString()
      if (typedValueParsed !== '0') {
        return currency instanceof Token
          ? new TokenAmount(currency, BigNumber.from(typedValueParsed))
          : CurrencyAmount.networkCCYAmount(chainId, BigNumber.from(typedValueParsed))
      }
    } catch (error: any) {
      // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
      console.debug(`Failed to parse input amount: "${value}"`, error)
    }
    // necessary for all paths to return a value
    return undefined
  }
  