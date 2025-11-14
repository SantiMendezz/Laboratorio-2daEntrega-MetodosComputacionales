// Gauss-Jordan paso a paso para el sistema de producción
// Sistema:
// 4.3 x + 3   y + 2   z = 960
// 1   x + 3   y + 1   z = 510
// 2   x + 1   y + 3   z = 610

const A = [
  [4.3, 3,   2  ],
  [1.0, 3,   1  ],
  [2.0, 1,   3  ]
];
const b = [960, 510, 610];

function cloneMatrix(M) { return M.map(r => r.slice()); }
function printAugmented(M, rhs, title = "") {
  if (title) console.log("==", title, "==");
  for (let i = 0; i < M.length; i++) {
    const row = M[i].map(v => v.toFixed(6)).join("\t");
    console.log(row, " | ", rhs[i].toFixed(6));
  }
  console.log("");
}

function gaussJordan(Aorig, borig, verbose = true) {
  const n = Aorig.length;
  const A = cloneMatrix(Aorig);
  const b = borig.slice();

  if (verbose) {
    console.log("Matriz aumentada inicial:");
    printAugmented(A, b);
  }

  for (let col = 0; col < n; col++) {
    // Pivot parcial: buscar fila con mayor |A[row][col]|
    let pivotRow = col;
    let maxAbs = Math.abs(A[col][col]);
    for (let r = col + 1; r < n; r++) {
      const val = Math.abs(A[r][col]);
      if (val > maxAbs) { maxAbs = val; pivotRow = r; }
    }

    if (Math.abs(A[pivotRow][col]) < 1e-14) {
      throw new Error("Pivote cero (o casi cero). El sistema puede ser singular.");
    }

    // Swap filas si es necesario
    if (pivotRow !== col) {
      [A[col], A[pivotRow]] = [A[pivotRow], A[col]];
      [b[col], b[pivotRow]] = [b[pivotRow], b[col]];
      if (verbose) console.log(`Intercambio filas ${col} <-> ${pivotRow}:`);
      if (verbose) printAugmented(A, b);
    }

    // Normalizar la fila pivote (hacer pivote == 1)
    const piv = A[col][col];
    for (let j = 0; j < n; j++) A[col][j] = A[col][j] / piv;
    b[col] = b[col] / piv;
    if (verbose) console.log(`Normalizar fila ${col} (dividir por pivote ${piv.toFixed(6)}):`);
    if (verbose) printAugmented(A, b);

    // Eliminar la columna en todas las otras filas (hacer ceros)
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = A[r][col];
      for (let j = 0; j < n; j++) {
        A[r][j] = A[r][j] - factor * A[col][j];
      }
      b[r] = b[r] - factor * b[col];
      if (verbose) {
        console.log(`Usando fila pivote ${col} para eliminar en fila ${r} (factor=${factor.toFixed(6)}):`);
        printAugmented(A, b);
      }
    }
  }

  // Al final la matriz A debería ser identidad y b la solución
  const x = b.slice();
  return x;
}

function matVecMul(M, v) {
  return M.map(row => row.reduce((s, a, j) => s + a * v[j], 0));
}
function maxAbsVec(v) { return Math.max(...v.map(Math.abs)); }

// Ejecutar
try {
  const sol = gaussJordan(A, b, true);

  console.log("=== Solución encontrada (x, y, z) ===");
  console.log(sol.map(v => v.toFixed(8)));

  // Comprobación de residuo
  const Ax = matVecMul(A, sol);
  const resid = Ax.map((val, i) => val - b[i]);
  console.log("\nComprobación (A * x) :");
  Ax.forEach((val, i) => console.log(`Fila ${i+1}: ${val.toFixed(8)}  (b=${b[i].toFixed(8)})`));
  //console.log("\nResiduo máximo absoluto:", maxAbsVec(resid).toExponential());

} catch (err) {
  console.error("Error:", err.message);
}