/**
 * Prisma Color Utilities
 */

export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

export function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// Accessibillity - Luminance
function getLuminance(r, g, b) {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(hex1, hex2) {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 0;
    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// Palette Generation
export function generatePalettes(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    // Mono: vary lightness
    const mono = [
        { ...hsl, l: Math.max(0, hsl.l - 30) },
        { ...hsl, l: Math.max(0, hsl.l - 15) },
        hsl,
        { ...hsl, l: Math.min(100, hsl.l + 15) },
        { ...hsl, l: Math.min(100, hsl.l + 30) },
    ].map(c => rgbToHex(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b));

    // Analog: rotate hue +/- 30
    const analog = [
        { ...hsl, h: (hsl.h - 30 + 360) % 360 },
        hsl,
        { ...hsl, h: (hsl.h + 30) % 360 },
    ].map(c => rgbToHex(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b));

    // Comp: rotate hue 180
    const comp = [
        hsl,
        { ...hsl, h: (hsl.h + 180) % 360 }
    ].map(c => rgbToHex(hslToRgb(c.h, c.s, c.l).r, hslToRgb(c.h, c.s, c.l).g, hslToRgb(c.h, c.s, c.l).b));

    return { mono, analog, comp };
}
