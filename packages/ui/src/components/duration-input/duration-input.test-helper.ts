import { fireEvent, screen } from "@testing-library/react";

/** Exercises both selectors through their accessible keyboard controls. */
export function fillDurationInput(
  hoursLabel: RegExp,
  minutesLabel: string,
  hours: string,
  minutes: string,
) {
  const hourPart = screen.getByRole("spinbutton", { name: hoursLabel });
  const minutePart = screen.getByRole("spinbutton", { name: minutesLabel });
  fireEvent.keyDown(minutePart, { key: "Home" });
  fireEvent.keyDown(hourPart, { key: "Home" });
  for (let step = 0; step < Number(hours); step++)
    fireEvent.keyDown(hourPart, { key: "ArrowUp" });
  for (let step = 0; step < Number(minutes) / 15; step++)
    fireEvent.keyDown(minutePart, { key: "ArrowUp" });
}
