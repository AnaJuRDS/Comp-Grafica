// Seleciona o elemento Canvas e obtém o contexto WebGL
const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    throw new Error('WebGL não suportado');
}

// Configuração do viewport e fundo preto
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0, 0, 0, 1);

// Shaders para desenhar o círculo e o traço lateral
const vertexShaderGLSL = `
attribute vec2 position;
uniform vec2 resolution;
uniform mat4 transform;
void main() {
    vec2 pos = (transform * vec4(position, 0, 1)).xy;
    vec2 normalizedPos = pos / resolution * 2.0 - 1.0;
    gl_Position = vec4(normalizedPos * vec2(1, -1), 0.0, 1.0);
}
`;

const fragmentShaderGLSL = `
precision mediump float;
uniform vec4 color;
void main() {
    gl_FragColor = color;
}
`;

// Funções para compilar shaders e criar o programa WebGL
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderGLSL);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderGLSL);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Localizações de variáveis uniformes
const colorLocation = gl.getUniformLocation(program, "color");
const resolutionLocation = gl.getUniformLocation(program, "resolution");
const transformLocation = gl.getUniformLocation(program, "transform");
gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

// Buffer de posição para o retângulo
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
const positionLocation = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

function setRectangle(gl, x, y, width, height) {
    const x1 = x, y1 = y;
    const x2 = x + width, y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1, y1, x2, y1, x1, y2, 
        x1, y2, x2, y1, x2, y2
    ]), gl.STATIC_DRAW);
}

// Função de criação de matriz de transformação de translação
function translationMatrix(x, y) {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        x, y, 0, 1,
    ];
}

// Definição da bolinha e do traço lateral
const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: 10, dx: 2, dy: 2 };
const paddle = { width: 10, height: 100, x: canvas.width - 20, y: canvas.height / 2 - 50 };
let mouseY = canvas.height / 2;

// Funções para desenhar a bolinha e o traço lateral usando transformações
function drawCircle(x, y, radius, color) {
    gl.uniform4f(colorLocation, ...color);
    setRectangle(gl, -radius, -radius, radius * 2, radius * 2);
    gl.uniformMatrix4fv(transformLocation, false, new Float32Array(translationMatrix(x, y)));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawRect(x, y, width, height, color) {
    gl.uniform4f(colorLocation, ...color);
    setRectangle(gl, 0, 0, width, height);
    gl.uniformMatrix4fv(transformLocation, false, new Float32Array(translationMatrix(x, y)));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Função de loop do jogo
function gameLoop() {
    gl.clear(gl.COLOR_BUFFER_BIT); // Limpa a tela

    // Atualiza a posição da bolinha
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Rebater na borda superior e inferior
    if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= canvas.height) {
        ball.dy = -ball.dy;
    }

    // Rebater na "raquete" à direita
    if (ball.x + ball.radius >= paddle.x &&
        ball.y >= paddle.y && ball.y <= paddle.y + paddle.height) {
        ball.dx = -ball.dx;
    }

    // Se a bolinha sair pela esquerda, reiniciar no centro
    if (ball.x - ball.radius <= 0) {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.dx = 2;
        ball.dy = 2;
    }

    // Atualiza a posição da raquete para seguir o mouse e mantém dentro dos limites
    paddle.y = Math.min(Math.max(mouseY - paddle.height / 2, 0), canvas.height - paddle.height);

    // Desenha a bolinha e o traço lateral com as transformações
    drawCircle(ball.x, ball.y, ball.radius, [1, 0, 0, 1]);
    drawRect(paddle.x, paddle.y, paddle.width, paddle.height, [0, 0, 1, 1]);

    requestAnimationFrame(gameLoop); // Loop de animação
}

// Evento de movimento do mouse
canvas.addEventListener('mousemove', (e) => {
    mouseY = e.clientY - canvas.offsetTop;
});

// Inicia o loop do jogo
gameLoop();
