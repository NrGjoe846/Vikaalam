import { Vehicle, Valuation, EmployeeRole } from '@/types/crm';

// Benchmark base market values for current-year models (in INR)
const MODEL_BASELINES: Record<string, number> = {
  'Honda Activa 6G': 85000,
  'Honda Activa 125': 92000,
  'Royal Enfield Classic 350': 225000,
  'Royal Enfield Hunter 350': 185000,
  'Yamaha MT-15': 175000,
  'Yamaha R15 V4': 195000,
  'TVS Jupiter': 82000,
  'TVS Apache RTR 160': 130000,
  'TVS Ntorq 125': 95000,
  'Bajaj Pulsar NS200': 150000,
  'Bajaj Pulsar 150': 115000,
  'KTM Duke 200': 210000,
  'Suzuki Access 125': 88000,
  'Hero Splendor Plus': 76000,
};

export interface AuthorityCheckResult {
  allowed: boolean;
  requiredRole: EmployeeRole;
  requiresDirectorApproval: boolean;
  gapAmount: number;
  message: string;
}

export class ValuationEngine {
  /**
   * Calculate algorithmic deterministic valuation with strict guardrail constraints
   */
  public static calculateValuation(vehicle: Vehicle): Valuation {
    const currentYear = 2026;
    const modelKey = `${vehicle.brand} ${vehicle.model}`.trim();
    const baseNewPrice = MODEL_BASELINES[modelKey] || 100000;

    const reasons: string[] = [];

    // 1. Age Depreciation (Approx 9-12% per year)
    const age = Math.max(0, currentYear - vehicle.year);
    const ageDepreciationRate = Math.min(0.65, age * 0.10);
    const ageValue = baseNewPrice * (1 - ageDepreciationRate);
    reasons.push(`Base market price indexed at ₹${baseNewPrice.toLocaleString('en-IN')}; ${age}-year age depreciation: -${(ageDepreciationRate * 100).toFixed(0)}%`);

    // 2. Mileage Depreciation (₹1.2 per km over standard 6,000 km/year)
    const expectedKm = age * 6000;
    const excessKm = Math.max(0, vehicle.kmRidden - expectedKm);
    const mileageDeduction = Math.min(25000, excessKm * 0.85);
    if (mileageDeduction > 0) {
      reasons.push(`Excess odometer mileage (${vehicle.kmRidden.toLocaleString()} km): -₹${mileageDeduction.toFixed(0)}`);
    }

    // 3. Ownership History Deduction
    let ownerDeduction = 0;
    if (vehicle.ownerCount === 2) {
      ownerDeduction = ageValue * 0.06;
      reasons.push(`Second owner status deduction: -6%`);
    } else if (vehicle.ownerCount >= 3) {
      ownerDeduction = ageValue * 0.14;
      reasons.push(`3+ owners history deduction: -14%`);
    }

    // 4. Document Penalties
    let documentDeductions = 0;
    const missingDocs = vehicle.documents.filter((d) => d.status === 'MISSING' || d.status === 'REJECTED');
    missingDocs.forEach((doc) => {
      if (doc.name === 'INSURANCE') {
        documentDeductions += 2500;
        reasons.push(`Lapsed Insurance renewal penalty: -₹2,500`);
      } else if (doc.name === 'LOAN_NOC' && vehicle.loanStatus === 'ACTIVE_LOAN') {
        documentDeductions += 4000;
        reasons.push(`Active Hypothecation NOC clearance fee: -₹4,000`);
      } else if (doc.name === 'PUC') {
        documentDeductions += 500;
        reasons.push(`Expired PUC penalty: -₹500`);
      }
    });

    // 5. Photo Defect Penalties
    let photoDefectDeductions = 0;
    const defectPhotos = vehicle.photos.filter((p) => p.status === 'DEFECT_DETECTED');
    if (defectPhotos.length > 0) {
      photoDefectDeductions = defectPhotos.length * 1500;
      reasons.push(`${defectPhotos.length} detected physical cosmetic defect(s): -₹${photoDefectDeductions.toLocaleString('en-IN')}`);
    }

    // Baseline Fair Market Value (Retail Resale Benchmark)
    const baselineMarketValue = Math.max(
      20000,
      Math.round((ageValue - mileageDeduction - ownerDeduction - documentDeductions - photoDefectDeductions) / 500) * 500
    );

    // Target Gross Resale Margin (₹8,000 to ₹14,000 based on bike class)
    const targetGrossMargin = baseNewPrice > 160000 ? 14000 : 9500;

    const expectedResalePrice = Math.round((baselineMarketValue * 1.05) / 500) * 500;
    const recommendedBuyMax = Math.round((expectedResalePrice - targetGrossMargin) / 500) * 500;
    const recommendedBuyMin = Math.round((recommendedBuyMax * 0.94) / 500) * 500;
    const maxApprovedPrice = Math.round((recommendedBuyMax * 1.04) / 500) * 500;

    // Confidence score based on document/photo completeness
    const verifiedDocs = vehicle.documents.filter((d) => d.status === 'VERIFIED').length;
    const verifiedPhotos = vehicle.photos.filter((p) => p.status === 'UPLOADED' || p.status === 'VERIFIED').length;
    const totalChecklist = vehicle.documents.length + vehicle.photos.length;
    const confidenceScore = Math.min(95, Math.round(((verifiedDocs + verifiedPhotos) / Math.max(1, totalChecklist)) * 80 + 15));

    return {
      id: `val_${Date.now()}`,
      vehicleId: vehicle.id,
      baselineMarketValue,
      recommendedBuyMin,
      recommendedBuyMax,
      maxApprovedPrice,
      expectedResalePrice,
      expectedGrossMargin: expectedResalePrice - recommendedBuyMax,
      confidenceScore,
      reasoning: reasons,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Authority Matrix Guardrail:
   * Level 1: AI Agent (Autonomous up to recommendedBuyMax)
   * Level 2: Sales Executive (Can authorize up to recommendedBuyMax + ₹2,000)
   * Level 3: Sales Manager (Can authorize up to recommendedBuyMax + ₹5,000)
   * Level 4: Finance / Director (Required for anything higher)
   */
  public static checkPricingAuthority(
    proposedOfferPrice: number,
    valuation: Valuation,
    userRole: EmployeeRole
  ): AuthorityCheckResult {
    const { recommendedBuyMax, maxApprovedPrice } = valuation;

    if (proposedOfferPrice <= recommendedBuyMax) {
      return {
        allowed: true,
        requiredRole: 'SALES_EXECUTIVE',
        requiresDirectorApproval: false,
        gapAmount: 0,
        message: `Proposed price ₹${proposedOfferPrice.toLocaleString('en-IN')} is within autonomous AI and executive buying range.`,
      };
    }

    const execLimit = recommendedBuyMax + 2000;
    const managerLimit = maxApprovedPrice + 2000;

    if (proposedOfferPrice <= execLimit) {
      if (userRole === 'SALES_EXECUTIVE' || userRole === 'SALES_MANAGER' || userRole === 'ADMIN' || userRole === 'FINANCE_DIRECTOR') {
        return {
          allowed: true,
          requiredRole: 'SALES_EXECUTIVE',
          requiresDirectorApproval: false,
          gapAmount: proposedOfferPrice - recommendedBuyMax,
          message: `Approved under Sales Executive discretionary buffer (+₹${(proposedOfferPrice - recommendedBuyMax).toLocaleString('en-IN')}).`,
        };
      }
    }

    if (proposedOfferPrice <= managerLimit) {
      if (userRole === 'SALES_MANAGER' || userRole === 'ADMIN' || userRole === 'FINANCE_DIRECTOR') {
        return {
          allowed: true,
          requiredRole: 'SALES_MANAGER',
          requiresDirectorApproval: false,
          gapAmount: proposedOfferPrice - recommendedBuyMax,
          message: `Approved under Sales Manager pricing authority (+₹${(proposedOfferPrice - recommendedBuyMax).toLocaleString('en-IN')}).`,
        };
      }
      return {
        allowed: false,
        requiredRole: 'SALES_MANAGER',
        requiresDirectorApproval: false,
        gapAmount: proposedOfferPrice - recommendedBuyMax,
        message: `Price exceeds executive threshold. Requires Sales Manager sign-off.`,
      };
    }

    // Above Manager Limit: Requires Director Approval
    return {
      allowed: userRole === 'FINANCE_DIRECTOR' || userRole === 'ADMIN',
      requiredRole: 'FINANCE_DIRECTOR',
      requiresDirectorApproval: true,
      gapAmount: proposedOfferPrice - recommendedBuyMax,
      message: `High pricing deviation (+₹${(proposedOfferPrice - recommendedBuyMax).toLocaleString('en-IN')}). Mandatory Finance Director review required.`,
    };
  }
}
