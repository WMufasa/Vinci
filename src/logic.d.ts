declare module '*/public/logic.js' {
  const logic: {
    multiple(guess: number, answer: number): number;
    geoMean(values: number[]): number;
  };
  export default logic;
}
