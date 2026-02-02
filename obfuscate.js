const JavaScriptObfuscator = require("javascript-obfuscator");
const fs = require("fs");
const path = require("path");

const buildDir = path.join(__dirname, "build", "static", "js");

fs.readdir(buildDir, (err, files) => {
  if (err) {
    console.error("Error reading build directory:", err);
    return;
  }

  files.forEach((file) => {
    if (file.endsWith(".js") && !file.endsWith(".map")) {
      const filePath = path.join(buildDir, file);
      const code = fs.readFileSync(filePath, "utf8");

      const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: false,
        disableConsoleOutput: true,
        rotateStringArray: true,
        selfDefending: true,
        stringArray: true,
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false,
      });

      fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
      console.log(`Obfuscated: ${file}`);
    }
  });

  console.log("Obfuscation complete!");
});
