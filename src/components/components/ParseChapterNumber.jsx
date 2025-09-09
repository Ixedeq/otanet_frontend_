export default function parseChapterNumber(chapterParam) {
  const raw = chapterParam.replace(/^chapter-/, "");
  const parts = raw.split("-");

  let result = parts[0] || "";

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (!isNaN(part)) {
      // If both current result and next part are numbers, join with "."
      if (!isNaN(result.toString().split(" ").pop())) {
        result += "." + part;
      } else {
        result += " " + part;
      }
    } else {
      // Non-numeric parts → join with space
      result += " " + part;
    }
  }

  return result;
}