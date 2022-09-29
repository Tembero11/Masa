import assert from "assert";
import chalk from "chalk";

export default class ProgressBar {
  value;
  max;

  get percentage() {
    return this.value / this.max;
  }

  showProgress;

  protected width;
  constructor(value = 0, max = 100, showProgress = true, width = 50) {
    this.value = value;
    this.max = max;
    this.width = width;
    this.showProgress = showProgress;
  }

  increment(amount?: number) {
    this.set(this.value + (amount || 1));
  }
  set(value: number) {
    if (value > this.max) {
      this.value = this.max;
    }else {
      this.value = value;
    }
  }
  done() {
    this.value = this.max;
  }

  toString() {
    const progress = new Array(Math.floor(this.percentage * this.width)).fill(" ").join("");
    const progressLeft = new Array(Math.round((1 - this.percentage) * this.width)).fill("░").join("");
    const components = [
      chalk.white("|"),
      chalk.bgGreen(progress),
      progressLeft,
      chalk.white("|"),
      this.showProgress ? " " + Math.round(this.percentage * 100).toString() + "%" : ""
    ];
    return components.join("");
  }
}