// 1. Seleciona o elemento Canvas e obtém o contexto WebGL
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('WebGL não suportado');
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

const numSegments = 50; // Define o número de segmentos para aproximar um círculo

// Função para desenhar um semicírculo
function createSemiCircleVertices(centerX, centerY, radius, numSegments, startAngle, endAngle) {
    const positions = [centerX, centerY]; // Adiciona o centro para usar TRIANGLE_FAN
    for (let i = 0; i <= numSegments; i++) {
        const angle = startAngle + (i * (endAngle - startAngle)) / numSegments;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions.push(x, y);
    }
    return positions;
}

// Função para desenhar um círculo completo com rotação
function createRotatedCircleVertices(centerX, centerY, radius, numSegments, rotationAngle) {
    const positions = [centerX, centerY];
    for (let i = 0; i <= numSegments; i++) {
        const angle = (i * 2 * Math.PI) / numSegments + rotationAngle; // Aplica a rotação
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions.push(x, y);
    }
    return positions;
}

// 5. Função para desenhar um retângulo (corpo do carro)
function createRectangleVertices(x, y, width, height) {
    return [
        x - width / 2, y - height / 2,
        x + width / 2, y - height / 2,
        x + width / 2, y + height / 2,
        x - width / 2, y + height / 2,
    ];
}

// Função para desenhar uma linha vertical (divisão entre as portas)
function createLineVertices(x, y, height) {
  return [
      x, y - height / 1.05,
      x, y + height / 1.05,
  ];
}

// Função para desenhar uma linha horizontal fina (linha na base do carro)
function createHorizontalLineVertices(x, y, width, height) {
    return [
        x - width / 2, y - height / 2,
        x + width / 2, y - height / 2,
        x + width / 2, y + height / 2,
        x - width / 2, y + height / 2,
    ];
}

// 6. Função para desenhar uma forma com uma cor específica e um modo de desenho opcional
function drawShape(vertices, color, mode = gl.TRIANGLE_FAN) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
  gl.drawArrays(mode, 0, vertices.length / 2);
}

// 7. Configurações do carro
const carroWidth = 0.6;
const carroHeight = 0.23;
let carroPosX = -1.0; // Inicia o carro fora do lado esquerdo da tela

// Configuração das rodas
const rodaRadius = 0.08;
let rodaAngulo = 0; // Ângulo de rotação das rodas

// Defina o tamanho e a posição da rua
const ruaWidth = 2;
const ruaHeight = 0.4;
const ruaVertices = createRectangleVertices(0.0, -0.5, ruaWidth, ruaHeight);

// 11. Configurações de localizações e ativa atributos
const positionLocation = gl.getAttribLocation(program, 'position');
const colorLocation = gl.getUniformLocation(program, 'color');
gl.enableVertexAttribArray(positionLocation);

// 12. Limpa a tela com uma cor de fundo
gl.clearColor(0.6, 0.9, 0.9, 0.8); // Azul claro
gl.clear(gl.COLOR_BUFFER_BIT);

drawShape(ruaVertices, [0.3, 0.3, 0.3, 1.0]);

// 13. Função de animação
function animate() {
    gl.clear(gl.COLOR_BUFFER_BIT); // Limpa o buffer de cor

    // Atualiza a posição do carro
    carroPosX += 0.01; // A velocidade do carro pode ser ajustada
    rodaAngulo -= 0.01; // Atualiza o ângulo de rotação das rodas (ajuste para controlar a velocidade de rotação)

    // Verifica se o carro saiu da tela (posX > 1.2) e o redefine para o início
    if (carroPosX > 1.4) {
        carroPosX = -1.4; // Retorna o carro para a posição inicial do lado esquerdo
    }

    // Atualiza os vértices do carro e de suas partes com a nova posição
    const carroVertices = createRectangleVertices(carroPosX, -0.35, carroWidth, carroHeight);
    const rodaEsquerdaVertices = createRotatedCircleVertices(carroPosX - 0.18, -0.45, rodaRadius, numSegments, rodaAngulo);
    const rodaDireitaVertices = createRotatedCircleVertices(carroPosX + 0.18, -0.45, rodaRadius, numSegments, rodaAngulo);
    const capoVertices = createSemiCircleVertices(carroPosX, -0.27, carroHeight / 1, numSegments, 0, Math.PI);
    const janelaVertices = createSemiCircleVertices(carroPosX, -0.25, carroHeight / 1.4, numSegments, 0, Math.PI);
    const linhaDivisoriaVertices = createLineVertices(carroPosX, -0.27, carroHeight / 1.2);
    const linhaBaseVertices = createHorizontalLineVertices(carroPosX, -0.46, carroWidth, 0.02);

    // Desenha novamente
    drawShape(ruaVertices, [0.3, 0.3, 0.3, 1.0]);
    drawShape(capoVertices, [0.8, 0.0, 0.0, 1.0]);
    drawShape(carroVertices, [0.8, 0.0, 0.0, 1.0]);
    drawShape(janelaVertices, [0.8, 0.8, 0.8, 1.0]);
    drawShape(linhaDivisoriaVertices, [0.1, 0.1, 0.1, 1.0], gl.LINES);
    drawShape(linhaBaseVertices, [0.1, 0.1, 0.1, 1.0]);
    drawShape(rodaEsquerdaVertices, [0.1, 0.1, 0.1, 1.0]);
    drawShape(rodaDireitaVertices, [0.1, 0.1, 0.1, 1.0]);

    requestAnimationFrame(animate); // Chama a função novamente
}

// Inicia a animação
animate();
