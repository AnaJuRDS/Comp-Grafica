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
const carroVertices = createRectangleVertices(0.0, -0.35, carroWidth, carroHeight);


const ruaWidth = 2;
const ruaHeight = 0.4;
const ruaVertices = createRectangleVertices(0.0, -0.5, ruaWidth, ruaHeight); // Ajuste na posição para que fique mais abaixo

// 8. Configuração das rodas
const numSegments = 50;
const rodaRadius = 0.08;
const rodaEsquerdaVertices = createSemiCircleVertices(-0.18, -0.45, rodaRadius, numSegments, 0, 2 * Math.PI);
const rodaDireitaVertices = createSemiCircleVertices(0.18, -0.45, rodaRadius, numSegments, 0, 2 * Math.PI);

// Configuração do capô (semicírculo na frente do carro)
const capoRadius = carroHeight / 1; // Ajuste do tamanho do capô
const capoVertices = createSemiCircleVertices(0.0, -0.27, capoRadius, numSegments, 0, Math.PI); // Semicírculo na frente

// 10. Configuração das janelas (semicírculos na frente do carro)
const janelaRadius = carroHeight / 1.4;
const janelaVertices = createSemiCircleVertices(-0.0, -0.25, janelaRadius, numSegments, 0, Math.PI);

// Configuração da linha de divisão entre as portas
const linhaDivisoriaVertices = createLineVertices(0.0, -0.27, carroHeight / 1.2);

// Configuração da linha na base do carro
const linhaBaseVertices = createHorizontalLineVertices(0.0, -0.46, carroWidth, 0.02); // Ajuste a posição e altura da linha

// 11. Configurações de localizações e ativa atributos
const positionLocation = gl.getAttribLocation(program, 'position');
const colorLocation = gl.getUniformLocation(program, 'color');
gl.enableVertexAttribArray(positionLocation);

// 12. Limpa a tela com uma cor de fundo
gl.clearColor(0.6, 0.9, 0.9, 0.8); // Azul claro
gl.clear(gl.COLOR_BUFFER_BIT);

drawShape(ruaVertices, [0.3, 0.3, 0.3, 1.0]); 
// 13. Desenha o capô
drawShape(capoVertices, [0.8, 0.0, 0.0, 1.0]); // Vermelho

// 14. Desenha o corpo do carro
drawShape(carroVertices, [0.8, 0.0, 0.0, 1.0]); // Vermelho

// 16. Desenha as janelas
drawShape(janelaVertices, [0.8, 0.8, 0.8, 1.0]); // Cinza claro

// 17. Desenha a linha de divisão entre as portas
drawShape(linhaDivisoriaVertices, [0.1, 0.1, 0.1, 1.0], gl.LINES); // Cinza escuro para a linha divisória

// 18. Desenha a linha na base do carro
drawShape(linhaBaseVertices, [0.1, 0.1, 0.1, 1.0]); // Cinza escuro para a linha na base

// 15. Desenha as rodas
drawShape(rodaEsquerdaVertices, [0.1, 0.1, 0.1, 1.0]); // Preto
drawShape(rodaDireitaVertices, [0.1, 0.1, 0.1, 1.0]); // Preto