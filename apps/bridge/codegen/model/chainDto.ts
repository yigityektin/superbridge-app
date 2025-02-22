/**
 * Generated by orval v6.24.0 🍺
 * Do not edit manually.
 * API
 * API docs
 * OpenAPI spec version: 1.0
 */
import type { BlockExplorersDto } from './blockExplorersDto';
import type { ChainNativeCurrencyDto } from './chainNativeCurrencyDto';
import type { RpcUrlsDto } from './rpcUrlsDto';

export interface ChainDto {
  blockExplorers?: BlockExplorersDto;
  id: number;
  name: string;
  nativeCurrency: ChainNativeCurrencyDto;
  network: string;
  rpcUrls: RpcUrlsDto;
  testnet?: boolean;
}
