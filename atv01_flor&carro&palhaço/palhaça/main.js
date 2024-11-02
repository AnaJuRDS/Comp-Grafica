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
    gl_FragColor = color;
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

function createMouthVertices(centerX, centerY, radius, numSegments) {
  const positions = [];
  for (let i = 0; i <= numSegments; i++) {
    const angle = Math.PI * (i / numSegments) + Math.PI; // Desenhar a parte inferior do arco
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle) + 0.1; // Deslocar para baixo
    positions.push(x, y);
  }
  return positions;
}

// Função para desenhar um círculo com segmentos
function createCircleVertices(centerX, centerY, radius, numSegments) {
    const positions = [centerX, centerY];
    for (let i = 0; i <= numSegments; i++) {
        const angle = i * 2 * Math.PI / numSegments;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions.push(x, y);
    }
    return positions;
}

// Função para desenhar um triângulo
function createTriangleVertices(x, y, size) {
    return [
        x, y + size,
        x - size, y - size,
        x + size, y - size
    ];
}

// Função para desenhar um triângulo (invertido)
function createUpsideDownTriangleVertices(x, y, size) {
  return [
      x - size, y + size, // Ponto esquerdo (parte reta para cima)
      x + size, y + size, // Ponto direito (parte reta para cima)
      x, y - size         // Ponto inferior (ponta para baixo)
  ];
}

// 5. Função para desenhar uma forma
function drawShape(vertices, color, mode = gl.TRIANGLE_FAN) {
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.uniform4f(colorLocation, color[0], color[1], color[2], color[3]);
    gl.drawArrays(mode, 0, vertices.length / 2);
}

// 6. Configurações do rosto do palhaço
const faceRadius = 0.4;
const faceVertices = createCircleVertices(0.0, 0.0, faceRadius, 50); 

// Configurações da boca do palhaço
const mouthRadius = 0.18; // Raio do arco da boca
const mouthVertices = createMouthVertices(0.0, -0.25, mouthRadius, 50);

// Configurações da boca do palhaço
const mouthRadiusinf = 0.10; // Raio do arco da boca
const mouthVerticesinf = createMouthVertices(0.0, -0.28, mouthRadiusinf, 50);

// Configurações das bochechas do palhaço
const cheekRadius = 0.1;
const leftCheekVertices = createCircleVertices(-0.2, -0.1, cheekRadius, 50);
const rightCheekVertices = createCircleVertices(0.2, -0.1, cheekRadius, 50);

// Configurações das olhos do palhaço
const eyesRadius = 0.05;
const leftEyeVertices = createCircleVertices(-0.15, 0.15, eyesRadius, 50);
const rightEyeVertices = createCircleVertices(0.15, 0.15, eyesRadius, 50);

// Configuração do nariz do palhaço
const noseRadius = 0.12;
const noseVertices = createCircleVertices(0.0, 0.0, noseRadius, 50);

// Configuração das marcas dos olhos
const marcRadius = 0.07;
const leftMarcVertices = createTriangleVertices(-0.15, 0.25, marcRadius);
const rightMarcVertices = createTriangleVertices(0.15, 0.25, marcRadius);

const marcupdownRadius = 0.07;
const leftMarcupdownVertices = createUpsideDownTriangleVertices(-0.15, 0.05, marcupdownRadius);
const rightMarcupdownVertices = createUpsideDownTriangleVertices(0.15, 0.05, marcupdownRadius);

// 7. Configuração do cabelo
const hairRadius = 0.15;
const hairVertices = []; // Array para armazenar os vértices dos círculos de cabelo

// Adicionando mais círculos de cabelo ao redor da cabeça
hairVertices.push(createCircleVertices(-0.4, 0.1, hairRadius, 50)); // Esquerda
hairVertices.push(createCircleVertices(0.4, 0.1, hairRadius, 50));  // Direita
hairVertices.push(createCircleVertices(-0.3, 0.2, hairRadius, 50)); // Topo esquerda
hairVertices.push(createCircleVertices(0.3, 0.2, hairRadius, 50));  // Topo direita
// Círculos extras ao redor para completar o cabelo
hairVertices.push(createCircleVertices(-0.2, 0.3, hairRadius, 50)); // Mais à esquerda
hairVertices.push(createCircleVertices(0.2, 0.3, hairRadius, 50));  // Mais à direita
hairVertices.push(createCircleVertices(-0.1, 0.35, hairRadius, 50)); // Superior esquerda
hairVertices.push(createCircleVertices(0.1, 0.35, hairRadius, 50));  // Superior direita
// Ajuste na posição para cobrir a parte inferior e ao redor
hairVertices.push(createCircleVertices(-0.4, -0.1, hairRadius, 50)); // Inferior esquerda
hairVertices.push(createCircleVertices(0.4, -0.1, hairRadius, 50));  // Inferior direita
hairVertices.push(createCircleVertices(-0.4, -0.3, hairRadius, 50)); // Inferior esquerda mais central
hairVertices.push(createCircleVertices(0.4, -0.3, hairRadius, 50));  // Inferior direita mais central
// Ajuste na posição para cobrir a parte inferior e ao redor
hairVertices.push(createCircleVertices(-0.4, -0.45, hairRadius, 50)); // Inferior esquerda
hairVertices.push(createCircleVertices(0.4, -0.45, hairRadius, 50));  // Inferior direita
hairVertices.push(createCircleVertices(-0.4, -0.6, hairRadius, 50)); // Inferior esquerda mais central
hairVertices.push(createCircleVertices(0.4, -0.6, hairRadius, 50));  // Inferior direita mais central

// 8. Configurações de localizações e ativa atributos
const positionLocation = gl.getAttribLocation(program, 'position');
const colorLocation = gl.getUniformLocation(program, 'color');
gl.enableVertexAttribArray(positionLocation);

// 9. Limpa a tela com uma cor de fundo
gl.clearColor(1.0, 1.0, 0.0, 1.0); // Fundo azul claro
gl.clear(gl.COLOR_BUFFER_BIT);

// 14. Renderização dos vértices do cabelo
hairVertices.forEach(vertices => {
  drawShape(vertices, [1.0, 0.0, 0.5, 1.0]); // Cor do cabelo (rosa)
});

// 10. Desenha o rosto do palhaço
drawShape(faceVertices, [0.9, 0.9, 0.9, 0.9]); // Branco

// 11. Desenha as bochechas
drawShape(leftCheekVertices, [1.0, 0.6, 0.6, 0.7]); // Rosado
drawShape(rightCheekVertices, [1.0, 0.6, 0.6, 0.7]); // Rosado

// 11. Desenha as marcas do olho
drawShape(leftMarcVertices, [0.0, 0.0, 1.0, 1.0]); // Azul 
drawShape(rightMarcVertices, [1.0, 0.5, 0.0, 1.0]); // Laranja
drawShape(leftMarcupdownVertices, [0.5, 0.8, 0.5, 1.0]); // Azul 
drawShape(rightMarcupdownVertices, [0.8, 0.5, 0.8, 1.0]); // Laranja

// 12. Desenha o nariz
drawShape(noseVertices, [1.0, 0.0, 0.0, 1.0]); // Vermelho

// 13. Desenha os olhos
drawShape(leftEyeVertices, [0.0, 0.0, 0.0, 1.0]); // Preto
drawShape(rightEyeVertices, [0.0, 0.0, 0.0, 1.0]);

drawShape(mouthVertices, [1.0, 0.0, 0.0, 1.0]); // Cor da boca (vermelho)
drawShape(mouthVerticesinf, [1.0, 1.0, 1.0, 1.0]); // Cor da boca interna (Branco)


