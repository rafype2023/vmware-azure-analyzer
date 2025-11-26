export interface AzureConfiguration {
  resourceGroup: string;
  region: string;
  vnetName: string;
  subnetName: string;
  nsgName: string;
  publicIp: boolean;
  vmSize: string;
  osDiskType: 'Standard_LRS' | 'StandardSSD_LRS' | 'Premium_LRS';
  tags: Record<string, string>;
  status: 'Pending' | 'Complete';
  maintenanceWindowIds?: {
    resourceGroup?: string;
    vnet?: string;
    subnet?: string;
    nsg?: string;
  };
}

export interface MaintenanceWindow {
  id: string;
  label: string;
  resourceGroups: string[];
  vnets: string[];
  subnets: string[];
  nsgs: string[];
}

export interface Server {
  id: string;
  name: string;
  os: string;
  cores: number;
  memoryGB: number;
  storageGB: number;
  ipAddress?: string;
  migrationPhase?: string;
  azureConfig?: AzureConfiguration;
}

export interface AnalysisResult {
  totalServers: number;
  totalCores: number;
  totalMemoryGB: number;
  totalStorageTB: number;
  estimatedMonthlyCost: number;
  completionPercentage: number;
}
