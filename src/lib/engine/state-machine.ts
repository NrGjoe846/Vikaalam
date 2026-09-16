import { PipelineStage, ParkQueue, ParkReason, LostReason, Lead } from '@/types/crm';

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
  targetStage: PipelineStage;
  parkQueue?: ParkQueue;
}

// Stage transition map enforcing strict business domain rules
const VALID_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  '01_NEW_LEAD': ['02_QUALIFICATION', 'PARKED', 'LOST'],
  '02_QUALIFICATION': ['03_DETAILS_COLLECTION', 'PARKED', 'LOST'],
  '03_DETAILS_COLLECTION': ['04_DOCUMENT_COLLECTION', 'PARKED', 'LOST'],
  '04_DOCUMENT_COLLECTION': ['05_PHOTO_COLLECTION', 'PARKED', 'LOST'],
  '05_PHOTO_COLLECTION': ['06_AI_VALUATION', 'PARKED', 'LOST'],
  '06_AI_VALUATION': ['07_QUOTE_PENDING', 'PARKED', 'LOST'],
  '07_QUOTE_PENDING': ['08_QUOTE_SENT', 'PARKED', 'LOST'],
  '08_QUOTE_SENT': ['09_NEGOTIATION', '10_INSPECTION_PENDING', 'PARKED', 'LOST'],
  '09_NEGOTIATION': ['10_INSPECTION_PENDING', '08_QUOTE_SENT', 'PARKED', 'LOST'],
  '10_INSPECTION_PENDING': ['11_INSPECTION_SCHEDULED', 'PARKED', 'LOST'],
  '11_INSPECTION_SCHEDULED': ['12_INSPECTION_COMPLETED', '10_INSPECTION_PENDING', 'PARKED', 'LOST'],
  '12_INSPECTION_COMPLETED': ['13_PURCHASE_APPROVAL', 'PARKED', 'LOST'],
  '13_PURCHASE_APPROVAL': ['14_PURCHASED', 'PARKED', 'LOST'],
  '14_PURCHASED': ['15_INVENTORY', 'LOST'],
  '15_INVENTORY': [],
  'PARKED': [
    '01_NEW_LEAD',
    '02_QUALIFICATION',
    '03_DETAILS_COLLECTION',
    '04_DOCUMENT_COLLECTION',
    '05_PHOTO_COLLECTION',
    '06_AI_VALUATION',
    '07_QUOTE_PENDING',
    '08_QUOTE_SENT',
    '09_NEGOTIATION',
    '10_INSPECTION_PENDING',
    '11_INSPECTION_SCHEDULED',
    'LOST',
  ],
  'LOST': ['PARKED', '01_NEW_LEAD'], // Allow manual reactivation
};

export class AcquisitionStateMachine {
  /**
   * Determine the appropriate Park Queue based on the originating active stage
   */
  public static mapStageToParkQueue(stage: PipelineStage): ParkQueue {
    switch (stage) {
      case '01_NEW_LEAD':
      case '02_QUALIFICATION':
        return 'NEW_LEAD_PARK';
      case '03_DETAILS_COLLECTION':
      case '04_DOCUMENT_COLLECTION':
      case '05_PHOTO_COLLECTION':
      case '06_AI_VALUATION':
        return 'DETAILS_PARK';
      case '07_QUOTE_PENDING':
      case '08_QUOTE_SENT':
        return 'QUOTE_PARK';
      case '09_NEGOTIATION':
        return 'NEGOTIATION_PARK';
      case '10_INSPECTION_PENDING':
      case '11_INSPECTION_SCHEDULED':
      case '12_INSPECTION_COMPLETED':
        return 'INSPECTION_PARK';
      default:
        return 'QUOTE_PARK';
    }
  }

  /**
   * Validate if a direct stage transition is legally allowed by business rules
   */
  public static validateTransition(
    currentStage: PipelineStage,
    targetStage: PipelineStage
  ): TransitionResult {
    const allowedTargets = VALID_TRANSITIONS[currentStage] || [];
    if (!allowedTargets.includes(targetStage)) {
      return {
        allowed: false,
        reason: `Illegal state transition from ${currentStage} to ${targetStage}. Required pipeline order must be followed.`,
        targetStage,
      };
    }
    return {
      allowed: true,
      targetStage,
    };
  }

  /**
   * Park an active lead with structured reason and reactivation timeline
   */
  public static parkLead(
    lead: Lead,
    reason: ParkReason,
    customReactivationDays: number = 7
  ): Partial<Lead> {
    const parkQueue = this.mapStageToParkQueue(lead.currentStage);
    const now = new Date();
    const reactivateAt = new Date(now.getTime() + customReactivationDays * 24 * 60 * 60 * 1000);

    return {
      previousStage: lead.currentStage,
      currentStage: 'PARKED',
      parkQueue,
      parkReason: reason,
      parkedAt: now.toISOString(),
      reactivationDate: reactivateAt.toISOString(),
      reactivationCount: (lead.reactivationCount || 0) + 1,
    };
  }

  /**
   * Unpark a lead and restore it to its previous active queue or a designated resume stage
   */
  public static unparkLead(lead: Lead, designatedStage?: PipelineStage): Partial<Lead> {
    const resumeStage = designatedStage || lead.previousStage || '01_NEW_LEAD';

    return {
      currentStage: resumeStage,
      parkQueue: undefined,
      parkReason: undefined,
      parkedAt: undefined,
      reactivationDate: undefined,
      lastCustomerMessageAt: new Date().toISOString(),
    };
  }
}
