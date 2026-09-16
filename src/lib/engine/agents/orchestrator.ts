import {
  Lead,
  Message,
  AIAuditLog,
  PipelineStage,
  QualificationStatus,
  LeadTemperature,
} from '@/types/crm';
import { AcquisitionStateMachine } from '../state-machine';
import { ValuationEngine } from '../valuation';
import { SLATaskEngine } from '../sla-tasks';

export interface OrchestrationResult {
  responseMessage: string;
  quickReplies?: string[];
  suggestedActions?: { label: string; action: string; payload?: any }[];
  updatedLead: Lead;
  auditLog: AIAuditLog;
  requiresHumanHandoff: boolean;
  handoffReason?: string;
}

export class AgentOrchestrator {
  /**
   * Main conversational pipeline:
   * Inbound Message -> Context Resolution -> Intent Classification -> Agent Routing -> State Update -> Audit Log -> Outbound Reply
   */
  public static async processMessage(
    lead: Lead,
    customerMessage: string,
    channel: string = 'WHATSAPP'
  ): Promise<OrchestrationResult> {
    const rawText = customerMessage.trim();
    const lowerText = rawText.toLowerCase();

    // 1. Detect Human Handoff Triggers
    if (
      lowerText.includes('talk to human') ||
      lowerText.includes('speak with agent') ||
      lowerText.includes('manager call') ||
      lowerText.includes('fraud') ||
      lowerText.includes('legal') ||
      lowerText.includes('cheating')
    ) {
      const auditLog: AIAuditLog = {
        id: `audit_${Date.now()}`,
        leadId: lead.id,
        agentName: 'Human Handoff Agent',
        action: 'HUMAN_ESCALATION_TRIGGERED',
        inputContext: rawText,
        decision: 'Escalate to Sales Manager due to explicit user request or risk keyword.',
        result: 'HUMAN_HANDOFF_ACTIVATED',
        confidenceScore: 98,
        approvalRequired: true,
        approvedBy: lead.assignedEmployee?.name,
        timestamp: new Date().toISOString(),
      };

      return {
        responseMessage:
          "I've alerted our senior customer manager, who is reviewing your case and will call you directly within the next 10 minutes. Thank you for your patience!",
        quickReplies: ['Call Me Now', 'Leave a Note'],
        suggestedActions: [
          { label: 'Take Over Conversation', action: 'TAKE_OVER' },
          { label: 'Trigger Phone Call', action: 'INITIATE_CALL' },
        ],
        updatedLead: {
          ...lead,
          lastCustomerMessageAt: new Date().toISOString(),
        },
        auditLog,
        requiresHumanHandoff: true,
        handoffReason: 'Explicit user handoff request or sensitive keyword detected.',
      };
    }

    // 2. Handle Reactivation if Lead is Parked
    if (lead.currentStage === 'PARKED') {
      const unparkData = AcquisitionStateMachine.unparkLead(lead, '09_NEGOTIATION');
      const updatedLead: Lead = {
        ...lead,
        ...unparkData,
        lastCustomerMessageAt: new Date().toISOString(),
      };

      const auditLog: AIAuditLog = {
        id: `audit_${Date.now()}`,
        leadId: lead.id,
        agentName: 'Reactivation Agent',
        action: 'LEAD_UNPARKED_ON_INBOUND',
        inputContext: rawText,
        decision: `Customer responded to parked campaign. Restored from ${lead.parkQueue || 'PARK'} to ${updatedLead.currentStage}.`,
        toolUsed: 'unpark_lead()',
        result: 'SUCCESS',
        confidenceScore: 94,
        approvalRequired: false,
        timestamp: new Date().toISOString(),
      };

      return {
        responseMessage: `Welcome back, ${lead.customer.name}! Great to hear from you again regarding your ${lead.vehicle.brand} ${lead.vehicle.model}. We have updated our valuation baseline for you. Are you ready to explore our revised offer or schedule a doorstep inspection?`,
        quickReplies: ['[ INTERESTED ]', '[ WANT TO DISCUSS ]', '[ NOT INTERESTED ]'],
        suggestedActions: [
          { label: 'Send Revised Quote', action: 'SEND_QUOTE' },
          { label: 'Schedule Doorstep Inspection', action: 'SCHEDULE_INSPECTION' },
        ],
        updatedLead,
        auditLog,
        requiresHumanHandoff: false,
      };
    }

    // 3. Stage-Specific Autonomous Agent Routing

    // --- STAGE 01 & 02: INTAKE & QUALIFICATION AGENT ---
    if (lead.currentStage === '01_NEW_LEAD' || lead.currentStage === '02_QUALIFICATION') {
      const vehicle = { ...lead.vehicle };
      let extractedDetails = false;

      // Extract Year
      const yearMatch = rawText.match(/\b(201[5-9]|202[0-6])\b/);
      if (yearMatch) {
        vehicle.year = parseInt(yearMatch[0], 10);
        extractedDetails = true;
      }

      // Extract KM
      const kmMatch = rawText.match(/(\d{1,3}(?:,\d{3})*|\d+)\s*(?:km|kms|kilo)/i);
      if (kmMatch) {
        vehicle.kmRidden = parseInt(kmMatch[1].replace(/,/g, ''), 10);
        extractedDetails = true;
      }

      // Extract Owner Count
      if (lowerText.includes('1st owner') || lowerText.includes('first owner') || lowerText.includes('single hand')) {
        vehicle.ownerCount = 1;
        extractedDetails = true;
      } else if (lowerText.includes('2nd owner') || lowerText.includes('second owner')) {
        vehicle.ownerCount = 2;
        extractedDetails = true;
      }

      // Calculate 100-point Qualification Score
      let score = 20; // base intake score
      if (vehicle.year >= 2022) score += 20;
      else if (vehicle.year >= 2019) score += 12;

      if (vehicle.kmRidden <= 25000) score += 20;
      else if (vehicle.kmRidden <= 45000) score += 12;

      if (vehicle.ownerCount === 1) score += 20;
      else if (vehicle.ownerCount === 2) score += 10;

      if (vehicle.customerExpectedPrice > 0) score += 20;

      const qualificationStatus: QualificationStatus =
        score >= 70 ? 'QUALIFIED' : score >= 45 ? 'PARTIALLY_QUALIFIED' : 'NEEDS_HUMAN_REVIEW';

      const leadTemperature: LeadTemperature =
        score >= 80 ? 'HOT' : score >= 60 ? 'WARM' : score >= 40 ? 'COOL' : 'LOW';

      const nextStage: PipelineStage =
        vehicle.year && vehicle.kmRidden ? '04_DOCUMENT_COLLECTION' : '02_QUALIFICATION';

      const updatedLead: Lead = {
        ...lead,
        vehicle,
        qualificationStatus,
        leadScore: score,
        leadTemperature,
        currentStage: nextStage,
        conversionProbability: Math.min(92, Math.round(score * 0.95)),
        lastCustomerMessageAt: new Date().toISOString(),
      };

      const auditLog: AIAuditLog = {
        id: `audit_${Date.now()}`,
        leadId: lead.id,
        agentName: 'Intake & Qualification Agent',
        action: 'EXTRACT_VEHICLE_SPECS_AND_QUALIFY',
        inputContext: rawText,
        decision: `Updated specs: Year ${vehicle.year}, KM ${vehicle.kmRidden}, Owners ${vehicle.ownerCount}. Score: ${score}/100 (${leadTemperature}). Transitioned to ${nextStage}.`,
        toolUsed: 'update_vehicle()',
        result: 'QUALIFIED_SUCCESS',
        confidenceScore: 92,
        approvalRequired: false,
        timestamp: new Date().toISOString(),
      };

      const responseMessage =
        nextStage === '04_DOCUMENT_COLLECTION'
          ? `Thank you for sharing those details! We've recorded your ${vehicle.year} ${vehicle.brand} ${vehicle.model} (${vehicle.kmRidden.toLocaleString()} km, ${vehicle.ownerCount === 1 ? '1st Owner' : `${vehicle.ownerCount} Owners`}).\n\nTo give you our guaranteed highest instant cash offer, could you please send a quick photo of your RC (Registration Certificate) and active Insurance?`
          : `Thanks for reaching out! To give you the exact best market valuation for your ${vehicle.brand} ${vehicle.model}, could you tell us:\n1. Which year was it registered?\n2. Approximately how many kilometres has it run?\n3. Are you the 1st or 2nd owner?`;

      return {
        responseMessage,
        quickReplies: ['RC Available', '1st Owner', 'Single Owner', 'Need Inspection'],
        suggestedActions: [
          { label: 'Generate AI Valuation', action: 'GENERATE_VALUATION' },
          { label: 'Request Documents', action: 'REQUEST_DOCS' },
        ],
        updatedLead,
        auditLog,
        requiresHumanHandoff: false,
      };
    }

    // --- STAGE 08: QUOTE SENT & CUSTOMER ACTION ---
    if (lead.currentStage === '08_QUOTE_SENT' || lead.currentStage === '07_QUOTE_PENDING') {
      // 1. Customer clicked [ INTERESTED ]
      if (lowerText.includes('interested') || lowerText.includes('yes') || lowerText.includes('deal') || lowerText.includes('book inspection')) {
        const updatedLead: Lead = {
          ...lead,
          currentStage: '10_INSPECTION_PENDING',
          lastCustomerMessageAt: new Date().toISOString(),
        };

        const auditLog: AIAuditLog = {
          id: `audit_${Date.now()}`,
          leadId: lead.id,
          agentName: 'Sales Agent',
          action: 'CUSTOMER_ACCEPTED_QUOTE',
          inputContext: rawText,
          decision: `Customer expressed interest in quote ₹${lead.quote?.currentOfferedPrice.toLocaleString('en-IN')}. Moved to 10_INSPECTION_PENDING.`,
          toolUsed: 'schedule_inspection()',
          result: 'INSPECTION_QUEUED',
          confidenceScore: 95,
          approvalRequired: false,
          timestamp: new Date().toISOString(),
        };

        return {
          responseMessage: `Fantastic! We are thrilled to proceed. Our certified technician can perform a fast 15-minute doorstep inspection at your location in ${lead.customer.city} and transfer instant payment to your bank upon verification.\n\nWhich date and time slot works best for you? (e.g. Today 4 PM or Tomorrow 11 AM)`,
          quickReplies: ['Today 4:00 PM', 'Tomorrow 11:00 AM', 'Tomorrow 3:00 PM', 'At My Office'],
          suggestedActions: [
            { label: 'Assign Field Inspector', action: 'ASSIGN_INSPECTOR' },
            { label: 'Confirm Location', action: 'CONFIRM_LOCATION' },
          ],
          updatedLead,
          auditLog,
          requiresHumanHandoff: false,
        };
      }

      // 2. Customer clicked [ WANT TO DISCUSS ] or Counter-Offered
      if (
        lowerText.includes('want to discuss') ||
        lowerText.includes('price is low') ||
        lowerText.includes('too low') ||
        lowerText.includes('increase') ||
        lowerText.includes('more price') ||
        /\b\d{2,3}k\b|\b\d{5,6}\b/.test(lowerText)
      ) {
        // Extract counter price if any
        let counterPrice = lead.quote?.currentOfferedPrice ? lead.quote.currentOfferedPrice + 3000 : 75000;
        const priceMatch = rawText.match(/(?:rs\.?|inr|₹)?\s*(\d{2,3}(?:,\d{3})*|\d+)(?:k)?/i);
        if (priceMatch) {
          let parsed = parseInt(priceMatch[1].replace(/,/g, ''), 10);
          if (priceMatch[0].toLowerCase().includes('k') && parsed < 1000) parsed *= 1000;
          if (parsed > 10000) counterPrice = parsed;
        }

        const valuation = lead.valuation || ValuationEngine.calculateValuation(lead.vehicle);
        const { recommendedBuyMax, maxApprovedPrice } = valuation;

        // Determine AI negotiation counter-offer without exposing internal ceiling
        let newOffer = lead.quote?.currentOfferedPrice || recommendedBuyMax;
        let requiresApproval = false;
        let negotiationReply = '';

        if (counterPrice <= recommendedBuyMax) {
          newOffer = counterPrice;
          negotiationReply = `I understand you're looking for the best value. Based on your bike's condition and strong current market demand in ${lead.customer.city}, I can revise our direct acquisition offer to ₹${newOffer.toLocaleString('en-IN')}.\n\nShall we confirm this and schedule your doorstep inspection?`;
        } else if (counterPrice <= maxApprovedPrice) {
          newOffer = Math.min(counterPrice, maxApprovedPrice);
          requiresApproval = true;
          negotiationReply = `I appreciate your perspective. While standard market trade-ins are lower, because your bike is well-maintained, I can request a special management price of ₹${newOffer.toLocaleString('en-IN')}.\n\nWould you be happy to finalize at this price subject to quick vehicle physical verification?`;
        } else {
          newOffer = recommendedBuyMax;
          negotiationReply = `We completely understand your expectation of ₹${counterPrice.toLocaleString('en-IN')}. However, considering the model year, reconditioning, and warranty we offer buyers, our best certified purchase offer is ₹${recommendedBuyMax.toLocaleString('en-IN')} with guaranteed instant same-day payment and free RC transfer.\n\nWould you like our technician to inspect it and see if we can stretch it to the top end of the bracket?`;
        }

        const updatedQuote = lead.quote
          ? {
              ...lead.quote,
              currentOfferedPrice: newOffer,
              customerCounterPrice: counterPrice,
              status: 'COUNTERED' as const,
              version: lead.quote.version + 1,
            }
          : undefined;

        const updatedLead: Lead = {
          ...lead,
          quote: updatedQuote,
          currentStage: '09_NEGOTIATION',
          lastCustomerMessageAt: new Date().toISOString(),
        };

        const auditLog: AIAuditLog = {
          id: `audit_${Date.now()}`,
          leadId: lead.id,
          agentName: 'Negotiation Agent',
          action: 'PRICE_COUNTER_OFFER_HANDLED',
          inputContext: rawText,
          decision: `Customer requested ₹${counterPrice.toLocaleString('en-IN')}. AI proposed ₹${newOffer.toLocaleString('en-IN')}. Ceiling guardrail: ₹${maxApprovedPrice.toLocaleString('en-IN')}.`,
          toolUsed: 'calculate_valuation()',
          result: requiresApproval ? 'APPROVAL_REQUEST_SUBMITTED' : 'PRICE_OFFERED',
          confidenceScore: 89,
          approvalRequired: requiresApproval,
          approvedBy: requiresApproval ? undefined : 'AI Autonomous Level 1',
          timestamp: new Date().toISOString(),
        };

        return {
          responseMessage: negotiationReply,
          quickReplies: ['[ INTERESTED ]', 'Can You Do ₹2,000 More?', 'Call Me to Finalize', '[ NOT INTERESTED ]'],
          suggestedActions: [
            { label: 'Approve Counter-Offer (Manager)', action: 'APPROVE_PRICE', payload: { price: newOffer } },
            { label: 'Book Doorstep Inspection', action: 'SCHEDULE_INSPECTION' },
            { label: 'Park Lead (Price Gap)', action: 'PARK_LEAD', payload: { reason: 'PRICE_OBJECTION' } },
          ],
          updatedLead,
          auditLog,
          requiresHumanHandoff: requiresApproval,
          handoffReason: requiresApproval ? 'Price counter-offer requires Manager sign-off.' : undefined,
        };
      }

      // 3. Customer clicked [ NOT INTERESTED ]
      if (lowerText.includes('not interested') || lowerText.includes('no thanks') || lowerText.includes('cancel') || lowerText.includes('sold')) {
        const parkData = AcquisitionStateMachine.parkLead(lead, 'PRICE_OBJECTION', 7);
        const updatedLead: Lead = {
          ...lead,
          ...parkData,
          lastCustomerMessageAt: new Date().toISOString(),
        };

        const auditLog: AIAuditLog = {
          id: `audit_${Date.now()}`,
          leadId: lead.id,
          agentName: 'Sales Agent',
          action: 'LEAD_PARKED_ON_REJECTION',
          inputContext: rawText,
          decision: 'Customer declined quote. Lead parked under QUOTE_PARK for automated 7-day reactivation.',
          toolUsed: 'park_lead()',
          result: 'PARKED_SUCCESS',
          confidenceScore: 96,
          approvalRequired: false,
          timestamp: new Date().toISOString(),
        };

        return {
          responseMessage: `We completely understand, ${lead.customer.name}. Thank you for giving VIKALAAM the opportunity to evaluate your bike. We have saved your valuation profile. Should market prices update or your plans change, feel free to message us anytime!`,
          quickReplies: ['Keep Me Updated', 'Re-evaluate Next Month'],
          suggestedActions: [
            { label: 'View Reactivation Schedule', action: 'VIEW_PARK_SCHEDULE' },
            { label: 'Mark as Lost', action: 'MARK_AS_LOST' },
          ],
          updatedLead,
          auditLog,
          requiresHumanHandoff: false,
        };
      }
    }

    // Default Fallback
    const auditLog: AIAuditLog = {
      id: `audit_${Date.now()}`,
      leadId: lead.id,
      agentName: 'Intake Agent',
      action: 'GENERAL_INQUIRY_ANSWERED',
      inputContext: rawText,
      decision: 'Answered general question regarding VIKALAAM acquisition process.',
      result: 'REPLIED',
      confidenceScore: 88,
      approvalRequired: false,
      timestamp: new Date().toISOString(),
    };

    return {
      responseMessage: `Thank you for reaching out! We are ready to help you sell your ${lead.vehicle.brand} ${lead.vehicle.model}. We offer 100% free doorstep evaluation, spot payment, and guaranteed RC name transfer. Would you like to check your bike's instant valuation?`,
      quickReplies: ['Get Instant Valuation', 'Book Free Inspection', 'Speak to Executive'],
      suggestedActions: [
        { label: 'Trigger Valuation', action: 'TRIGGER_VALUATION' },
        { label: 'Send WhatsApp Template', action: 'SEND_TEMPLATE' },
      ],
      updatedLead: {
        ...lead,
        lastCustomerMessageAt: new Date().toISOString(),
      },
      auditLog,
      requiresHumanHandoff: false,
    };
  }
}
