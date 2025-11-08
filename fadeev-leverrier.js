import { evaluate, parse } from "mathjs";
import promptSync from "prompt-sync";
import { plot } from "nodeplotlib";

const prompt = promptSync();

function esUnNumero(valor) { //retorna true si es un valor numerico
    return !isNaN(valor) && typeof valor === 'number';
}

// FUNCIONES AUXILIARES DE MATRICES

function identidad(n) { //Genera una matriz identidad de n x n
    return Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    );
}

function sumarMatrices(A, B) {
    // Validar dimensiones
    if (A.length !== B.length || A[0].length !== B[0].length) {
        throw new Error('Las matrices deben tener las mismas dimensiones');
    }

    return A.map((fila, i) => fila.map((val, j) => val + B[i][j]));
}

function restarMatrices(A, B) {
    // Validar que tengan el mismo tamaño
    if (A.length !== B.length || A[0].length !== B[0].length) {
        throw new Error('Las matrices deben tener las mismas dimensiones');
    }

    // Crear una nueva matriz con el resultado
    const resultado = A.map((fila, i) =>
        fila.map((valor, j) => valor - B[i][j])
    );

    return resultado;
}

function multiplicarMatrices(A, B) {
    // Verificar si se pueden multiplicar
    if (A[0].length !== B.length) {
        throw new Error('El número de columnas de A debe ser igual al número de filas de B');
    }

    // Crear una matriz resultado llena de ceros
    const resultado = Array.from({ length: A.length }, () => Array(B[0].length).fill(0));

    // Calcular cada elemento
    for (let i = 0; i < A.length; i++) {          // filas de A
        for (let j = 0; j < B[0].length; j++) {     // columnas de B
            for (let k = 0; k < B.length; k++) {      // columnas de A / filas de B
                resultado[i][j] += A[i][k] * B[k][j];   // [fila A][columna k] * [fila k][columna B]
            }
        }
    }

    return resultado;
}

function multiplicarMatrizPorNumero(A, num) {
    if (!esUnNumero(num)) {
        throw new Error('num no es numerico');
    }

    const resultado = Array.from({ length: A.length }, () => Array(A[0].length).fill(0));

    //Calcular cada elemento
    for (let i = 0; i < A.length; i++) {
        for (let j = 0; j < A[0].length; j++) {
            resultado[i][j] = num * A[i][j];
        }
    }

    return resultado;
}

function calcularTraza(matriz) {
    let traza = 0;

    //Recorrer la matriz y solo sumar los elementos de la diagonal principal
    matriz.forEach((fila, i) => {
        fila.forEach((valor, j) => {
            if (i === j) {
                traza += valor;
            }
        });
    });

    return traza;
}

// UTILIDADES PARA POLINOMIOS Y RAÍCES

function construirCoefPolinomioDesdeB(b) {
    // b: [b1, b2, ..., bn]
    // polinomio: λ^n - b1 λ^{n-1} - b2 λ^{n-2} - ... - bn
    // devolver arreglo coeficientes de mayor a menor potencia: [1, -b1, -b2, ..., -bn]
    const n = b.length;
    const coef = [1];
    for (let i = 0; i < n; i++) coef.push(-b[i]);
    return coef;
}

function evaluarPolinomio(coef, x) {
    // coef: [a0, a1, ... , aN] para a0 x^N + a1 x^{N-1} + ... + aN
    let res = 0;
    const N = coef.length - 1;
    for (let i = 0; i < coef.length; i++) {
        res += coef[i] * Math.pow(x, N - i);
    }
    return res;
}

function derivadaPolinomio(coef) {
    // devuelve coeficientes de la derivada (misma convención)
    const N = coef.length - 1;
    if (N === 0) return [0];
    const deriv = [];
    for (let i = 0; i < coef.length - 1; i++) {
        deriv.push(coef[i] * (N - i));
    }
    return deriv;
}

function divisoresEnteros(n) {
    // devuelve divisores enteros positivos de |n|
    n = Math.abs(Math.round(n));
    if (n === 0) return [0];
    const divs = new Set();
    for (let d = 1; d <= Math.sqrt(n); d++) {
        if (n % d === 0) {
            divs.add(d);
            divs.add(n / d);
        }
    }
    const arr = Array.from(divs).sort((a, b) => a - b);
    // incluir negativos
    const both = [];
    for (const v of arr) { both.push(v); both.push(-v); }
    return both;
}

function syntheticDivision(coef, root) {
    // coef: [a0..aN] mayor a menor. root: r -> divide por (x - r)
    // devuelve nuevo conjunto de coeficientes (grado-1) y resto
    const N = coef.length - 1;
    const newCoef = [];
    let carry = coef[0];
    newCoef.push(carry);
    for (let i = 1; i < coef.length; i++) {
        carry = coef[i] + carry * root;
        newCoef.push(carry);
    }
    const remainder = newCoef.pop(); // último es resto
    return { deflated: newCoef, remainder };
}

function encontrarRaizPorTanteo(coef) {
    // coef: [a0..aN], buscamos raíces reales por tanteo uniforme
    const roots = [];
    const paso = 0.1;       // incremento de x
    const rango = 200;      // desde -rango hasta +rango
    const tol = 1e-6;       // tolerancia para considerar raíz
    let prevX = -rango;
    let prevVal = evaluarPolinomio(coef, prevX);

    console.log("\n--- INICIO DE BÚSQUEDA DE RAÍCES (TANTEO) ---");
    console.log(`Rango: [-${rango}, ${rango}] con paso ${paso}`);

    for (let x = -rango + paso; x <= rango; x += paso) {
        const val = evaluarPolinomio(coef, x);

        // Mostrar iteración
        //console.log(`x=${x.toFixed(6)} -> f(x)=${val.toFixed(6)}`);

        // Detección de raíz: cambio de signo o valor cercano a 0
        if (Math.abs(val) < tol || prevVal * val < 0) {
            const raizAprox = Number(x.toFixed(6));
            if (!roots.some(r => Math.abs(r - raizAprox) < paso)) {
                roots.push(raizAprox);
                console.log(`✅ Raíz aproximada encontrada: λ ≈ ${raizAprox}`);
            }
        }

        prevX = x;
        prevVal = val;
    }

    console.log("\n--- FIN DE BÚSQUEDA DE RAÍCES ---");
    return roots;
}


// RESOLVER SISTEMA HOMOGÉNEO (A - λI) x = 0 -> encontrar un autovector

function copiarMatriz(A) {
    return A.map(f => f.slice());
}

function reducirAFilaEscalonada(Aug) {
    // Aug es matriz (m x n) en notación de filas (no aumentada con vector) - se hace RREF parcial
    const M = copiarMatriz(Aug);
    const m = M.length;
    const n = M[0].length;
    let row = 0;
    for (let col = 0; col < n && row < m; col++) {
        // Buscar pivote en o debajo de row
        let sel = row;
        while (sel < m && Math.abs(M[sel][col]) < 1e-12) sel++;
        if (sel === m) continue;
        // intercambiar
        [M[row], M[sel]] = [M[sel], M[row]];
        // normalizar pivote
        const pivot = M[row][col];
        for (let j = col; j < n; j++) M[row][j] /= pivot;
        // eliminar otras filas
        for (let i = 0; i < m; i++) {
            if (i === row) continue;
            const factor = M[i][col];
            if (Math.abs(factor) > 1e-12) {
                for (let j = col; j < n; j++) {
                    M[i][j] -= factor * M[row][j];
                }
            }
        }
        row++;
    }
    return M;
}

//-----------------------------------------------
// ENCONTRAR AUTOVECTOR FORZANDO LA ÚLTIMA COMPONENTE = -1
//-----------------------------------------------
// Resolvemos (A - lambda I) x = 0 con la condición x[n-1] = -1
// Esto transforma el sistema en: para i=0..n-1
//   M[i][0]*x0 + ... + M[i][n-2]*x_{n-2} = M[i][n-1]
// (porque M[i][n-1]*(-1) pasa al otro lado con signo contrario).
// Tomamos las primeras (n-1) ecuaciones para construir un sistema (n-1)x(n-1)
// y lo resolvemos con eliminación de Gauss (pivotado).
function encontrarAutovectorForzarUltimo(A, lambda) {
    const n = A.length;

    // 1️⃣ Construir M = A - λI
    const M = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => A[i][j] - (i === j ? lambda : 0))
    );

    console.log(`\nCalculando autovector para λ = ${lambda.toFixed(6)}:`);
    console.log(`Matriz (A - λI):`);
    M.forEach(fila => console.log('[ ' + fila.map(v => v.toFixed(6)).join('  ') + ' ]'));

    // 2️⃣ Tomamos las primeras (n-1) filas completas (n columnas)
    const NN = n - 1;
    const mat = Array.from({ length: NN }, (_, i) => M[i].slice());

    // 3️⃣ Aplicamos eliminación de Gauss a la parte (n-1)x(n)
    for (let k = 0; k < NN - 1; k++) {
        // Pivot parcial
        let piv = k;
        let maxv = Math.abs(mat[k][k]);
        for (let i = k + 1; i < NN; i++) {
            const val = Math.abs(mat[i][k]);
            if (val > maxv) { maxv = val; piv = i; }
        }
        if (piv !== k) [mat[k], mat[piv]] = [mat[piv], mat[k]];

        const pivot = mat[k][k];
        if (Math.abs(pivot) < 1e-12) continue;

        // Eliminar por debajo del pivote
        for (let i = k + 1; i < NN; i++) {
            const factor = mat[i][k] / pivot;
            for (let j = k; j < n; j++) {
                mat[i][j] -= factor * mat[k][j];
            }
        }
    }

    console.log(`\nMatriz luego de eliminación de Gauss (triangular superior):`);
    mat.forEach(fila => console.log('[ ' + fila.map(v => v.toFixed(6)).join('  ') + ' ]'));

    // 4️⃣ Resolver el sistema
    // (M_red) * [x1..x_(n-1)] + (última columna)*x_n = 0
    // como x_n = -1 → pasamos al otro lado y resolvemos para x1..x_(n-1)
    const x = Array(NN).fill(0);
    const x_n = -1;

    for (let i = NN - 1; i >= 0; i--) {
        let suma = 0;
        for (let j = i + 1; j < NN; j++) suma += mat[i][j] * x[j];
        x[i] = (-mat[i][n - 1] * x_n - suma) / mat[i][i];
    }

    const vec = [...x, x_n];

    console.log(`\nAutovector encontrado (x${n} = -1):`);
    console.log('[ ' + vec.map(v => v.toFixed(6)).join('  ') + ' ]\n');

    return vec;
}


// MÉTODO DE FADEEV-LEVRRIER
function fadeevLeverrier(A) {
    try {
        const n = A.length;
        const I = identidad(n); // matriz identidad
        let B = A.map(fila => [...fila]); // B1 = A
        const b = []; // almacenará los coeficientes b1, b2, b3, ...

        // Calcular b1
        b[0] = calcularTraza(B);

        // Calcular Bk y bk para k = 2 ... n
        for (let k = 2; k <= n; k++) {
            // Bk = A * B(k-1) - b(k-1) * I
            const term = multiplicarMatrizPorNumero(I, b[k - 2]);
            const AB = multiplicarMatrices(A, B);
            const Bk = restarMatrices(AB, term);

            // Actualizar B y calcular bk
            B = Bk;
            b[k - 1] = calcularTraza(B) / k;
        }

        // Mostrar resultados intermedios
        console.log("\nCoeficientes obtenidos (b1..bn):", b);

        // Construir el polinomio característico (string)
        let polinomio = `λ^${n}`;
        for (let i = 0; i < n; i++) {
            const exponente = n - i - 1;
            const signo = b[i] >= 0 ? " - " : " + ";
            polinomio += signo + Math.abs(b[i]).toFixed(4);
            if (exponente > 0) polinomio += `λ^${exponente}`;
        }

        console.log("\nPolinomio característico:");
        console.log(polinomio + " = 0");

        // Construir coeficientes numéricos del polinomio para hallar raíces
        const polyCoef = construirCoefPolinomioDesdeB(b); // [1, -b1, -b2, ..., -bn]

        // Encontrar raíces (autovalores)
        const raices = encontrarRaizPorTanteo(polyCoef);
        console.log("\nAutovalores encontrados (apróx):", raices);

        // Para cada autovalor, calcular un autovector forzando la última componente a -1
        const autovectores = [];
        for (const lambda of raices) {
            const v = encontrarAutovectorForzarUltimo(A, lambda);
            if (v) autovectores.push({ lambda, vector: v });
            else autovectores.push({ lambda, vector: null });
        }

        // Mostrar autovectores
        console.log("\nAutovectores (normalizados):");
        autovectores.forEach((av, idx) => {
            console.log(`λ = ${av.lambda.toFixed(6)} -> v = ${av.vector ? av.vector.map(x => x.toFixed(6)) : 'fallo'} `);
        });

        return { b, polyCoef, raices, autovectores };
    } catch (error) {
        console.error('❌ Error en Fadeev-Leverrier:', error.message);
        return null;
    }
}

// INGRESO Y MUESTRA DE DATOS

const maxSize = 3; //Tamanio maximo de la matriz -> maxSize x maxSize

const ingresoDatos = (maxSize) => { //Ingreso de datos
    let esNumerico = false;
    let funcionesFinales = [];

    for (let i = 0; i < maxSize; i++) {
        console.log(`Valores para fila ${i + 1} :`);
        let funcionFila = [];
        for (let j = 0; j < maxSize; j++) {
            while (true) {
                let x = Number(prompt(`Ingrese el valor ${j + 1} (numero real): `));
                esNumerico = esUnNumero(x);
                if (esNumerico) {
                    funcionFila.push(x);
                    break;
                }
            }
        }
        funcionesFinales.push(funcionFila);
    }

    return funcionesFinales;
}

const mostrarDatos = (matriz) => { //Muestra de los datos de la matriz ingresada
    const size = matriz.length;
    console.log('\nMatriz obtenida:');
    for (let i = 0; i < size; i++) {
        const subArray = matriz[i];
        //Se imprime los elementos de una misma fila separados por ' '
        console.log('[ ' + subArray.join('  ') + ' ]');
    }
}

// PROGRAMA PRINCIPAL

//Inicializacion de la matriz(funciones)
const matriz = ingresoDatos(maxSize);

//Empieza la ejecucion del tiempo de medicion
console.time("Tiempo de ejecución");

//Llamadas
mostrarDatos(matriz);
const resultadoFL = fadeevLeverrier(matriz);

console.timeEnd("Tiempo de ejecución");