/**
 * Color Utilities
 * Handles conversions between HEX, RGB, and HSL
 */

const ColorUtils = {
    hexToRgb: (hex) => {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, (m, r, g, b) => {
            return r + r + g + g + b + b;
        });

        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    rgbToHex: (r, g, b) => {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    },

    rgbToHsl: (r, g, b) => {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
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

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    },

    hslToType: (h, s, l) => {
        return `hsl(${h}, ${s}%, ${l}%)`;
    },

    rgbToType: (r, g, b) => {
        return `rgb(${r}, ${g}, ${b})`;
    },

    // Helper to convert any common color string to HEX
    anyToHex: (color) => {
        if (!color) return null;
        color = color.trim();

        // Hex
        if (color.startsWith('#')) return color;

        // RGB/RGBA
        if (color.startsWith('rgb')) {
            const sep = color.indexOf(',') > -1 ? ',' : ' ';
            // Extract numbers
            const parts = color.substring(color.indexOf('(') + 1, color.indexOf(')')).split(sep);
            const r = parseInt(parts[0]);
            const g = parseInt(parts[1]);
            const b = parseInt(parts[2]);
            return ColorUtils.rgbToHex(r, g, b);
        }

        return color; // Fallback or named color (not supported yet)
    },

    // Helper to get formatted strings for all types from ANY input
    getAllFormats: (input) => {
        const hex = ColorUtils.anyToHex(input);
        if (!hex) return null;

        const rgb = ColorUtils.hexToRgb(hex);
        if (!rgb) return null;
        const hsl = ColorUtils.rgbToHsl(rgb.r, rgb.g, rgb.b);

        return {
            hex: hex.toUpperCase(),
            rgb: ColorUtils.rgbToType(rgb.r, rgb.g, rgb.b),
            hsl: ColorUtils.hslToType(hsl.h, hsl.s, hsl.l),
            raw: { rgb, hsl }
        };
    },

    // Helper for spectrum canvas to hsv/hsl
    hsvToRgb: (h, s, v) => {
        let r, g, b, i, f, p, q, t;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
};
