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
    //La resta tiene que menor o igual a 1x10^-6 para ser verdadera
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
  //Recorre el array siemrpe y cuando el actual tenga mas de 1 valor
  while (actual.length > 1) {
    const dif = [];
    //Genera un nuevo array con los valores de ese incremental
    for (let i = 0; i < actual.length - 1; i++) {
      dif.push(actual[i + 1] - actual[i]);
    }
    //Agrega los valores del incremental actual al array original
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

function interpolacionInversaLineal(x, y, valorY) {
  // Asumimos x equidistante y ordenado
  const h = x[1] - x[0];
  const tabla = tablaDiferenciasAvanzadas(y);
  const Δy0 = tabla[1][0];

  // Buscamos el índice donde el valor de "y" se aproxima
  let i = 0;
  while (i < y.length - 1 && !((y[i] >= valorY && valorY >= y[i + 1]) || (y[i] <= valorY && valorY <= y[i + 1]))) {
    i++;
  }

  //Manejo de error si "y" esta fuera de rango
  if (i === y.length - 1) {
    throw new Error("El valor de y no se encuentra dentro del rango de los datos.");
  }

  // Fórmula de interpolación inversa lineal:
  // x = x_i + h * ( (y - y_i) / Δy_i )
  const xi = x[i];
  const yi = y[i];
  const Δyi = y[i + 1] - y[i];

  console.log("\n Fórmula general:");
  console.log("x = xᵢ + h * ((y - yᵢ) / Δyᵢ)");

  console.log("\n Reemplazando valores:");
  console.log(`x = ${xi} + ${h} * ((${valorY} - ${yi}) / (${Δyi}))`);

  const formula = `${xi} + ${h} * ((${valorY} - ${yi}) / (${Δyi}))`;
  const xInterp = evaluate(formula);

  console.log(`\n✅ Resultado: x = ${xInterp.toFixed(6)}`); //Redondeado a 6 decimales

  //Devuelve el resultado de "x" -> xInterp y la tabla de valores 
  return { xInterp, tabla };
}

// INGRESO DE DATOS

console.log("=== MÉTODO DE INTERPOLACIÓN INVERSA LINEAL ===\n");
console.log("Ingrese hasta 10 pares de valores (x, y). x debe ser creciente y equidistante.\n");

const xVals = [];
const yVals = [];
const MAX = 10; //Maxima cantidad de valores permitidos

for (let i = 0; i < MAX; i++) {
  const entradaX = prompt(`x[${i + 1}]: `);
  if (entradaX.trim() === "") break;
  const entradaY = prompt(`y[${i + 1}]: `);

  const xNum = Number(entradaX);
  const yNum = Number(entradaY);

  if (!esNumero(xNum) || !esNumero(yNum)) {
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
  const { xInterp, tabla } = interpolacionInversaLineal(xVals, yVals, valorY);
  imprimirTablaDiferencias(tabla);
} catch (error) {
  console.error("\n❌ Error:", error.message);
}