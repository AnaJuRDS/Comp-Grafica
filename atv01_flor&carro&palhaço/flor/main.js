// 1. Seleciona o elemento Canvas e obtém o contexto WebGL
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('WebGL not supported');
}

// 2. Define os shaders
const vertexShaderGLSL = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShaderGLSL = `
precision mediump float;
uniform vec4 color;
void main() {
    gl_FragColor = color; // Usa a cor definida na uniform
}
`;

// 3. Compila os shaders
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderGLSL);
gl.compileShader(vertexShader);
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderGLSL);
gl.compileShader(fragmentShader);

// 4. Cria um programa WebGL e vincula os shaders
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// 5. Vértices da linha do cabo
const cableLineVertices = [
  0.0, -0.09, // Ponto inicial
  0.0, -0.9 // Ponto final
];

// 6. Função para desenhar uma linha
function drawLine(vertices, color) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.LINES, 0, vertices.length / 2);
}

// 7. Função para criar um círculo (miolo e pétalas)
function createCircleVertices(centerX, centerY, radius, numSegments) {
    const positions = [];
    for (let i = 0; i <= numSegments; i++) {
        const angle = (i * 2 * Math.PI) / numSegments;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions.push(x, y);
    }
    return positions;
}

// (mais oval)
function createOvalVertices(centerX, centerY, radiusX, radiusY, numSegments) {
  const positions = [];
  for (let i = 0; i <= numSegments; i++) {
      const angle = (i * 2 * Math.PI) / numSegments;
      const x = centerX + radiusX * Math.cos(angle); // Usa radiusX para ajuste horizontal
      const y = centerY + radiusY * Math.sin(angle); // Usa radiusY para ajuste vertical
      positions.push(x, y);
  }
  return positions;
}

// 8. Configuração do miolo da flor
const numSegments = 100;
const mioloRadius = 0.1;
const mioloVertices = createCircleVertices(0.0, 0.0, mioloRadius, numSegments);

// 9. Configuração das pétalas (cinco pétalas ao redor do miolo)
const petalaRadiusX = 0.09;
const petalaRadiusY = 0.07;
const petalas = [
    createOvalVertices(0.15, 0.0, petalaRadiusX, petalaRadiusY, numSegments), // Direita
    createOvalVertices(-0.15, 0.0, petalaRadiusX, petalaRadiusY, numSegments), // Esquerda
    createOvalVertices(0.0, 0.15, petalaRadiusX, petalaRadiusY, numSegments), // Acima
    createOvalVertices(0.1, 0.1, petalaRadiusX, petalaRadiusY, numSegments), // Diagonal direita acima
    createOvalVertices(-0.1, 0.1, petalaRadiusX, petalaRadiusY, numSegments), // Diagonal esquerda acima
    createOvalVertices(-0.1, -0.1, petalaRadiusX, petalaRadiusY, numSegments), // Diagonal direita abaixo
    createOvalVertices(0.1, -0.1, petalaRadiusX, petalaRadiusY, numSegments), // Diagonal esquerda abaixo
    createOvalVertices(0.0, -0.15, petalaRadiusX, petalaRadiusY, numSegments) // Baixo
];

// 10. Função para desenhar um círculo com uma cor específica
function drawCircle(vertices, color) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);
}

// 10. Configuração das nuvens (conjuntos de ovais brancos/cinza claro para simular nuvens)
const nuvemRadiusX = 0.2; // Ajuste o tamanho horizontal
const nuvemRadiusY = 0.07; // Ajuste o tamanho vertical
const nuvens = [
    // Primeira nuvem (grupo de ovals)
    createOvalVertices(-0.6, 0.6, nuvemRadiusX, nuvemRadiusY, numSegments),
    createOvalVertices(-0.7, 0.7, nuvemRadiusX * 1.1, nuvemRadiusY, numSegments),
    createOvalVertices(-0.6, 0.6, nuvemRadiusX * 0.9, nuvemRadiusY, numSegments),
    
    // Segunda nuvem
    createOvalVertices(0.6, 0.4, nuvemRadiusX * 0.8, nuvemRadiusY, numSegments),
    createOvalVertices(0.4, 0.45, nuvemRadiusX, nuvemRadiusY * 1.2, numSegments),
    createOvalVertices(0.3, 0.5, nuvemRadiusX * 0.9, nuvemRadiusY * 1.1, numSegments),
    
    // Terceira nuvem
    createOvalVertices(-0.1, 0.7, nuvemRadiusX * 0.7, nuvemRadiusY * 0.8, numSegments),
    createOvalVertices(-0.0, 0.7, nuvemRadiusX * 1.2, nuvemRadiusY, numSegments),
    createOvalVertices(0.0, 0.75, nuvemRadiusX * 0.8, nuvemRadiusY * 0.9, numSegments)
];


// 11. Configurações de localizações e ativa atributos
const positionLocation = gl.getAttribLocation(program, 'position');
const colorLocation = gl.getUniformLocation(program, 'color');
gl.enableVertexAttribArray(positionLocation);

// 12. Limpa a tela com uma cor de fundo
gl.clearColor(0.3, 0.7, 0.9, 0.3); // Azul claro
gl.clear(gl.COLOR_BUFFER_BIT);

// 13. Desenha o cabo primeiro para que fique atrás
drawLine(cableLineVertices, [0.0, 0.5, 0.0, 1.0]); // Verde

// 14. Desenha as pétalas em lilás/roxo
for (const petala of petalas) {
  drawCircle(petala, [0.6, 0.4, 0.8, 1.0]); // Lilás/roxo
}

// 15. Desenha o miolo em amarelo
drawCircle(mioloVertices, [1.0, 1.0, 0.0, 1.0]); // Amarelo

// Desenha as nuvens com uma cor branca/cinza claro
for (const nuvem of nuvens) {
  drawCircle(nuvem, [1.0, 1.0, 1.0, 1.0]); // Branco/cinza claro
}

