class PoissonDistribution {
    lambda = 0
    k = 0;

    constructor(lambda) {
        this.Lambda = lambda;
    }

    get Lambda() {
        return this.lambda;
    }

    set Lambda(value) {
        this.lambda = value;
        this.k = Math.exp(-1.0 * this.lambda);
    }

    rFact(num) {
        if (num === 0) {
            return 1;
        } else {
            return num * this.rFact(num - 1);
        }
    }

    NextDouble() {
        let count = 0.0;
        for (let product = Math.random(); product >= this.k; product *= Math.random()) {
            count++;
        }

        const one = Math.pow(this.lambda, count);
        const two = Math.exp(-1.0 * this.lambda);
        const fact = this.rFact(count);

        return one * two / fact;
    }
}

window.PoissonDistribution = PoissonDistribution;