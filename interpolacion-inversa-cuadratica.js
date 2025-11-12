//Importaciones y configuracion
import { evaluate } from "mathjs";
import promptSync from "prompt-sync";

const prompt = promptSync();

// FUNCIONES AUXILIARES

//Verifica que el valor ingresado sea un numero valido
function esNumero(valor) {
  return !isNaN(valor) && typeof valor === "number";
}

//Verifica que los valores de x sean equidistantes en caso de que haya mas de dos valores
function esEquidistante(xVals) {
  if (xVals.length < 2) return true;
  const h = xVals[1] - xVals[0];
  for (let i = 1; i < xVals.length - 1; i++) {
    //La diferencia debe ser menor o igual a 1x10^-6 para considerarse verdadera
    if (Math.abs(xVals[i + 1] - xVals[i] - h) > 1e-6) {
      return false;
    }
  }
  return true;
}

//Genera la tabla de diferencias avanzadas
function tablaDiferenciasAvanzadas(yVals) {
  const tabla = [yVals];
  let actual = yVals;
  //Recorre el array mientras queden diferencias por calcular
  while (actual.length > 1) {
    const dif = [];
    for (let i = 0; i < actual.length - 1; i++) {
      dif.push(actual[i + 1] - actual[i]);
    }
    tabla.push(dif);
    actual = dif;
  }
  return tabla;
}

//Muestra la tabla por consola
function imprimirTablaDiferencias(tabla) {
  console.log("\n Tabla de diferencias avanzadas:");
  for (let i = 0; i < tabla.length; i++) {
    const dif = tabla[i].map(v => v.toFixed(6)).join("\t");
    console.log(`Δ^${i}y:\t${dif}`);
  }
}

// MÉTODO DE INTERPOLACIÓN INVERSA CUADRÁTICA
function interpolacionInversaCuadratica(x, y, valorY) {
  // Asumimos x equidistante y ordenado
  const h = x[1] - x[0];
  const tabla = tablaDiferenciasAvanzadas(y);

  // Buscamos el índice donde el valor de "y" se aproxima
  let i = 0;
  while (
    i < y.length - 2 &&
    !((y[i] >= valorY && valorY >= y[i + 1]) || (y[i] <= valorY && valorY <= y[i + 1]))
  ) {
    i++;
  }

  //Manejo de error si "y" está fuera de rango
  if (i >= y.length - 2) {
    throw new Error("El valor de y no se encuentra dentro del rango de los datos.");
  }

  //Datos necesarios
  const x0 = x[i];
  const x1 = x[i + 1];
  const x2 = x[i + 2];
  const y0 = y[i];
  const Δy0 = tabla[1][i];
  const Δ2y0 = tabla[2][i];

  //Fórmula de interpolación inversa cuadrática:
  // y = y₀ + (Δy₀/h)*(x - x₀) + (Δ²y₀/(2h²))*(x - x₀)*(x - x₁)
  console.log("\n Fórmula general:");
  console.log("y = y₀ + (Δy₀/h)*(x - x₀) + (Δ²y₀/(2h²))*(x - x₀)*(x - x₁)");

  console.log("\n Reemplazando valores:");
  console.log(
    `y = ${y0} + (${Δy0}/${h})*(x - ${x0}) + (${Δ2y0}/(2*${h}^2))*(x - ${x0})*(x - ${x1})`
  );

  // Queremos despejar "x" dado "y = valorY"
  // Esto es una ecuación cuadrática en x: a*x² + b*x + c = 0

  const a = Δ2y0 / (2 * h ** 2);
  const b = (Δy0 / h) - a * (x0 + x1);
  const c = y0 - valorY - (Δy0 / h) * x0 + a * x0 * x1;

  // Resolución de ecuación cuadrática
  const discriminante = b ** 2 - 4 * a * c;
  if (discriminante < 0) {
    throw new Error("❌ No se encontraron soluciones reales para x.");
  }

  const x1_sol = (-b + Math.sqrt(discriminante)) / (2 * a);
  const x2_sol = (-b - Math.sqrt(discriminante)) / (2 * a);

  console.log("\n Raíces obtenidas de la ecuación cuadrática:");
  console.log(`x₁ = ${x1_sol.toFixed(6)}`);
  console.log(`x₂ = ${x2_sol.toFixed(6)}`);

  // Elegimos la raíz que esté dentro del rango de los datos
  let xInterp;
  if (x1_sol >= x0 && x1_sol <= x2) {
    xInterp = x1_sol;
    console.log(`\n✅ La raíz correcta es x₁ = ${x1_sol.toFixed(6)} (dentro del rango de datos)`);
  } else if (x2_sol >= x0 && x2_sol <= x2) {
    xInterp = x2_sol;
    console.log(`\n✅ La raíz correcta es x₂ = ${x2_sol.toFixed(6)} (dentro del rango de datos)`);
  } else {
    throw new Error("❌ Ninguna raíz se encuentra dentro del rango de los datos.");
  }

  //Devuelve el resultado de "x" -> xInterp y la tabla de valores 
  return { xInterp, tabla };
}

// INGRESO DE DATOS

console.log("=== MÉTODO DE INTERPOLACIÓN INVERSA CUADRÁTICA ===\n");
console.log("Ingrese hasta 10 pares de valores (x, y). x debe ser creciente y equidistante.\n");

const xVals = [];
const yVals = [];
const MAX = 10; //Máxima cantidad de valores permitidos

for (let i = 0; i < MAX; i++) {
  const entradaX = prompt(`x[${i + 1}]: `);
  if (entradaX.trim() === "") break;
  const entradaY = prompt(`y[${i + 1}]: `);

  const xNum = Number(entradaX);
  const yNum = Number(entradaY);

  if (!isFinite(xNum) || !isFinite(yNum) || !esNumero(xNum) || !esNumero(yNum)) {
    console.log("⚠️ Ambos valores deben ser numéricos. Intente de nuevo.");
    i--;
    continue;
  }

  // Validar que x sea creciente
  if (i > 0 && xNum <= xVals[i - 1]) {
    console.log("⚠️ Los valores de x deben ser estrictamente crecientes.");
    i--;
    continue;
  }

  xVals.push(xNum);
  yVals.push(yNum);
}

// Validar equidistancia
if (!esEquidistante(xVals)) {
  console.error("\n❌ Error: Los valores de x no son equidistantes. No puede aplicarse este método.");
  process.exit(1);
}

const valorY = Number(prompt("\nIngrese el valor de y para el cual desea interpolar x: "));

try {
  const { xInterp, tabla } = interpolacionInversaCuadratica(xVals, yVals, valorY);
  imprimirTablaDiferencias(tabla);
} catch (error) {
  console.error("\n❌ Error:", error.message);
}