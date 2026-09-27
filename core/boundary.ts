import path from "node:path";
import fs from "node:fs";

export class Boundary {
  readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  /** Resolve p inside the project; throws on traversal/symlink escape. */
  resolve(p: string): string {
    const abs = path.resolve(this.root, p);
    if (abs !== this.root && !abs.startsWith(this.root + path.sep)) {
      throw new Error(`Path escapes project boundary: ${p}`);
    }
    return abs;
  }

  /** Verify no symlink component escapes the root. */
  verifyNoSymlinkEscape(p: string): void {
    let cur = this.resolve(p);
    while (cur.startsWith(this.root)) {
      const stat = fs.lstatSync(cur, { throwIfNoEntry: false });
      if (stat?.isSymbolicLink()) {
        const target = fs.realpathSync(cur);
        if (!target.startsWith(this.root)) {
          throw new Error(`Symlink escape at ${cur}`);
        }
      }
      if (cur === this.root) break;
      cur = path.dirname(cur);
    }
  }
}
