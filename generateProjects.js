// generateProjects.js
const fs = require("fs");
const path = require("path");

const dir = ".\\public\\GLTF";
const files = fs.readdirSync(dir);

const projects = files
  .filter(f => f.endsWith(".gltf") || f.endsWith(".glb"))
  .map(f => {
    const stats = fs.statSync(path.join(dir, f));
    return {
      name: path.basename(f, path.extname(f)), // nombre sin extensión
      path: `${dir}/${f}`,
      type: "Craneal", // o lo que quieras
      date: stats.mtime.toLocaleDateString() // fecha última modificación
    };
  });

fs.writeFileSync("projects.json", JSON.stringify(projects, null, 2));
console.log("✅ projects.json generado!");
