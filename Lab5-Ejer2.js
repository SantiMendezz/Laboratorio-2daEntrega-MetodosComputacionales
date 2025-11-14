// Interpolación de Lagrange

// Datos del problema (en miles de habitantes)
const x = [1940, 1950, 1960, 1970, 1980, 1990];
const y = [132165, 151326, 179323, 203302, 226542, 249633];

const xEval = 1965;   // Año a interpolar
const yReal = 189703; // Valor real en miles para comparar

// Cálculo explícito de Lagrange según fórmula de la imagen
function lagrangeExplicit(x, y, xEval) {
    const n = x.length;
    let sum = 0;

    console.log("\n INTERPOLACIÓN DE LAGRANGE — FÓRMULA EXPLÍCITA ");
    console.log("x =", xEval, "\n");

    for (let i = 0; i < n; i++) {
        console.log(`TÉRMINO i = ${i}`);
        console.log(`y_${i} = ${y[i]}`);

        // Numerador: y_i
        const numerador = y[i];

        // Denominador: productoria (xEval - x_j)(x_i - x_j)
        let denomEval = 1;
        let denomXi  = 1;

        for (let j = 0; j < n; j++) {
            if (j !== i) {
                const factorEval = (xEval - x[j]);   // (x - xj)
                const factorXi   = (x[i] - x[j]);    // (xi - xj)

                console.log(
                    `• (x - x_${j}) = (${xEval} - ${x[j]}) = ${factorEval}`
                );
                console.log(
                    `• (x_${i} - x_${j}) = (${x[i]} - ${x[j]}) = ${factorXi}`
                );

                denomEval *= factorEval;
                denomXi  *= factorXi;
            }
        }

        console.log(`Producto (x - xj) = ${denomEval}`);
        console.log(`Producto (xi - xj) = ${denomXi}`);

        const denomTotal = denomEval * denomXi;
        console.log(`Denominador total = (x - xj)*(xi - xj) = ${denomTotal}`);

        // Término completo y_i / [producto]
        const termino = numerador * (denomEval / denomXi);
        console.log(`Término i = y_${i} * [ (x - xj) / (xi - xj) ] = ${termino}`);

        sum += termino;
    }

    console.log(`P(${xEval}) = ${sum}  (miles de habitantes)`);

    return sum;
}

// Ejecutar interpolación

const estimate = lagrangeExplicit(x, y, xEval);

// Errores
const errorAbs = estimate - yReal;
const errorRel = Math.abs(errorAbs / yReal);

console.log("=== COMPARACIÓN FINAL ===");
console.log(`Estimado: ${estimate.toFixed(6)} miles`);
console.log(`Real:     ${yReal} miles`);
console.log(`Error absoluto: ${errorAbs.toFixed(6)} miles`);
console.log(`Error relativo: ${(errorRel * 100).toFixed(4)}%`);

console.log("\nEn habitantes reales:");
console.log("Estimación:", (estimate * 1000).toLocaleString());
console.log("Real:", (yReal * 1000).toLocaleString());
console.log("Error:", (errorAbs * 1000).toLocaleString());