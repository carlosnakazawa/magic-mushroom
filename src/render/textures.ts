import * as THREE from 'three';

/** Texturas desenhadas em canvas — o jogo não depende de arquivos de imagem. */

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, repeat = 1): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = 8;
  return tex;
}

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Assoalho de tábuas de madeira mel (salão). */
export function woodFloor(): THREE.CanvasTexture {
  return canvasTexture(512, (ctx, s) => {
    const r = rand(7);
    const planks = 8;
    const h = s / planks;
    for (let i = 0; i < planks; i++) {
      const base = 30 + r() * 8;
      ctx.fillStyle = `hsl(${base}, 55%, ${58 + r() * 8}%)`;
      ctx.fillRect(0, i * h, s, h);
      // veios
      for (let k = 0; k < 14; k++) {
        ctx.strokeStyle = `hsla(${base - 5}, 50%, 40%, ${0.08 + r() * 0.1})`;
        ctx.lineWidth = 1 + r() * 2;
        ctx.beginPath();
        const y = i * h + r() * h;
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(s * 0.3, y + (r() - 0.5) * 8, s * 0.7, y + (r() - 0.5) * 8, s, y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(80,45,20,0.45)';
      ctx.fillRect(0, i * h, s, 3);
      const cut = r() * s;
      ctx.fillRect(cut, i * h, 3, h);
    }
  });
}

/** Piso de cozinha xadrez creme/menta. */
export function kitchenTiles(): THREE.CanvasTexture {
  return canvasTexture(256, (ctx, s) => {
    const n = 4;
    const t = s / n;
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#fff4e0' : '#bfe6d2';
        ctx.fillRect(x * t, y * t, t, t);
        ctx.strokeStyle = 'rgba(120,100,80,0.25)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x * t, y * t, t, t);
      }
  });
}

/** Grama com florzinhas para o lado de fora. */
export function grass(): THREE.CanvasTexture {
  return canvasTexture(
    512,
    (ctx, s) => {
      const r = rand(3);
      ctx.fillStyle = '#6fbf73';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 2500; i++) {
        ctx.fillStyle = `hsla(${95 + r() * 40}, 50%, ${35 + r() * 25}%, 0.5)`;
        ctx.fillRect(r() * s, r() * s, 2, 5 + r() * 5);
      }
      const colors = ['#fff6a8', '#ffc4e1', '#ffffff', '#c9b6ff'];
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = colors[Math.floor(r() * colors.length)]!;
        ctx.beginPath();
        ctx.arc(r() * s, r() * s, 2 + r() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    10,
  );
}

/** Papel de parede listrado com cogumelinhos. */
export function wallpaper(): THREE.CanvasTexture {
  return canvasTexture(256, (ctx, s) => {
    ctx.fillStyle = '#ffe9d2';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#ffd9bd';
    for (let x = 0; x < s; x += 32) ctx.fillRect(x, 0, 16, s);
    ctx.fillStyle = '#ff9b8a';
    for (let i = 0; i < 4; i++) {
      const x = 24 + (i % 2) * 128 + 40;
      const y = 40 + i * 60;
      ctx.beginPath();
      ctx.arc(x, y, 12, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(x - 4, y, 8, 10);
      ctx.fillStyle = '#ff9b8a';
    }
  });
}

/** Textura radial suave para partículas/brilhos. */
export function softDot(): THREE.CanvasTexture {
  return canvasTexture(64, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.8)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });
}

/** Estrela de 4 pontas brilhante. */
export function sparkle(): THREE.CanvasTexture {
  return canvasTexture(64, (ctx, s) => {
    const c = s / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,255,255,0.6)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(c, 0);
    ctx.quadraticCurveTo(c, c, s, c);
    ctx.quadraticCurveTo(c, c, c, s);
    ctx.quadraticCurveTo(c, c, 0, c);
    ctx.quadraticCurveTo(c, c, c, 0);
    ctx.fill();
  });
}

/** Coração. */
export function heart(): THREE.CanvasTexture {
  return canvasTexture(64, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(32, 54);
    ctx.bezierCurveTo(4, 36, 6, 10, 22, 10);
    ctx.bezierCurveTo(28, 10, 32, 16, 32, 20);
    ctx.bezierCurveTo(32, 16, 36, 10, 42, 10);
    ctx.bezierCurveTo(58, 10, 60, 36, 32, 54);
    ctx.fill();
  });
}

/** Folhinha. */
export function leaf(): THREE.CanvasTexture {
  return canvasTexture(64, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(8, 56);
    ctx.quadraticCurveTo(8, 8, 56, 8);
    ctx.quadraticCurveTo(56, 56, 8, 56);
    ctx.fill();
  });
}
