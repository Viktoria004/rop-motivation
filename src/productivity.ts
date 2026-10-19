export const productivityBands = [
  { minimum: 21, bonus: 25000 },
  { minimum: 20, bonus: 20000 },
  { minimum: 19, bonus: 15000 },
  { minimum: 18, bonus: 10000 },
  { minimum: 17, bonus: 5000 },
] as const;

// Both sales and working days cover only the period after entry into the active team.
export function calculateProductivity(sales: number, activeDays: number, monthDays: number) {
  if (![sales, activeDays, monthDays].every(Number.isSafeInteger) || sales < 0 || activeDays <= 0 || monthDays <= 0) {
    return { error: "Укажите целые значения: продажи — от нуля, рабочие дни — больше нуля." } as const;
  }
  const effectiveManagers = activeDays / monthDays;
  const average = sales / effectiveManagers;
  // Compare cross-products so a displayed rounded average cannot award the next band.
  const bonus = productivityBands.find(band => sales * monthDays >= band.minimum * activeDays)?.bonus ?? 0;
  if (!Number.isSafeInteger(sales * monthDays)) return { error: "Слишком большие значения для расчёта." } as const;
  return { error: null, effectiveManagers, average, bonus } as const;
}
