import { Employee, Lead } from '@/types/crm';

export interface AssignmentScoreBreakdown {
  employeeId: string;
  employeeName: string;
  totalScore: number;
  locationMatchScore: number;
  languageMatchScore: number;
  skillMatchScore: number;
  availabilityScore: number;
  performanceScore: number;
  workloadPenalty: number;
}

export class WorkloadAssignmentEngine {
  /**
   * Calculate assignment score for an employee against a specific lead
   * Formula:
   * Score = Location Match (30) + Language Match (25) + Skill Match (20) + Availability (15) + Performance (10) - Workload Penalty
   */
  public static scoreEmployee(employee: Employee, lead: Lead): AssignmentScoreBreakdown {
    // 1. Location Match (30 pts)
    const leadCity = lead.customer.city.toLowerCase();
    const branchLocation = employee.location.toLowerCase();
    let locationMatchScore = 0;
    if (branchLocation.includes(leadCity) || leadCity.includes(branchLocation)) {
      locationMatchScore = 30;
    } else if (employee.branch.toLowerCase().includes(leadCity)) {
      locationMatchScore = 25;
    } else {
      locationMatchScore = 5;
    }

    // 2. Language Match (25 pts)
    const customerLang = lead.customer.preferredLanguage.toLowerCase();
    const hasLanguage = employee.languages.some((lang) =>
      lang.toLowerCase().includes(customerLang)
    );
    const languageMatchScore = hasLanguage ? 25 : 5;

    // 3. Skill & Vehicle Value Match (20 pts)
    let skillMatchScore = 10;
    const isHighValue = (lead.vehicle.customerExpectedPrice || 0) > 150000;
    if (isHighValue && employee.skills.some((s) => s.toLowerCase().includes('high-value') || s.toLowerCase().includes('superbike'))) {
      skillMatchScore = 20;
    } else if (employee.skills.some((s) => s.toLowerCase().includes('fast-closer'))) {
      skillMatchScore = 18;
    }

    // 4. Availability (15 pts)
    let availabilityScore = 0;
    if (employee.status === 'ONLINE') availabilityScore = 15;
    else if (employee.status === 'BUSY') availabilityScore = 5;
    else availabilityScore = 0;

    // 5. Performance Rating (10 pts)
    const performanceScore = Math.round((employee.performanceRating / 5) * 10);

    // 6. Workload Penalty
    // Heavier penalty if nearing or over maximum lead capacity
    const capacityRatio = employee.activeLeadsCount / Math.max(1, employee.maxLeadCapacity);
    const workloadPenalty = Math.round(capacityRatio * 35);

    const totalScore = Math.max(
      0,
      locationMatchScore +
        languageMatchScore +
        skillMatchScore +
        availabilityScore +
        performanceScore -
        workloadPenalty
    );

    return {
      employeeId: employee.id,
      employeeName: employee.name,
      totalScore,
      locationMatchScore,
      languageMatchScore,
      skillMatchScore,
      availabilityScore,
      performanceScore,
      workloadPenalty,
    };
  }

  /**
   * Find the optimal employee for auto-assignment
   */
  public static findBestEmployee(employees: Employee[], lead: Lead): { bestEmployee: Employee; breakdown: AssignmentScoreBreakdown } | null {
    const eligibleEmployees = employees.filter(
      (e) => (e.role === 'SALES_EXECUTIVE' || e.role === 'SALES_MANAGER') && e.status !== 'OFFLINE'
    );

    if (eligibleEmployees.length === 0) return null;

    const scored = eligibleEmployees.map((emp) => ({
      employee: emp,
      breakdown: this.scoreEmployee(emp, lead),
    }));

    scored.sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore);

    return {
      bestEmployee: scored[0].employee,
      breakdown: scored[0].breakdown,
    };
  }
}
