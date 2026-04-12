// Continued fraction utilities

export function positiveContinuedFraction(num: number, den: number): number[] {
  const cf: number[] = [];
  while (den !== 0) {
    cf.push(Math.floor(num / den));
    [num, den] = [den, num % den];
  }
  return cf;
}

export function negativeContinuedFraction(num: number, den: number): number[] {
  // Placeholder: implement negative CF
  return positiveContinuedFraction(num, den); // Simplified
}

export function formatPositiveCF(cf: number[]): string {
  return `[${cf.join('; ')}]`;
}

export function formatNegativeCF(cf: number[]): string {
  return `[[${cf.join('; ')}]]`;
}