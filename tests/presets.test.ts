import { describe, expect, it } from "vitest";
import {
  PRESETS,
  playError,
  playHover,
  playNotification,
  playSuccess,
  playTick,
  playWarning,
} from "../src/presets";

describe("presets", () => {
  describe("PRESETS object", () => {
    it("should have all 6 presets defined", () => {
      expect(Object.keys(PRESETS)).toHaveLength(6);
      expect(PRESETS.tick).toBeDefined();
      expect(PRESETS.success).toBeDefined();
      expect(PRESETS.error).toBeDefined();
      expect(PRESETS.hover).toBeDefined();
      expect(PRESETS.warning).toBeDefined();
      expect(PRESETS.notification).toBeDefined();
    });

    it("tick preset should have correct shape", () => {
      expect(PRESETS.tick.type).toBe("sine");
      expect(PRESETS.tick.frequency).toBe(800);
      expect(PRESETS.tick.duration).toBe(50);
      expect(PRESETS.tick.gain).toBe(0.3);
    });

    it("success preset should have frequency sweep", () => {
      expect(PRESETS.success.type).toBe("sine");
      expect(PRESETS.success.frequency).toBe(520);
      expect(PRESETS.success.endFrequency).toBe(780);
      expect(PRESETS.success.duration).toBe(150);
    });

    it("error preset should use square wave", () => {
      expect(PRESETS.error.type).toBe("square");
      expect(PRESETS.error.frequency).toBe(200);
      expect(PRESETS.error.duration).toBe(200);
    });

    it("hover preset should be short and quiet", () => {
      expect(PRESETS.hover.duration).toBeLessThanOrEqual(50);
      expect(PRESETS.hover.gain).toBeLessThanOrEqual(0.2);
    });

    it("warning preset should use triangle wave", () => {
      expect(PRESETS.warning.type).toBe("triangle");
    });

    it("notification preset should have upward sweep", () => {
      const endFreq = PRESETS.notification.endFrequency;
      expect(endFreq).toBeDefined();
      expect(endFreq as number).toBeGreaterThan(PRESETS.notification.frequency);
    });

    it("all presets should have positive frequency", () => {
      for (const [name, preset] of Object.entries(PRESETS)) {
        expect(preset.frequency, `${name} frequency`).toBeGreaterThan(0);
      }
    });

    it("all presets should have positive duration", () => {
      for (const [name, preset] of Object.entries(PRESETS)) {
        expect(preset.duration, `${name} duration`).toBeGreaterThan(0);
      }
    });

    it("all presets should have valid oscillator type", () => {
      const validTypes = ["sine", "square", "triangle", "sawtooth"];
      for (const [name, preset] of Object.entries(PRESETS)) {
        expect(validTypes, `${name} type`).toContain(preset.type);
      }
    });
  });

  describe("preset getter functions", () => {
    it("playTick returns tick preset", () => {
      expect(playTick()).toEqual(PRESETS.tick);
    });

    it("playSuccess returns success preset", () => {
      expect(playSuccess()).toEqual(PRESETS.success);
    });

    it("playError returns error preset", () => {
      expect(playError()).toEqual(PRESETS.error);
    });

    it("playHover returns hover preset", () => {
      expect(playHover()).toEqual(PRESETS.hover);
    });

    it("playWarning returns warning preset", () => {
      expect(playWarning()).toEqual(PRESETS.warning);
    });

    it("playNotification returns notification preset", () => {
      expect(playNotification()).toEqual(PRESETS.notification);
    });
  });
});
