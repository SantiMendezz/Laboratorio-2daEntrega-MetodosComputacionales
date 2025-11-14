// Sistema:
// 0.1 x1 + 7.0 x2 - 0.3 x3 = -19.30
// 3.0 x1 - 0.1 x2 - 0.2 x3 = 7.85
// 0.3 x1 - 0.2 x2 - 10.3 x3 = -19.30

// MATRIZ A
const A = [
  [0.1, 7.0, -0.3],
  [3.0, -0.1, -0.2],
  [0.3, -0.2, -10.3]
];

// VECTOR b
const b = [-19.30, 7.85, -19.30];

// ANALISIS DE CONVERGENCIA (DIAGONAL DOMINANTE)
function checkDiagonalDominance(A) {
  let isStrict = true;
  for (let i = 0; i < A.length; i++) {
    const diag = Math.abs(A[i][i]);
    const sumRow = A[i].reduce((s, val, j) => j !== i ? s + Math.abs(val) : s, 0);
    console.log(`Fila ${i+1}: |a_ii| = ${diag}  vs suma = ${sumRow}`);

    if (diag < sumRow) {
      isStrict = false;
    }
  }
  return isStrict;
}

console.log(" Analizando Convergencia (Diagonal Dominante) ");
const convergente = checkDiagonalDominance(A);
console.log("¿Matriz diagonalmente dominante estricta?:", convergente, "\n");

// MÉTODO DE GAUSS–SEIDEL
function gaussSeidel(A, b, x0, tol = 1e-6, maxIter = 100) {
  const n = A.length;
  let x = [...x0];
  let xPrev = [...x0];

  for (let iter = 1; iter <= maxIter; iter++) {
    xPrev = [...x];

    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (j !== i) {
          sum += A[i][j] * x[j];
        }
      }
      x[i] = (b[i] - sum) / A[i][i];
    }

    // Calcular error
    let error = Math.max(...x.map((xi, i) => Math.abs(xi - xPrev[i])));

    console.log(`Iter ${iter}: [${x.map(v => v.toFixed(6)).join(", ")}], error = ${error}`);

    if (error < tol) {
      return { x, iter };
    }
  }

  return { x, iter: maxIter, warning: "No convergió dentro del máximo de iteraciones" };
}

// Valores iniciales
const x0 = [1, 1, 1];

// Ejecutar Gauss-Seidel
console.log("---- Ejecutando Gauss-Seidel ----");
const resultado = gaussSeidel(A, b, x0);

console.log("\nResultado final:");
console.log("Solución aproximada:", resultado.x);
console.log("Iteraciones realizadas:", resultado.iter);
if (resultado.warning) console.log("Advertencia:", resultado.warning);