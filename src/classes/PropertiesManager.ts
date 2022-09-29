import fs from "fs";


export default class PropertiesManager extends Map<string, string | undefined> {
  filename: string;
  data: string;

  private commentCount = 0;

  constructor(filename: string) {
    super();
    this.filename = filename;
    this.data = this.readSync();
    this.parse()
  }

  protected readSync() {
    return fs.readFileSync(this.filename, { encoding: "utf8" });
  }

  protected parse() {
    const { data } = this;

    const lines = data.split("\n");


    for (let line of lines) {
      line = line.trimStart();
      if (line.endsWith("\r")) line = line.substring(0, line.length - 1);
      if (line.startsWith("#")) {
        this.setComment(line.substring(1));
        continue;
      }

      const keyValue = line.split("=");

      const key = keyValue.at(0);
      if (!key) continue;
      const value = keyValue.slice(1).join("") || undefined;


      this.set(key, value);
    }
  }
  setComment(comment: string) {
    this.set(`#comment_${this.commentCount}`, comment);
    this.commentCount++;
  }

  toString() {
    return Array.from(this.entries()).map(([key, value]) => {
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      if (key.startsWith("#comment_")) return "#" + value;

      return `${key}=${value ? value.replaceAll("=", "\\=") : ""}`
    }).join("\n");
  }
  writeSync() {
    fs.writeFileSync(this.filename, this.toString(), { encoding: "utf8" })
  }
}