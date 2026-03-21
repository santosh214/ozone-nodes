export interface SyncInfo {
  checkedAt: string;
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  results: NodeInfo[];
}

export interface NodeInfo {
  name: string;
  ip: string;
  node: string;
  online: boolean;
  checkedAt: string;
  peerCount: number | null;
  error?: string;
  syncInfo?: {
    latestBlockHeight: number;
    latestBlockTime: string;
    catchingUp: boolean;
    latestBlockHash: string;
    latestAppHash: string;
    earliestBlockHeight: number;
    earliestBlockTime: string;
  };
  nodeInfo?: {
    id: string;
    network: string;
    moniker: string;
    version: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
}
