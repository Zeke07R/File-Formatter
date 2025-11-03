// aimodel.js
let models = {};

export async function loadModel(name = "pillows") {
  if (!models[name]) {
    // ✅ Use absolute URL for GitHub Pages
    const basePath = `https://zeke07r.github.io/File-Formatter/models/${name}/`;
    models[name] = await tmImage.load(basePath + "model.json", basePath + "metadata.json");
    console.log(`✅ Loaded model: ${name}`);
  }
  return models[name];
}

export async function classifyImage(modelName, file) {
  const model = await loadModel(modelName);
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  await new Promise(res => (img.onload = res));

  const preds = await model.predict(img);
  preds.sort((a, b) => b.probability - a.probability);
  const best = preds[0];
  const angle = best.className.charAt(0).toUpperCase() + best.className.slice(1);
  const confidence = (best.probability * 100).toFixed(1);
  return { angle, confidence };
}
