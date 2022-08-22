import { createAction } from '@reduxjs/toolkit'


export const typeInput = createAction<{ typedValue: string }>('governance/typeInput')
export const typeInputTime = createAction<{ typedTime: string }>('governance/typeInputTime')
export const changeChainIdGov = createAction<{ newChainId: number }>('governance/changeChainIdGov')
