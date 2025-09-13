// Percentages helper function as specified

export const percentages = (totalImageH: number, values: number[]): number[] => values.map(v => (v / totalImageH) * 100);
