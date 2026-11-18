export interface TargetPoint {
  x: number;
  y: number;
  z?: number;
  r: number;
  g: number;
  b: number;
  size: number;
  role: 'envelope' | 'flap' | 'envelopeFill' | 'heart' | 'name' | 'petal' | 'center' | 'stem';
  /** Optional normalized distance from shape center for staggered wave morphs */
  phase: number;
  /** Botanical growth parameters for flower sprouting & blooming */
  grow?: {
    kind: 'stem' | 'leaf' | 'center' | 'petal';
    /** Stem height progress (0 = root bottom, 1 = flower top) */
    stemProgress?: number;
    /** Attachment point on stem for leaves */
    attachX?: number;
    attachY?: number;
    /** Center normalized radius */
    centerFrac?: number;
    /** Petal radial geometry */
    petalAngle?: number;
    petalU?: number;
    petalIndex?: number;
  };
}

function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function sampleSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  count: number,
  jitter: number,
  rand: () => number,
): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const jx = (rand() - 0.5) * jitter;
    const jy = (rand() - 0.5) * jitter;
    pts.push({
      x: x1 + (x2 - x1) * t + jx,
      y: y1 + (y2 - y1) * t + jy,
    });
  }
  return pts;
}

/**
 * Generates particle targets for an elegant envelope sealed with a vivid red heart.
 */
export function sampleEnvelopeTargets(
  width: number,
  height: number,
  totalCount: number,
): TargetPoint[] {
  const rand = seededRandom(4201);
  const cx = width / 2;
  const cy = height * 0.40;

  const envW = Math.min(width * 0.72, 340);
  const envH = envW * 0.64;
  const left = cx - envW / 2;
  const right = cx + envW / 2;
  const top = cy - envH / 2;
  const bottom = cy + envH / 2;
  const flapTipY = cy + envH * 0.08;

  // Allocate ~68% to envelope structure + letter card and ~32% to the vivid red heart seal
  const heartCount = Math.round(totalCount * 0.32);
  const envCount = totalCount - heartCount;

  // Distribute envelope points across outer edges, solid V-flap, front pocket folds, and rising letter card
  const perimeterRatio = 0.36;
  const flapRatio = 0.28;
  const lowerFoldRatio = 0.15;

  const perimPts = Math.round(envCount * perimeterRatio);
  const topEdgeCount = Math.round(perimPts * 0.26);
  const bottomEdgeCount = Math.round(perimPts * 0.28);
  const leftEdgeCount = Math.round(perimPts * 0.23);
  const rightEdgeCount = perimPts - topEdgeCount - bottomEdgeCount - leftEdgeCount;

  const flapPts = Math.round(envCount * flapRatio);
  const flapEdgeTotal = Math.round(flapPts * 0.62);
  const flapLeftCount = Math.floor(flapEdgeTotal / 2);
  const flapRightCount = flapEdgeTotal - flapLeftCount;
  const flapFillCount = flapPts - flapEdgeTotal;

  const lowerPts = Math.round(envCount * lowerFoldRatio);
  const lowerLeftCount = Math.floor(lowerPts * 0.42);
  const lowerRightCount = Math.floor(lowerPts * 0.42);
  const lowerCenterCount = lowerPts - lowerLeftCount - lowerRightCount;

  const fillCount = Math.max(0, envCount - perimPts - flapPts - lowerPts);

  const rawEnvCoords: Array<{
    x: number;
    y: number;
    bright: number;
    role: 'envelope' | 'flap' | 'envelopeFill';
  }> = [];

  const pushPts = (
    pts: Array<{ x: number; y: number }>,
    bright: number,
    role: 'envelope' | 'flap' | 'envelopeFill',
  ) => {
    for (const p of pts) rawEnvCoords.push({ ...p, bright, role });
  };

  pushPts(sampleSegment(left, top, right, top, topEdgeCount, 1.8, rand), 1.0, 'envelope');
  pushPts(sampleSegment(left, bottom, right, bottom, bottomEdgeCount, 1.8, rand), 1.0, 'envelope');
  pushPts(sampleSegment(left, top, left, bottom, leftEdgeCount, 1.8, rand), 1.0, 'envelope');
  pushPts(sampleSegment(right, top, right, bottom, rightEdgeCount, 1.8, rand), 1.0, 'envelope');

  // Top triangular flap: crisp V-edges + delicate surface fill so 3D rotation looks solid and dimensional
  pushPts(sampleSegment(left, top, cx, flapTipY, flapLeftCount, 1.8, rand), 0.96, 'flap');
  pushPts(sampleSegment(right, top, cx, flapTipY, flapRightCount, 1.8, rand), 0.96, 'flap');
  for (let i = 0; i < flapFillCount; i++) {
    // Barycentric uniform sampling inside triangle (left, top) - (right, top) - (cx, flapTipY)
    let u = rand();
    let v = rand();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const w = 1 - u - v;
    const fx = u * left + v * right + w * cx;
    const fy = u * top + v * top + w * flapTipY;
    rawEnvCoords.push({ x: fx, y: fy, bright: 0.56 + rand() * 0.20, role: 'flap' });
  }

  // Lower envelope front pocket V-folds meeting cleanly under the heart seal
  const foldAnchorX = envW * 0.12;
  pushPts(
    sampleSegment(left, bottom, cx - foldAnchorX, flapTipY - envH * 0.04, lowerLeftCount, 2.0, rand),
    0.78,
    'envelope',
  );
  pushPts(
    sampleSegment(right, bottom, cx + foldAnchorX, flapTipY - envH * 0.04, lowerRightCount, 2.0, rand),
    0.78,
    'envelope',
  );
  pushPts(
    sampleSegment(cx - foldAnchorX, flapTipY - envH * 0.04, cx + foldAnchorX, flapTipY - envH * 0.04, lowerCenterCount, 1.8, rand),
    0.76,
    'envelope',
  );

  // Inner letter particles tucked cleanly inside the envelope body
  for (let i = 0; i < fillCount; i++) {
    const px = left + 14 + rand() * (envW - 28);
    const py = top + 14 + rand() * (envH - 28);
    rawEnvCoords.push({ x: px, y: py, bright: 0.42 + rand() * 0.25, role: 'envelopeFill' });
  }

  const targets: TargetPoint[] = [];

  for (const p of rawEnvCoords) {
    const isEdge = p.bright > 0.8;
    const isFlapFill = p.role === 'flap' && !isEdge;
    targets.push({
      x: p.x,
      y: p.y,
      r: isEdge ? 255 : Math.round(235 + p.bright * 20),
      g: isEdge ? Math.round(82 + rand() * 52) : Math.round(48 + p.bright * 50),
      b: isEdge ? Math.round(108 + rand() * 52) : Math.round(74 + p.bright * 48),
      size: isEdge ? 1.45 + rand() * 0.75 : isFlapFill ? 0.95 + rand() * 0.45 : 1.0 + rand() * 0.6,
      role: p.role,
      phase: Math.hypot(p.x - cx, p.y - cy) / (envW * 0.6),
    });
  }

  // Vivid Red Heart positioned as the wax seal at the flap apex
  const heartCenterX = cx;
  const heartCenterY = flapTipY - envH * 0.03;
  const heartScale = envW * 0.0115; // crisp, unmistakable red heart seal

  // 35% of heart particles trace the crisp boundary, 65% fill the heart interior
  const heartOutlineCount = Math.round(heartCount * 0.35);
  const heartFillCount = heartCount - heartOutlineCount;

  const heartPoint = (t: number, scale: number) => {
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    );
    return {
      x: heartCenterX + hx * scale,
      y: heartCenterY + hy * scale,
    };
  };

  for (let i = 0; i < heartOutlineCount; i++) {
    const t = (i / heartOutlineCount) * Math.PI * 2;
    const pt = heartPoint(t, heartScale);
    targets.push({
      x: pt.x + (rand() - 0.5) * 1.4,
      y: pt.y + (rand() - 0.5) * 1.4,
      r: 244,
      g: 42 + Math.round(rand() * 24),
      b: 72 + Math.round(rand() * 26),
      size: 1.7 + rand() * 0.9,
      role: 'heart',
      phase: 0.1 + rand() * 0.25,
    });
  }

  for (let i = 0; i < heartFillCount; i++) {
    const t = rand() * Math.PI * 2;
    // sqrt bias keeps density uniform across area
    const radial = Math.sqrt(rand()) * 0.94;
    const pt = heartPoint(t, heartScale * radial);
    // Rich ruby-to-crimson glow toward center
    const coreGlow = 1 - radial * 0.45;
    targets.push({
      x: pt.x,
      y: pt.y,
      r: Math.min(255, Math.round(220 + coreGlow * 35)),
      g: Math.round(24 + coreGlow * 45),
      b: Math.round(52 + coreGlow * 38),
      size: 1.4 + rand() * 0.95,
      role: 'heart',
      phase: radial * 0.25,
    });
  }

  return targets;
}

/**
 * Samples crisp, readable particle coordinates spelling the recipient's name (e.g., "Oydina").
 */
export function sampleNameTargets(
  name: string,
  width: number,
  height: number,
  totalCount: number,
): TargetPoint[] {
  const rand = seededRandom(8842);
  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    return sampleEnvelopeTargets(width, height, totalCount);
  }

  // Render on a clean offscreen buffer scaled to viewport
  const padW = Math.max(320, Math.floor(width));
  const padH = Math.max(240, Math.floor(height));
  offscreen.width = padW;
  offscreen.height = padH;

  // Compute responsive font size so the name breathes gracefully (~60-72% of width, max 148px)
  let fontSize = Math.min(Math.round(padW * 0.155), 148);
  fontSize = Math.max(fontSize, 46);

  const fontSpec = (sz: number) =>
    `300 ${sz}px "Cormorant Garamond", "Playfair Display", Georgia, serif`;

  ctx.font = fontSpec(fontSize);
  let measured = ctx.measureText(name).width;
  const maxAllowedW = padW * 0.76;
  if (measured > maxAllowedW) {
    fontSize = Math.floor(fontSize * (maxAllowedW / measured));
    ctx.font = fontSpec(fontSize);
    measured = ctx.measureText(name).width;
  }

  ctx.clearRect(0, 0, padW, padH);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textY = padH * 0.47;
  ctx.fillText(name, padW / 2, textY);

  const imgData = ctx.getImageData(0, 0, padW, padH).data;

  // Scan tight bounding box around text for fast sampling
  const minX = Math.max(0, Math.floor(padW / 2 - measured * 0.56));
  const maxX = Math.min(padW - 1, Math.ceil(padW / 2 + measured * 0.56));
  const minY = Math.max(0, Math.floor(textY - fontSize * 0.85));
  const maxY = Math.min(padH - 1, Math.ceil(textY + fontSize * 0.85));

  const litPixels: Array<{ x: number; y: number; alpha: number }> = [];
  const step = 1;

  for (let y = minY; y <= maxY; y += step) {
    for (let x = minX; x <= maxX; x += step) {
      const a = imgData[(y * padW + x) * 4 + 3];
      // High alpha threshold keeps glyph strokes crisp and slender without edge bloat
      if (a > 128) {
        litPixels.push({ x, y, alpha: a / 255 });
      }
    }
  }

  if (litPixels.length === 0) {
    return sampleEnvelopeTargets(width, height, totalCount);
  }

  // Shuffle litPixels deterministically so sampling covers every letter evenly
  for (let i = litPixels.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = litPixels[i];
    litPixels[i] = litPixels[j];
    litPixels[j] = tmp;
  }

  const targets: TargetPoint[] = [];
  const cx = padW / 2;
  const halfSpan = Math.max(1, measured / 2);

  for (let i = 0; i < totalCount; i++) {
    const src = litPixels[i % litPixels.length];
    const px = src.x + (rand() - 0.5) * 0.38;
    const py = src.y + (rand() - 0.5) * 0.38;

    // Luminous glowing crimson-to-rose-red gradient across slender name strokes
    const t = Math.max(0, Math.min(1, (px - (cx - halfSpan)) / (halfSpan * 2)));
    const arcBoost = Math.sin(t * Math.PI);
    const r = 255;
    const g = Math.round(46 + arcBoost * 48 + rand() * 24);
    const b = Math.round(68 + arcBoost * 44 + rand() * 24);

    targets.push({
      x: px,
      y: py,
      r,
      g,
      b,
      size: 0.78 + rand() * 0.46,
      role: 'name',
      phase: t,
    });
  }

  return targets;
}

export function getLilyMetrics(width: number, height: number) {
  const cx = width / 2;
  const scale = Math.min(width * 0.35, height * 0.27, 182);
  const flowerCY = height * 0.34;
  const throatRadius = scale * 0.085;
  const stemStartY = flowerCY + scale * 0.08;
  const stemEndY = flowerCY + scale * 1.24;
  const pivotY = flowerCY + scale * 1.12;
  return { cx, scale, flowerCY, throatRadius, stemStartY, stemEndY, pivotY };
}

/**
 * Generates botanical particle targets for an unmistakable 3D Oriental/Royal Lily
 * with 6 alternating recurved pointed tepals (3 outer + 3 inner) with luminous nectar throat,
 * delicate blush-rose shading & speckles, 6 long arching stamens with golden-amber anthers,
 * a central emerald-tipped pistil, and a sleek S-curved stem with lanceolate lily leaves.
 */
export function sampleLilyTargets(
  width: number,
  height: number,
  totalCount: number,
): TargetPoint[] {
  const rand = seededRandom(9917);
  const { cx, scale, flowerCY, throatRadius, stemStartY, stemEndY } = getLilyMetrics(
    width,
    height,
  );

  const centerTotal = Math.round(totalCount * 0.20);
  const stemCount = Math.round(totalCount * 0.21);
  const petalCountTotal = totalCount - centerTotal - stemCount;

  const targets: TargetPoint[] = [];

  // 1. 6 iconic recurved pointed lily tepals (3 outer sepals + 3 inner slightly wider petals)
  const numPetals = 6;
  const perPetal = Math.floor(petalCountTotal / numPetals);
  const remainder = petalCountTotal - perPetal * numPetals;
  const orientationOffset = 0.14; // organic slight tilt off vertical

  for (let pIdx = 0; pIdx < numPetals; pIdx++) {
    const isInner = pIdx % 2 === 1;
    const angle = (pIdx / numPetals) * Math.PI * 2 - Math.PI / 2 + orientationOffset;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    const perpX = -sinA;
    const perpY = cosA;

    const petalLen = scale * (isInner ? 0.78 : 0.80) * (0.97 + rand() * 0.06);
    const petalHalfW = scale * (isInner ? 0.225 : 0.195);
    const startDist = throatRadius * 0.35;
    const countForThis = perPetal + (pIdx < remainder ? 1 : 0);

    const rimCount = Math.round(countForThis * 0.24);
    const midribCount = Math.round(countForThis * 0.11);

    for (let i = 0; i < countForThis; i++) {
      let u: number;
      let latNorm: number;
      let isEdge = false;
      let isMidrib = false;

      if (i < rimCount) {
        isEdge = true;
        const tEdge = i / Math.max(1, rimCount - 1);
        u = Math.pow(tEdge, 0.92);
        latNorm = i % 2 === 0 ? 1 : -1;
      } else if (i < rimCount + midribCount) {
        isMidrib = true;
        u = (i - rimCount) / Math.max(1, midribCount - 1);
        latNorm = (rand() - 0.5) * 0.08;
      } else {
        u = 0.02 + rand() * 0.97;
        const rawLat = rand() * 2 - 1;
        // Slightly denser near center-blade for silky petal luster
        latNorm = Math.sign(rawLat) * Math.pow(Math.abs(rawLat), 0.92) * 0.96;
      }

      // Authentic lanceolate-acuminate lily tepal silhouette:
      // Narrow nectar claw at throat -> full sweeping belly around u=0.38 -> pointed tip at u=1
      const belly = Math.pow(Math.sin(Math.pow(u, 0.68) * Math.PI), 0.72);
      const claw = 0.13 * (1 - u);
      const tipPinch = u > 0.75 ? Math.pow((1 - u) / 0.25, 0.78) : 1;
      const ruffle = isEdge ? Math.sin(u * Math.PI * 4.0) * 0.065 * Math.sin(u * Math.PI) : 0;
      const widthAtU = petalHalfW * Math.max(0.015, (claw + belly * 0.94) * tipPinch + ruffle);
      const lateral = latNorm * widthAtU;

      // Radial trumpet flare: hugs steep upward chalice near throat, flares broadly outward toward tip
      const radialFlare = Math.pow(u, 0.86) * petalLen;
      const dist = startDist + radialFlare;

      // Subtle graceful lateral sweep
      const gentleCurve = Math.sin(u * Math.PI) * (isInner ? 2.0 : -2.0);
      const px = cx + cosA * dist + perpX * (lateral + gentleCurve) + (rand() - 0.5) * 0.5;
      const py = flowerCY + sinA * dist + perpY * (lateral + gentleCurve) + (rand() - 0.5) * 0.5;

      // Deep 3D trumpet chalice curving forward (+z) and then gracefully recurving back at pointed tips
      const throatBaseZ = -scale * 0.16 + (isInner ? 3.5 : 0);
      const trumpetForward = Math.sin(Math.min(1, u * 1.18) * Math.PI * 0.62) * scale * 0.36;
      const tipRecurve =
        u > 0.52 ? Math.pow((u - 0.52) / 0.48, 1.75) * scale * 0.22 : 0;
      // Cupped trough cross-section + crisp midrib keel
      const cupFold = -Math.pow(Math.abs(latNorm), 1.45) * scale * 0.055 * Math.sin(u * Math.PI);
      const midribGroove = -Math.exp(-Math.pow(latNorm / 0.16, 2)) * scale * 0.025 * (1 - u * 0.5);
      const edgeWaveZ = Math.sin(u * Math.PI * 5.0) * Math.pow(Math.abs(latNorm), 2) * 2.4;

      const pz =
        throatBaseZ +
        trumpetForward -
        tipRecurve +
        cupFold +
        midribGroove +
        edgeWaveZ +
        (rand() - 0.5) * 0.7;

      // Coloring: chartreuse nectar throat -> blush-rose silk center -> pure moonlight pearl-white rims/tips
      let r: number;
      let g: number;
      let b: number;
      let dotSize = isEdge ? 1.12 + rand() * 0.4 : isMidrib ? 1.05 + rand() * 0.35 : 0.96 + rand() * 0.48;

      if (u < 0.15) {
        // Glowing emerald-chartreuse nectar throat
        const throatT = u / 0.15;
        r = Math.round(182 + throatT * 70);
        g = Math.round(234 + throatT * 12);
        b = Math.round(126 + throatT * 105);
      } else {
        // Soft rose-blush inner center fading cleanly to luminous pearl-white margins & tips
        const centerBand = Math.max(0, 1 - Math.abs(latNorm) * 1.35) * Math.sin(Math.min(1, (u - 0.12) / 0.76) * Math.PI);
        const isSpeckle =
          !isEdge &&
          !isMidrib &&
          u > 0.16 &&
          u < 0.56 &&
          Math.abs(latNorm) < 0.56 &&
          rand() < 0.085;

        if (isSpeckle) {
          // Characteristic Oriental lily crimson-rose nectar papillae speckles
          r = Math.round(236 + rand() * 19);
          g = Math.round(46 + rand() * 42);
          b = Math.round(98 + rand() * 44);
          dotSize = 1.25 + rand() * 0.45;
        } else if (isEdge) {
          r = 255;
          g = Math.round(248 + rand() * 7);
          b = Math.round(250 + rand() * 5);
        } else {
          r = 255;
          g = Math.round(250 - centerBand * 48 + rand() * 5);
          b = Math.round(252 - centerBand * 28 + rand() * 3);
        }
      }

      targets.push({
        x: px,
        y: py,
        z: pz,
        r,
        g,
        b,
        size: dotSize,
        role: 'petal',
        phase: 0.15 + u * 0.7,
        grow: {
          kind: 'petal',
          petalAngle: angle,
          petalU: u,
          petalIndex: pIdx,
        },
      });
    }
  }

  // 2. 6 long arching stamens with plump golden-amber anthers + 1 central emerald pistil + calyx base
  const pistilCount = Math.round(centerTotal * 0.18);
  const receptacleCount = Math.round(centerTotal * 0.12);
  const stamenTotal = centerTotal - pistilCount - receptacleCount;
  const perStamen = Math.floor(stamenTotal / numPetals);
  const stamenRem = stamenTotal - perStamen * numPetals;

  // 2a. Central Pistil (slender emerald style protruding out to +z with 3-lobed glowing stigma)
  const stigmaCount = Math.round(pistilCount * 0.38);
  const styleCount = pistilCount - stigmaCount;

  for (let i = 0; i < styleCount; i++) {
    const t = i / Math.max(1, styleCount - 1);
    const cylA = rand() * Math.PI * 2;
    const rad = (1.6 - t * 0.3) * rand();
    // Style curves gently upward and forward out of the deep throat
    const sx = cx + Math.cos(cylA) * rad;
    const sy = flowerCY - Math.pow(t, 1.4) * scale * 0.06 + Math.sin(cylA) * rad;
    const sz = -scale * 0.15 + t * scale * 0.54;

    targets.push({
      x: sx,
      y: sy,
      z: sz,
      r: Math.round(166 + t * 44),
      g: Math.round(228 + t * 18),
      b: Math.round(138 + t * 52),
      size: 1.05 + rand() * 0.35,
      role: 'center',
      phase: t * 0.35,
      grow: {
        kind: 'center',
        centerFrac: t,
      },
    });
  }

  for (let i = 0; i < stigmaCount; i++) {
    const lobe = i % 3;
    const lobeA = (lobe / 3) * Math.PI * 2 - Math.PI / 2;
    const u = rand();
    const spread = scale * 0.032 * Math.sqrt(u);
    const sx = cx + Math.cos(lobeA) * spread + (rand() - 0.5) * 1.4;
    const sy = flowerCY - scale * 0.06 + Math.sin(lobeA) * spread + (rand() - 0.5) * 1.4;
    const sz = scale * 0.39 + (rand() - 0.5) * 3.5;

    targets.push({
      x: sx,
      y: sy,
      z: sz,
      r: Math.round(212 + rand() * 35),
      g: Math.round(244 + rand() * 11),
      b: Math.round(168 + rand() * 44),
      size: 1.2 + rand() * 0.45,
      role: 'center',
      phase: 0.36 + u * 0.12,
      grow: {
        kind: 'center',
        centerFrac: 0.95,
      },
    });
  }

  // 2b. 6 Arching Filaments & Plump Golden-Amber Anthers
  for (let sIdx = 0; sIdx < numPetals; sIdx++) {
    const sAngle = (sIdx / numPetals) * Math.PI * 2 - Math.PI / 2 + orientationOffset + 0.08;
    const cosS = Math.cos(sAngle);
    const sinS = Math.sin(sAngle);
    const perpSX = -sinS;
    const perpSY = cosS;

    const countForThis = perStamen + (sIdx < stamenRem ? 1 : 0);
    const antherCount = Math.round(countForThis * 0.52);
    const filamentCount = countForThis - antherCount;

    const tipRadial = scale * 0.255;
    const tipZ = scale * 0.335;

    for (let i = 0; i < filamentCount; i++) {
      const t = i / Math.max(1, filamentCount - 1);
      // Graceful outward-and-forward arc from deep throat
      const rOut = Math.pow(t, 1.15) * tipRadial;
      const fx = cx + cosS * rOut + (rand() - 0.5) * 1.1;
      const fy = flowerCY + sinS * rOut + (rand() - 0.5) * 1.1;
      const fz = -scale * 0.14 + Math.sin(t * Math.PI * 0.52) * (tipZ + scale * 0.14);

      targets.push({
        x: fx,
        y: fy,
        z: fz,
        r: Math.round(218 + t * 32),
        g: Math.round(238 + t * 8),
        b: Math.round(182 + t * 28),
        size: 0.95 + rand() * 0.35,
        role: 'center',
        phase: t * 0.4,
        grow: {
          kind: 'center',
          centerFrac: t * 0.85,
        },
      });
    }

    // Plump T-shaped versatile anther packed with golden-saffron / burnt-amber pollen
    const antherCenterX = cx + cosS * tipRadial;
    const antherCenterY = flowerCY + sinS * tipRadial;
    const antherHalfLen = scale * 0.058;
    const antherRadius = scale * 0.017;

    for (let i = 0; i < antherCount; i++) {
      const along = (rand() * 2 - 1) * antherHalfLen;
      const theta = rand() * Math.PI * 2;
      const rad = Math.sqrt(rand()) * antherRadius * Math.sqrt(Math.max(0.15, 1 - Math.pow(along / antherHalfLen, 2)));
      // Anther lies tangential + slightly tilted toward the viewer
      const ax = antherCenterX + perpSX * along + cosS * Math.cos(theta) * rad;
      const ay = antherCenterY + perpSY * along + sinS * Math.cos(theta) * rad;
      const az = tipZ + Math.sin(theta) * rad + along * 0.16;

      const glow = 0.65 + 0.35 * Math.sin(theta);
      targets.push({
        x: ax,
        y: ay,
        z: az,
        r: Math.min(255, Math.round(238 + glow * 17)),
        g: Math.round(126 + glow * 58),
        b: Math.round(22 + glow * 34),
        size: 1.2 + rand() * 0.48,
        role: 'center',
        phase: 0.35 + rand() * 0.15,
        grow: {
          kind: 'center',
          centerFrac: 0.92,
        },
      });
    }
  }

  // 2c. Emerald calyx / receptacle cup tucked neatly behind the lily throat
  for (let i = 0; i < receptacleCount; i++) {
    const u = rand();
    const ang = rand() * Math.PI * 2;
    const rad = (1 - u * 0.6) * scale * 0.075;
    const rx = cx + Math.cos(ang) * rad;
    const ry = flowerCY + u * scale * 0.11 + Math.sin(ang) * rad * 0.5;
    const rz = -scale * (0.17 + u * 0.09);

    targets.push({
      x: rx,
      y: ry,
      z: rz,
      r: Math.round(78 + rand() * 28),
      g: Math.round(168 + rand() * 38),
      b: Math.round(86 + rand() * 26),
      size: 1.0 + rand() * 0.38,
      role: 'center',
      phase: 0.25 + u * 0.2,
      grow: {
        kind: 'center',
        centerFrac: 0.2 + u * 0.3,
      },
    });
  }

  // 3. Sturdy 3D botanical S-curved lily stem & sleek alternate lanceolate lily leaves
  const stemMainCount = Math.round(stemCount * 0.42);
  const leafParticles = stemCount - stemMainCount;

  for (let i = 0; i < stemMainCount; i++) {
    const t = i / Math.max(1, stemMainCount - 1);
    const curveX = cx + Math.sin(t * Math.PI * 1.1) * (scale * 0.068);
    const py = stemStartY + t * (stemEndY - stemStartY);
    const cylAngle = rand() * Math.PI * 2;
    const cylRad = (2.8 - t * 0.35) * (0.45 + rand() * 0.55);
    const px = curveX + Math.cos(cylAngle) * cylRad;
    const pz = -scale * 0.21 - Math.sin(t * Math.PI) * 12 + Math.sin(cylAngle) * cylRad;
    const frontLight = 0.5 + 0.5 * Math.sin(cylAngle);

    targets.push({
      x: px,
      y: py + (rand() - 0.5) * 0.7,
      z: pz,
      r: Math.round(74 + frontLight * 36),
      g: Math.round(168 + frontLight * 52),
      b: Math.round(86 + frontLight * 34),
      size: 1.05 + frontLight * 0.4,
      role: 'stem',
      phase: 0.45 + t * 0.45,
      grow: {
        kind: 'stem',
        stemProgress: 1 - t,
      },
    });
  }

  // 5 Sleek, pointed lanceolate lily leaves spiraled along the stem
  const lilyLeaves = [
    { tBase: 0.24, dir: -1, len: scale * 0.42, angle: -0.48, zDir: 0.75, width: scale * 0.072 },
    { tBase: 0.39, dir: 1, len: scale * 0.46, angle: -0.42, zDir: -0.65, width: scale * 0.078 },
    { tBase: 0.55, dir: -1, len: scale * 0.44, angle: -0.35, zDir: -0.55, width: scale * 0.076 },
    { tBase: 0.71, dir: 1, len: scale * 0.38, angle: -0.30, zDir: 0.80, width: scale * 0.068 },
    { tBase: 0.85, dir: -1, len: scale * 0.31, angle: -0.24, zDir: 0.55, width: scale * 0.058 },
  ];
  const perLeaf = Math.floor(leafParticles / lilyLeaves.length);

  lilyLeaves.forEach((lf, lIdx) => {
    const count =
      lIdx === lilyLeaves.length - 1
        ? leafParticles - perLeaf * (lilyLeaves.length - 1)
        : perLeaf;
    const baseX = cx + Math.sin(lf.tBase * Math.PI * 1.1) * (scale * 0.068);
    const baseY = stemStartY + lf.tBase * (stemEndY - stemStartY);
    const baseZ = -scale * 0.21 - Math.sin(lf.tBase * Math.PI) * 12;
    const spineAngle = lf.dir === 1 ? lf.angle : Math.PI - lf.angle;
    const cosL = Math.cos(spineAngle);
    const sinL = Math.sin(spineAngle);
    const perpLX = -sinL;
    const perpLY = cosL;
    const edgeCount = Math.round(count * 0.26);

    for (let i = 0; i < count; i++) {
      let u: number;
      let latNorm: number;
      const isEdge = i < edgeCount;

      if (isEdge) {
        u = i / Math.max(1, edgeCount - 1);
        latNorm = i % 2 === 0 ? 1 : -1;
      } else {
        u = 0.03 + rand() * 0.95;
        latNorm = rand() * 2 - 1;
      }

      // Lanceolate leaf profile: narrow clasp at stem -> swells around u=0.35 -> sharp pointed apex
      const leafProfile = Math.pow(Math.sin(Math.pow(u, 0.74) * Math.PI), 0.78);
      const halfW = lf.width * leafProfile;
      const lateral = latNorm * halfW;

      // Graceful botanical arch & tip droop
      const droop = Math.pow(u, 1.85) * (scale * 0.12);
      const px = baseX + cosL * (u * lf.len) + perpLX * lateral;
      const py = baseY + sinL * (u * lf.len) + droop + perpLY * lateral;
      const pz = baseZ + lf.zDir * u * (scale * 0.14) - Math.pow(Math.abs(latNorm), 1.6) * 2.5;

      const midribGlow = Math.exp(-Math.pow(latNorm / 0.28, 2));
      const shade = 0.84 + rand() * 0.22 + midribGlow * 0.14;

      targets.push({
        x: px + (rand() - 0.5) * 0.45,
        y: py + (rand() - 0.5) * 0.45,
        z: pz + (rand() - 0.5) * 0.65,
        r: Math.min(255, Math.round(82 * shade + rand() * 18)),
        g: Math.min(255, Math.round(188 * shade + rand() * 24)),
        b: Math.min(255, Math.round(98 * shade + rand() * 18)),
        size: isEdge ? 1.0 + rand() * 0.32 : 0.88 + rand() * 0.36,
        role: 'stem',
        phase: 0.52 + u * 0.42,
        grow: {
          kind: 'leaf',
          stemProgress: 1 - lf.tBase,
          attachX: baseX,
          attachY: baseY,
        },
      });
    }
  });

  return targets;
}




