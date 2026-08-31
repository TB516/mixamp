import { css } from "@gtkx/css";
import * as Gtk from "@gtkx/gi/gtk";
import { GtkAdjustment, GtkBox, GtkLabel, GtkScale } from "@gtkx/jsx/gtk";
import { useEffect, useMemo, useRef } from "react";

/** Crossfade range and output interval used by the slider. */
const sliderSettings = {
  minValue: -1,
  maxValue: 1,
  step: 0.1,
} as const;

/** Rounds away floating-point noise after snapping to the output interval. */
const normalizeValue = (value: number) => {
  const clamped = Math.max(sliderSettings.minValue, Math.min(sliderSettings.maxValue, value));
  const snapped = Math.round(clamped / sliderSettings.step) * sliderSettings.step;

  return Math.round(snapped * 100) / 100;
};

/** Synchronizes the native adjustment with a controlled crossfade value. */
const syncAdjustment = (adjustment: Gtk.Adjustment | null, value: number) => {
  if (!adjustment) {
    return;
  }

  const next = normalizeValue(value);
  if (normalizeValue(adjustment.getValue()) === next) {
    return;
  }

  adjustment.setValue(next);
};

/** A small, scoped style for the rail that shows the two output destinations. */
const balanceScaleClass = css({
  "& trough": {
    background: "linear-gradient(to right, #62a0ea 0%, #9a8bdf 50%, #e78ac3 100%)",
    borderRadius: "4px",
    minHeight: "8px",
  },
  "& trough fill": {
    background: "transparent",
  },
  "& trough highlight": {
    background: "transparent",
  },
});

/** Values and labels used by the native balance slider. */
type BalanceSliderProps = {
  /** Current crossfade from -1 for Game to 1 for Voice. */
  readonly value: number;
  /** Changes when an optimistic thumb position should be reset. */
  readonly resetToken: object | null;
  /** Applies a new crossfade chosen by the user. */
  readonly onChange: (value: number) => void;
};

/** Native Adwaita balance slider with output-level feedback. */
export const BalanceSlider = ({ value, resetToken, onChange }: BalanceSliderProps) => {
  const adjustmentRef = useRef<Gtk.Adjustment | null>(null);
  const gameLevel = Math.round((1 - value) * 50);
  const voiceLevel = 100 - gameLevel;

  const adjustment = useMemo(
    () => (
      <GtkAdjustment
        ref={adjustmentRef}
        lower={sliderSettings.minValue}
        upper={sliderSettings.maxValue}
        value={value}
        stepIncrement={sliderSettings.step}
        pageIncrement={sliderSettings.step}
        pageSize={0}
      />
    ),
    [],
  );

  useEffect(() => {
    syncAdjustment(adjustmentRef.current, value);
  }, [value]);

  useEffect(() => {
    if (!resetToken) {
      return;
    }

    syncAdjustment(adjustmentRef.current, value);
  }, [resetToken, value]);

  return (
    <GtkBox orientation={Gtk.Orientation.VERTICAL} spacing={12} widthRequest={500} hexpand>
      <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={16} hexpand>
        <GtkBox orientation={Gtk.Orientation.VERTICAL} spacing={2} hexpand>
          <GtkLabel xalign={0} cssClasses={["heading"]}>
            Game
          </GtkLabel>
          <GtkLabel xalign={0} cssClasses={["title-2"]}>{`${gameLevel}%`}</GtkLabel>
        </GtkBox>
        <GtkBox orientation={Gtk.Orientation.VERTICAL} spacing={2} hexpand>
          <GtkLabel xalign={1} cssClasses={["heading"]}>
            Voice
          </GtkLabel>
          <GtkLabel xalign={1} cssClasses={["title-2"]}>{`${voiceLevel}%`}</GtkLabel>
        </GtkBox>
      </GtkBox>

      <GtkScale
        orientation={Gtk.Orientation.HORIZONTAL}
        adjustment={adjustment}
        drawValue={false}
        hasOrigin={false}
        hexpand
        cssClasses={[balanceScaleClass]}
        accessibleLabel="Game and Voice balance"
        accessibleDescription="Move left for Game and right for Voice"
        tooltipText="Move between Game and Voice"
        onChangeValue={(_, nextValue, self) => {
          const next = normalizeValue(nextValue);
          if (normalizeValue(self.getValue()) === next) {
            return true;
          }

          self.setValue(next);
          return true;
        }}
        onValueChanged={(self) => {
          const next = normalizeValue(self.getValue());
          if (next === normalizeValue(value)) {
            return;
          }

          onChange(next);
        }}
      />
    </GtkBox>
  );
};
