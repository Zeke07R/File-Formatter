let models = {};

// Base URL for your GitHub Pages site
// Replace USERNAME and REPO with your GitHub username and repo name
const BASE_URL = "https://zeke07r.github.io/File-Formatter/models/";

export async function loadModel(name = "pillows") {
  if (!models[name]) {
    const modelPath = `${BASE_URL}${name}/model.json`;
    const metadataPath = `${BASE_URL}${name}/metadata.json`;

    try {
      models[name] = await tmImage.load(modelPath, metadataPath);
      console.log(`✅ Loaded model: ${name}`);
    } catch (err) {
      console.error(`❌ Failed to load model '${name}'`, err);
      throw err;
    }
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
