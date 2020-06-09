class NormalDistribution {
    mu = 0;
    sigma = 0
    val2 = 0
    used = false;

    constructor(mu, sigma) {
        this.Mu = mu;
        this.Sigma = sigma;
    }

    get Mu() {
        return this.mu;
    }

    set Mu(value) {
        this.mu = value;
        this.Reset();
    }

    get Sigma() {
        return this.sigma;
    }

    set Sigma(value) {
        this.sigma = value;
        this.Reset();
    }

    Reset() {
        this.val2 = 0.0;
        this.used = false;
    }

    NextDouble() {
        let x = 0 ;
        while(x === 0) x = Math.random(); //Converting [0,1) to (0,1)
        const power = - 0.5 * Math.pow((x - this.mu) / this.sigma, 2);
        const k = 1 / (this.sigma * Math.sqrt(2 * Math.PI));
        return k * Math.pow(Math.E, power);
    }
}

window.NormalDistribution = NormalDistribution;