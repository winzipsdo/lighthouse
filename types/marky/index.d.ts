declare module 'marky' {
    class Marky {
        static mark(name: string): void;
        static stop(name: string): void;
        static getEntries(): PerformanceEntry[];
        static clear(): void;
    }
    export = Marky;
}
