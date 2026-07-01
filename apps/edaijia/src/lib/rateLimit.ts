type Now = () => number;

export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private max: number,
    private windowMs: number,
    private now: Now = () => Date.now(),
  ) {}

  hit(key: string): boolean {
    const t = this.now();
    const arr = (this.hits.get(key) ?? []).filter((ts) => t - ts < this.windowMs);
    if (arr.length >= this.max) {
      this.hits.set(key, arr);
      return false;
    }
    arr.push(t);
    this.hits.set(key, arr);
    return true;
  }
}
