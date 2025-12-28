/**
 * Prisma Color Math Utilities
 * Handles all color conversions, WCAG analysis, and Palette generation.
 */

export class ColorMath {

    // --- Conversions ---

    static hexToRgb(hex) {
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    static rgbToHsl(r, g, b) {
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
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    static hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return {
            r: Math.round(f(0) * 255),
            g: Math.round(f(8) * 255),
            b: Math.round(f(4) * 255)
        };
    }

    static anyToHex(color) {
        // Basic implementation, can be expanded
        if (!color) return '#000000';
        if (color.startsWith('#')) return color;
        if (color.startsWith('rgb')) {
            const vals = color.match(/\d+/g);
            if (vals && vals.length >= 3) {
                return ColorMath.rgbToHex(parseInt(vals[0]), parseInt(vals[1]), parseInt(vals[2]));
            }
        }
        return '#000000'; // Default
    }

    // --- WCAG Contrast ---

    static getLuminance(r, g, b) {
        const a = [r, g, b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    static getContrastRatio(hex1, hex2) {
        const rgb1 = ColorMath.hexToRgb(hex1);
        const rgb2 = ColorMath.hexToRgb(hex2);
        if (!rgb1 || !rgb2) return 1;

        const lum1 = ColorMath.getLuminance(rgb1.r, rgb1.g, rgb1.b);
        const lum2 = ColorMath.getLuminance(rgb2.r, rgb2.g, rgb2.b);
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
    }

    static getWCAGGrade(ratio) {
        if (ratio >= 7) return 'AAA';
        if (ratio >= 4.5) return 'AA';
        if (ratio >= 3) return 'AA Large';
        return 'Fail';
    }

    // --- Information ---

    static getReadableValues(hex) {
        const rgb = ColorMath.hexToRgb(hex);
        if (!rgb) return null;
        const hsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);
        return {
            hex: hex.toUpperCase(),
            rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
            hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
            css: `color: ${hex};`
        };
    }
}

export class PaletteGen {
    static generate(hex, type = 'monochromatic') {
        const rgb = ColorMath.hexToRgb(hex);
        if (!rgb) return [];
        const hsl = ColorMath.rgbToHsl(rgb.r, rgb.g, rgb.b);

        // Helper to convert back
        const toHex = (h, s, l) => {
            // Normailize hue
            h = h % 360;
            if (h < 0) h += 360;
            const res = ColorMath.hslToRgb(h, s, l);
            return ColorMath.rgbToHex(res.r, res.g, res.b);
        };

        const palette = [];

        switch (type) {
            case 'monochromatic':
                // Variations in lightness
                palette.push(toHex(hsl.h, hsl.s, Math.max(0, hsl.l - 30)));
                palette.push(toHex(hsl.h, hsl.s, Math.max(0, hsl.l - 15)));
                palette.push(hex);
                palette.push(toHex(hsl.h, hsl.s, Math.min(100, hsl.l + 15)));
                palette.push(toHex(hsl.h, hsl.s, Math.min(100, hsl.l + 30)));
                break;

            case 'analogous':
                // Variations in hue neighbors
                palette.push(toHex(hsl.h - 30, hsl.s, hsl.l));
                palette.push(toHex(hsl.h - 15, hsl.s, hsl.l));
                palette.push(hex);
                palette.push(toHex(hsl.h + 15, hsl.s, hsl.l));
                palette.push(toHex(hsl.h + 30, hsl.s, hsl.l));
                break;

            case 'complementary':
                palette.push(hex);
                palette.push(toHex(hsl.h + 180, hsl.s, hsl.l));
                // Split complementary
                palette.push(toHex(hsl.h + 150, hsl.s, hsl.l));
                palette.push(toHex(hsl.h + 210, hsl.s, hsl.l));
                break;
        }

        return palette;
    }
}
