import { PipelineStage, Lead, Task, LeadTemperature } from '@/types/crm';

export interface SLARule {
  stage: PipelineStage;
  temperature?: LeadTemperature;
  maxMinutes: number;
  description: string;
}

export const SLA_RULES: SLARule[] = [
  { stage: '01_NEW_LEAD', temperature: 'HOT', maxMinutes: 5, description: 'Hot Lead Instant Outreach SLA (5 mins)' },
  { stage: '01_NEW_LEAD', temperature: 'WARM', maxMinutes: 15, description: 'Warm Lead Initial Response SLA (15 mins)' },
  { stage: '07_QUOTE_PENDING', maxMinutes: 20, description: 'Quote Generation & Approval SLA (20 mins)' },
  { stage: '08_QUOTE_SENT', maxMinutes: 360, description: 'Quote Follow-up Reminder SLA (6 hours)' },
  { stage: '09_NEGOTIATION', maxMinutes: 15, description: 'Negotiation Counter-Offer Response SLA (15 mins)' },
  { stage: '10_INSPECTION_PENDING', maxMinutes: 30, description: 'Inspector Assignment SLA (30 mins)' },
  { stage: '13_PURCHASE_APPROVAL', maxMinutes: 60, description: 'Final Purchase Decision Sign-off SLA (1 hour)' },
];

export class SLATaskEngine {
  /**
   * Calculate the SLA due date for a lead entering a stage
   */
  public static calculateSLADueDate(stage: PipelineStage, temperature: LeadTemperature = 'WARM'): string {
    const matchingRule =
      SLA_RULES.find((r) => r.stage === stage && (!r.temperature || r.temperature === temperature)) ||
      SLA_RULES.find((r) => r.stage === stage);

    const minutes = matchingRule ? matchingRule.maxMinutes : 60;
    const dueDate = new Date(Date.now() + minutes * 60 * 1000);
    return dueDate.toISOString();
  }

  /**
   * Automatically generate actionable tasks when a lead transitions to a new stage
   */
  public static generateStageTasks(lead: Lead, stage: PipelineStage, assignedEmployeeId?: string): Task[] {
    const targetEmployeeId = assignedEmployeeId || lead.assignedEmployeeId || 'emp_01';
    const now = new Date();
    const tasks: Task[] = [];

    switch (stage) {
      case '01_NEW_LEAD':
        tasks.push({
          id: `task_${Date.now()}_1`,
          leadId: lead.id,
          assignedToEmployeeId: targetEmployeeId,
          title: `Qualify Inbound Lead - ${lead.customer.name}`,
          description: `Confirm vehicle year, odometer KM, ownership count, and seller location for ${lead.vehicle.brand} ${lead.vehicle.model}.`,
          priority: lead.leadTemperature === 'HOT' ? 'URGENT' : 'HIGH',
          dueDate: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
          status: 'PENDING',
          createdAt: now.toISOString(),
          type: 'FOLLOW_UP',
        });
        break;

      case '04_DOCUMENT_COLLECTION':
        tasks.push({
          id: `task_${Date.now()}_2`,
          leadId: lead.id,
          assignedToEmployeeId: targetEmployeeId,
          title: `Verify RC & Insurance Docs`,
          description: `Validate registration certificate and active insurance validity before initiating valuation.`,
          priority: 'MEDIUM',
          dueDate: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING',
          createdAt: now.toISOString(),
          type: 'DOC_COLLECTION',
        });
        break;

      case '08_QUOTE_SENT':
        tasks.push({
          id: `task_${Date.now()}_3`,
          leadId: lead.id,
          assignedToEmployeeId: targetEmployeeId,
          title: `Follow up on Sent Quote (₹${lead.quote?.currentOfferedPrice.toLocaleString('en-IN')})`,
          description: `Check if customer has questions regarding the instant valuation offer or wishes to schedule an inspection.`,
          priority: 'HIGH',
          dueDate: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING',
          createdAt: now.toISOString(),
          type: 'FOLLOW_UP',
        });
        break;

      case '09_NEGOTIATION':
        tasks.push({
          id: `task_${Date.now()}_4`,
          leadId: lead.id,
          assignedToEmployeeId: targetEmployeeId,
          title: `Customer Price Counter-Offer Review`,
          description: `Customer countered at ₹${lead.quote?.customerCounterPrice?.toLocaleString('en-IN') || 'higher price'}. Review guardrails and execute authorized response.`,
          priority: 'URGENT',
          dueDate: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
          status: 'PENDING',
          createdAt: now.toISOString(),
          type: 'CALL',
        });
        break;

      case '10_INSPECTION_PENDING':
        tasks.push({
          id: `task_${Date.now()}_5`,
          leadId: lead.id,
          assignedToEmployeeId: targetEmployeeId,
          title: `Assign Inspector & Confirm Slot`,
          description: `Customer agreed to inspection at ${lead.customer.city}. Match available field inspector for physical 13-point checklist.`,
          priority: 'HIGH',
          dueDate: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
          status: 'PENDING',
          createdAt: now.toISOString(),
          type: 'INSPECTION',
        });
        break;

      case '13_PURCHASE_APPROVAL':
        tasks.push({
          id: `task_${Date.now()}_6`,
          leadId: lead.id,
          assignedToEmployeeId: targetEmployeeId,
          title: `Final Purchase Decision Authorization`,
          description: `Inspection completed with score. Authorize final purchase order of ₹${lead.inspection?.finalRecommendedBuyPrice?.toLocaleString('en-IN') || '71,000'}.`,
          priority: 'URGENT',
          dueDate: new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
          status: 'PENDING',
          createdAt: now.toISOString(),
          type: 'APPROVAL',
        });
        break;
    }

    return tasks;
  }
}
