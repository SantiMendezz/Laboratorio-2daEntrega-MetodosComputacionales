// Interpolación Lagrange y "parabólica progresiva" para T=275
// Datos experimentales: Temperatura (grados) y densidad (unidades)
const xs = [102, 245, 327, 423, 565];
const ys = [0.564642, 0.644218, 0.717356, 0.783327, 0.853329];

const xEval = 275;

// Utilidades
function toFixedStr(v, d = 9) { return Number(v).toFixed(d); }
function product(arr) { return arr.reduce((a,b)=>a*b, 1); }

// LAGRANGE
function lagrangeDetailed(x, y, xEval) {
  const n = x.length;
  console.log("\n=== LAGRANGE (usando todos los puntos) ===\n");
  let P = 0;
  for (let i = 0; i < n; i++) {
    console.log(`Término i = ${i}: x_i=${x[i]}, y_i=${y[i]}`);
    let Li = 1;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const num = xEval - x[j];
      const den = x[i] - x[j];
      const factor = num / den;
      console.log(`   Factor j=${j}: (x - x_j)/(x_i - x_j) = (${xEval} - ${x[j]})/(${x[i]} - ${x[j]}) = ${toFixedStr(factor,12)}`);
      Li *= factor;
    }
    const term = Li * y[i];
    console.log(`   => L_${i}(${xEval}) = ${toFixedStr(Li,12)}  ,  término = L_${i} * y_i = ${toFixedStr(term,12)}\n`);
    P += term;
  }
  console.log(`Interpolación Lagrange completa: P(${xEval}) = ${toFixedStr(P,12)}\n`);
  return P;
}

// ---------------------- INTERPOLACIÓN PARABÓLICA PROGRESIVA (Newton forward) ----------------------
// Interpretación: "parabólica progresiva" -> usamos Newton en forma progresiva tomando x0 = 245
function findSegmentIndices(x, xEval) {
  // Encuentra índice i tal que x[i] <= xEval < x[i+1]. Luego tomamos i, i+1, i+2 si es posible.
  for (let i = 0; i < x.length - 1; i++) {
    if (x[i] <= xEval && xEval <= x[i+1]) {
      // preferimos los tres puntos centrados en el intervalo si existen
      if (i+2 < x.length) return [i, i+1, i+2];
      else return [i-1, i, i+1]; // borde superior
    }
  }
  // si no lo encuentra (fuera de rango), toma los 3 últimos
  return [x.length-3, x.length-2, x.length-1];
}

function dividedDifferences(xs, ys) {
  // construye la tabla de diferencias divididas (triangular superior)
  const n = xs.length;
  const table = Array.from({length:n}, (_,i) => Array(n).fill(0));
  for (let i = 0; i < n; i++) table[i][0] = ys[i];
  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n-j; i++) {
      table[i][j] = (table[i+1][j-1] - table[i][j-1]) / (xs[i+j] - xs[i]);
    }
  }
  return table;
}

function newtonQuadraticForward(xs_sel, ys_sel, xEval) {
  console.log("\n=== INTERPOLACIÓN PARABÓLICA PROGRESIVA (Newton forward) ===\n");
  console.log("Se seleccionan los puntos (x0,x1,x2):");
  console.log(xs_sel.map((v,i) => `  i=${i}: x=${v}, y=${ys_sel[i]}`).join("\n"));
  const dd = dividedDifferences(xs_sel, ys_sel);
  console.log("\nTabla de diferencias divididas (fila i, columna j -> dd[i][j]):");
  for (let i = 0; i < dd.length; i++) {
    const row = dd[i].slice(0, dd.length - i).map(v => toFixedStr(v,12)).join(" , ");
    console.log(`fila ${i}: ${row}`);
  }
  const f0 = dd[0][0];
  const f01 = dd[0][1];
  const f012 = dd[0][2];
  console.log(`\nCoeficientes Newton (orden 0..2): f[x0]=${toFixedStr(f0,12)}, f[x0,x1]=${toFixedStr(f01,12)}, f[x0,x1,x2]=${toFixedStr(f012,12)}`);

  // Evaluar polinomio Newton: P(x) = f0 + f01*(x-x0) + f012*(x-x0)*(x-x1)
  const x0 = xs_sel[0];
  const x1 = xs_sel[1];
  const term1 = f0;
  const term2 = f01 * (xEval - x0);
  const term3 = f012 * (xEval - x0) * (xEval - x1);
  const P = term1 + term2 + term3;

  console.log(`\nEvaluación en x=${xEval}:`);
  console.log(`  término0 = f0 = ${toFixedStr(term1,12)}`);
  console.log(`  término1 = f01*(x - x0) = ${toFixedStr(f01,12)} * (${xEval} - ${x0}) = ${toFixedStr(term2,12)}`);
  console.log(`  término2 = f012*(x - x0)*(x - x1) = ${toFixedStr(f012,12)} * (${xEval} - ${x0}) * (${xEval} - ${x1}) = ${toFixedStr(term3,12)}`);
  console.log(`\nResultado parábólico (Newton forward): P(${xEval}) = ${toFixedStr(P,12)}\n`);

  return { P, f012, xs_sel, ys_sel, dd };
}

// ESTIMACIÓN DEL ERROR
function estimateErrorUsingThirdDiv(xs_four, ys_four, xEval, xs_tri) {

  const dd4 = dividedDifferences(xs_four, ys_four);
  
  const thirdDiv = dd4[0][3];
  console.log("\nEstimación del error usando tercera diferencia dividida (4 puntos):");
  console.log(`Puntos usados para estimar thirdDiv: ${xs_four.join(", ")}`);
  console.log(`thirdDiv = dd[0][3] = ${toFixedStr(thirdDiv,12)}  (aprox f^{(3)}/3!)`);

  const x0 = xs_tri[0], x1 = xs_tri[1], x2 = xs_tri[2];
  const prod = (xEval - x0) * (xEval - x1) * (xEval - x2);
  const Rapprox = thirdDiv * prod;
  console.log(`Producto (x - x0)(x - x1)(x - x2) = (${xEval}-${x0})*(${xEval}-${x1})*(${xEval}-${x2}) = ${toFixedStr(prod,12)}`);
  console.log(`Estimación del término de error: R ≈ thirdDiv * producto = ${toFixedStr(Rapprox,12)}`);
  console.log(`(Valor absoluto) |R| ≈ ${toFixedStr(Math.abs(Rapprox),12)}\n`);
  return Rapprox;
}

//EJECUCIÓN
console.log("\n=== DATOS ===");
xs.forEach((xi,i) => console.log(`x[${i}] = ${xi}, y[${i}] = ${ys[i]}`));

// 1) Lagrange con todos los puntos
const P_lagrange = lagrangeDetailed(xs, ys, xEval);

// 2) Parabólica progresiva con tres puntos más adecuados
const indices = findSegmentIndices(xs, xEval); // ejemplo: [1,2,3] -> 245,327,423
const xs_tri = indices.map(i => xs[i]);
const ys_tri = indices.map(i => ys[i]);
const newtonRes = newtonQuadraticForward(xs_tri, ys_tri, xEval);
const P_newton = newtonRes.P;

// 3) Estimación de error: usamos 4 puntos consecutivos cercanos para thirdDiv.
// Elegimos los 4 puntos que empiezan en xs_tri[0] si es posible, si no tomar los 4 anteriores.
let idxStart = indices[0];
if (idxStart + 3 >= xs.length) idxStart = xs.length - 4;
const xs_four = xs.slice(idxStart, idxStart + 4);
const ys_four = ys.slice(idxStart, idxStart + 4);
const Rapprox = estimateErrorUsingThirdDiv(xs_four, ys_four, xEval, xs_tri);

// 4) Salidas resumidas y conclusiones
console.log(`Resumen:`);
console.log(`- Lagrange (5 puntos): P(${xEval}) = ${toFixedStr(P_lagrange,12)}`);
console.log(`- Parabólica (Newton, 3 puntos ${xs_tri.join(", ")}): P(${xEval}) = ${toFixedStr(P_newton,12)}`);
console.log(`- Estimación del error (parabólica) ≈ ${toFixedStr(Rapprox,12)}`);
console.log("\nConclusiones tentativas:");
console.log(" - La interpolación de Lagrange (grado 4) utiliza todos los datos y puede presentar oscilaciones,");
console.log("   pero da una estimación global considerando toda la muestra.");
console.log(" - La interpolación parabólica (grado 2) con puntos locales (245,327,423) produce una estimación");
console.log("   local más estable y computacionalmente barata; el término de error estimado usando la tercera");
console.log("   diferencia dividida nos da una cota aproximada del error cometido.");
console.log(" - Si |R| es pequeño comparado con la magnitud de la densidad (~0.7), la aproximación parabólica");
console.log("   puede considerarse suficiente para aplicaciones prácticas.\n");