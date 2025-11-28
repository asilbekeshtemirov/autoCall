/**
 * Response Formatter - Converts Sipuni API responses to clean, readable format
 * Shows only essential data
 */

export interface FormattedCampaign {
  success: boolean;
  id: string;
  name: string;
  type?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface FormattedCallResult {
  phoneNumber: string;
  status: 'answered' | 'missed' | 'failed' | 'unknown';
  duration?: number;
  timestamp?: string;
  operator?: string;
}

export interface FormattedReport {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  activeCalls: number;
  successRate: string;
  missedRate: string;
  activeRate: string;
  averageDuration?: string;
  averageAnswerTime?: string;
  calls: FormattedCallResult[];
}

/**
 * Format campaign creation/details response
 * Handles Sipuni API response: { data: { autocall: { id, name, ... } } }
 */
export function formatCampaign(data: any): FormattedCampaign {
  // Extract campaign object if it's nested
  let campaignObj = data;
  if (data && data.data && data.data.autocall) {
    campaignObj = data.data.autocall;
  } else if (data && data.autocall) {
    campaignObj = data.autocall;
  }

  return {
    success: true,
    id: campaignObj.id || campaignObj.autocallId || '',
    name: campaignObj.name || '',
    type: campaignObj.type || 'default',
    status: campaignObj.state === 0 ? 'paused' : campaignObj.state === 1 ? 'active' : 'unknown',
    createdAt: campaignObj.created_at || campaignObj.createdAt || new Date().toISOString(),
  };
}

/**
 * Format call result - show if call was answered yes/no
 */
export function formatCallResult(data: any): FormattedCallResult {
  const statusMap: any = {
    'completed': 'answered',
    'missed': 'missed',
    'failed': 'failed',
    'no_answer': 'missed',
    'not_reached': 'missed',
    'error': 'failed',
  };

  return {
    phoneNumber: data.number || data.phone || data.phoneNumber || '',
    status: statusMap[data.status] || 'unknown',
    duration: data.duration || data.callDuration || 0,
    timestamp: data.timestamp || data.created_at || '',
    operator: data.operator || data.operatorName || '',
  };
}

/**
 * Format call report - summary statistics
 */
export function formatReport(data: any): FormattedReport {
  // Extract statistics from different possible response formats
  const stats = data.statistic || data.stats || {};
  const callsList = data.calls || data.data?.calls || [];

  const total = stats.all || data.total || data.numbersTotal || callsList.length || 0;
  const answered = stats.answered || data.answered || data.numbersSuccess || 0;
  const missed = stats.notAnswered || data.missed || data.numbersFailed || 0;
  const active = stats.activeCall || 0;

  // Format the call list
  const formattedCalls = callsList.map((call: any) => {
    // Determine if call was answered by checking if client answered (clientAnswerTime > 0)
    const clientAnswered = parseInt(call.clientAnswerTime || 0) > 0;
    const callStatus = clientAnswered ? 'answered' : 'missed';

    return {
      phoneNumber: call.number || call.phone || call.phoneNumber || 'Unknown',
      status: callStatus,
      duration: call.duration ? parseInt(call.duration) : 0,
      timestamp: call.time || '',
      operator: call.operator || call.operatorName || call.sipClientOperator || 'Auto',
    };
  });

  return {
    totalCalls: total,
    answeredCalls: answered,
    missedCalls: missed,
    activeCalls: active,
    successRate: total > 0 ? `${Math.round((answered / total) * 100)}%` : '0%',
    missedRate: total > 0 ? `${Math.round((missed / total) * 100)}%` : '0%',
    activeRate: total > 0 ? `${Math.round((active / total) * 100)}%` : '0%',
    averageDuration: data.avgDuration || data.averageDuration || '0s',
    averageAnswerTime: data.avgAnswerTime || data.averageAnswerTime || '0s',
    calls: formattedCalls,
  };
}

/**
 * Format campaign list response
 */
export function formatCampaignList(data: any[]): FormattedCampaign[] {
  return data.map(campaign => formatCampaign(campaign));
}

/**
 * Format call results list
 */
export function formatCallResultsList(data: any[]): FormattedCallResult[] {
  return data.map(result => formatCallResult(result));
}
